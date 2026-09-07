import { useEffect, useState } from "react";
import {
  Users,
  Search,
  UserPlus,
  Phone,
  CreditCard,
  Calendar,
  MapPin,
  Eye,
  HeartPulse,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Pencil,
} from "lucide-react";
import apiClient from "../api/axios";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // State Modal Form (Bisa untuk Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // State Modal Detail
  const [selectedPatient, setSelectedPatient] = useState(null);

  // State Error Modal & Submitting
  const [modalError, setModalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Pagination Server-Side
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
    total: 0,
  });

  const initialForm = {
    nik: "",
    bpjs_number: "",
    name: "",
    gender: "L",
    birth_date: "",
    phone: "",
    address: "",
  };

  const [form, setForm] = useState(initialForm);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/patients?search=${search}&page=${page}`
      );
      if (res.data.success) {
        const responseData = res.data.data;

        if (responseData.data) {
          setPatients(responseData.data);
          setPagination({
            current_page: responseData.current_page,
            last_page: responseData.last_page,
            from: responseData.from,
            to: responseData.to,
            total: responseData.total,
          });
        } else {
          setPatients(Array.isArray(responseData) ? responseData : []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  useEffect(() => {
    fetchPatients();
  }, [search, page]);

  const calculateAge = (birthDate) => {
    if (!birthDate) return "-";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} Thn`;
  };

  // Buka Modal untuk Mode Buat Baru
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm(initialForm);
    setModalError("");
    setShowModal(true);
  };

  // Buka Modal untuk Mode Edit Data Pasien
  const handleOpenEditModal = (patient) => {
    setIsEditing(true);
    setEditingId(patient.id);
    setForm({
      nik: patient.nik || "",
      bpjs_number: patient.bpjs_number || "",
      name: patient.name || "",
      gender: patient.gender || "L",
      birth_date: patient.birth_date || "",
      phone: patient.phone || "",
      address: patient.address || "",
    });
    setModalError("");
    setShowModal(true);
  };

  // Submit Handler (Bisa Create atau Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError("");

    if (form.nik && form.nik.length !== 16) {
      setModalError("NIK harus tepat 16 digit angka.");
      return;
    }

    if (form.bpjs_number && form.bpjs_number.length !== 13) {
      setModalError("Nomor Kartu BPJS harus tepat 13 digit angka.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await apiClient.put(`/patients/${editingId}`, form);
      } else {
        await apiClient.post("/patients", form);
      }
      
      setShowModal(false);
      setModalError("");
      setForm(initialForm);
      fetchPatients();
    } catch (err) {
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.bpjs_number?.[0] ||
        err.response?.data?.errors?.nik?.[0] ||
        "Gagal menyimpan data pasien. Periksa kembali form inputan.";
      setModalError(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalError("");
    setForm(initialForm);
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <HeartPulse className="w-7 h-7 text-emerald-600" /> Master Data Pasien
          </h1>
          <p className="text-sm text-slate-500">
            Manajemen demografi pasien dan penomoran Rekam Medis (RM)
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Registrasi Pasien Baru
        </button>
      </div>

      {/* Bar Search & Quick Stats */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Ketik NIK (16 digit), No. BPJS, No. RM, atau Nama Pasien..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <Users className="w-4 h-4 text-emerald-600" /> Total Pasien:{" "}
          <strong className="text-slate-800">
            {pagination.total || patients.length}
          </strong>
        </div>
      </div>

      {/* Tabel Data Pasien */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">No. RM & Nama Pasien</th>
                <th className="p-4">Identitas (NIK / BPJS)</th>
                <th className="p-4">Gender & Umur</th>
                <th className="p-4">Kontak (HP)</th>
                <th className="p-4">Alamat Domisili</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    Memuat data pasien...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    Data pasien tidak ditemukan.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-4">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border border-slate-200">
                        RM-{String(p.id).padStart(6, "0")}
                      </span>
                      <p className="font-bold text-slate-800 text-sm mt-1">
                        {p.name}
                      </p>
                    </td>

                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.nik || "-"}</span>
                      </div>
                      {p.bpjs_number && (
                        <span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                          BPJS: {p.bpjs_number}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-700">
                        {p.gender === "L" ? "Laki-laki" : "Perempuan"}
                      </p>
                      <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />{" "}
                        {calculateAge(p.birth_date)} ({p.birth_date})
                      </p>
                    </td>

                    <td className="p-4 font-mono text-slate-600">
                      {p.phone ? (
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />{" "}
                          {p.phone}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="p-4 text-slate-600 max-w-xs truncate">
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />{" "}
                        {p.address || "-"}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPatient(p)}
                          className="p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
                          title="Lihat Profil Pasien"
                        >
                          <Eye className="w-3.5 h-3.5" /> Profil
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 rounded-lg font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
                          title="Edit Data Pasien"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Controls Pagination */}
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
              className="px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
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
              className="px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
            >
              Selanjutnya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Registrasi / Edit Pasien */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Pencil className="w-5 h-5 text-amber-600" /> Edit Data Pasien
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 text-emerald-600" /> Registrasi Pasien Baru
                  </>
                )}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inline Alert Error */}
            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-800">Gagal Memproses Data</p>
                  <p className="mt-0.5">{modalError}</p>
                </div>
                <button
                  onClick={() => setModalError("")}
                  className="text-rose-400 hover:text-rose-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Pasien *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIK KTP (16 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength="16"
                    value={form.nik}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        nik: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    placeholder="3201xxxxxxxxxxxx"
                  />
                  {form.nik.length > 0 && form.nik.length !== 16 && (
                    <span className="text-[10px] text-amber-600 font-medium mt-1 block">
                      {form.nik.length}/16 digit
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Kartu BPJS (13 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength="13"
                    value={form.bpjs_number}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bpjs_number: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    placeholder="0001xxxxxxxx"
                  />
                  {form.bpjs_number.length > 0 &&
                    form.bpjs_number.length !== 13 && (
                      <span className="text-[10px] text-amber-600 font-medium mt-1 block">
                        {form.bpjs_number.length}/13 digit
                      </span>
                    )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm({ ...form, gender: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all bg-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Lahir *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.birth_date}
                    onChange={(e) =>
                      setForm({ ...form, birth_date: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. WhatsApp / HP
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                  placeholder="0812xxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  rows="2"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all resize-none"
                  placeholder="Jl. Merdeka No. X, RT/RW..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                    isEditing
                      ? "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300"
                      : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300"
                  }`}
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : isEditing
                    ? "Perbarui Pasien"
                    : "Simpan Pasien"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Profil Pasien */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center pb-4 border-b border-slate-100 relative">
              <button
                onClick={() => setSelectedPatient(null)}
                className="absolute right-0 top-0 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 font-bold rounded-full flex items-center justify-center text-xl mx-auto mb-2 border border-emerald-200">
                {selectedPatient.name.slice(0, 2).toUpperCase()}
              </div>
              <h3 className="font-bold text-slate-800 text-base">
                {selectedPatient.name}
              </h3>
              <p className="text-xs font-mono text-emerald-600 font-bold mt-0.5">
                No. RM: RM-{String(selectedPatient.id).padStart(6, "0")}
              </p>
            </div>

            <div className="py-4 space-y-2.5 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">NIK:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedPatient.nik || "-"}
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">No. BPJS:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {selectedPatient.bpjs_number || "-"}
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Jenis Kelamin / Usia:</span>
                <span className="font-semibold text-slate-800">
                  {selectedPatient.gender === "L" ? "Laki-laki" : "Perempuan"} (
                  {calculateAge(selectedPatient.birth_date)})
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Tgl Lahir:</span>
                <span className="text-slate-800">
                  {selectedPatient.birth_date}
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">No. Telepon:</span>
                <span className="font-mono text-slate-800">
                  {selectedPatient.phone || "-"}
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Alamat:</span>
                <span className="text-right max-w-200px text-slate-800">
                  {selectedPatient.address || "-"}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}