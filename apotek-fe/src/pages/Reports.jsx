import { useEffect, useState } from "react";
import { Calendar, FileDown, FileText, ReceiptText, RefreshCw } from "lucide-react";
import apiClient from "../api/axios";
import branding from "../config/branding";

const today = new Date().toISOString().slice(0, 10);
const REPORT_LABELS = { sales: "Penjualan", purchases: "Pembelian", visits: "Kunjungan" };

export default function Reports() {
  const [type, setType] = useState("sales");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [summary, setSummary] = useState({});
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(`/reports?type=${type}&from=${from}&to=${to}`);
      if (response.data.success) {
        setSummary(response.data.summary || {});
        setRows(response.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat laporan");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [type, from, to]);

  const money = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
  const period = `${new Date(from).toLocaleDateString("id-ID")} - ${new Date(to).toLocaleDateString("id-ID")}`;
  const downloadPdf = async () => {
    const response = await apiClient.get(`/reports/pdf?type=${type}&from=${from}&to=${to}`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-${type}-${from}-${to}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div><h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><FileText className="w-7 h-7 text-emerald-600" /> Laporan</h1><p className="text-sm text-slate-500">Ringkasan operasional, penjualan, pembelian, dan kunjungan.</p></div>
        <button type="button" onClick={downloadPdf} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm"><FileDown className="w-4 h-4" /> Download PDF</button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-3 lg:items-end print:hidden">
        <div className="flex-1"><label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Jenis Laporan</label><div className="grid grid-cols-3 gap-2"><button type="button" onClick={() => setType("sales")} className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${type === "sales" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "border-slate-200 text-slate-500"}`}><ReceiptText className="w-4 h-4" /> Penjualan</button><button type="button" onClick={() => setType("purchases")} className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${type === "purchases" ? "bg-amber-50 border-amber-300 text-amber-700" : "border-slate-200 text-slate-500"}`}><FileText className="w-4 h-4" /> Pembelian</button><button type="button" onClick={() => setType("visits")} className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${type === "visits" ? "bg-blue-50 border-blue-300 text-blue-700" : "border-slate-200 text-slate-500"}`}><FileText className="w-4 h-4" /> Kunjungan</button></div></div>
        <div><label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Dari</label><div className="relative"><Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs" /></div></div>
        <div><label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Sampai</label><div className="relative"><Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs" /></div></div>
        <button type="button" onClick={fetchReport} className="p-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <section className="space-y-5" id="report-print-area">
        <div className="hidden print:block border-b border-slate-300 pb-4"><h1 className="text-xl font-bold">{branding.name}</h1><p className="text-sm">Laporan {REPORT_LABELS[type]}</p><p className="text-xs text-slate-500">{branding.address} · Periode: {period}</p></div>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 print:hidden">{error}</div>}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Summary label="Dokumen" value={summary.document_count || 0} />
          {type === "sales" ? <><Summary label="Lunas" value={summary.paid_count || 0} /><Summary label="Unpaid" value={summary.unpaid_count || 0} /><Summary label="Total Lunas" value={money(summary.total_amount)} /></> : type === "purchases" ? <><Summary label="Total Nilai" value={money(summary.total_amount)} /><Summary label="Jenis Laporan" value="Pembelian" /><Summary label="Periode" value={period} /></> : <><Summary label="Selesai" value={summary.completed_count || 0} /><Summary label="Menunggu" value={summary.waiting_count || 0} /><Summary label="Periode" value={period} /></>}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500"><tr>{type === "sales" ? <><th className="p-4">Invoice</th><th className="p-4">Tanggal</th><th className="p-4">Pasien</th><th className="p-4">Metode</th><th className="p-4">Status</th><th className="p-4 text-right">Nilai</th></> : type === "purchases" ? <><th className="p-4">Faktur</th><th className="p-4">Tanggal</th><th className="p-4">Supplier</th><th className="p-4">Input Oleh</th><th className="p-4 text-right">Nilai</th></> : <><th className="p-4">No. Kunjungan</th><th className="p-4">Tanggal</th><th className="p-4">Pasien</th><th className="p-4">Dokter</th><th className="p-4">Status</th><th className="p-4">Diagnosa</th></>}</tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="6" className="p-10 text-center text-slate-400">Memuat laporan...</td></tr> : rows.length === 0 ? <tr><td colSpan="6" className="p-10 text-center text-slate-400">Tidak ada data pada periode ini.</td></tr> : rows.map((row) => type === "sales" ? <tr key={row.id}><td className="p-4 font-mono font-bold">{row.invoice_number}</td><td className="p-4">{new Date(row.created_at).toLocaleString("id-ID")}</td><td className="p-4">{row.patient?.name || "Umum"}</td><td className="p-4">{row.payment_method}</td><td className="p-4"><span className="px-2 py-1 rounded-full bg-slate-100 font-bold">{row.status}</span></td><td className="p-4 text-right font-bold text-emerald-600">{money(row.final_amount)}</td></tr> : type === "purchases" ? <tr key={row.id}><td className="p-4 font-mono font-bold">{row.invoice_number}</td><td className="p-4">{row.invoice_date}</td><td className="p-4">{row.supplier?.name || "-"}</td><td className="p-4">{row.creator?.name || "-"}</td><td className="p-4 text-right font-bold text-amber-600">{money(row.grand_total)}</td></tr> : <tr key={row.id}><td className="p-4 font-mono font-bold">{row.visit_number}</td><td className="p-4">{new Date(row.created_at).toLocaleString("id-ID")}</td><td className="p-4">{row.patient?.name || "-"}</td><td className="p-4">{row.doctor?.name || row.rme?.doctor?.name || "-"}</td><td className="p-4"><span className="px-2 py-1 rounded-full bg-slate-100 font-bold">{row.status}</span></td><td className="p-4">{row.rme?.assessment || "-"}</td></tr>)}</tbody></table></div>
        <p className="text-[10px] text-slate-400 print:block">Dicetak pada {new Date().toLocaleString("id-ID")}. Nilai pembelian adalah nilai barang masuk dan belum otomatis berarti pembayaran kas.</p>
      </section>
    </div>
  );
}

function Summary({ label, value }) {
  return <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="text-lg font-extrabold text-slate-800 mt-1 truncate">{value}</p></div>;
}
