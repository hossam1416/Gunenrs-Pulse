"use strict";

/* ── Quick helpers (derived from MATCHES, used by DATA below) ── */
var _pl = MATCHES.filter(function (m) {
  return m.comp === "PL";
});
var _ucl = MATCHES.filter(function (m) {
  return m.comp === "UCL" && m.result !== null;
});
var _efl = MATCHES.filter(function (m) {
  return m.comp === "EFL";
});
var _fac = MATCHES.filter(function (m) {
  return m.comp === "FAC";
});

function _wdl(arr) {
  return arr.reduce(
    function (a, m) {
      a[m.result] = (a[m.result] || 0) + 1;
      return a;
    },
    { W: 0, D: 0, L: 0 },
  );
}
function _gf(arr) {
  return arr.reduce(function (a, m) {
    return a + (m.arsSc || 0);
  }, 0);
}
function _ga(arr) {
  return arr.reduce(function (a, m) {
    return a + (m.oppSc || 0);
  }, 0);
}
/* ═══════════════════════════════════════════
   §2  MAIN DATA OBJECT
════════════════════════════════════════════ */

const allComps = {
  played: MATCHES.filter(function (m) {
    return m.result !== null;
  }).length,
  wins: MATCHES.filter(function (m) {
    return m.result === "W";
  }).length,
  draws: MATCHES.filter(function (m) {
    return m.result === "D";
  }).length,
  losses: MATCHES.filter(function (m) {
    return m.result === "L";
  }).length,
  gf: _gf(
    MATCHES.filter(function (m) {
      return m.result !== null;
    }),
  ),
  ga: _ga(
    MATCHES.filter(function (m) {
      return m.result !== null;
    }),
  ),
};

console.log(
  allComps.wins,
); /* ═══ end DATA ═══════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
   §3  CHART INSTANCES  (module-level refs)
═══════════════════════════════════════════════════════════════════════════ */
var performanceChartInst = null;
var xgChartInst = null;
var controlChartInst = null;
var countdownInterval = null;

/* ═══════════════════════════════════════════════════════════════════════════
   §4  MOBILE SIDEBAR
═══════════════════════════════════════════════════════════════════════════ */
function openSidebar() {
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("mobOverlay");
  if (sidebar) sidebar.classList.add("mob-open");
  if (overlay) overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}
function closeSidebar() {
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("mobOverlay");
  if (sidebar) sidebar.classList.remove("mob-open");
  if (overlay) overlay.classList.remove("active");
  document.body.style.overflow = "";
}

