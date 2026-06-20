"use strict";

/* ═══════════════════════════════════════════════════════
   SIDEBAR CONFIG
═══════════════════════════════════════════════════════ */
const CONFIG = {
  logoDarkSrc: "/static/images/dark_gun_p.jpg",
  logoLightSrc: "/static/images/white_gun_p.jpg",

  nav: [
    {
      icon: "home",
      label: "Home",
      href: "/player-home/",
    },
    {
      icon: "analytics",
      label: "My Performance",
      href: "/player-performance/",
      active: true,
    },
    {
      icon: "strategy",
      label: "Tactics",
      href: "/player-tactics/",
    },
    {
      icon: "fitness_center",
      label: "Training",
      href: "/player-training/",
    },
    {
      icon: "calendar_month",
      label: "Calendar",
      href: "/player-calendar/",
    },
    {
      icon: "settings",
      label: "Settings",
      href: "#",
    },
  ],

  navFooter: [
    {
      icon: "logout",
      label: "Logout",
      href: "/logout/",
    },
  ],
};

function buildSidebar() {
  const nav = document.querySelector(".sidebar-nav");
  const footer = document.querySelector(".sidebar-footer");
  if (!nav || !footer) return;
  nav.innerHTML = CONFIG.nav
    .map(
      (item) =>
        `<a class="nav-link-item${item.active ? " active" : ""}" href="${item.href}">
      <span class="material-symbols-outlined">${item.icon}</span>
      <span>${item.label}</span>
    </a>`,
    )
    .join("");
  footer.innerHTML = CONFIG.navFooter
    .map(
      (item) =>
        `<a class="nav-link-item" href="${item.href}">
      <span class="material-symbols-outlined">${item.icon}</span>
      <span>${item.label}</span>
    </a>`,
    )
    .join("");
}

/* ═══════════════════════════════════════════════════════
   THEME
═══════════════════════════════════════════════════════ */
const html = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

function applyTheme(dark) {
  html.setAttribute("data-theme", dark ? "dark" : "light");
  themeIcon.textContent = dark ? "dark_mode" : "light_mode";
  localStorage.setItem("gp_theme", dark ? "dark" : "light");
  const logoImg = document.getElementById("logoImg");
  if (logoImg) logoImg.src = dark ? CONFIG.logoDarkSrc : CONFIG.logoLightSrc;
  setTimeout(rebuildCharts, 50);
}
applyTheme(localStorage.getItem("gp_theme") === "dark");
themeToggle.addEventListener("click", () =>
  applyTheme(html.getAttribute("data-theme") !== "dark"),
);

/* ═══════════════════════════════════════════════════════
   MOBILE SIDEBAR
═══════════════════════════════════════════════════════ */
const sidebar = document.getElementById("sidebar");
const mob = document.getElementById("mobOverlay");

function openSidebar() {
  sidebar.classList.add("mob-open");
  mob.classList.add("active");
  document.body.style.overflow = "hidden";
}
function closeSidebar() {
  sidebar.classList.remove("mob-open");
  mob.classList.remove("active");
  document.body.style.overflow = "";
}

document.getElementById("hamburgerBtn").addEventListener("click", openSidebar);
mob.addEventListener("click", closeSidebar);

/* ═══════════════════════════════════════════════════════
   TAB SWITCHING
═══════════════════════════════════════════════════════ */
document.querySelectorAll(".h-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".h-tab")
      .forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach((p) => {
      p.classList.add("d-none");
      p.classList.remove("show");
    });
    btn.classList.add("active");
    const pane = document.querySelector(
      `.tab-pane[data-page="${btn.dataset.page}"]`,
    );
    if (pane) {
      pane.classList.remove("d-none");
      pane.offsetHeight; // trigger reflow
      pane.classList.add("show");
    }
    if (btn.dataset.page === "performance") setTimeout(buildPerfCharts, 80);
    if (btn.dataset.page === "tactical") setTimeout(buildTacticalCharts, 80);
    if (btn.dataset.page === "match-history")
      setTimeout(() => {
        renderMatches();
        buildMatchCharts();
      }, 80);
  });
});

