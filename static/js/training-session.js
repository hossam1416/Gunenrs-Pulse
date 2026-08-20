/* ═══════════════════════════════════════════════════════════
   training-session.js  — Session page logic
   Depends on: training-data.js
═══════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  document
    .getElementById("themeToggle")
    ?.addEventListener("click", toggleTheme);
  initSidebar();

  if (!document.getElementById("section-tabs")) return;

  /* ── State ─────────────────────────────────────────────── */
  let currentSection =
    getSectionById(SessionState.get().activeSectionId) || SECTIONS[0];
  let currentDrill =
    getDrillById(currentSection.id, SessionState.get().activeDrillId) ||
    currentSection.drills[0];

  const drillPlayerMap = buildDrillPlayerMap(SessionState.get().drillPlayerMap);

  function buildDrillPlayerMap(raw) {
    const map = new Map();
    if (!raw || typeof raw !== "object") return map;
    for (const [drillId, ids] of Object.entries(raw)) {
      map.set(
        drillId,
        (ids || []).map((id) => getPlayerById(id)).filter(Boolean),
      );
    }
    return map;
  }

  function serializeDrillPlayerMap() {
    const obj = {};
    for (const [drillId, players] of drillPlayerMap.entries()) {
      obj[drillId] = players.map((p) => p.id);
    }
    return obj;
  }

  function getDrillPlayers() {
    return drillPlayerMap.get(currentDrill.id) || [];
  }
  function setDrillPlayers(list) {
    drillPlayerMap.set(currentDrill.id, list);
  }

  function save() {
    SessionState.update({
      activeSectionId: currentSection.id,
      activeDrillId: currentDrill.id,
      drillPlayerMap: serializeDrillPlayerMap(),
      playerIds: [
        ...new Set([...drillPlayerMap.values()].flat().map((p) => p.id)),
      ],
    });
  }

  /* ── DOM refs ───────────────────────────────────────────── */
  const tabsEl = document.getElementById("section-tabs");
  const heroTagsEl = document.getElementById("hero-tags");
  const heroTitleEl = document.getElementById("hero-title");
  const heroDescEl = document.getElementById("hero-desc");
  const carouselEl = document.getElementById("drill-carousel");
  const playerListEl = document.getElementById("player-list");
  const playerCountEl = document.getElementById("player-count");

  /* ── Mobile Squad Panel Toggle ─────────────────────────── */
  function initMobileSquadToggle() {
    const playerPanel = document.querySelector(".player-panel");
    const bottomBarContent = document.querySelector(".bottom-bar-content");
    if (!playerPanel || !bottomBarContent) return;

    const overlay = document.createElement("div");
    overlay.className = "squad-overlay";
    document.body.appendChild(overlay);

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "mobile-squad-toggle";
    toggleBtn.innerHTML = `<span class="material-symbols-outlined">group</span>Squad`;

    const metaRow = bottomBarContent.querySelector(
      ".d-flex.align-items-center.justify-content-between.mb-3",
    );
    if (metaRow) {
      const saveBtn = metaRow.querySelector(".save-btn");
      if (saveBtn) metaRow.insertBefore(toggleBtn, saveBtn);
      else metaRow.appendChild(toggleBtn);
    }

    const openSquad = () => {
      playerPanel.classList.add("mobile-open");
      overlay.classList.add("active");
    };
    const closeSquad = () => {
      playerPanel.classList.remove("mobile-open");
      overlay.classList.remove("active");
    };

    toggleBtn.addEventListener("click", openSquad);
    overlay.addEventListener("click", closeSquad);

    let touchStartY = 0;
    playerPanel.addEventListener("touchstart", (e) => {
      touchStartY = e.touches[0].clientY;
    });
    playerPanel.addEventListener("touchend", (e) => {
      const diff = e.changedTouches[0].clientY - touchStartY;
      if (diff > 60) closeSquad();
    });
  }

  initMobileSquadToggle();

  /* ── Section Tabs ───────────────────────────────────────── */
  function renderTabs() {
    tabsEl.innerHTML = SECTIONS.map(
      (s) => `
      <button class="nav-link ${s.id === currentSection.id ? "active" : ""} s-tab" data-sec="${s.id}">
        <span class="material-symbols-outlined me-1" style="font-size:14px;vertical-align:-3px">${s.icon}</span>
        ${s.name}
      </button>`,
    ).join("");

    tabsEl.querySelectorAll("[data-sec]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentSection = getSectionById(btn.dataset.sec);
        currentDrill = currentSection.drills[0];
        save();
        renderAll();
      });
    });
  }

  /* ── Hero Area ──────────────────────────────────────────── */
  function renderHero() {
    const iBadge = intensityBadgeClass(currentDrill.intensity);
    heroTagsEl.innerHTML = `
      <span class="badge bg-secondary me-1">${escHtml(currentSection.name)}</span>
      <span class="badge bg-danger me-1">${escHtml(currentDrill.focusLabel)}</span>
      <span class="badge bg-${iBadge} me-1">${escHtml(currentDrill.intensity)}</span>
      <span class="badge bg-primary">${currentDrill.duration} min</span>`;
    heroTitleEl.textContent = currentDrill.name;
    heroDescEl.textContent = currentDrill.description;
  }

  /* ── Drill Carousel ─────────────────────────────────────── */
  function renderCarousel() {
    carouselEl.innerHTML = currentSection.drills
      .map((d) => {
        const active = d.id === currentDrill.id;
        const iBadge = intensityBadgeClass(d.intensity);
        const attrPills = (d.attrs || [])
          .slice(0, 3)
          .map(
            (a) =>
              `<span class="badge bg-secondary bg-opacity-50 me-1" style="font-size:9px">${escHtml(a)}</span>`,
          )
          .join("");

        /* ★ Completion count from player responses ★ */
        const assigned = drillPlayerMap.get(d.id) || [];
        const doneCount = assigned.filter(
          (p) => PlayerResponses.get(d.id, p.id)?.status === "completed",
        ).length;
        const completionBadge =
          doneCount > 0
            ? `<span class="d-flex align-items-center gap-0" style="font-size:9px;font-weight:700;color:#22c55e" title="${doneCount}/${assigned.length} completed"><span class="material-symbols-outlined" style="font-size:13px">check_circle</span>${doneCount}</span>`
            : "";

        return `
        <div class="d-card card border-2 ${active ? "border-danger text-danger" : "border-0"} flex-shrink-0"
             style="min-width:200px;cursor:pointer;background:var(--drill-bg)"
             data-drill="${d.id}">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="fw-bold text-uppercase" style="font-size:11px;letter-spacing:.04em;color:var(--drill-name)">${escHtml(d.shortName)}</span>
              <div class="d-flex align-items-center gap-1">
                ${completionBadge}
                <span class="badge bg-${iBadge}" style="font-size:9px">${escHtml(d.intensity)}</span>
              </div>
            </div>
            <div>${attrPills}</div>
          </div>
        </div>`;
      })
      .join("");

    carouselEl.querySelectorAll("[data-drill]").forEach((card) => {
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        const drillId = card.dataset.drill;
        const found = getDrillById(currentSection.id, drillId);
        if (!found) return;
        currentDrill = found;
        save();
        renderAll();
        setTimeout(
          () => card.scrollIntoView({ behavior: "smooth", inline: "center" }),
          50,
        );
      });
    });

    const active = carouselEl.querySelector(".border-danger");
    if (active)
      setTimeout(
        () => active.scrollIntoView({ behavior: "smooth", inline: "center" }),
        80,
      );
  }

  /* ── Player Panel ───────────────────────────────────────── */
  function renderPlayers() {
    const players = getDrillPlayers();
    playerCountEl.textContent = `${players.length}/17`;

    if (!players.length) {
      playerListEl.innerHTML = `
        <div class="text-center py-4 text-secondary">
          <span class="material-symbols-outlined d-block mb-2" style="font-size:32px;opacity:.3">person_off</span>
          <small class="text-uppercase fw-bold" style="letter-spacing:.08em;font-size:10px">No players assigned to this drill</small>
        </div>`;
      return;
    }

    playerListEl.innerHTML = players
      .map((p) => {
        const fitPct = p.fitness;
        const fitClass =
          fitPct >= 90 ? "success" : fitPct >= 75 ? "warning" : "danger";
        const medClass = medicalBadgeClass(p.medical);

        /* ★ Status dot from player responses ★ */
        const isDone =
          PlayerResponses.get(currentDrill.id, p.id)?.status === "completed";
        const dotClass = isDone ? "done" : "upcoming";
        const dotTitle = isDone ? "Completed" : "Pending";

        return `
        <div class="p-card card border-0 mb-2 p-2" style="background:var(--pcrd-bg)">
          <div class="d-flex align-items-center gap-2">
            <img src="${escHtml(p.img)}" alt="${escHtml(p.name)}" width="38" height="38"
                 class="rounded-circle object-fit-cover border flex-shrink-0"
                 onerror="this.style.opacity='0'"/>
            <div class="flex-grow-1 min-w-0">
              <div class="d-flex align-items-center gap-2">
                <span class="status-dot ${dotClass}" title="${dotTitle}"></span>
                <div class="fw-bold" style="font-size:13px">${escHtml(p.short)}</div>
              </div>
              <div class="text-uppercase fw-bold" style="font-size:10px;color:var(--text-3)">${escHtml(p.pos)} · #${p.number}</div>
            </div>
            <button class="btn btn-link p-0 text-secondary p-card-remove" data-id="${p.id}" title="Remove">
              <span class="material-symbols-outlined" style="font-size:16px">close</span>
            </button>
          </div>
          <div class="mt-2 d-flex align-items-center gap-2">
            <div class="flex-grow-1">
              <div class="progress" style="height:4px;border-radius:2px">
                <div class="progress-bar bg-${fitClass}" style="width:${fitPct}%"></div>
              </div>
            </div>
            <small class="fw-bold text-${fitClass}" style="font-size:10px">${fitPct}%</small>
            <span class="badge bg-${medClass}" style="font-size:9px">${escHtml(p.medical)}</span>
          </div>
          <div class="mt-1">
            <small class="text-secondary" style="font-size:10px">${formatMins(p.minutesPlayed)} this season</small>
          </div>
        </div>`;
      })
      .join("");

    playerListEl.querySelectorAll(".p-card-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        setDrillPlayers(
          getDrillPlayers().filter((p) => p.id !== parseInt(btn.dataset.id)),
        );
        save();
        renderPlayers();
      });
    });
  }

  /* ── Meta (date / duration) ─────────────────────────────── */
  function renderMeta() {
    const s = SessionState.get();
    let dateStr = "—";
    try {
      dateStr = new Date(s.date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {}
    const durStr = `${s.duration} Min Session`;

    const elDateBar = document.getElementById("meta-date-bar");
    const elDurBar = document.getElementById("meta-dur-bar");
    if (elDateBar) elDateBar.textContent = dateStr;
    if (elDurBar) elDurBar.textContent = durStr;
  }

  /* ── Edit Session Modal ─────────────────────────────────── */
  document.getElementById("openEditModal")?.addEventListener("click", () => {
    const s = SessionState.get();
    document.getElementById("modalDate").value = s.date;
    document.getElementById("modalTime").value = s.startTime;
    document.getElementById("modalDuration").value = s.duration;
    new bootstrap.Modal(document.getElementById("editModal")).show();
  });

  document.getElementById("saveSessionBtn")?.addEventListener("click", () => {
    SessionState.update({
      date: document.getElementById("modalDate").value,
      startTime: document.getElementById("modalTime").value,
      duration: parseInt(document.getElementById("modalDuration").value),
    });
    PublishedSession.save(SessionState.get());
    /* ★ Also push to history ★ */
    TrainingHistory.saveFromState();
    renderMeta();
    bootstrap.Modal.getInstance(document.getElementById("editModal"))?.hide();
  });

  /* ── Video Overlay ─────────────────────────────────────── */
  const videoOverlay = document.getElementById("videoOverlay");
  const videoIframe = document.getElementById("videoIframe");

  document.getElementById("watchVideoBtn")?.addEventListener("click", () => {
    if (!currentDrill.video) return;
    document.getElementById("videoOverlayTitle").textContent =
      currentDrill.name;
    videoIframe.src = currentDrill.video + "?autoplay=1&rel=0";
    videoOverlay.classList.add("open");
  });

  const closeVideo = () => {
    videoIframe.src = "";
    videoOverlay.classList.remove("open");
  };
  document
    .getElementById("closeVideoBtn")
    ?.addEventListener("click", closeVideo);
  videoOverlay?.addEventListener("click", (e) => {
    if (e.target === videoOverlay) closeVideo();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && videoOverlay?.classList.contains("open"))
      closeVideo();
  });

  /* ── Save Session ───────────────────────────────────────── */
  document
    .getElementById("saveSessionDirectBtn")
    ?.addEventListener("click", () => {
      save();
      PublishedSession.save(SessionState.get());

      /* ★ Push snapshot to training history ★ */
      TrainingHistory.saveFromState();

      const btn = document.getElementById("saveSessionDirectBtn");
      const orig = btn.innerHTML;
      btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px">check_circle</span> Saved!`;
      btn.classList.add("text-success");
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.remove("text-success");
      }, 2000);
    });

  /* ── Add Player Button ─────────────────────────────────── */
  document.getElementById("addPlayerBtn")?.addEventListener("click", () => {
    save();
    window.location.href = `/train/add-players/?drillId=${encodeURIComponent(currentDrill.id)}`;
  });

  function renderAll() {
    renderTabs();
    renderHero();
    renderCarousel();
    renderPlayers();
    renderMeta();
  }

  renderAll();

  /* ★ Auto-refresh when a player completes a drill ★ */
  window.addEventListener("storage", (e) => {
    if (e.key === "gp_player_responses") {
      renderPlayers();
      renderCarousel();
    }
  });
});
