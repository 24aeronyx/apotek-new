import { useEffect, useState } from "react";
import {
  Stethoscope,
  Search,
  UserPlus,
  History,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Heart,
  Activity,
  Pill,
  Send,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  FileText,
  UserCheck,
  X,
  Sparkles,
} from "lucide-react";
import apiClient from "../api/axios";

export default function Rme() {
  // Master State Data
  const [visits, setVisits] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Filter Pencarian Kunjungan
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // 'ALL' | 'PENDING' | 'DONE'

  // State Pagination Server-Side Kunjungan
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
    total: 0,
  });

  // State Histori RME Samping
  const [selectedPatientHistory, setSelectedPatientHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // State Modal Kunjungan Baru
  const [showNewVisitModal, setShowNewVisitModal] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [selectedPatientObj, setSelectedPatientObj] = useState(null);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [modalError, setModalError] = useState("");

  // State Sesi Examination / Assesmen Aktif
  const [activeVisit, setActiveVisit] = useState(null);
  const [activeTab, setActiveTab] = useState("SOAP"); // 'SOAP' | 'RESEP'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toastNotification, setToastNotification] = useState({
    show: false,
    message: "",
    type: "success", // 'success' | 'error'
  });

  // Form SOAP Medis
  const [soap, setSoap] = useState({
    subjective: "",
    systole: "",
    diastole: "",
    heart_rate: "",
    temperature: "",
    respiration: "",
    assessment: "",
    icd10_code: "",
    plan: "",
  });

  // Form E-Resep Obat
  const [prescriptions, setPrescriptions] = useState([
    { drug_id: "", qty: 1, dose_instruction: "3x1 Tablet Setelah Makan" },
  ]);

  // 1. Fetch Daftar Kunjungan Pasien (Termasuk Filter Status & Pagination)
  const fetchVisits = async () => {
    setLoading(true);
    try {
      let url = `/visits?date=${filterDate}&search=${filterSearch}&page=${page}`;
      if (filterStatus !== "ALL") {
        url += `&status=${filterStatus}`;
      }

      const res = await apiClient.get(url);
      if (res.data.success) {
        const responseData = res.data.data;

        if (responseData && responseData.data) {
          setVisits(responseData.data);
          setPagination({
            current_page: responseData.current_page,
            last_page: responseData.last_page,
            from: responseData.from,
            to: responseData.to,
            total: responseData.total,
          });
        } else {
          setVisits(Array.isArray(responseData) ? responseData : []);
          setPagination({
            current_page: 1,
            last_page: 1,
            from: 1,
            to: (responseData || []).length,
            total: (responseData || []).length,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching visits:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Master Obat
  const fetchDrugs = async () => {
    try {
      const res = await apiClient.get("/drugs");
      if (res.data.success) {
        const dData = res.data.data;
        setDrugs(Array.isArray(dData) ? dData : dData?.data || []);
      }
    } catch (err) {
      console.error("Error fetching drugs:", err);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [filterDate, filterSearch, filterStatus, page]);

  useEffect(() => {
    fetchDrugs();
  }, []);

  const handleFilterSearchChange = (e) => {
    setFilterSearch(e.target.value);
    setPage(1);
  };

  const handleFilterDateChange = (e) => {
    setFilterDate(e.target.value);
    setPage(1);
  };

  const handleFilterStatusChange = (status) => {
    setFilterStatus(status);
    setPage(1);
  };

  // 3. Cari Pasien Khusus di Dalam Modal Registrasi
  const handleModalPatientSearch = async (query) => {
    setPatientSearchQuery(query);
    if (!query.trim()) {
      setPatientSearchResults([]);
      return;
    }

    setIsSearchingPatient(true);
    try {
      const res = await apiClient.get(`/patients?search=${query}`);
      if (res.data.success) {
        const pData = res.data.data;
        setPatientSearchResults(
          Array.isArray(pData) ? pData : pData?.data || [],
        );
      }
    } catch (err) {
      console.error("Gagal mencari pasien:", err);
    } finally {
      setIsSearchingPatient(false);
    }
  };

  // 4. Fetch Histori Rekam Medis Samping
  const loadPatientHistory = async (patientId) => {
    setHistoryLoading(true);
    try {
      const res = await apiClient.get(`/visits?patient_id=${patientId}`);
      if (res.data.success) {
        const hData = res.data.data;
        setSelectedPatientHistory(
          Array.isArray(hData) ? hData : hData?.data || [],
        );
      }
    } catch (err) {
      setSelectedPatientHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 5. Registrasi Kunjungan Baru & Langsung Buka Assesmen
  const handleCreateVisit = async (e) => {
    e.preventDefault();
    setModalError("");
    if (!selectedPatientObj) {
      setModalError("Pilih pasien terlebih dahulu dari daftar pencarian.");
      return;
    }

    try {
      const res = await apiClient.post("/visits", {
        patient_id: selectedPatientObj.id,
        chief_complaint: chiefComplaint || "Pemeriksaan Kesehatan Umum",
      });

      if (res.data.success) {
        const newVisit = res.data.data;
        setShowNewVisitModal(false);
        setSelectedPatientObj(null);
        setChiefComplaint("");
        setPatientSearchQuery("");

        handleSelectVisit(newVisit);
        fetchVisits();
      }
    } catch (err) {
      setModalError(
        err.response?.data?.message ||
          "Gagal membuat registrasi kunjungan baru.",
      );
    }
  };

  // 6. Pilih Kunjungan & Autofill Data SOAP jika Sudah Pernah Diisi
  const handleSelectVisit = (visit) => {
    setActiveVisit(visit);
    loadPatientHistory(visit.patient_id);

    if (visit.rme) {
      const obj = visit.rme.objective || "";

      const sysMatch = obj.match(/TD:\s*(\d+)\/(\d+)/);
      const hrMatch = obj.match(/HR:\s*(\d+)/);
      const tempMatch = obj.match(/Temp:\s*([\d.]+)/);
      const rrMatch = obj.match(/RR:\s*(\d+)/);

      setSoap({
        subjective: visit.rme.subjective || "",
        systole: sysMatch ? sysMatch[1] : "",
        diastole: sysMatch ? sysMatch[2] : "",
        heart_rate: hrMatch ? hrMatch[1] : "",
        temperature: tempMatch ? tempMatch[1] : "",
        respiration: rrMatch ? rrMatch[1] : "",
        assessment: visit.rme.assessment || "",
        icd10_code: visit.rme.icd10_code || "",
        plan: visit.rme.plan || "",
      });

      if (visit.rme.prescriptions && visit.rme.prescriptions.length > 0) {
        setPrescriptions(
          visit.rme.prescriptions.map((p) => ({
            drug_id: p.drug_id,
            qty: p.quantity,
            dose_instruction: p.dose_instruction,
          })),
        );
      } else {
        setPrescriptions([
          { drug_id: "", qty: 1, dose_instruction: "3x1 Tablet Setelah Makan" },
        ]);
      }
    } else {
      setSoap({
        subjective: visit.chief_complaint || "",
        systole: "",
        diastole: "",
        heart_rate: "",
        temperature: "",
        respiration: "",
        assessment: "",
        icd10_code: "",
        plan: "",
      });
      setPrescriptions([
        { drug_id: "", qty: 1, dose_instruction: "3x1 Tablet Setelah Makan" },
      ]);
    }
  };

  // Handler Form E-Resep
  const handleAddPrescriptionRow = () => {
    setPrescriptions([
      ...prescriptions,
      { drug_id: "", qty: 1, dose_instruction: "3x1 Tablet Setelah Makan" },
    ]);
  };

  const handleRemovePrescriptionRow = (index) => {
    if (prescriptions.length === 1) return;
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handlePrescriptionChange = (index, field, value) => {
    const updated = [...prescriptions];
    updated[index][field] = value;
    setPrescriptions(updated);
  };

  // 7. Submit Assesmen RME & Order Obat
  // Handler Submit RME & Buat Draft Transaksi Unpaid
  const handleSubmitRme = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const completeObjective = `TD: ${soap.systole || "-"}/${soap.diastole || "-"} mmHg | HR: ${soap.heart_rate || "-"} bpm | Temp: ${soap.temperature || "-"}°C | RR: ${soap.respiration || "-"} x/m`;

      const payload = {
        subjective: soap.subjective,
        objective: completeObjective,
        assessment: soap.assessment,
        icd10_code: soap.icd10_code,
        plan: soap.plan,
        prescriptions: prescriptions.filter((p) => p.drug_id !== ""),
        // Mengirimkan flag ke backend bahwa registrasi/kunjungan ini siap ditagihkan
        create_transaction: true,
        payment_status: "UNPAID",
      };

      const res = await apiClient.post(
        `/visits/${activeVisit.id}/rme`,
        payload,
      );
      if (res.data.success) {
        setToastNotification({
          show: true,
          message:
            "RME berhasil disimpan & Tagihan (UNPAID) telah dikirim ke Kasir.",
          type: "success",
        });
        setActiveVisit(null);
        fetchVisits();
      }
    } catch (err) {
      setToastNotification({
        show: true,
        message: err.response?.data?.message || "Gagal menyimpan rekam medis",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Utama */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-emerald-600" /> Rekam Medis
            Elektronik (RME)
          </h1>
          <p className="text-sm text-slate-500">
            Pendaftaran Antrean, Examination Dokter, & Longitudinal EHR
          </p>
        </div>

        {!activeVisit && (
          <button
            onClick={() => {
              setShowNewVisitModal(true);
              setModalError("");
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Registrasi Kunjungan Baru
          </button>
        )}
      </div>

      {/* ================= TAMPILAN 1: ANTREAN & REGISTRASI KUNJUNGAN ================= */}
      {!activeVisit ? (
        <div className="space-y-4">
          {/* Form Filter & Pencarian */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={handleFilterDateChange}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                />
              </div>

              {/* Filter Status Actions */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => handleFilterStatusChange("ALL")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterStatus === "ALL"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "hover:text-slate-900"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterStatusChange("PENDING")}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    filterStatus === "PENDING"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "hover:text-slate-900"
                  }`}
                >
                  <Clock className="w-3 h-3" /> Perlu Ditindak
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterStatusChange("DONE")}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    filterStatus === "DONE"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "hover:text-slate-900"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" /> Selesai
                </button>
              </div>
            </div>

            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari No. RM, NIK, No. BPJS, Nama Pasien, atau No. Kunjungan..."
                value={filterSearch}
                onChange={handleFilterSearchChange}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Tabel Registrasi Kunjungan Pasien */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" /> DAFTAR
                REGISTRASI KUNJUNGAN PASIEN
              </span>
              <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-[11px]">
                {pagination.total || visits.length} Pasien
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-4">No. Kunjungan</th>
                    <th className="p-4">Pasien & No. RM</th>
                    <th className="p-4">Identitas (NIK / BPJS)</th>
                    <th className="p-4">Keluhan Utama (Triase)</th>
                    <th className="p-4">Status RME</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-8 text-center text-slate-400"
                      >
                        Memuat data kunjungan pasien...
                      </td>
                    </tr>
                  ) : visits.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-8 text-center text-slate-400"
                      >
                        Tidak ada data kunjungan pasien sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    visits.map((visit) => (
                      <tr
                        key={visit.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="p-4">
                          <p className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block">
                            {visit.visit_number}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(visit.created_at).toLocaleString("id-ID")}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800 text-sm">
                            {visit.patient?.name}
                          </p>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border border-slate-200 mt-0.5 inline-block">
                            RM-{String(visit.patient_id).padStart(6, "0")}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-600 space-y-0.5">
                          <p className="text-[11px]">
                            NIK: {visit.patient?.nik || "-"}
                          </p>
                          {visit.patient?.bpjs_number && (
                            <span className="inline-block bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                              BPJS: {visit.patient.bpjs_number}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-700 font-medium max-w-xs truncate">
                          {visit.chief_complaint || visit.rme?.subjective || "-"}
                        </td>
                        <td className="p-4">
                          {visit.rme ? (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />{" "}
                              Selesai Assesmen
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />{" "}
                              Menunggu Dokter
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleSelectVisit(visit)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer ${
                              visit.rme
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                          >
                            {visit.rme
                              ? "Lihat / Edit Assesmen"
                              : "Masuk Assesmen"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
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
                kunjungan
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
        </div>
      ) : (
        /* ================= TAMPILAN 2: WORKSPACE EXAMINATION (SOAP + RME HISTORI) ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* FORM ASSESMEN SOAP & E-RESEP */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveVisit(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
                  title="Kembali ke Daftar Kunjungan"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    {activeVisit.patient?.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    RM:{" "}
                    <span className="text-emerald-400 font-bold">
                      RM-{String(activeVisit.patient_id).padStart(6, "0")}
                    </span>{" "}
                    | No. Kunjungan: {activeVisit.visit_number}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Sub-Navigasi */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("SOAP")}
                className={`px-6 py-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "SOAP"
                    ? "border-emerald-600 text-emerald-700 bg-white shadow-sm"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Activity className="w-4 h-4 text-emerald-600" /> 1. Examination
                & SOAP Medis
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("RESEP")}
                className={`px-6 py-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "RESEP"
                    ? "border-emerald-600 text-emerald-700 bg-white shadow-sm"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Pill className="w-4 h-4 text-emerald-600" /> 2. Order E-Resep
                Obat Kasir
              </button>
            </div>

            <form onSubmit={handleSubmitRme} className="p-6 space-y-5 flex-1">
              {activeTab === "SOAP" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subjective (Anamnesis Keluhan Utama) *
                    </label>
                    <textarea
                      required
                      rows="3"
                      value={soap.subjective}
                      onChange={(e) =>
                        setSoap({ ...soap, subjective: e.target.value })
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                      placeholder="Anamnesis keluhan pasien, riwayat penyakit, atau gejala yang dirasakan..."
                    />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500" /> Objective -
                      Vital Sign Pasien
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Sistole (mmHg)
                        </label>
                        <input
                          type="number"
                          placeholder="120"
                          value={soap.systole}
                          onChange={(e) =>
                            setSoap({ ...soap, systole: e.target.value })
                          }
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Diastole (mmHg)
                        </label>
                        <input
                          type="number"
                          placeholder="80"
                          value={soap.diastole}
                          onChange={(e) =>
                            setSoap({ ...soap, diastole: e.target.value })
                          }
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Nadi (bpm)
                        </label>
                        <input
                          type="number"
                          placeholder="80"
                          value={soap.heart_rate}
                          onChange={(e) =>
                            setSoap({ ...soap, heart_rate: e.target.value })
                          }
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Suhu (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="36.5"
                          value={soap.temperature}
                          onChange={(e) =>
                            setSoap({ ...soap, temperature: e.target.value })
                          }
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Respirasi (/m)
                        </label>
                        <input
                          type="number"
                          placeholder="20"
                          value={soap.respiration}
                          onChange={(e) =>
                            setSoap({ ...soap, respiration: e.target.value })
                          }
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Assessment (Diagnosa Kerja) *
                      </label>
                      <input
                        type="text"
                        required
                        value={soap.assessment}
                        onChange={(e) =>
                          setSoap({ ...soap, assessment: e.target.value })
                        }
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        placeholder="Contoh: Febris ec Infeksi Saluran Pernapasan Akut"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kode ICD-10 *
                      </label>
                      <input
                        type="text"
                        required
                        value={soap.icd10_code}
                        onChange={(e) =>
                          setSoap({ ...soap, icd10_code: e.target.value })
                        }
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all uppercase"
                        placeholder="R50.9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Plan (Instruksi & Edukasi Non-Obat)
                    </label>
                    <textarea
                      rows="2"
                      value={soap.plan}
                      onChange={(e) =>
                        setSoap({ ...soap, plan: e.target.value })
                      }
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                      placeholder="Istirahat cukup, minum air putih minimal 2 liter per hari..."
                    />
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveTab("RESEP")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      Lanjut Ke Peresepan Obat →
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "RESEP" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-emerald-600" /> Peresepan
                        Obat Dokter (E-Resep)
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Resep otomatis dikirimkan ke POS Kasir dan Farmasi
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPrescriptionRow}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Tambah Obat
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Obat / Produk</th>
                          <th className="p-3 w-24">Jumlah</th>
                          <th className="p-3">Signa / Aturan Pakai</th>
                          <th className="p-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {prescriptions.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2">
                              <select
                                required
                                value={item.drug_id}
                                onChange={(e) =>
                                  handlePrescriptionChange(
                                    idx,
                                    "drug_id",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                              >
                                <option value="">
                                  -- Pilih Obat ({drugs.length} Tersedia) --
                                </option>
                                {drugs.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name} - Stok:{" "}
                                    {d.total_stock ?? d.stock ?? 0}{" "}
                                    {d.unit || "Satuan"}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                required
                                min="1"
                                value={item.qty}
                                onChange={(e) =>
                                  handlePrescriptionChange(
                                    idx,
                                    "qty",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                required
                                value={item.dose_instruction}
                                onChange={(e) =>
                                  handlePrescriptionChange(
                                    idx,
                                    "dose_instruction",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                disabled={prescriptions.length === 1}
                                onClick={() => handleRemovePrescriptionRow(idx)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveTab("SOAP")}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      ← Kembali ke SOAP
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />{" "}
                      {isSubmitting
                        ? "Menyimpan..."
                        : "Kirim RME & Order Resep ke Kasir"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* SIDE PANEL: HISTORI REKAM MEDIS TERDAHULU PASIEN */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 flex flex-col min-h-0 max-h-32rem overflow-hidden lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-4rem)]">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-600" /> Longitudinal
                  EHR
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Pasien:{" "}
                  <strong className="text-slate-700">
                    {activeVisit.patient?.name}
                  </strong>
                </p>
              </div>
              <span className="bg-slate-100 text-slate-600 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                {selectedPatientHistory.length} Record
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
              {historyLoading ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  Memuat riwayat medis...
                </p>
              ) : selectedPatientHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs italic">
                    Belum ada rekam medis terdahulu.
                  </p>
                </div>
              ) : (
                selectedPatientHistory.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs space-y-2 hover:border-emerald-200 transition-all"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                      <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {h.visit_number}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(h.created_at).toLocaleDateString("id-ID")}
                      </span>
                    </div>

                    <p className="font-bold text-slate-800 text-xs">
                      Dx: {h.rme?.assessment || h.chief_complaint || "-"}{" "}
                      {h.rme?.icd10_code ? `(${h.rme.icd10_code})` : ""}
                    </p>

                    {h.rme?.objective && (
                      <p className="text-[10px] font-mono text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                        {h.rme.objective}
                      </p>
                    )}

                    <div className="space-y-1 text-[11px] text-slate-600 pt-1">
                      <p>
                        <strong className="text-slate-700">S:</strong>{" "}
                        {h.rme?.subjective || "-"}
                      </p>
                      <p>
                        <strong className="text-slate-700">P:</strong>{" "}
                        {h.rme?.plan || "-"}
                      </p>

                      {/* Menampilkan Riwayat Obat */}
                      {h.rme?.prescriptions &&
                        h.rme.prescriptions.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-200/60">
                            <strong className="text-slate-700 block text-[10px] uppercase font-bold mb-1">
                              💊 Resep Obat:
                            </strong>
                            <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-700">
                              {h.rme.prescriptions.map((p, idx) => (
                                <li key={idx} className="font-medium">
                                  <span className="font-bold text-slate-800">
                                    {p.drug?.name ||
                                      p.drug_name ||
                                      `Obat #${p.drug_id}`}
                                  </span>{" "}
                                  ({p.quantity || p.qty}x) —{" "}
                                  <span className="italic text-slate-500">
                                    {p.dose_instruction}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRASI KUNJUNGAN BARU */}
      {showNewVisitModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" /> Registrasi
                Kunjungan Pasien
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowNewVisitModal(false);
                  setSelectedPatientObj(null);
                  setPatientSearchQuery("");
                  setModalError("");
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert Error Modal */}
            {modalError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-800">
                    Gagal Memproses Registrasi
                  </p>
                  <p className="mt-0.5">{modalError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalError("")}
                  className="text-rose-400 hover:text-rose-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form
              onSubmit={handleCreateVisit}
              className="space-y-4 pt-4 text-xs"
            >
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  1. Cari & Pilih Pasien Terdaftar *
                </label>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Ketik NIK, No. BPJS, No. RM, atau Nama Pasien..."
                    value={patientSearchQuery}
                    onChange={(e) => handleModalPatientSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium transition-all"
                  />
                </div>

                {!selectedPatientObj && patientSearchQuery.trim() !== "" && (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-lg">
                    {isSearchingPatient ? (
                      <p className="p-4 text-center text-slate-400 text-xs">
                        Mencari data pasien...
                      </p>
                    ) : patientSearchResults.length === 0 ? (
                      <p className="p-4 text-center text-slate-400 text-xs">
                        Pasien tidak ditemukan.
                      </p>
                    ) : (
                      patientSearchResults.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatientObj(p);
                            setPatientSearchQuery("");
                            setPatientSearchResults([]);
                          }}
                          className="p-3 hover:bg-emerald-50/70 cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <div>
                            <p className="font-bold text-slate-800 text-xs">
                              {p.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              RM-{String(p.id).padStart(6, "0")} | NIK:{" "}
                              {p.nik || "-"}
                            </p>
                          </div>
                          {p.bpjs_number ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                              BPJS: {p.bpjs_number}
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
                              UMUM
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {selectedPatientObj && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center text-xs shadow-sm">
                        {selectedPatientObj.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">
                          {selectedPatientObj.name}
                        </h4>
                        <p className="text-[10px] text-slate-600 font-mono">
                          RM-{String(selectedPatientObj.id).padStart(6, "0")} |{" "}
                          {selectedPatientObj.gender === "L"
                            ? "Laki-laki"
                            : "Perempuan"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatientObj(null);
                        setPatientSearchQuery("");
                      }}
                      className="text-xs text-rose-600 font-bold hover:underline px-2.5 py-1 bg-white rounded-lg border border-rose-200 cursor-pointer"
                    >
                      Ganti
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700">
                  2. Keluhan Utama (Triase Pasien) *
                </label>
                <textarea
                  required
                  rows="2"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs transition-all resize-none"
                  placeholder="Isi keluhan awal atau alasan pasien berobat..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewVisitModal(false);
                    setSelectedPatientObj(null);
                    setPatientSearchQuery("");
                    setModalError("");
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!selectedPatientObj}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-bold shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Stethoscope className="w-4 h-4" /> Buka Sesi Assesmen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Toast/Modal Notification */}
      {toastNotification.show && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-5 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 max-w-md ${
              toastNotification.type === "error"
                ? "bg-rose-950 text-white border-rose-800"
                : "bg-slate-900 text-white border-slate-800"
            }`}
          >
            <div
              className={`p-2 rounded-xl ${
                toastNotification.type === "error"
                  ? "bg-rose-500/20 text-rose-400"
                  : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              {toastNotification.type === "error" ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-xs text-white">
                {toastNotification.type === "error"
                  ? "Terjadi Kesalahan"
                  : "Berhasil"}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {toastNotification.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setToastNotification({ ...toastNotification, show: false })
              }
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