/* ═══════════════════════════════════════════════════════════════════════════
   §5  DARK MODE
═══════════════════════════════════════════════════════════════════════════ */
var THEME_KEY = "gp_theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  var icon = document.getElementById("themeIcon");
  if (icon) icon.textContent = theme === "dark" ? "light_mode" : "dark_mode";
  var logo = document.getElementById("siteLogo");
  if (logo)
    logo.src =
      theme === "dark"
        ? "/static/images/dark_gun.jpg"
        : "/static/images/white_gun.jpg";
  if (performanceChartInst || xgChartInst || controlChartInst)
    updateAllChartsTheme(theme);
}
function toggleTheme() {
  var current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
}
function getThemeColors(theme) {
  return {
    grid: theme === "dark" ? "#21262d" : "#f1f5f9",
    tick: theme === "dark" ? "#8b949e" : "#94a3b8",
    bg: theme === "dark" ? "#161b22" : "#ffffff",
  };
}
function updateAllChartsTheme(theme) {
  var colors = getThemeColors(theme);
  var all = [
    performanceChartInst,
    xgChartInst,
    controlChartInst,
    window._cleanSheetsInst,
    window._pressingInst,
    window._homeAwayInst,
    window._goalTimingInst,
    window._topScorersInst,
    window._minutesPlayedInst,
  ];
  all.forEach(function (chart) {
    if (!chart) return;
    Object.values(chart.options.scales).forEach(function (scale) {
      if (scale.grid) scale.grid.color = colors.grid;
      if (scale.ticks) scale.ticks.color = colors.tick;
      if (scale.angleLines) scale.angleLines.color = colors.grid;
      if (scale.pointLabels) scale.pointLabels.color = colors.tick;
    });
    if (chart.options.plugins.legend)
      chart.options.plugins.legend.labels.color = colors.tick;
    chart.update();
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   §6  COUNTDOWN
═══════════════════════════════════════════════════════════════════════════ */
function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  var target = new Date(DATA.nextMatch.countdownTarget);
  countdownInterval = setInterval(function () {
    var diff = target - new Date();
    var el = document.getElementById("countdown-display");
    if (!el) return;
    if (diff <= 0) {
      clearInterval(countdownInterval);
      el.textContent = "KICK OFF!";
      return;
    }
    var h = Math.floor(diff / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    el.textContent =
      String(h).padStart(2, "0") +
      "h : " +
      String(m).padStart(2, "0") +
      "m : " +
      String(s).padStart(2, "0") +
      "s";
  }, 1000);
}

/* ═══════════════════════════════════════════════════════════════════════════
   §7  RENDER FUNCTIONS  (unchanged — DOM injection only)
═══════════════════════════════════════════════════════════════════════════ */

/* ── Coach ─────────────────────────────────────────── */
function renderCoach() {
  var c = DATA.coach;
  document.getElementById("sec-coach").innerHTML =
    '<div class="d-flex align-items-center gap-3 pb-3 mb-3 border-bottom" style="border-color:var(--border)!important">' +
    '<img class="coach-avatar" src="' +
    c.avatar +
    '" alt="' +
    c.name +
    '" />' +
    "<div>" +
    '<div style="font-weight:800;color:var(--text-1);font-size:15px">' +
    c.name +
    "</div>" +
    '<div style="font-size:11px;color:var(--primary);font-weight:700">' +
    c.role +
    "</div>" +
    '<span class="badge-license mt-1 d-inline-block">' +
    c.license +
    "</span>" +
    "</div></div>" +
    '<div class="row g-2 mb-3">' +
    [
      ["Experience", c.experience, ""],
      ["Win Rate", c.winRate, "green"],
      ["Matches", c.matches, ""],
      ["Trophies", c.trophies, "red"],
    ]
      .map(function (item) {
        return (
          '<div class="col-6"><div class="stat-mini"><div class="stat-mini-label">' +
          item[0] +
          '</div><div class="stat-mini-val' +
          (item[2] ? " " + item[2] : "") +
          '">' +
          item[1] +
          "</div></div></div>"
        );
      })
      .join("") +
    "</div>" +
    '<div class="mb-3" style="font-size:10px">' +
    [
      ["Age / DOB", c.dob],
      ["Teams", c.teams],
      ["Languages", c.languages],
    ]
      .map(function (item, i, arr) {
        return (
          '<div class="d-flex justify-content-between py-1' +
          (i < arr.length - 1 ? " border-bottom" : "") +
          '" style="border-color:var(--border)!important"><span style="color:var(--text-2)">' +
          item[0] +
          '</span><span style="font-weight:700;color:var(--text-1)">' +
          item[1] +
          "</span></div>"
        );
      })
      .join("") +
    "</div>" +
    '<div class="ach-box mb-3"><div class="ach-label">Notable Achievement</div><div class="ach-value">' +
    c.achievements +
    "</div></div>" +
    '<div class="d-flex justify-content-center gap-2 pt-2 border-top" style="border-color:var(--border)!important">' +
    '<a href="' +
    c.linkedin +
    '" class="social-btn linkedin"><svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></a>' +
    '<a href="' +
    c.twitter +
    '" class="social-btn x"><svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>' +
    "</div>";
}

/* ── Season Performance ────────────────────────────── */
function renderMetricRow(m) {
  var barStyle = m.barColor
    ? 'style="width:' + m.pct + "%;background:" + m.barColor + '"'
    : 'class="progress-bar-gp ' + m.barClass + '" style="width:' + m.pct + '%"';
  return (
    '<div class="sp-metric-row">' +
    '<div class="d-flex justify-content-between mb-1">' +
    '<span class="sp-metric-label"><span class="material-symbols-outlined" style="font-size:13px;color:' +
    m.iconColor +
    ';vertical-align:middle">' +
    m.icon +
    "</span> " +
    m.label +
    "</span>" +
    '<span class="sp-metric-val">' +
    m.value +
    "</span></div>" +
    '<div class="progress-gp"><div ' +
    barStyle +
    "></div></div></div>"
  );
}

function renderSeason() {
  var s = DATA.season;
  document.getElementById("sec-season").innerHTML =
    '<div class="d-flex align-items-center justify-content-between mb-3">' +
    '<h2 class="card-title-gp mb-0"><span class="title-icon"><span class="material-symbols-outlined">analytics</span></span>Season Performance</h2>' +
    '<div class="d-flex gap-2 align-items-center">' +
    '<span class="badge-gp badge-green"><span class="material-symbols-outlined" style="font-size:13px">emoji_events</span>' +
    s.position +
    "</span>" +
    '<span class="sp-season-tag">' +
    s.year +
    "</span></div></div>" +
    '<div class="row g-2 mb-3">' +
    s.kpis
      .map(function (k) {
        return (
          '<div class="col-6 col-sm-4 col-xl-2"><div class="sp-kpi-box' +
          (k.highlight ? " sp-kpi-highlight" : "") +
          '">' +
          '<div class="sp-kpi-icon" style="background:' +
          k.iconBg +
          ";color:" +
          k.iconColor +
          '"><span class="material-symbols-outlined">' +
          k.icon +
          "</span></div>" +
          '<div class="sp-kpi-label">' +
          k.label +
          "</div>" +
          '<div class="sp-kpi-val"' +
          (k.valueColor ? ' style="color:' + k.valueColor + '"' : "") +
          ">" +
          k.value +
          "</div>" +
          (k.showBars
            ? '<div class="rec-bars mt-1"><span class="rec-bar win"></span><span class="rec-bar draw"></span><span class="rec-bar loss"></span></div>'
            : "") +
          (k.sub
            ? '<div class="sp-kpi-sub ' +
              k.sub.cls +
              '">' +
              k.sub.text +
              "</div>"
            : "") +
          "</div></div>"
        );
      })
      .join("") +
    "</div>" +
    '<div class="sp-divider mb-2">Match Results Breakdown</div>' +
    '<div class="row g-2 mb-3">' +
    s.breakdown
      .map(function (b) {
        return (
          '<div class="col-6 col-md-3"><div class="sp-stat-row">' +
          '<span class="material-symbols-outlined sp-stat-ico ' +
          b.cls +
          '">' +
          b.icon +
          "</span><div>" +
          '<div class="sp-stat-label">' +
          b.label +
          "</div>" +
          '<div class="sp-stat-val">' +
          b.val +
          (b.opp ? ' <span class="sp-stat-opp">' + b.opp + "</span>" : "") +
          "</div></div></div></div>"
        );
      })
      .join("") +
    "</div>" +
    '<div class="sp-divider mb-2">Attacking & Defensive Metrics</div>' +
    '<div class="row g-2">' +
    '<div class="col-12 col-md-6">' +
    s.metrics.slice(0, 3).map(renderMetricRow).join("") +
    "</div>" +
    '<div class="col-12 col-md-6">' +
    s.metrics.slice(3).map(renderMetricRow).join("") +
    "</div></div>";
}

/* ── Last Match ────────────────────────────────────── */
function renderStatBar(s) {
  var hVal = s.suffix ? s.home + s.suffix : s.home;
  var aVal = s.suffix ? s.away + s.suffix : s.away;
  var total = s.home + s.away;
  var hPct = ((s.home / total) * 100).toFixed(1);
  var aPct = ((s.away / total) * 100).toFixed(1);
  var yelClass = s.yellow ? " yel" : "";
  return (
    '<div class="ts-row">' +
    '<span class="ts-val home">' +
    hVal +
    "</span>" +
    '<span class="ts-label">' +
    s.label +
    "</span>" +
    '<span class="ts-val away">' +
    aVal +
    "</span>" +
    '<div class="ts-bar-wrap">' +
    '<div class="ts-bar home-bar' +
    yelClass +
    '" style="width:' +
    hPct +
    '%"></div>' +
    '<div class="ts-bar away-bar' +
    yelClass +
    '" style="width:' +
    aPct +
    '%"></div>' +
    "</div></div>"
  );
}

function renderLastMatch() {
  var m = DATA.lastMatch;
  var scorersHtml = m.scorers.length
    ? "⚽ " +
      m.scorers
        .map(function (s) {
          return (
            '<span style="color:var(--text-1);font-weight:700">' +
            s.player +
            " " +
            s.minute +
            "</span>"
          );
        })
        .join("&nbsp;&nbsp;") +
      m.conceded
        .map(function (c) {
          return (
            '<span style="margin-left:8px;color:var(--text-2)">' +
            c.player +
            " " +
            c.minute +
            "</span>"
          );
        })
        .join("")
    : '<span style="color:var(--text-2)">No goals conceded — clean sheet</span>';

  document.getElementById("sec-last-match").innerHTML =
    '<div class="d-flex justify-content-between align-items-center mb-3">' +
    '<span class="sec-label mb-0">Last Match</span>' +
    '<span style="font-size:10px;color:var(--text-2);font-weight:700">' +
    m.competition +
    "</span></div>" +
    '<div class="d-flex align-items-center justify-content-between mb-3">' +
    '<div class="text-center"><div class="match-badge-ph mx-auto mb-1" style="color:#fff;background:' +
    m.homeTeam.color +
    ';font-size:7px">' +
    m.homeTeam.abbr +
    "</div>" +
    '<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-1)">' +
    m.homeTeam.name +
    "</div></div>" +
    '<div class="text-center"><div class="match-score">' +
    m.homeScore +
    " - " +
    m.awayScore +
    "</div>" +
    '<div class="match-result win">' +
    m.result +
    "</div></div>" +
    '<div class="text-center"><div class="match-badge-ph mx-auto mb-1" style="color:#fff;background:' +
    m.awayTeam.color +
    ';font-size:7px">' +
    m.awayTeam.abbr +
    "</div>" +
    '<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-2)">' +
    m.awayTeam.name +
    "</div></div></div>" +
    '<div class="mb-2 p-2" style="background:var(--bg-muted);border-radius:8px;font-size:10px;font-weight:600;color:var(--text-2)">' +
    scorersHtml +
    "</div>" +
    '<div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom" style="border-color:var(--border)!important">' +
    '<span style="font-size:10px;font-weight:800;color:var(--primary);text-transform:uppercase">' +
    m.homeTeam.name +
    "</span>" +
    '<span style="font-size:9px;font-weight:900;color:var(--text-2);text-transform:uppercase;letter-spacing:0.1em">Team Stats</span>' +
    '<span style="font-size:10px;font-weight:800;color:' +
    m.awayTeam.color +
    ';text-transform:uppercase">' +
    m.awayTeam.name +
    "</span></div>" +
    m.stats.map(renderStatBar).join("");
}

/* ── Next Match ────────────────────────────────────── */
function renderFormDots(form) {
  return form
    .map(function (f) {
      return '<span class="form-dot ' + f.toLowerCase() + '">' + f + "</span>";
    })
    .join("");
}

function renderNextMatch() {
  var n = DATA.nextMatch;
  document.getElementById("sec-next-match").innerHTML =
    '<div class="d-flex justify-content-between align-items-center mb-3">' +
    '<span class="sec-label mb-0">Next Match</span>' +
    '<span class="badge-gp badge-red"><span class="live-dot me-1"></span>' +
    n.competitionLabel +
    "</span></div>" +
    '<div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom" style="border-color:var(--border)!important">' +
    '<div><div class="nm-badge-wrap mb-1" style="background:' +
    n.leftTeam.color +
    '"><span style="font-size:9px;font-weight:900;color:#fff">' +
    n.leftTeam.abbr +
    "</span></div>" +
    '<div style="font-size:12px;font-weight:800;color:var(--text-1)">' +
    n.leftTeam.name +
    "</div>" +
    '<div class="d-flex gap-1 mt-1">' +
    renderFormDots(n.leftTeam.form) +
    "</div></div>" +
    '<div class="text-center"><div class="nm-vs">VS</div><div class="nm-competition">' +
    n.competition +
    "</div></div>" +
    '<div class="text-end"><div class="nm-badge-wrap ms-auto mb-1" style="background:' +
    n.rightTeam.color +
    '"><span style="font-size:9px;font-weight:900;color:#fff">' +
    n.rightTeam.abbr +
    "</span></div>" +
    '<div style="font-size:12px;font-weight:800;color:var(--text-1)">' +
    n.rightTeam.name +
    "</div>" +
    '<div class="d-flex gap-1 mt-1 justify-content-end">' +
    renderFormDots(n.rightTeam.form) +
    "</div></div></div>" +
    '<div class="row g-2 mb-3">' +
    n.info
      .map(function (inf) {
        return (
          '<div class="col-6"><div class="nm-info-item">' +
          '<span class="material-symbols-outlined nm-info-ico">' +
          inf.icon +
          "</span><div>" +
          '<div class="nm-info-label">' +
          inf.label +
          "</div>" +
          '<div class="nm-info-val">' +
          inf.value +
          "</div></div></div></div>"
        );
      })
      .join("") +
    "</div>" +
    '<div class="countdown-box mb-3"><div>' +
    '<div class="countdown-label">Countdown to Kick-off</div>' +
    '<div class="countdown-time" id="countdown-display">--h : --m : --s</div>' +
    '</div><div class="text-end">' +
    '<div class="countdown-label">UCL Progress</div>' +
    '<span class="difficulty-badge" style="color:' +
    n.uclPhase.color +
    '">' +
    n.uclPhase.text +
    "</span></div></div>" +
    '<div class="nm-scout"><div class="nm-scout-title">' +
    '<span class="material-symbols-outlined" style="font-size:13px;color:var(--primary)">visibility</span>Scouting Notes</div>' +
    '<div class="d-flex flex-column gap-2">' +
    n.scouting
      .map(function (sc) {
        return (
          '<div class="d-flex align-items-start gap-2">' +
          '<span class="nm-scout-tag ' +
          sc.tag +
          '">' +
          sc.tagLabel +
          "</span>" +
          '<span class="nm-scout-text">' +
          sc.text +
          "</span></div>"
        );
      })
      .join("") +
    "</div></div>";
}

/* ── Schedule ──────────────────────────────────────── */
function renderSchedule() {
  document.getElementById("sec-schedule").innerHTML =
    '<h2 class="card-title-gp"><span class="material-symbols-outlined title-ico">calendar_today</span>Next Match</h2>' +
    '<div class="timeline">' +
    DATA.schedule
      .map(function (item) {
        return (
          '<div class="timeline-item">' +
          '<div class="timeline-dot' +
          (item.active ? "" : " inactive") +
          '"></div>' +
          '<div class="d-flex justify-content-between"><div>' +
          '<p class="timeline-title">' +
          item.title +
          "</p>" +
          '<p class="timeline-sub">' +
          item.sub +
          "</p></div><div>" +
          '<p class="timeline-date">' +
          item.date +
          "</p>" +
          '<p class="timeline-time">' +
          item.time +
          "</p></div></div></div>"
        );
      })
      .join("") +
    "</div>";
}

/* ── Objectives ────────────────────────────────────── */
function renderObjectives() {
  document.getElementById("sec-objectives").innerHTML =
    '<h2 class="card-title-gp"><span class="material-symbols-outlined title-ico">flag</span>Season Objectives</h2>' +
    DATA.objectives
      .map(function (obj) {
        var barStyle = obj.barColor
          ? 'style="width:' + obj.pct + "%;background:" + obj.barColor + '"'
          : 'class="progress-bar-gp ' +
            obj.barClass +
            '" style="width:' +
            obj.pct +
            '%"';
        return (
          '<div class="mb-3">' +
          '<div class="d-flex justify-content-between align-items-center mb-2">' +
          '<span style="font-size:12px;font-weight:700;color:var(--text-1)">' +
          obj.name +
          "</span>" +
          '<span class="badge-gp ' +
          obj.badgeClass +
          '">' +
          obj.badge +
          "</span></div>" +
          '<div class="progress-gp"><div ' +
          barStyle +
          "></div></div>" +
          '<p class="mt-1 mb-0" style="font-size:10px;color:var(--text-2)">' +
          obj.note +
          "</p></div>"
        );
      })
      .join("");
}

/* ── Chart wrapper ─────────────────────────────────── */
function renderChartWrap(
  containerId,
  titleIcon,
  title,
  badgeText,
  badgeClass,
  canvasId,
  containerClass,
) {
  document.getElementById(containerId).innerHTML =
    '<h2 class="card-title-gp"><span class="title-icon"><span class="material-symbols-outlined">' +
    titleIcon +
    "</span></span>" +
    title +
    "</h2>" +
    '<div class="chart-badge ' +
    badgeClass +
    '">' +
    badgeText +
    "</div>" +
    '<div class="' +
    (containerClass || "chart-container") +
    '"><canvas id="' +
    canvasId +
    '"></canvas></div>';
}

/* ── Goal Timing Section ───────────────────────────── */
function renderGoalTimingSection() {
  document.getElementById("sec-goal-timing").innerHTML =
    '<div class="d-flex align-items-center justify-content-between mb-3">' +
    '<h2 class="card-title-gp mb-0"><span class="title-icon"><span class="material-symbols-outlined">timer</span></span>Goal Scoring Times</h2>' +
    '<span class="badge-gp badge-orange"><span class="material-symbols-outlined" style="font-size:13px">local_fire_department</span>Most deadly 61–75 min</span></div>' +
    '<div class="chart-container-tall"><canvas id="goalTimingChart"></canvas></div>';
}

/* ── Player of the Week ────────────────────────────── */
function renderPOTW() {
  var p = DATA.potw;
  document.getElementById("sec-potw").innerHTML =
    '<div class="potw-card-v2">' +
    '<div class="potw-bg-ring"></div><div class="potw-bg-ring2"></div>' +
    '<div class="row g-0 h-100" style="position:relative;z-index:2">' +
    '<div class="col-12 col-md-4 potw-left">' +
    '<div class="potw-crown"><span class="material-symbols-outlined">grade</span></div>' +
    '<div class="potw-label-v2">⚡ Player of the Week</div>' +
    '<div class="potw-avatar-wrap"><img class="potw-avatar-v2" src="' +
    p.avatar +
    '" alt="' +
    p.name +
    '" />' +
    '<div class="potw-score-ring">' +
    p.score +
    "</div></div>" +
    '<div class="potw-name-v2">' +
    p.name +
    "</div>" +
    '<div class="potw-pos-badge">' +
    p.position +
    "</div>" +
    '<div class="potw-nationality">' +
    p.nationality +
    "</div></div>" +
    '<div class="col-12 col-md-8 potw-right">' +
    '<div class="potw-right-header d-flex justify-content-between align-items-center mb-3">' +
    '<span class="potw-right-title">' +
    p.matchLabel +
    "</span>" +
    '<span class="potw-match-date">' +
    p.matchDate +
    "</span></div>" +
    '<div class="row g-2 mb-3">' +
    p.stats
      .map(function (st) {
        return (
          '<div class="col-4"><div class="potw-stat-box ' +
          st.cls +
          '">' +
          '<div class="potw-sb-val">' +
          st.val +
          "</div>" +
          '<div class="potw-sb-label">' +
          st.label +
          "</div></div></div>"
        );
      })
      .join("") +
    "</div>" +
    '<div class="potw-attrs">' +
    p.attrs
      .map(function (a) {
        return (
          '<div class="potw-attr-row">' +
          '<span class="potw-attr-label">' +
          a.label +
          "</span>" +
          '<div class="progress-gp flex-grow-1 mx-2"><div class="progress-bar-gp" style="width:' +
          a.pct +
          "%;background:" +
          a.color +
          '"></div></div>' +
          '<span class="potw-attr-val">' +
          a.val +
          "</span></div>"
        );
      })
      .join("") +
    "</div></div></div></div>";
}

/* ── Top Scorers & Minutes sections ────────────────── */
function renderScorersSection() {
  var top = DATA.topScorers[0];
  document.getElementById("sec-scorers").innerHTML =
    '<div class="d-flex align-items-center justify-content-between mb-1">' +
    '<h2 class="card-title-gp mb-0"><span class="title-icon"><span class="material-symbols-outlined">leaderboard</span></span>Top Scorers</h2>' +
    '<span class="badge-gp badge-red">All Comps</span></div>' +
    '<div class="chart-badge red mb-2">' +
    top.name +
    " leads · " +
    top.goals +
    "G all competitions</div>" +
    '<div class="chart-container" style="height:260px"><canvas id="topScorersChart"></canvas></div>';
}

function renderMinutesSection() {
  document.getElementById("sec-minutes").innerHTML =
    '<div class="d-flex align-items-center justify-content-between mb-1">' +
    '<h2 class="card-title-gp mb-0"><span class="title-icon"><span class="material-symbols-outlined">avg_pace</span></span>Player Minutes Played</h2>' +
    '<span class="badge-gp badge-blue">PL · 35 Games</span></div>' +
    '<div class="chart-badge blue mb-2">Raya & Rice — every minute available</div>' +
    '<div class="chart-container" style="height:260px"><canvas id="minutesPlayedChart"></canvas></div>';
}

/* ── League Tables ─────────────────────────────────── */
function renderLTHeader() {
  return (
    '<div class="lt-head-row">' +
    '<span class="lt-pos">#</span>' +
    '<span class="lt-bar"></span>' +
    '<span class="lt-club">Club</span>' +
    '<span class="lt-num">P</span>' +
    '<span class="lt-num">W</span>' +
    '<span class="lt-num">D</span>' +
    '<span class="lt-num">L</span>' +
    '<span class="lt-num">GF</span>' +
    '<span class="lt-num">GA</span>' +
    '<span class="lt-num">GD</span>' +
    '<span class="lt-num lt-pts-hdr">Pts</span></div>'
  );
}

function renderLTRow(r) {
  var gdCls =
    r.gd.charAt(0) === "+"
      ? "lt-gd-pos"
      : r.gd.charAt(0) === "-"
        ? "lt-gd-neg"
        : "lt-gd-neu";
  return (
    '<div class="lt-row' +
    (r.hl ? " lt-row-hl" : "") +
    (r.rel ? " lt-row-relzone" : "") +
    '">' +
    '<span class="lt-pos">' +
    r.pos +
    "</span>" +
    '<span class="lt-bar" style="background:' +
    r.bar +
    '"></span>' +
    '<span class="lt-club"><span class="lt-badge ' +
    r.badge +
    '"></span>' +
    r.name +
    "</span>" +
    '<span class="lt-num">' +
    r.p +
    "</span>" +
    '<span class="lt-num">' +
    r.w +
    "</span>" +
    '<span class="lt-num">' +
    r.d +
    "</span>" +
    '<span class="lt-num">' +
    r.l +
    "</span>" +
    '<span class="lt-num">' +
    r.gf +
    "</span>" +
    '<span class="lt-num">' +
    r.ga +
    "</span>" +
    '<span class="lt-num ' +
    gdCls +
    '">' +
    r.gd +
    "</span>" +
    '<span class="lt-num lt-pts">' +
    r.pts +
    "</span></div>"
  );
}

function renderPLTable() {
  document.getElementById("sec-pl-table").innerHTML =
    '<div class="league-table-card pl">' +
    '<span class="material-symbols-outlined bg-icon">trophy</span>' +
    '<div class="d-flex justify-content-between align-items-center mb-2">' +
    '<h3 class="lt-title"><span class="league-table-icon"><span class="material-symbols-outlined" style="font-size:15px">leaderboard</span></span>Premier League 2025/26</h3>' +
    '<span class="league-matchday">' +
    DATA.plMatchday +
    "</span></div>" +
    '<div class="lt-legend">' +
    '<span class="lt-legend-dot" style="background:#4ade80"></span><span>UCL</span>' +
    '<span class="lt-legend-dot" style="background:#fb923c;margin-left:10px"></span><span>UEL</span>' +
    '<span class="lt-legend-dot" style="background:#f87171;margin-left:10px"></span><span>Relegation</span></div>' +
    renderLTHeader() +
    DATA.plTable.map(renderLTRow).join("") +
    '<div class="lt-source">' +
    DATA.plSource +
    "</div>" +
    '<button class="view-more-btn">View Full 20-Team Table</button></div>';
}

function renderUCLTable() {
  document.getElementById("sec-ucl-table").innerHTML =
    '<div class="league-table-card ucl">' +
    '<span class="material-symbols-outlined bg-icon">star_half</span>' +
    '<div class="d-flex justify-content-between align-items-center mb-2">' +
    '<h3 class="lt-title"><span class="league-table-icon"><span class="material-symbols-outlined" style="font-size:15px">stars</span></span>Champions League 2025/26</h3>' +
    '<span class="league-matchday">' +
    DATA.uclMatchday +
    "</span></div>" +
    '<div class="ucl-banner">' +
    DATA.uclBanner +
    "</div>" +
    renderLTHeader() +
    DATA.uclTable.map(renderLTRow).join("") +
    '<div class="ucl-r16-header">Semi-Finals · Arsenal fixture</div>' +
    DATA.uclFixtures
      .map(function (f) {
        return (
          '<div class="ucl-fixture">' +
          '<div class="ucl-fix-team"><span class="lt-badge ' +
          f.left +
          ' ucl-fix-badge"></span><span>' +
          f.leftName +
          "</span></div>" +
          '<div class="ucl-fix-center"><div class="ucl-fix-leg">' +
          f.leg +
          "</div>" +
          '<div class="ucl-fix-date">' +
          f.date +
          (f.result ? " · " + f.result : "") +
          "</div></div>" +
          '<div class="ucl-fix-team ucl-fix-right"><span>' +
          f.rightName +
          '</span><span class="lt-badge ' +
          f.right +
          ' ucl-fix-badge"></span></div></div>'
        );
      })
      .join("") +
    '<div class="lt-source">' +
    DATA.uclSource +
    "</div>" +
    '<button class="view-more-btn">Full SF Draw & Bracket</button></div>';
}

/* ═══════════════════════════════════════════════════════════════════════════
   §8  CHART INITIALIZERS
═══════════════════════════════════════════════════════════════════════════ */

/* Chart 1 — Team Performance (monthly W/D/L) */
function initPerformanceChart() {
  var canvas = document.getElementById("performanceChart");
  if (!canvas) return;
  if (performanceChartInst) performanceChartInst.destroy();
  var theme = document.documentElement.getAttribute("data-theme") || "light";
  var c = getThemeColors(theme);
  var d = DATA.charts.performance;
  performanceChartInst = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: d.labels,
      datasets: [
        {
          label: "Wins",
          data: d.wins,
          backgroundColor: "#22c55e",
          borderRadius: 6,
          barThickness: 16,
        },
        {
          label: "Draws",
          data: d.draws,
          backgroundColor: "#94a3b8",
          borderRadius: 6,
          barThickness: 16,
        },
        {
          label: "Losses",
          data: d.losses,
          backgroundColor: "#ec0024",
          borderRadius: 6,
          barThickness: 16,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 10, weight: "700", family: "Inter" },
            boxWidth: 10,
            padding: 10,
            color: c.tick,
          },
        },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false, color: c.grid },
          ticks: { font: { size: 10, family: "Inter" }, color: c.tick },
        },
        y: {
          stacked: true,
          grid: { color: c.grid },
          ticks: {
            font: { size: 10, family: "Inter" },
            stepSize: 2,
            color: c.tick,
          },
        },
      },
    },
  });
}

