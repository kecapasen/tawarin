import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// --- CONFIGURATION ---
const app = express();
const PORT = process.env.PORT || 3001;

// Konfigurasi CORS: Izinkan akses dari Frontend (Localhost & VPS)
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- DATABASE & AI CLIENTS ---
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const client = new OpenAI({
  apiKey: process.env.KOLOSAL_API_KEY,
  baseURL: "https://api.kolosal.ai/v1",
});

const KOLOSAL_MODEL = "Claude Sonnet 4.5"; 

// ==========================================
// 1. AUTHENTICATION MODULE
// ==========================================

app.post("/auth/register", async (req, res) => {
  const { name, email, password, phone, gender, birthdate, address } = req.body;
  
  // Cek email duplikat
  const { data: existingUser } = await supabase.from('users').select('email').eq('email', email).single();
  if (existingUser) return res.status(400).json({ error: "Email sudah terdaftar!" });

  const newAddress = [{ id: Date.now(), label: "Rumah", recipient: name, phone: phone, street: address, city: "Jakarta" }];
  
  // Buat user baru
  const { data, error } = await supabase.from('users').insert([{ 
    email, name, password, phone, gender, birthdate, addresses: newAddress, 
    image: `https://api.dicebear.com/9.x/initials/svg?seed=${name}`, role: "user", isComplete: true 
  }]).select().single();

  if (error) return res.status(500).json({ error: "Gagal daftar user baru" });
  res.json({ success: true, user: data });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
  
  if (error || !user) return res.status(401).json({ error: "Email tidak ditemukan" });
  if (user.password !== password) return res.status(401).json({ error: "Password salah!" });
  
  res.json(user);
});

// ==========================================
// 2. USER MANAGEMENT MODULE
// ==========================================

app.post("/user/check", async (req, res) => {
  const { email, name, image } = req.body;
  let { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
  
  // Jika user dari Google belum ada di DB, buat baru
  if (!user) {
    const newUser = { email, name, image, isComplete: false };
    const { data: createdUser } = await supabase.from('users').upsert(newUser, { onConflict: 'email' }).select().single();
    user = createdUser;
  } else {
    // Update data jika ada perubahan dari provider login
    if (image && user.image !== image) {
      const { data: updatedUser } = await supabase.from('users').update({ image, name, updated_at: new Date() }).eq('email', email).select().single();
      if (updatedUser) user = updatedUser;
    }
  }
  res.json(user);
});

app.get("/user/:email", async (req, res) => {
  const { data } = await supabase.from('users').select('*').eq('email', req.params.email).single();
  res.json(data || {});
});

app.post("/user/update", async (req, res) => {
  const { email, ...updates } = req.body;
  const { data: updatedUser, error } = await supabase.from('users').upsert({ email, ...updates, isComplete: true, updated_at: new Date() }, { onConflict: 'email' }).select().single();
  
  if (error) return res.status(500).json({ error: "Gagal update profile" });
  res.json({ status: "success", user: updatedUser });
});

// ==========================================
// 3. STORE & PRODUCT MODULE
// ==========================================

app.get("/store/check/:email", async (req, res) => {
  const { data: user } = await supabase.from('users').select('id').eq('email', req.params.email).single();
  if (!user) return res.json(null);
  
  const { data: store } = await supabase.from('stores').select('*').eq('owner_id', user.id).single();
  res.json(store); 
});

app.post("/store/create", async (req, res) => {
  const { email, name, domain, location, image } = req.body;
  const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
  
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

  const { data, error } = await supabase.from('stores').insert([{
    owner_id: user.id, name, domain, location, image_url: image || "https://via.placeholder.com/150"
  }]).select().single();

  if (error) return res.status(500).json({ error: error.message });
  
  // Upgrade role user jadi seller
  await supabase.from('users').update({ role: 'seller' }).eq('id', user.id);
  res.json({ success: true, store: data });
});

app.post("/seller/product", async (req, res) => {
  const { name, price, min_price, description, image, seller_email, category } = req.body;
  
  const { data: user } = await supabase.from('users').select('id').eq('email', seller_email).single();
  if (!user) return res.status(404).json({ error: "Seller tidak ditemukan" });

  const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single();
  if (!store) return res.status(400).json({ error: "Anda belum memiliki toko" });

  const { data, error } = await supabase.from('products').insert([{
    store_id: store.id, name, price: parseInt(price), min_price: parseInt(min_price), description, image_url: image, category: category || "Lainnya"
  }]).select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.delete("/seller/product/:id", async (req, res) => {
  const { error } = await supabase.from('products').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: "Gagal menghapus produk" });
  res.json({ success: true });
});

app.get("/seller/products/:email", async (req, res) => {
  const { data: user } = await supabase.from('users').select('id').eq('email', req.params.email).single();
  if (!user) return res.json([]);
  
  const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single();
  if (!store) return res.json([]);
  
  const { data } = await supabase.from('products').select('*').eq('store_id', store.id);
  res.json(data || []);
});

app.get("/products", async (req, res) => {
  const { search } = req.query;
  let query = supabase.from('products')
    .select(`id, name, price, description, category, image_url, stores ( name, location )`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "Gagal mengambil produk" });
  
  const flatData = data.map((p: any) => ({
    ...p, image: p.image_url, shopName: p.stores?.name, location: p.stores?.location
  }));
  res.json(flatData);
});

