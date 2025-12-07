"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  shopName: string;
  location: string;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Cart dari LocalStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("tawarin_cart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    setLoading(false);
  }, []);

  const removeItem = (indexToRemove: number) => {
    const newCart = cartItems.filter((_, index) => index !== indexToRemove);
    setCartItems(newCart);
    localStorage.setItem("tawarin_cart", JSON.stringify(newCart));
    toast.error("Barang dihapus dari keranjang");
  };

  const totalPrice = cartItems.reduce((acc, item) => acc + item.price, 0);

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    // Simulasi Checkout -> Langsung bayar semua
    // Kita ambil barang pertama aja buat sample di success page atau bikin logic bulk
    // Disini kita redirect ke success page pake total harga
    const firstItem = cartItems[0];
    router.push(`/success?product=${encodeURIComponent("Borongan " + cartItems.length + " Barang")}&price=${totalPrice}&seller=Multi-Seller`);
    
    // Kosongkan keranjang setelah checkout (opsional, biasanya setelah bayar sukses)
    // localStorage.removeItem("tawarin_cart");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans pb-32">
      
      {/* Navbar Simple */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 h-16 flex items-center gap-4 shadow-sm">
         <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
         </button>
         <h1 className="font-bold text-lg text-gray-800">Keranjang Saya ({cartItems.length})</h1>
      </nav>

      <main className="max-w-3xl mx-auto p-4 mt-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Keranjangmu Kosong</h2>
            <p className="text-gray-500 mb-6">Yuk isi dengan barang-barang impianmu!</p>
            <Link href="/" className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {cartItems.map((item, index) => (
                <motion.div 
                  key={`${item.id}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center"
                >
                  {/* Checkbox Mockup */}
                  <div className="w-5 h-5 rounded-full border-2 border-green-600 flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  </div>

                  {/* Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500 mb-1">{item.shopName} • {item.location}</p>
                    <p className="text-green-600 font-extrabold">Rp {item.price.toLocaleString("id-ID")}</p>
                  </div>

                  {/* Delete Button */}
                  <button onClick={() => removeItem(index)} className="p-2 text-gray-400 hover:text-red-500 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* BOTTOM BAR CHECKOUT */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-40">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
             <div className="flex flex-col">
                <span className="text-gray-500 text-xs">Total Pembayaran</span>
                <span className="text-xl font-extrabold text-green-600">Rp {totalPrice.toLocaleString("id-ID")}</span>
             </div>
             <button 
                onClick={handleCheckout}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg hover:shadow-green-200 transform active:scale-95"
             >
                Checkout ({cartItems.length})
             </button>
          </div>
        </div>
      )}
    </div>
  );
}