/* Chart 2 — Goals vs xG */
function initXgChart() {
  var canvas = document.getElementById("xgChart");
  if (!canvas) return;
  if (xgChartInst) xgChartInst.destroy();
  var theme = document.documentElement.getAttribute("data-theme") || "light";
  var c = getThemeColors(theme);
  var d = DATA.charts.xg;
  xgChartInst = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: d.labels,
      datasets: [
        {
          label: "Actual Goals",
          data: d.goals,
          backgroundColor: "#ec0024",
          borderRadius: 6,
          barThickness: 14,
          order: 2,
        },
        {
          label: "Expected Goals (xG)",
          data: d.xg,
          type: "line",
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245,158,11,0.08)",
          borderWidth: 2,
          borderDash: [5, 3],
          pointBackgroundColor: "#f59e0b",
          pointRadius: 4,
          fill: false,
          tension: 0.4,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 10, weight: "700", family: "Inter" },
            boxWidth: 10,
            padding: 10,
            color: c.tick,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false, color: c.grid },
          ticks: { font: { size: 10, family: "Inter" }, color: c.tick },
        },
        y: {
          grid: { color: c.grid },
          ticks: { font: { size: 10, family: "Inter" }, color: c.tick },
          beginAtZero: true,
        },
      },
    },
  });
}