app.get("/product/:id", async (req, res) => {
    const { id } = req.params;
    let { data: product, error } = await supabase
      .from('products')
      .select(`id, name, price, description, category, image_url, min_price, stores ( id, name, location, image_url, owner_id )`)
      .eq('id', id)
      .single();

    if (error || !product) return res.status(404).json({ error: "Produk tidak ditemukan" });

    let seller_email = "";
    // @ts-ignore
    if (product.stores?.owner_id) {
        // @ts-ignore
        const { data: owner } = await supabase.from('users').select('email').eq('id', product.stores.owner_id).single();
        seller_email = owner?.email || "";
    }

    const { min_price, stores, ...rest } = product as any;
    res.json({
        ...rest, 
        image: product.image_url, 
        shopName: stores?.name, 
        shopLocation: stores?.location,
        shopAvatar: stores?.image_url, 
        store_id: stores?.id, 
        seller_email
    });
});

// ==========================================
// 4. TRANSACTION MODULE
// ==========================================

app.post("/transaction/create", async (req, res) => {
  const { email, product_name, product_image, price, seller_email } = req.body;
  
  const { data: buyer } = await supabase.from('users').select('id').eq('email', email).single();
  const { data: seller } = await supabase.from('users').select('id').eq('email', seller_email).single();
  
  if (!buyer || !seller) return res.status(404).json({ error: "User tidak valid" });

  const { data: store } = await supabase.from('stores').select('id').eq('owner_id', seller.id).single();
  if (!store) return res.status(404).json({ error: "Toko tidak ditemukan" });
  
  const { data: product } = await supabase.from('products').select('id').eq('name', product_name).limit(1).single();
  const productId = product ? product.id : null;

  if (!productId) return res.status(400).json({ error: "Produk tidak valid" });

  const { data, error } = await supabase.from('transactions').insert([{ 
      buyer_id: buyer.id, 
      store_id: store.id, 
      product_id: productId,
      price: price, 
      status: "Lunas" 
  }]).select();

  if (error) {
    console.error("Transaction Error:", error);
    return res.status(500).json({ error: "Gagal mencatat transaksi" });
  }
  res.json({ success: true, data });
});

