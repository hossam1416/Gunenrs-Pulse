document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  document
    .getElementById("themeToggle")
    ?.addEventListener("click", toggleTheme);
  initSidebar();

  if (!document.getElementById("modal-player-grid")) return;

  const params = new URLSearchParams(window.location.search);
  const session = SessionState.get();
  const drillId = params.get("drillId") || session.activeDrillId || "";

  /* Drill label in header */
  const drillObj = getDrillById(session.activeSectionId, drillId);
  const sub = document.querySelector(".header-subtitle");
  if (sub)
    sub.textContent = `Adding players to: ${drillObj ? drillObj.name : "Drill"}`;

  /* Pre-select players already in this drill */
  const drillPlayerMap = session.drillPlayerMap || {};
  const currentDrillIds = drillPlayerMap[drillId] || [];
  let selectedIds = new Set(currentDrillIds);

  let filterPos = "all";
  let searchQuery = "";

  const grid = document.getElementById("modal-player-grid");
  const searchInput = document.getElementById("player-search");
  const filterBtns = document.querySelectorAll(".pos-filter-btn");
  const selectedLabel = document.getElementById("selected-label");

  /* ── Render ─────────────────────────────────────────────── */
  function renderGrid() {
    const q = searchQuery.toLowerCase().trim();
    const visible = PLAYERS.filter((p) => {
      const matchPos = filterPos === "all" || p.posGroup === filterPos;
      const matchSearch = !q || p.name.toLowerCase().includes(q);
      return matchPos && matchSearch;
    });

    if (!visible.length) {
      grid.innerHTML = `<div class="col-12 text-center py-5 text-secondary">No players found</div>`;
      updateCount();
      return;
    }

    grid.innerHTML = visible
      .map((p) => {
        const sel = selectedIds.has(p.id);
        const fitClass =
          p.fitness >= 90 ? "success" : p.fitness >= 75 ? "warning" : "danger";
        const medClass = medicalBadgeClass(p.medical);
        const posColor =
          { GK: "#7c3aed", DEF: "#2563eb", MID: "#16a34a", FWD: "#EF0107" }[
            p.posGroup
          ] || "#64748b";
        const statLine =
          p.posGroup === "GK"
            ? `${formatMins(p.minutesPlayed)} season`
            : `${p.goals ?? 0}G · ${p.assists ?? 0}A`;

        return `
        <div class="modal-p-card card h-100 position-relative ${sel ? "border-danger" : "border"}"
             style="cursor:pointer;transition:all .15s;${sel ? "background:rgba(236,0,36,.06)" : ""}"
             data-player-card="${p.id}">

          <!-- Check badge -->
          <div class="position-absolute top-0 end-0 m-2">
            <span class="badge rounded-pill ${sel ? "bg-danger" : "bg-secondary bg-opacity-25 text-secondary"}"
                  style="font-size:10px;padding:4px 8px">
              <span class="material-symbols-outlined" style="font-size:12px;vertical-align:-2px">${sel ? "check" : "add"}</span>
            </span>
          </div>

          <div class="card-body p-3 d-flex flex-column gap-2">
            <img src="${escHtml(p.img)}" alt="${escHtml(p.name)}" width="48" height="48"
                 class="rounded-circle object-fit-cover border"
                 onerror="this.style.display='none'"/>

            <div class="fw-bold" style="font-size:13px">${escHtml(p.name)}</div>

            <div class="fw-bold" style="font-size:11px;color:${posColor}">
              ${escHtml(p.pos)} · #${p.number}
            </div>

            <div class="progress" style="height:3px;border-radius:2px">
              <div class="progress-bar bg-${fitClass}" style="width:${p.fitness}%"></div>
            </div>

            <div class="d-flex gap-2 align-items-center">
              <span class="fw-bold text-${fitClass}" style="font-size:10px">${p.fitness}% fit</span>
              <span class="badge bg-${medClass}" style="font-size:9px">${escHtml(p.medical)}</span>
            </div>

            <small class="text-secondary" style="font-size:10px">${statLine}</small>
          </div>
        </div>`;
      })
      .join("");

    grid.querySelectorAll("[data-player-card]").forEach((card) => {
      card.addEventListener("click", () => {
        const id = parseInt(card.dataset.playerCard);
        if (selectedIds.has(id)) selectedIds.delete(id);
        else selectedIds.add(id);
        renderGrid();
      });
    });

    updateCount();
  }

  function updateCount() {
    const n = selectedIds.size;
    selectedLabel.textContent = `${n} player${n !== 1 ? "s" : ""} selected`;
  }

  /* ── Filters ────────────────────────────────────────────── */
  searchInput?.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderGrid();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filterPos = btn.dataset.pos;
      renderGrid();
    });
  });

  /* ── Done / Cancel ─────────────────────────────────────── */
  document.getElementById("done-btn")?.addEventListener("click", () => {
    const latest = SessionState.get();
    const updatedMap = { ...(latest.drillPlayerMap || {}) };
    updatedMap[drillId] = [...selectedIds];
    SessionState.update({
      drillPlayerMap: updatedMap,
      playerIds: [...new Set(Object.values(updatedMap).flat())],
    });
    window.location.href = "/train/";
  });

  document.getElementById("cancel-btn")?.addEventListener("click", () => {
    window.location.href = "/train/";
  });

  renderGrid();
});
