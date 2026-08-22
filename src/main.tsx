import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        {/* Alamat baru: judul berita ikut di dalamnya, ID menempel di ujung */}
        <Route path="/berita/:slug" element={<App />} />
        {/* Alamat lama tetap dilayani supaya tautan yang sudah tersebar
            tidak mati; App.tsx mengalihkannya ke alamat baru. */}
        <Route path="/artikel/:id" element={<App />} />
        <Route path="/tag/:tag" element={<App />} />
        {/*
          Halaman kanal. Sebelumnya memilih kanal hanya mengubah state dan
          alamatnya tetap "/", jadi tidak ada halaman kanal yang bisa
          diindeks — untuk situs berita itu kehilangan besar, karena
          "berita ekonomi" dan sejenisnya justru dicari lewat kanal.
        */}
        <Route path="/kanal/:kanalSlug" element={<App />} />
        <Route path="/halaman/:pageSlug" element={<App />} />
        {/* Ruang Redaksi PABEN — dashboard internal kru redaksi */}
        <Route path="/redaksi" element={<App newsroom />} />
        {/*
          Alamat yang tidak cocok dengan pola mana pun. Tanpa rute ini,
          `vercel.json` tetap menyajikan index.html berstatus 200 dan Google
          mencatatnya sebagai soft 404 — memboroskan jatah perayapan.
        */}
        <Route path="*" element={<App notFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
