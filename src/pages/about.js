import { renderLayout } from "../lib/layout.js";

export function aboutPage() {
  return renderLayout({
    title: "Tentang Kami | Nama Website",
    description:
      "Kenali lebih jauh tentang Nama Website, tujuan, konten, dan informasi yang kami sajikan.",
    canonical: "/about",

    content: `
      <article class="page">

        <h1>Tentang Kami</h1>

        <p class="page-intro">
          Mengenal lebih dekat tentang website, tujuan, dan informasi
          yang kami hadirkan untuk pembaca.
        </p>

        <section class="page-section">
          <h2>Tentang Website Ini</h2>

          <p>
            Nama Website merupakan platform yang menyediakan berbagai
            informasi dan referensi digital yang disusun agar mudah
            dipahami dan digunakan oleh pembaca.
          </p>

          <p>
            Kami berusaha menghadirkan konten yang informatif, relevan,
            dan diperbarui secara berkala sesuai dengan perkembangan
            informasi yang tersedia.
          </p>
        </section>

        <section class="page-section">
          <h2>Tujuan Kami</h2>

          <p>
            Tujuan utama kami adalah membantu pembaca menemukan informasi
            yang jelas dan praktis melalui penyajian konten yang sederhana.
          </p>
        </section>

        <section class="page-section">
          <h2>Konten</h2>

          <p>
            Setiap konten dibuat dengan memperhatikan keterbacaan,
            relevansi topik, dan pengalaman pengguna.
          </p>
        </section>

      </article>
    `
  });
}
