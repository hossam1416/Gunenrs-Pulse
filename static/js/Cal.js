/* ═══════════════════════════════════════════════
   Cal.js — Gunners Pulse | Calendar Logic
   Pages: Cal-1.html Month · Cal-add.html Agenda
═══════════════════════════════════════════════ */
"use strict";

const THEME_KEY = "gp_theme";

const TYPE_CONFIG = {
  match: {
    label: "Match",
    short: "MATCH",
    badge: "MATCH",
    icon: "sports_soccer",
  },
  training: {
    label: "Training",
    short: "TRAIN",
    badge: "TRAINING",
    icon: "fitness_center",
  },
  set: {
    label: "day off",
    short: "DAY OFF",
    badge: "DAY OFF",
    icon: "sports",
  },
  recovery: {
    label: "Recovery",
    short: "REC",
    badge: "RECOVERY",
    icon: "healing",
  },
};

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");

function loadEvents() {
  if (Array.isArray(window.CALENDAR_EVENTS)) {
    return window.CALENDAR_EVENTS;
  }
  return [];
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

const PAGE = (() => {
  const p = location.pathname;
  if (p.includes("/agenda")) return "agenda";
  return "month";
})();

/* ─── DARK MODE ─── */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);

  const icon = $("themeIcon");
  if (icon) {
    icon.textContent = theme === "dark" ? "light_mode" : "dark_mode";
  }

  const logo = $("siteLogo");
  if (logo) {
    logo.src =
      theme === "dark"
        ? "/static/images/dark_gun.jpg"
        : "/static/images/white_gun.jpg";
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
}

function initTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) || "dark");

  const btn = $("themeToggle");
  if (btn) {
    btn.addEventListener("click", toggleTheme);
  }
}

/* ─── SIDEBAR ─── */
function initSidebar() {
  const btn = $("hamburgerBtn");
  const sidebar = $("sidebar");
  const overlay = $("mobOverlay");

  if (!btn || !sidebar || !overlay) return;

  btn.addEventListener("click", () => {
    sidebar.classList.toggle("mob-open");
    overlay.classList.toggle("active");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("mob-open");
    overlay.classList.remove("active");
  });
}

/* ─── EVENT PANEL ─── */
let panelEventId = null;
let panelEvent = null;

function openPanel(evt) {
  panelEventId = evt.id;
  panelEvent = evt;

  const cfg = TYPE_CONFIG[evt.type] || TYPE_CONFIG.training;

  const panelBadge = $("panelBadge");
  const panelTitle = $("panelTitle");
  const panelDate = $("panelDate");
  const panelTime = $("panelTime");
  const panelVenueText = $("panelVenueText");
  const panelNotes = $("panelNotes");
  const eventPanel = $("eventPanel");

  if (panelBadge) {
    panelBadge.textContent = cfg.badge;
    panelBadge.className = `event-panel-badge panel-badge-${evt.type}`;
  }

  if (panelTitle) panelTitle.textContent = evt.title || "Untitled Event";
  if (panelDate) panelDate.textContent = formatDisplayDate(evt.date);
  if (panelTime) panelTime.textContent = evt.time || "–";
  if (panelVenueText) panelVenueText.textContent = evt.venue || "Not specified";
  if (panelNotes) panelNotes.textContent = evt.notes || "No notes added.";

  if (eventPanel) {
    eventPanel.classList.add("open");
  }
}

function initPanel() {
  const panel = $("eventPanel");
  const closeBtn = $("closePanel");
  const editBtn = $("panelEditBtn");
  const deleteBtn = $("panelDeleteBtn");

  if (!panel) return;

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      panel.classList.remove("open");
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      if (!panelEventId) return;

      const confirmDelete = confirm("Delete this event?");
      if (!confirmDelete) return;

      window.location.href = `/calendar/delete/${panelEventId}/`;
    });
  }

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      if (!panelEventId || !panelEvent) return;

      const form = document.querySelector("#addEventModal form");
      const modalEl = $("addEventModal");
      if (!form || !modalEl) return;

      form.action = `/calendar/update/${panelEventId}/`;
      const title = $("newTitle");
      const type = $("newType");
      const date = $("newDate");
      const time = $("newTime");
      const venue = $("newVenue");
      const notes = $("newNotes");
      const submit = $("saveEventBtn");

      if (title) title.value = panelEvent.title || "";
      if (type) type.value = panelEvent.type || "training";
      if (date) date.value = panelEvent.date || "";
      if (time) time.value = panelEvent.time || "10:00";
      if (venue) venue.value = panelEvent.venue || "";
      if (notes) notes.value = panelEvent.notes || "";
      if (submit)
        submit.innerHTML =
          '<span class="material-symbols-outlined">save</span> Save Changes';

      try {
        new bootstrap.Modal(modalEl).show();
      } catch {}
    });
  }
}

