# Template Identitas Klien

Identitas aplikasi dipisahkan dari komponen agar dapat digunakan untuk banyak apotek/klinik.

## Backend

Salin variabel berikut ke `apotek-api/.env`:

```env
BRAND_NAME="Apotek Asy-Syifa"
BRAND_TAGLINE="Apotek Online"
BRAND_ADDRESS="Jl. Kesehatan No. 123, Kota"
BRAND_LICENSE="SIPA: 446/001/SIPA/2026"
BRAND_PHONE=
BRAND_REPORT_SUBTITLE="Laporan resmi operasional apotek"
BRAND_RECEIPT_FOOTER="Terima Kasih & Semoga Lekas Sembuh"
```

Setelah mengubahnya:

```bash
php artisan config:clear
php artisan config:cache
```

## Frontend

Salin variabel berikut ke `apotek-fe/.env`:

```env
VITE_BRAND_NAME="Apotek Asy-Syifa"
VITE_BRAND_TAGLINE="Apotek Online"
VITE_BRAND_ADDRESS="Jl. Kesehatan No. 123, Kota"
VITE_BRAND_LICENSE="SIPA: 446/001/SIPA/2026"
VITE_BRAND_PHONE=
VITE_BRAND_RECEIPT_FOOTER="Terima Kasih & Semoga Lekas Sembuh"
```

Setelah mengubahnya, jalankan ulang dev server atau build frontend.

Identitas ini dipakai oleh login, sidebar, struk transaksi, laporan, Kartu Stok, dan Stok Opname.
