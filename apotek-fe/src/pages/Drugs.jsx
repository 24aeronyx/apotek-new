import { useEffect, useState, Fragment } from "react";
import {
  Pill,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  PackageCheck,
  Edit2,
  X,
  Barcode,
  Power,
  CheckCircle2,
  XCircle,
  FileCode,
} from "lucide-react";
import apiClient from "../api/axios";

export default function Drugs() {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  // State Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pagination, setPagination] = useState({});

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);

  // Form States (ditambahkan kfa_code)
  const [drugForm, setDrugForm] = useState({
    code: "",
    name: "",
    kfa_code: "",
    unit: "Strip",
    purchase_price: "",
    selling_price: "",
    min_stock: "10",
    is_active: true,
    batch_number: "",
    expired_date: "",
    initial_stock: "",
  });

  const [editForm, setEditForm] = useState({
    code: "",
    name: "",
    kfa_code: "",
    unit: "",
    purchase_price: "",
    selling_price: "",
    min_stock: "",
    is_active: true,
  });

  const fetchDrugs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/drugs?page=${page}&search=${search}`);
      if (res.data.success) {
        const resData = res.data.data;
        if (resData?.data) {
          setDrugs(resData.data);
          setPagination(resData);
        } else {
          setDrugs(Array.isArray(resData) ? resData : []);
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
    fetchDrugs();
  }, [page, search]);

  const handleCreateDrug = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/drugs", drugForm);
      setShowAddModal(false);
      setDrugForm({
        code: "",
        name: "",
        kfa_code: "",
        unit: "Strip",
        purchase_price: "",
        selling_price: "",
        min_stock: "10",
        is_active: true,
        batch_number: "",
        expired_date: "",
        initial_stock: "",
      });
      fetchDrugs();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menambahkan obat");
    }
  };

  const handleOpenEdit = (drug) => {
    setSelectedDrug(drug);
    setEditForm({
      code: drug.code || "",
      name: drug.name || "",
      kfa_code: drug.kfa_code || "",
      unit: drug.unit || "Strip",
      purchase_price: drug.purchase_price || "",
      selling_price: drug.selling_price || "",
      min_stock: drug.min_stock ?? 0,
      is_active: Boolean(drug.is_active),
    });
    setShowEditModal(true);
  };

  const handleUpdateDrug = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/drugs/${selectedDrug.id}`, editForm);
      setShowEditModal(false);
      fetchDrugs();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memperbarui data obat");
    }
  };

  const handleToggleActive = async (drug) => {
    try {
      await apiClient.put(`/drugs/${drug.id}`, {
        ...drug,
        is_active: !drug.is_active,
      });
      fetchDrugs();
    } catch (err) {
      alert("Gagal mengubah status obat");
    }
  };

  const filteredDrugs = drugs.filter(
    (d) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.code?.toLowerCase().includes(search.toLowerCase()) ||
      d.kfa_code?.toLowerCase().includes(search.toLowerCase())
  );

  const isServerPaginated = Boolean(pagination.total);
  const totalItems = isServerPaginated ? pagination.total : filteredDrugs.length;
  const lastPage = isServerPaginated
    ? pagination.last_page
    : Math.ceil(filteredDrugs.length / perPage) || 1;

  const displayDrugs = isServerPaginated
    ? filteredDrugs
    : filteredDrugs.slice((page - 1) * perPage, page * perPage);

  const fromItem = isServerPaginated
    ? pagination.from || 0
    : filteredDrugs.length > 0
    ? (page - 1) * perPage + 1
    : 0;

  const toItem = isServerPaginated
    ? pagination.to || 0
    : Math.min(page * perPage, filteredDrugs.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Master Obat & Stok Batch FEFO
          </h1>
          <p className="text-sm text-slate-500">
            Kelola inventaris obat berbasis tanggal kedaluwarsa terdekat
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-md transition-all active:scale-95 text-sm"
        >
          <PlusCircle className="w-5 h-5" />
          Tambah Obat Baru
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode, kode KFA, atau nama obat..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
          />
        </div>
        <button
          onClick={fetchDrugs}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="p-4 w-10"></th>
              <th className="p-4">Kode / Nama Obat</th>
              <th className="p-4">Status</th>
              <th className="p-4">Satuan</th>
              <th className="p-4">Harga Beli</th>
              <th className="p-4">Harga Jual</th>
              <th className="p-4">Total Stok</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-500">
                  Memuat data obat...
                </td>
              </tr>
            ) : displayDrugs.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-500">
                  Tidak ada data obat ditemukan.
                </td>
              </tr>
            ) : (
              displayDrugs.map((drug) => {
                const isExpanded = expandedRow === drug.id;
                const isActive = Boolean(drug.is_active);
                const isLowStock =
                  isActive && (drug.total_stock || 0) <= (drug.min_stock || 10);

                return (
                  <Fragment key={drug.id}>
                    <tr
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !isActive ? "bg-slate-50/50 opacity-60" : ""
                      }`}
                    >
                      <td
                        className="p-4 cursor-pointer"
                        onClick={() =>
                          setExpandedRow(isExpanded ? null : drug.id)
                        }
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-800">
                          {drug.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {drug.code}{" "}
                          {drug.kfa_code ? `• KFA: ${drug.kfa_code}` : ""}
                        </p>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(drug)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition-all ${
                            isActive
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                          }`}
                          title="Klik untuk mengubah status"
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" /> Non-Aktif
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4">{drug.unit}</td>
                      <td className="p-4 text-slate-600">
                        Rp {Number(drug.purchase_price || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="p-4 font-medium text-emerald-600">
                        Rp {Number(drug.selling_price || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            !isActive
                              ? "bg-slate-100 text-slate-500"
                              : isLowStock
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {drug.total_stock || 0} {drug.unit}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(drug)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                          title="Edit Obat"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>

                    {/* Sub-Table Batch FEFO */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan="8" className="p-4 pl-14">
                          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-inner">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <PackageCheck className="w-4 h-4 text-emerald-600" />
                              Daftar Batch Stok Aktif (FEFO - Expiry Terdekat)
                            </h4>
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-400">
                                  <th className="py-2">No. Batch</th>
                                  <th className="py-2">Tgl Kedaluwarsa (ED)</th>
                                  <th className="py-2">Sisa Stok</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {drug.batches && drug.batches.length > 0 ? (
                                  drug.batches.map((batch) => (
                                    <tr key={batch.id}>
                                      <td className="py-2 font-mono font-medium text-slate-700">
                                        {batch.batch_number}
                                      </td>
                                      <td className="py-2">
                                        <span className="flex items-center gap-1 text-slate-600">
                                          {isActive && (
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                          )}
                                          {batch.expired_date}
                                        </span>
                                      </td>
                                      <td className="py-2 font-bold text-slate-800">
                                        {batch.stock_qty} {drug.unit}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan="3"
                                      className="py-2 text-slate-400 italic"
                                    >
                                      Tidak ada batch stok aktif.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {/* CONTROLS PAGINATION FOOTER */}
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

      {/* Modal Tambah Obat */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-7 shadow-2xl border border-slate-100 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                    Pendaftaran Master Obat
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Tambah data obat baru beserta stok batch awal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDrug} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Kode Obat *
                  </label>
                  <div className="relative">
                    <Barcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={drugForm.code}
                      onChange={(e) =>
                        setDrugForm({ ...drugForm, code: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                      placeholder="OBT-001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Kode KFA (Opsional)
                  </label>
                  <div className="relative">
                    <FileCode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={drugForm.kfa_code}
                      onChange={(e) =>
                        setDrugForm({ ...drugForm, kfa_code: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                      placeholder="93000123"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Nama Obat *
                </label>
                <div className="relative">
                  <Pill className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={drugForm.name}
                    onChange={(e) =>
                      setDrugForm({ ...drugForm, name: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                    placeholder="Paracetamol 500mg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Satuan *
                  </label>
                  <input
                    type="text"
                    required
                    value={drugForm.unit}
                    onChange={(e) =>
                      setDrugForm({ ...drugForm, unit: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                    placeholder="Strip / Botol"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Harga Beli *
                  </label>
                  <div className="relative">
                    <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      value={drugForm.purchase_price}
                      onChange={(e) =>
                        setDrugForm({
                          ...drugForm,
                          purchase_price: e.target.value,
                        })
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Harga Jual *
                  </label>
                  <div className="relative">
                    <span className="text-xs font-bold text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      value={drugForm.selling_price}
                      onChange={(e) =>
                        setDrugForm({
                          ...drugForm,
                          selling_price: e.target.value,
                        })
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-600 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 pb-1 border-b border-slate-100">
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4" /> Stok Batch Perdana
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    No. Batch *
                  </label>
                  <input
                    type="text"
                    required
                    value={drugForm.batch_number}
                    onChange={(e) =>
                      setDrugForm({
                        ...drugForm,
                        batch_number: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                    placeholder="BCH-01"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Expired Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={drugForm.expired_date}
                    onChange={(e) =>
                      setDrugForm({
                        ...drugForm,
                        expired_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Stok Awal *
                  </label>
                  <input
                    type="number"
                    required
                    value={drugForm.initial_stock}
                    onChange={(e) =>
                      setDrugForm({
                        ...drugForm,
                        initial_stock: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="flex justify-end items-center gap-3 pt-6 mt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  Simpan Data Obat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Obat */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-7 shadow-2xl border border-slate-100 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                  <Edit2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                    Edit Master Obat
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Ubah rincian informasi obat & status ketersediaan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDrug} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Kode Obat *
                  </label>
                  <div className="relative">
                    <Barcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={editForm.code}
                      onChange={(e) =>
                        setEditForm({ ...editForm, code: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Kode KFA (Opsional)
                  </label>
                  <div className="relative">
                    <FileCode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={editForm.kfa_code}
                      onChange={(e) =>
                        setEditForm({ ...editForm, kfa_code: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                      placeholder="93000123"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Nama Obat *
                </label>
                <div className="relative">
                  <Pill className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Satuan *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.unit}
                    onChange={(e) =>
                      setEditForm({ ...editForm, unit: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Harga Beli *
                  </label>
                  <div className="relative">
                    <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      value={editForm.purchase_price}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          purchase_price: e.target.value,
                        })
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Harga Jual *
                  </label>
                  <div className="relative">
                    <span className="text-xs font-bold text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      value={editForm.selling_price}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          selling_price: e.target.value,
                        })
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-600 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Status Switch (Active / Inactive) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Status Obat
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Jika non-aktif, obat tidak muncul di kasir & dikecualikan dari warning stok.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditForm({ ...editForm, is_active: !editForm.is_active })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editForm.is_active ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editForm.is_active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  Perbarui Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}