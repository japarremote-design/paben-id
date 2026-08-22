import React from 'react';
import { Clock, Eye, Heart, ExternalLink } from 'lucide-react';
import { Article, CategoryType } from '../types';

interface CategoryGridProps {
  articles: Article[];
  categories: CategoryType[];
  selectedCategory: CategoryType | 'Semua';
  onSelectArticle: (article: Article) => void;
  onSelectCategory: (category: CategoryType) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  articles,
  categories,
  selectedCategory,
  onSelectArticle,
  onSelectCategory
}) => {
  // Filter out hero article if viewing 'Semua' so it doesn't duplicate
  const heroArticle = articles.find(a => a.isHero) || articles[0];
  const mainArticles = selectedCategory === 'Semua' 
    ? articles.filter(a => a.id !== heroArticle?.id)
    : articles.filter(a => a.category === selectedCategory);

  const categoriesToRender: CategoryType[] = selectedCategory === 'Semua'
    ? categories
    : [selectedCategory];

  return (
    <div className="space-y-10">
      {categoriesToRender.map((category) => {
        const catArticles = mainArticles.filter(a => a.category === category);
        if (catArticles.length === 0 && selectedCategory === 'Semua') return null;

        return (
          <section key={category} className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-sm">
            {/*
              Kepala seksi kategori.
              Di halaman kanal, App.tsx sudah memasang <h1> berisi nama kanal
              yang sama — jadi kepala seksi ini dilewati supaya namanya tidak
              tertulis dua kali beruntun.
            */}
            {selectedCategory === 'Semua' && (
            <div className="flex items-center justify-between border-b-2 border-[#170c0a] pb-2.5 mb-5">
              <h2 className="text-xl md:text-2xl font-bold text-[#170c0a] font-display flex items-center gap-2">
                <span className="w-2.5 h-6 bg-[#e15b00] rounded-full inline-block"></span>
                {category}
              </h2>
              {selectedCategory === 'Semua' && (
                <button
                  onClick={() => onSelectCategory(category)}
                  className="text-xs font-bold text-[#e15b00] hover:text-[#170c0a] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Lihat Semua
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            )}

            {/* Category Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {catArticles.length === 0 ? (
                <p className="text-stone-500 text-sm italic col-span-2 py-4">Belum ada berita untuk kategori ini.</p>
              ) : (
                catArticles.map((article, idx) => {
                  // Alternative card styling for Hukum & Kriminal category or featured layout
                  if (category === 'Hukum' && idx % 2 === 0) {
                    return (
                      <article 
                        key={article.id}
                        onClick={() => onSelectArticle(article)}
                        className="flex gap-4 group cursor-pointer border p-3 rounded-lg bg-stone-50/80 hover:bg-stone-100/80 border-stone-200 transition-all hover:shadow-sm"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#170c0a]/10">
                          <img
                            loading="lazy"
                            decoding="async"
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-bold text-base text-stone-900 group-hover:text-[#170c0a] transition-colors line-clamp-2 leading-snug mb-1">
                            {article.title}
                          </h3>
                          <p className="text-sm text-stone-600 line-clamp-2 leading-snug mb-2">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-stone-500 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(article.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-amber-600" /> {article.views}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  }

                  if (category === 'Politik' || category === 'Opini') {
                    return (
                      <article 
                        key={article.id}
                        onClick={() => onSelectArticle(article)}
                        className="group cursor-pointer border border-stone-100 rounded-lg overflow-hidden hover:shadow-md transition-all p-2.5 bg-stone-50/50"
                      >
                        <div className="relative h-44 w-full mb-3 overflow-hidden rounded-md bg-stone-200">
                          <img 
                            loading="lazy"
                            decoding="async"
                            src={article.imageUrl} 
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          {category === 'Opini' && (
                            <div className="absolute top-2 left-2 bg-[#170c0a] text-white px-2 py-0.5 text-[10px] font-bold rounded shadow-sm">
                              OPINI
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-base text-stone-900 group-hover:text-[#170c0a] transition-colors line-clamp-2 mb-1.5 leading-snug">
                          {article.title}
                        </h3>
                        <p className="text-xs text-stone-600 line-clamp-2 mb-2">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-stone-500 font-mono pt-1 border-t border-stone-100">
                          <span>{new Date(article.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                          <span className="flex items-center gap-1 text-rose-500">
                            <Heart className="w-3 h-3 fill-rose-500/20" /> {article.likes}
                          </span>
                        </div>
                      </article>
                    );
                  }

                  // Standard Article Card
                  return (
                    <article 
                      key={article.id}
                      onClick={() => onSelectArticle(article)}
                      className="flex gap-3.5 group cursor-pointer p-2 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      <img 
                        loading="lazy"
                        decoding="async"
                        src={article.imageUrl} 
                        alt={article.title}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0 bg-stone-200 shadow-sm group-hover:scale-105 transition-transform" 
                      />
                      <div className="flex flex-col justify-between flex-grow">
                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-stone-900 group-hover:text-[#170c0a] transition-colors line-clamp-2 leading-snug mb-1">
                            {article.title}
                          </h3>
                          <p className="text-xs text-stone-600 line-clamp-2 hidden sm:block">
                            {article.excerpt}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stone-500 font-mono mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#e15b00]" />
                            {new Date(article.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </span>
                          <span>•</span>
                          <span>{article.views} Pembaca</span>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};
