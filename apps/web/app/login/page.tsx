"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Register Only States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("Laki-laki"); 
  const [birthdate, setBirthdate] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === 'admin') {
        router.push("/admin");
      } else {
        router.push("/");
      }
    }
  }, [status, router, session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      toast.error(res.error);
      setLoading(false);
    } else {
      toast.success("Login berhasil! 🚀");
      router.refresh(); // Refresh agar session terupdate
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, password, phone, gender, birthdate, address
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal daftar");

      toast.success("Akun berhasil dibuat! Login otomatis...");
      
      // Auto login setelah register
      const loginRes = await signIn("credentials", { 
        redirect: false, 
        email, 
        password 
      });

      if (loginRes?.ok) {
        router.push("/");
      }

    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Terjadi kesalahan sistem");
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/" });
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/50"
      >
        {/* HEADER & TABS */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-center text-white">
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight">TawarIn.</h1>
          <p className="opacity-90 text-sm mb-6">Nego sampai jadi, belanja happy!</p>
          
          <div className="flex bg-black/20 p-1 rounded-xl backdrop-blur-sm">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${isLogin ? 'bg-white text-green-700 shadow-md' : 'text-white/70 hover:text-white'}`}
            >
              Masuk
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${!isLogin ? 'bg-white text-green-700 shadow-md' : 'text-white/70 hover:text-white'}`}
            >
              Daftar
            </button>
          </div>
        </div>

        {/* FORM BODY */}
        <div className="p-8">
          {isLogin ? (
            // --- LOGIN FORM ---
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input type="email" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                <input type="password" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              
              <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200">
                {loading ? "Memproses..." : "Masuk Sekarang 🚀"}
              </button>
            </form>
          ) : (
            // --- REGISTER FORM ---
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Lengkap</label>
                <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                  <input type="email" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                  <input type="password" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">No. WhatsApp</label>
                  <input type="tel" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tgl Lahir</label>
                  <input type="date" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" value={birthdate} onChange={e => setBirthdate(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jenis Kelamin</label>
                <div className="flex gap-4">
                  {['Laki-laki', 'Perempuan'].map((g) => (
                    <label key={g} className={`flex-1 flex items-center justify-center gap-2 cursor-pointer p-2 rounded-lg border transition text-xs font-medium ${gender === g ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                      <input 
                        type="radio" 
                        name="gender" 
                        value={g} 
                        checked={gender === g}
                        onChange={(e) => setGender(e.target.value)}
                        className="hidden"
                      />
                      <span>{g === 'Laki-laki' ? '👨' : '👩'} {g}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alamat Lengkap</label>
                <textarea required rows={2} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" placeholder="Jalan, No Rumah, Kota..." value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200">
                {loading ? "Mendaftar..." : "Buat Akun Baru ✨"}
              </button>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Atau masuk dengan</span></div>
            </div>

            <button onClick={handleGoogleLogin} className="mt-4 w-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12.5S6.42 23 12.1 23c5.83 0 9.72-4.1 9.72-9.91c0-.85-.1-1.7-.27-2.08z"/></svg>
              Google
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}