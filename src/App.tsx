/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection, onSnapshot, query, where, getDocs,
  orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData,
} from 'firebase/firestore';
import { db, auth, onAuthStateChanged, firebaseSignOut } from './lib/firebase';
import { seedInitialArticlesIfEmpty } from './lib/seedData';
import { seedCategoriesIfEmpty } from './lib/categories';
import { Article, CategoryType, Category, NewsroomUser, SiteSettings, UserProfile } from './types';
import { fetchNewsroomUser } from './lib/newsroom';
import { isNewsroomMember, isPublicallyVisible } from './lib/roles';
import { resolveLogoUrl, subscribeSiteSettings } from './lib/settings';
import { articlePath, idFromSlug } from './lib/slug';

/**
 * Jumlah berita yang diambil sekali muat.
 *
 * Sebelumnya seluruh koleksi diambil sekaligus. Itu aman waktu artikelnya
 * masih puluhan, tapi Firestore menagih per dokumen yang dibaca — dengan 500
 * artikel, satu pengunjung membuka beranda berarti 500 pembacaan. Dibatasi di
 * sini, sisanya diambil lewat tombol "Muat Lagi".
 */
const UKURAN_HALAMAN = 20;

// Components
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { CategoryGrid } from './components/CategoryGrid';
import { Sidebar } from './components/Sidebar';
import { ArticleDetail } from './components/ArticleDetail';
import { AuthModal } from './components/AuthModal';
import { ArticleEditorModal } from './components/ArticleEditorModal';
import { ArticleManagerModal } from './components/ArticleManagerModal';
import { AdManagerModal } from './components/AdManagerModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { SearchOverlay } from './components/SearchOverlay';
import { AdBanner } from './components/AdBanner';
import { Footer } from './components/Footer';
import { StaticPageView } from './components/StaticPageView';
import { BreakingTicker } from './components/BreakingTicker';
import { Newsroom } from './components/Newsroom';
import { NewsroomLogin } from './components/NewsroomLogin';
import { StaticPageSlug, STATIC_PAGE_SLUGS } from './lib/staticPages';

