import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Calendar,
  X,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import apiClient from "../api/axios";

export default function StockOpname() {
  const [auditList, setAuditList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, COMPLETED, PENDING
  const [summary, setSummary] = useState({
    total: 0,
    completed: 0,
    pending: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  ); // YYYY-MM

  // Pagination State
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Modal Audit State
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [physicalQty, setPhysicalQty] = useState("");
  const [reason, setReason] = useState("Sesuai Hitung Fisik");

  // Toast Notification State
  const [toast, setToast] = useState({
    show: false,
    type: "success", // 'success' | 'error'
    message: "",
  });

  // Helper Toast
  const triggerToast = (message, type = "success") => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast({ show: false, type: "success", message: "" });
    }, 3500);
  };

  // Fetch API dengan Handling Pagination Aman
  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/stock-opnames?month=${selectedMonth}&search=${search}&status=${filterStatus}&page=${page}`,
      );
      if (res.data.success) {
        if (res.data.data?.data) {
          setAuditList(res.data.data.data);
          setPagination(res.data.data);
        } else {
          setAuditList(Array.isArray(res.data.data) ? res.data.data : []);
          setPagination({});
        }

        // Simpan statistik ringkasan global dari backend
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data stok opname:", err);
      triggerToast("Gagal memuat lembar audit stok", "error");
    } finally {
      setLoading(false);
    }
  };

  // Reset ke halaman 1 jika filter, pencarian, atau bulan berubah
  useEffect(() => {
    setPage(1);
  }, [selectedMonth, search, filterStatus]);

  // Fetch ulang data ketika page, month, search, atau status berubah
  useEffect(() => {
    fetchAuditData();
  }, [page, selectedMonth, search, filterStatus]);

  const handleOpenOpnameModal = (item) => {
    setSelectedItem(item);
    setPhysicalQty(
      item.is_opnamed ? item.last_opname.physical_qty : item.system_qty,
    );
    setReason("Hasil Hitung Fisik Opname");
    setShowModal(true);
  };

  const handleSubmitOpname = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post("/stock-opnames", {
        drug_batch_id: selectedItem.batch_id,
        physical_qty: Number(physicalQty),
        reason: reason,
      });
      if (res.data.success) {
        triggerToast("Data stok opname berhasil disimpan!", "success");
        setShowModal(false);
        fetchAuditData();
      }
    } catch (err) {
      triggerToast(
        err.response?.data?.message || "Gagal menyimpan opname",
        "error",
      );
    }
  };

  // Safe fallback counts jika data menggunakan pagination dari server
  const totalCount = pagination.total || auditList.length;
  const completedCount = auditList.filter((i) => i.is_opnamed).length;
  const pendingCount = auditList.filter((i) => !i.is_opnamed).length;

  return (
    <div className="space-y-6 font-sans relative">
      {/* TOAST POP-UP NOTIFIKASI */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-100 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold ${
              toast.type === "success"
                ? "bg-emerald-800 text-white border-emerald-700"
                : "bg-red-800 text-white border-red-700"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            ) : (
              <XCircle className="w-5 h-5 text-red-300" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast({ ...toast, show: false })}
              className="p-1 hover:bg-white/10 rounded-lg ml-2"
            >
              <X className="w-3.5 h-3.5 text-white/70" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-emerald-600" /> Sistem Stok
            Opname Bulanan
          </h1>
          <p className="text-sm text-slate-500">
            Daftar audit fisik seluruh obat & batch per periode bulan
          </p>
        </div>

        {/* Filter Periode Bulan */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-600">Periode:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold text-slate-800 border-none outline-none bg-transparent cursor-pointer"
          />
        </div>
      </div>

      {/* Progress Cards (Statistik Keseluruhan Database) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Total Batch Obat
            </p>
            <h3 className="text-xl font-bold text-slate-800">
              {summary.total} Batch
            </h3>
          </div>
          <ClipboardCheck className="w-8 h-8 text-slate-400 opacity-40" />
        </div>
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase">
              Sudah Di-Opname
            </p>
            <h3 className="text-xl font-bold text-emerald-800">
              {summary.completed} Batch
            </h3>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase">
              Belum Di-Opname
            </p>
            <h3 className="text-xl font-bold text-amber-800">
              {summary.pending} Batch
            </h3>
          </div>
          <AlertCircle className="w-8 h-8 text-amber-600" />
        </div>
      </div>

      {/* Bar Pencarian & Filter Status */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama obat, kode, atau nomor batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === "ALL"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Semua ({summary.total})
          </button>
          <button
            onClick={() => setFilterStatus("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === "PENDING"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            Belum ({summary.pending})
          </button>
          <button
            onClick={() => setFilterStatus("COMPLETED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === "COMPLETED"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            Sudah ({summary.completed})
          </button>
        </div>
      </div>
      {/* Tabel Utama Audit Stok */}
      {/* Tabel Utama Audit Stok */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">
              <tr>
                <th className="p-4">Obat / Produk</th>
                <th className="p-4">No. Batch & ED</th>
                <th className="p-4">Stok Sistem</th>
                <th className="p-4">Hasil Fisik</th>
                <th className="p-4">Selisih</th>
                <th className="p-4">Status Opname</th>
                <th className="p-4">Auditor / Waktu</th>
                <th className="p-4 text-right">Aksi Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 whitespace-nowrap">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    Memuat lembar audit stok...
                  </td>
                </tr>
              ) : auditList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    Tidak ada data obat dalam periode ini.
                  </td>
                </tr>
              ) : (
                auditList.map((item) => (
                  <tr
                    key={item.batch_id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* 1. Nama Obat & Kode */}
                    <td className="p-4">
                      <p className="font-bold text-slate-800">
                        {item.drug_name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {item.drug_code}
                      </p>
                    </td>

                    {/* 2. No. Batch & ED */}
                    <td className="p-4">
                      <p className="font-mono font-semibold text-slate-700">
                        {item.batch_number}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        ED: {item.expired_date}
                      </p>
                    </td>

                    {/* 3. Stok Sistem */}
                    <td className="p-4 font-bold text-slate-700">
                      {item.system_qty} {item.unit}
                    </td>

                    {/* 4. Hasil Fisik */}
                    <td className="p-4 font-bold text-slate-900">
                      {item.is_opnamed
                        ? `${item.last_opname.physical_qty} ${item.unit}`
                        : "-"}
                    </td>

                    {/* 5. Selisih */}
                    <td className="p-4">
                      {item.is_opnamed ? (
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold ${
                            item.last_opname.difference_qty === 0
                              ? "bg-slate-100 text-slate-600"
                              : item.last_opname.difference_qty > 0
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.last_opname.difference_qty > 0
                            ? `+${item.last_opname.difference_qty}`
                            : item.last_opname.difference_qty}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* 6. Status Opname */}
                    <td className="p-4">
                      {item.is_opnamed ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Sudah Audit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          <AlertCircle className="w-3 h-3" /> Belum Audit
                        </span>
                      )}
                    </td>

                    {/* 7. Kolom Khusus Auditor & Waktu Audit */}
                    <td className="p-4">
                      {item.is_opnamed ? (
                        <div>
                          <p className="font-bold text-slate-800 text-xs">
                            {item.last_opname.user_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.last_opname.date).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">-</span>
                      )}
                    </td>

                    {/* 8. Tombol Aksi */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenOpnameModal(item)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                          item.is_opnamed
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        }`}
                      >
                        {item.is_opnamed ? "Re-Audit" : "Opname Now"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLS PAGINATION FOOTER */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-slate-200 text-xs gap-3">
          <p className="text-slate-500 font-medium">
            Menampilkan{" "}
            <span className="font-bold text-slate-800">
              {pagination.from || 0}
            </span>{" "}
            -{" "}
            <span className="font-bold text-slate-800">
              {pagination.to || 0}
            </span>{" "}
            dari{" "}
            <span className="font-bold text-slate-800">
              {pagination.total || 0}
            </span>{" "}
            data
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl">
              {pagination.current_page || 1} / {pagination.last_page || 1}
            </span>
            <button
              disabled={
                page === pagination.last_page ||
                !pagination.last_page ||
                loading
              }
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
            >
              Selanjutnya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form Opname */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 font-sans">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Audit Fisik: {selectedItem.drug_name}
                </h3>
                <p className="text-xs text-slate-400">
                  Batch:{" "}
                  <strong className="font-mono text-slate-700">
                    {selectedItem.batch_number}
                  </strong>{" "}
                  | ED: {selectedItem.expired_date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOpname} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  Stok Menurut Sistem:
                </span>
                <span className="font-bold text-slate-800">
                  {selectedItem.system_qty} {selectedItem.unit}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Jumlah Hitung Fisik (Aktual) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={physicalQty}
                  onChange={(e) => setPhysicalQty(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Keterangan / Alasan *
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Misal: Fisik Sesuai / Pecah / Kadaluarsa"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all"
                >
                  Simpan Opname
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
