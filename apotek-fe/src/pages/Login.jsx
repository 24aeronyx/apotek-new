import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Lock,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import apiClient from "../api/axios";
import branding from "../config/branding";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiClient.post("/login", { identifier, password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login gagal. Periksa username dan password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_85%_80%,rgba(45,212,191,0.12),transparent_30%)]" />
      <div className="relative w-full max-w-5xl min-h-[620px] bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-950/30 grid lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:flex bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full border-[36px] border-emerald-500/10" />
          <div className="absolute -left-32 bottom-16 w-80 h-80 rounded-full border-[48px] border-teal-400/10" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-900/50"><Activity className="w-7 h-7" /></div>
              <div><p className="font-extrabold text-xl tracking-tight">{branding.name}</p><p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">{branding.tagline}</p></div>
            </div>
            <div className="mt-28 max-w-sm">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Satu ruang kerja</p>
              <h2 className="text-4xl font-extrabold leading-tight tracking-tight">Layanan apotek yang rapi, cepat, dan terhubung.</h2>
              <p className="mt-5 text-sm leading-6 text-slate-400">Kelola kunjungan, resep, stok, dan transaksi dari satu sistem yang dibuat untuk tim klinik.</p>
            </div>
          </div>
          <div className="relative flex items-center gap-2 text-xs text-slate-400"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Akses setiap akun dikelola sesuai peran.</div>
        </section>

        <section className="p-7 sm:p-12 flex flex-col justify-center">
          <div className="lg:hidden flex items-center gap-3 mb-12"><div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600"><Activity className="w-6 h-6" /></div><div><p className="font-extrabold text-slate-900">{branding.name}</p><p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">{branding.tagline}</p></div></div>
          <div className="max-w-sm w-full mx-auto">
            <div className="mb-9"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-3">Selamat datang kembali</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Masuk ke ruang kerja Anda.</h1><p className="text-sm text-slate-500 mt-2">Gunakan username untuk melanjutkan.</p></div>

            {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-start gap-2.5"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}

            <form onSubmit={handleLogin} noValidate className="space-y-5">
              <div><label className="block text-xs font-bold text-slate-700 mb-2">Username</label><div className="relative"><UserRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" /><input name="identifier" type="text" required autoComplete="username" placeholder="contoh: admin" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50/60 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></div></div>
              <div><div className="flex justify-between items-center mb-2"><label className="block text-xs font-bold text-slate-700">Password</label><span className="text-[10px] text-slate-400">Akun klinik</span></div><div className="relative"><Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" /><input type="password" required autoComplete="current-password" placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50/60 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></div></div>
              <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.99]">{loading ? "Memproses..." : "Masuk ke Dashboard"}{!loading && <ArrowRight className="w-4 h-4" />}</button>
            </form>
            <p className="text-[10px] text-center text-slate-400 mt-8">Username juga dapat diisi dengan email terdaftar.</p>
          </div>
        </section>
      </div>
    </div>
  );
}