/* ═══════════════════════════════════════════════════════
   CHART HELPERS
═══════════════════════════════════════════════════════ */
const chartInstances = {};

function gc(name) {
  const s = getComputedStyle(document.documentElement);
  const map = {
    primary: "--primary",
    text2: "--text-2",
    border: "--border",
    card: "--bg-card",
  };
  return s.getPropertyValue(map[name] || name).trim() || "#000";
}

function mkChart(id, config) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
  const el = document.getElementById(id);
  if (!el) return;
  if (el.offsetParent === null && el.closest(".tab-pane.d-none")) return;
  chartInstances[id] = new Chart(el, config);
}

function fontOpts(size = 11) {
  return { family: "'DM Sans', sans-serif", size };
}

function rebuildCharts() {
  if (document.querySelector('.tab-pane[data-page="basic-info"]:not(.d-none)'))
    buildBasicCharts();
  if (document.querySelector('.tab-pane[data-page="performance"]:not(.d-none)'))
    buildPerfCharts();
  if (document.querySelector('.tab-pane[data-page="tactical"]:not(.d-none)'))
    buildTacticalCharts();
  if (
    document.querySelector('.tab-pane[data-page="match-history"]:not(.d-none)')
  )
    buildMatchCharts();
}

/* ═══════════════════════════════════════════════════════
   FULL MATCH DATA
═══════════════════════════════════════════════════════ */
const PLAYER_PERFORMANCE_DATA = window.PLAYER_PERFORMANCE_DATA || {};
const MATCH_DATA = PLAYER_PERFORMANCE_DATA.matches || [];

const stat = (arr, key) => arr.reduce((s, m) => s + (Number(m[key]) || 0), 0);
const DATA_2526 = MATCH_DATA.filter((m) => m.season === "2025/26");
const DATA_2425 = MATCH_DATA.filter((m) => m.season === "2024/25");

/* ═══════════════════════════════════════════════════════
   MATCH TABLE
═══════════════════════════════════════════════════════ */
let filteredMatches = DATA_2526.slice();
let currentPage = 1;
const PAGE_SIZE = 7;

function updateSummaryStats(matches) {
  const wins = matches.filter((m) => m.result === "W").length;
  const draws = matches.filter((m) => m.result === "D").length;
  const losses = matches.filter((m) => m.result === "L").length;
  const goals = stat(matches, "goals");
  const assists = stat(matches, "assists");
  const rated = matches.filter((m) => m.rating > 0);
  const avgRat = rated.length
    ? (rated.reduce((a, m) => a + m.rating, 0) / rated.length).toFixed(2)
    : "—";
  const s = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  s("statTotal", matches.length);
  s("statWins", wins);
  s("statDraws", draws);
  s("statLosses", losses);
  s("statAvgRating", avgRat);
  s("statGoals", goals);
  s("statAssists", assists);
  const rW = document.getElementById("resW");
  const rD = document.getElementById("resD");
  const rL = document.getElementById("resL");
  if (rW) rW.textContent = wins;
  if (rD) rD.textContent = draws;
  if (rL) rL.textContent = losses;
  rebuildMatchChartsFromData(matches);
}

