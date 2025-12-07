"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

interface Transaction {
  id: number;
  user_email: string;
  product_name: string;
  product_image: string;
  price: number;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH SEMUA DATA TRANSAKSI
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/transactions`)
      .then(res => res.json())
      .then(data => {
        setTransactions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error("Gagal memuat data admin");
        setLoading(false);
      });
  }, []);

  // HITUNG STATISTIK (OMZET & JUMLAH)
  const totalRevenue = transactions.reduce((acc, curr) => acc + Number(curr.price), 0);
  const totalOrders = transactions.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* NAVBAR ADMIN */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">M</div>
            <span className="font-bold text-gray-800 text-lg">Mang Asep <span className="text-gray-400 font-normal">Dashboard</span></span>
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-black transition">
            Ke Toko ↗
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Ringkasan Bisnis 🚀</h1>
          <p className="text-gray-500">Pantau performa negosiasi AI secara real-time.</p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Omzet */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-gray-500 text-sm font-medium mb-1">Total Omzet</p>
              <h2 className="text-3xl font-extrabold text-green-600">
                Rp {totalRevenue.toLocaleString("id-ID")}
              </h2>
            </div>
            <div className="absolute right-4 top-4 text-green-100 bg-green-50 p-3 rounded-xl group-hover:scale-110 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>

          {/* Card 2: Total Deal */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-gray-500 text-sm font-medium mb-1">Barang Terjual</p>
              <h2 className="text-3xl font-extrabold text-blue-600">
                {totalOrders} <span className="text-lg text-gray-400 font-normal">Pcs</span>
              </h2>
            </div>
            <div className="absolute right-4 top-4 text-blue-100 bg-blue-50 p-3 rounded-xl group-hover:scale-110 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
          </div>

          {/* Card 3: AI Performance (Dummy Visual) */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium mb-1">Performa AI</p>
              <h2 className="text-3xl font-extrabold text-yellow-400">98.5%</h2>
              <p className="text-xs text-gray-400 mt-1">Negosiasi Sukses</p>
            </div>
            <div className="absolute right-0 bottom-0 opacity-20">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
            </div>
          </div>
        </div>

        {/* RECENT TRANSACTIONS TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Transaksi Terbaru</h3>
            <button className="text-sm text-green-600 font-medium hover:underline">Export CSV</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Pembeli</th>
                  <th className="px-6 py-3">Barang</th>
                  <th className="px-6 py-3">Harga Deal</th>
                  <th className="px-6 py-3">Waktu</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Belum ada data transaksi.</td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-mono text-gray-500">#{tx.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{tx.user_email}</td>
                      <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={tx.product_image} className="w-6 h-6 rounded bg-gray-200" alt="" />
                        {tx.product_name}
                      </td>
                      <td className="px-6 py-4 font-bold text-green-600">
                        Rp {Number(tx.price).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(tx.created_at).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold border border-green-200">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}