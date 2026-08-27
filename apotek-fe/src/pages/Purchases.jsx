import { useEffect, useState } from "react";
import {
  FileText,
  PlusCircle,
  Printer,
  Eye,
  Trash2,
  Plus,
  Building2,
} from "lucide-react";
import apiClient from "../api/axios";

export default function Purchases() {
  const [invoices, setInvoices] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [form, setForm] = useState({
    supplier_id: "", // Dikosongkan default-nya
    invoice_number: "",
    invoice_date: new Date().toISOString().split("T")[0],
    ppn_type: "NONE",
    notes: "",
    items: [
      {
        drug_id: "",
        batch_number: "",
        expired_date: "",
        qty: 1,
        purchase_price: 0,
        discount: 0,
      },
    ],
  });

  // Fetch Supplier Dropdown
  const fetchSuppliers = async () => {
    try {
      const res = await apiClient.get("/suppliers?all=true");
      if (res.data.success) {
        const list = Array.isArray(res.data.data) ? res.data.data : [];
        setSuppliers(list);

        // Hanya isi supplier_id jika form belum memiliki pilihan
        if (list.length > 0) {
          setForm((prev) => ({
            ...prev,
            supplier_id: prev.supplier_id || list[0].id,
          }));
        }
      }
    } catch (e) {
      console.error("Gagal memuat supplier:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, drugRes] = await Promise.all([
        apiClient.get("/purchase-invoices"),
        apiClient.get("/drugs"),
      ]);
      if (invRes.data.success) {
        setInvoices(invRes.data.data?.data || invRes.data.data || []);
      }
      if (drugRes.data.success) {
        setDrugs(drugRes.data.data?.data || drugRes.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchData();
  }, []);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post("/suppliers", newSupplier);
      if (res.data.success) {
        alert("Supplier PBF berhasil ditambahkan!");

        // Refetch supplier dengan parameter ?all=true
        await fetchSuppliers();

        // Auto pilih supplier baru
        const newId = res.data.data?.id;
        if (newId) {
          setForm((prevForm) => ({ ...prevForm, supplier_id: newId }));
        }

        setNewSupplier({ name: "", phone: "", address: "" });
        setShowSupplierModal(false);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal menambahkan supplier PBF");
    }
  };

  const handleAddItem = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          drug_id: "",
          batch_number: "",
          expired_date: "",
          qty: 1,
          purchase_price: 0,
          discount: 0,
        },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    if (form.items.length === 1)
      return alert("Faktur minimal berisi 1 barang!");
    const updated = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: updated });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...form.items];
    updated[index][field] = value;
    setForm({ ...form, items: updated });
  };

  // Kalkulasi Ringkasan
  const rawSubtotal = form.items.reduce((sum, item) => {
    const price = Number(item.purchase_price) || 0;
    const qty = Number(item.qty) || 0;
    const disc = Number(item.discount) || 0;
    return sum + (qty * price - disc);
  }, 0);

  let ppnAmount = 0;
  let grandTotal = rawSubtotal;

  if (form.ppn_type === "EXCLUDE") {
    ppnAmount = rawSubtotal * 0.11;
    grandTotal = rawSubtotal + ppnAmount;
  } else if (form.ppn_type === "INCLUDE") {
    const base = rawSubtotal / 1.11;
    ppnAmount = rawSubtotal - base;
    grandTotal = rawSubtotal;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier_id) {
      return alert("Silakan pilih Supplier / PBF terlebih dahulu!");
    }
    try {
      await apiClient.post("/purchase-invoices", form);
      setShowModal(false);
      setForm({
        supplier_id: suppliers[0]?.id || "",
        invoice_number: "",
        invoice_date: new Date().toISOString().split("T")[0],
        ppn_type: "NONE",
        notes: "",
        items: [
          {
            drug_id: "",
            batch_number: "",
            expired_date: "",
            qty: 1,
            purchase_price: 0,
            discount: 0,
          },
        ],
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menyimpan faktur");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Faktur Pembelian Obat (PBF)
          </h1>
          <p className="text-sm text-slate-500">
            Penerimaan stok obat & kalkulasi PPN faktur supplier
          </p>
        </div>
        <button
          onClick={() => {
            fetchSuppliers(); // Refetch data supplier terbaru
            setShowModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium"
        >
          <PlusCircle className="w-5 h-5" /> Input Faktur Baru
        </button>
      </div>

      {/* Tabel Utama Riwayat Faktur */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th className="p-4">No. Faktur</th>
              <th className="p-4">Supplier / PBF</th>
              <th className="p-4">Tgl Faktur</th>
              <th className="p-4">Tipe PPN</th>
              <th className="p-4">Grand Total</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  Memuat faktur...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  Belum ada faktur pembelian terdaftar.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-slate-800">
                    {inv.invoice_number}
                  </td>
                  <td className="p-4 font-bold text-slate-700">
                    {inv.supplier?.name || "-"}
                  </td>
                  <td className="p-4">{inv.invoice_date}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                      {inv.ppn_type}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-emerald-600">
                    Rp {Number(inv.grand_total).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium text-xs flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-4 h-4" /> Buka Faktur
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal View Faktur Cetak */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-300 text-slate-800 font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
                  FAKTUR PEMBELIAN OBAT
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Supplier/PBF:{" "}
                  <strong className="text-slate-800">
                    {selectedInvoice.supplier?.name || "Umum"}
                  </strong>
                </p>
                {selectedInvoice.supplier?.address && (
                  <p className="text-xs text-slate-400">
                    {selectedInvoice.supplier.address}
                  </p>
                )}
              </div>
              <div className="text-right text-xs space-y-1">
                <p>
                  <span className="text-slate-500">No. Faktur:</span>{" "}
                  <strong className="font-mono text-sm text-slate-800">
                    {selectedInvoice.invoice_number}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Tgl Faktur:</span>{" "}
                  {selectedInvoice.invoice_date}
                </p>
              </div>
            </div>

            {/* Tabel Detail Rincian Barang */}
            <div className="border border-slate-200 rounded-lg overflow-hidden my-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3">Nama Obat / Produk</th>
                    <th className="p-3">No. Batch</th>
                    <th className="p-3">ED</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3">Harga Beli</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800">
                          {item.drug?.name || "Obat"}
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {item.batch?.batch_number || "-"}
                        </td>
                        <td className="p-3 text-slate-600">
                          {item.batch?.expired_date || "-"}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          {item.qty}
                        </td>
                        <td className="p-3">
                          Rp{" "}
                          {Number(item.purchase_price || 0).toLocaleString(
                            "id-ID",
                          )}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-800">
                          Rp{" "}
                          {Number(item.subtotal || 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-4 text-center text-slate-400 italic"
                      >
                        Tidak ada rincian item dalam faktur ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 mt-8 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Cetak Faktur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input Faktur Baru */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border flex flex-col max-h-[92vh]">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b">
              Input Faktur Pembelian Supplier (PBF)
            </h3>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto space-y-5 pr-1"
            >
              {/* Header Info Faktur Termasuk Supplier */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Supplier / PBF *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSupplierModal(true)}
                      className="text-[10px] text-emerald-600 font-bold hover:underline"
                    >
                      + PBF Baru
                    </button>
                  </div>
                  <select
                    required
                    value={form.supplier_id}
                    onChange={(e) =>
                      setForm({ ...form, supplier_id: e.target.value })
                    }
                    className="w-full p-2.5 border rounded-xl font-bold text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">-- Pilih Supplier / PBF --</option>
                    {suppliers && suppliers.length > 0 ? (
                      suppliers.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name} {sup.code ? `(${sup.code})` : ""}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        Data supplier belum tersedia
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Faktur PBF
                  </label>
                  <input
                    type="text"
                    required
                    value={form.invoice_number}
                    onChange={(e) =>
                      setForm({ ...form, invoice_number: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                    placeholder="Contoh: FK-PBF-9901"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Faktur
                  </label>
                  <input
                    type="date"
                    required
                    value={form.invoice_date}
                    onChange={(e) =>
                      setForm({ ...form, invoice_date: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Skema PPN
                  </label>
                  <select
                    value={form.ppn_type}
                    onChange={(e) =>
                      setForm({ ...form, ppn_type: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-slate-800"
                  >
                    <option value="NONE">Tanpa PPN (Non-PPN)</option>
                    <option value="EXCLUDE">Belum PPN (Exclude 11%)</option>
                    <option value="INCLUDE">Sudah PPN (Include 11%)</option>
                  </select>
                </div>
              </div>

              {/* Rincian Tabel Barang */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-64">Nama Obat / Produk</th>
                      <th className="p-3 w-32">No. Batch</th>
                      <th className="p-3 w-32">ED (Kedaluwarsa)</th>
                      <th className="p-3 w-20">Qty</th>
                      <th className="p-3 w-32">Harga Beli (Satuan)</th>
                      <th className="p-3 w-28">Potongan (Rp)</th>
                      <th className="p-3 w-32 text-right">Subtotal</th>
                      <th className="p-3 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {form.items.map((item, idx) => {
                      const itemSubtotal =
                        (Number(item.qty) || 0) *
                          (Number(item.purchase_price) || 0) -
                        (Number(item.discount) || 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2">
                            <select
                              required
                              value={item.drug_id}
                              onChange={(e) =>
                                handleItemChange(idx, "drug_id", e.target.value)
                              }
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                            >
                              <option value="">-- Pilih Obat --</option>
                              {drugs.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name} ({d.unit})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              placeholder="Batch"
                              value={item.batch_number}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "batch_number",
                                  e.target.value,
                                )
                              }
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              required
                              value={item.expired_date}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "expired_date",
                                  e.target.value,
                                )
                              }
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.qty}
                              onChange={(e) =>
                                handleItemChange(idx, "qty", e.target.value)
                              }
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-center"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              required
                              min="0"
                              value={item.purchase_price}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "purchase_price",
                                  e.target.value,
                                )
                              }
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={item.discount}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "discount",
                                  e.target.value,
                                )
                              }
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-right font-bold text-slate-800">
                            Rp{" "}
                            {Math.max(0, itemSubtotal).toLocaleString("id-ID")}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Baris"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-600 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Tambah Baris Obat
              </button>

              {/* Summary Kalkulasi Faktur */}
              <div className="flex justify-end pt-2">
                <div className="w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal DPP:</span>
                    <span className="font-semibold">
                      Rp {rawSubtotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>PPN (11%):</span>
                    <span className="font-semibold">
                      Rp {ppnAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-800 pt-2 border-t border-slate-300">
                    <span>Grand Total Faktur:</span>
                    <span className="text-emerald-600">
                      Rp {grandTotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm"
                >
                  Simpan Faktur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quick Add Supplier */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border">
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" /> Registrasi
              Supplier / PBF Baru
            </h3>
            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Perusahaan / PBF
                </label>
                <input
                  type="text"
                  required
                  value={newSupplier.name}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, name: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg text-xs"
                  placeholder="PT. Kimia Farma / PT. Enseval"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  No. Telepon / Sales
                </label>
                <input
                  type="text"
                  value={newSupplier.phone}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, phone: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Alamat Kantor PBF
                </label>
                <textarea
                  rows="2"
                  value={newSupplier.address}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, address: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                >
                  Simpan Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
