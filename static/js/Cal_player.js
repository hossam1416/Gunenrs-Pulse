"use strict";

/* ================================================================
   PLAYER CALENDAR JS — Loaded from Django/Admin JSON
   Source: window.PLAYER_CALENDAR_DATA
================================================================ */

var PLAYER_CALENDAR_DATA = window.PLAYER_CALENDAR_DATA || {};

const EVENTS_KEY = "gp_cal_events";
const THEME_KEY = "gp_theme";

const TYPE_CONFIG = PLAYER_CALENDAR_DATA.typeConfig || {
  match: {
    label: "Match",
    icon: "sports_soccer",
    badge: "MATCH DAY",
    short: "MATCH",
  },
  training: {
    label: "Training",
    icon: "fitness_center",
    badge: "TRAINING",
    short: "TRAINING",
  },
  set: {
    label: "Day off",
    icon: "strategy",
    badge: "DAY OFF",
    short: "DAY OFF",
  },
  recovery: {
    label: "Recovery",
    icon: "self_improvement",
    badge: "RECOVERY",
    short: "RECOVERY",
  },
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");

function loadEvents() {
  if (Array.isArray(PLAYER_CALENDAR_DATA.events)) {
    return PLAYER_CALENDAR_DATA.events;
  }

  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY)) || [];
  } catch {
    return [];
  }
}