app.get("/transactions/:email", async (req, res) => {
  const { email } = req.params;
  
  const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
  if (!user) return res.json([]);

  const { data, error } = await supabase
    .from('transactions')
    .select(`id, price, status, created_at, products (name, image_url)`)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: "Gagal mengambil riwayat transaksi" });

  const formatted = data.map((t: any) => ({
    id: t.id,
    product_name: t.products?.name || "Produk Dihapus",
    product_image: t.products?.image_url || "https://via.placeholder.com/150",
    price: t.price,
    status: t.status,
    created_at: t.created_at
  }));

  res.json(formatted);
});

app.get("/seller/orders/:email", async (req, res) => {
    const { data: user } = await supabase.from('users').select('id').eq('email', req.params.email).single();
    if (!user) return res.json([]);
    
    const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single();
    if (!store) return res.json([]);

    const { data } = await supabase
        .from('transactions')
        .select(`id, price, status, created_at, users(email), products(name)`)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

    const formatted = (data || []).map((t: any) => {
        const userEmail = Array.isArray(t.users) ? t.users[0]?.email : t.users?.email;
        const productName = Array.isArray(t.products) ? t.products[0]?.name : t.products?.name;
        return { 
            id: t.id, 
            user_email: userEmail || "Unknown", 
            product_name: productName || "Unknown Product", 
            price: t.price, 
            status: t.status, 
            created_at: t.created_at 
        };
    });
    res.json(formatted);
});

