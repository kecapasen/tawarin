"use client";

import { useSearchParams } from "next/navigation"; 
import { useEffect, useState, Suspense } from "react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useSession } from "next-auth/react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const product = searchParams.get("product") || "Barang Misterius";
  const price = searchParams.get("price") || "0";
  const sellerEmail = searchParams.get("seller") || "";
  
  const [status, setStatus] = useState<"scanning" | "processing" | "success">("scanning");
  const [transactionTime, setTransactionTime] = useState<string>("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setTransactionTime(new Date().toLocaleTimeString("id-ID"));

    const timer1 = setTimeout(() => setStatus("processing"), 2000);
    const timer2 = setTimeout(() => {
      setStatus("success");
      triggerConfetti();
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    if (status === "success" && session?.user?.email && !isSaved) {
      setIsSaved(true);
      
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/transaction/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          seller_email: sellerEmail,
          product_name: product,
          product_image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          price: parseInt(price)
        })
      })
      .then(res => res.json())
      .then(data => console.log("Transaksi Disimpan:", data))
      .catch(err => console.error("Gagal simpan:", err));
    }
  }, [status, session, isSaved, product, price, sellerEmail]);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-4 bg-gray-800" style={{clipPath: "polygon(0 0, 5% 100%, 10% 0, 15% 100%, 20% 0, 25% 100%, 30% 0, 35% 100%, 40% 0, 45% 100%, 50% 0, 55% 100%, 60% 0, 65% 100%, 70% 0, 75% 100%, 80% 0, 85% 100%, 90% 0, 95% 100%, 100% 0)"}}></div>

        <div className="p-8 pt-12 text-center">
          <div className="flex justify-center mb-6">
            {status === "scanning" && <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center animate-pulse"><span className="text-4xl">📷</span></div>}
            {status === "processing" && <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div></div>}
            {status === "success" && <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce"><svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
          </div>

          <h1 className="text-2xl font-extrabold text-gray-800 mb-2">
            {status === "scanning" ? "Scan QRIS..." : status === "processing" ? "Memproses..." : "Pembayaran Berhasil!"}
          </h1>
          
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8 text-left space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 border-dashed">
              <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Merchant</span>
              <span className="font-bold text-gray-800">TawarIn Official</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Barang</span>
              <span className="font-medium text-gray-800 text-right max-w-[150px] truncate">{product}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Waktu</span>
              <span className="font-medium text-gray-800 text-sm">{transactionTime || "Memuat..."}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200 border-dashed">
              <span className="text-gray-800 font-bold">Total Bayar</span>
              <span className="text-green-600 font-extrabold text-xl">Rp {parseInt(price).toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* QRIS MOCKUP */}
          {status === "scanning" && (
            <div className="mb-8">
               <div className="w-48 h-48 mx-auto bg-gray-900 rounded-lg p-2 flex items-center justify-center shadow-inner">
                  <div className="bg-white w-full h-full flex items-center justify-center">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img 
                       src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TawarInHackathonPayment" 
                       alt="QRIS" 
                       className="w-40 h-40 opacity-80" 
                     />
                  </div>
               </div>
               <p className="text-xs text-gray-400 mt-2">Otomatis mendeteksi pembayaran...</p>
            </div>
          )}

          <div className="space-y-3">
            {status === "success" ? (
              <Link href="/" className="block w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition shadow-lg transform active:scale-95">
                Belanja Lagi 🛍️
              </Link>
            ) : (
              <button disabled className="w-full bg-gray-200 text-gray-400 font-bold py-3.5 rounded-xl cursor-not-allowed">
                Menunggu Pembayaran...
              </button>
            )}
            
            <Link href="/profile" className="block w-full bg-white border border-gray-200 text-gray-600 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition">
              Cek Riwayat
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gray-50" style={{clipPath: "polygon(0 100%, 5% 0, 10% 100%, 15% 0, 20% 100%, 25% 0, 30% 100%, 35% 0, 40% 100%, 45% 0, 50% 100%, 55% 0, 60% 100%, 65% 0, 70% 100%, 75% 0, 80% 100%, 85% 0, 90% 100%, 95% 0, 100% 100%)"}}></div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}