/* Chart 3 — Possession & Pass Accuracy */
function initControlChart() {
  var canvas = document.getElementById("controlChart");
  if (!canvas) return;
  if (controlChartInst) controlChartInst.destroy();
  var theme = document.documentElement.getAttribute("data-theme") || "light";
  var c = getThemeColors(theme);
  var d = DATA.charts.control;
  controlChartInst = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: d.labels,
      datasets: [
        {
          label: "Possession %",
          data: d.possession,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.08)",
          borderWidth: 2.5,
          pointBackgroundColor: "#3b82f6",
          pointRadius: 5,
          fill: true,
          tension: 0.4,
          yAxisID: "yPoss",
        },
        {
          label: "Pass Accuracy %",
          data: d.passAcc,
          borderColor: "#a855f7",
          backgroundColor: "rgba(168,85,247,0.06)",
          borderWidth: 2.5,
          pointBackgroundColor: "#a855f7",
          pointRadius: 5,
          fill: true,
          tension: 0.4,
          yAxisID: "yPass",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 10, weight: "700", family: "Inter" },
            boxWidth: 10,
            padding: 10,
            color: c.tick,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false, color: c.grid },
          ticks: {
            font: { size: 9, family: "Inter" },
            color: c.tick,
            maxRotation: 30,
          },
        },
        yPoss: {
          type: "linear",
          position: "left",
          min: 45,
          max: 70,
          grid: { color: c.grid },
          ticks: {
            font: { size: 10, family: "Inter" },
            color: "#3b82f6",
            callback: function (v) {
              return v + "%";
            },
          },
        },
        yPass: {
          type: "linear",
          position: "right",
          min: 78,
          max: 96,
          grid: { display: false },
          ticks: {
            font: { size: 10, family: "Inter" },
            color: "#a855f7",
            callback: function (v) {
              return v + "%";
            },
          },
        },
      },
    },
  });
}