export default function App({ newsroom = false }: { newsroom?: boolean }) {
  const {
    id: articleIdParam,
    slug: articleSlugParam,
    tag: tagParam,
    pageSlug,
  } = useParams<{ id?: string; slug?: string; tag?: string; pageSlug?: string }>();
  const navigate = useNavigate();

  const [articles, setArticles] = useState<Article[]>([]);
  // Berita halaman berikutnya, diambil terpisah lewat tombol "Muat Lagi".
  const [olderArticles, setOlderArticles] = useState<Article[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  /*
   * Pesan kegagalan pengambilan berita.
   *
   * Sebelumnya kegagalan tidak dibedakan dari "memang belum ada berita":
   * dua-duanya menghasilkan halaman kosong. Lebih buruk lagi, tombol "Muat
   * Berita Lainnya" tetap muncul karena hasMore masih bernilai awal — jadi
   * kelihatan seolah ada berita lain yang menunggu, padahal kuerinya patah.
   */
  const [feedError, setFeedError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'Semua'>('Semua');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [newsroomUser, setNewsroomUser] = useState<NewsroomUser | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  // Selected article is derived from the URL (/artikel/:id) instead of local
  // state, so every article has its own shareable, bookmarkable link.
  //
  // Pembaca umum hanya melihat berita yang sudah Published dan masih aktif.
  // Kru redaksi bisa membuka draft/berita nonaktif untuk pratinjau.
  const viewerIsAdmin = isNewsroomMember(newsroomUser);
  const activeCategoryNames = categories.filter(c => c.isActive).map(c => c.name);
  const allLoaded = [...articles, ...olderArticles];
  const lookupPool = viewerIsAdmin ? allLoaded : allLoaded.filter(isPublicallyVisible);

  // Alamat baru menaruh ID di ujung slug; alamat lama membawa ID apa adanya.
  const currentArticleId = articleSlugParam
    ? idFromSlug(articleSlugParam)
    : articleIdParam ?? null;

  /*
   * Pencocokan berlapis, supaya tautan yang terlanjur tersebar tetap terbuka:
   *   1. cocok persis dengan ID hasil pemisahan
   *   2. kalau gagal, cari artikel yang ID-nya mengakhiri potongan alamat —
   *      ini menyelamatkan alamat versi tanda hubung tunggal yang sempat
   *      terbit, termasuk yang ber-ID seperti "art-2".
   */
  const selectedArticle = currentArticleId
    ? lookupPool.find(a => a.id === currentArticleId)
      ?? (articleSlugParam
            ? lookupPool.find(a => articleSlugParam.endsWith(a.id)) ?? null
            : null)
    : null;

  const selectArticle = (article: Article) => navigate(articlePath(article));
  const goHome = () => navigate('/');
  const selectTag = (tag: string) => navigate(`/tag/${encodeURIComponent(tag)}`);
  const validPageSlug: StaticPageSlug | null =
    pageSlug && (STATIC_PAGE_SLUGS as readonly string[]).includes(pageSlug)
      ? (pageSlug as StaticPageSlug)
      : null;

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [articleEditorOpen, setArticleEditorOpen] = useState(false);
  const [articleManagerOpen, setArticleManagerOpen] = useState(false);
  const [adManagerOpen, setAdManagerOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);

  // Auth User & Bookmarks
  const [bookmarkedArticleIds, setBookmarkedArticleIds] = useState<string[]>([]);

  // Seed initial data if Firestore is empty and listen for real-time updates
  useEffect(() => {
    // 1. Trigger initial seed check
    seedInitialArticlesIfEmpty();
    seedCategoriesIfEmpty();

    // 2. Listen to real-time articles stream from Firestore
    //
    // Aturan Firestore menilai KUERI-nya, bukan hasilnya. Karena draft hanya
    // boleh dibaca kru, kueri tanpa filter akan ditolak seluruhnya untuk
    // pembaca umum — jadi pembaca meminta khusus yang berstatus Published,
    // sedangkan kru redaksi baru boleh mengambil semuanya.
    //
    // Diurutkan dari yang terbaru dan dibatasi UKURAN_HALAMAN. Kombinasi
    // where('status') + orderBy('createdAt') memerlukan indeks gabungan di
    // Firestore — definisinya ada di firestore.indexes.json.
    const articlesQuery = viewerIsAdmin
      ? query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(UKURAN_HALAMAN))
      : query(
          collection(db, 'articles'),
          where('status', '==', 'Published'),
          orderBy('createdAt', 'desc'),
          limit(UKURAN_HALAMAN)
        );

    const unsubscribe = onSnapshot(articlesQuery, (snapshot) => {
      const fetched: Article[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ ...docSnap.data(), id: docSnap.id } as Article);
      });
      setArticles(fetched);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
      setHasMore(snapshot.docs.length === UKURAN_HALAMAN);
      setOlderArticles([]);   // halaman lanjutan disusun ulang dari awal
      setFeedError(null);
      setLoading(false);
    }, (error) => {
      console.error('Firestore articles stream error:', error);
      // Indeks gabungan belum jadi adalah penyebab paling sering, jadi
      // disebut langsung supaya tidak perlu menebak-nebak dari console.
      setFeedError(
        String(error?.message || '').includes('requires an index')
          ? 'Indeks Firestore untuk beranda belum aktif. Buka Console browser, klik tautan pembuatan indeks di pesan error, tunggu statusnya jadi Enabled, lalu muat ulang.'
          : `Gagal memuat berita: ${error?.message || 'kesalahan tidak diketahui'}`
      );
      setHasMore(false);   // jangan tawarkan "muat lagi" kalau memuat saja gagal
      setLoading(false);
    });

    // 3. Listen to real-time categories stream from Firestore
    const categoriesQuery = collection(db, 'categories');
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const fetched: Category[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ ...docSnap.data(), id: docSnap.id } as Category);
      });
      fetched.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setCategories(fetched);
    }, (error) => {
      console.error('Firestore categories stream error:', error);
    });

    return () => {
      unsubscribe();
      unsubscribeCategories();
    };
    // Dijalankan ulang saat kru login/logout, supaya kueri berpindah antara
    // "hanya Published" dan "semua artikel".
  }, [viewerIsAdmin]);

  /*
   * Alihkan alamat lama /artikel/{id} ke /berita/{judul}-{id}.
   *
   * Dipakai replace, bukan push, supaya tombol "kembali" di browser tidak
   * terjebak memantul antara alamat lama dan baru.
   */
  useEffect(() => {
    if (articleIdParam && selectedArticle) {
      navigate(articlePath(selectedArticle), { replace: true });
    }
  }, [articleIdParam, selectedArticle, navigate]);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          isAnonymous: currentUser.isAnonymous
        });

        // Sesi anonim dipakai untuk komentar tamu — bukan kru redaksi.
        if (currentUser.isAnonymous) {
          setNewsroomUser(null);
        } else {
          setNewsroomUser(
            await fetchNewsroomUser(currentUser.uid, currentUser.email, currentUser.displayName)
          );
        }
      } else {
        setUser(null);
        setNewsroomUser(null);
        setBookmarkedArticleIds([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Logo situs bisa diganti dari panel redaksi tanpa deploy ulang.
  useEffect(() => subscribeSiteSettings(setSiteSettings), []);

  // Fetch bookmarks when user changes
  const fetchUserBookmarks = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'bookmarks'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const ids: string[] = [];
      snapshot.forEach((docSnap) => {
        ids.push(docSnap.data().articleId);
      });
      setBookmarkedArticleIds(ids);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserBookmarks();
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  /**
   * Ambil satu halaman berita berikutnya.
   *
   * Halaman pertama tetap memakai onSnapshot supaya berita baru muncul
   * seketika. Halaman lanjutan diambil sekali jalan dengan getDocs — berita
   * lama praktis tidak berubah, jadi tidak perlu dipantau terus-menerus, dan
   * memantaunya justru menambah beban pembacaan.
   */
  const loadMoreArticles = async () => {
    if (!lastDoc || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const q = viewerIsAdmin
        ? query(collection(db, 'articles'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(UKURAN_HALAMAN))
        : query(
            collection(db, 'articles'),
            where('status', '==', 'Published'),
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(UKURAN_HALAMAN)
          );
      const snap = await getDocs(q);
      const fetched: Article[] = [];
      snap.forEach(d => fetched.push({ ...d.data(), id: d.id } as Article));
      setOlderArticles(prev => [...prev, ...fetched]);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? lastDoc);
      setHasMore(snap.docs.length === UKURAN_HALAMAN);
    } catch (err) {
      console.error('Gagal memuat berita berikutnya:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Semua berita yang sudah dimuat dan boleh dilihat pembaca.
  const feedArticles = viewerIsAdmin
    ? allLoaded
    : allLoaded.filter(isPublicallyVisible);

  // Halaman tag: berita yang memuat tag tertentu, tidak peduli kategorinya.
  const activeTag = tagParam ? decodeURIComponent(tagParam) : null;
  const taggedArticles = activeTag
    ? feedArticles.filter(a =>
        (a.tags || []).some(t => t.toLowerCase() === activeTag.toLowerCase()))
    : [];

  const bookmarkedArticles = feedArticles.filter(a => bookmarkedArticleIds.includes(a.id));
  const heroArticle = feedArticles.find(a => a.isHero) || feedArticles[0];
  const logoUrl = resolveLogoUrl(siteSettings);

  const openArticleEditor = (article: Article | null) => {
    setEditingArticle(article);
    setArticleEditorOpen(true);
  };

  return (
    // pb-16 di layar HP menyediakan ruang setinggi bilah aksi bawah (64px),
    // supaya bagian akhir footer tidak tertutup bilah itu. Di layar besar
    // bilahnya tidak ada, jadi jaraknya dinolkan.
    <div className="bg-[#f9f6f2] text-[#170c0a] min-h-screen flex flex-col font-sans antialiased selection:bg-[#e15b00] selection:text-white pb-16 lg:pb-0">
      {/* Top Header Navigation */}
      <Header
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          goHome();
        }}
        onOpenSearch={() => setSearchOverlayOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenArticleEditor={() => {
          if (!user) {
            setAuthModalOpen(true);
          } else {
            setArticleManagerOpen(true);
          }
        }}
        onOpenAdManager={() => {
          if (!user) {
            setAuthModalOpen(true);
          } else {
            setAdManagerOpen(true);
          }
        }}
        onOpenCategoryManager={() => {
          if (!user) {
            setAuthModalOpen(true);
          } else {
            setCategoryManagerOpen(true);
          }
        }}
        categories={activeCategoryNames}
        onGoHome={() => goHome()}
        onOpenBookmarks={() => setAuthModalOpen(true)}
        user={user}
        newsroomUser={newsroomUser}
        logoUrl={logoUrl}
        onOpenNewsroom={() => navigate('/redaksi')}
        onSignOut={handleSignOut}
        bookmarkCount={bookmarkedArticleIds.length}
      />

      {/* Running text breaking news */}
      {!newsroom && (
        <BreakingTicker articles={feedArticles} onSelectArticle={selectArticle} />
      )}

      {/* Main Body Content */}
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-6 relative mt-6">
        {newsroom ? (
          /* Ruang Redaksi PABEN — hanya untuk kru yang sudah login */
          newsroomUser ? (
            <Newsroom
              currentUser={newsroomUser}
              articles={articles}
              categories={categories}
              onEditArticle={(art) => openArticleEditor(art)}
              onCreateArticle={() => openArticleEditor(null)}
              onOpenAdManager={() => setAdManagerOpen(true)}
              onOpenCategoryManager={() => setCategoryManagerOpen(true)}
              onSignOut={async () => {
                await handleSignOut();
                goHome();
              }}
              onGoHome={() => goHome()}
            />
          ) : (
            <NewsroomLogin onSignedIn={() => { /* onAuthStateChanged memuat profilnya */ }} />
          )
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-[#170c0a] border-t-[#e15b00] rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-[#170c0a] animate-pulse">
              Memuat Berita Terkini PABEN.ID...
            </p>
          </div>
        ) : selectedArticle ? (
          /* Article Detail View — isi berita di kiri, iklan kotak di kanan */
          <div className="flex flex-col xl:flex-row gap-8">
            <main className="flex-grow w-full min-w-0">
              <ArticleDetail
                article={selectedArticle}
                allArticles={feedArticles}
                user={user}
                onBack={() => goHome()}
                onSelectArticle={selectArticle}
                onSelectTag={selectTag}
                onOpenAuth={() => setAuthModalOpen(true)}
                onBookmarkChanged={fetchUserBookmarks}
                onEdit={(art) => {
                  setEditingArticle(art);
                  setArticleEditorOpen(true);
                }}
              />
            </main>

            {/*
              Kolom iklan di sisi kanan halaman artikel.
              Dibuat sticky supaya iklan tetap terlihat selama pembaca
              menggulir berita yang panjang — kalau ikut tergulir, iklan hanya
              tampil beberapa detik di awal lalu hilang sepanjang sisa artikel.
            */}
            <aside className="w-full xl:w-[320px] flex-shrink-0">
              <div className="xl:sticky xl:top-28 space-y-4">
                <p className="text-[10px] font-mono tracking-widest text-stone-400 uppercase text-center">
                  Iklan Sponsor
                </p>
                <AdBanner type="square" />
              </div>
            </aside>
          </div>
        ) : validPageSlug ? (
          /* Static Footer Page (Tentang / Redaksi / Kontak Kami / Iklan) */
          <StaticPageView
            slug={validPageSlug}
            user={user}
            onBack={() => goHome()}
          />
        ) : activeTag ? (
          /* Halaman kumpulan berita bertag sama */
          <div className="flex flex-col xl:flex-row gap-8">
            <main className="flex-grow w-full min-w-0">
              <div className="mb-6">
                <button
                  onClick={goHome}
                  className="text-xs font-bold text-[#170c0a] hover:underline mb-3 inline-block"
                >
                  &larr; Kembali ke Beranda
                </button>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#170c0a] font-display">
                  Tag: <span className="text-[#e15b00]">#{activeTag}</span>
                </h1>
                <p className="text-sm text-stone-500 mt-1">
                  {taggedArticles.length} berita ditemukan
                </p>
              </div>

              {taggedArticles.length === 0 ? (
                <p className="text-sm text-stone-500 italic bg-white border border-dashed border-stone-200 rounded-xl p-8 text-center">
                  Belum ada berita dengan tag ini pada halaman yang sudah dimuat.
                  {hasMore && ' Coba muat berita lainnya di beranda.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {taggedArticles.map(art => (
                    <article
                      key={art.id}
                      onClick={() => selectArticle(art)}
                      className="group cursor-pointer bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-md transition-all p-3"
                    >
                      <div className="h-40 w-full mb-3 overflow-hidden rounded-lg bg-stone-200">
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-[#e15b00] uppercase tracking-wider">
                        {art.category}
                      </span>
                      <h3 className="font-bold text-base text-stone-900 group-hover:text-[#170c0a] line-clamp-2 leading-snug mt-1">
                        {art.title}
                      </h3>
                    </article>
                  ))}
                </div>
              )}
            </main>

            <aside className="w-full xl:w-[320px] flex-shrink-0">
              <Sidebar articles={feedArticles} onSelectArticle={selectArticle} />
            </aside>
          </div>
        ) : (
          /* News Feed Portal View */
          <div className="flex flex-col xl:flex-row gap-8">
            {/* Left Ad Skyscraper (Desktop view) */}
            <aside className="hidden lg:block w-[140px] flex-shrink-0">
              <AdBanner type="skyscraper" />
            </aside>

            {/* Main Center News Stream */}
            <main className="flex-grow w-full min-w-0">
              {/* Featured Hero Article */}
              {selectedCategory === 'Semua' && heroArticle && (
                <HeroSection
                  article={heroArticle}
                  onSelectArticle={selectArticle}
                />
              )}

              {feedError && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-5 mb-6">
                  <p className="font-bold text-sm mb-1">Berita gagal dimuat</p>
                  <p className="text-xs leading-relaxed">{feedError}</p>
                </div>
              )}

              {!feedError && feedArticles.length === 0 && (
                <div className="bg-white border border-dashed border-stone-300 rounded-xl p-10 text-center mb-6">
                  <p className="text-sm font-bold text-stone-700 mb-1">Belum ada berita yang diterbitkan</p>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Berita baru selalu dimulai sebagai Draft. Buka
                    <span className="font-mono font-bold"> /redaksi &rarr; Monitor </span>
                    untuk mengubah statusnya jadi Published.
                  </p>
                </div>
              )}

              {/* Categorized News Grid */}
              <CategoryGrid
                articles={feedArticles}
                categories={activeCategoryNames}
                selectedCategory={selectedCategory}
                onSelectArticle={selectArticle}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
              />

              {/* Berita lama diambil hanya kalau pembaca memintanya */}
              {hasMore && feedArticles.length > 0 && (
                <div className="flex justify-center py-8">
                  <button
                    onClick={loadMoreArticles}
                    disabled={loadingMore}
                    className="bg-[#170c0a] hover:bg-[#2f201d] text-white px-6 py-2.5 rounded-full text-sm font-bold disabled:opacity-60 transition-colors shadow-sm"
                  >
                    {loadingMore ? 'Memuat...' : 'Muat Berita Lainnya'}
                  </button>
                </div>
              )}
            </main>

            {/* Right Ad Skyscraper (Desktop view) - mirrors the left one */}
            <aside className="hidden lg:block w-[140px] flex-shrink-0">
              <AdBanner type="skyscraper" />
            </aside>

            {/* Right Sidebar (300px) */}
            <aside className="w-full xl:w-[320px] flex-shrink-0">
              <Sidebar
                articles={feedArticles}
                onSelectArticle={selectArticle}
              />
            </aside>
          </div>
        )}
      </div>

      {/* Bottom Horizontal Ad Billboard */}
      {!loading && !newsroom && (
        <div className="max-w-5xl mx-auto px-4 w-full">
          <AdBanner type="billboard" />
        </div>
      )}

      {/* Footer */}
      <Footer
        categories={activeCategoryNames}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          goHome();
        }}
        onGoHome={() => goHome()}
      />

      {/* Modals & Overlays */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        user={user}
        bookmarkedArticles={bookmarkedArticles}
        onSelectArticle={selectArticle}
        onSignOut={handleSignOut}
      />

      <ArticleManagerModal
        isOpen={articleManagerOpen}
        articles={articles}
        onClose={() => setArticleManagerOpen(false)}
        onAddNew={() => {
          setEditingArticle(null);
          setArticleEditorOpen(true);
        }}
        onEdit={(art) => {
          setEditingArticle(art);
          setArticleEditorOpen(true);
        }}
      />

      <ArticleEditorModal
        key={`${articleEditorOpen}-${editingArticle?.id ?? 'new'}`}
        isOpen={articleEditorOpen}
        articleToEdit={editingArticle}
        categories={activeCategoryNames}
        currentUser={newsroomUser}
        onClose={() => {
          setArticleEditorOpen(false);
          setEditingArticle(null);
        }}
        onSaved={() => {
          // Stream will auto update
          setEditingArticle(null);
        }}
      />

      <AdManagerModal
        isOpen={adManagerOpen}
        onClose={() => setAdManagerOpen(false)}
      />

      <CategoryManagerModal
        isOpen={categoryManagerOpen}
        categories={categories}
        onClose={() => setCategoryManagerOpen(false)}
      />

      <SearchOverlay
        isOpen={searchOverlayOpen}
        onClose={() => setSearchOverlayOpen(false)}
        articles={feedArticles}
        onSelectArticle={selectArticle}
      />
    </div>
  );
}
