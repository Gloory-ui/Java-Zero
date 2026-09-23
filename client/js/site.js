/**
 * Общая шапка страниц Главная / Профиль / Справочник и тема оформления
 * (лаборатория использует свою шапку в lab.html)
 */
const PAGES = [
  { key: "home", href: "index.html", label: "Главная" },
  { key: "lab", href: "lab.html", label: "Лаборатория" },
  { key: "profile", href: "profile.html", label: "Профиль" },
  { key: "handbook", href: "handbook.html", label: "Справочник" }
];

export function initSitePage(activeKey) {
  document.documentElement.setAttribute("data-theme", localStorage.getItem("java_zero_theme") || "dark");

  document.getElementById("site-header").innerHTML = `
    <a class="site-brand" href="index.html">
      <span class="logo-badge">
        <svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      </span>
      <span class="site-brand-title">JAVA-ZERO</span>
    </a>
    <nav class="site-links" aria-label="Разделы сайта">
      ${PAGES.map(p => `<a href="${p.href}"${p.key === activeKey ? ' class="active" aria-current="page"' : ""}>${p.label}</a>`).join("")}
    </nav>
    <button class="btn-icon-hud" id="btn-theme" title="Сменить тему оформления">
      <svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    </button>
  `;

  document.getElementById("btn-theme").addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("java_zero_theme", next);
  });
}
