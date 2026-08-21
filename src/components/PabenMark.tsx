import React from 'react';

/**
 * Monogram PABEN.ID — konsep "Glass Bold" dari dokumen identitas.
 *
 * Kotak jingga bersudut tumpul dengan huruf P Barlow Condensed 800 di
 * tengah, ditambah garis sorot tipis di tepi atas (padanan dari
 * `box-shadow: inset 0 1.5px 0` di spesifikasi aslinya).
 *
 * Digambar sebagai SVG, bukan potongan gambar, supaya tetap tajam saat
 * dipakai sekecil 16px — ukuran itulah yang jadi alasan konsep ini dipilih
 * sebagai pilihan utama.
 *
 * Huruf P digeser 2/64 tinggi kotak ke bawah. Titik tengah geometris terasa
 * terlalu tinggi karena P tidak punya descender, jadi penyeimbangnya dibuat
 * optis, bukan matematis.
 */
export const PabenMark: React.FC<{ className?: string; title?: string }> = ({
  className = 'w-4 h-auto',
  title,
}) => (
  <svg
    viewBox="0 0 64 64"
    className={className}
    role={title ? 'img' : 'presentation'}
    aria-hidden={title ? undefined : true}
    aria-label={title}
  >
    {title && <title>{title}</title>}
    <rect x="0" y="0" width="64" height="64" rx="15" fill="#E15B00" />
    {/*
      Sorot tepi atas. Dipotong oleh <clipPath> ke bentuk kotak yang sama
      supaya ujungnya ikut melengkung di sudut, bukan terpotong lurus.
    */}
    <clipPath id="paben-mark-clip">
      <rect x="0" y="0" width="64" height="64" rx="15" />
    </clipPath>
    <rect
      x="0"
      y="0"
      width="64"
      height="1.5"
      fill="#FA9D68"
      clipPath="url(#paben-mark-clip)"
    />
    <text
      x="32"
      y="34"
      textAnchor="middle"
      dominantBaseline="central"
      fill="#FFFFFF"
      fontFamily="'Barlow Condensed', 'Barlow', sans-serif"
      fontWeight="800"
      fontSize="50"
    >
      P
    </text>
  </svg>
);