function renderMatches() {
  const tbody = document.getElementById("matchTbody");
  if (!tbody) return;
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, filteredMatches.length);
  const slice = filteredMatches.slice(start, end);
  tbody.innerHTML = slice
    .map((m) => {
      const ratingCls =
        m.rating >= 8
          ? "rating-high"
          : m.rating >= 7
            ? "rating-mid"
            : "rating-low";
      const matchup = m.home
        ? `<span class="fw-bold">Arsenal</span> <span style="color:var(--text-2);font-weight:700">${m.score}</span> <span style="color:var(--text-2)">${m.opponent}</span>`
        : `<span style="color:var(--text-2)">${m.opponent}</span> <span style="color:var(--text-2);font-weight:700">${m.score}</span> <span class="fw-bold">Arsenal</span>`;
      const motmHtml = m.motm
        ? `<span class="material-symbols-outlined" style="font-size:16px;color:#f59e0b;font-variation-settings:'FILL' 1">star</span>`
        : `<span style="color:var(--border)">—</span>`;
      return `<tr>
      <td class="match-date">${m.date}</td><td class="text-center"><span class="comp-badge comp-${m.comp}">${m.compLabel}</span></td>
      <td><div class="d-flex align-items-center gap-2">${matchup}</div></td>
      <td class="text-center"><span class="result-badge result-${m.result.toLowerCase()}">${m.result}</span></td>
      <td class="text-center match-date">${m.min}'</td><td class="text-center"><span class="role-tag ${m.role}">${m.role === "starter" ? "S" : "Sub"}</span></td>
      <td class="text-center fw-bold" style="color:${m.goals > 0 ? "var(--primary)" : "var(--text-2)"}">${m.goals}</td>
      <td class="text-center fw-bold" style="color:${m.assists > 0 ? "#10b981" : "var(--text-2)"}">${m.assists}</td>
      <td class="text-center match-date">${m.shots}</td><td class="text-center match-date">${m.keyPass}</td>
      <td class="text-end"><span class="rating-badge ${ratingCls}">${m.rating || "—"}</span></td><td class="text-center">${motmHtml}</td></tr>`;
    })
    .join("");
  const total = filteredMatches.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const countEl = document.getElementById("matchCount");
  if (countEl)
    countEl.textContent =
      total === 0
        ? "No matches found"
        : `${start + 1}–${end} of ${total} matches`;
  const piEl = document.getElementById("pageIndicator");
  if (piEl) piEl.textContent = `${currentPage} / ${totalPages}`;
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
  updateSummaryStats(filteredMatches);
}

function applyMatchFilters() {
  const season = document.getElementById("filterSeason")?.value || "all";
  const comp = document.getElementById("filterComp")?.value || "all";
  const result = document.getElementById("filterResult")?.value || "all";
  const rating =
    parseFloat(document.getElementById("filterRating")?.value) || 0;
  const role = document.getElementById("filterRole")?.value || "all";
  filteredMatches = MATCH_DATA.filter((m) => {
    if (season !== "all" && m.season !== season) return false;
    if (comp !== "all" && m.comp !== comp) return false;
    if (result !== "all" && m.result !== result) return false;
    if (role !== "all" && m.role !== role) return false;
    if (rating > 0 && m.rating < rating) return false;
    return true;
  });
  currentPage = 1;
  renderMatches();
}
document
  .getElementById("applyFilters")
  ?.addEventListener("click", applyMatchFilters);
[
  "filterSeason",
  "filterComp",
  "filterResult",
  "filterRating",
  "filterRole",
].forEach((id) =>
  document.getElementById(id)?.addEventListener("change", applyMatchFilters),
);
document.getElementById("resetFilters")?.addEventListener("click", () => {
  [
    "filterSeason",
    "filterComp",
    "filterResult",
    "filterRating",
    "filterRole",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      if (id === "filterSeason") el.value = "2025/26";
      else el.selectedIndex = 0;
    }
  });
  filteredMatches = DATA_2526.slice();
  currentPage = 1;
  renderMatches();
});
document.getElementById("prevPage")?.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderMatches();
  }
});
document.getElementById("nextPage")?.addEventListener("click", () => {
  if (currentPage < Math.ceil(filteredMatches.length / PAGE_SIZE)) {
    currentPage++;
    renderMatches();
  }
});

