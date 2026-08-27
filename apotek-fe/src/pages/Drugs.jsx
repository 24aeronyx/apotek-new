import { useEffect, useState, Fragment } from "react";
import {
  Pill,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
  Search,
  ChevronRight,
  ChevronDown,
  PackageCheck,
} from "lucide-react";
import apiClient from "../api/axios";

export default function Drugs() {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);

  // Form States
  const [drugForm, setDrugForm] = useState({
    code: "",
    name: "",
    unit: "Strip",
    purchase_price: "",
    selling_price: "",
    batch_number: "",
    expired_date: "",
    initial_stock: "",
  });
  const [batchForm, setBatchForm] = useState({
    batch_number: "",
    expired_date: "",
    stock_qty: "",
  });

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

  useEffect(() => {
    fetchDrugs();
  }, []);

  const handleCreateDrug = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/drugs", drugForm);
      setShowAddModal(false);
      setDrugForm({
        code: "",
        name: "",
        unit: "Strip",
        purchase_price: "",
        selling_price: "",
        batch_number: "",
        expired_date: "",
        initial_stock: "",
      });
      fetchDrugs();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menambahkan obat");
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/drugs/${selectedDrug.id}/batches`, batchForm);
      setShowBatchModal(false);
      setBatchForm({ batch_number: "", expired_date: "", stock_qty: "" });
      fetchDrugs();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menambah batch");
    }
  };

  const filteredDrugs = drugs.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()),
  );

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
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          Tambah Obat Baru
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode atau nama obat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <button
          onClick={fetchDrugs}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
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
                <td colSpan="7" className="p-8 text-center text-slate-500">
                  Memuat data obat...
                </td>
              </tr>
            ) : filteredDrugs.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500">
                  Tidak ada data obat ditemukan.
                </td>
              </tr>
            ) : (
              filteredDrugs.map((drug) => {
                const isExpanded = expandedRow === drug.id;
                return (
                  // GANTI <div className="contents"> MENJADI <Fragment key={drug.id}>
                  <Fragment key={drug.id}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
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
                      <td className="p-4">{drug.unit}</td>
                      <td className="p-4 text-slate-600">
                        Rp {Number(drug.purchase_price).toLocaleString("id-ID")}
                      </td>
                      <td className="p-4 font-medium text-emerald-600">
                        Rp {Number(drug.selling_price).toLocaleString("id-ID")}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${drug.total_stock > 10 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {drug.total_stock} {drug.unit}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedDrug(drug);
                            setShowBatchModal(true);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                        >
                          + Batch Stok
                        </button>
                      </td>
                    </tr>

                    {/* Sub-Table Batch FEFO */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan="7" className="p-4 pl-14">
                          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-inner">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <PackageCheck className="w-4 h-4 text-emerald-600" />
                              Daftar Batch Stok Aktif (Diurutkan Berdasarkan
                              FEFO - Expiry Terdekat)
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
                                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
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
                  </Fragment> // PENUTUP FRAGMENT
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah Obat */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Pendaftaran Master Obat & Batch Awal
            </h3>
            <form onSubmit={handleCreateDrug} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Kode Obat
                  </label>
                  <input
                    type="text"
                    required
                    value={drugForm.code}
                    onChange={(e) =>
                      setDrugForm({ ...drugForm, code: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg text-sm"
                    placeholder="OBT-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Nama Obat
                  </label>
                  <input
                    type="text"
                    required
                    value={drugForm.name}
                    onChange={(e) =>
                      setDrugForm({ ...drugForm, name: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg text-sm"
                    placeholder="Paracetamol"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    required
                    value={drugForm.unit}
                    onChange={(e) =>
                      setDrugForm({ ...drugForm, unit: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Harga Beli
                  </label>
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
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Harga Jual
                  </label>
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
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <hr className="my-2 border-slate-200" />
              <p className="text-xs font-semibold text-emerald-600">
                Stok Batch Perdana
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    No. Batch
                  </label>
                  <input
                    type="text"
                    required
                    value={drugForm.batch_number}
                    onChange={(e) =>
                      setDrugForm({ ...drugForm, batch_number: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg text-sm"
                    placeholder="BCH-01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Expired Date
                  </label>
                  <input
                    type="date"
                    required
                    value={drugForm.expired_date}
                    onChange={(e) =>
                      setDrugForm({ ...drugForm, expired_date: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Stok Awal
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
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Batch Baru */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Restock Batch Baru
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Obat:{" "}
              <strong className="text-slate-700">{selectedDrug?.name}</strong>
            </p>
            <form onSubmit={handleAddBatch} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nomor Batch Baru
                </label>
                <input
                  type="text"
                  required
                  value={batchForm.batch_number}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, batch_number: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg text-sm"
                  placeholder="BCH-NEW"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Tanggal Kedaluwarsa
                  </label>
                  <input
                    type="date"
                    required
                    value={batchForm.expired_date}
                    onChange={(e) =>
                      setBatchForm({
                        ...batchForm,
                        expired_date: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Jumlah Stok Masuk
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={batchForm.stock_qty}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, stock_qty: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium"
                >
                  Tambah Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