/* ─── ADD MODAL ─── */
function initAddModal() {
  const openBtn = $("openAddModal");
  const modalEl = $("addEventModal");

  if (!openBtn || !modalEl) return;

  let modal;

  try {
    modal = new bootstrap.Modal(modalEl);
  } catch {
    return;
  }

  openBtn.addEventListener("click", () => {
    const form = document.querySelector("#addEventModal form");
    if (form) form.action = "/calendar/add/";

    const submit = $("saveEventBtn");
    if (submit)
      submit.innerHTML =
        '<span class="material-symbols-outlined">save</span> Create Event';

    const today = new Date();
    const dateInput = $("newDate");

    if (dateInput && !dateInput.value) {
      dateInput.value = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(
        today.getDate(),
      )}`;
    }

    modal.show();
  });
}

/* ─── MONTH VIEW ─── */
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

  if (!grid || !label) return;

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

    dayEvents.sort((a, b) => {
      if (a.type === "match") return -1;
      if (b.type === "match") return 1;
      return (a.time || "").localeCompare(b.time || "");
    });

    const shown = dayEvents.slice(0, 3);
    const extra = dayEvents.length - 3;
    const hasMatch = dayEvents.some((e) => e.type === "match");

    let cards = shown.map((e) => buildEventCard(e)).join("");

    if (extra > 0) {
      cards += `<div class="fc-more">+${extra}</div>`;
    }

    html += `
      <div class="cal-cell${isOther ? " other-month" : ""}${isToday ? " today" : ""}${
        hasMatch ? " has-match" : ""
      }" data-date="${iso}">
        <div class="cell-num">${day}</div>
        ${cards}
      </div>
    `;
  }

  grid.innerHTML = html;

  grid.querySelectorAll(".fc-event-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      event.stopPropagation();

      const evt = loadEvents().find(
        (e) => String(e.id) === String(card.dataset.id),
      );

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

  const prev = $("prevMonth");
  const next = $("nextMonth");
  const todayBtn = $("todayBtn");

  if (prev) {
    prev.addEventListener("click", () => {
      curMonth--;

      if (curMonth < 0) {
        curMonth = 11;
        curYear--;
      }

      renderMonthView();
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      curMonth++;

      if (curMonth > 11) {
        curMonth = 0;
        curYear++;
      }

      renderMonthView();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener("click", () => {
      curYear = today.getFullYear();
      curMonth = today.getMonth();
      renderMonthView();
    });
  }

  renderMonthView();
}

/* ─── AGENDA VIEW ─── */
function renderAgendaView() {
  const list = $("agendaList");

  if (!list) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayIso = isoDate(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  );

  const events = loadEvents()
    .filter((e) => new Date(e.date + "T00:00:00") >= today)
    .sort((a, b) => {
      return (
        a.date.localeCompare(b.date) ||
        (a.time || "").localeCompare(b.time || "")
      );
    });

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
    const [year, month] = e.date.split("-");
    const monthKey = `${year}-${month}`;

    if (!byMonth[monthKey]) byMonth[monthKey] = {};
    if (!byMonth[monthKey][e.date]) byMonth[monthKey][e.date] = [];

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

    for (const [date, dayEvents] of Object.entries(days)) {
      const isToday = date === todayIso;
      const d = new Date(date + "T00:00:00");
      const dowIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
      const dow = DAYS_SHORT[dowIndex];

      html += `
        <div class="agenda-date-group${isToday ? " today-group" : ""}">
          <div class="agenda-date-col">
            <div class="agenda-date-day">${d.getDate()}</div>
            <div class="agenda-date-dow">${dow}</div>
          </div>
          <div class="agenda-events-col">
      `;

      dayEvents.forEach((e) => {
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
      const evt = loadEvents().find(
        (e) => String(e.id) === String(card.dataset.id),
      );

      if (evt) {
        openPanel(evt);
      }
    });
  });
}

/* ─── ROUTER ─── */
function renderCurrentView() {
  if (PAGE === "month") {
    renderMonthView();
  }

  if (PAGE === "agenda") {
    renderAgendaView();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initSidebar();
  initPanel();
  initAddModal();

  if (PAGE === "month") {
    initMonthNav();
  }

  if (PAGE === "agenda") {
    renderAgendaView();
  }
});