/* ═══════════════════════════════════════════════════════
   CHARTS
═══════════════════════════════════════════════════════ */
function rebuildMatchChartsFromData(matches) {
  if (
    !document.querySelector('.tab-pane[data-page="match-history"]:not(.d-none)')
  )
    return;
  const primary = gc("primary"),
    border = gc("border"),
    text2 = gc("text2");
  const fo = fontOpts();
  const wins = matches.filter((m) => m.result === "W").length;
  const draws = matches.filter((m) => m.result === "D").length;
  const losses = matches.filter((m) => m.result === "L").length;

  mkChart("resultDonut", {
    type: "doughnut",
    data: {
      labels: ["Win", "Draw", "Loss"],
      datasets: [
        {
          data: [wins, draws, losses],
          backgroundColor: ["#10b981", "#94a3b8", primary],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: { legend: { display: false } },
    },
  });

  const recent8 = matches
    .filter((m) => m.rating > 0)
    .slice(0, 8)
    .reverse();
  if (recent8.length) {
    mkChart("ratingInlineChart", {
      type: "line",
      data: {
        labels: recent8.map((m) => m.opponent.split(" (")[0]),
        datasets: [
          {
            data: recent8.map((m) => m.rating),
            borderColor: primary,
            backgroundColor: "rgba(236,0,36,.06)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: recent8.map((m) =>
              m.rating >= 8 ? "#10b981" : m.rating < 7 ? primary : "#3b82f6",
            ),
            pointRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => ` Rating: ${c.raw}` } },
        },
        scales: {
          x: {
            ticks: { color: text2, font: fontOpts(9) },
            grid: { color: border },
          },
          y: {
            min: 5,
            max: 10,
            ticks: { color: text2, font: fo },
            grid: { color: border },
          },
        },
      },
    });
  }

  const recent10GA = matches.slice(0, 10).reverse();
  mkChart("matchGAChart", {
    type: "bar",
    data: {
      labels: recent10GA.map((m) => m.opponent.split(" (")[0]),
      datasets: [
        {
          label: "Goals",
          data: recent10GA.map((m) => m.goals),
          backgroundColor: primary,
          borderRadius: 4,
        },
        {
          label: "Assists",
          data: recent10GA.map((m) => m.assists),
          backgroundColor: "rgba(16,185,129,.7)",
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: text2, font: fo } } },
      scales: {
        x: {
          ticks: { color: text2, font: fontOpts(9), maxRotation: 45 },
          grid: { color: border },
        },
        y: {
          ticks: { color: text2, font: fo, stepSize: 1 },
          grid: { color: border },
        },
      },
    },
  });

  const ratedMatches = matches.filter((m) => m.rating > 0);
  mkChart("minutesRatingChart", {
    type: "bubble",
    data: {
      datasets: [
        {
          label: "Matches",
          data: ratedMatches.map((m) => ({
            x: m.min,
            y: m.rating,
            r: Math.max(3, (m.goals + m.assists) * 4 + 3),
          })),
          backgroundColor: ratedMatches.map((m) =>
            m.rating >= 8
              ? "rgba(16,185,129,.6)"
              : m.rating < 7
                ? "rgba(236,0,36,.5)"
                : "rgba(59,130,246,.5)",
          ),
          borderColor: ratedMatches.map((m) =>
            m.rating >= 8 ? "#10b981" : m.rating < 7 ? primary : "#3b82f6",
          ),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => {
              const m = ratedMatches[c.dataIndex];
              return m
                ? ` ${m.opponent.split(" (")[0]} · ${m.min}' · ${m.rating} · G:${m.goals} A:${m.assists}`
                : "";
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Minutes Played",
            color: text2,
            font: fo,
          },
          ticks: { color: text2, font: fo },
          grid: { color: border },
          min: 50,
          max: 100,
        },
        y: {
          title: { display: true, text: "Rating", color: text2, font: fo },
          min: 5.5,
          max: 10,
          ticks: { color: text2, font: fo },
          grid: { color: border },
        },
      },
    },
  });

  const chron = matches
    .filter((m) => m.rating > 0)
    .slice()
    .reverse();
  const rollingLabels = [],
    rollingData = [],
    individualData = [];
  for (let i = 0; i < chron.length; i++) {
    const opp = chron[i].opponent.split(" (")[0];
    rollingLabels.push(opp.length > 10 ? opp.slice(0, 10) + "…" : opp);
    individualData.push(chron[i].rating);
    if (i >= 4) {
      const window5 = chron.slice(i - 4, i + 1);
      const avg = window5.reduce((a, m) => a + m.rating, 0) / window5.length;
      rollingData.push({ x: i, y: parseFloat(avg.toFixed(2)) });
    }
  }
  mkChart("rollingAvgChart", {
    type: "line",
    data: {
      labels: rollingLabels,
      datasets: [
        {
          label: "Match Rating",
          data: individualData,
          borderColor: "rgba(148,163,184,.4)",
          backgroundColor: "transparent",
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: "rgba(148,163,184,.5)",
          borderWidth: 1,
          borderDash: [3, 3],
        },
        {
          label: "Rolling 5-Match Avg",
          data: rollingData,
          borderColor: primary,
          backgroundColor: "rgba(236,0,36,.08)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: primary,
          pointRadius: 5,
          borderWidth: 2.5,
          spanGaps: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: text2, font: fo } } },
      scales: {
        x: {
          ticks: {
            color: text2,
            font: fontOpts(8),
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 12,
          },
          grid: { color: border },
        },
        y: {
          min: 5.5,
          max: 10,
          ticks: { color: text2, font: fo },
          grid: { color: border },
        },
      },
    },
  });
}

