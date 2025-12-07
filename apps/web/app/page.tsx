"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import Image from "next/image";

// --- Types ---
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  description: string;
  rating: number;
  sold: number;
  location: string;
  image: string;
  shopName: string;
  discount: number;
  category: string;
}

// --- Supabase Config ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORIES = ["Semua", "Elektronik", "Fashion", "Hobi", "Otomotif", "Rumah Tangga"];

// --- Components ---

const Card3D = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  return (
    <motion.div
      style={{ x, y, rotateX, rotateY, z: 100 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct * 100);
        y.set(yPct * 100);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      onClick={onClick}
      className="perspective-1000 cursor-pointer h-full w-full"
      whileHover={{ scale: 1.02, zIndex: 10 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {children}
    </motion.div>
  );
};

// --- Main Page Component ---

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // 1. Redirect if not logged in
    if (status === "unauthenticated") {
        router.push("/login");
        return;
    }
    
    // 2. Load Cart Count
    const savedCart = localStorage.getItem("tawarin_cart");
    if (savedCart) setCartCount(JSON.parse(savedCart).length);

    // 3. Check User Backend
    if (status === "authenticated" && session?.user?.email) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://18.141.167.37:3001';

      fetch(`${API_URL}/user/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: session.user.email,
          name: session.user.name,
          image: session.user.image
        })
      })
      .then(res => res.json())
      .then(user => {
        if (!user.isComplete) router.push("/onboarding");
      })
      .catch(err => console.error("Gagal cek user:", err));
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      
      // Fetch from Supabase
      const { data: dbProducts, error } = await supabase
        .from('products')
        .select('id, name, price, description, image_url, category')
        .order('id', { ascending: false });

      if (error) {
        setIsLoading(false);
        return;
      }
      
      const enrichedData: Product[] = (dbProducts || []).map((item: any) => ({
        ...item,
        description: item.description || "",
        originalPrice: item.price * 1.3,
        discount: 30,
        rating: (Math.random() * (5.0 - 4.5) + 4.5).toFixed(1) as unknown as number,
        sold: Math.floor(Math.random() * 500) + 10,
        location: ["Jakarta Barat", "Bandung", "Surabaya", "Medan"][Math.floor(Math.random() * 4)] || "Jakarta",
        shopName: "Official Store",
        category: item.category || "Lainnya",
        image: item.image_url || "https://via.placeholder.com/300"
      }));

      setTimeout(() => {
        setProducts(enrichedData);
        setIsLoading(false);
      }, 500);
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = activeCategory === "Semua" ? true : p.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, activeCategory]);

  const addToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const savedCart = localStorage.getItem("tawarin_cart");
    const cart = savedCart ? JSON.parse(savedCart) : [];
    cart.push(product);
    localStorage.setItem("tawarin_cart", JSON.stringify(cart));
    setCartCount(cart.length);
    toast.success("Masuk keranjang! 🛒");
  };

  const ProductSkeleton = () => (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 h-full">
      <div className="pt-[100%] bg-gray-200 animate-pulse relative"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded-xl w-full animate-pulse mt-2"></div>
      </div>
    </div>
  );

  if (status === "loading") return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-800">
      
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm transition-all duration-300">
        <div className="max-w-7xl w-full mx-auto px-4 h-20 flex items-center justify-between gap-4 md:gap-8">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="bg-gradient-to-br from-green-500 to-emerald-700 text-white font-black text-xl p-2 rounded-xl shadow-lg shadow-green-200"
            >
              T
            </motion.div>
            <span className="text-xl font-black tracking-tight text-gray-800 group-hover:text-green-600 transition hidden md:block">TawarIn.</span>
          </Link>

          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-1 max-w-2xl relative group"
          >
            <input 
              type="text" 
              className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-full pl-12 pr-4 py-3 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all duration-300 shadow-inner"
              placeholder="Cari barang impianmu..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-3 text-gray-400 group-focus-within:text-green-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </motion.div>

          <div className="flex items-center gap-4 shrink-0">
            <Link href="/cart" className="relative group p-2">
               <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-600 group-hover:text-green-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
               </motion.div>
               <AnimatePresence>
                 {cartCount > 0 && (
                   <motion.span 
                     initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                     className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm"
                   >
                     {cartCount}
                   </motion.span>
                 )}
               </AnimatePresence>
            </Link>

            <Link href="/profile">
               <motion.div whileHover={{ scale: 1.1 }} className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md cursor-pointer ring-2 ring-transparent hover:ring-green-500 transition">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={session?.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} className="w-full h-full object-cover" alt="User" />
               </motion.div>
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-100 bg-white/60 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 flex gap-3 overflow-x-auto no-scrollbar py-3">
            {CATEGORIES.map((cat, i) => (
              <motion.button 
                key={cat}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeCategory === cat ? 'bg-black text-white shadow-lg shadow-black/20 scale-105' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 pb-32">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full min-h-[320px] bg-gradient-to-br from-[#00AA5B] to-[#008f4c] rounded-[2.5rem] p-8 md:p-12 mb-12 relative overflow-hidden flex flex-col justify-center shadow-2xl shadow-green-500/30 group"
        >
           <div className="relative z-10 text-white max-w-2xl space-y-6">
             <motion.div 
               initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
               className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-white/30 w-fit"
             >
                 🔥 Hackathon Special
             </motion.div>
             <h1 className="text-4xl md:text-6xl font-black leading-tight drop-shadow-lg">
               Nego Sampai Deal,<br/>Tanpa Basa-basi.
             </h1>
             <p className="text-green-50 text-lg font-medium opacity-90 max-w-lg leading-relaxed">
               Platform jual beli pertama dengan AI Negotiator yang bikin harga cocok buat semua. Gak perlu drama, langsung bungkus!
             </p>
             <motion.button 
               whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
               className="bg-white text-green-700 font-bold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition w-fit"
             >
               Mulai Belanja
             </motion.button>
           </div>
           
           <div className="absolute right-0 top-0 bottom-0 w-full md:w-2/3 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
           <motion.div 
             animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }} 
             transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
             className="absolute -right-20 -top-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
           ></motion.div>
           <div className="absolute -right-20 -bottom-40 w-96 h-96 bg-yellow-300/30 rounded-full blur-[100px] animate-pulse"></div>
        </motion.div>

        <div className="flex items-center justify-between mb-8 px-2">
           <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
             🔥 Paling Dicari
           </h2>
           <span className="text-sm font-bold text-green-600 cursor-pointer hover:underline bg-green-50 px-3 py-1 rounded-full">Lihat Semua</span>
        </div>

        {isLoading ? (
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
             {Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)}
           </div>
        ) : filteredProducts.length === 0 ? (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-white rounded-3xl border border-gray-100 shadow-sm">
             <div className="text-6xl mb-4">📦</div>
             <h3 className="text-2xl font-bold text-gray-800 mb-2">Barang tidak ditemukan</h3>
             <p className="text-gray-500 mb-6">Coba kata kunci lain atau reset filter.</p>
             <button onClick={() => {setSearchQuery(""); setActiveCategory("Semua")}} className="text-white bg-green-600 px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition">Reset Filter</button>
           </motion.div>
        ) : (
           <motion.div layout className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
             <AnimatePresence>
               {filteredProducts.map((product) => (
                 <Card3D key={product.id} onClick={() => router.push(`/product/${product.id}`)}>
                    <div className="bg-white h-full rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative group hover:shadow-xl transition-all duration-300">
                        <div className="relative pt-[110%] bg-gray-50 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-black text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                            {product.category}
                          </div>
                          {product.discount > 0 && (
                            <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-red-200 shadow-lg">
                              -{product.discount}%
                            </div>
                          )}
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-relaxed mb-1 group-hover:text-green-600 transition">{product.name}</h3>
                          <div className="mt-auto">
                            <p className="text-lg font-black text-gray-900">Rp {product.price.toLocaleString("id-ID")}</p>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs text-gray-400 line-through">Rp {product.originalPrice.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                               <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                                 <span className="text-yellow-400">★</span> {product.rating} | {product.sold} trj
                               </div>
                               <motion.button whileTap={{ scale: 0.8 }} onClick={(e) => addToCart(e, product)} className="bg-gray-900 text-white p-2 rounded-full hover:bg-green-600 transition shadow-lg">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                               </motion.button>
                            </div>
                          </div>
                        </div>
                    </div>
                 </Card3D>
               ))}
             </AnimatePresence>
           </motion.div>
        )}
      </main>
    </div>
  );
}
