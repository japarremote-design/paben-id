import React, { useState } from 'react';
import { X, Plus, Tag, Eye, EyeOff, Loader2 } from 'lucide-react';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category } from '../types';
import { slugifyCategory } from '../lib/categories';

interface CategoryManagerModalProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  categories,
  onClose,
}) => {
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleToggleActive = async (cat: Category) => {
    try {
      await updateDoc(doc(db, 'categories', cat.id), { isActive: !cat.isActive });
    } catch (err) {
      console.error('Gagal mengubah status kategori:', err);
      alert('Gagal mengubah status kategori.');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const name = newName.trim();
    if (!name) return;

    const id = slugifyCategory(name);
    if (!id) {
      setError('Nama kategori gak valid.');
      return;
    }
    if (categories.some(c => c.id === id)) {
      setError('Kategori dengan nama itu udah ada.');
      return;
    }

    setIsSaving(true);
    try {
      // Doc ID IS the slug (setDoc, not addDoc) - keeps the Firestore
      // document ID and the "id" everyone refers to in the UI always in
      // sync, and doubles as the duplicate-name check.
      await setDoc(doc(db, 'categories', id), {
        id,
        name,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      setNewName('');
    } catch (err) {
      console.error('Gagal menambah kategori:', err);
      setError('Gagal menyimpan. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-100 w-full max-w-lg p-6 relative my-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#e15b00]/10 text-[#e15b00] rounded-lg">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#170c0a] font-display">
                Kelola Kategori
              </h3>
              <p className="text-xs text-stone-500">
                Tambah kategori baru atau nonaktifkan tanpa hapus artikelnya.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nama kategori baru, misal: Ekonomi"
            className="flex-grow border border-stone-300 rounded-lg px-3 py-2 text-sm focus:border-[#170c0a] outline-none"
          />
          <button
            type="submit"
            disabled={isSaving || !newName.trim()}
            className="flex items-center gap-1.5 bg-[#170c0a] hover:bg-[#2f201d] text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 flex-shrink-0"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Tambah</span>
          </button>
        </form>
        {error && <p className="text-xs text-red-600 -mt-2 mb-4">{error}</p>}

        <div className="overflow-y-auto pr-1 flex-grow space-y-2">
          {categories.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-10">Belum ada kategori.</p>
          ) : (
            categories.map(cat => (
              <div
                key={cat.id}
                className="flex items-center justify-between border border-stone-200 rounded-xl px-4 py-2.5"
              >
                <div>
                  <p className="font-bold text-sm text-[#170c0a]">{cat.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    cat.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {cat.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleActive(cat)}
                  className={`p-1.5 rounded-full transition-colors ${
                    cat.isActive
                      ? 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                  }`}
                  title={cat.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {cat.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