app.get("/admin/transactions", async (req, res) => {
  const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

// ==========================================
// 5. CHAT & AI NEGOTIATOR MODULE
// ==========================================

app.get("/chat/inbox/:email", async (req, res) => {
  const { data, error } = await supabase.from('chats')
    .select(`id, product_id, last_message, updated_at, products (name, image_url)`)
    .eq('buyer_email', req.params.email)
    .order('updated_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  
  const formatted = (data || []).map((chat: any) => ({
    id: chat.id, 
    productName: chat.products?.name || "Produk", 
    productImage: chat.products?.image_url || "https://via.placeholder.com/100",
    lastMessage: chat.last_message, 
    time: new Date(chat.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }));
  res.json(formatted);
});

app.get("/chat/history", async (req, res) => {
    const { productId, email } = req.query;
    const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
    if (!user) return res.json([]);
    
    const { data: room } = await supabase.from('chat_rooms')
        .select('id')
        .match({ buyer_id: user.id, product_id: productId })
        .single();
    
    if (!room) return res.json([]);
    
    const { data: messages } = await supabase.from('chat_messages')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true });
    
    const formattedHistory = (messages || []).map((m: any) => ({
        role: m.sender_role === 'buyer' ? 'user' : 'assistant', 
        content: m.content, 
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
    res.json(formattedHistory);
});

app.post("/chat", async (req, res) => {
  try {
    const { productId, message, history, userEmail } = req.body;
    let { data: product, error: prodError } = await supabase.from('products').select(`*, stores(owner_id)`).eq('id', productId).single();
    if (prodError || !product) return res.status(404).json({ error: "Produk tidak ditemukan" });

    const min_price = product.min_price || 0; 
    const display_price = product.price;
    
    // --- PROMPT AI NEGOSIATOR ---
    const systemPrompt = `
      PERAN: Kamu adalah 'Mang Asep', pedagang pasar legendaris yang ramah, sedikit kocak, tapi jago berhitung.
      
      KONTEKS BARANG:
      - Nama: ${product.name}
      - Harga Jual: Rp ${display_price.toLocaleString("id-ID")}
      - Harga Modal (RAHASIA): Rp ${min_price.toLocaleString("id-ID")} (Jangan pernah sebut angka ini!)

      LOGIKA NEGOSIASI:
      1. DEAL: Jika tawaran pembeli >= Harga Modal, balas: "DEAL_ACCEPTED [Pesan konfirmasi yang asik]".
      2. TOLAK: Jika tawaran < Harga Modal, tolak dengan sopan dan bercanda. Contoh: "Waduh bos, belum dapet segitu mah, buat beli bensin aja kurang."
      3. TAWAR BALIK: Jika tawaran masih jauh dari Harga Jual tapi di atas Modal, coba tawar balik sedikit di bawah Harga Jual biar untung gede.
      4. NETT: Jika ditanya harga pas, kasih diskon 5% dari Harga Jual.

      GAYA BAHASA:
      - Bahasa Indonesia gaul (bos, gan, siap, waduh).
      - Singkat, padat, dan langsung ke inti.
    `;

    const messages = [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: message }];
    
    const completion = await client.chat.completions.create({ 
        model: KOLOSAL_MODEL, 
        messages: messages as any, 
        temperature: 0.7, 
        max_tokens: 150 
    });
    
    const aiReply = completion.choices[0]?.message?.content || "Sinyal lagi jelek nih bos, ulangi dong.";
    const isDeal = aiReply.includes("DEAL_ACCEPTED");
    const finalReply = aiReply.replace("DEAL_ACCEPTED", "").trim();

    const { data: buyer } = await supabase.from('users').select('id').eq('email', userEmail).single();
    
    // Cari atau Buat Chat Room
    let { data: room } = await supabase.from('chat_rooms').select('id').match({ buyer_id: buyer!.id, product_id: productId }).single();
    if (!room) {
       const { data: newRoom } = await supabase.from('chat_rooms').insert([{ buyer_id: buyer!.id, store_id: product.store_id, product_id: productId }]).select().single();
       room = newRoom;
    }
    
    // Simpan Chat
    if (room) {
      await supabase.from('chat_messages').insert({ room_id: room.id, sender_role: 'buyer', content: message });
      await supabase.from('chat_messages').insert({ room_id: room.id, sender_role: 'system', content: finalReply });
    }
    
    res.json({ reply: finalReply, isDeal });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "AI Server Error" });
  }
});

app.post("/ai/generate-description", async (req, res) => {
  const { productName, condition } = req.body;
  try {
    const prompt = `
        Tugas: Buat deskripsi produk marketplace yang MENJUAL dan MENARIK.
        Produk: ${productName}
        Kondisi: ${condition}
        
        Format:
        - Tanpa basa-basi pembuka/penutup.
        - Gunakan emoji yang relevan.
        - Tonjolkan kelebihan produk.
        - Bahasa persuasif dan santai.
    `;
    
    const completion = await client.chat.completions.create({ 
        model: 'Qwen 3 30BA3B', 
        messages: [{ role: "user", content: prompt }], 
        temperature: 0.8, 
        max_tokens: 300 
    });
    
    res.json({ description: completion.choices[0]?.message?.content || "" });
  } catch (error) { res.status(500).json({ error: "AI Error" }); }
});

app.post("/seller/analyze", async (req, res) => {
  const { email } = req.body;

  try {
    const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const { data: store } = await supabase.from('stores').select('id, name').eq('owner_id', user.id).single();
    if (!store) return res.status(404).json({ error: "Store not found" });

    const { data: transactions } = await supabase.from('transactions').select('product_name, price, created_at').eq('store_id', store.id);
    const { data: products } = await supabase.from('products').select('name, price, sold').eq('store_id', store.id);

    const summary = {
      toko: store.name,
      transaksi: transactions?.length || 0,
      omzet: transactions?.reduce((sum, t) => sum + Number(t.price), 0) || 0,
      produk_terlaris: products?.sort((a, b) => b.sold - a.sold).slice(0, 3).map(p => p.name),
    };

    const prompt = `
      PERAN: Konsultan Bisnis Profesional.
      DATA TOKO: ${JSON.stringify(summary)}
      TUGAS: Berikan 3 strategi singkat untuk meningkatkan penjualan toko ini.
      FORMAT: Poin-poin, bahasa motivasi.
    `;

    const completion = await client.chat.completions.create({
      model: KOLOSAL_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 400,
    });

    res.json({ analysis: completion.choices[0]?.message?.content || "Gagal analisa." });
  } catch (error) { res.status(500).json({ error: "AI Error" }); }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});