"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useSession } from "next-auth/react";

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  rating: number;
  sold: number;
  location: string;
  shopName: string;
  shopAvatar: string;
  condition: string;
  weight: string;
  seller_email: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  time: string;
}

type ProductResponse = Product & { error?: string };

// ANIMASI
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const modalVariants: Variants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 300 } },
  exit: { y: "100%", opacity: 0, transition: { duration: 0.3 } }
};

const messageVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } }
};

const PLACEHOLDER_IMG = "https://via.placeholder.com/500?text=No+Image";
const STORE_AVATAR_DEFAULT = "https://api.dicebear.com/9.x/initials/svg?seed=Store";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isDeal, setIsDeal] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // FETCH DATA
  useEffect(() => {
    if (params.id) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/product/${params.id}`)
        .then(res => res.json())
        .then((data: ProductResponse) => {
          if (data && !data.error) {
            setProduct({
              ...data,
              seller_email: data.seller_email,
              // JURUS PAMUNGKAS GAMBAR:
              image: data.image || PLACEHOLDER_IMG, 
              rating: 4.8,
              sold: 1240,
              location: data.location || "Jakarta Pusat",
              shopName: data.shopName || "Official Store",
              shopAvatar: data.shopAvatar || STORE_AVATAR_DEFAULT,
              condition: "Baru",
              weight: "1 Kg"
            });
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [params.id]);

  // LOAD CHAT HISTORY
  useEffect(() => {
    if (isChatOpen && product && session?.user?.email) {
        setChatLoading(true);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/history?productId=${product.id}&email=${session.user.email}`)
            .then(res => res.json())
            .then((data: ChatMessage[]) => {
                setChatHistory(data);
                if (data.length > 0) {
                    const lastMsg = data[data.length - 1]?.content || "";
                    if (lastMsg.includes("DEAL_ACCEPTED")) {
                        setIsDeal(true);
                    }
                }
            })
            .catch(err => console.error(err))
            .finally(() => setChatLoading(false));
    }
  }, [isChatOpen, product, session]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading, isChatOpen]);

  const handleDealBuy = () => {
    if (!product) return;
    router.push(`/success?product=${encodeURIComponent(product.name)}&price=${product.price}&seller=${encodeURIComponent(product.seller_email)}`);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !product) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInputMessage("");
    setChatLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          message: userMsg.content,
          history: chatHistory.map(m => ({ role: m.role, content: m.content })),
          userEmail: session?.user?.email 
        }),
      });

      const data = await res.json();
      
      setTimeout(() => {
        setChatHistory(prev => [
          ...prev, 
          { role: "assistant", content: data.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
        setChatLoading(false);

        if (data.isDeal) {
          setIsDeal(true);
          confetti();
          toast.success("Deal Tercapai! 🎉");
        }
      }, 600);

    } catch (error) {
      console.error(error);
      setChatLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Produk tidak ditemukan.</div>;

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 px-4 h-16 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></Link>
            <h1 className="font-bold text-lg truncate max-w-[200px]">{product.name}</h1>
         </div>
      </nav>

      <motion.main initial="hidden" animate="visible" variants={fadeInUp} className="max-w-6xl mx-auto p-4 md:py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-200">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={product.image} onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG }} className="w-full rounded-xl object-cover aspect-square" alt={product.name} />
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center gap-3">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={product.shopAvatar} className="w-12 h-12 rounded-full border" alt="Shop" />
               <div className="flex-1"><h3 className="font-bold">{product.shopName}</h3><p className="text-xs text-green-600">Online</p></div>
               <button className="text-green-600 text-sm font-bold border border-green-600 px-4 py-1.5 rounded-lg">Follow</button>
            </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              <h2 className="text-4xl font-extrabold text-green-600 mb-4">Rp {product.price.toLocaleString("id-ID")}</h2>
              <p className="text-gray-600 text-sm whitespace-pre-line">{product.description}</p>
           </div>
           
           <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40 md:static md:border-0 md:bg-transparent md:p-0">
              <button onClick={() => setIsChatOpen(true)} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-green-700 transition">💬 Nego via Chat</button>
           </div>
        </div>
      </motion.main>

      <AnimatePresence>
        {isChatOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white w-full md:w-[450px] h-[85vh] md:h-[600px] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
                    <div className="bg-green-600 p-4 flex justify-between text-white shadow-md">
                        <div className="flex gap-3 items-center"><div className="text-2xl">🤖</div><div><h4 className="font-bold">Mang Asep</h4><p className="text-xs opacity-90">Asisten Nego</p></div></div>
                        <button onClick={() => setIsChatOpen(false)}>✕</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2]">
                        {chatHistory.map((msg, i) => (
                            <motion.div key={i} variants={messageVariants} initial="hidden" animate="visible" className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-white shadow-sm'}`}>{msg.content}</div>
                            </motion.div>
                        ))}
                        {chatLoading && <div className="text-xs text-gray-500 ml-4">Mengetik...</div>}
                        {isDeal && <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center mx-4 my-2"><p className="font-bold text-green-800 mb-2">Sepakat! 🎉</p><button onClick={handleDealBuy} className="bg-green-600 text-white w-full py-2 rounded-lg text-sm font-bold shadow-lg">Bayar Sekarang</button></div>}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-3 bg-white border-t flex gap-2">
                        <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Tawar harga..." disabled={isDeal} autoFocus />
                        <button onClick={sendMessage} disabled={!inputMessage.trim()} className="bg-green-600 text-white p-2.5 rounded-full">🚀</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}