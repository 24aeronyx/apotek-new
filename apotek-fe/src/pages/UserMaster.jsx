import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  User,
  Search,
  Edit2,
  Trash2,
  Shield,
  Stethoscope,
  HeartPulse,
  Pill,
  CreditCard,
  Lock,
  Mail,
  Phone,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Settings2,
  Save,
} from "lucide-react";
import apiClient from "../api/axios";

export default function UserMaster() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [accessOptions, setAccessOptions] = useState({ roles: [], permissions: [] });
  const [roleModal, setRoleModal] = useState({ show: false, editing: null });
  const [roleForm, setRoleForm] = useState({ name: "", permissions: [] });
  const [accessModal, setAccessModal] = useState({ show: false, user: null });
  const [accessForm, setAccessForm] = useState({ roles: [], permissions: [] });
  const [accessLoading, setAccessLoading] = useState(false);

  // Modal Input / Edit State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "doctor",
    phone: "",
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

  const ROLES = [
    {
      key: "admin",
      keys: ["admin", "administrator", "superadmin"],
      label: "Administrator",
      color: "bg-purple-100 text-purple-700 border-purple-200",
      icon: Shield,
    },
    {
      key: "doctor",
      keys: ["doctor", "dokter"],
      label: "Dokter",
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: Stethoscope,
    },
    {
      key: "nurse",
      keys: ["nurse", "perawat", "admisi"],
      label: "Perawat / Admisi",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      icon: HeartPulse,
    },
    {
      key: "pharmacist",
      keys: ["pharmacist", "apoteker", "farmasi"],
      label: "Apoteker",
      color: "bg-amber-100 text-amber-700 border-amber-200",
      icon: Pill,
    },
    {
      key: "cashier",
      keys: ["cashier", "kasir"],
      label: "Kasir POS",
      color: "bg-teal-100 text-teal-700 border-teal-200",
      icon: CreditCard,
    },
  ];

  const PERMISSION_META = {
    "manage-users": { menu: "Master User", action: "Kelola user & hak akses" },
    "view-reports": { menu: "Laporan", action: "Lihat dan cetak laporan" },
    "view-drugs": { menu: "Master Obat", action: "Lihat katalog obat" },
    "manage-master-drugs": { menu: "Master Obat", action: "Kelola data obat" },
    "view-stock": { menu: "Stok Opname", action: "Lihat informasi stok" },
    "manage-stock-in": { menu: "Faktur Pembelian", action: "Kelola stok masuk" },
    "create-rme": { menu: "Kunjungan", action: "Buat & perbarui RME" },
    "view-rme": { menu: "Kunjungan", action: "Lihat RME" },
    "process-pos-sale": { menu: "Kasir", action: "Proses transaksi penjualan" },
  };

  const getPermissionMeta = (name) =>
    PERMISSION_META[name] || { menu: "Akses Sistem", action: name };

  // Fetch API dengan Handling Pembacaan Data Aman
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/users?search=${search}&role=${roleFilter}&page=${page}`);
      if (res.data.success) {
        // Jika response backend berupa Paginate Object
        if (res.data.data?.data) {
          setUsers(res.data.data.data);
          setPagination(res.data.data);
        } else {
          // Fallback jika backend masih mengembalikan Array biasa
          setUsers(Array.isArray(res.data.data) ? res.data.data : []);
          setPagination({});
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data user:", err);
      triggerToast("Gagal memuat data pengguna", "error");
    } finally {
      setLoading(false);
    }
  };

  // Reset ke halaman 1 saat mengetik pencarian atau mengubah filter
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  // Trigger ulang fetch data jika halaman, search, atau roleFilter berubah
  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter]);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setForm({
        name: user.name || "",
        email: user.email || "",
        username: user.username || "",
        password: "",
        role: user.role || "doctor",
        phone: user.phone || "",
        is_active: user.is_active ?? true,
      });
    } else {
      setEditingUser(null);
      setForm({
        name: "",
        email: "",
        username: "",
        password: "",
        role: "doctor",
        phone: "",
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await apiClient.put(`/users/${editingUser.id}`, form);
        triggerToast("Data pengguna berhasil diperbarui!", "success");
      } else {
        await apiClient.post("/users", form);
        triggerToast("Pengguna baru berhasil ditambahkan!", "success");
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      triggerToast(
        err.response?.data?.message || "Gagal menyimpan data pengguna",
        "error"
      );
    }
  };

  const openDeleteModal = (id, name) => {
    setDeleteConfirm({ show: true, id, name });
  };

  const handleExecuteDelete = async () => {
    try {
      await apiClient.delete(`/users/${deleteConfirm.id}`);
      triggerToast(
        `Pengguna ${deleteConfirm.name} berhasil dihapus!`,
        "success"
      );
      setDeleteConfirm({ show: false, id: null, name: "" });
      fetchUsers();
    } catch (err) {
      triggerToast(
        err.response?.data?.message || "Gagal menghapus pengguna",
        "error"
      );
      setDeleteConfirm({ show: false, id: null, name: "" });
    }
  };

  const fetchAccessOptions = async () => {
    const res = await apiClient.get("/users/access-options");
    setAccessOptions(res.data.data || { roles: [], permissions: [] });
  };

  const openRoleModal = async (role = null) => {
    try {
      await fetchAccessOptions();
      setRoleModal({ show: true, editing: role });
      setRoleForm({
        name: role?.name || "",
        permissions: role?.permissions?.map((permission) => permission.name) || [],
      });
    } catch (err) {
      triggerToast("Gagal memuat konfigurasi role", "error");
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = roleModal.editing
        ? `/users/roles/${roleModal.editing.id}`
        : "/users/roles";
      const method = roleModal.editing ? "put" : "post";
      await apiClient[method](url, roleForm);
      triggerToast("Role dan permission berhasil disimpan");
      setRoleModal({ show: false, editing: null });
      fetchAccessOptions();
    } catch (err) {
      triggerToast(err.response?.data?.message || "Gagal menyimpan role", "error");
    }
  };

  const openAccessModal = async (user) => {
    setAccessLoading(true);
    try {
      await fetchAccessOptions();
      const detail = await apiClient.get(`/users/${user.id}`);
      const selectedUser = detail.data.data || user;
      setAccessModal({ show: true, user: selectedUser });
      setAccessForm({
        roles: selectedUser.roles?.map((role) => role.name) || [],
        permissions: selectedUser.permissions?.map((permission) => permission.name) || [],
      });
    } catch (err) {
      triggerToast("Gagal memuat hak akses pengguna", "error");
    } finally {
      setAccessLoading(false);
    }
  };

  const handleAccessSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/users/${accessModal.user.id}/access`, accessForm);
      triggerToast("Hak akses pengguna berhasil diperbarui");
      setAccessModal({ show: false, user: null });
      fetchUsers();
    } catch (err) {
      triggerToast(err.response?.data?.message || "Gagal menyimpan hak akses", "error");
    }
  };

  const togglePermission = (permission, field, setter) => {
    setter((current) => ({
      ...current,
      [field]: current[field].includes(permission)
        ? current[field].filter((item) => item !== permission)
        : [...current[field], permission],
    }));
  };

  const getRoleBadge = (roleKey) => {
    if (!roleKey) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border bg-slate-100 text-slate-600 border-slate-200">
          <Shield className="w-3 h-3" /> Staf Klinik
        </span>
      );
    }

    const cleanRole = String(roleKey).trim().toLowerCase();
    const roleObj = ROLES.find((r) =>
      r.keys.some((k) => k.toLowerCase() === cleanRole)
    );

    if (roleObj) {
      const IconComp = roleObj.icon;
      return (
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border ${roleObj.color}`}
        >
          <IconComp className="w-3 h-3" /> {roleObj.label}
        </span>
      );
    }

    const formattedLabel =
      cleanRole.charAt(0).toUpperCase() + cleanRole.slice(1);

    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border bg-indigo-50 text-indigo-700 border-indigo-200">
        <Shield className="w-3 h-3" /> {formattedLabel}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans relative">
      {/* TOAST POP-UP */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-[100] animate-in fade-in slide-in-from-top-3 duration-200">
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
            <Users className="w-7 h-7 text-emerald-600" /> Master User & Hak Akses
          </h1>
          <p className="text-sm text-slate-500">
            Kelola akun pengguna, dokter, perawat, apoteker, dan hak akses sistem
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openRoleModal()}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Settings2 className="w-4 h-4 text-emerald-600" /> Kelola Role
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" /> Tambah User Baru
          </button>
        </div>
      </div>

      {/* Filter Pencarian & Role */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari Nama, Username, atau Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="p-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 outline-none w-full sm:w-auto bg-white"
        >
          <option value="">-- Semua Role --</option>
          {ROLES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabel Data User */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
            <tr>
              <th className="p-4">Pengguna</th>
              <th className="p-4">Email / Login</th>
              <th className="p-4">Role Akses</th>
              <th className="p-4">No. HP</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  Memuat data pengguna...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  Tidak ada data pengguna ditemukan.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center justify-center text-xs">
                      {(u.name || "US").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {u.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        @{u.username || "user"}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-slate-600">{u.email}</td>
                  <td className="p-4">{getRoleBadge(u.role)}</td>
                  <td className="p-4 text-slate-700">{u.phone || "-"}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.is_active !== false
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {u.is_active !== false ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => openAccessModal(u)}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                      title="Atur Hak Akses"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(u)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(u.id, u.name)}
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

      {/* MODAL 1: TAMBAH / EDIT USER */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 font-sans">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editingUser
                      ? "Edit Data Pengguna"
                      : "Registrasi Pengguna Baru"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingUser
                      ? "Perbarui informasi & hak akses staf"
                      : "Kelola akun staf klinik dan otorisasi sistem"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Nama Lengkap Staf *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sarah Amalia, A.Md.Kep"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Email Login *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="staf@klinik.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Role / Hak Akses *
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 z-10" />
                    <select
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-slate-800 bg-white"
                    >
                      {ROLES.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Password {editingUser ? "(Kosongkan jika tetap)" : "*"}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required={!editingUser}
                      placeholder="******"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    No. WhatsApp / HP
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="08123456789"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>
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
                  <UserPlus className="w-4 h-4" /> Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ROLE & PERMISSION */}
      {roleModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100 font-sans">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl"><Settings2 className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Role & Permission</h3>
                  <p className="text-xs text-slate-400">Atur kemampuan yang diwariskan ke banyak pengguna</p>
                </div>
              </div>
              <button type="button" onClick={() => setRoleModal({ show: false, editing: null })} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid lg:grid-cols-[220px_1fr] gap-5 pt-5">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Daftar Role</p>
                {accessOptions.roles.map((role) => (
                  <div key={role.id} className={`flex items-center justify-between p-2.5 rounded-xl border ${roleModal.editing?.id === role.id ? "border-emerald-400 bg-emerald-50" : "border-slate-200"}`}>
                    <button type="button" onClick={() => openRoleModal(role)} className="text-left min-w-0">
                      <p className="font-bold text-xs text-slate-800 truncate">{role.name}</p>
                      <p className="text-[10px] text-slate-400">{role.permissions?.length || 0} permission</p>
                    </button>
                    {!['admin', 'super admin'].includes(role.name.toLowerCase()) && (
                      <button type="button" onClick={async () => { try { await apiClient.delete(`/users/roles/${role.id}`); triggerToast("Role berhasil dihapus"); fetchAccessOptions(); } catch (err) { triggerToast(err.response?.data?.message || "Gagal menghapus role", "error"); } }} className="p-1 text-red-400 hover:bg-red-50 rounded-lg" title="Hapus role"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => openRoleModal()} className="w-full p-2.5 rounded-xl border border-dashed border-emerald-300 text-emerald-700 text-xs font-bold hover:bg-emerald-50">+ Role Baru</button>
              </div>

              <form onSubmit={handleRoleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nama Role *</label>
                  <input required value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} placeholder="Contoh: Front Office" className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Akses Menu Role</p><span className="text-[10px] text-slate-400">{roleForm.permissions.length} dipilih</span></div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {accessOptions.permissions.map((permission) => (
                      <label key={permission.id} className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={roleForm.permissions.includes(permission.name)} onChange={() => togglePermission(permission.name, "permissions", setRoleForm)} className="accent-emerald-600" />
                        <span className="min-w-0"><span className="block text-xs font-bold text-slate-700 truncate">{getPermissionMeta(permission.name).menu}</span><span className="block text-[10px] text-slate-400 truncate">{getPermissionMeta(permission.name).action}</span></span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100"><button type="button" onClick={() => setRoleModal({ show: false, editing: null })} className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50">Batal</button><button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2"><Save className="w-4 h-4" /> Simpan Role</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AKSES PER USER */}
      {accessModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100 font-sans">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100"><div className="flex items-center gap-3"><div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl"><KeyRound className="w-6 h-6" /></div><div><h3 className="text-base font-bold text-slate-800">Akses Akun</h3><p className="text-xs text-slate-400">{accessModal.user?.name} · role dan permission khusus akun</p></div></div><button type="button" onClick={() => setAccessModal({ show: false, user: null })} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
            {accessLoading ? <p className="py-10 text-center text-xs text-slate-400">Memuat hak akses...</p> : <form onSubmit={handleAccessSubmit} className="space-y-5 pt-5">
              <div><div className="flex justify-between items-center mb-2"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Role Pengguna</p><span className="text-[10px] text-slate-400">{accessForm.roles.length} dipilih</span></div><div className="grid sm:grid-cols-2 gap-2">{accessOptions.roles.map((role) => <label key={role.id} className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"><input type="checkbox" checked={accessForm.roles.includes(role.name)} onChange={() => togglePermission(role.name, "roles", setAccessForm)} className="accent-emerald-600" /><span className="text-xs font-medium text-slate-700">{role.name}</span></label>)}</div></div>
              <div><div className="flex justify-between items-center mb-2"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Custom Akses Menu</p><span className="text-[10px] text-slate-400">Override langsung user</span></div><div className="grid sm:grid-cols-2 gap-2">{accessOptions.permissions.map((permission) => <label key={permission.id} className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"><input type="checkbox" checked={accessForm.permissions.includes(permission.name)} onChange={() => togglePermission(permission.name, "permissions", setAccessForm)} className="accent-emerald-600" /><span className="min-w-0"><span className="block text-xs font-bold text-slate-700 truncate">{getPermissionMeta(permission.name).menu}</span><span className="block text-[10px] text-slate-400 truncate">{getPermissionMeta(permission.name).action}</span></span></label>)}</div></div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100"><button type="button" onClick={() => setAccessModal({ show: false, user: null })} className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50">Batal</button><button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2"><Save className="w-4 h-4" /> Simpan Akses</button></div>
            </form>}
          </div>
        </div>
      )}

      {/* MODAL 2: KONFIRMASI HAPUS */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center font-sans">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-800 mb-1">
              Hapus Pengguna?
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus pengguna{" "}
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