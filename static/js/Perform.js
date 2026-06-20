const PLAYERS = window.PLAYERS_DATA || [];

/* ---------- DARK MODE ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("gp_theme", theme);
  const icon = document.getElementById("themeIcon");
  if (icon) icon.textContent = theme === "dark" ? "light_mode" : "dark_mode";
  const logo = document.getElementById("siteLogo");
  if (logo)
    logo.src =
      theme === "dark" ? "/static/images/dark_gun.jpg" : "/static/images/white_gun.jpg";
}

function toggleTheme() {
  const current =
    document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

document.addEventListener("DOMContentLoaded", function () {
  const saved = localStorage.getItem("gp_theme") || "light";
  applyTheme(saved);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.addEventListener("click", toggleTheme);
});

/* ---------- MOBILE SIDEBAR ---------- */
function openSidebar() {
  document.querySelector(".sidebar")?.classList.add("mob-open");
  document.getElementById("mobOverlay")?.classList.add("show");
}
function closeSidebar() {
  document.querySelector(".sidebar")?.classList.remove("mob-open");
  document.getElementById("mobOverlay")?.classList.remove("show");
}

/* ---------- PAGINATION HELPERS ---------- */
function buildPaginationHTML(currentPage, totalPages) {
  let h = `<button class="pg-nav" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>
    <span class="material-symbols-outlined" style="font-size:17px">chevron_left</span>
  </button>`;
  const maxVisible = 7;
  let start = Math.max(1, currentPage - 3);
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  if (start > 1) {
    h += `<button class="pg-btn" onclick="changePage(1)">1</button>`;
    if (start > 2)
      h += `<span style="color:var(--text4);padding:0 4px;">…</span>`;
  }
  for (let i = start; i <= end; i++) {
    h += `<button class="pg-btn ${i === currentPage ? "active" : ""}" onclick="changePage(${i})">${i}</button>`;
  }
  if (end < totalPages) {
    if (end < totalPages - 1)
      h += `<span style="color:var(--text4);padding:0 4px;">…</span>`;
    h += `<button class="pg-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
  }
  h += `<button class="pg-nav" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>
    <span class="material-symbols-outlined" style="font-size:17px">chevron_right</span>
  </button>`;
  return h;
}

/* ---------- EXPORT CSV ---------- */
function downloadCSV(headers, rows, filename) {
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  a.download = filename;
  a.click();
}
