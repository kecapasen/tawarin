"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type TabType = 'overview' | 'products' | 'orders';

interface MenuItem {
  id: TabType;
  label: string;
  icon: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  sold: number;
  description: string;
  min_price: number;
  category?: string;
}

interface Order {
  id: number;
  user_email: string;
  product_name: string;
  price: number;
  status: string;
  created_at: string;
}

const containerVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVars = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'overview', label: 'Beranda Toko', icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
  { id: 'products', label: 'Produk Saya', icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { id: 'orders', label: 'Pesanan Masuk', icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" }
];

export default function SellerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", price: "", min_price: "", description: "", image: "", category: "Elektronik" });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!session?.user?.email) return;
    
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/orders/${session.user.email}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/products/${session.user.email}`)
      ]);
      
      const ordersData: Order[] = await ordersRes.json();
      const productsData: Product[] = await productsRes.json();
      
      setOrders(ordersData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data toko");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
       fetch(`${process.env.NEXT_PUBLIC_API_URL}/store/check/${session.user.email}`)
         .then(res => res.json())
         .then(store => {
            if (!store) {
                router.push("/seller/register");
            } else {
                fetchData();
            }
         })
         .catch(() => {
           toast.error("Gagal cek status toko");
           setLoading(false);
         });
    } else if (status === "unauthenticated") {
        router.push("/login");
    }
  }, [status, session, fetchData, router]);

  const handleAnalyzeStore = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(""); 
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email })
      });
      const data = await res.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
        toast.success("Laporan AI siap dibaca! 🧠");
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal menganalisa toko");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Yakin mau hapus produk ini?")) return;
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/product/${id}`, {
        method: "DELETE"
    });

    if (res.ok) {
        toast.success("Produk berhasil dihapus");
        fetchData();
    } else {
        toast.error("Gagal menghapus");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      toast.warning("Isi nama produk dulu!");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL }/ai/generate-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          productName: formData.name,
          condition: formData.description || "Kondisi bagus, siap pakai."
        })
      });
      const data = await res.json();
      if (data.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
        toast.success("Deskripsi berhasil dibuat AI! ✨");
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal generate deskripsi AI");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadLoading(true);
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/product`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...formData, seller_email: session?.user?.email })
        });
        if (res.ok) {
            toast.success("Produk berhasil dijual! 🚀");
            setIsModalOpen(false);
            setFormData({ name: "", price: "", min_price: "", description: "", image: "", category: "Elektronik" });
            fetchData();
        } else {
            throw new Error();
        }
    } catch (error) {
        console.error(error);
        toast.error("Gagal upload produk");
    } finally {
        setUploadLoading(false);
    }
  };

  const totalRevenue = orders.reduce((acc, curr) => acc + Number(curr.price), 0);
  const totalSold = orders.length;

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col z-20 shadow-xl">
        <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-tr from-green-600 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-green-200">T</div>
                <div>
                    <h1 className="font-extrabold text-gray-800 text-lg tracking-tight">Seller Hub</h1>
                    <p className="text-[11px] text-gray-400 font-medium tracking-wide">MANAGEMENT</p>
                </div>
            </div>
        
            <nav className="space-y-2">
                {MENU_ITEMS.map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id)} 
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ease-in-out ${activeTab === item.id ? 'bg-green-50 text-green-700 shadow-sm ring-1 ring-green-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                    {item.label}
                    {item.id === 'orders' && orders.length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{orders.length}</span>}
                  </button>
                ))}
            </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              <Link href="/" className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition">
                  &larr; Kembali ke Mall
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm font-semibold text-red-600 hover:bg-red-100 transition">
                  Logout
              </button>
            </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative">
        
        <motion.header 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-end mb-10"
        >
            <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {activeTab === 'overview' && 'Ringkasan Bisnis'}
                    {activeTab === 'products' && 'Daftar Produk'}
                    {activeTab === 'orders' && 'Pesanan Masuk'}
                </h2>
                <p className="text-gray-500 mt-1">Selamat datang kembali, {session?.user?.name}!</p>
            </div>
            {activeTab === 'products' && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)} 
                className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl hover:bg-gray-800 transition flex items-center gap-2"
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Tambah Produk
              </motion.button>
            )}
        </motion.header>

        {activeTab === 'overview' && (
            <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div variants={itemVars} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300 relative overflow-hidden group">
                        <div className="relative z-10">
                           <p className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Total Pendapatan</p>
                           <h3 className="text-4xl font-black text-gray-900">Rp {totalRevenue.toLocaleString("id-ID")}</h3>
                        </div>
                        <div className="absolute right-0 top-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110"></div>
                        <div className="absolute right-6 top-6 text-green-600"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                    </motion.div>

                    <motion.div variants={itemVars} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300 relative overflow-hidden group">
                        <div className="relative z-10">
                           <p className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Barang Terjual</p>
                           <h3 className="text-4xl font-black text-gray-900">{totalSold} <span className="text-xl text-gray-300 font-normal">Unit</span></h3>
                        </div>
                        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110"></div>
                        <div className="absolute right-6 top-6 text-blue-600"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div>
                    </motion.div>

                    <motion.div variants={itemVars} className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 rounded-3xl shadow-lg text-white relative overflow-hidden">
                        <div className="relative z-10">
                           <p className="text-purple-200 text-sm font-medium mb-2 uppercase tracking-wider">AI Business Consultant</p>
                           <h3 className="text-2xl font-bold mb-4">Cek Kesehatan Toko</h3>
                           <button 
                             onClick={handleAnalyzeStore}
                             disabled={isAnalyzing}
                             className="bg-white text-purple-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-50 transition shadow-lg flex items-center gap-2"
                           >
                             {isAnalyzing ? (
                               <span className="animate-pulse">Sedang Menganalisa...</span>
                             ) : (
                               <>
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                 <span>Minta Saran AI</span>
                               </>
                             )}
                           </button>
                        </div>
                        <div className="absolute -right-10 -bottom-10 opacity-20"><svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
                    </motion.div>
                </div>
                
                <AnimatePresence>
                    {aiAnalysis && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, y: 20 }} 
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-white border border-purple-100 rounded-3xl p-8 shadow-lg ring-1 ring-purple-50"
                        >
                            <div className="flex items-start gap-4">
                                <div className="text-3xl bg-purple-50 p-3 rounded-2xl">🤖</div>
                                <div className="flex-1">
                                    <h3 className="text-gray-900 font-extrabold text-lg mb-3">Laporan Analisis Toko</h3>
                                    <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line font-medium">
                                        {aiAnalysis}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-800 mb-4">Pesanan Terbaru</h3>
                    {orders.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-10">Belum ada pesanan masuk.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-gray-500 bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-3 rounded-tl-lg">Produk</th>
                                        <th className="p-3">Harga Deal</th>
                                        <th className="p-3">Pembeli</th>
                                        <th className="p-3 rounded-tr-lg text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.slice(0, 5).map(order => (
                                        <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="p-3 font-medium">{order.product_name}</td>
                                            <td className="p-3 text-green-600 font-bold">Rp {Number(order.price).toLocaleString("id-ID")}</td>
                                            <td className="p-3 text-gray-500">{order.user_email}</td>
                                            <td className="p-3 text-center"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Lunas</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </motion.div>
        )}

        {activeTab === 'products' && (
            <motion.div variants={containerVars} initial="hidden" animate="show" className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-400 bg-gray-50/50 border-b border-gray-100 font-medium uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-6">Produk</th>
                                <th className="p-6">Kategori</th>
                                <th className="p-6">Harga Display</th>
                                <th className="p-6 text-red-500">Harga Modal (Min)</th>
                                <th className="p-6 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products.map(product => (
                                <motion.tr variants={itemVars} key={product.id} className="hover:bg-gray-50 transition group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={product.image_url || "https://via.placeholder.com/50"} className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm" alt="" />
                                            <div>
                                                <p className="font-bold text-gray-900 text-base line-clamp-1">{product.name}</p>
                                                <p className="text-gray-400 text-xs mt-1 line-clamp-1">{product.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-gray-500"><span className="bg-gray-100 px-2 py-1 rounded">{product.category || "Lainnya"}</span></td>
                                    <td className="p-6 font-bold text-gray-700">Rp {product.price.toLocaleString("id-ID")}</td>
                                    <td className="p-6 text-red-500 font-medium bg-red-50/30">Rp {product.min_price?.toLocaleString("id-ID")}</td>
                                    <td className="p-6 text-center">
                                        <button onClick={() => handleDeleteProduct(product.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-3 rounded-xl transition">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                    {products.length === 0 && <div className="p-20 text-center text-gray-400">Belum ada produk yang dijual.</div>}
                </div>
            </motion.div>
        )}

        {activeTab === 'orders' && (
            <motion.div variants={containerVars} initial="hidden" animate="show" className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
               <table className="w-full text-sm text-left">
                    <thead className="text-gray-400 bg-gray-50/50 border-b border-gray-100 font-medium uppercase text-xs tracking-wider">
                        <tr>
                            <th className="p-6">Order ID</th>
                            <th className="p-6">Pembeli</th>
                            <th className="p-6">Produk</th>
                            <th className="p-6">Total Deal</th>
                            <th className="p-6 text-center">Status</th>
                            <th className="p-6 text-right">Waktu</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.map(order => (
                            <motion.tr variants={itemVars} key={order.id} className="hover:bg-gray-50 transition">
                                <td className="p-6 font-mono text-gray-400 text-xs">#{order.id}</td>
                                <td className="p-6">
                                    <div className="font-bold text-gray-800">{order.user_email.split('@')[0]}</div>
                                    <div className="text-xs text-gray-400">{order.user_email}</div>
                                </td>
                                <td className="p-6 font-medium text-gray-700">{order.product_name}</td>
                                <td className="p-6 text-green-600 font-bold text-base">Rp {Number(order.price).toLocaleString("id-ID")}</td>
                                <td className="p-6 text-center">
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Lunas</span>
                                </td>
                                <td className="p-6 text-right text-gray-500 text-xs">{new Date(order.created_at).toLocaleString()}</td>
                            </motion.tr>
                        ))}
                    </tbody>
               </table>
               {orders.length === 0 && <div className="p-20 text-center text-gray-400">Belum ada pesanan masuk.</div>}
            </motion.div>
        )}

      </main>

      <AnimatePresence>
        {isModalOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"
            >
                <motion.div 
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 relative border border-gray-100 max-h-[90vh] overflow-y-auto"
                >
                    <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition bg-gray-100 hover:bg-gray-200 p-2 rounded-full">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    
                    <div className="mb-8">
                        <h2 className="text-2xl font-extrabold text-gray-900">Tambah Produk</h2>
                        <p className="text-gray-500 text-sm mt-1">Isi detail barang yang mau dijual.</p>
                    </div>
                    
                    <form onSubmit={handleAddProduct} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nama Produk</label>
                            <input type="text" required className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none" 
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Contoh: iPhone 11 Bekas" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Kategori</label>
                                <select 
                                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
                                  value={formData.category}
                                  onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    {["Elektronik", "Fashion", "Hobi", "Otomotif", "Rumah Tangga"].map(c => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Harga Display</label>
                                <input type="number" required className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none" 
                                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="500000" />
                            </div>
                        </div>

                        <div className="bg-red-50 p-3 rounded-2xl border border-red-100">
                                <label className="block text-xs font-bold text-red-500 uppercase mb-1 ml-1">Harga Modal (Min)</label>
                                <input type="number" required className="w-full border border-red-200 bg-white rounded-xl px-4 py-2 text-sm font-bold text-red-600 focus:ring-2 focus:ring-red-500 outline-none" 
                                    value={formData.min_price} onChange={e => setFormData({...formData, min_price: e.target.value})} placeholder="Rahasia" />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Deskripsi</label>
                                <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-lg font-bold hover:bg-purple-200 transition flex items-center gap-1">
                                    {isGenerating ? "Menulis..." : "✨ Buat Deskripsi AI"}
                                </button>
                            </div>
                            <textarea required rows={4} className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none resize-none" 
                                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Contoh: Kondisi mulus 99%, box lengkap..." />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Foto Produk</label>
                            <div className="flex items-center gap-4 mt-2">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm">
                                    Pilih Foto
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                {formData.image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={formData.image} className="w-16 h-16 object-cover rounded-xl border border-gray-200 shadow-sm" alt="Preview" />
                                )}
                            </div>
                        </div>

                        <button type="submit" disabled={uploadLoading} className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition shadow-lg transform active:scale-[0.98] disabled:opacity-70 mt-4">
                            {uploadLoading ? "Mengupload..." : "Jual Sekarang 🚀"}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}