/* Chart 4 — Defensive Wall (Clean Sheets) */
function initCleanSheetsChart() {
  var canvas = document.getElementById("cleanSheetsChart");
  if (!canvas) return;
  var theme = document.documentElement.getAttribute("data-theme") || "light";
  var c = getThemeColors(theme);
  var d = DATA.charts.cleanSheets;
  var csRate = d.cs.map(function (cs, i) {
    return Math.round((cs / d.played[i]) * 100);
  });
  window._cleanSheetsInst = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: d.labels,
      datasets: [
        {
          label: "Games Played",
          data: d.played,
          backgroundColor: "rgba(148,163,184,0.15)",
          borderColor: "rgba(148,163,184,0.3)",
          borderWidth: 1,
          borderRadius: 6,
          barThickness: 20,
          order: 2,
        },
        {
          label: "Clean Sheets",
          data: d.cs,
          backgroundColor: d.cs.map(function (cs, i) {
            return cs === d.played[i] ? "#ec0024" : "rgba(236,0,36,0.45)";
          }),
          borderRadius: 6,
          barThickness: 20,
          order: 3,
        },
        {
          label: "CS Rate %",
          data: csRate,
          type: "line",
          borderColor: "#f59e0b",
          backgroundColor: "transparent",
          borderWidth: 2,
          borderDash: [4, 3],
          pointBackgroundColor: csRate.map(function (r) {
            return r === 100 ? "#ec0024" : "#f59e0b";
          }),
          pointRadius: 5,
          fill: false,
          tension: 0.4,
          yAxisID: "yRate",
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 9, weight: "700", family: "Inter" },
            boxWidth: 10,
            padding: 8,
            color: c.tick,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 9, family: "Inter" }, color: c.tick },
        },
        y: {
          grid: { color: c.grid },
          ticks: {
            font: { size: 10, family: "Inter" },
            color: c.tick,
            stepSize: 2,
          },
          beginAtZero: true,
          max: 8,
        },
        yRate: {
          type: "linear",
          position: "right",
          min: 0,
          max: 110,
          grid: { display: false },
          ticks: {
            font: { size: 9, family: "Inter" },
            color: "#f59e0b",
            callback: function (v) {
              return v + "%";
            },
            stepSize: 25,
          },
        },
      },
    },
  });
}