function buildMatchCharts() {
  rebuildMatchChartsFromData(filteredMatches);
}

function buildBasicCharts() {
  const primary = gc("primary"),
    border = gc("border"),
    text2 = gc("text2");
  mkChart("marketValueChart", {
    type: "line",
    data: {
      labels: ["2020", "2021", "2022", "2023", "2024", "2025", "2026"],
      datasets: [
        {
          label: "£M",
          data: [20, 50, 80, 100, 130, 120, 110],
          borderColor: primary,
          backgroundColor: "rgba(236,0,36,.08)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: primary,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` £${c.raw}M` } },
      },
      scales: {
        x: {
          ticks: { color: text2, font: fontOpts() },
          grid: { color: border },
        },
        y: {
          ticks: { color: text2, font: fontOpts(), callback: (v) => `£${v}M` },
          grid: { color: border },
        },
      },
    },
  });
}

function buildPerfCharts() {
  const primary = gc("primary"),
    border = gc("border"),
    text2 = gc("text2");
  const fo = fontOpts();
  const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const moKey = {
    "08": 0,
    "09": 1,
    10: 2,
    11: 3,
    12: 4,
    "01": 5,
    "02": 6,
    "03": 7,
  };
  const mG = [0, 0, 0, 0, 0, 0, 0, 0],
    mA = [0, 0, 0, 0, 0, 0, 0, 0];
  DATA_2526.forEach((m) => {
    const idx = moKey[m.date.slice(3, 5)];
    if (idx !== undefined) {
      mG[idx] += m.goals;
      mA[idx] += m.assists;
    }
  });

  mkChart("goalsAssistsChart", {
    type: "bar",
    data: {
      labels: MONTHS,
      datasets: [
        { label: "Goals", data: mG, backgroundColor: primary, borderRadius: 6 },
        {
          label: "Assists",
          data: mA,
          backgroundColor: "rgba(16,185,129,.7)",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: text2, font: fo } } },
      scales: {
        x: { ticks: { color: text2, font: fo }, grid: { color: border } },
        y: {
          ticks: { color: text2, font: fo, stepSize: 1 },
          grid: { color: border },
        },
      },
    },
  });

  mkChart("shotDistChart", {
    type: "doughnut",
    data: {
      labels: ["On Target", "Off Target", "Blocked"],
      datasets: [
        {
          data: [25, 32, 8],
          backgroundColor: [primary, border, "rgba(245,158,11,.6)"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: text2, font: fo, boxWidth: 10, padding: 10 },
        },
      },
    },
  });

  mkChart("crossAccuracyChart", {
    type: "doughnut",
    data: {
      labels: ["Completed", "Blocked", "Failed"],
      datasets: [
        {
          data: [57, 68, 47],
          backgroundColor: [
            "#10b981",
            "rgba(245,158,11,.7)",
            "rgba(148,163,184,.5)",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: text2,
            font: fontOpts(10),
            boxWidth: 10,
            padding: 8,
          },
        },
      },
    },
  });

  mkChart("progressiveRunsChart", {
    type: "bar",
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: "Successful",
          data: [9, 13, 15, 11, 12, 10, 16, 12],
          backgroundColor: primary,
          borderRadius: 4,
        },
        {
          label: "Unsuccessful",
          data: [3, 4, 5, 3, 4, 3, 5, 4],
          backgroundColor: "rgba(148,163,184,.4)",
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: text2, font: fo } } },
      scales: {
        x: { ticks: { color: text2, font: fo }, grid: { color: border } },
        y: {
          ticks: { color: text2, font: fo, stepSize: 5 },
          grid: { color: border },
          stacked: true,
        },
      },
    },
  });

  const xAFixed = [0.8, 1.4, 1.0, 0.9, 0.5, 0.8, 1.0, 1.0];
  mkChart("xAChart", {
    type: "bar",
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: "xA",
          data: xAFixed,
          backgroundColor: "rgba(245,158,11,.3)",
          borderRadius: 4,
        },
        {
          label: "Assists",
          data: mA,
          type: "line",
          borderColor: "#10b981",
          backgroundColor: "transparent",
          tension: 0.4,
          pointBackgroundColor: "#10b981",
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: text2, font: fo } } },
      scales: {
        x: { ticks: { color: text2, font: fo }, grid: { color: border } },
        y: { ticks: { color: text2, font: fo }, grid: { color: border } },
      },
    },
  });

  mkChart("perfRadarChart", {
    type: "radar",
    data: {
      labels: [
        "Dribbles",
        "Key Passes",
        "Crosses",
        "xA",
        "Progressive Runs",
        "1v1 Duels",
      ],
      datasets: [
        {
          label: "2025/26",
          data: [82, 84, 72, 78, 88, 71],
          borderColor: primary,
          backgroundColor: "rgba(236,0,36,.15)",
          pointBackgroundColor: primary,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: text2, font: fo } } },
      scales: {
        r: {
          ticks: { display: false },
          grid: { color: border },
          pointLabels: { color: text2, font: fo },
          min: 0,
          max: 100,
        },
      },
    },
  });

  mkChart("duelSuccessChart", {
    type: "bar",
    data: {
      labels: ["Fullbacks", "CBs", "Midfielders", "DMs", "Wingers"],
      datasets: [
        {
          label: "Win %",
          data: [72, 48, 78, 55, 62],
          backgroundColor: [
            primary,
            "rgba(245,158,11,.7)",
            "#10b981",
            "rgba(59,130,246,.7)",
            "rgba(168,85,247,.7)",
          ],
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: "#8b949e", font: { size: 9 } },
          grid: { display: false },
        },
        y: {
          min: 30,
          max: 100,
          ticks: {
            color: "#8b949e",
            font: { size: 9 },
            callback: (v) => `${v}%`,
          },
          grid: { color: "rgba(255,255,255,.06)" },
        },
      },
    },
  });

  const passAcc = [82, 84, 87, 80, 86, 81, 88, 85];
  const keyPasses = [5, 8, 9, 7, 8, 6, 10, 7];
  mkChart("passAccuracyChart", {
    type: "line",
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: "Pass Accuracy %",
          data: passAcc,
          borderColor: primary,
          backgroundColor: "rgba(236,0,36,.07)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: primary,
          pointRadius: 4,
          yAxisID: "y",
        },
        {
          label: "Key Passes",
          data: keyPasses,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,.05)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#3b82f6",
          pointRadius: 4,
          yAxisID: "y1",
          borderDash: [4, 4],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: text2, font: fo } } },
      scales: {
        x: { ticks: { color: text2, font: fo }, grid: { color: border } },
        y: {
          min: 70,
          max: 100,
          position: "left",
          ticks: { color: text2, font: fo, callback: (v) => `${v}%` },
          grid: { color: border },
        },
        y1: {
          position: "right",
          ticks: { color: text2, font: fo, stepSize: 2 },
          grid: { display: false },
        },
      },
    },
  });
}

