import { useEffect } from 'react';

/**
 * Meta per halaman untuk aplikasi satu berkas (SPA).
 *
 * Kenapa perlu: `index.html` hanya punya SATU judul dan SATU deskripsi. Tanpa
 * hook ini setiap berita di mata perayap punya deskripsi yang sama persis —
 * dan Google memperlakukan halaman berdeskripsi kembar sebagai kandidat
 * duplikat, yang untuk situs berita berarti hanya satu yang ditampilkan.
 *
 * Kenapa canonical wajib: `vercel.json` mengarahkan SEMUA alamat ke
 * `index.html` dengan status 200. Artinya /berita/apa-saja-ngawur juga
 * membalas 200 berisi halaman penuh. Tanpa canonical, satu berita bisa
 * terindeks di alamat tak terhingga banyaknya dan nilainya terpecah.
 *
 * Semua tag yang dibuat di sini ditandai `data-seo` supaya bisa dibersihkan
 * saat pindah halaman — kalau tidak, tag halaman sebelumnya menumpuk dan
 * perayap membaca yang paling atas, yaitu yang paling basi.
 */

const SITE_NAME = 'PABEN.ID';
/*
 * Deskripsi bawaan situs.
 *
 * Kalimatnya harus SAMA PERSIS dengan yang ada di index.html, middleware.ts,
 * dan api/_firestore.js. Kalau berbeda, satu halaman bisa punya dua deskripsi
 * yang bersaing tergantung siapa yang membacanya — perayap pratinjau membaca
 * middleware, Googlebot membaca yang dipasang hook ini.
 *
 * Jangan pakai bentukan "berita faktual & terupdate" atau turunannya. Itu
 * tagline PASEK.ID, basis codebase ini, bukan milik PABEN.ID.
 */
const DEFAULT_DESC =
  'Wibawa dalam setiap Berita. PABEN.ID mewartakan kabar nasional, ekonomi, ' +
  'olahraga, teknologi, hiburan, daerah, dan opini — dilaporkan cermat dan ' +
  'bertanggung jawab.';

export interface SeoOptions {
  /** Judul halaman TANPA " - PABEN.ID" — bagian itu ditambahkan di sini. */
  title?: string;
  description?: string;
  /**
   * Alamat kanonis relatif, mis. "/berita/judul--abc123".
   * Dikosongkan = pakai alamat yang sedang dibuka, tanpa query string.
   */
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  /** Halaman internal yang tidak boleh masuk indeks (mis. Ruang Redaksi). */
  noindex?: boolean;
  /** Structured data tambahan; dirender jadi <script type="application/ld+json">. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.setAttribute('data-seo', '');
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useSeo(opts: SeoOptions) {
  const { title, description, path, image, type = 'website', noindex, jsonLd } = opts;

  // Objek jsonLd hampir selalu dibuat baru tiap render, jadi kalau dipakai
  // langsung sebagai dependency efeknya jalan terus-menerus. Serialisasi dulu.
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const judulSebelumnya = document.title;
    const fullTitle = title ? `${title} - ${SITE_NAME}` : SITE_NAME;
    const desc = description?.trim() || DEFAULT_DESC;
    const origin = window.location.origin;
    const canonical = origin + (path || window.location.pathname);
    const gambar = image || `${origin}/og-default.jpg?v=2`;

    document.title = fullTitle;

    upsertMeta('meta[name="description"]', 'name', 'description', desc);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', desc);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', type);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', gambar);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', gambar);

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      link.setAttribute('data-seo', '');
      document.head.appendChild(link);
    }
    link.href = canonical;

    let robots: HTMLMetaElement | null = null;
    if (noindex) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      robots.content = 'noindex, nofollow';
      robots.setAttribute('data-seo', '');
      document.head.appendChild(robots);
    }

    let ld: HTMLScriptElement | null = null;
    if (jsonLdKey) {
      ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.text = jsonLdKey;
      ld.setAttribute('data-seo', '');
      document.head.appendChild(ld);
    }

    return () => {
      document.title = judulSebelumnya;
      robots?.remove();
      ld?.remove();
    };
  }, [title, description, path, image, type, noindex, jsonLdKey]);
}
