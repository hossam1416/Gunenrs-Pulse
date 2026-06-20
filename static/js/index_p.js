"use strict";

// ═══════════════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════════════
const CONFIG = {
  pageTitle: "My Dashboard",
  pageSub: "Gunners Pulse Player Interface",
  logoDarkSrc: "/static/images/dark_gun_p.jpg",
  logoLightSrc: "/static/images/white_gun_p.jpg",
  footerText: "Gunners Pulse High Performance System © 2026",

  nav: [
    {
      icon: "home",
      label: "Home",
      href: "/player-home/",
      active: true,
    },
    {
      icon: "analytics",
      label: "My Performance",
      href: "/player-performance/",
      active: false,
    },
    {
      icon: "strategy",
      label: "Tactics",
      href: "/player-tactics/",
      active: false,
    },
    {
      icon: "fitness_center",
      label: "Training",
      href: "/player-training/",
      active: false,
    },
    {
      icon: "calendar_month",
      label: "Calendar",
      href: "/player-calendar/",
      active: false,
    },
    {
      icon: "settings",
      label: "Settings",
      href: "/admin/",
      active: false,
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

// ═══════════════════════════════════════════════════════════════
//  DATA FROM DJANGO
//  ملاحظة مهمة:
//  لازم يكون في player-index.html قبل استدعاء هذا الملف:
//  window.DATA = {{ player_dashboard_json|safe }};
// ═══════════════════════════════════════════════════════════════
const DATA = window.DATA || {};

// ═══════════════════════════════════════════════════════════════
//  THEME
// ═══════════════════════════════════════════════════════════════
const THEME_KEY = "gp_theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);

  const icon = document.getElementById("themeIcon");
  if (icon) {
    icon.textContent = theme === "dark" ? "light_mode" : "dark_mode";
  }

  const logo = document.getElementById("siteLogo");
  if (logo) {
    logo.src = theme === "dark" ? CONFIG.logoDarkSrc : CONFIG.logoLightSrc;
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  applyTheme(currentTheme === "dark" ? "light" : "dark");
}

// ═══════════════════════════════════════════════════════════════
//  MOBILE SIDEBAR
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
const $ = (id) => document.getElementById(id);

const set = (id, val) => {
  const el = $(id);
  if (el) {
    el.textContent = val ?? "";
  }
};

const setHTML = (id, html) => {
  const el = $(id);
  if (el) {
    el.innerHTML = html ?? "";
  }
};

const setStyle = (id, property, value) => {
  const el = $(id);
  if (el) {
    el.style[property] = value;
  }
};

function initials(name) {
  if (!name) return "";

  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function formDots(form) {
  if (!Array.isArray(form)) return "";

  return form
    .map((result) => {
      return `<span class="form-dot ${String(result).toLowerCase()}">${result}</span>`;
    })
    .join("");
}

function intensityDots(level) {
  let html = "";

  for (let i = 0; i < 5; i++) {
    html += `<span class="sched-intensity-dot${i < level ? " filled" : ""}"></span>`;
  }

  return html;
}

function hasRequiredData() {
  if (!DATA || Object.keys(DATA).length === 0) {
    console.error("Player dashboard data is missing. Check window.DATA in player-index.html.");
    return false;
  }

  if (!DATA.player) {
    console.error("DATA.player is missing.");
    return false;
  }

  if (!DATA.season) {
    console.error("DATA.season is missing.");
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════
//  COUNTDOWN
// ═══════════════════════════════════════════════════════════════
function startCountdown() {
  if (!DATA.nextMatch || !DATA.nextMatch.kickoffISO) return;

  const target = new Date(DATA.nextMatch.kickoffISO);

  function tick() {
    const el = document.getElementById("countdown-display");
    if (!el) return;

    const diff = target - new Date();

    if (diff <= 0) {
      el.textContent = "KICK OFF!";
      return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    el.textContent = `${String(h).padStart(2, "0")}h : ${String(m).padStart(2, "0")}m : ${String(s).padStart(2, "0")}s`;
  }

  tick();
  setInterval(tick, 1000);
}

// ═══════════════════════════════════════════════════════════════
//  RENDER: SIDEBAR
// ═══════════════════════════════════════════════════════════════
function renderSidebar() {
  const navHTML = (items) => {
    return items
      .map((item) => {
        return `
          <a class="nav-link-item${item.active ? " active" : ""}" href="${item.href}">
            <span class="material-symbols-outlined">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        `;
      })
      .join("");
  };

  setHTML("sidebarNav", navHTML(CONFIG.nav));
  setHTML("sidebarFooter", navHTML(CONFIG.navFooter));
}

// ═══════════════════════════════════════════════════════════════
//  RENDER: HEADER
// ═══════════════════════════════════════════════════════════════
function renderHeader() {
  const p = DATA.player;
  const ini = initials(p.name);

  set("headerTitle", CONFIG.pageTitle);
  set("headerSub", CONFIG.pageSub);

  setHTML(
    "userProfile",
    `
      <div class="user-text">
        <div class="user-name">${p.name}</div>
        <div class="user-role">${p.position} · #${p.number}</div>
      </div>

      <div class="header-avatar-wrap">
        <img
          src="${p.photo}"
          alt="${p.name}"
          class="header-photo"
          onerror="
            this.style.display='none';
            document.getElementById('headerAvatar').style.display='flex';
          "
        />
        <div class="avatar-initials" id="headerAvatar" style="display:none">
          ${ini}
        </div>
      </div>
    `,
  );
}

// ═══════════════════════════════════════════════════════════════
//  RENDER: PROFILE
// ═══════════════════════════════════════════════════════════════
function renderProfile() {
  const p = DATA.player;
  const ini = initials(p.name);

  set("profileNumber", `#${p.number}`);
  set("profileFitStatus", p.fitStatus);
  set("profileName", p.name);
  set("profilePos", `#${p.number} · ${p.position} · ${p.club}`);

  const photo = $("profilePhoto");
  if (photo) {
    photo.src = p.photo;
    photo.alt = p.name;
  }

  const fallback = $("photoFallback");
  if (fallback) {
    fallback.textContent = ini;
  }

  setStyle("readinessBar", "width", `${p.readiness}%`);
  set("readinessVal", `${p.readiness}%`);

  const bio = Array.isArray(p.bio) ? p.bio : [];

  setHTML(
    "bioTable",
    bio
      .map((b) => {
        return `
          <tr>
            <td class="bio-label">${b.label}</td>
            <td class="bio-val">${b.val}</td>
          </tr>
        `;
      })
      .join(""),
  );
}

// ═══════════════════════════════════════════════════════════════
//  RENDER: KPIs
// ═══════════════════════════════════════════════════════════════
function renderKPIs() {
  const season = DATA.season || {};
  const kpis = Array.isArray(season.kpis) ? season.kpis : [];

  set("seasonTag", season.tag || "");

  setHTML(
    "kpiBoxes",
    kpis
      .map((k) => {
        return `
          <div class="col-6 col-sm-4 col-xl-2">
            <div class="sp-kpi-box${k.highlight ? " sp-kpi-highlight" : ""}">
              <div class="sp-kpi-icon" style="background:${k.iconBg};color:${k.iconClr}">
                <span class="material-symbols-outlined">${k.icon}</span>
              </div>
              <div class="sp-kpi-label">${k.label}</div>
              <div class="sp-kpi-val${k.valCls ? " " + k.valCls : ""}">
                ${k.val}
              </div>
              <div class="sp-kpi-sub ${k.subCls}">
                ${k.sub}
              </div>
            </div>
          </div>
        `;
      })
      .join(""),
  );
}

// ═══════════════════════════════════════════════════════════════
//  RENDER: TRAINING TODAY
// ═══════════════════════════════════════════════════════════════
function renderTrainingToday() {
  const t = DATA.trainingToday;
  if (!t) return;

  set("trainingDate", t.date);
  set("trainingSessionType", t.sessionType);
  set("trainingIntensityLabel", `${t.intensity} Intensity`);
  set("trainingLoadPct", `${t.intensityPct}%`);
  setStyle("trainingLoadPct", "color", t.intensityClr);

  const bar = $("trainingLoadBar");
  if (bar) {
    bar.style.width = `${t.intensityPct}%`;
    bar.style.background = t.intensityClr;
  }

  const drills = Array.isArray(t.drills) ? t.drills : [];

  setHTML(
    "trainingDrills",
    drills
      .map((d) => {
        return `
          <div class="training-drill-item">
            <div class="drill-icon" style="background:${d.iconBg};color:${d.iconClr}">
              <span class="material-symbols-outlined">${d.icon}</span>
            </div>

            <div class="flex-fill min-width-0">
              <div class="drill-name">${d.name}</div>
              <div class="drill-meta">${d.meta}</div>
            </div>

            <span class="badge-gp ${d.badgeCls}" style="font-size:8px">
              ${d.badge}
            </span>
          </div>
        `;
      })
      .join(""),
  );
}

// ═══════════════════════════════════════════════════════════════
//  RENDER: LAST MATCH
// ═══════════════════════════════════════════════════════════════
function renderLastMatch() {
  const m = DATA.lastMatch;
  if (!m) return;

  set("lastMatchComp", m.competition);

  [
    ["lmHomeBadge", m.homeTeam],
    ["lmAwayBadge", m.awayTeam],
  ].forEach(([id, team]) => {
    const el = $(id);
    if (!el || !team) return;

    el.style.background = team.bg;
    el.textContent = team.code;
  });

  set("lmHomeName", m.homeTeam?.name || "");
  set("lmAwayName", m.awayTeam?.name || "");
  set("lmScore", m.score);
  set("lmResult", m.result);
  set("lmMinutes", `${m.playerStats?.minutes || 0}' played`);
  set("lmRating", `Rating ${m.playerStats?.rating || ""}`);

  const items = Array.isArray(m.playerStats?.items) ? m.playerStats.items : [];

  setHTML(
    "lastMatchStats",
    items
      .map((s) => {
        return `
          <div class="col-6">
            <div class="d-flex align-items-center gap-2 py-2 border-bottom border-gp">
              <span class="material-symbols-outlined ${s.iconCls}" style="font-size:15px;flex-shrink:0">
                ${s.icon}
              </span>
              <span class="sp-stat-label flex-fill">${s.label}</span>
              <span class="sp-stat-val">${s.val}</span>
            </div>
          </div>
        `;
      })
      .join(""),
  );
}

// ═══════════════════════════════════════════════════════════════
//  RENDER: NEXT MATCH
// ═══════════════════════════════════════════════════════════════
function renderNextMatch() {
  const nx = DATA.nextMatch;
  if (!nx) return;

  set("nmCompetition", nx.competition);
  set("nmCupLabel", nx.cupLabel);
  set("nmVenue", nx.venue);
  set("nmDate", nx.date);
  set("nmKickoff", nx.kickoff);
  set("nmRole", nx.playerRole);
  set("nmCupForm", nx.cupForm);
  set("nmOppName", nx.opponent?.name || "");
  set("nmTeamName", nx.team?.name || "");

  [
    ["nmOppBadge", nx.opponent],
    ["nmTeamBadge", nx.team],
  ].forEach(([id, team]) => {
    const el = $(id);
    if (!el || !team) return;

    el.style.background = team.bg;
    el.innerHTML = `<span class="nm-badge-code">${team.code}</span>`;
  });

  setHTML("nmOppForm", formDots(nx.opponent?.form || []));
  setHTML("nmTeamForm", formDots(nx.team?.form || []));

  const tactics = Array.isArray(nx.tactics) ? nx.tactics : [];

  setHTML(
    "nmTactics",
    tactics
      .map((t) => {
        return `
          <div class="d-flex align-items-start gap-2">
            <span class="nm-scout-tag ${t.tagCls}">${t.tag}</span>
            <span class="nm-scout-text">${t.text}</span>
          </div>
        `;
      })
      .join(""),
  );
}

// ═══════════════════════════════════════════════════════════════
//  RENDER: WEEKLY SCHEDULE
// ═══════════════════════════════════════════════════════════════
function renderSchedule() {
  const weeklySchedule = Array.isArray(DATA.weeklySchedule)
    ? DATA.weeklySchedule
    : [];

  let html = "";

  weeklySchedule.forEach((day) => {
    let colClasses = "sched-day-col";

    if (day.isToday) colClasses += " today";
    if (day.isMatch) colClasses += " match-day";

    html += `
      <div class="${colClasses}">
        <div class="sched-day-header">
          <span class="sched-day-name">${day.day}</span>
          <span class="sched-day-date">${day.date}</span>
        </div>
    `;

    const sessions = Array.isArray(day.sessions) ? day.sessions : [];

    sessions.forEach((sess) => {
      let sessClasses = "sched-session-card";

      if (sess.active) sessClasses += " active-session";
      if (sess.isMatch) sessClasses += " match-session";

      html += `
        <div class="${sessClasses}">
          <div class="sched-session-header">
            <span class="sched-session-name">
              <span class="material-symbols-outlined">${sess.icon}</span>
              ${sess.name}
            </span>
            <span class="sched-session-time">${sess.time}</span>
          </div>

          <div class="sched-session-detail">${sess.detail}</div>

          ${
            sess.intensity > 0
              ? `<div class="sched-intensity-dots">${intensityDots(sess.intensity)}</div>`
              : ""
          }
        </div>
      `;
    });

    html += `</div>`;
  });

  setHTML("scheduleRow", html);
}

// ═══════════════════════════════════════════════════════════════
//  RENDER: OBJECTIVES
// ═══════════════════════════════════════════════════════════════
function renderObjectives() {
  const objectives = Array.isArray(DATA.objectives) ? DATA.objectives : [];
  let html = "";

  objectives.forEach((o) => {
    if (o.type === "progress") {
      html += `
        <div class="obj-item mb-3">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="obj-label d-flex align-items-center gap-2">
              <span class="material-symbols-outlined obj-icon ${o.iconCls}">
                ${o.icon}
              </span>
              ${o.label}
            </span>
          </div>

          <div class="obj-progress-track">
            <div class="progress-gp">
              <div class="progress-bar-gp" style="width:${o.pct}%;background:${o.barBg}"></div>
            </div>
            <span class="obj-pct-val" style="color:${o.barBg}">
              ${o.pct}%
            </span>
          </div>

          <div class="d-flex justify-content-between align-items-center">
            <p class="obj-sub">${o.sub}</p>
            <span class="badge-gp badge-red" style="font-size:8px">
              ${o.current} / ${o.target}
            </span>
          </div>
        </div>
      `;
    } else if (o.type === "rating") {
      html += `
        <div class="obj-item mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="obj-label d-flex align-items-center gap-2">
              <span class="material-symbols-outlined obj-icon ${o.iconCls}">
                ${o.icon}
              </span>
              ${o.label}
            </span>

            <span class="badge-gp ${o.statusCls}" style="font-size:8px">
              ${o.status}
            </span>
          </div>

          <div
            class="d-flex align-items-center gap-3 p-2"
            style="background:var(--bg-muted);border-radius:9px;border:1px solid var(--border)"
          >
            <span class="material-symbols-outlined" style="font-size:28px;color:#16a34a">
              check_circle
            </span>

            <div>
              <div style="font-family:var(--font-d);font-size:22px;font-weight:900;color:var(--text-1);line-height:1">
                ${o.current}
              </div>
              <div style="font-size:9px;color:var(--text-2);font-weight:600">
                Target: 7.50+ · Exceeding by 0.12
              </div>
            </div>
          </div>

          <p class="obj-sub" style="margin-top:6px">${o.sub}</p>
        </div>
      `;
    } else if (o.type === "mission") {
      html += `
        <div class="obj-mission-item">
          <div class="obj-mission-icon">
            <span class="material-symbols-outlined">${o.icon}</span>
          </div>

          <div>
            <div class="obj-mission-text">${o.label}</div>
            <div class="obj-mission-sub">${o.sub}</div>
          </div>
        </div>
      `;
    }
  });

  setHTML("objectivesPanel", html);
}

// ═══════════════════════════════════════════════════════════════
//  RENDER: COACH NOTES
// ═══════════════════════════════════════════════════════════════
function renderCoachNotes() {
  const coachNotes = Array.isArray(DATA.coachNotes) ? DATA.coachNotes : [];

  set("coachNotesBadge", `${coachNotes.length} new this week`);

  setHTML(
    "coachNotes",
    coachNotes
      .map((n) => {
        return `
          <div class="note-item">
            <div class="note-avatar">${n.initials}</div>

            <div class="flex-fill">
              <div class="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
                <p class="note-coach">${n.author}</p>
                <p class="note-date">${n.date}</p>
              </div>

              <p class="note-body">"${n.text}"</p>
            </div>
          </div>
        `;
      })
      .join(""),
  );
}

// ═══════════════════════════════════════════════════════════════
//  RENDER: MILESTONES
// ═══════════════════════════════════════════════════════════════
function renderMilestones() {
  const milestones = Array.isArray(DATA.milestones) ? DATA.milestones : [];

  set("milestonesSeasonTag", DATA.season?.tag || "");

  setHTML(
    "milestonesGrid",
    milestones
      .map((m) => {
        return `
          <div class="col-12 col-sm-6">
            <div class="milestone-item h-100">
              <div class="milestone-icon" style="background:${m.iconBg};color:${m.iconClr}">
                <span class="material-symbols-outlined">${m.icon}</span>
              </div>

              <div class="flex-fill min-width-0">
                <div class="milestone-title">${m.title}</div>
                <div class="milestone-sub">${m.sub}</div>
              </div>

              <span class="badge-gp ${m.badgeCls}" style="font-size:8px;flex-shrink:0">
                ${m.badge}
              </span>
            </div>
          </div>
        `;
      })
      .join(""),
  );
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(localStorage.getItem(THEME_KEY) || "dark");

  const style = document.createElement("style");
  style.textContent =
    "@keyframes gpSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}";
  document.head.appendChild(style);

  renderSidebar();

  $("themeToggle")?.addEventListener("click", toggleTheme);
  $("hamburgerBtn")?.addEventListener("click", openSidebar);
  $("mobOverlay")?.addEventListener("click", closeSidebar);

  document.querySelectorAll(".nav-link-item").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 992) {
        closeSidebar();
      }
    });
  });

  if (!hasRequiredData()) {
    set("headerTitle", CONFIG.pageTitle);
    set("headerSub", "No player dashboard data found. Check JSON and admin data.");
    set("appFooter", CONFIG.footerText);
    return;
  }

  renderHeader();
  renderProfile();
  renderKPIs();
  renderTrainingToday();
  renderLastMatch();
  renderNextMatch();
  renderSchedule();
  renderObjectives();
  renderCoachNotes();
  renderMilestones();

  set("appFooter", CONFIG.footerText);
  startCountdown();
});
