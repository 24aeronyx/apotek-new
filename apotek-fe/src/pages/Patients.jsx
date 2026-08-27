import { useEffect, useState } from 'react';
import { Users, Search, UserPlus, Phone, CreditCard, Calendar, MapPin, Eye, Edit3, Stethoscope, HeartPulse } from 'lucide-react';
import apiClient from '../api/axios';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const [form, setForm] = useState({
    nik: '', bpjs_number: '', name: '', gender: 'L', birth_date: '', phone: '', address: ''
  });

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/patients?search=${search}`);
      if (res.data.success) {
        const patientData = res.data.data;
        setPatients(Array.isArray(patientData) ? patientData : (patientData.data || []));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, [search]);

  // Kalkulasi Umur Otomatis
  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} Thn`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/patients', form);
      setShowModal(false);
      setForm({ nik: '', bpjs_number: '', name: '', gender: 'L', birth_date: '', phone: '', address: '' });
      fetchPatients();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal registrasi pasien');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <HeartPulse className="w-7 h-7 text-emerald-600" /> Master Data Pasien
          </h1>
          <p className="text-sm text-slate-500">Manajemen demografi pasien dan penomoran Rekam Medis (RM)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs shadow-sm transition-all active:scale-95"
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
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border">
          <Users className="w-4 h-4 text-emerald-600" /> Total Pasien: <strong className="text-slate-800">{patients.length}</strong>
        </div>
      </div>

      {/* Tabel Data Pasien Modern */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
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
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-400">Memuat data pasien...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-400">Data pasien tidak ditemukan.</td></tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                      RM-{String(p.id).padStart(6, '0')}
                    </span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{p.name}</p>
                  </td>

                  <td className="p-4 space-y-1">
                    <div className="flex items-center gap-1 text-slate-600 font-mono">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.nik || '-'}</span>
                    </div>
                    {p.bpjs_number && (
                      <span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                        BPJS: {p.bpjs_number}
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <p className="font-bold text-slate-700">
                      {p.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </p>
                    <p className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {calculateAge(p.birth_date)} ({p.birth_date})
                    </p>
                  </td>

                  <td className="p-4 font-mono text-slate-600">
                    {p.phone ? (
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" /> {p.phone}
                      </span>
                    ) : '-'}
                  </td>

                  <td className="p-4 text-slate-600 max-w-xs truncate">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> {p.address || '-'}
                    </span>
                  </td>

                  <td className="p-4 text-right space-x-1">
                    <button
                      onClick={() => setSelectedPatient(p)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium inline-flex items-center gap-1"
                      title="Lihat Profil Pasien"
                    >
                      <Eye className="w-3.5 h-3.5" /> Profil
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Registrasi Pasien */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" /> Registrasi Pasien Rekam Medis Baru
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Pasien *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full p-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIK KTP (16 Digit)</label>
                  <input
                    type="text"
                    maxLength="16"
                    value={form.nik}
                    onChange={e => setForm({...form, nik: e.target.value})}
                    className="w-full p-2.5 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="3201xxxxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Kartu BPJS (13 Digit)</label>
                  <input
                    type="text"
                    maxLength="13"
                    value={form.bpjs_number}
                    onChange={e => setForm({...form, bpjs_number: e.target.value})}
                    className="w-full p-2.5 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="0001xxxxxxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={form.gender}
                    onChange={e => setForm({...form, gender: e.target.value})}
                    className="w-full p-2.5 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir *</label>
                  <input
                    type="date"
                    required
                    value={form.birth_date}
                    onChange={e => setForm({...form, birth_date: e.target.value})}
                    className="w-full p-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full p-2.5 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0812xxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea
                  rows="2"
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  className="w-full p-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Jl. Merdeka No. X, RT/RW..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm"
                >
                  Simpan Pasien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Profil Pasien */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border">
            <div className="text-center pb-4 border-b">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 font-bold rounded-full flex items-center justify-center text-xl mx-auto mb-2">
                {selectedPatient.name.slice(0, 2).toUpperCase()}
              </div>
              <h3 className="font-bold text-slate-800 text-base">{selectedPatient.name}</h3>
              <p className="text-xs font-mono text-emerald-600 font-bold">
                No. RM: RM-{String(selectedPatient.id).padStart(6, '0')}
              </p>
            </div>

            <div className="py-4 space-y-2 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">NIK:</span>
                <span className="font-mono font-bold">{selectedPatient.nik || '-'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">No. BPJS:</span>
                <span className="font-mono font-bold text-emerald-600">{selectedPatient.bpjs_number || '-'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Jenis Kelamin / Usia:</span>
                <span className="font-semibold">{selectedPatient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} ({calculateAge(selectedPatient.birth_date)})</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Tgl Lahir:</span>
                <span>{selectedPatient.birth_date}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">No. Telepon:</span>
                <span>{selectedPatient.phone || '-'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Alamat:</span>
                <span className="text-right max-w-[200px]">{selectedPatient.address || '-'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
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