/* Chart 5 — Pressing Intensity (PPDA) */
function initPressingChart() {
  var canvas = document.getElementById("pressingChart");
  if (!canvas) return;
  var theme = document.documentElement.getAttribute("data-theme") || "light";
  var c = getThemeColors(theme);
  var d = DATA.charts.pressing;
  window._pressingInst = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: d.labels,
      datasets: [
        {
          label: "Arsenal PPDA",
          data: d.arsenal,
          borderColor: "#ec0024",
          backgroundColor: "rgba(236,0,36,0.07)",
          borderWidth: 2.5,
          pointBackgroundColor: "#ec0024",
          pointRadius: 5,
          fill: true,
          tension: 0.4,
        },
        {
          label: "PL Avg PPDA",
          data: d.plAvg,
          borderColor: "#94a3b8",
          backgroundColor: "transparent",
          borderWidth: 2,
          borderDash: [5, 4],
          pointRadius: 3,
          pointBackgroundColor: "#94a3b8",
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 10, weight: "700", family: "Inter" },
            boxWidth: 10,
            padding: 10,
            color: c.tick,
          },
        },
        tooltip: {
          callbacks: {
            afterBody: function () {
              return ["Lower = more intense press"];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10, family: "Inter" }, color: c.tick },
        },
        y: {
          reverse: true,
          grid: { color: c.grid },
          ticks: { font: { size: 10, family: "Inter" }, color: c.tick },
          min: 6,
          max: 14,
        },
      },
    },
  });
}

