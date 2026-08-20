/* ═══════════════════════════════════════════
       TRAINING HISTORY — Page Logic
    ═══════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  document
    .getElementById("themeToggle")
    ?.addEventListener("click", toggleTheme);
  initSidebar();

  /* ── Storage helpers ── */
  const HISTORY_KEY = "gp_training_history";

  function loadHistory() {
    try {
      const r = localStorage.getItem(HISTORY_KEY);
      return r ? JSON.parse(r) : [];
    } catch {
      return [];
    }
  }
  function saveHistory(arr) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
  }
  function deleteSession(id) {
    saveHistory(loadHistory().filter((s) => s.id !== id));
  }
  function clearAll() {
    localStorage.removeItem(HISTORY_KEY);
  }

  /* ── State ── */
  let allSessions = loadHistory();
  let activeId = null;
  let filter = "all";
  let searchQ = "";

  /* ── Filters ── */
  function matchesFilter(sess) {
    const d = new Date(sess.savedAt);
    const now = new Date();
    if (filter === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      if (d < weekAgo) return false;
    }
    if (filter === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      if (d < monthAgo) return false;
    }
    if (searchQ) {
      const q = searchQ.toLowerCase();
      const dateStr = formatDate(sess.date).toLowerCase();
      const sectionNames = (sess.sections || []).join(" ").toLowerCase();
      if (!dateStr.includes(q) && !sectionNames.includes(q)) return false;
    }
    return true;
  }

  /* ── Format helpers ── */
  function formatDate(isoDate) {
    try {
      return new Date(isoDate + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoDate || "—";
    }
  }
  function formatSavedAt(iso) {
    try {
      return new Date(iso).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  }

  /* ── Render list ── */
  function renderList() {
    allSessions = loadHistory();
    const visible = allSessions.filter(matchesFilter);
    // Sort newest first
    visible.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    const listEl = document.getElementById("historyList");
    const countEl = document.getElementById("session-count-badge");
    countEl.textContent = `${visible.length} session${visible.length !== 1 ? "s" : ""}`;

    if (!visible.length) {
      listEl.innerHTML = `
            <div class="history-empty">
              <span class="material-symbols-outlined empty-icon">history_toggle_off</span>
              <p>No sessions found</p>
              <small>Save a training session from the Session page to see it here.</small>
            </div>`;
      return;
    }

    listEl.innerHTML = visible
      .map((sess) => {
        const sectionBadges = (sess.sections || [])
          .map((n) => `<span class="sess-section-badge">${escHtml(n)}</span>`)
          .join("");
        const isActive = sess.id === activeId;
        return `
            <div class="sess-card ${isActive ? "active" : ""}" data-id="${sess.id}">
              <button class="delete-sess-btn" data-del="${sess.id}" title="Delete session">
                <span class="material-symbols-outlined">close</span>
              </button>
              <div class="sess-card-date">${escHtml(formatDate(sess.date))}</div>
              <div class="sess-card-title">Training · ${escHtml(sess.startTime || "—")}</div>
              <div class="sess-card-meta">
                <span class="sess-meta-chip">
                  <span class="material-symbols-outlined">schedule</span>${sess.duration || "—"} Min
                </span>
                <span class="sess-meta-chip">
                  <span class="material-symbols-outlined">fitness_center</span>${(sess.drills || []).length} Drills
                </span>
                <span class="sess-meta-chip">
                  <span class="material-symbols-outlined">group</span>${(sess.playerIds || []).length} Players
                </span>
              </div>
              <div class="sess-card-sections">${sectionBadges}</div>
            </div>`;
      })
      .join("");

    /* Click to view */
    listEl.querySelectorAll(".sess-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".delete-sess-btn")) return;
        activeId = card.dataset.id;
        renderList();
        renderDetail(activeId);
        // Mobile: show detail panel
        document.getElementById("detailPanel").classList.add("mobile-show");
      });
    });

    /* Delete */
    listEl.querySelectorAll(".delete-sess-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteSession(btn.dataset.del);
        if (activeId === btn.dataset.del) {
          activeId = null;
          showPlaceholder();
        }
        renderList();
      });
    });
  }

  /* ── Render detail ── */
  function showPlaceholder() {
    document.getElementById("detailPlaceholder").style.display = "flex";
    document.getElementById("detailContent").style.display = "none";
  }
  function renderDetail(id) {
    const sess = loadHistory().find((s) => s.id === id);
    if (!sess) {
      showPlaceholder();
      return;
    }

    document.getElementById("detailPlaceholder").style.display = "none";
    const contentEl = document.getElementById("detailContent");
    contentEl.style.display = "flex";

    /* Hero */
    document.getElementById("detailDate").textContent =
      `Session saved ${formatSavedAt(sess.savedAt)}`;
    document.getElementById("detailTitle").textContent =
      `${formatDate(sess.date)}`;

    const totalPlayers = (sess.playerIds || []).length;
    const totalDrills = (sess.drills || []).length;
    const totalSections = (sess.sections || []).length;
    document.getElementById("detailStatsRow").innerHTML = `
          <div class="detail-stat">
            <div class="detail-stat-val">${sess.duration || "—"}<span style="font-size:14px;font-weight:600"> min</span></div>
            <div class="detail-stat-lbl">Duration</div>
          </div>
          <div class="detail-stat-divider"></div>
          <div class="detail-stat">
            <div class="detail-stat-val">${sess.startTime || "—"}</div>
            <div class="detail-stat-lbl">Start Time</div>
          </div>
          <div class="detail-stat-divider"></div>
          <div class="detail-stat">
            <div class="detail-stat-val">${totalDrills}</div>
            <div class="detail-stat-lbl">Drills</div>
          </div>
          <div class="detail-stat-divider"></div>
          <div class="detail-stat">
            <div class="detail-stat-val">${totalPlayers}</div>
            <div class="detail-stat-lbl">Players</div>
          </div>
          <div class="detail-stat-divider"></div>
          <div class="detail-stat">
            <div class="detail-stat-val">${totalSections}</div>
            <div class="detail-stat-lbl">Sections</div>
          </div>`;

    /* Body: stats strip + drills grouped by section */
    const drillMap = sess.drills || [];
    const playerMap = sess.drillPlayerMap || {};

    // Group by section
    const grouped = {};
    drillMap.forEach((d) => {
      const secName = d.sectionName || "General";
      if (!grouped[secName]) grouped[secName] = [];
      grouped[secName].push(d);
    });

    // Stat tiles
    const uniqueSections = Object.keys(grouped);
    const statsHtml = `
          <div class="stats-strip">
            <div class="stat-tile">
              <span class="material-symbols-outlined">fitness_center</span>
              <div class="stat-tile-val">${totalDrills}</div>
              <div class="stat-tile-lbl">Total Drills</div>
            </div>
            <div class="stat-tile">
              <span class="material-symbols-outlined">group</span>
              <div class="stat-tile-val">${totalPlayers}</div>
              <div class="stat-tile-lbl">Squad Size</div>
            </div>
            <div class="stat-tile">
              <span class="material-symbols-outlined">category</span>
              <div class="stat-tile-val">${uniqueSections.length}</div>
              <div class="stat-tile-lbl">Sections</div>
            </div>
          </div>`;

    // Drills grouped
    let drillsHtml = "";
    let drillIndex = 0;
    for (const [secName, drills] of Object.entries(grouped)) {
      // Find section icon
      const sec = SECTIONS.find((s) => s.name === secName);
      const icon = sec ? sec.icon : "fitness_center";

      drillsHtml += `
            <div class="detail-section-header">
              <span class="material-symbols-outlined detail-section-icon">${icon}</span>
              <span class="detail-section-label">${escHtml(secName)}</span>
              <div class="detail-section-line"></div>
            </div>`;

      drills.forEach((d) => {
        drillIndex++;
        const delay = `${(drillIndex - 1) * 40}ms`;
        const iBadge = intensityBadgeClass(d.intensity);
        const assignedIds = playerMap[d.id] || [];
        const assignedPlayers = assignedIds
          .map((id) => getPlayerById(id))
          .filter(Boolean);

        const playerChipsHtml = assignedPlayers.length
          ? assignedPlayers
              .map(
                (p) => `
                  <div class="hist-player-chip">
                    <img src="${escHtml(p.img)}" alt="${escHtml(p.short)}"
                         onerror="this.style.display='none'" />
                    ${escHtml(p.short)}
                    <span class="pos-tag">${escHtml(p.pos)}</span>
                  </div>`,
              )
              .join("")
          : `<span style="font-size:10px;color:var(--text-3);font-style:italic">No players assigned</span>`;

        const attrPills = (d.attrs || [])
          .map(
            (a) =>
              `<span class="badge bg-secondary bg-opacity-50" style="font-size:9px">${escHtml(a)}</span>`,
          )
          .join(" ");

        drillsHtml += `
              <div class="drill-row" style="animation-delay:${delay}">
                <div class="drill-row-num">${drillIndex}</div>
                <div class="drill-row-content">
                  <div class="drill-row-name">${escHtml(d.name)}</div>
                  <div class="drill-row-meta">
                    <span class="badge bg-danger" style="font-size:9px">${escHtml(d.focusLabel || "—")}</span>
                    <span class="badge bg-${iBadge}" style="font-size:9px">${escHtml(d.intensity || "—")}</span>
                    <span class="badge bg-primary" style="font-size:9px">${d.duration || "—"} min</span>
                    ${attrPills}
                  </div>
                  <div style="font-size:12px;color:var(--text-2);margin-bottom:8px;line-height:1.5">${escHtml(d.description || "")}</div>
                  <div class="drill-row-players">${playerChipsHtml}</div>
                </div>
              </div>`;
      });
    }

    document.getElementById("detailBody").innerHTML = statsHtml + drillsHtml;
  }

  /* ── Controls ── */
  document.getElementById("historySearch").addEventListener("input", (e) => {
    searchQ = e.target.value;
    renderList();
  });

  document.querySelectorAll(".hist-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".hist-filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filter = btn.dataset.filter;
      renderList();
    });
  });

  document.getElementById("clearAllBtn").addEventListener("click", () => {
    if (confirm("Clear all training history? This cannot be undone.")) {
      clearAll();
      activeId = null;
      showPlaceholder();
      renderList();
    }
  });

  document.getElementById("backToListBtn")?.addEventListener("click", () => {
    document.getElementById("detailPanel").classList.remove("mobile-show");
  });

  /* ── Init ── */
  showPlaceholder();
  renderList();

  /* Live update if another tab saves a session */
  window.addEventListener("storage", (e) => {
    if (e.key === HISTORY_KEY) renderList();
  });
});
