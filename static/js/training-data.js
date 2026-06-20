/* ─────────────────────────────────────────
   GUNNERS PULSE — TRAINING DATA BRIDGE
   Data source: Django Database → template json_script
───────────────────────────────────────── */

const TRAINING_DATA = JSON.parse(
  document.getElementById("training-data-json").textContent
);

const PLAYERS = TRAINING_DATA.players || [];
const SECTIONS = TRAINING_DATA.sections || [];

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function getSectionById(id) {
  return SECTIONS.find((s) => s.id === id) || null;
}

function getDrillById(secId, dId) {
  const section = getSectionById(secId);
  return section ? section.drills.find((d) => d.id === dId) || null : null;
}

function getPlayerById(id) {
  return PLAYERS.find((p) => p.id === Number(id) || p.id === id) || null;
}

function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function intensityBadgeClass(intensity) {
  const value = (intensity || "").toLowerCase();

  if (value === "hard") return "danger";
  if (value === "med" || value === "medium") return "warning";
  if (value === "easy" || value === "reg") return "success";

  return "secondary";
}

function medicalBadgeClass(medical) {
  switch ((medical || "").toLowerCase()) {
    case "fit":
      return "success";
    case "injured":
      return "danger";
    default:
      return "warning";
  }
}

function formatMins(mins) {
  mins = Number(mins || 0);

  if (mins >= 1000) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  return `${mins}m`;
}

/* ─────────────────────────────────────────
   SESSION STATE
   Coach page uses sessionStorage while building session.
───────────────────────────────────────── */
const SessionState = {
  KEY: "gp_training_session",

  default() {
    const firstSection = SECTIONS[0] || null;
    const firstDrill = firstSection?.drills?.[0] || null;

    return {
      activeSectionId: firstSection?.id || "passing",
      activeDrillId: firstDrill?.id || "p1",
      playerIds: [],
      drillPlayerMap: {},
      date: new Date().toISOString().slice(0, 10),
      startTime: "10:00",
      duration: 60,
    };
  },

  get() {
    try {
      const raw = sessionStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : this.default();
    } catch {
      return this.default();
    }
  },

  set(data) {
    sessionStorage.setItem(this.KEY, JSON.stringify(data));
  },

  update(patch) {
    this.set({ ...this.get(), ...patch });
  },

  clear() {
    sessionStorage.removeItem(this.KEY);
  },
};

/* ─────────────────────────────────────────
   PUBLISHED SESSION
   Now the real source is Django DB.
   localStorage remains only as frontend fallback.
───────────────────────────────────────── */
const PublishedSession = {
  KEY: "gp_published_session",

  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  get() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) return JSON.parse(raw);
    } catch {}

    return TRAINING_DATA.publishedSession || null;
  },

  clear() {
    localStorage.removeItem(this.KEY);
  },
};

/* ─────────────────────────────────────────
   PLAYER RESPONSES
   Temporary localStorage bridge.
   Later we can move it to Django DB if needed.
───────────────────────────────────────── */
const PlayerResponses = {
  KEY: "gp_player_responses",

  getAll() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  get(drillId, playerId) {
    return this.getAll()[`${drillId}_${playerId}`] || null;
  },

  save(drillId, playerId, data) {
    const all = this.getAll();

    all[`${drillId}_${playerId}`] = {
      ...data,
      drillId,
      playerId,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(this.KEY, JSON.stringify(all));
  },

  getByDrill(drillId) {
    return Object.values(this.getAll()).filter((item) => item.drillId === drillId);
  },

  getByPlayer(playerId) {
    return Object.values(this.getAll()).filter((item) => Number(item.playerId) === Number(playerId));
  },

  clear() {
    localStorage.removeItem(this.KEY);
  },
};

/* ─────────────────────────────────────────
   TRAINING HISTORY
   Coach save snapshots.
───────────────────────────────────────── */
const TrainingHistory = {
  KEY: "gp_training_history",
  MAX_ENTRIES: 50,

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  save(record) {
    const history = this.load();

    history.unshift(record);

    if (history.length > this.MAX_ENTRIES) {
      history.splice(this.MAX_ENTRIES);
    }

    localStorage.setItem(this.KEY, JSON.stringify(history));
    return record;
  },

  saveFromState() {
    const state = SessionState.get();
    const drillPlayerMap = state.drillPlayerMap || {};

    const drills = [];
    const sectionSet = new Set();

    for (const [drillId, playerIds] of Object.entries(drillPlayerMap)) {
      if (!playerIds || playerIds.length === 0) continue;

      let foundDrill = null;
      let foundSection = null;

      for (const section of SECTIONS) {
        const drill = section.drills.find((d) => d.id === drillId);

        if (drill) {
          foundDrill = drill;
          foundSection = section;
          break;
        }
      }

      if (!foundDrill || !foundSection) continue;

      sectionSet.add(foundSection.name);

      drills.push({
        id: foundDrill.id,
        name: foundDrill.name,
        shortName: foundDrill.shortName,
        focusLabel: foundDrill.focusLabel,
        intensity: foundDrill.intensity,
        duration: foundDrill.duration,
        attrs: foundDrill.attrs || [],
        description: foundDrill.description || "",
        sectionId: foundSection.id,
        sectionName: foundSection.name,
      });
    }

    const record = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      savedAt: new Date().toISOString(),
      date: state.date || new Date().toISOString().slice(0, 10),
      startTime: state.startTime || "10:00",
      duration: state.duration || 60,
      drills,
      sections: [...sectionSet],
      playerIds: state.playerIds || [],
      drillPlayerMap,
    };

    return this.save(record);
  },

  clear() {
    localStorage.removeItem(this.KEY);
  },
};

/* ─────────────────────────────────────────
   THEME
───────────────────────────────────────── */
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
    logo.src =
      theme === "dark"
        ? "/static/images/dark gun.jpg"
        : "/static/images/white gun.jpg";
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
}

function initTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) || "light");
}

/* ─────────────────────────────────────────
   SIDEBAR MOBILE
───────────────────────────────────────── */
function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const hamburger = document.getElementById("hamburgerBtn");
  const overlay = document.getElementById("mobOverlay");

  if (!sidebar) return;

  hamburger?.addEventListener("click", () => {
    sidebar.classList.add("mob-open");
    overlay?.classList.add("active");
  });

  overlay?.addEventListener("click", () => {
    sidebar.classList.remove("mob-open");
    overlay?.classList.remove("active");
  });
}
