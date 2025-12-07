"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface Address {
  id: number;
  label: string;
  recipient: string;
  phone: string;
  street: string;
  city: string;
}

interface UserData {
  name: string;
  email: string;
  phone: string;
  gender: string;
  birthdate: string;
  image: string;
  addresses: Address[];
}

interface Transaction {
  id: number;
  product_name: string;
  product_image: string;
  price: number;
  status: string;
  created_at: string;
}

interface ContentProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  handleSave: (e: React.FormEvent) => Promise<void>;
  isSaving: boolean;
}

interface BiodataContentProps extends ContentProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix";

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const AddressContent = ({ userData, setUserData, handleSave, isSaving }: ContentProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Address>({
    id: 0, label: '', recipient: '', phone: '', street: '', city: ''
  });

  const openEditForm = (address?: Address) => {
    if (address) {
      setCurrentAddress(address);
    } else {
      setCurrentAddress({ id: 0, label: '', recipient: '', phone: '', street: '', city: '' });
    }
    setIsFormOpen(true);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedAddresses: Address[];

    if (currentAddress.id !== 0) {
      updatedAddresses = userData.addresses.map(addr => addr.id === currentAddress.id ? currentAddress : addr);
    } else {
      const newId = userData.addresses.length > 0 ? Math.max(...userData.addresses.map(a => a.id)) + 1 : 1;
      updatedAddresses = [...userData.addresses, { ...currentAddress, id: newId }];
    }

    setUserData(prev => ({ ...prev, addresses: updatedAddresses }));
    setIsFormOpen(false);
    toast.success("List alamat diperbarui");
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Yakin hapus alamat ini?")) {
      setUserData(prev => ({ ...prev, addresses: prev.addresses.filter(a => a.id !== id) }));
      toast.info("Alamat dihapus.");
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeIn} className="flex justify-between items-center border-b border-gray-100 pb-3">
        <h2 className="text-xl font-bold text-gray-800">Daftar Alamat</h2>
        {!isFormOpen && (
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={() => openEditForm()} 
            type="button" 
            className="bg-green-600 text-white px-4 py-2 text-sm rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200"
          >
            + Tambah Alamat
          </motion.button>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {userData.addresses.length === 0 && !isFormOpen && (
          <motion.div 
            key="empty"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center py-12 bg-gray-50 rounded-2xl text-gray-500 border border-dashed border-gray-300"
          >
            Belum ada alamat tersimpan.
          </motion.div>
        )}

        {!isFormOpen && userData.addresses.map((addr) => (
          <motion.div 
            key={addr.id} 
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border border-gray-100 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-all duration-300 mb-4"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-bold text-gray-800 text-lg">{addr.recipient}</span>
                <span className="ml-3 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">{addr.label}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <button onClick={() => openEditForm(addr)} type="button" className="text-green-600 font-medium hover:underline">Ubah</button>
                <button onClick={() => handleDelete(addr.id)} type="button" className="text-red-600 font-medium hover:underline">Hapus</button>
              </div>
            </div>
            <div className="text-gray-600 text-sm space-y-1">
              <p className="flex items-center gap-2"><span className="text-gray-400">📞</span> {addr.phone}</p>
              <p className="flex items-center gap-2"><span className="text-gray-400">📍</span> {addr.street}, {addr.city}</p>
            </div>
          </motion.div>
        ))}

        {isFormOpen && (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-2xl border border-green-100 shadow-xl"
          >
            <h3 className="font-bold text-gray-800 mb-6 text-lg">{currentAddress.id !== 0 ? 'Ubah Alamat' : 'Alamat Baru'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <input type="text" placeholder="Label (Rumah/Kantor)" className="border border-gray-200 bg-gray-50 p-3 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition" value={currentAddress.label} onChange={e => setCurrentAddress({...currentAddress, label: e.target.value})} required />
              <input type="text" placeholder="Nama Penerima" className="border border-gray-200 bg-gray-50 p-3 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition" value={currentAddress.recipient} onChange={e => setCurrentAddress({...currentAddress, recipient: e.target.value})} required />
              <input type="text" placeholder="No. Telepon" className="border border-gray-200 bg-gray-50 p-3 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition" value={currentAddress.phone} onChange={e => setCurrentAddress({...currentAddress, phone: e.target.value})} required />
              <input type="text" placeholder="Kota / Kecamatan" className="border border-gray-200 bg-gray-50 p-3 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition" value={currentAddress.city} onChange={e => setCurrentAddress({...currentAddress, city: e.target.value})} required />
              <textarea placeholder="Detail Jalan, No. Rumah, RT/RW" className="border border-gray-200 bg-gray-50 p-3 rounded-xl text-sm md:col-span-2 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition resize-none" rows={3} value={currentAddress.street} onChange={e => setCurrentAddress({...currentAddress, street: e.target.value})} required />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">Batal</button>
              <button type="button" onClick={handleAddressSubmit} className="px-6 py-2.5 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition font-medium">Simpan ke List</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeIn} className="pt-6 flex justify-end border-t border-gray-100 mt-6">
        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          type="button" 
          onClick={handleSave} 
          disabled={isSaving} 
          className="bg-gray-900 text-white px-8 py-3.5 rounded-xl shadow-xl font-bold hover:bg-gray-800 transition disabled:opacity-50"
        >
          {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

const RiwayatBelanjaContent = () => {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      fetch(`${API_URL}/transactions/${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTransactions(data);
          } else {
            setTransactions([]);
          }
        })
        .catch(err => {
          console.error(err);
          setTransactions([]);
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (loading) return (
    <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (transactions.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
        <p className="text-gray-500 mb-6 text-lg">Belum ada transaksi nih.</p>
        <Link href="/" className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-green-700 shadow-lg hover:shadow-green-200 transition">Mulai Belanja</Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <motion.h2 variants={fadeIn} className="text-xl font-bold text-gray-800">Riwayat Pembayaran</motion.h2>
      
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
            <tr>
              <th className="p-5">Barang</th>
              <th className="p-5">Harga Deal</th>
              <th className="p-5">Tanggal</th>
              <th className="p-5 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <motion.tr 
                variants={fadeIn} 
                key={tx.id} 
                className="border-b last:border-b-0 hover:bg-green-50/30 transition duration-200"
              >
                <td className="p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={tx.product_image} className="w-full h-full object-cover" alt="" />
                        </div>
                        <span className="font-bold text-gray-800">{tx.product_name}</span>
                    </div>
                </td>
                <td className="p-5 font-medium text-gray-600">Rp {Number(tx.price).toLocaleString("id-ID")}</td>
                <td className="p-5 text-gray-500">
                  {new Date(tx.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="p-5 text-center">
                  <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wide">
                    {tx.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

const BiodataContent = ({ userData, setUserData, handleSave, isSaving, fileInputRef, handleImageChange }: BiodataContentProps) => (
  <motion.form variants={staggerContainer} initial="hidden" animate="visible" onSubmit={handleSave} className="flex flex-col-reverse md:flex-row gap-10">
    <div className="flex-1 space-y-6">
      <motion.div variants={fadeIn} className="group">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1 group-focus-within:text-green-600 transition">Nama Lengkap</label>
        <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} />
      </motion.div>

      <motion.div variants={fadeIn} className="group">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Email</label>
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
          <span className="text-sm text-gray-600 flex-1 px-3">{userData.email}</span>
          <span className="text-[10px] font-bold bg-white border border-gray-200 text-gray-400 px-2 py-1 rounded-lg shadow-sm">TERHUBUNG</span>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="group">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1 group-focus-within:text-green-600 transition">Nomor Telepon</label>
        <input type="tel" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition" value={userData.phone} onChange={e => setUserData({...userData, phone: e.target.value})} />
      </motion.div>

      <motion.div variants={fadeIn}>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Jenis Kelamin</label>
        <div className="flex gap-4">
          {['Laki-laki', 'Perempuan'].map((g) => (
            <label key={g} className={`flex-1 flex items-center justify-center gap-2 cursor-pointer p-3 rounded-xl border transition duration-200 ${userData.gender === g ? 'bg-green-50 border-green-500 text-green-700 shadow-inner' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
              <input 
                type="radio" 
                name="gender" 
                value={g} 
                checked={userData.gender === g}
                onChange={e => setUserData({...userData, gender: e.target.value})}
                className="hidden"
              />
              <span className="text-sm font-medium">{g === 'Laki-laki' ? '👨 Laki-laki' : '👩 Perempuan'}</span>
            </label>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="pt-6">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isSaving} className="w-full bg-gray-900 text-white px-8 py-4 rounded-2xl shadow-xl font-bold hover:bg-gray-800 transition disabled:opacity-70">
          {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
        </motion.button>
      </motion.div>
    </div>

    <motion.div variants={fadeIn} className="w-full md:w-72 flex flex-col items-center justify-start md:border-l border-gray-100 md:pl-10 pt-2">
      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl mb-6 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
            src={userData.image || DEFAULT_AVATAR} 
            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR }}
            alt="Avatar" 
            className="w-full h-full object-cover group-hover:scale-110 transition duration-500" 
            />
        </div>
        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
            <span className="text-white font-bold text-sm">Ubah Foto</span>
        </div>
      </div>
      
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
      
      <button onClick={() => fileInputRef.current?.click()} type="button" className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition mb-4">
        Pilih Gambar
      </button>
      
      <p className="text-xs text-gray-400 text-center leading-relaxed px-4">
        Format gambar .JPEG, .PNG<br/>Maksimal ukuran 1 MB
      </p>
    </motion.div>
  </motion.form>
);

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState("biodata");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [userData, setUserData] = useState<UserData>({
    name: "",
    email: "",
    phone: "",
    gender: "Laki-laki",
    birthdate: "",
    image: "",
    addresses: [] 
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    
    if (session?.user?.email) {
      setIsLoading(true);
      // FIX: Gunakan API_URL yang benar
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      fetch(`${API_URL}/user/${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          const dbImage = data.image || "";
          const isDbUsingDefault = dbImage.includes("dicebear"); 
          
          const finalImage = (!dbImage || isDbUsingDefault) && session.user?.image 
            ? session.user.image 
            : (dbImage || DEFAULT_AVATAR);

          setUserData({
            name: data.name || session.user?.name || "",
            email: data.email,
            phone: data.phone || "",
            gender: data.gender || "Laki-laki",
            birthdate: data.birthdate || "",
            image: finalImage,
            addresses: Array.isArray(data.addresses) ? data.addresses : [], 
          });
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [session, status, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Sedang menyimpan profil...");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/user/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (res.ok) {
        toast.dismiss(toastId);
        toast.success("Profil berhasil diperbarui! ✨");
      } else {
        throw new Error("Gagal update");
      }
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Gagal menyimpan data. Cek koneksi backend.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecurity = () => {
    toast.warning("Fitur Keamanan akan segera hadir! 🔒");
  };

  // FIX: Force redirect to Home instead of back history to avoid loops
  const handleBack = () => {
    router.push("/");
  };

  if (status === "loading" || isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]"><div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans pb-10">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <Link href="/" className="text-green-600 font-bold text-2xl tracking-tighter hover:opacity-80 transition">TawarIn.</Link>
          <div className="h-6 w-[1px] bg-gray-300"></div>
          <span className="text-gray-600 text-sm font-medium">Akun Saya</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 mt-6 flex flex-col md:flex-row gap-6">
        
        {/* SIDEBAR MENU */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-5 mb-4 flex items-center gap-4 border border-gray-100">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={userData.image || DEFAULT_AVATAR} 
                onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR }}
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-gray-800 truncate text-sm">{userData.name}</h3>
              <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Ubah Profil
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="p-2">
              <div className="px-4 py-3">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs">👤</span>
                  Akun Saya
                </h4>
              </div>
              <ul className="space-y-1 text-sm text-gray-600">
                <li><button onClick={() => setActiveTab('biodata')} className={`w-full text-left px-4 py-2 rounded-lg transition ${activeTab === 'biodata' ? 'text-green-600 font-bold bg-green-50' : 'hover:bg-gray-50'}`}>Profil</button></li>
                <li><button onClick={() => setActiveTab('address')} className={`w-full text-left px-4 py-2 rounded-lg transition ${activeTab === 'address' ? 'text-green-600 font-bold bg-green-50' : 'hover:bg-gray-50'}`}>Alamat</button></li>
                <li><button onClick={handleSecurity} className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50">Pengaturan Keamanan</button></li>
              </ul>
            </div>
            
            <div className="border-t border-gray-100 p-2">
              <div className="px-4 py-3">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded flex items-center justify-center text-xs">📦</span>
                  Pesanan Saya
                </h4>
              </div>
              <ul className="space-y-1 text-sm text-gray-600">
                <li><button onClick={() => setActiveTab('history')} className={`w-full text-left px-4 py-2 rounded-lg transition ${activeTab === 'history' ? 'text-green-600 font-bold bg-green-50' : 'hover:bg-gray-50'}`}>Riwayat Belanja</button></li>
              </ul>
            </div>
            
            <div className="border-t border-gray-100 p-2">
              <div className="px-4 py-3">
                 <h4 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-1">Toko Saya</h4>
              </div>
              <ul className="space-y-1 text-sm font-medium text-gray-600">
                <li>
                    <Link href="/seller/dashboard" className="block w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-xl hover:bg-gray-50 transition">
                        <span>🏪</span> Dashboard Seller
                    </Link>
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-100 p-2">
               <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center gap-3 text-left px-6 py-3.5 text-sm text-red-600 font-bold hover:bg-red-50 rounded-xl transition">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                 Keluar
               </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 bg-white rounded-3xl shadow-xl shadow-gray-100 p-6 md:p-10 border border-white">
          <div className="border-b border-gray-100 pb-6 mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{activeTab === 'biodata' ? 'Profil Saya' : activeTab === 'address' ? 'Alamat Saya' : 'Riwayat Pembayaran'}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === 'biodata' && "Kelola informasi profil Anda untuk mengontrol, melindungi dan mengamankan akun."}
              {activeTab === 'address' && "Kelola alamat pengiriman barang agar Mang Asep tidak nyasar."}
              {activeTab === 'history' && "Lihat kembali jejak tawar-menawar legendaris Anda."}
            </p>
          </div>

          {activeTab === 'biodata' && <BiodataContent userData={userData} setUserData={setUserData} handleSave={handleSave} isSaving={isSaving} fileInputRef={fileInputRef} handleImageChange={handleImageChange} />}
          {activeTab === 'address' && <AddressContent userData={userData} setUserData={setUserData} handleSave={handleSave} isSaving={isSaving} />}
          {activeTab === 'history' && <RiwayatBelanjaContent />}
        </div>
      </main>
    </div>
  );
}