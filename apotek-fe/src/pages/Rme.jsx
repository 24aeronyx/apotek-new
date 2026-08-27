import { useEffect, useState } from 'react';
import { 
  Stethoscope, Search, UserPlus, History, Calendar, Clock, 
  CheckCircle2, ArrowLeft, Heart, Activity, Pill, Send, Plus, Trash2
} from 'lucide-react';
import apiClient from '../api/axios';

export default function Rme() {
  // Master State Data
  const [visits, setVisits] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Filter Pencarian Kunjungan
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterSearch, setFilterSearch] = useState('');

  // State Histori RME Samping
  const [selectedPatientHistory, setSelectedPatientHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // State Modal Kunjungan Baru
  const [showNewVisitModal, setShowNewVisitModal] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatientObj, setSelectedPatientObj] = useState(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);

  // State Sesi Examination / Assesmen Aktif
  const [activeVisit, setActiveVisit] = useState(null);
  const [activeTab, setActiveTab] = useState('SOAP'); // 'SOAP' | 'RESEP'

  // Form SOAP Medis
  const [soap, setSoap] = useState({
    subjective: '', systole: '', diastole: '', heart_rate: '', 
    temperature: '', respiration: '', assessment: '', icd10_code: '', plan: ''
  });

  // Form E-Resep Obat
  const [prescriptions, setPrescriptions] = useState([
    { drug_id: '', qty: 1, dose_instruction: '3x1 Tablet Setelah Makan' }
  ]);

  // 1. Fetch Daftar Kunjungan Pasien
  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/visits?date=${filterDate}&search=${filterSearch}`);
      if (res.data.success) {
        const vData = res.data.data;
        setVisits(Array.isArray(vData) ? vData : (vData?.data || []));
      }
    } catch (err) {
      console.error('Error fetching visits:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Master Obat
  const fetchDrugs = async () => {
    try {
      const res = await apiClient.get('/drugs');
      if (res.data.success) {
        const dData = res.data.data;
        setDrugs(Array.isArray(dData) ? dData : (dData?.data || []));
      }
    } catch (err) {
      console.error('Error fetching drugs:', err);
    }
  };

  useEffect(() => {
    fetchVisits();
    fetchDrugs();
  }, [filterDate, filterSearch]);

  // 3. Cari Pasien Khusus di Dalam Modal
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
        setPatientSearchResults(Array.isArray(pData) ? pData : (pData?.data || []));
      }
    } catch (err) {
      console.error('Gagal mencari pasien:', err);
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
        setSelectedPatientHistory(Array.isArray(hData) ? hData : (hData?.data || []));
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
    if (!selectedPatientObj) return alert('Pilih pasien terlebih dahulu!');

    try {
      const res = await apiClient.post('/visits', {
        patient_id: selectedPatientObj.id,
        chief_complaint: chiefComplaint || 'Pemeriksaan Kesehatan Umum'
      });

      if (res.data.success) {
        const newVisit = res.data.data;
        setShowNewVisitModal(false);
        setSelectedPatientObj(null);
        setChiefComplaint('');
        setPatientSearchQuery('');
        
        handleSelectVisit(newVisit);
        fetchVisits();
      }
    } catch (err) {
      alert('Gagal membuat registrasi kunjungan baru');
    }
  };

  // 6. Pilih Kunjungan & Autofill Data SOAP jika Sudah Pernah Diisi
  const handleSelectVisit = (visit) => {
    setActiveVisit(visit);
    loadPatientHistory(visit.patient_id);

    // Populate data SOAP jika sudah ada RME
    if (visit.rme) {
      const obj = visit.rme.objective || '';
      
      // Parse sederhana Vital Sign
      const sysMatch = obj.match(/TD:\s*(\d+)\/(\d+)/);
      const hrMatch = obj.match(/HR:\s*(\d+)/);
      const tempMatch = obj.match(/Temp:\s*([\d.]+)/);
      const rrMatch = obj.match(/RR:\s*(\d+)/);

      setSoap({
        subjective: visit.rme.subjective || '',
        systole: sysMatch ? sysMatch[1] : '',
        diastole: sysMatch ? sysMatch[2] : '',
        heart_rate: hrMatch ? hrMatch[1] : '',
        temperature: tempMatch ? tempMatch[1] : '',
        respiration: rrMatch ? rrMatch[1] : '',
        assessment: visit.rme.assessment || '',
        icd10_code: visit.rme.icd10_code || '',
        plan: visit.rme.plan || ''
      });

      if (visit.rme.prescriptions && visit.rme.prescriptions.length > 0) {
        setPrescriptions(visit.rme.prescriptions.map(p => ({
          drug_id: p.drug_id,
          qty: p.quantity,
          dose_instruction: p.dose_instruction
        })));
      } else {
        setPrescriptions([{ drug_id: '', qty: 1, dose_instruction: '3x1 Tablet Setelah Makan' }]);
      }
    } else {
      setSoap({
        subjective: visit.chief_complaint || '',
        systole: '', diastole: '', heart_rate: '', 
        temperature: '', respiration: '', assessment: '', icd10_code: '', plan: ''
      });
      setPrescriptions([{ drug_id: '', qty: 1, dose_instruction: '3x1 Tablet Setelah Makan' }]);
    }
  };

  // Handler Form E-Resep
  const handleAddPrescriptionRow = () => {
    setPrescriptions([...prescriptions, { drug_id: '', qty: 1, dose_instruction: '3x1 Tablet Setelah Makan' }]);
  };

  const handleRemovePrescriptionRow = (index) => {
    if (prescriptions.length === 1) return alert('Minimal 1 resep obat!');
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handlePrescriptionChange = (index, field, value) => {
    const updated = [...prescriptions];
    updated[index][field] = value;
    setPrescriptions(updated);
  };

  // 7. Submit Assesmen RME & Order Obat
  const handleSubmitRme = async (e) => {
    e.preventDefault();
    try {
      const completeObjective = `TD: ${soap.systole}/${soap.diastole} mmHg | HR: ${soap.heart_rate} bpm | Temp: ${soap.temperature}°C | RR: ${soap.respiration} x/m`;

      const payload = {
        subjective: soap.subjective,
        objective: completeObjective,
        assessment: soap.assessment,
        icd10_code: soap.icd10_code,
        plan: soap.plan,
        prescriptions: prescriptions.filter(p => p.drug_id !== '')
      };

      const res = await apiClient.post(`/visits/${activeVisit.id}/rme`, payload);
      if (res.data.success) {
        alert('Rekam Medis (RME) & Resep Berhasil Disimpan!');
        setActiveVisit(null);
        fetchVisits();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan rekam medis');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Utama */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-emerald-600" /> Rekam Medis Elektronik (RME)
          </h1>
          <p className="text-sm text-slate-500">Pendaftaran Antrean, Examination Dokter, & Longitudinal EHR</p>
        </div>

        {!activeVisit && (
          <button
            onClick={() => setShowNewVisitModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" /> Registrasi Kunjungan Baru
          </button>
        )}
      </div>

      {/* ================= TAMPILAN 1: ANTREAN & REGISTRASI KUNJUNGAN ================= */}
      {!activeVisit ? (
        <div className="space-y-4">
          {/* Form Filter & Pencarian */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="p-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none"
              />
            </div>

            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari No. RM, NIK, No. BPJS, Nama Pasien, atau No. Kunjungan..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Tabel Registrasi Kunjungan Pasien */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b text-xs font-bold text-slate-700 flex justify-between items-center">
              <span>DAFTAR REGISTRASI KUNJUNGAN PASIEN ({visits.length})</span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-4">No. Kunjungan</th>
                  <th className="p-4">Pasien & No. RM</th>
                  <th className="p-4">Identitas (NIK / BPJS)</th>
                  <th className="p-4">Keluhan Utama (Triase)</th>
                  <th className="p-4">Status RME</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-400">Memuat data kunjungan pasien...</td></tr>
                ) : visits.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-400">Tidak ada kunjungan pasien sesuai filter.</td></tr>
                ) : (
                  visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <p className="font-mono font-bold text-emerald-700">{visit.visit_number}</p>
                        <p className="text-[10px] text-slate-400">{new Date(visit.created_at).toLocaleString('id-ID')}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800 text-sm">{visit.patient?.name}</p>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                          RM-{String(visit.patient_id).padStart(6, '0')}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-600">
                        <p>NIK: {visit.patient?.nik || '-'}</p>
                        <p className="text-emerald-600 font-semibold">{visit.patient?.bpjs_number ? `BPJS: ${visit.patient.bpjs_number}` : ''}</p>
                      </td>
                      <td className="p-4 text-slate-700 font-medium">{visit.chief_complaint || '-'}</td>
                      <td className="p-4">
                        {visit.rme ? (
                          <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Selesai Assesmen
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Menunggu Dokter
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleSelectVisit(visit)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                        >
                          {visit.rme ? 'Lihat / Edit Assesmen' : 'Masuk Assesmen'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                  onClick={() => setActiveVisit(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                  title="Kembali"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-base font-bold">{activeVisit.patient?.name}</h3>
                  <p className="text-xs text-slate-400">
                    RM: <span className="font-mono text-emerald-300">RM-{String(activeVisit.patient_id).padStart(6, '0')}</span> | No: {activeVisit.visit_number}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Sub-Navigasi */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
              <button
                onClick={() => setActiveTab('SOAP')}
                className={`px-6 py-3 border-b-2 flex items-center gap-2 ${
                  activeTab === 'SOAP' ? 'border-emerald-600 text-emerald-600 bg-white' : 'border-transparent text-slate-500'
                }`}
              >
                <Activity className="w-4 h-4" /> 1. Examination & SOAP Medis
              </button>
              <button
                onClick={() => setActiveTab('RESEP')}
                className={`px-6 py-3 border-b-2 flex items-center gap-2 ${
                  activeTab === 'RESEP' ? 'border-emerald-600 text-emerald-600 bg-white' : 'border-transparent text-slate-500'
                }`}
              >
                <Pill className="w-4 h-4" /> 2. Order E-Resep Obat Kasir
              </button>
            </div>

            <form onSubmit={handleSubmitRme} className="p-6 space-y-5 flex-1">
              {activeTab === 'SOAP' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subjective (Anamnesis Keluhan Utama) *</label>
                    <textarea
                      required
                      rows="3"
                      value={soap.subjective}
                      onChange={e => setSoap({...soap, subjective: e.target.value})}
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Anamnesis..."
                    />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-red-500" /> Objective - Vital Sign
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500">Sistole (mmHg)</label>
                        <input type="number" placeholder="120" value={soap.systole} onChange={e => setSoap({...soap, systole: e.target.value})} className="w-full p-2 border rounded-lg text-xs font-bold bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500">Diastole (mmHg)</label>
                        <input type="number" placeholder="80" value={soap.diastole} onChange={e => setSoap({...soap, diastole: e.target.value})} className="w-full p-2 border rounded-lg text-xs font-bold bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500">Nadi (bpm)</label>
                        <input type="number" placeholder="80" value={soap.heart_rate} onChange={e => setSoap({...soap, heart_rate: e.target.value})} className="w-full p-2 border rounded-lg text-xs font-bold bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500">Suhu (°C)</label>
                        <input type="number" step="0.1" placeholder="36.5" value={soap.temperature} onChange={e => setSoap({...soap, temperature: e.target.value})} className="w-full p-2 border rounded-lg text-xs font-bold bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500">Respirasi (/m)</label>
                        <input type="number" placeholder="20" value={soap.respiration} onChange={e => setSoap({...soap, respiration: e.target.value})} className="w-full p-2 border rounded-lg text-xs font-bold bg-white" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Assessment (Diagnosa Kerja) *</label>
                      <input
                        type="text"
                        required
                        value={soap.assessment}
                        onChange={e => setSoap({...soap, assessment: e.target.value})}
                        className="w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Diagnosa..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Kode ICD-10 *</label>
                      <input
                        type="text"
                        required
                        value={soap.icd10_code}
                        onChange={e => setSoap({...soap, icd10_code: e.target.value})}
                        className="w-full p-2.5 border rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="R50.9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Plan (Instruksi & Edukasi)</label>
                    <textarea
                      rows="2"
                      value={soap.plan}
                      onChange={e => setSoap({...soap, plan: e.target.value})}
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Rencana..."
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('RESEP')}
                      className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5"
                    >
                      Lanjut Ke Peresepan Obat →
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'RESEP' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Peresepan Obat Dokter (E-Resep)</h4>
                      <p className="text-[10px] text-slate-400">Resep akan terintegrasi ke POS Kasir</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPrescriptionRow}
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Tambah Obat
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Obat / Produk</th>
                          <th className="p-3 w-24">Jumlah</th>
                          <th className="p-3">Signa / Aturan Pakai</th>
                          <th className="p-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {prescriptions.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2">
                              <select
                                required
                                value={item.drug_id}
                                onChange={e => handlePrescriptionChange(idx, 'drug_id', e.target.value)}
                                className="w-full p-2 border rounded-lg text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                              >
                                <option value="">-- Pilih Obat ({drugs.length} Tersedia) --</option>
                                {drugs.map(d => (
                                  <option key={d.id} value={d.id}>
                                    {d.name} - Stok: {d.total_stock ?? d.stock ?? 0} {d.unit || 'Satuan'}
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
                                onChange={e => handlePrescriptionChange(idx, 'qty', e.target.value)}
                                className="w-full p-2 border rounded-lg text-xs font-bold text-center"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                required
                                value={item.dose_instruction}
                                onChange={e => handlePrescriptionChange(idx, 'dose_instruction', e.target.value)}
                                className="w-full p-2 border rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePrescriptionRow(idx)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setActiveTab('SOAP')}
                      className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600"
                    >
                      ← Kembali ke SOAP
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-md"
                    >
                      <Send className="w-4 h-4" /> Kirim RME & Order Resep ke Kasir
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* SIDE PANEL: HISTORI REKAM MEDIS TERDAHULU PASIEN */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 flex flex-col max-h-[700px] overflow-hidden">
            <div className="border-b pb-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <History className="w-4 h-4 text-emerald-600" /> Histori Rekam Medis Terdahulu
              </h4>
              <p className="text-[10px] text-slate-400">Pasien: <strong>{activeVisit.patient?.name}</strong></p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {historyLoading ? (
                <p className="text-xs text-slate-400 text-center py-8">Memuat riwayat medis...</p>
              ) : selectedPatientHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">Belum ada rekam medis terdahulu.</p>
              ) : (
                selectedPatientHistory.map((h) => (
                  <div key={h.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between items-center border-b pb-1">
                      <span className="font-mono text-[10px] font-bold text-emerald-700">{h.visit_number}</span>
                      <span className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleDateString('id-ID')}</span>
                    </div>

                    <p className="font-bold text-slate-800">
                      Dx: {h.rme?.assessment || h.chief_complaint || '-'} {h.rme?.icd10_code ? `(${h.rme.icd10_code})` : ''}
                    </p>
                    
                    {h.rme?.objective && (
                      <p className="text-[10px] font-mono text-slate-600 bg-white p-1 rounded border">
                        {h.rme.objective}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-600">S: {h.rme?.subjective || '-'}</p>
                    <p className="text-[11px] text-slate-500">Plan: {h.rme?.plan || '-'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRASI KUNJUNGAN BARU */}
      {showNewVisitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Registrasi Kunjungan Pasien</h3>
                  <p className="text-xs text-slate-400">Buka antrean admisi rekam medis baru</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { setShowNewVisitModal(false); setSelectedPatientObj(null); setPatientSearchQuery(''); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVisit} className="space-y-4 pt-4 text-xs">
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  1. Cari & Pilih Pasien Terdaftar *
                </label>
                
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Ketik NIK, No. BPJS, No. RM, atau Nama Pasien..."
                    value={patientSearchQuery}
                    onChange={(e) => handleModalPatientSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium"
                  />
                </div>

                {!selectedPatientObj && patientSearchQuery.trim() !== '' && (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-lg">
                    {isSearchingPatient ? (
                      <p className="p-4 text-center text-slate-400 text-xs">Mencari data pasien...</p>
                    ) : patientSearchResults.length === 0 ? (
                      <p className="p-4 text-center text-slate-400 text-xs">Pasien tidak ditemukan.</p>
                    ) : (
                      patientSearchResults.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatientObj(p);
                            setPatientSearchQuery('');
                            setPatientSearchResults([]);
                          }}
                          className="p-3 hover:bg-emerald-50/70 cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              RM-{String(p.id).padStart(6, '0')} | NIK: {p.nik || '-'}
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
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center text-sm shadow-sm">
                        {selectedPatientObj.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{selectedPatientObj.name}</h4>
                        <p className="text-[10px] text-slate-600 font-mono">
                          RM-{String(selectedPatientObj.id).padStart(6, '0')} | {selectedPatientObj.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedPatientObj(null); setPatientSearchQuery(''); }}
                      className="text-xs text-red-500 font-bold hover:underline px-2.5 py-1 bg-white rounded-lg border border-red-200"
                    >
                      Ganti
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  2. Keluhan Utama (Triase Pasien) *
                </label>
                <textarea
                  required
                  rows="2"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  placeholder="Keluhan pasien..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowNewVisitModal(false); setSelectedPatientObj(null); setPatientSearchQuery(''); }}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!selectedPatientObj}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <Stethoscope className="w-4 h-4" /> Buka Sesi Assesmen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}