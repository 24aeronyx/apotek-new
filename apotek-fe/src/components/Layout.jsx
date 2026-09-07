import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Pill,
  ShoppingCart,
  Users,
  Stethoscope,
  LogOut,
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  ShoppingBag,
  Menu,
  ChevronLeft,
  UserCheck,
  Shield,
  Activity,
  Truck,
} from "lucide-react";
import apiClient from "../api/axios";
import branding from "../config/branding";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const permissions = user.permissions || [];
  const roles = (user.roles || []).map((role) => String(role).toLowerCase());
  const hasAllAccess = roles.includes("admin") || roles.includes("super admin");

  const canAccess = (permission) =>
    hasAllAccess || !permission || permissions.includes(permission);

  const handleLogout = async () => {
    try {
      await apiClient.post("/logout");
    } catch (e) {
      // Abaikan error jika token kadaluarsa
    } finally {
      localStorage.clear();
      navigate("/login");
    }
  };

  // Navigasi Terkelompok (Grouped Navigation)
  const navGroups = [
    {
      groupLabel: "UTAMA",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      groupLabel: "PELAYANAN & RME",
      items: [
        { label: "Kunjungan", path: "/rme", icon: Stethoscope, permission: "view-rme" },
        { label: "Kasir", path: "/pos", icon: ShoppingCart, permission: "process-pos-sale" },
        { label: "Riwayat Penjualan", path: "/sales-history", icon: ShoppingBag, permission: "process-pos-sale" },
        { label: "Laporan", path: "/reports", icon: FileText, permission: "view-reports" },
      ],
    },
    {
      groupLabel: "INVENTARIS & FARMASI",
      items: [
        { label: "Master Obat", path: "/drugs", icon: Pill, permission: "view-drugs" },
        { label: "Master Supplier", path: "/suppliers", icon: Truck, permission: "manage-stock-in" },
        { label: "Faktur Pembelian", path: "/purchases", icon: FileText, permission: "manage-stock-in" },
        { label: "Stok Opname", path: "/stock-opname", icon: ClipboardCheck, permission: "view-stock" },
        { label: "Kartu Stok", path: "/stock-card", icon: ClipboardCheck, permission: "view-stock" },
      ],
    },
    {
      groupLabel: "MANAJEMEN SISTEM",
      items: [
        { label: "Master Pasien", path: "/patients", icon: Users, permission: "view-patients" },
        { label: "Master Dokter", path: "/doctors", icon: UserCheck, permission: "view-doctors" },
        { label: "Master User", path: "/users", icon: Shield, permission: "manage-users" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* SIDEBAR MODERN */}
      <aside
        className={`print:hidden bg-slate-900 text-slate-300 flex flex-col justify-between transition-all duration-300 ease-in-out relative border-r border-slate-800 ${
          collapsed ? "w-20 p-3" : "w-64 p-4"
        }`}
      >
        {/* Tombol Toggle Buka/Tutup Sidebar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded-full shadow-md border border-slate-900 transition-all z-20"
          title={collapsed ? "Buka Sidebar" : "Tutup Sidebar"}
        >
          {collapsed ? <Menu className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Brand Logo & Header */}
        <div>
          <div className={`flex items-center gap-3 py-3 border-b border-slate-800/80 mb-4 ${collapsed ? "justify-center" : "px-2"}`}>
            <div className="bg-linear-to-tr from-emerald-600 to-teal-400 p-2 rounded-xl text-white shadow-lg shadow-emerald-900/30 shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <h2 className="font-extrabold text-white text-base tracking-tight leading-tight">{branding.name}</h2>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">{branding.tagline}</span>
              </div>
            )}
          </div>

          {/* Grouped Menu List */}
          <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-170px)] pr-1 custom-scrollbar">
            {navGroups.map((group, idx) => {
              const visibleItems = group.items.filter((item) => canAccess(item.permission));
              if (visibleItems.length === 0) return null;

              return (
              <div key={idx} className="space-y-1">
                {!collapsed && (
                  <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    {group.groupLabel}
                  </p>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.label : ""}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40 font-bold"
                          : "hover:bg-slate-800/80 text-slate-400 hover:text-slate-200"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
              );
            })}
          </div>
        </div>

        {/* User Profile Card & Logout */}
        <div className={`pt-3 border-t border-slate-800/80 ${collapsed ? "flex flex-col items-center gap-2" : "flex items-center justify-between px-1"}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 shadow-inner">
              {(user.name || "U").slice(0, 2).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="truncate">
                <p className="text-xs font-bold text-slate-200 truncate">{user.name || "User"}</p>
                <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                  {user.role || user.roles?.[0] || "Staff"}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all"
            title="Keluar dari Akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen print:max-h-none print:overflow-visible print:p-0">
        <Outlet />
      </main>
    </div>
  );
}