import { siteUrlFrom } from './_firestore.js';

/**
 * robots.txt dibuat saat diminta, bukan disimpan sebagai berkas statis.
 *
 * Alasannya baris `Sitemap:` wajib memuat alamat MUTLAK. Kalau berkasnya
 * statis, alamat itu harus dipatok ke satu domain — dan begitu situs berpindah
 * dari *.vercel.app ke domain sendiri, robots.txt menunjuk sitemap di domain
 * yang salah. Google mengabaikan sitemap lintas domain yang belum diverifikasi,
 * jadi efeknya sama dengan tidak punya sitemap sama sekali.
 */
export default function handler(req, res) {
  const SITE_URL = siteUrlFrom(req);

  const txt = `# PABEN.ID
User-agent: *
Allow: /

# Ruang Redaksi tidak untuk diindeks — halaman internal kru.
# Catatan: larangan di sini hanya menghentikan PERAYAPAN. Yang benar-benar
# mengeluarkannya dari hasil pencarian adalah tag noindex di aplikasi.
Disallow: /redaksi

# Hasil pencarian internal tidak boleh diindeks — isinya berubah-ubah dan
# menghasilkan alamat tak terbatas.
Disallow: /*?q=

Sitemap: ${SITE_URL}/sitemap.xml
`;

  res.setHeader('content-type', 'text/plain; charset=utf-8');
  res.setHeader('cache-control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).send(txt);
}
