import { useEffect, useState } from 'react';
import { Pill, AlertTriangle, TrendingUp, ShoppingCart, ArrowUpRight, ReceiptText, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';

export default function Dashboard() {
  const [sales, setSales] = useState([]);
  const [financial, setFinancial] = useState({ sales_total: 0, sales_count: 0, purchase_total: 0, purchase_count: 0, indicative_net: 0 });
  const [inventory, setInventory] = useState({ total_stock: 0, product_count: 0, low_stock_count: 0 });
  const [expiringBatches, setExpiringBatches] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiClient.get('/dashboard');
        if (response.data.success) {
          setFinancial(response.data.financial || financial);
          setInventory(response.data.inventory || inventory);
          setSales(response.data.recent_sales || []);
          setExpiringBatches(response.data.expiring_batches || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      }
    };

    fetchDashboardData();
  }, []);

  // Metrik Statistik
  const money = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Statistik Apotek</h1>
        <p className="text-sm text-slate-500">Ringkasan operasional, transaksi POS, dan manajemen stok FEFO real-time</p>
      </div>

      {/* Grid Cards Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Penjualan dibayar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Penjualan Dibayar</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {money(financial.sales_total)}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> {financial.sales_count} transaksi hari ini
            </span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Nilai pembelian */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nilai Pembelian</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{money(financial.purchase_total)}</h3>
            <span className="text-[11px] text-amber-600 font-medium mt-1 block">
              {financial.purchase_count} faktur · nilai barang masuk
            </span>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
            <ReceiptText className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Arus bersih indikatif */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Arus Bersih Indikatif</p>
            <h3 className={`text-2xl font-bold mt-1 ${financial.indicative_net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{money(financial.indicative_net)}</h3>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">Penjualan dikurangi pembelian</span>
          </div>
          <div className="bg-teal-50 p-3 rounded-xl text-teal-600">
            <WalletCards className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Stok */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stok & Produk</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{inventory.total_stock} Unit</h3>
            <span className="text-[11px] text-amber-600 font-medium mt-1 block">{inventory.low_stock_count} produk perlu restock</span>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <Pill className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        Arus bersih indikatif bukan laba bersih. Faktur pembelian saat ini dihitung sebagai nilai barang masuk; status lunas atau hutang supplier belum dipisahkan.
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