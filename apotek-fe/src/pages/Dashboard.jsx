import { useEffect, useState } from 'react';
import { Pill, AlertTriangle, TrendingUp, Users, ShoppingCart, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';

export default function Dashboard() {
  const [drugs, setDrugs] = useState([]);
  const [sales, setSales] = useState([]);
  const [patientsCount, setPatientsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [drugsRes, salesRes, patientsRes] = await Promise.all([
          apiClient.get('/drugs'),
          apiClient.get('/sales'),
          apiClient.get('/patients'),
        ]);

        if (drugsRes.data.success) setDrugs(drugsRes.data.data || []);
        if (salesRes.data.success) setSales(salesRes.data.data.data || []);
        if (patientsRes.data.success) setPatientsCount(patientsRes.data.data.total || 0);
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Metrik Statistik
  const totalStock = drugs.reduce((acc, curr) => acc + (curr.total_stock || 0), 0);
  const lowStockDrugs = drugs.filter((d) => d.total_stock <= 10);
  
  // Hitung total pendapatan hari ini
  const todayRevenue = sales.reduce((acc, curr) => acc + Number(curr.final_amount || 0), 0);

  // Ambil batch obat yang mendekati kedaluwarsa
  const expiringBatches = drugs
    .flatMap((d) => (d.batches || []).map((b) => ({ ...b, drug_name: d.name, unit: d.unit })))
    .filter((b) => b.stock_qty > 0)
    .sort((a, b) => new Date(a.expired_date) - new Date(b.expired_date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Statistik Apotek</h1>
        <p className="text-sm text-slate-500">Ringkasan operasional, transaksi POS, dan manajemen stok FEFO real-time</p>
      </div>

      {/* Grid Cards Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pendapatan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Penjualan</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              Rp {todayRevenue.toLocaleString('id-ID')}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> {sales.length} Transaksi Selesai
            </span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Stok Obat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Item Obat</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalStock} Unit</h3>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              Dari {drugs.length} Jenis Produk
            </span>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <Pill className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Stok Menipis */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stok Menipis (&le; 10)</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{lowStockDrugs.length} Produk</h3>
            <span className="text-[11px] text-amber-600 font-medium mt-1 block">Perlu Restock Batch</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Pasien Terdaftar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pasien Terdaftar</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{patientsCount} Pasien</h3>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Terintegrasi RME</span>
          </div>
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid 2 Kolom: Peringatan FEFO & Transaksi Terakhir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom 1: Warning Kedaluwarsa Terdekat (FEFO Priority) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-800">Prioritas FEFO (Expiring Soon)</h3>
            </div>
            <Link to="/drugs" className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-0.5">
              Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {expiringBatches.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Tidak ada batch mendekati kedaluwarsa.</p>
            ) : (
              expiringBatches.map((batch) => (
                <div key={batch.id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-slate-800">{batch.drug_name}</h5>
                    <p className="text-slate-500 font-mono">No. Batch: {batch.batch_number}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-700 block">ED: {batch.expired_date}</span>
                    <span className="text-slate-500">Sisa: {batch.stock_qty} {batch.unit}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolom 2: Transaksi POS Terbaru */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800">Riwayat Penjualan Terakhir</h3>
            </div>
            <Link to="/pos" className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-0.5">
              Buka Kasir <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 divide-y divide-slate-100">
            {sales.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Belum ada transaksi penjualan hari ini.</p>
            ) : (
              sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{sale.invoice_number}</p>
                    <p className="text-slate-400">Metode: {sale.payment_method}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 block">
                      Rp {Number(sale.final_amount).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}