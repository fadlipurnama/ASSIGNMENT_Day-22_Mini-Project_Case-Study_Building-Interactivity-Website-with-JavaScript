# Review Kesesuaian Assignment

Dokumen ini mencocokkan workspace dengan **Assignment Guidance - Mini Project Case Study Building Interactivity Website with JavaScript.docx**. Status berikut diperbarui setelah memeriksa ulang kedua direktori halaman, kode API, konfigurasi, README, dan file pengujian yang tersedia.

## Status kriteria

| No. | Kriteria | Status | Yang sudah ada | Yang belum / catatan |
|---:|---|---|---|---|
| 1 | Mempertahankan dua halaman Phase 1 dengan sumber data masing-masing | **Sesuai** | `page-hardcode/` menggunakan data lokal; `page-api-driven/` mengambil produk melalui API. | Kedua halaman berada di direktori frontend terpisah, bukan disatukan dalam satu shell. |
| 2 | Interaksi DOM: perubahan varian/quantity memperbarui ringkasan dan tombol aksi memberi feedback | **Sesuai** | Kedua halaman memiliki pemilihan varian, perhitungan subtotal, event listener, dan feedback Add to Cart. | — |
| 3 | Quantity bilangan bulat positif dan tidak melebihi stok; nilai tidak valid ditolak dengan feedback | **Sesuai** | Kedua halaman menolak quantity `0`, pecahan, negatif, dan di atas stok dengan feedback. Halaman API memperbarui batas dan indikator stok dari respons; stok sisa berkurang secara lokal setelah Add to Cart berhasil. | Skenario browser dan bukti screenshot tercantum pada tabel hasil uji di bawah. |
| 4 | Asynchronous API: loading, render sukses, error, pemeriksaan `response.ok`, endpoint dan mapping baseline | **Sesuai** | `page-api-driven/src/js/api.js` menggunakan `fetch`/`async`, memeriksa `response.ok`, lalu menormalisasi respons. Loading, sukses, error, dan retry telah dijalankan di browser; bukti ada di tabel hasil uji. | — |
| 5 | Mempertahankan credential handling dan tidak menaruh rahasia di frontend | **Sesuai pada source yang diperiksa** | Request API tidak menambahkan API key atau credential di frontend. | — |
| 6 | Feedback Add to Cart dan cart count lokal | **Sebagian sesuai** | Halaman hardcode memiliki toast dan badge yang menambah jumlah unit. Halaman API memberi feedback pada tombol. | Halaman API belum memperbarui cart count lokal/badge setelah pembelian. |
| 7 | Retry tidak membuat request/listener berulang | **Sebagian sesuai** | Retry dari error berhasil memuat produk kembali; lihat bukti di tabel hasil uji. Listener retry didaftarkan sekali saat `DOMContentLoaded`. | Bukti visual menunjukkan retry berhasil, tetapi jumlah request/listener belum diukur khusus. |
| 8 | Pengujian skenario valid/invalid, kegagalan request, expected/actual, dan screenshot | **Sesuai untuk pengujian manual** | Skenario valid, invalid, stok, loading, sukses, kegagalan request, dan retry dijalankan di browser. Tabel expected/actual beserta 16 screenshot tersedia di bawah dan di `evidence/screenshots/`. | Belum ada test runner atau script `test`; smoke-test di `page-api-driven/tests/smoke.test.js` masih placeholder. |
| 9 | README mencakup kedua halaman, endpoint, cara menjalankan/menguji, bukti, dan penggunaan AI | **Sesuai** | `page-hardcode/README.md` menjelaskan fitur dan langkah uji manual halaman hardcode. | Belum ada README tingkat root yang mendokumentasikan halaman API, endpoint baseline, cara menjalankan kedua halaman dan backend, hasil pengujian dengan bukti, serta penggunaan AI. |

## Catatan hasil pemeriksaan

- Halaman hardcode: `page-hardcode/index.html` dan modul di `page-hardcode/js/`; data harga dan stok latihan berada di `js/data.js`.
- Halaman API: `page-api-driven/index.html` dan modul di `page-api-driven/src/js/`.
- Endpoint dibentuk dari `API_BASE_URL` dan ID produk sebagai `${API_BASE_URL}/products/${id}`. Konfigurasi development memakai `/api`; `vite.config.js` mem-proxy ke `http://localhost:3000`.
- `page-api-driven/package.json` menyediakan `dev`, `build`, dan `preview`, tetapi belum memiliki script pengujian.
- Screenshot pengujian berada di `evidence/screenshots/`; tabel di bawah menautkan bukti per skenario.

