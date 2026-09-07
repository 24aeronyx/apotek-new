const branding = {
  name: import.meta.env.VITE_BRAND_NAME || "Apotek Asy-Syifa",
  tagline: import.meta.env.VITE_BRAND_TAGLINE || "Apotek Online",
  address: import.meta.env.VITE_BRAND_ADDRESS || "Jl. Kesehatan No. 123, Kota",
  license: import.meta.env.VITE_BRAND_LICENSE || "SIPA: 446/001/SIPA/2026",
  phone: import.meta.env.VITE_BRAND_PHONE || "",
  receiptFooter:
    import.meta.env.VITE_BRAND_RECEIPT_FOOTER ||
    "Terima Kasih & Semoga Lekas Sembuh",
};

export default branding;
