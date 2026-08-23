/**
 * Daftar Super Admin bootstrap.
 *
 * Siapa pun yang masuk lewat Google bisa membaca situs seperti biasa, tapi
 * hanya email di daftar ini yang melihat tombol "Tulis Berita", "Iklan", dan
 * tombol Edit/Hapus di artikel.
 *
 * ==========================================================================
 * DAFTAR INI HARUS SAMA PERSIS DENGAN isBootstrapAdmin() DI firestore.rules
 * ==========================================================================
 *
 * Keduanya menjaga hal yang berbeda, dan kalau isinya berbeda hasilnya
 * membingungkan — bukan error yang jelas:
 *
 *   - Berkas ini menentukan APA YANG TERLIHAT. Email yang tidak terdaftar di
 *     sini tidak akan pernah melihat tombol Tulis Berita, walau sebenarnya
 *     Firestore mengizinkannya menulis.
 *   - firestore.rules menentukan APA YANG BOLEH. Email yang tidak terdaftar
 *     di sana akan ditolak Firestore walau tombolnya terlihat.
 *
 * Jadi kalau hanya salah satu yang diisi: tombolnya ada tapi menyimpan gagal
 * dengan "Missing or insufficient permissions", ATAU izinnya penuh tapi tidak
 * ada satu pun tombol yang muncul di layar. Yang kedua persis yang sempat
 * terjadi di sini — rules sudah diisi email yang benar, berkas ini belum.
 *
 * Setelah mengubah daftar ini, jangan lupa:
 *   1. samakan isinya di firestore.rules
 *   2. `firebase deploy --only firestore:rules`
 *   3. deploy ulang situsnya (perubahan di berkas ini ikut bundle)
 */
export const ADMIN_EMAILS: string[] = [
  'japar.remote@gmail.com',
  'storyvideoislami234@gmail.com',
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