## Hasil pengujian browser

| No. | Skenario / input | Expected result | Actual result | Screenshot |
|---:|---|---|---|---|
| 1 | Hardcode: Queen, quantity `2` | Subtotal mengikuti harga `$102 × 2 = $204`. | Subtotal tampil `$204`. | [01](evidence/screenshots/01-hardcode-queen-qty-2.png) |
| 2 | Hardcode: ubah quantity `2` menjadi `3` | Subtotal berubah tanpa reload menjadi `$306`. | Subtotal berubah menjadi `$306` tanpa reload. | [02](evidence/screenshots/02-hardcode-queen-qty-3-no-reload.png) |
| 3 | Hardcode: quantity `0`, `1.5`, `-1`, dan `6` saat stok `5` | Nilai ditolak, pesan validasi tampil, subtotal tidak dihitung. | Masing-masing nilai menampilkan feedback validasi; nilai di atas stok memberi pesan stok tersedia `5`. | [0](evidence/screenshots/03a-hardcode-invalid-zero.png), [1.5](evidence/screenshots/03b-hardcode-invalid-fraction.png), [-1](evidence/screenshots/03c-hardcode-invalid-negative.png), [6](evidence/screenshots/03d-hardcode-invalid-over-stock.png) |
| 4 | Hardcode: tekan Add to Cart dengan quantity `2` | Toast notification tampil, badge merah pada tombol Cart bertambah menjadi `2`, dan stok `5` menjadi `3`. | Toast sukses muncul, badge merah Cart menampilkan `2`, dan stok tersisa `3`. | [04](evidence/screenshots/04-hardcode-add-to-cart-toast-cart-stock.png) |
| 5 | API: tahan request saat halaman dimuat | Loading terlihat sampai request selesai. | Indikator loading terlihat saat request ditahan. | [05](evidence/screenshots/05-api-loading.png) |
| 6 | API: produk berhasil dimuat, quantity `2` | Subtotal sama dengan harga dari API × quantity. | Respons produk memuat harga `$89`; quantity `2` menghasilkan subtotal `$178`. | [06](evidence/screenshots/06-api-success-subtotal-qty-2.png) |
| 7 | API: quantity `0`, `1.5`, `-1`, dan `9` saat stok `8` | Nilai ditolak dan feedback validasi menunjukkan batas stok. | Masing-masing nilai menampilkan feedback; quantity `9` ditolak karena stok hanya `8`. | [0](evidence/screenshots/07a-api-invalid-zero.png), [1.5](evidence/screenshots/07b-api-invalid-fraction.png), [-1](evidence/screenshots/07c-api-invalid-negative.png), [9](evidence/screenshots/07d-api-invalid-over-stock.png) |
| 8 | API: Add to Cart quantity `2` | Feedback tampil dan stok lokal berkurang dari `8` menjadi `6`. | Feedback tombol tampil; stok tersisa `6`. | [08](evidence/screenshots/08-api-add-to-cart-stock-decrement.png) |
| 9 | API: request gagal, lalu retry | Error tampil tanpa loading; retry memuat produk kembali. | Error tampil dan loading tersembunyi; retry berhasil menampilkan produk. | [09 — gagal](evidence/screenshots/09-api-request-error-no-loading.png), [10 — retry](evidence/screenshots/10-api-retry-success.png) |

Pengujian di atas dilakukan manual melalui browser; belum ada test runner otomatis. Kegagalan request diuji dengan menyimulasikan request jaringan yang gagal, sedangkan database/API tidak diubah oleh pengujian.

## Kesimpulan

Kedua halaman kini tersedia dan alur inti interaksi serta asynchronous API telah diuji manual dengan bukti. Assignment **belum sepenuhnya sesuai**: halaman API belum memperbarui cart count dan README tingkat proyek belum lengkap. Tes API yang ada masih berupa smoke-test placeholder, bukan suite yang dapat dijalankan melalui `npm test`.
