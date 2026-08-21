import React, { useEffect, useState } from 'react';
import { ArrowLeft, Pencil, Loader2, Save, X } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PageContent, UserProfile } from '../types';
import { isAdmin } from '../lib/admin';
import {
  StaticPageSlug,
  STATIC_PAGE_LABELS,
  STATIC_PAGE_DEFAULT_CONTENT,
} from '../lib/staticPages';

interface StaticPageViewProps {
  slug: StaticPageSlug;
  user: UserProfile | null;
  onBack: () => void;
}

export const StaticPageView: React.FC<StaticPageViewProps> = ({ slug, user, onBack }) => {
  const [page, setPage] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const label = STATIC_PAGE_LABELS[slug];
  const userIsAdmin = isAdmin(user?.email);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(doc(db, 'pages', slug), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as PageContent;
        setPage(data);
        setTitleInput(data.title);
        setContentInput(data.content);
      } else {
        setPage(null);
        setTitleInput(label);
        setContentInput('');
      }
      setLoading(false);
    });
    return () => unsub();
  }, [slug, label]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'pages', slug), {
        slug,
        title: titleInput.trim() || label,
        content: contentInput.trim(),
        updatedAt: new Date().toISOString(),
      });
      setEditing(false);
    } catch (err) {
      console.error('Gagal menyimpan halaman:', err);
      alert('Gagal menyimpan halaman. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayTitle = page?.title || label;
  const displayContent = page?.content?.trim() || STATIC_PAGE_DEFAULT_CONTENT[slug];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-[#170c0a] hover:text-[#e15b00] bg-stone-100 hover:bg-stone-200 px-3.5 py-1.5 rounded-full transition-all cursor-pointer w-fit shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>

        {userIsAdmin && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#170c0a] hover:text-white bg-stone-100 hover:bg-[#170c0a] px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Halaman</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#170c0a] border-t-[#e15b00] rounded-full animate-spin" />
        </div>
      ) : editing ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Judul Halaman</label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:border-[#170c0a] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Isi Konten</label>
            <textarea
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              rows={12}
              placeholder="Tulis isi halaman di sini. Pisahkan paragraf dengan baris kosong."
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:border-[#170c0a] outline-none resize-y"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-stone-100">
            <button
              onClick={() => {
                setEditing(false);
                setTitleInput(page?.title || label);
                setContentInput(page?.content || '');
              }}
              className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-bold hover:bg-stone-50 flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#170c0a] hover:bg-[#2f201d] text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#170c0a] font-display mb-6">
            {displayTitle}
          </h1>
          <div className="text-stone-700 leading-relaxed space-y-4 text-sm md:text-base">
            {displayContent.split(/\n\s*\n/).map((para, i) => (
              <p key={i} className="whitespace-pre-line">{para}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