function buildTacticalCharts() {
  const primary = gc("primary"),
    border = gc("border"),
    text2 = gc("text2");
  const fo = fontOpts();

  mkChart("tacticalRadar", {
    type: "radar",
    data: {
      labels: [
        "Positioning",
        "Vision",
        "Pressing",
        "Inside Cutting",
        "Off-Ball Movement",
        "Flank Overlap",
      ],
      datasets: [
        {
          label: "Saka",
          data: [85, 88, 74, 91, 82, 65],
          borderColor: primary,
          backgroundColor: "rgba(236,0,36,.12)",
          pointBackgroundColor: primary,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: text2, font: fo } } },
      scales: {
        r: {
          ticks: { display: false },
          grid: { color: border },
          pointLabels: { color: text2, font: fo },
          min: 0,
          max: 100,
        },
      },
    },
  });

  mkChart("insideCutChart", {
    type: "doughnut",
    data: {
      labels: ["Shot Created", "Pass Completed", "Won Foul", "Lost Possession"],
      datasets: [
        {
          data: [18, 32, 10, 8],
          backgroundColor: [
            primary,
            "#10b981",
            "rgba(245,158,11,.7)",
            "rgba(148,163,184,.4)",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "55%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: text2, font: fontOpts(9), boxWidth: 8, padding: 6 },
        },
      },
    },
  });

  mkChart("passNetworkChart", {
    type: "bar",
    data: {
      labels: ["Ødegaard", "Havertz", "White", "Timber", "Trossard", "Merino"],
      datasets: [
        {
          label: "Passes Exchanged",
          data: [72, 55, 48, 40, 35, 30],
          backgroundColor: [
            primary,
            "rgba(59,130,246,.7)",
            "rgba(16,185,129,.7)",
            "rgba(245,158,11,.7)",
            "rgba(139,92,246,.7)",
            "rgba(236,72,153,.7)",
          ],
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: text2, font: fo }, grid: { color: border } },
        y: { ticks: { color: text2, font: fo }, grid: { display: false } },
      },
    },
  });

  mkChart("finalThirdDefChart", {
    type: "bar",
    data: {
      labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
      datasets: [
        {
          label: "Press Success",
          data: [5, 7, 8, 6, 6, 5, 9, 7],
          backgroundColor: primary,
          borderRadius: 4,
        },
        {
          label: "Tackles",
          data: [2, 3, 3, 2, 2, 2, 4, 3],
          backgroundColor: "rgba(59,130,246,.7)",
          borderRadius: 4,
        },
        {
          label: "Recoveries",
          data: [4, 5, 6, 4, 5, 4, 7, 5],
          backgroundColor: "rgba(16,185,129,.5)",
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: text2, font: fo } } },
      scales: {
        x: { ticks: { color: text2, font: fo }, grid: { color: border } },
        y: {
          ticks: { color: text2, font: fo, stepSize: 2 },
          grid: { color: border },
        },
      },
    },
  });

  mkChart("touchesByZoneChart", {
    type: "bar",
    data: {
      labels: [
        "Def 3rd",
        "Mid 3rd Right",
        "Mid 3rd Centre",
        "Att 3rd Right",
        "Att 3rd Centre",
        "Inside Box",
      ],
      datasets: [
        {
          label: "Touches",
          data: [124, 285, 62, 342, 148, 89],
          backgroundColor: [
            "rgba(148,163,184,.4)",
            "rgba(59,130,246,.5)",
            "rgba(59,130,246,.3)",
            primary,
            "rgba(236,0,36,.6)",
            "rgba(236,0,36,.9)",
          ],
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: text2, font: fo }, grid: { color: border } },
        y: {
          ticks: { color: text2, font: fontOpts(9) },
          grid: { display: false },
        },
      },
    },
  });

  mkChart("scaChart", {
    type: "doughnut",
    data: {
      labels: ["Dribble", "Pass", "Cross", "Foul Drawn", "Recovery"],
      datasets: [
        {
          data: [38, 32, 14, 10, 6],
          backgroundColor: [
            primary,
            "#3b82f6",
            "rgba(16,185,129,.7)",
            "rgba(245,158,11,.7)",
            "rgba(168,85,247,.6)",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "55%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: text2,
            font: fontOpts(10),
            boxWidth: 10,
            padding: 8,
          },
        },
      },
    },
  });

  mkChart("oppositionChart", {
    type: "bar",
    data: {
      labels: ["vs Top 4", "vs Top 6", "vs Mid Table", "vs Bottom 6"],
      datasets: [
        {
          label: "Dribble Won",
          data: [14, 22, 38, 30],
          backgroundColor: primary,
          borderRadius: 6,
        },
        {
          label: "Key Passes",
          data: [10, 16, 20, 10],
          backgroundColor: "rgba(59,130,246,.7)",
          borderRadius: 6,
        },
        {
          label: "Avg Rating",
          data: [7.6, 7.7, 7.7, 7.5],
          type: "line",
          borderColor: "#f59e0b",
          backgroundColor: "transparent",
          tension: 0.4,
          pointBackgroundColor: "#f59e0b",
          pointRadius: 5,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: text2, font: fo } } },
      scales: {
        x: { ticks: { color: text2, font: fo }, grid: { color: border } },
        y: {
          ticks: { color: text2, font: fo, stepSize: 5 },
          grid: { color: border },
          title: {
            display: true,
            text: "Dribbles / Key Passes",
            color: text2,
            font: fo,
          },
        },
        y1: {
          position: "right",
          min: 6,
          max: 10,
          ticks: { color: text2, font: fo },
          grid: { display: false },
          title: { display: true, text: "Rating", color: text2, font: fo },
        },
      },
    },
  });

  mkChart("zoneEntryChart", {
    type: "doughnut",
    data: {
      labels: ["Dribble carry", "Through pass", "Run behind", "Cross receive"],
      datasets: [
        {
          data: [44, 31, 18, 7],
          backgroundColor: [
            primary,
            "rgba(59,130,246,.8)",
            "rgba(16,185,129,.8)",
            "rgba(245,158,11,.8)",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      plugins: { legend: { display: false } },
    },
  });

  mkChart("networkCentralityChart", {
    type: "bar",
    data: {
      labels: ["Build-Up", "Progression", "Final Third", "Set Pieces"],
      datasets: [
        {
          label: "Passes Received",
          data: [85, 120, 145, 22],
          backgroundColor: "rgba(59,130,246,.6)",
          borderRadius: 4,
        },
        {
          label: "Passes Made",
          data: [78, 105, 98, 8],
          backgroundColor: primary,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: text2, font: fo } } },
      scales: {
        x: { ticks: { color: text2, font: fo }, grid: { color: border } },
        y: {
          ticks: { color: text2, font: fo, stepSize: 30 },
          grid: { color: border },
        },
      },
    },
  });
}

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  buildSidebar();

  // Close mobile sidebar when clicking nav links
  document.querySelectorAll(".nav-link-item").forEach((l) => {
    l.addEventListener("click", () => {
      if (window.innerWidth < 992) closeSidebar();
    });
  });

  const seasonEl = document.getElementById("filterSeason");
  if (seasonEl) seasonEl.value = "2025/26";
  filteredMatches = DATA_2526.slice();
  setTimeout(buildBasicCharts, 120);

  /* ══ NOTIFICATION SYSTEM (Loaded from external notifications.js) ══ */
});
