"use strict";

const THEME_KEY = "gp_theme";

// ── Toast ─────────────────────────────────────
function showToast(msg) {
  document.querySelectorAll(".gp-toast").forEach((t) => t.remove());
  const t = document.createElement("div");
  t.className = "gp-toast";
  t.style.cssText = [
    "position:fixed;bottom:24px;right:24px;z-index:9999",
    "background:#0f172a;color:#fff;padding:12px 20px",
    "border-radius:12px;font-size:12px;font-weight:600",
    "box-shadow:0 8px 24px rgba(0,0,0,.2);border-left:4px solid #ec0024",
    "font-family:'Inter',sans-serif;animation:gpIn .3s ease",
  ].join(";");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.transition = "opacity .3s,transform .3s";
    t.style.opacity = "0";
    t.style.transform = "translateY(8px)";
    setTimeout(() => t.remove(), 300);
  }, 2500);
}

// ── Theme ─────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  const icon = document.getElementById("themeIcon");
  if (icon) icon.textContent = theme === "dark" ? "light_mode" : "dark_mode";
  const logo = document.getElementById("siteLogo");
  if (logo)
    logo.src =
      theme === "dark" ? "/static/images/dark_gun.jpg" : "/static/images/white_gun.jpg";
}
function toggleTheme() {
  applyTheme(
    (document.documentElement.getAttribute("data-theme") || "light") === "dark"
      ? "light"
      : "dark",
  );
}

// ── Mobile Sidebar ─────────────────────────────
function openSidebar() {
  document.getElementById("sidebar")?.classList.add("mob-open");
  document.getElementById("mobOverlay")?.classList.add("active");
  document.body.style.overflow = "hidden";
}
function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("mob-open");
  document.getElementById("mobOverlay")?.classList.remove("active");
  document.body.style.overflow = "";
}

// ── Init ───────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Apply saved theme on load
  applyTheme(localStorage.getItem(THEME_KEY) || "light");

  // Theme toggle
  document
    .getElementById("themeToggle")
    ?.addEventListener("click", toggleTheme);

  // Hamburger / overlay
  document
    .getElementById("hamburgerBtn")
    ?.addEventListener("click", openSidebar);
  document
    .getElementById("mobOverlay")
    ?.addEventListener("click", closeSidebar);

  // Close sidebar on nav click (mobile)
  document.querySelectorAll(".nav-link-item").forEach((a) =>
    a.addEventListener("click", () => {
      if (window.innerWidth < 992) closeSidebar();
    }),
  );

  // Keyframe injection
  if (!document.getElementById("gpKf")) {
    const s = document.createElement("style");
    s.id = "gpKf";
    s.textContent =
      "@keyframes gpIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}";
    document.head.appendChild(s);
  }
});
