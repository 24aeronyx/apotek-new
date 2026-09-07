import { useEffect, useState } from "react";
import {
  Calendar,
  ClipboardList,
  FileDown,
  Package,
  Search,
  UserRound,
} from "lucide-react";
import apiClient from "../api/axios";
import branding from "../config/branding";

const REFERENCE_LABELS = {
  INITIAL_STOCK: "Stok awal",
  RESTOCK: "Restock",
  PURCHASE_INVOICE: "Belanja / faktur pembelian",
  SALE: "Transaksi penjualan",
  SALE_RETURN: "Retur penjualan",
  STOCK_ADJUSTMENT: "Penyesuaian opname",
};

export default function StockCard() {
  const [drugs, setDrugs] = useState([]);
  const [selectedDrugId, setSelectedDrugId] = useState("");
  const [card, setCard] = useState(null);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loadingDrugs, setLoadingDrugs] = useState(true);
  const [loadingCard, setLoadingCard] = useState(false);
  const [error, setError] = useState("");

  const fetchDrugs = async () => {
    setLoadingDrugs(true);
    try {
      const response = await apiClient.get(`/stock-cards?search=${encodeURIComponent(search)}`);
      if (response.data.success) setDrugs(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat daftar obat");
    } finally {
      setLoadingDrugs(false);
    }
  };

  const fetchCard = async (drugId = selectedDrugId) => {
    if (!drugId) {
      setCard(null);
      return;
    }

    setLoadingCard(true);
    setError("");
    try {
      const params = new URLSearchParams({ drug_id: drugId });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const response = await apiClient.get(`/stock-cards?${params.toString()}`);
      if (response.data.success) {
        setCard({ drug: response.data.drug, summary: response.data.summary, rows: response.data.data || [] });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat kartu stok");
      setCard(null);
    } finally {
      setLoadingCard(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, [search]);

  useEffect(() => {
    fetchCard();
  }, [selectedDrugId, from, to]);

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";

  const referenceLabel = (value) => REFERENCE_LABELS[value] || value || "Perubahan stok";

  const downloadPdf = async () => {
    const params = new URLSearchParams({ drug_id: selectedDrugId });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const response = await apiClient.get(`/stock-cards/pdf?${params.toString()}`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kartu-stok-${card.drug.code}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100vh-4rem)] min-h-0 flex flex-col gap-5 overflow-hidden print:h-auto print:overflow-visible">
      <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-emerald-600" /> Kartu Stok
          </h1>
          <p className="text-sm text-slate-500">Lacak setiap perubahan stok berdasarkan barang dan batch.</p>
        </div>
        {card && <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">Stok saat ini: {card.drug.current_stock} {card.drug.unit}</div>}
      </div>

      {card && <div className="hidden print:block border-b border-slate-300 pb-4"><h1 className="text-xl font-bold">{branding.name}</h1><p className="text-sm">Kartu Stok - {card.drug.name} ({card.drug.code})</p><p className="text-xs text-slate-500">{branding.address} · Periode: {from || "Awal"} s/d {to || "Hari ini"}</p></div>}

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-stretch overflow-y-auto lg:overflow-hidden">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0 lg:h-full print:hidden">
          <div className="p-4 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-2"><Package className="w-4 h-4 text-emerald-600" /> Pilih Barang</p>
            <div className="relative mt-3"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari obat..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-2">
            {loadingDrugs ? <p className="p-4 text-center text-xs text-slate-400">Memuat daftar obat...</p> : drugs.length === 0 ? <p className="p-4 text-center text-xs text-slate-400">Obat tidak ditemukan.</p> : drugs.map((drug) => <button key={drug.id} type="button" onClick={() => setSelectedDrugId(String(drug.id))} className={`w-full text-left p-3 rounded-xl transition-colors ${String(drug.id) === String(selectedDrugId) ? "bg-emerald-50 border border-emerald-200" : "hover:bg-slate-50 border border-transparent"}`}><p className="text-xs font-bold text-slate-800 truncate">{drug.name}</p><p className="text-[10px] text-slate-400 font-mono mt-0.5">{drug.code} · Stok {drug.total_stock} {drug.unit}</p></button>)}
          </div>
        </section>

        <section className="space-y-4 min-w-0 lg:h-full lg:min-h-0 lg:flex lg:flex-col">
          <div className="shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 sm:items-end print:hidden">
            <div className="flex-1"><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dari tanggal</label><div className="relative"><Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500" /></div></div>
            <div className="flex-1"><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sampai tanggal</label><div className="relative"><Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500" /></div></div>
            <button type="button" onClick={() => { setFrom(""); setTo(""); }} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">Semua Periode</button>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">{error}</div>}
          {!selectedDrugId ? <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center text-slate-400"><ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm font-semibold">Pilih obat untuk melihat kartu stok</p><p className="text-xs mt-1">Semua mutasi masuk, keluar, penjualan, pembelian, dan opname akan tampil di sini.</p></div> : loadingCard ? <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-xs text-slate-400">Memuat kartu stok...</div> : card && <>
            <div className="flex items-center justify-between"><div><p className="text-[10px] text-slate-400 font-mono">{card.drug.code}</p><h2 className="text-lg font-extrabold text-slate-800">{card.drug.name}</h2></div><div className="flex items-center gap-3"><span className="text-xs text-slate-500">Satuan: <b>{card.drug.unit}</b></span><button type="button" onClick={downloadPdf} className="print:hidden px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"><FileDown className="w-3.5 h-3.5" /> PDF</button></div></div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3"><Summary label="Saldo Awal" value={card.summary.opening_balance} color="slate" /><Summary label="Total Masuk" value={card.summary.total_in} color="emerald" /><Summary label="Total Keluar" value={card.summary.total_out} color="rose" /><Summary label="Saldo Akhir" value={card.summary.closing_balance} color="teal" /></div>
            <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-auto"><table className="w-full min-w-[820px] text-left text-xs"><thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 sticky top-0"><tr><th className="p-4">Tanggal</th><th className="p-4">Batch / ED</th><th className="p-4">Sumber Perubahan</th><th className="p-4 text-right">Masuk</th><th className="p-4 text-right">Keluar</th><th className="p-4 text-right">Saldo</th><th className="p-4">Petugas / Catatan</th></tr></thead><tbody className="divide-y divide-slate-100">{card.rows.length === 0 ? <tr><td colSpan="7" className="p-10 text-center text-slate-400">Tidak ada mutasi pada periode ini.</td></tr> : card.rows.map((row) => <tr key={row.id} className="hover:bg-slate-50/70"><td className="p-4 whitespace-nowrap text-slate-600">{formatDate(row.created_at)}</td><td className="p-4"><p className="font-mono font-bold text-slate-700">{row.batch_number}</p><p className="text-[10px] text-slate-400">ED: {row.expired_date || "-"}</p></td><td className="p-4"><p className="font-bold text-slate-700">{referenceLabel(row.reference_type)}</p>{row.reference_id && <p className="text-[10px] text-slate-400">Ref #{row.reference_id}</p>}</td><td className="p-4 text-right font-bold text-emerald-600">{row.qty_in ? `+${row.qty_in}` : "-"}</td><td className="p-4 text-right font-bold text-rose-600">{row.qty_out ? `-${row.qty_out}` : "-"}</td><td className="p-4 text-right font-extrabold text-slate-800">{row.balance}</td><td className="p-4 max-w-xs"><p className="flex items-center gap-1 font-semibold text-slate-700"><UserRound className="w-3 h-3 text-slate-400" />{row.created_by}</p><p className="text-[10px] text-slate-400 truncate" title={row.notes || ""}>{row.notes || "-"}</p></td></tr>)}</tbody></table></div>
          </>}
        </section>
      </div>
    </div>
  );
}

function Summary({ label, value, color }) {
  const colors = { slate: "bg-slate-50 border-slate-200 text-slate-800", emerald: "bg-emerald-50 border-emerald-200 text-emerald-700", rose: "bg-rose-50 border-rose-200 text-rose-700", teal: "bg-teal-50 border-teal-200 text-teal-700" };
  return <div className={`p-4 rounded-2xl border ${colors[color]}`}><p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p><p className="text-xl font-extrabold mt-1">{value}</p></div>;
}