function isoDate(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

function formatDisplayDate(iso) {
  const d = new Date(iso + "T00:00:00");

  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(THEME_KEY, t);

  const icon = $("themeIcon");
  if (icon) {
    icon.textContent = t === "dark" ? "light_mode" : "dark_mode";
  }

  const logo = $("siteLogo");
  if (logo) {
    logo.src =
      t === "dark"
        ? "/static/images/dark_gun_p.jpg"
        : "/static/images/white_gun_p.jpg";
  }
}

function initTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) || "dark");

  $("themeToggle")?.addEventListener("click", () => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "light";

    applyTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

function initSidebar() {
  const btn = $("hamburgerBtn");
  const sidebar = $("sidebar");
  const overlay = $("mobOverlay");

  if (!btn || !sidebar || !overlay) {
    return;
  }

  btn.addEventListener("click", () => {
    sidebar.classList.toggle("mob-open");
    overlay.classList.toggle("active");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("mob-open");
    overlay.classList.remove("active");
  });
}

function openPanel(evt) {
  const cfg = TYPE_CONFIG[evt.type] || TYPE_CONFIG.training;

  $("panelBadge").textContent = cfg.badge;
  $("panelBadge").className = `event-panel-badge panel-badge-${evt.type}`;
  $("panelTitle").textContent = evt.title;
  $("panelDate").textContent = formatDisplayDate(evt.date);
  $("panelTime").textContent = evt.time || "–";
  $("panelVenueText").textContent = evt.venue || "Not specified";
  $("panelNotes").textContent = evt.notes || "No notes added.";

  $("eventPanel").classList.add("open");
}

function initPanel() {
  const panel = $("eventPanel");

  if (!panel || !$("closePanel")) {
    return;
  }

  $("closePanel").addEventListener("click", () => {
    panel.classList.remove("open");
  });
}

let curYear;
let curMonth;

function buildEventCard(e) {
  const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.training;

  if (e.type === "match") {
    return `
      <div class="fc-event-card fc-match" data-id="${e.id}">
        <span class="fc-event-icon material-symbols-outlined">sports_soccer</span>
        <div class="fc-event-info">
          <div class="fc-event-label">MATCH</div>
          <div class="fc-event-sub">${e.time || ""}</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="fc-event-card fc-${e.type}" data-id="${e.id}">
      <span class="fc-event-icon material-symbols-outlined">${cfg.icon}</span>
      <div class="fc-event-label">${cfg.short}</div>
    </div>
  `;
}

function renderMonthView() {
  const grid = $("calGrid");
  const label = $("monthLabel");

  if (!grid || !label) {
    return;
  }

  const today = new Date();

  label.textContent = `${MONTHS[curMonth]} ${curYear}`;

  const firstDay = new Date(curYear, curMonth, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const prevDays = new Date(curYear, curMonth, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const events = loadEvents();

  let html = "";

  for (let i = 0; i < totalCells; i++) {
    let day;
    let month;
    let year;
    let isOther = false;

    if (i < startOffset) {
      day = prevDays - startOffset + i + 1;
      month = curMonth - 1;
      year = curYear;

      if (month < 0) {
        month = 11;
        year--;
      }

      isOther = true;
    } else if (i >= startOffset + daysInMonth) {
      day = i - startOffset - daysInMonth + 1;
      month = curMonth + 1;
      year = curYear;

      if (month > 11) {
        month = 0;
        year++;
      }

      isOther = true;
    } else {
      day = i - startOffset + 1;
      month = curMonth;
      year = curYear;
    }

    const iso = isoDate(year, month + 1, day);

    const isToday =
      !isOther &&
      day === today.getDate() &&
      curMonth === today.getMonth() &&
      curYear === today.getFullYear();

    const dayEvents = isOther ? [] : events.filter((e) => e.date === iso);

    dayEvents.sort((a, b) =>
      a.type === "match" ? -1 : b.type === "match" ? 1 : 0,
    );

    const shown = dayEvents.slice(0, 3);
    const extra = dayEvents.length - 3;
    const hasMatch = dayEvents.some((e) => e.type === "match");

    let cards = shown.map((e) => buildEventCard(e)).join("");

    if (extra > 0) {
      cards += `<div class="fc-more">+${extra}</div>`;
    }

    html += `
      <div class="cal-cell${isOther ? " other-month" : ""}${isToday ? " today" : ""}${hasMatch ? " has-match" : ""}" data-date="${iso}">
        <div class="cell-num">${day}</div>
        ${cards}
      </div>
    `;
  }

  grid.innerHTML = html;

  grid.querySelectorAll(".fc-event-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.stopPropagation();

      const evt = loadEvents().find((event) => event.id === card.dataset.id);

      if (evt) {
        openPanel(evt);
      }
    });
  });
}

function initMonthNav() {
  const today = new Date();

  curYear = today.getFullYear();
  curMonth = today.getMonth();

  $("prevMonth")?.addEventListener("click", () => {
    curMonth--;

    if (curMonth < 0) {
      curMonth = 11;
      curYear--;
    }

    renderMonthView();
  });

  $("nextMonth")?.addEventListener("click", () => {
    curMonth++;

    if (curMonth > 11) {
      curMonth = 0;
      curYear++;
    }

    renderMonthView();
  });

  $("todayBtn")?.addEventListener("click", () => {
    curYear = today.getFullYear();
    curMonth = today.getMonth();

    renderMonthView();
  });

  renderMonthView();
}

function renderAgendaView() {
  const list = $("agendaList");

  if (!list) {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayIso = isoDate(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  );

  const events = loadEvents()
    .filter((e) => new Date(e.date + "T00:00:00") >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.time || "").localeCompare(b.time || ""),
    );

  if (events.length === 0) {
    list.innerHTML = `
      <div class="agenda-empty">
        <span class="material-symbols-outlined">calendar_today</span>
        No upcoming events in the next 90 days.
      </div>
    `;
    return;
  }

  const byMonth = {};

  events.forEach((e) => {
    const [y, m] = e.date.split("-");
    const monthKey = `${y}-${m}`;

    if (!byMonth[monthKey]) {
      byMonth[monthKey] = {};
    }

    if (!byMonth[monthKey][e.date]) {
      byMonth[monthKey][e.date] = [];
    }

    byMonth[monthKey][e.date].push(e);
  });

  let html = "";

  for (const [monthKey, days] of Object.entries(byMonth)) {
    const [year, month] = monthKey.split("-").map(Number);
    const totalInMonth = Object.values(days).flat().length;

    html += `
      <div class="agenda-month-section">
        <div class="agenda-month-header">
          <div class="agenda-month-title">${MONTHS[month - 1]} ${year}</div>
          <div class="agenda-month-line"></div>
          <div class="agenda-month-count">
            ${totalInMonth} event${totalInMonth !== 1 ? "s" : ""}
          </div>
        </div>
    `;

    for (const [date, eventsOfDay] of Object.entries(days)) {
      const isToday = date === todayIso;
      const d = new Date(date + "T00:00:00");
      const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
      const dayName = DAYS_SHORT[dayIndex];

      html += `
        <div class="agenda-date-group${isToday ? " today-group" : ""}">
          <div class="agenda-date-col">
            <div class="agenda-date-day">${d.getDate()}</div>
            <div class="agenda-date-dow">${dayName}</div>
          </div>
          <div class="agenda-events-col">
      `;

      eventsOfDay.forEach((e) => {
        const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.training;

        html += `
          <div class="agenda-event-card ${e.type}" data-id="${e.id}">
            <div class="agenda-card-stripe"></div>

            <div class="agenda-card-icon">
              <span class="material-symbols-outlined">${cfg.icon}</span>
            </div>

            <div class="agenda-card-body">
              <div class="agenda-card-type">${cfg.label}</div>
              <div class="agenda-card-title">${e.title}</div>

              <div class="agenda-card-meta">
                ${
                  e.venue
                    ? `<span class="agenda-meta-item">
                        <span class="material-symbols-outlined">location_on</span>
                        ${e.venue}
                      </span>`
                    : ""
                }
              </div>
            </div>

            <div class="agenda-card-time">
              <div class="agenda-time-badge">${e.time || "–"}</div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    html += `</div>`;
  }

  list.innerHTML = html;

  list.querySelectorAll(".agenda-event-card").forEach((card) => {
    card.addEventListener("click", () => {
      const evt = loadEvents().find((e) => e.id === card.dataset.id);

      if (evt) {
        openPanel(evt);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initSidebar();
  initPanel();

  if ($("calGrid")) {
    initMonthNav();
  } else if ($("agendaList")) {
    renderAgendaView();
  }
});
