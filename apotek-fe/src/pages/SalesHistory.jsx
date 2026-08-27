import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Printer,
  RotateCcw,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import apiClient from "../api/axios";

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal States
  const [selectedSale, setSelectedSale] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState(
    "Pasien Salah Beli / Tukar Obat",
  );

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/sales");
      if (res.data.success) {
        const salesData = res.data.data;
        setSales(Array.isArray(salesData) ? salesData : salesData.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

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
          "Retur berhasil! Stok obat telah dikembalikan ke batch inventory.",
        );
        setShowReturnModal(false);
        setSelectedSale(null);
        fetchSales();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal meretur transaksi");
    }
  };

  const filteredSales = sales.filter((s) =>
    s.invoice_number.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Audit & Riwayat Penjualan Kasir
        </h1>
        <p className="text-sm text-slate-500">
          Cetak ulang struk transaksi dan proses retur obat konsumen
        </p>
      </div>

      {/* Bar Pencarian */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nomor invoice (INV/...)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
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
              <th className="p-4">Status</th>
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
            ) : filteredSales.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  Tidak ada riwayat penjualan ditemukan.
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-slate-800">
                    {sale.invoice_number}
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {new Date(sale.created_at).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 font-semibold text-slate-700">
                    {sale.payment_method}
                  </td>
                  <td className="p-4 font-bold text-emerald-600">
                    Rp {Number(sale.final_amount).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4">
                    {sale.status === "RETURNED" ? (
                      <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold">
                        DIRETUR
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold">
                        PAID
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedSale(sale)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" /> Detail / Cetak
                    </button>
                    {sale.status !== "RETURNED" && (
                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setShowReturnModal(true);
                        }}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-4 h-4" /> Retur
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail & Cetak Ulang Struk */}
      {selectedSale && !showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xs w-full p-6 shadow-2xl border border-slate-200 text-xs">
            {/* Header Struk */}
            <div className="text-center space-y-1 mb-4 border-b border-dashed pb-4">
              <h3 className="font-bold text-slate-800 text-lg">
                Apotek System
              </h3>
              <p className="text-slate-400 font-mono">
                {selectedSale.invoice_number}
              </p>
              <p className="text-[10px] text-slate-400">
                {new Date(selectedSale.created_at).toLocaleString("id-ID")}
              </p>
            </div>

            {/* Rincian Items (Akan mengembang sempurna saat diprint) */}
            <div className="space-y-2 divide-y divide-slate-100 max-h-48 overflow-y-auto print:max-h-none print:overflow-visible mb-4">
              {selectedSale.sale_items?.map((item, idx) => (
                <div key={idx} className="pt-2 flex justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {item.drug?.name}
                    </p>
                    <p className="text-slate-400">
                      {item.qty} x Rp{" "}
                      {Number(item.unit_price).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <span className="font-bold text-slate-700">
                    Rp {Number(item.subtotal).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>

            {/* Ringkasan Pembayaran */}
            <div className="border-t border-dashed pt-3 space-y-1">
              <div className="flex justify-between font-bold text-slate-800 text-sm">
                <span>Total:</span>
                <span className="text-emerald-600">
                  Rp {Number(selectedSale.final_amount).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Metode Bayar:</span>
                <span>{selectedSale.payment_method}</span>
              </div>
            </div>

            {/* Tombol Aksi (Disembunyikan otomatis saat diprint) */}
            <div className="flex gap-2 mt-6 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="flex-1 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-1 hover:bg-emerald-700"
              >
                <Printer className="w-4 h-4" /> Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail & Cetak Ulang Struk Lengkap */}
      {selectedSale && !showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xs w-full p-6 shadow-2xl border border-slate-200 text-xs font-mono">
            {/* Header Struk */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <h3 className="font-bold text-slate-900 text-base font-sans tracking-wide">
                APOTEK SEHAT BERSAMA
              </h3>
              <p className="text-[10px] text-slate-500 font-sans">
                SIPA: 446/001/SIPA/2026
              </p>
              <p className="text-[10px] text-slate-500 font-sans">
                Jl. Kesehatan No. 123, Kota
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
                      "id-ID",
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
                  <span>Metode Bayar:</span>
                  <span className="font-bold">
                    {selectedSale.payment_method}
                  </span>
                </div>
                {selectedSale.payment_method === "CASH" && (
                  <>
                    <div className="flex justify-between">
                      <span>Tunai Diterima:</span>
                      <span>
                        Rp{" "}
                        {Number(
                          selectedSale.pay_amount || selectedSale.final_amount,
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Kembalian:</span>
                      <span>
                        Rp{" "}
                        {Number(selectedSale.change_amount || 0).toLocaleString(
                          "id-ID",
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
                -- Terima Kasih & Semoga Lekas Sembuh --
              </p>
              <p>Obat yang sudah dibeli tidak dapat dikembalikan</p>
            </div>

            {/* Tombol Aksi (Disembunyikan saat dicetak) */}
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
    </div>
  );
}
