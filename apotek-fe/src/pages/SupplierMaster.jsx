import { useEffect, useState } from "react";
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import apiClient from "../api/axios";

export default function SupplierMaster() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    npwp: "",
    is_active: true,
  });

  // Modal Confirm Delete State
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    id: null,
    name: "",
  });

  // Toast Notification State
  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast({ show: false, type: "success", message: "" });
    }, 3500);
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/suppliers?search=${search}&page=${page}`
      );
      if (res.data.success) {
        if (res.data.data?.data) {
          setSuppliers(res.data.data.data);
          setPagination(res.data.data);
        } else {
          setSuppliers(Array.isArray(res.data.data) ? res.data.data : []);
          setPagination({});
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data supplier:", err);
      triggerToast("Gagal memuat data supplier", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    fetchSuppliers();
  }, [page, search]);

  const handleOpenModal = (sup = null) => {
    if (sup) {
      setEditingSupplier(sup);
      setForm({
        code: sup.code || "",
        name: sup.name || "",
        phone: sup.phone || "",
        email: sup.email || "",
        address: sup.address || "",
        npwp: sup.npwp || "",
        is_active: sup.is_active ?? true,
      });
    } else {
      setEditingSupplier(null);
      setForm({
        code: "",
        name: "",
        phone: "",
        email: "",
        address: "",
        npwp: "",
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await apiClient.put(`/suppliers/${editingSupplier.id}`, form);
        triggerToast("Data supplier berhasil diperbarui!", "success");
      } else {
        await apiClient.post("/suppliers", form);
        triggerToast("Supplier baru berhasil ditambahkan!", "success");
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      triggerToast(
        err.response?.data?.message || "Gagal menyimpan data supplier",
        "error"
      );
    }
  };

  const openDeleteModal = (id, name) => {
    setDeleteConfirm({ show: true, id, name });
  };

  const handleExecuteDelete = async () => {
    try {
      await apiClient.delete(`/suppliers/${deleteConfirm.id}`);
      triggerToast(
        `Supplier ${deleteConfirm.name} berhasil dihapus!`,
        "success"
      );
      setDeleteConfirm({ show: false, id: null, name: "" });
      fetchSuppliers();
    } catch (err) {
      triggerToast(
        err.response?.data?.message || "Gagal menghapus supplier",
        "error"
      );
      setDeleteConfirm({ show: false, id: null, name: "" });
    }
  };

  return (
    <div className="space-y-6 font-sans relative">
      {/* TOAST NOTIFIKASI */}
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-7 h-7 text-emerald-600" /> Master Supplier & PBF
          </h1>
          <p className="text-sm text-slate-500">
            Kelola data distributor farmasi dan vendor pengadaan obat
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Tambah Supplier Baru
        </button>
      </div>

      {/* Bar Pencarian */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari Nama Supplier, Kode, atau No. Telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Tabel Supplier */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
            <tr>
              <th className="p-4">Supplier / PBF</th>
              <th className="p-4">Kontak</th>
              <th className="p-4">Alamat</th>
              <th className="p-4">NPWP</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  Memuat data supplier...
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  Belum ada data supplier terdaftar.
                </td>
              </tr>
            ) : (
              suppliers.map((sup) => (
                <tr
                  key={sup.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="p-4">
                    <p className="font-bold text-slate-800 text-sm">
                      {sup.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {sup.code}
                    </p>
                  </td>
                  <td className="p-4 space-y-0.5">
                    <p className="text-slate-700 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />{" "}
                      {sup.phone || "-"}
                    </p>
                    <p className="text-slate-500 text-[10px] flex items-center gap-1 font-mono">
                      <Mail className="w-3 h-3 text-slate-400" />{" "}
                      {sup.email || "-"}
                    </p>
                  </td>
                  <td className="p-4 max-w-xs truncate text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {sup.address || "-"}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-600">
                    {sup.npwp || "-"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sup.is_active !== false
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sup.is_active !== false ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(sup)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(sup.id, sup.name)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* CONTROLS PAGINATION FOOTER */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-slate-200 text-xs gap-3">
          <p className="text-slate-500 font-medium">
            Menampilkan <span className="font-bold text-slate-800">{pagination.from || 0}</span> -{" "}
            <span className="font-bold text-slate-800">{pagination.to || 0}</span> dari{" "}
            <span className="font-bold text-slate-800">{pagination.total || 0}</span> data
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
              disabled={page === pagination.last_page || !pagination.last_page || loading}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
            >
              Selanjutnya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL INPUT / EDIT SUPPLIER */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 font-sans">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editingSupplier ? "Edit Data Supplier" : "Tambah Supplier Baru"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingSupplier
                      ? "Perbarui profil PBF / distributor"
                      : "Daftarkan PBF penyedia obat & alkes"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Kode Supplier
                  </label>
                  <input
                    type="text"
                    placeholder="Auto: SUP-XXXX"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-xs"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Nama PBF / Distributor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT. Kimia Farma Trading"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    No. Telepon / WA
                  </label>
                  <input
                    type="text"
                    placeholder="021-555666 / 081234567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Email Kantor
                  </label>
                  <input
                    type="email"
                    placeholder="sales@pbf.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  No. NPWP (Faktur Pajak)
                </label>
                <input
                  type="text"
                  placeholder="00.000.000.0-000.000"
                  value={form.npwp}
                  onChange={(e) => setForm({ ...form, npwp: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Alamat Lengkap Kantor
                </label>
                <textarea
                  rows="2"
                  placeholder="Jl. Gatot Subroto No. 12, Jakarta"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                ></textarea>
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
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" /> Simpan Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center font-sans">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-800 mb-1">
              Hapus Supplier?
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus data supplier{" "}
              <strong className="text-slate-800">{deleteConfirm.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setDeleteConfirm({ show: false, id: null, name: "" })
                }
                className="w-full py-2.5 border border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}