/* Chart 6 — Home vs Away Radar */
function initHomeAwayChart() {
  var canvas = document.getElementById("homeAwayChart");
  if (!canvas) return;
  var theme = document.documentElement.getAttribute("data-theme") || "light";
  var c = getThemeColors(theme);
  var d = DATA.charts.homeAway;
  window._homeAwayInst = new Chart(canvas.getContext("2d"), {
    type: "radar",
    data: {
      labels: d.labels,
      datasets: [
        {
          label: "Home",
          data: d.home,
          borderColor: "#ec0024",
          backgroundColor: "rgba(236,0,36,0.12)",
          borderWidth: 2,
          pointBackgroundColor: "#ec0024",
          pointRadius: 4,
        },
        {
          label: "Away",
          data: d.away,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.1)",
          borderWidth: 2,
          pointBackgroundColor: "#3b82f6",
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 10, weight: "700", family: "Inter" },
            boxWidth: 10,
            padding: 10,
            color: c.tick,
          },
        },
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          grid: { color: c.grid },
          angleLines: { color: c.grid },
          pointLabels: {
            font: { size: 9, family: "Inter", weight: "700" },
            color: c.tick,
          },
          ticks: { display: false },
        },
      },
    },
  });
}

/* Chart 7 — Goal Timing */
function initGoalTimingChart() {
  var canvas = document.getElementById("goalTimingChart");
  if (!canvas) return;
  var theme = document.documentElement.getAttribute("data-theme") || "light";
  var c = getThemeColors(theme);
  var d = DATA.charts.goalTiming;
  var cumulative = d.scored.reduce(function (acc, v, i) {
    acc.push((acc[i - 1] || 0) + v);
    return acc;
  }, []);
  window._goalTimingInst = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: d.labels,
      datasets: [
        {
          label: "Goals Scored",
          data: d.scored,
          backgroundColor: d.scored.map(function (_, i) {
            return i === d.peakIndex ? "#ec0024" : "rgba(236,0,36,0.45)";
          }),
          borderRadius: 6,
          barThickness: 28,
          order: 2,
        },
        {
          label: "Goals Conceded",
          data: d.conceded,
          backgroundColor: "rgba(59,130,246,0.6)",
          borderRadius: 6,
          barThickness: 16,
          order: 3,
        },
        {
          label: "Cumulative Scored",
          data: cumulative,
          type: "line",
          borderColor: "#f59e0b",
          backgroundColor: "transparent",
          borderWidth: 2,
          borderDash: [5, 3],
          pointBackgroundColor: "#f59e0b",
          pointRadius: 4,
          fill: false,
          tension: 0.4,
          yAxisID: "yCumul",
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 10, weight: "700", family: "Inter" },
            boxWidth: 10,
            padding: 12,
            color: c.tick,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10, weight: "600", family: "Inter" },
            color: c.tick,
          },
        },
        y: {
          grid: { color: c.grid },
          ticks: {
            font: { size: 10, family: "Inter" },
            color: c.tick,
            stepSize: 4,
          },
          beginAtZero: true,
        },
        yCumul: {
          type: "linear",
          position: "right",
          grid: { display: false },
          ticks: { font: { size: 10, family: "Inter" }, color: "#f59e0b" },
          beginAtZero: true,
        },
      },
    },
  });
}

