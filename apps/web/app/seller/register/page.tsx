"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SellerRegister() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", domain: "", location: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/store/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          name: form.name,
          domain: form.domain,
          location: form.location
        }),
      });

      if (res.ok) {
        toast.success("Toko berhasil dibuat! Selamat berjualan 🎉");
        router.push("/seller/dashboard"); // Redirect ke dashboard
      } else {
        throw new Error();
      }
    } catch (e) {
      toast.error("Gagal membuat toko. Coba nama domain lain.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-xl">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Buka Toko Gratis 🏪</h1>
            <p className="text-sm text-gray-500 mt-2">Mulai jualan di TawarIn dan gunakan AI kami.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nama Toko</label>
                <input type="text" required className="w-full border p-3 rounded-xl mt-1 text-sm outline-green-500" placeholder="Contoh: Maju Jaya Cell" 
                   value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Link Toko (Domain)</label>
                <div className="flex items-center mt-1">
                    <span className="bg-gray-100 border border-r-0 rounded-l-xl px-3 py-3 text-sm text-gray-500">tawarin.com/</span>
                    <input type="text" required className="w-full border rounded-r-xl px-3 py-3 text-sm outline-green-500" placeholder="majujaya" 
                       value={form.domain} onChange={e => setForm({...form, domain: e.target.value.toLowerCase().replace(/\s/g, '')})} />
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Lokasi Pengiriman</label>
                <input type="text" required className="w-full border p-3 rounded-xl mt-1 text-sm outline-green-500" placeholder="Kota Bandung" 
                   value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition shadow-lg mt-4 disabled:opacity-50">
                {loading ? "Memproses..." : "Buka Toko Sekarang 🚀"}
            </button>
        </form>
      </div>
    </div>
  );
}