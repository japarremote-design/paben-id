import React, { useState, useEffect } from 'react';
import { ChevronRight, Calendar, Eye, Heart, Bookmark, BookmarkCheck, ArrowLeft, Clock, Pencil, EyeOff } from 'lucide-react';
import { doc, updateDoc, increment, collection, addDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Article, UserProfile } from '../types';
import { PabenMark } from './PabenMark';
import { ShareButtons } from './ShareButtons';
import { readingMinutes, articlePath } from '../lib/slug';
import { useSeo } from '../lib/seo';
import { isAdmin } from '../lib/admin';
import { Comments } from './Comments';
import { AdBanner } from './AdBanner';

interface ArticleDetailProps {
  article: Article;
  allArticles: Article[];
  user: UserProfile | null;
  onBack: () => void;
  onSelectArticle: (article: Article) => void;
  /** Membuka halaman kumpulan berita bertag sama. */
  onSelectTag: (tag: string) => void;
  onOpenAuth: () => void;
  onBookmarkChanged: () => void;
  onEdit: (article: Article) => void;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({
  article,
  allArticles,
  user,
  onBack,
  onSelectArticle,
  onSelectTag,
  onOpenAuth,
  onBookmarkChanged,
  onEdit
}) => {
  const [likesCount, setLikesCount] = useState(article.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkDocId, setBookmarkDocId] = useState<string | null>(null);

  // Increment view count in Firestore on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const articleRef = doc(db, 'articles', article.id);
    updateDoc(articleRef, {
      views: increment(1)
    }).catch(err => console.error('Error incrementing view count:', err));
  }, [article.id]);

  // Check if article is bookmarked by user
  useEffect(() => {
    if (!user) {
      setIsBookmarked(false);
      setBookmarkDocId(null);
      return;
    }

    const q = query(
      collection(db, 'bookmarks'),
      where('userId', '==', user.uid),
      where('articleId', '==', article.id)
    );

    getDocs(q).then((snapshot) => {
      if (!snapshot.empty) {
        setIsBookmarked(true);
        setBookmarkDocId(snapshot.docs[0].id);
      } else {
        setIsBookmarked(false);
        setBookmarkDocId(null);
      }
    }).catch(err => console.error('Error checking bookmark:', err));
  }, [article.id, user]);

  const handleLike = async () => {
    if (hasLiked) return;
    setLikesCount(prev => prev + 1);
    setHasLiked(true);

    try {
      const articleRef = doc(db, 'articles', article.id);
      await updateDoc(articleRef, {
        likes: increment(1)
      });
    } catch (err) {
      console.error('Error liking article:', err);
    }
  };

  const handleToggleBookmark = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      if (isBookmarked && bookmarkDocId) {
        await deleteDoc(doc(db, 'bookmarks', bookmarkDocId));
        setIsBookmarked(false);
        setBookmarkDocId(null);
      } else {
        const docRef = await addDoc(collection(db, 'bookmarks'), {
          userId: user.uid,
          articleId: article.id,
          createdAt: new Date().toISOString()
        });
        setIsBookmarked(true);
        setBookmarkDocId(docRef.id);
      }
      onBookmarkChanged();
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  // Alamat yang dibagikan. Diambil dari alamat halaman yang sedang dibuka,
  // jadi otomatis ikut bentuk /berita/{judul}-{id} yang ramah mesin pencari.
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const isArticleActive = article.isActive !== false;

  const handleToggleActive = async () => {
    if (!user || !isAdmin(user.email)) {
      onOpenAuth();
      return;
    }
    try {
      await updateDoc(doc(db, 'articles', article.id), {
        isActive: !isArticleActive,
      });
    } catch (err) {
      console.error('Error toggling article status:', err);
      alert('Gagal mengubah status berita. Coba lagi.');
    }
  };

  /*
   * Structured data NewsArticle.
   *
   * Ini yang dibaca Google untuk menampilkan berita sebagai kartu di hasil
   * pencarian dan sebagai syarat masuk Google News. Disuntikkan lewat efek,
   * bukan ditulis di index.html, karena isinya berbeda tiap artikel.
   *
   * `dateModified` mengikuti updatedAt kalau ada. Untuk berita, Google
   * memakai selisih dua tanggal ini sebagai sinyal kesegaran — kalau
   * keduanya selalu sama, artikel yang diralat tidak pernah terlihat
   * diperbarui.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title.slice(0, 110),   // Google memotong di 110 karakter
    description: article.excerpt,
    image: article.imageUrl ? [article.imageUrl] : undefined,
    datePublished: article.createdAt,
    dateModified: (article as { updatedAt?: string }).updatedAt || article.createdAt,
    author: { '@type': 'Person', name: article.author },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'PABEN.ID',
      logo: { '@type': 'ImageObject', url: `${window.location.origin}/logo-icon-512.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': window.location.href },
    articleSection: article.category,
    keywords: (article.tags || []).join(', '),
    inLanguage: 'id-ID',
  };

  useSeo({
    title: article.title,
    description: article.excerpt,
    path: articlePath(article),
    image: article.imageUrl || undefined,
    type: 'article',
    // Berita yang dinonaktifkan redaksi masih bisa dibuka lewat tautan
    // langsung, tapi tidak boleh ikut terindeks.
    noindex: !isArticleActive,
    jsonLd,
  });

  const relatedArticles = allArticles
    .filter(a => a.id !== article.id && a.category === article.category)
    .slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button + Edit/Toggle controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-[#170c0a] hover:text-[#e15b00] bg-stone-100 hover:bg-stone-200 px-3.5 py-1.5 rounded-full transition-all cursor-pointer w-fit shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>

        {isAdmin(user?.email) && (
          <div className="flex items-center gap-2">
            {!isArticleActive && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-500">
                Nonaktif (hanya lo yang bisa lihat)
              </span>
            )}
            <button
              onClick={() => onEdit(article)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#170c0a] hover:text-white bg-stone-100 hover:bg-[#170c0a] px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleToggleActive}
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs ${
                isArticleActive
                  ? 'text-amber-600 hover:text-white bg-amber-50 hover:bg-amber-500'
                  : 'text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600'
              }`}
            >
              {isArticleActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isArticleActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#e15b00]">
        <span className="hover:underline cursor-pointer" onClick={onBack}>BERITA</span>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
        <span className="font-bold">{article.category}</span>
      </div>

      {/* Header */}
      <header className="space-y-4">
        <h1 className="font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#170c0a] leading-tight font-display tracking-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between text-xs text-stone-600 font-mono border-b border-stone-200 pb-3 gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 font-semibold text-stone-800">
              <PabenMark className="w-4 h-auto" /> Oleh: {article.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#e15b00]" /> 
              {new Date(article.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}, {new Date(article.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#170c0a]" /> {readingMinutes(article.content)} menit baca
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-amber-600" /> {article.views + 1} Pembaca
            </span>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      <figure className="w-full">
        <div className="relative rounded-xl overflow-hidden shadow-md bg-stone-900">
          <img 
            loading="eager"
            fetchPriority="high"
            decoding="async"
            src={article.imageUrl} 
            alt={article.title}
            className="w-full h-auto max-h-[480px] object-cover" 
          />
        </div>
        {article.imageCaption && (
          <figcaption className="mt-2 text-xs text-stone-500 font-mono text-right italic">
            {article.imageCaption}
          </figcaption>
        )}
      </figure>

      {/* Article Content */}
      <article className="prose prose-slate max-w-none text-stone-800 text-base md:text-lg leading-relaxed space-y-5 font-sans">
        {article.content.split('\n\n').map((paragraph, index) => {
          // Check for quote formatting
          if (paragraph.startsWith('"') || paragraph.startsWith('“')) {
            return (
              <blockquote key={index} className="border-l-4 border-[#e15b00] pl-4 my-6 italic text-[#170c0a] font-bold text-lg md:text-xl bg-amber-50/50 py-3 rounded-r-lg">
                {paragraph}
              </blockquote>
            );
          }
          return (
            <p key={index} className="text-stone-800 leading-relaxed">
              {paragraph}
            </p>
          );
        })}
      </article>

      {/* Tags and Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-y border-stone-200 my-8 bg-stone-50 p-4 rounded-xl">
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag(tag)}
              className="font-mono text-xs font-semibold text-stone-700 bg-white border border-stone-200 px-3 py-1 rounded-full shadow-2xs hover:border-[#e15b00] hover:text-[#e15b00] transition-colors cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              hasLiked 
                ? 'bg-rose-50 text-rose-600 border-rose-200' 
                : 'bg-white text-stone-700 border-stone-300 hover:bg-rose-50 hover:text-rose-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-600' : ''}`} />
            <span>{likesCount} Suka</span>
          </button>

          <button
            onClick={handleToggleBookmark}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              isBookmarked
                ? 'bg-[#e15b00]/10 text-[#e15b00] border-[#e15b00]/30'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-amber-50 hover:text-[#e15b00]'
            }`}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4 text-[#e15b00]" /> : <Bookmark className="w-4 h-4" />}
            <span>{isBookmarked ? 'Tersimpan' : 'Simpan'}</span>
          </button>

          <ShareButtons url={shareUrl} title={article.title} />
        </div>
      </div>

      {/* Ad Banner Billboard */}
      <AdBanner type="billboard" />

      {/*
        Iklan kotak TIDAK dipasang di sini — tempatnya di kolom kanan halaman
        artikel, diatur dari App.tsx. Kalau dipasang di sini juga, iklan yang
        sama akan muncul dua kali dalam satu halaman.
      */}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <h3 className="font-bold text-lg text-[#170c0a] font-display mb-4 border-b-2 border-[#e15b00] pb-1.5 inline-block">
            Berita Terkait
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedArticles.map((rel) => (
              <div 
                key={rel.id}
                onClick={() => onSelectArticle(rel)}
                className="group cursor-pointer border border-stone-100 p-2.5 rounded-lg hover:shadow-md transition-all bg-stone-50/50"
              >
                <img 
                  loading="lazy"
                  decoding="async"
                  src={rel.imageUrl} 
                  alt={rel.title}
                  className="w-full h-28 object-cover rounded-md mb-2 bg-stone-200 group-hover:scale-105 transition-transform" 
                />
                <h4 className="font-bold text-xs text-stone-900 group-hover:text-[#170c0a] line-clamp-2 leading-snug">
                  {rel.title}
                </h4>
                <span className="text-[10px] text-stone-400 font-mono mt-1 block">
                  {new Date(rel.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments Section */}
      <Comments 
        articleId={article.id} 
        user={user} 
        onOpenAuth={onOpenAuth} 
      />
    </div>
  );
};
