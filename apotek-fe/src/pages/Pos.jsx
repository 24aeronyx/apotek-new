import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Printer,
  Tag,
  AlertTriangle,
  UserCheck,
  FileText,
} from "lucide-react";
import apiClient from "../api/axios";
import branding from "../config/branding";

export default function Pos() {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);

  // State E-Resep & Kunjungan
  const [pendingVisits, setPendingVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);

  // State Transaksi & Pembayaran
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [discountType, setDiscountType] = useState("PERCENT"); // 'PERCENT' atau 'NOMINAL'
  const [discountValue, setDiscountValue] = useState(0);
  const [payAmount, setPayAmount] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Load Katalog Obat
  const fetchDrugs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/drugs");
      if (res.data.success) setDrugs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load Antrean E-Resep
  const fetchPendingPrescriptions = async () => {
    try {
      const res = await apiClient.get("/sales/pending-prescriptions");
      if (res.data.success) setPendingVisits(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDrugs();
    fetchPendingPrescriptions();
  }, []);

  // Set Otomatis Nominal Bayar Jika Bukan CASH
  useEffect(() => {
    if (paymentMethod !== "CASH") {
      setPayAmount("");
    }
  }, [paymentMethod]);

  // Load E-Resep ke Keranjang Belanja
  const handleSelectVisit = (visit) => {
    setSelectedVisit(visit);

    const prescriptions = visit.rme?.prescriptions || visit.prescriptions || [];

    const newCart = prescriptions.map((pres) => {
      // Ambil objek obat baik dari pres.drug atau cari dari state drugs
      const drugInfo =
        pres.drug || drugs.find((d) => d.id === pres.drug_id) || {};

      return {
        drug_id: pres.drug_id || drugInfo.id,
        name: drugInfo.name || pres.drug_name || `Obat ID: ${pres.drug_id}`,
        unit: drugInfo.unit || pres.unit || "pcs",
        unit_price: Number(
          drugInfo.selling_price || pres.price || pres.unit_price || 0,
        ),
        max_stock: drugInfo.total_stock ?? 999,
        nearest_ed: drugInfo.batches?.[0]?.expired_date || "-",
        qty: Number(pres.quantity || pres.qty || 1),
      };
    });

    setCart(newCart);
  };

  // Reset Antrean Pasien
  const handleClearVisitSelection = () => {
    setSelectedVisit(null);
    setCart([]);
  };

  // Tambah Obat Manual ke Keranjang
  const addToCart = (drug) => {
    if (drug.total_stock <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.drug_id === drug.id);
      if (existing) {
        if (existing.qty >= drug.total_stock) {
          alert("Jumlah melebihi sisa stok yang tersedia!");
          return prevCart;
        }
        return prevCart.map((item) =>
          item.drug_id === drug.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }

      const nearestEd = drug.batches?.[0]?.expired_date || "-";

      return [
        ...prevCart,
        {
          drug_id: drug.id,
          name: drug.name,
          unit: drug.unit,
          unit_price: Number(drug.selling_price || 0),
          max_stock: drug.total_stock,
          nearest_ed: nearestEd,
          qty: 1,
        },
      ];
    });
  };

  // Update Kuantitas
  const updateQty = (drugId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.drug_id === drugId) {
            const newQty = item.qty + delta;
            if (newQty > item.max_stock) {
              alert("Kuantitas melebihi sisa stok!");
              return item;
            }
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean),
    );
  };

  const removeItem = (drugId) => {
    setCart((prevCart) => prevCart.filter((item) => item.drug_id !== drugId));
  };

  // Kalkulasi Diskon & Total
  const subtotal = cart.reduce(
    (sum, item) => sum + item.qty * item.unit_price,
    0,
  );

  let calculatedDiscount = 0;
  if (discountType === "PERCENT") {
    calculatedDiscount = (subtotal * (Number(discountValue) || 0)) / 100;
  } else {
    calculatedDiscount = Number(discountValue) || 0;
  }

  const finalTotal = Math.max(0, subtotal - calculatedDiscount);
  const changeAmount = Math.max(0, Number(payAmount) - finalTotal);

  const handleQuickCash = (amount) => {
    setPayAmount(amount);
  };

  // Process Checkout
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Keranjang belanja masih kosong!");
    if (paymentMethod === "CASH" && Number(payAmount) < finalTotal) {
      return alert("Nominal pembayaran tunai kurang!");
    }

    setCheckoutLoading(true);
    try {
      const payload = {
        visit_id: selectedVisit ? selectedVisit.id : null,
        patient_id: selectedVisit ? selectedVisit.patient_id : null,
        payment_method: paymentMethod,
        discount_amount: calculatedDiscount,
        pay_amount: paymentMethod === "CASH" ? Number(payAmount) : finalTotal,
        change_amount: paymentMethod === "CASH" ? changeAmount : 0,
        items: cart.map((item) => ({
          drug_id: item.drug_id,
          qty: item.qty,
          unit_price: item.unit_price,
        })),
      };

      const res = await apiClient.post("/sales", payload);
      if (res.data.success) {
        setReceiptData({
          ...res.data.data,
          pay_amount: payload.pay_amount,
          change_amount: payload.change_amount,
        });
        setCart([]);
        setSelectedVisit(null);
        setPayAmount("");
        setDiscountValue(0);
        fetchDrugs();
        fetchPendingPrescriptions();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memproses transaksi");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredDrugs = drugs.filter((d) => {
    const isActive = Boolean(
      d.is_active === true ||
      d.is_active === 1 ||
      d.is_active === "1" ||
      d.is_active === "true",
    );
    const searchLower = search.toLowerCase();
    const matchesSearch =
      (d.name && d.name.toLowerCase().includes(searchLower)) ||
      (d.code && d.code.toLowerCase().includes(searchLower));

    return isActive && matchesSearch;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-5.5rem)] overflow-hidden">
      {/* ================= KOLOM KIRI: KATALOG OBAT & E-RESEP ================= */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Antrean E-Resep Dokter Banner */}
        {/* Antrean Tagihan UNPAID / E-Resep Banner */}
        {pendingVisits.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-bold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <FileText className="w-4 h-4 text-amber-600" />
              <span>
                Ada <strong>{pendingVisits.length}</strong> Tagihan UNPAID (RME
                / E-Resep)
              </span>
            </div>

            <div className="flex gap-1.5 overflow-x-auto max-w-xl">
              {pendingVisits.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectVisit(v)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
                    selectedVisit?.id === v.id
                      ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300"
                      : "bg-white text-amber-900 border-amber-300 hover:bg-amber-100 cursor-pointer"
                  }`}
                >
                  <span>{v.patient?.name || v.patient_name || "Pasien"}</span>
                  <span className="text-[9px] opacity-80">
                    ({v.visit_number || `RM-${v.id}`})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Ketik kode atau nama obat (Paracetamol, Amoxicillin)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Catalog Grid Container */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-20 text-slate-400 text-xs">
              Memuat katalog obat...
            </div>
          ) : filteredDrugs.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs">
              Obat tidak ditemukan.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredDrugs.map((drug) => {
                const nearestEd = drug.batches?.[0]?.expired_date || null;
                const isOutOfStock = drug.total_stock <= 0;

                return (
                  <button
                    key={drug.id}
                    onClick={() => addToCart(drug)}
                    disabled={isOutOfStock}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between h-36 transition-all relative ${
                      !isOutOfStock
                        ? "bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer active:scale-95"
                        : "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {drug.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            !isOutOfStock
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          Stok: {drug.total_stock}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs line-clamp-2 leading-snug">
                        {drug.name}
                      </h4>
                    </div>

                    <div>
                      {nearestEd && (
                        <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3 h-3" /> ED: {nearestEd}
                        </p>
                      )}
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-emerald-600 text-xs">
                          Rp{" "}
                          {Number(drug.selling_price).toLocaleString("id-ID")}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          /{drug.unit}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= KOLOM KANAN: KERANJANG & CHECKOUT ================= */}
      <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Keranjang Transaksi
              </h3>
              <p className="text-[10px] text-slate-400">
                {selectedVisit
                  ? `Resep: ${selectedVisit.patient?.name}`
                  : "Kasir Apotek Direct Sales"}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
            {cart.length} Item
          </span>
        </div>

        {/* Selected Patient Banner if Visit Selected */}
        {selectedVisit && (
          <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900 font-semibold">
            <div className="flex items-center gap-1.5 truncate">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">
                {selectedVisit.patient?.name} ({selectedVisit.visit_number})
              </span>
            </div>
            <button
              onClick={handleClearVisitSelection}
              className="text-[10px] text-red-500 hover:underline shrink-0 ml-2"
            >
              Batal
            </button>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-xs font-medium">Belum ada obat terpilih</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.drug_id}
                className="pt-3 first:pt-0 flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-slate-800 text-xs truncate">
                    {item.name}
                  </h5>
                  <p className="text-[10px] text-slate-400">
                    Rp {item.unit_price.toLocaleString("id-ID")} × {item.qty}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQty(item.drug_id, -1)}
                    className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-xs w-6 text-center">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.drug_id, 1)}
                    className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeItem(item.drug_id)}
                    className="p-1 text-red-400 hover:bg-red-50 rounded-lg ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Calculations & Payment Area */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
          {/* Subtotal & Diskon */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800">
                Rp {subtotal.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1">
                <Tag className="w-3 h-3 text-emerald-600" /> Diskon
              </span>
              <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden w-40">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="bg-slate-100 text-[10px] font-bold p-1 border-r border-slate-300 focus:outline-none"
                >
                  <option value="PERCENT">%</option>
                  <option value="NOMINAL">Rp</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full text-right p-1 text-xs font-bold outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            {calculatedDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 text-[11px] font-semibold">
                <span>Potongan Diskon:</span>
                <span>- Rp {calculatedDiscount.toLocaleString("id-ID")}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-extrabold text-slate-800 pt-2 border-t border-slate-200">
              <span>Total Akhir</span>
              <span className="text-emerald-600">
                Rp {finalTotal.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Payment Method & Input Bayar */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Metode
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
              >
                <option value="CASH">CASH / Tunai</option>
                <option value="QRIS">QRIS</option>
                <option value="DEBIT">Kartu Debit</option>
                <option value="TRANSFER">Transfer</option>
                <option value="BPJS">BPJS</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Bayar (Cash)
              </label>
              <input
                type="number"
                disabled={paymentMethod !== "CASH"}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-right disabled:bg-slate-100"
                placeholder={paymentMethod === "CASH" ? "0" : "Pas"}
              />
            </div>
          </div>

          {/* Quick Cash Buttons */}
          {paymentMethod === "CASH" && (
            <div className="flex gap-1.5 overflow-x-auto pt-1">
              <button
                type="button"
                onClick={() => handleQuickCash(finalTotal)}
                className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold hover:bg-emerald-200"
              >
                Uang Pas
              </button>
              {[10000, 20000, 50000, 100000].map((nominal) => (
                <button
                  key={nominal}
                  type="button"
                  onClick={() => handleQuickCash(nominal)}
                  className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-300"
                >
                  {nominal / 1000}k
                </button>
              ))}
            </div>
          )}

          {/* Kembalian */}
          {paymentMethod === "CASH" && Number(payAmount) > 0 && (
            <div className="flex justify-between text-xs bg-emerald-100/70 p-2 rounded-xl text-emerald-800 font-bold">
              <span>Kembalian:</span>
              <span>Rp {changeAmount.toLocaleString("id-ID")}</span>
            </div>
          )}

          {/* Submit Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkoutLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md active:scale-98"
          >
            <CreditCard className="w-4 h-4" />
            {checkoutLoading ? "Memproses..." : "Selesaikan Transaksi"}
          </button>
        </div>
      </div>

      {/* ================= MODAL STRUK DETAIL ================= */}
      {receiptData && (
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
                    {receiptData.invoice_number}
                  </strong>
                </p>
                <p className="flex justify-between">
                  <span>Tgl/Waktu:</span>{" "}
                  <span>
                    {new Date(
                      receiptData.created_at || Date.now(),
                    ).toLocaleString("id-ID")}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Kasir:</span>{" "}
                  <span>{receiptData.cashier?.name || "Admin"}</span>
                </p>
                {receiptData.patient && (
                  <p className="flex justify-between">
                    <span>Pasien:</span> <span>{receiptData.patient.name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Rincian Item Obat */}
            <div className="py-3 space-y-2 border-b border-dashed border-slate-300 max-h-48 overflow-y-auto print:max-h-none print:overflow-visible">
              {receiptData.sale_items?.map((item, idx) => (
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
                  Rp{" "}
                  {Number(
                    receiptData.total_amount || receiptData.final_amount,
                  ).toLocaleString("id-ID")}
                </span>
              </div>

              {Number(receiptData.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon:</span>
                  <span>
                    - Rp{" "}
                    {Number(receiptData.discount_amount).toLocaleString(
                      "id-ID",
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
                <span>Total Akhir:</span>
                <span className="text-emerald-700">
                  Rp {Number(receiptData.final_amount).toLocaleString("id-ID")}
                </span>
              </div>

              <div className="pt-2 space-y-0.5 text-slate-600 text-[11px]">
                <div className="flex justify-between">
                  <span>Metode Bayar:</span>
                  <span className="font-bold">
                    {receiptData.payment_method}
                  </span>
                </div>
                {receiptData.payment_method === "CASH" && (
                  <>
                    <div className="flex justify-between">
                      <span>Tunai Diterima:</span>
                      <span>
                        Rp{" "}
                        {Number(
                          receiptData.pay_amount || receiptData.final_amount,
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Kembalian:</span>
                      <span>
                        Rp{" "}
                        {Number(receiptData.change_amount || 0).toLocaleString(
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
                -- {branding.receiptFooter} --
              </p>
              <p>Obat yang sudah dibeli tidak dapat dikembalikan</p>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-2 mt-5 print:hidden font-sans">
              <button
                type="button"
                onClick={() => setReceiptData(null)}
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
