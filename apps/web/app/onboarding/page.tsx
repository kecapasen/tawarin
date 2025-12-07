"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix";

  const [formData, setFormData] = useState({ 
    phone: "", 
    address: "", 
    gender: "Laki-laki",
    birthdate: "",
    image: "" 
  });
  
  const [previewImage, setPreviewImage] = useState(DEFAULT_AVATAR);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    
    if (status === "authenticated" && session?.user) {
      const googleImage = session.user.image;
      
      if (googleImage) {
        setPreviewImage(googleImage);
        setFormData(prev => ({ ...prev, image: googleImage }));
      }
    }
  }, [status, router, session]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) return;

    const toastId = toast.loading("Menyimpan data..."); 
    setLoading(true);

    const newAddress = [{
      id: Date.now(),
      label: "Rumah",
      recipient: session.user.name || "Penerima",
      phone: formData.phone,
      street: formData.address,
      city: "Jakarta" 
    }];

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          phone: formData.phone,
          gender: formData.gender,
          birthdate: formData.birthdate,
          addresses: newAddress, 
          image: formData.image || previewImage,
        }),
      });

      if (res.ok) {
        toast.dismiss(toastId); 
        toast.success("Mantap! Profil berhasil disimpan 🚀"); 
        router.push("/");
      } else {
        toast.dismiss(toastId);
        toast.error("Waduh, gagal simpan data. Cek backend lu bang!");
      }
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Error koneksi jaringan 😭");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white/80 backdrop-blur-md w-full max-w-xl p-8 rounded-3xl shadow-2xl border border-white/50">
        
        <div className="text-center mb-8">
          <div className="relative inline-block group mb-4">
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-green-400 to-emerald-600 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={previewImage || DEFAULT_AVATAR} 
                onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR }}
                className="w-full h-full rounded-full object-cover border-4 border-white cursor-pointer hover:opacity-90 transition bg-gray-200"
                alt="Profile"
                onClick={() => fileInputRef.current?.click()}
              />
            </div>
            
            <div 
              className="absolute bottom-1 right-1 bg-white p-2 rounded-full cursor-pointer shadow-md hover:bg-gray-100 transition text-green-600"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
          </div>
          
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Selamat Datang! 👋</h1>
          <p className="text-gray-500 mt-2 text-sm">Selesaikan profilmu biar transaksi makin aman.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nomor WhatsApp</label>
              <input
                type="tel"
                required
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition shadow-sm placeholder-gray-300"
                placeholder="0812xxxx"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Tanggal Lahir</label>
              <input
                type="date"
                required
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition shadow-sm text-gray-700"
                value={formData.birthdate}
                onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Jenis Kelamin</label>
            <div className="grid grid-cols-2 gap-4">
              {['Laki-laki', 'Perempuan'].map((g) => (
                <label key={g} className={`flex items-center justify-center gap-2 cursor-pointer p-3 rounded-xl border transition shadow-sm ${formData.gender === g ? 'bg-green-50 border-green-500 text-green-700 font-bold' : 'bg-white border-gray-200 hover:border-green-300 text-gray-600'}`}>
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={formData.gender === g}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="accent-green-600 w-4 h-4"
                  />
                  <span className="text-sm">{g}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Alamat Pengiriman</label>
            <textarea
              required
              rows={3}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition shadow-sm resize-none placeholder-gray-300"
              placeholder="Jl. Sudirman No. 1, Jakarta Pusat..."
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-green-200 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>Simpan & Mulai Belanja 🚀</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}