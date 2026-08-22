import React, { useState } from 'react';
import { Share2, Search, Menu, X, User as UserIcon, PlusCircle, LogOut, BookmarkCheck, Newspaper, Megaphone, Tag, LayoutGrid } from 'lucide-react';
import { CategoryType, NewsroomUser, UserProfile } from '../types';
import { canManageAds, canManageCategories, isNewsroomMember } from '../lib/roles';

interface HeaderProps {
  selectedCategory: CategoryType | 'Semua';
  onSelectCategory: (category: CategoryType | 'Semua') => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  onOpenArticleEditor: () => void;
  onOpenAdManager: () => void;
  onOpenCategoryManager: () => void;
  categories: CategoryType[];
  onGoHome: () => void;
  onOpenBookmarks: () => void;
  user: UserProfile | null;
  /** Profil kru redaksi, kalau yang login memang kru. Menentukan tombol admin. */
  newsroomUser: NewsroomUser | null;
  /** Logo aktif — bisa diganti dari panel redaksi. */
  logoUrl: string;
  onOpenNewsroom: () => void;
  onSignOut: () => void;
  bookmarkCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenSearch,
  onOpenAuth,
  onOpenArticleEditor,
  onOpenAdManager,
  onOpenCategoryManager,
  categories,
  onGoHome,
  onOpenBookmarks,
  user,
  newsroomUser,
  logoUrl,
  onOpenNewsroom,
  onSignOut,
  bookmarkCount
}) => {
  // null = tertutup. Bilah bawah punya dua panel: daftar kategori dan menu lain.
  const [mobileSheet, setMobileSheet] = useState<null | 'kategori' | 'lainnya'>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userIsAdmin = isNewsroomMember(newsroomUser);
  const showAdsButton = canManageAds(newsroomUser);
  const showCategoryButton = canManageCategories(newsroomUser);

  const handleShareSite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PABEN.ID - Wibawa dalam setiap Berita',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share canceled or error:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Tautan portal berhasil disalin ke papan klip!');
    }
  };

  return (
    <header className="font-sans sticky top-0 z-50 border-b-4 border-[#e15b00] shadow-md">
      {/* Pita atas: latar putih, logo tampil apa adanya tanpa alas tambahan */}
      <div className="bg-white border-b border-stone-200">
      <div className="flex justify-between items-center h-24 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Logo & Brand */}
        <div 
          className="flex items-center gap-3 cursor-pointer select-none flex-shrink-0"
          onClick={() => {
            onSelectCategory('Semua');
            onGoHome();
          }}
        >
          <img
            loading="eager"
            fetchPriority="high"
            decoding="async"
            src={logoUrl}
            alt="PABEN.ID - Wibawa dalam setiap Berita"
            className="h-14 sm:h-16 md:h-[68px] w-auto object-contain hover:scale-105 transition-transform"
          />
        </div>

        {/*
          Actions.
          Di HP seluruh baris ini disembunyikan — bagikan, cari, akun, dan menu
          dipindah ke bilah bawah supaya terjangkau jempol. Di layar besar
          tetap di atas seperti biasa.
        */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          {/* Create Article Button (admin only) */}
          {userIsAdmin && (
            <button
              onClick={onOpenArticleEditor}
              className="hidden sm:flex items-center gap-1.5 bg-[#e15b00] hover:bg-[#a63c00] text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Tambah Berita Baru"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tulis Berita</span>
            </button>
          )}

          {/* Manage Ads Button (Super Admin only) */}
          {showAdsButton && (
            <button
              onClick={onOpenAdManager}
              className="hidden lg:flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-[#170c0a] px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Kelola Iklan"
            >
              <Megaphone className="w-4 h-4" />
              <span>Iklan</span>
            </button>
          )}

          {/* Manage Categories Button (Super Admin only) */}
          {showCategoryButton && (
            <button
              onClick={onOpenCategoryManager}
              className="hidden lg:flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-[#170c0a] px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Kelola Kategori"
            >
              <Tag className="w-4 h-4" />
              <span>Kategori</span>
            </button>
          )}

          {/* Share */}
          <button
            onClick={handleShareSite}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors cursor-pointer text-[#170c0a]/70 hover:text-[#170c0a]"
            title="Bagikan Situs"
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* Search */}
          <button
            onClick={onOpenSearch}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors cursor-pointer text-[#170c0a]/70 hover:text-[#170c0a]"
            title="Cari Berita"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Auth & User Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 bg-stone-100 hover:bg-stone-200 rounded-full cursor-pointer transition-all border border-stone-200"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#e15b00] text-white flex items-center justify-center text-xs font-bold">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-stone-800 rounded-lg shadow-xl border border-stone-200 py-2 z-50 text-sm animate-fadeIn">
                  <div className="px-4 py-2 border-b border-stone-100">
                    <p className="font-bold truncate">{user.displayName || 'Pengguna'}</p>
                    <p className="text-xs text-stone-500 truncate">{user.email || 'Google Auth User'}</p>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenBookmarks();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-stone-50 flex items-center justify-between text-stone-700"
                  >
                    <span className="flex items-center gap-2">
                      <BookmarkCheck className="w-4 h-4 text-[#e15b00]" />
                      Berita Tersimpan
                    </span>
                    <span className="bg-[#e15b00]/10 text-[#e15b00] font-bold text-xs px-2 py-0.5 rounded-full">
                      {bookmarkCount}
                    </span>
                  </button>

                  {userIsAdmin && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenNewsroom();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-stone-50 flex items-center gap-2 text-stone-700"
                    >
                      <Newspaper className="w-4 h-4 text-[#170c0a]" />
                      Ruang Redaksi
                      <span className="ml-auto text-[10px] text-stone-400 italic">
                        {newsroomUser?.role}
                      </span>
                    </button>
                  )}

                  {userIsAdmin && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenArticleEditor();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-stone-50 flex items-center gap-2 text-stone-700 sm:hidden"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-600" />
                      Tulis Berita Baru
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-stone-100 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar (Sign Out)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-[#170c0a] hover:bg-[#2f201d] text-white px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <UserIcon className="w-4 h-4 text-[#fa9d68]" />
              <span>Masuk Google</span>
            </button>
          )}

        </div>
      </div>
      </div>

      {/*
        Pita kanal — Jingga Tipis.

        Warnanya nyaris sama terang dengan latar halaman (Kertas), jadi yang
        memisahkan keduanya adalah garis jingga 4px di bawah <header> dan garis
        putih di atas, bukan kontras warnanya sendiri.

        Kanal dirata-tengahkan dan memakai flex-wrap, jadi menambah atau
        mengurangi kanal dari panel admin tidak perlu penyesuaian apa pun —
        barisnya melipat sendiri kalau sudah tidak muat.
      */}
      <div className="bg-[#ffece0] border-t border-white">
      <nav className="hidden lg:flex flex-wrap justify-center gap-x-7 gap-y-2 items-center px-4 md:px-6 py-3 max-w-7xl mx-auto">
        <button
          onClick={() => {
            onSelectCategory('Semua');
            onGoHome();
          }}
          className={`text-sm transition-colors duration-200 cursor-pointer active:scale-95 ${
            selectedCategory === 'Semua'
              ? 'font-bold text-[#a63c00] border-b-2 border-[#e15b00] pb-0.5'
              : 'font-semibold text-[#170c0a] hover:text-[#a63c00]'
          }`}
        >
          Beranda
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              onSelectCategory(cat);
              onGoHome();
            }}
            /*
             * Kanal aktif memakai Jingga Tua, bukan Jingga Redaksi.
             * Jingga Redaksi di atas Jingga Tipis hanya 3,2:1 — di bawah
             * ambang 4,5:1 untuk teks. Jingga Tua mencapai 5,6:1. Garis
             * bawahnya tetap Jingga Redaksi karena elemen grafis cukup 3:1.
             */
            className={`text-sm transition-colors duration-200 cursor-pointer active:scale-95 ${
              selectedCategory === cat
                ? 'font-bold text-[#a63c00] border-b-2 border-[#e15b00] pb-0.5'
                : 'font-semibold text-[#170c0a] hover:text-[#a63c00]'
            }`}
          >
            {cat}
          </button>
        ))}
      </nav>
      </div>

      {/*
        ===== Tampilan HP: bilah aksi di bawah layar =====

        Di layar HP besar seperti Samsung seri Ultra, bagian atas layar sulit
        dijangkau jempol tanpa memindahkan genggaman. Aksi yang sering dipakai
        — bagikan, cari, kategori — dipindah ke bawah, di zona jempol.
        Bagian atas cukup memuat logo saja.
      */}

      {/* Panel yang muncul dari bawah, di atas bilah aksi */}
      {mobileSheet !== null && (
        <>
          {/* Lapisan gelap: menutup panel saat disentuh di luar area panel */}
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileSheet(null)}
            aria-hidden="true"
          />

          <div className="lg:hidden fixed left-0 right-0 bottom-[64px] z-40 bg-[#170c0a] border-t border-white/15 rounded-t-2xl max-h-[65vh] overflow-y-auto px-4 py-4 space-y-3 shadow-2xl">
            {mobileSheet === 'kategori' && (
              <>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  Kategori Berita
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onSelectCategory('Semua');
                      onGoHome();
                      setMobileSheet(null);
                    }}
                    className={`p-2.5 rounded-lg text-left text-sm font-semibold ${
                      selectedCategory === 'Semua' ? 'bg-[#e15b00] text-white' : 'text-white bg-white/5'
                    }`}
                  >
                    Semua Berita
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        onSelectCategory(cat);
                        onGoHome();
                        setMobileSheet(null);
                      }}
                      className={`p-2.5 rounded-lg text-left text-sm font-semibold ${
                        selectedCategory === cat ? 'bg-[#e15b00] text-white' : 'text-white bg-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </>
            )}

            {mobileSheet === 'lainnya' && (
              <>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  Lainnya
                </p>

                {/* Akun pembaca */}
                {user ? (
                  <>
                    <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || 'User'} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#e15b00] text-white flex items-center justify-center text-sm font-bold">
                          {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user.displayName || 'Pengguna'}</p>
                        <p className="text-[11px] text-white/60 truncate">{user.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => { setMobileSheet(null); onOpenBookmarks(); }}
                      className="w-full bg-white/10 text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                    >
                      <BookmarkCheck className="w-4 h-4" />
                      Berita Tersimpan ({bookmarkCount})
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setMobileSheet(null); onOpenAuth(); }}
                    className="w-full bg-white/10 text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <UserIcon className="w-4 h-4 text-[#fa9d68]" />
                    Masuk dengan Google
                  </button>
                )}

                {/* Menu kru redaksi */}
                {userIsAdmin && (
                  <button
                    onClick={() => { setMobileSheet(null); onOpenNewsroom(); }}
                    className="w-full bg-white/10 text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Newspaper className="w-4 h-4" />
                    Ruang Redaksi
                  </button>
                )}

                {userIsAdmin && (
                  <button
                    onClick={() => { setMobileSheet(null); onOpenArticleEditor(); }}
                    className="w-full bg-[#e15b00] text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Tulis Berita Baru
                  </button>
                )}

                {showAdsButton && (
                  <button
                    onClick={() => { setMobileSheet(null); onOpenAdManager(); }}
                    className="w-full bg-white/10 text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Megaphone className="w-4 h-4" />
                    Kelola Iklan
                  </button>
                )}

                {showCategoryButton && (
                  <button
                    onClick={() => { setMobileSheet(null); onOpenCategoryManager(); }}
                    className="w-full bg-white/10 text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Tag className="w-4 h-4" />
                    Kelola Kategori
                  </button>
                )}

                {user && (
                  <button
                    onClick={() => { setMobileSheet(null); onSignOut(); }}
                    className="w-full border border-white/20 text-white/80 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/*
        Bilah aksi bawah. Tingginya 64px — dipakai juga sebagai acuan posisi
        panel di atas (bottom-[64px]) dan jarak bawah isi halaman di App.tsx.
        pb dari safe-area menjaga tombol tidak tertimpa garis gestur di HP
        layar penuh.
      */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-[#170c0a] border-t-2 border-[#e15b00] flex items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <BottomAction icon={<Share2 className="w-5 h-5" />} label="Bagikan"
          onClick={() => { setMobileSheet(null); handleShareSite(); }} />

        <BottomAction icon={<Search className="w-5 h-5" />} label="Cari"
          onClick={() => { setMobileSheet(null); onOpenSearch(); }} />

        <BottomAction icon={<LayoutGrid className="w-5 h-5" />} label="Kategori"
          active={mobileSheet === 'kategori'}
          onClick={() => setMobileSheet(mobileSheet === 'kategori' ? null : 'kategori')} />

        <BottomAction icon={mobileSheet === 'lainnya' ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />} label="Lainnya"
          active={mobileSheet === 'lainnya'}
          onClick={() => setMobileSheet(mobileSheet === 'lainnya' ? null : 'lainnya')} />
      </nav>

    </header>
  );
};

/** Satu tombol di bilah aksi bawah: ikon di atas, label kecil di bawahnya. */
const BottomAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}> = ({ icon, label, onClick, active = false }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:bg-white/10 ${
      active ? 'text-[#e15b00]' : 'text-white'
    }`}
  >
    {icon}
    <span className="text-[10px] font-bold tracking-wide">{label}</span>
  </button>
);
