import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          /*
           * Bundle dipecah supaya paket vendor besar tidak ikut kedaluwarsa
           * tiap kali kode situs berubah.
           *
           * Sebelumnya semuanya jadi satu berkas ~1 MB: pembaca yang kembali
           * keesokan harinya harus mengunduh ulang seluruh React dan Firebase
           * hanya karena satu komponen diedit. Untuk situs berita — yang
           * pembacanya datang berulang dan mayoritas dari jaringan seluler —
           * itu langsung terasa di Core Web Vitals, dan Core Web Vitals ikut
           * dinilai Google.
           */
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            icons: ['lucide-react'],
          },
        },
      },
      // Ambang peringatan dinaikkan sedikit supaya build tidak berisik oleh
      // chunk vendor yang memang besar dan sudah sengaja dipisah.
      chunkSizeWarningLimit: 700,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
