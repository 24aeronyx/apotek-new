import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Printer,
  RotateCcw,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
} from "lucide-react";
import apiClient from "../api/axios";
import branding from "../config/branding";

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // State filter status

  // Pagination States
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pagination, setPagination] = useState({});

  // Modal States
  const [selectedSale, setSelectedSale] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState(
    "Pasien Salah Beli / Tukar Obat"
  );

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/sales?page=${page}&search=${search}`);
      if (res.data.success) {
        const salesData = res.data.data;
        if (salesData?.data) {
          setSales(salesData.data);
          setPagination(salesData);
        } else {
          setSales(Array.isArray(salesData) ? salesData : []);
          setPagination({});
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [page, search]);

  // Handler Retur Transaksi
  const handleProcessReturn = async (e) => {
    e.preventDefault();
    if (!selectedSale) return;

    try {
      const res = await apiClient.post(`/sales/${selectedSale.id}/return`, {
        reason: returnReason,
      });
      if (res.data.success) {
        alert(
          "Retur berhasil! Stok obat telah dikembalikan ke batch inventory."
        );
        setShowReturnModal(false);
        setSelectedSale(null);
        fetchSales();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal meretur transaksi");
    }
  };

  // Client-Side Filter Fallback (Termasuk Filter Status)
  const filteredSales = sales.filter((s) => {
    const matchSearch = s.invoice_number
      ?.toLowerCase()
      .includes(search.toLowerCase());
    
    // Asumsi properti status bisa berupa s.status atau s.payment_status
    const currentStatus = (s.payment_status || s.status || "PAID").toUpperCase();
    const matchStatus =
      statusFilter === "ALL" ? true : currentStatus === statusFilter;

    return matchSearch && matchStatus;
  });

  const isServerPaginated = Boolean(pagination.total);
  const totalItems = isServerPaginated ? pagination.total : filteredSales.length;
  const lastPage = isServerPaginated
    ? pagination.last_page
    : Math.ceil(filteredSales.length / perPage) || 1;

  const displaySales = isServerPaginated
    ? filteredSales
    : filteredSales.slice((page - 1) * perPage, page * perPage);

  const fromItem = isServerPaginated
    ? pagination.from || 0
    : filteredSales.length > 0
    ? (page - 1) * perPage + 1
    : 0;

  const toItem = isServerPaginated
    ? pagination.to || 0
    : Math.min(page * perPage, filteredSales.length);

  // Helper Render Badge Status
  const renderStatusBadge = (sale) => {
    const status = (sale.payment_status || sale.status || "PAID").toUpperCase();

    switch (status) {
      case "RETURNED":
      case "CANCELLED":
        return (
          <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <X className="w-3 h-3" /> DIRETUR
          </span>
        );
      case "UNPAID":
      case "PENDING":
        return (
          <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> UNPAID
          </span>
        );
      case "PARTIAL":
        return (
          <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> SEBAGIAN
          </span>
        );
      case "PAID":
      default:
        return (
          <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> PAID
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Audit & Riwayat Penjualan Kasir
        </h1>
        <p className="text-sm text-slate-500">
          Cetak ulang struk transaksi, pantau tagihan unpaid, dan proses retur obat konsumen
        </p>
      </div>

      {/* Bar Pencarian, Filter Status & Refresh */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nomor invoice (INV/...)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {/* Dropdown Filter Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-700"
        >
          <option value="ALL">Semua Status</option>
          <option value="PAID">PAID (Lunas)</option>
          <option value="UNPAID">UNPAID (Belum Bayar)</option>
          <option value="RETURNED">DIRETUR</option>
        </select>

        <button
          onClick={fetchSales}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          title="Refresh Data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabel Penjualan */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th className="p-4">No. Invoice</th>
              <th className="p-4">Waktu Transaksi</th>
              <th className="p-4">Metode Bayar</th>
              <th className="p-4">Total Akhir</th>
              <th className="p-4">Status Bayar</th>
              <th className="p-4 text-right">Aksi Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  Memuat riwayat penjualan...
                </td>
              </tr>
            ) : displaySales.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  Tidak ada riwayat penjualan ditemukan.
                </td>
              </tr>
            ) : (
              displaySales.map((sale) => {
                const isReturned = sale.status === "RETURNED" || sale.payment_status === "RETURNED";
                
                return (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-slate-800">
                      {sale.invoice_number}
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(sale.created_at).toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      {sale.payment_method || "-"}
                    </td>
                    <td className="p-4 font-bold text-emerald-600">
                      Rp {Number(sale.final_amount).toLocaleString("id-ID")}
                    </td>
                    <td className="p-4">
                      {renderStatusBadge(sale)}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-4 h-4" /> Detail / Cetak
                      </button>
                      {!isReturned && (
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setShowReturnModal(true);
                          }}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" /> Retur
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer Navigation Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-slate-200 text-xs gap-3">
          <p className="text-slate-500 font-medium">
            Menampilkan{" "}
            <span className="font-bold text-slate-800">{fromItem}</span> -{" "}
            <span className="font-bold text-slate-800">{toItem}</span> dari{" "}
            <span className="font-bold text-slate-800">{totalItems}</span> data
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl">
              {page} / {lastPage}
            </span>
            <button
              disabled={page >= lastPage || loading}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
            >
              Selanjutnya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Struk Penjualan */}
      {selectedSale && !showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xs w-full p-6 shadow-2xl border border-slate-200 text-xs font-mono">
            {/* Header Struk */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <h3 className="font-bold text-slate-900 text-base font-sans tracking-wide">
                {branding.name}
              </h3>
              <p className="text-[10px] text-slate-500 font-sans">
                {branding.license}
              </p>
              <p className="text-[10px] text-slate-500 font-sans">
                {branding.address}
              </p>
              <div className="pt-2 text-[10px] text-slate-600 text-left space-y-0.5 font-mono">
                <p className="flex justify-between">
                  <span>No. Inv:</span>{" "}
                  <strong className="text-slate-800">
                    {selectedSale.invoice_number}
                  </strong>
                </p>
                <p className="flex justify-between">
                  <span>Tgl/Waktu:</span>{" "}
                  <span>
                    {new Date(selectedSale.created_at).toLocaleString("id-ID")}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Kasir:</span>{" "}
                  <span>{selectedSale.cashier?.name || "Admin"}</span>
                </p>
              </div>
            </div>

            {/* Rincian Item Obat */}
            <div className="py-3 space-y-2 border-b border-dashed border-slate-300 max-h-52 overflow-y-auto print:max-h-none print:overflow-visible">
              {selectedSale.sale_items?.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <p className="font-bold text-slate-800 truncate">
                    {item.drug?.name}
                  </p>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>
                      {item.qty} x Rp{" "}
                      {Number(item.unit_price).toLocaleString("id-ID")}
                    </span>
                    <span className="font-semibold text-slate-800">
                      Rp {Number(item.subtotal).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rincian Perhitungan Transaksi & Pembayaran */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>
                  Rp {Number(selectedSale.total_amount).toLocaleString("id-ID")}
                </span>
              </div>

              {Number(selectedSale.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon:</span>
                  <span>
                    - Rp{" "}
                    {Number(selectedSale.discount_amount).toLocaleString(
                      "id-ID"
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
                <span>Total Akhir:</span>
                <span className="text-emerald-700">
                  Rp {Number(selectedSale.final_amount).toLocaleString("id-ID")}
                </span>
              </div>

              <div className="pt-2 space-y-0.5 text-slate-600 text-[11px]">
                <div className="flex justify-between">
                  <span>Status Tagihan:</span>
                  <span className="font-bold uppercase text-slate-800">
                    {selectedSale.payment_status || selectedSale.status || "PAID"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Metode Bayar:</span>
                  <span className="font-bold">
                    {selectedSale.payment_method || "-"}
                  </span>
                </div>
                {selectedSale.payment_method === "CASH" && (
                  <>
                    <div className="flex justify-between">
                      <span>Tunai Diterima:</span>
                      <span>
                        Rp{" "}
                        {Number(
                          selectedSale.pay_amount || selectedSale.final_amount
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Kembalian:</span>
                      <span>
                        Rp{" "}
                        {Number(selectedSale.change_amount || 0).toLocaleString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer Struk */}
            <div className="pt-3 text-center text-[10px] text-slate-400 space-y-1 font-sans">
              <p className="font-semibold text-slate-600">
                -- {branding.receiptFooter} --
              </p>
              <p>Obat yang sudah dibeli tidak dapat dikembalikan</p>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-2 mt-5 print:hidden font-sans">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="flex-1 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50 text-xs"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-1 hover:bg-emerald-700 text-xs shadow-sm"
              >
                <Printer className="w-4 h-4" /> Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Retur Transaksi */}
      {selectedSale && showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-red-600" /> Retur Transaksi
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowReturnModal(false);
                  setSelectedSale(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessReturn} className="mt-4 space-y-4">
              <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-xs text-red-800 space-y-1">
                <p className="font-bold">Perhatian:</p>
                <p>
                  Anda akan membatalkan invoice{" "}
                  <strong>{selectedSale.invoice_number}</strong>. Seluruh stok
                  obat pada transaksi ini akan dikembalikan ke inventory.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Retur / Pembatalan
                </label>
                <textarea
                  required
                  rows="3"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="Masukkan alasan retur..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedSale(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Proses Retur Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}