/* Chart 8 — Top Scorers */
function initTopScorersChart() {
  var canvas = document.getElementById("topScorersChart");
  if (!canvas) return;
  var theme = document.documentElement.getAttribute("data-theme") || "light";
  var c = getThemeColors(theme);
  window._topScorersInst = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: DATA.topScorers.map(function (p) {
        return p.name;
      }),
      datasets: [
        {
          label: "Goals",
          data: DATA.topScorers.map(function (p) {
            return p.goals;
          }),
          backgroundColor: "#ec0024",
          borderRadius: 5,
          barThickness: 11,
        },
        {
          label: "Assists",
          data: DATA.topScorers.map(function (p) {
            return p.assists;
          }),
          backgroundColor: "rgba(59,130,246,0.7)",
          borderRadius: 5,
          barThickness: 11,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 10, weight: "700", family: "Inter" },
            boxWidth: 10,
            padding: 10,
            color: c.tick,
          },
        },
      },
      scales: {
        x: {
          grid: { color: c.grid },
          ticks: { font: { size: 10, family: "Inter" }, color: c.tick },
          beginAtZero: true,
        },
        y: {
          grid: { display: false },
          ticks: {
            font: { size: 10, weight: "700", family: "Inter" },
            color: c.tick,
          },
        },
      },
    },
  });
}

/* Chart 9 — Minutes Played */
function initMinutesPlayedChart() {
  var canvas = document.getElementById("minutesPlayedChart");
  if (!canvas) return;
  var theme = document.documentElement.getAttribute("data-theme") || "light";
  var c = getThemeColors(theme);
  var maxM = DATA.maxMinutes;
  window._minutesPlayedInst = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: DATA.minutesPlayed.map(function (p) {
        return p.name;
      }),
      datasets: [
        {
          label: "Minutes Played",
          data: DATA.minutesPlayed.map(function (p) {
            return p.mins;
          }),
          backgroundColor: DATA.minutesPlayed.map(function (p) {
            var ratio = p.mins / maxM;
            return ratio >= 0.88
              ? "#ec0024"
              : ratio >= 0.72
                ? "#3b82f6"
                : "#94a3b8";
          }),
          borderRadius: 5,
          barThickness: 13,
        },
        {
          label: "Max Available",
          data: DATA.minutesPlayed.map(function () {
            return maxM;
          }),
          backgroundColor: "rgba(148,163,184,0.1)",
          borderRadius: 5,
          barThickness: 13,
          borderColor: "rgba(148,163,184,0.2)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              if (ctx.datasetIndex === 1) return null;
              var pct = ((ctx.raw / maxM) * 100).toFixed(0);
              return (
                " " +
                ctx.raw.toLocaleString() +
                " min  (" +
                pct +
                "% availability)"
              );
            },
          },
          filter: function (item) {
            return item.datasetIndex === 0;
          },
        },
      },
      scales: {
        x: {
          grid: { color: c.grid },
          ticks: {
            font: { size: 9, family: "Inter" },
            color: c.tick,
            callback: function (v) {
              return v + "'";
            },
          },
          max: 3270,
          beginAtZero: true,
        },
        y: {
          grid: { display: false },
          ticks: {
            font: { size: 10, weight: "700", family: "Inter" },
            color: c.tick,
          },
        },
      },
    },
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   §9  TOAST
═══════════════════════════════════════════════════════════════════════════ */
function showToast(message) {
  document.querySelectorAll(".gp-toast").forEach(function (t) {
    t.remove();
  });
  var toast = document.createElement("div");
  toast.className = "gp-toast";
  toast.style.cssText =
    "position:fixed;bottom:24px;right:24px;z-index:9999;background:#0f172a;color:#fff;padding:12px 20px;border-radius:12px;font-size:12px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.2);border-left:4px solid #ec0024;font-family:'Inter',sans-serif;animation:gpSlideUp 0.3s ease;";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function () {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(function () {
      toast.remove();
    }, 300);
  }, 2500);
}

/* ═══════════════════════════════════════════════════════════════════════════
   §10  INIT
═══════════════════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", function () {
  /* Theme */
  var saved = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(saved);
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);

  /* Mobile sidebar */
  document
    .getElementById("hamburgerBtn")
    .addEventListener("click", openSidebar);
  document.getElementById("mobOverlay").addEventListener("click", closeSidebar);
  document.querySelectorAll(".nav-link-item").forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.innerWidth < 992) closeSidebar();
    });
  });

  /* ── Render all sections ── */
  renderCoach();
  renderSeason();
  renderLastMatch();
  renderNextMatch();
  renderSchedule();
  renderObjectives();

  renderChartWrap(
    "sec-chart-perf",
    "bar_chart",
    "Team Performance",
    "W22 D7 L6 · 1st Place · 73pts",
    "green",
    "performanceChart",
  );
  renderChartWrap(
    "sec-chart-xg",
    "sports_score",
    "Goals vs xG",
    "Elite finishing · overperforming xG",
    "red",
    "xgChart",
  );
  renderChartWrap(
    "sec-chart-control",
    "speed",
    "Control Meter",
    "Avg 57% poss · 88% pass acc",
    "blue",
    "controlChart",
  );
  renderChartWrap(
    "sec-chart-cs",
    "shield",
    "Defensive Wall",
    "16 clean sheets · Best in PL",
    "green",
    "cleanSheetsChart",
  );
  renderChartWrap(
    "sec-chart-press",
    "electric_bolt",
    "Pressing Intensity",
    "PPDA avg 8.0 · Top 3 in PL",
    "red",
    "pressingChart",
  );
  renderChartWrap(
    "sec-chart-ha",
    "home_work",
    "Home vs Away",
    "Emirates fortress — 13W 4D 1L",
    "blue",
    "homeAwayChart",
  );

  renderGoalTimingSection();
  renderPOTW();
  renderScorersSection();
  renderMinutesSection();
  renderPLTable();
  renderUCLTable();

  /* ── Initialize all charts ── */
  initPerformanceChart();
  initXgChart();
  initControlChart();
  initCleanSheetsChart();
  initPressingChart();
  initHomeAwayChart();
  initGoalTimingChart();
  initTopScorersChart();
  initMinutesPlayedChart();

  /* Countdown */
  startCountdown();

  /* Buttons */
  document
    .querySelectorAll(".view-more-btn, .notif-btn")
    .forEach(function (btn) {
      btn.addEventListener("click", function () {
        showToast("Feature coming soon!");
      });
    });

  /* Keyframe */
  var style = document.createElement("style");
  style.textContent =
    "@keyframes gpSlideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }";
  document.head.appendChild(style);
});
