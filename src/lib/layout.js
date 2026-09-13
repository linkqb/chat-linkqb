const SITE = {
  name: "Nama Website",
  url: "https://example.com",
  description: "Website informasi dan referensi digital.",
  year: new Date().getFullYear()
};

export function renderLayout({
  title,
  description,
  canonical,
  content
}) {
  const canonicalUrl = `${SITE.url}${canonical}`;

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">

  <title>${escapeHtml(title)}</title>

  <meta
    name="description"
    content="${escapeHtml(description)}"
  >

  <link
    rel="canonical"
    href="${canonicalUrl}"
  >

  <meta name="robots" content="index,follow">

  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="${escapeHtml(SITE.name)}">

  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">

  <style>
    ${styles()}
  </style>
</head>

<body>

<header class="site-header">
  <div class="container header-inner">

    <a class="brand" href="/">
      ${SITE.name}
    </a>

    <button
      class="menu-toggle"
      type="button"
      aria-label="Buka menu"
      onclick="toggleMenu()"
    >
      ☰
    </button>

    <nav class="site-nav" id="site-nav">
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
      <a href="/privacy-policy">Privacy</a>
      <a href="/terms">Terms</a>
    </nav>

  </div>
</header>

<main class="container main-content">
  ${content}
</main>

<footer class="site-footer">
  <div class="container footer-grid">

    <div>
      <h2>${SITE.name}</h2>
      <p>
        ${SITE.description}
      </p>
    </div>

    <div>
      <h3>Menu</h3>
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </div>

    <div>
      <h3>Informasi</h3>
      <a href="/privacy-policy">Privacy Policy</a>
      <a href="/terms">Terms</a>
      <a href="/disclaimer">Disclaimer</a>
    </div>

  </div>

  <div class="footer-bottom">
    © ${SITE.year} ${SITE.name}. All rights reserved.
  </div>
</footer>

<script>
function toggleMenu() {
  const nav = document.getElementById("site-nav");
  nav.classList.toggle("open");
}
</script>

</body>
</html>`;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function styles() {
  return `
:root {
  --max: 1120px;
  --bg: #0b1220;
  --card: #111a2e;
  --text: #e5e7eb;
  --muted: #94a3b8;
  --primary: #4f46e5;
  --border: #1f2a44;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  line-height: 1.7;
}

a {
  color: inherit;
  text-decoration: none;
}

.container {
  width: min(100% - 32px, var(--max));
  margin-inline: auto;
}

/* HEADER */

.site-header {
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}

.header-inner {
  min-height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  font-size: 1.25rem;
  font-weight: 800;
}

.site-nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

.site-nav a {
  color: var(--muted);
  font-weight: 600;
}

.site-nav a:hover {
  color: var(--text);
}

.menu-toggle {
  display: none;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

/* CONTENT */

.main-content {
  min-height: 65vh;
  padding-top: 60px;
  padding-bottom: 70px;
}

.page {
  max-width: 860px;
  margin-inline: auto;
}

.page h1 {
  margin: 0 0 12px;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.15;
}

.page-intro {
  color: var(--muted);
  font-size: 1.05rem;
  margin-bottom: 40px;
}

.page-section {
  margin-top: 35px;
}

.page-section h2 {
  margin-bottom: 12px;
}

.page-section h3 {
  margin-top: 24px;
}

.page-section p {
  color: var(--muted);
}

.info-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 24px;
  margin-top: 20px;
}

.contact-list {
  padding: 0;
  list-style: none;
}

.contact-list li {
  margin: 12px 0;
}

/* FOOTER */

.site-footer {
  border-top: 1px solid var(--border);
  padding-top: 45px;
  background: var(--bg);
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 40px;
  padding-bottom: 40px;
}

.footer-grid h2,
.footer-grid h3 {
  margin-top: 0;
}

.footer-grid p {
  color: var(--muted);
}

.footer-grid a {
  display: block;
  color: var(--muted);
  margin: 8px 0;
}

.footer-grid a:hover {
  color: var(--text);
}

.footer-bottom {
  border-top: 1px solid var(--border);
  padding: 20px 16px;
  text-align: center;
  color: var(--muted);
  font-size: .9rem;
}

/* MOBILE */

@media (max-width: 768px) {

  .container {
    width: min(100% - 24px, var(--max));
  }

  .menu-toggle {
    display: block;
  }

  .site-nav {
    position: fixed;
    top: 0;
    left: -100%;
    width: min(320px, 85%);
    height: 100vh;
    z-index: 1000;
    padding: 90px 24px 30px;
    background: var(--card);
    border-right: 1px solid var(--border);
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    transition: left .25s ease;
  }

  .site-nav.open {
    left: 0;
  }

  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 30px 20px;
  }

  .footer-grid > :first-child {
    grid-column: 1 / -1;
  }

  .main-content {
    padding-top: 40px;
  }
}
`;
}
