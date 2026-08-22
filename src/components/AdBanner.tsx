import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Ad, AdPosition } from '../types';

interface AdBannerProps {
  type: AdPosition;
  className?: string;
  /**
   * 'stack' — bertumpuk ke bawah, cocok untuk sidebar yang sempit.
   * 'grid'  — berjajar 2–3 kolom, dipakai di halaman artikel yang lebar
   *           supaya banyak iklan tidak jadi satu kolom memanjang.
   */
  layout?: 'stack' | 'grid';
}

const DIMS: Record<AdPosition, { w: number; h: number }> = {
  skyscraper: { w: 120, h: 600 },
  square: { w: 300, h: 250 },
  billboard: { w: 728, h: 90 },
};

export const AdBanner: React.FC<AdBannerProps> = ({ type, className = '', layout = 'stack' }) => {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'ads'),
      where('position', '==', type),
      where('isActive', '==', true)
    );
    const unsub = onSnapshot(q, (snap) => {
      const now = new Date();
      const active = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Ad))
        .filter(a => !a.expiresAt || new Date(a.expiresAt) >= now)
        .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setAds(active);
    }, () => setAds([]));
    return () => unsub();
  }, [type]);

  const dims = DIMS[type];

  // No active ads for this slot -> show the generic placeholder
  if (ads.length === 0) {
    return <PlaceholderAd type={type} className={className} />;
  }

  const wrapperClass =
    type === 'skyscraper' ? `sticky top-28 flex flex-col gap-4 ${className}` :
    type === 'billboard' ? `flex flex-col gap-4 my-8 ${className}` :
    layout === 'grid' ? `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}` :
    `flex flex-col gap-4 ${className}`;

  return (
    <div className={wrapperClass}>
      {ads.map(ad => (
        <a
          key={ad.id}
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block overflow-hidden rounded"
          title={ad.label}
        >
          <img
            loading="lazy"
            decoding="async"
            src={ad.imageUrl}
            alt={ad.label}
            className="w-full object-cover rounded"
            style={{ aspectRatio: `${dims.w}/${dims.h}` }}
          />
        </a>
      ))}
    </div>
  );
};

const PlaceholderAd: React.FC<{ type: AdPosition; className?: string }> = ({ type, className = '' }) => {
  if (type === 'skyscraper') {
    return (
      <div className={`sticky top-28 bg-[#f2f0ed] flex flex-col items-center justify-center text-[#534b48] font-mono text-xs border border-[#e1ddda] h-[600px] rounded ${className}`}>
        <span className="mb-2 opacity-60 tracking-wider text-[10px]">ADVERTISEMENT</span>
        <div className="w-[120px] h-[550px] bg-[#ebe7e4] flex flex-col items-center justify-center text-center p-2 rounded">
          <span className="font-bold text-stone-700">120x600</span>
          <span className="text-[10px] text-stone-500 mt-2">Space IAB Banner</span>
        </div>
      </div>
    );
  }

  if (type === 'square') {
    return (
      <div className={`bg-[#f2f0ed] flex flex-col items-center justify-center text-[#534b48] font-mono text-xs border border-[#e1ddda] h-[300px] rounded p-2 ${className}`}>
        <span className="mb-2 opacity-60 tracking-wider text-[10px]">ADVERTISEMENT</span>
        <div className="w-[300px] h-[250px] bg-[#ebe7e4] flex flex-col items-center justify-center text-center rounded">
          <span className="font-bold text-stone-700">300x250</span>
          <span className="text-[10px] text-stone-500 mt-1">Medium Rectangle Ad</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full bg-[#f2f0ed] flex flex-col items-center justify-center text-[#534b48] font-mono text-xs border border-[#e1ddda] h-[120px] rounded my-8 p-2 ${className}`}>
      <span className="mb-1 opacity-60 tracking-widest text-[10px]">ADVERTISEMENT</span>
      <div className="w-full max-w-[728px] h-[90px] bg-[#ebe7e4] flex items-center justify-center rounded">
        <span className="font-bold text-stone-700">728x90 Billboard Banner</span>
      </div>
    </div>
  );
};
