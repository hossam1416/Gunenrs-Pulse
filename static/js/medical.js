"use strict";

const INJURY_META = window.INJURY_META_DATA || {};

// ── Helpers ────────────────────────────────────────────────────────────
function fitnessColor(p) {
  if (p >= 90) return "#10b981";
  if (p >= 70) return "#f59e0b";
  return "#ec0024";
}
function fitnessLabel(p) {
  if (p >= 90) return "Fit";
  if (p >= 70) return "Doubtful";
  return "Injured";
}

// ── Render injured cards ───────────────────────────────────────────────
function renderInjuredCards(query) {
  const grid = document.getElementById("injuredGrid");
  if (!grid) return;

  const injured = PLAYERS.filter((p) => p.medicalType !== "fit");
  const q = (query || "").toLowerCase();

  const filtered = q
    ? injured.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.primary.toLowerCase().includes(q),
      )
    : injured;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-12">
        <div style="padding:32px;text-align:center;color:var(--text-2);font-weight:600;font-size:13px;">
          ${q ? "No injured players match your search." : "No injured players — full squad available! 💪"}
        </div>
      </div>`;
    return;
  }

  grid.innerHTML = filtered
    .map((p) => {
      const m = INJURY_META[p.name] || {
        injury: "Injury",
        grade: "",
        severity: "medium",
        status: "absent",
        statusLabel: "Fully Absent",
        statusClass: "status-absent",
        injuryDate: "—",
        returnDate: "—",
        recovery: p.fitness,
        daysLeft: "?",
        daysClass: "days-normal",
        progClass: "prog-warn",
        cardClass: "",
        badgeClass: "badge-medium",
        badgeLabel: "Medium Severity",
      };

      return `
    <div class="col-12 col-md-6 col-xl-4">
      <div class="inj-card ${m.cardClass}"
        data-id="${p.id}"
        data-player="${p.name}"
        data-injury="${m.injury}"
        data-grade="${m.grade}"
        data-severity="${m.severity}"
        data-status="${m.status}"
        data-img="${p.img}"
        data-pos="${p.pos}"
        data-number="${p.number}"
        data-primary="${p.primary}"
        data-fitness="${p.fitness}"
        data-value="${p.value}"
        data-foot="${p.foot}"
        data-age="${p.age}">

        <div class="d-flex align-items-start justify-content-between mb-4">
          <div class="d-flex align-items-center gap-3">
            <img class="inj-avatar" src="${p.img}" alt="${p.name}" onerror="this.src=''" />
            <div>
              <p class="inj-name">${p.name}</p>
              <p class="inj-pos">${p.pos} • #${p.number}</p>
            </div>
          </div>
          <span class="inj-badge ${m.badgeClass}">${m.badgeLabel}</span>
        </div>

        <div class="row g-3 mb-4">
          <div class="col-6"><p class="inj-lbl">Injury</p><p class="inj-val">${m.injury}${m.grade ? " " + m.grade : ""}</p></div>
          <div class="col-6"><p class="inj-lbl">Status</p><p class="inj-status ${m.statusClass}">● ${m.statusLabel}</p></div>
          <div class="col-6"><p class="inj-lbl">Injury Date</p><p class="inj-val">${m.injuryDate}</p></div>
          <div class="col-6"><p class="inj-lbl">Expected Return</p><p class="inj-val">${m.returnDate}</p></div>
        </div>

        <div class="mb-3">
          <div class="d-flex justify-content-between mb-1">
            <span style="font-size:11px;color:var(--text-2);">Recovery Progress</span>
            <span style="font-size:11px;font-weight:800;color:var(--text-1);">${m.recovery}%</span>
          </div>
          <div class="inj-prog-track"><div class="inj-prog-fill ${m.progClass}" style="width:${m.recovery}%"></div></div>
          <div class="text-end mt-1"><span class="inj-days ${m.daysClass}">${m.daysLeft} days remaining</span></div>
        </div>

        <div class="inj-actions">
          <button class="inj-btn-primary btn-open-update" data-bs-toggle="modal" data-bs-target="#updateModal">
            <span class="material-symbols-outlined" style="font-size:15px;vertical-align:-2px;">edit</span> Update Recovery
          </button>
        </div>
      </div>
    </div>`;
    })
    .join("");

  attachCardListeners();
}

// ── Render squad fitness overview ──────────────────────────────────────
function renderSquadCards(query) {
  const grid = document.getElementById("squadGrid");
  if (!grid) return;
  const q = (query || "").toLowerCase();
  const filtered = q
    ? PLAYERS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.primary.toLowerCase().includes(q),
      )
    : PLAYERS;

  grid.innerHTML = filtered
    .map((p) => {
      const color = fitnessColor(p.fitness);
      const label = fitnessLabel(p.fitness);
      const isInj = p.medicalType !== "fit";
      return `
    <div class="col-6 col-md-4 col-xl-3">
      <div class="squad-card ${isInj ? "squad-card--inj" : ""}"
        data-id="${p.id}" data-player="${p.name}" data-img="${p.img}" data-pos="${p.pos}"
        data-number="${p.number}" data-primary="${p.primary}" data-fitness="${p.fitness}"
        data-value="${p.value}" data-foot="${p.foot}" data-age="${p.age}"
        data-injury="${isInj ? INJURY_META[p.name]?.injury || "Injured" : ""}"
        data-grade="" data-severity="${isInj ? "high" : ""}" data-status="${isInj ? "absent" : "fit"}">
        <div class="d-flex align-items-center gap-2 mb-2">
          <img class="squad-avatar" src="${p.img}" alt="${p.name}" onerror="this.src=''" />
          <div class="min-w-0">
            <p class="squad-name">${p.name}</p>
            <p class="squad-pos">${p.primary} • #${p.number}</p>
          </div>
        </div>
        <div class="squad-prog-track">
          <div class="squad-prog-fill" style="width:${p.fitness}%;background:${color};"></div>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-1">
          <span class="squad-fitness-lbl" style="color:${color};">${label}</span>
          <span class="squad-fitness-val">${p.fitness}%</span>
        </div>
      </div>
    </div>`;
    })
    .join("");

  attachSquadListeners();
}

// ── Stats bar ──────────────────────────────────────────────────────────
function updateStats() {
  const injured = PLAYERS.filter((p) => p.medicalType !== "fit");
  const fit = PLAYERS.filter((p) => p.medicalType === "fit" && p.fitness >= 90);
  const doubtful = PLAYERS.filter((p) => p.medicalType !== "fit" || p.fitness < 90);
  const avgFit = injured.length
    ? Math.round(injured.reduce((s, p) => s + p.fitness, 0) / injured.length)
    : 100;

  const s = (id) => document.getElementById(id);
  if (s("statActiveInjuries"))
    s("statActiveInjuries").textContent = injured.length;
  if (s("statAvgFitness")) s("statAvgFitness").textContent = avgFit + "%";
  if (s("statDoubtful")) s("statDoubtful").textContent = doubtful.length;
  if (s("statFit")) s("statFit").textContent = fit.length;
}

// ── Populate player dropdown in Record modal ───────────────────────────
function populatePlayerSelect() {
  const sel = document.getElementById("recordPlayerSelect");
  if (!sel) return;
  sel.innerHTML = '<option value="" disabled selected>Select player…</option>';
  PLAYERS.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `#${p.number} ${p.name} — ${p.primary}`;
    sel.appendChild(opt);
  });
}

// ── Panel population ───────────────────────────────────────────────────
let currentPanelData = null;

function openPanel(data) {
  currentPanelData = data || null;
  const panel = document.getElementById("detailPanel");
  const overlay = document.getElementById("panelOverlay");
  if (!panel) return;

  // Header
  const nameEl = document.getElementById("panelName");
  const subEl = document.getElementById("panelSub");
  const avatarEl = document.getElementById("panelAvatar");
  if (nameEl) nameEl.textContent = data.name || "";
  if (subEl) subEl.textContent = `${data.pos || ""} • #${data.number || ""}`;
  if (avatarEl) {
    avatarEl.src = data.img || "";
    avatarEl.alt = data.name || "";
  }

  // Info row
  const infoRow = document.getElementById("panelInfoRow");
  if (infoRow) {
    const items = [
      { lbl: "Position", val: data.primary || "—" },
      { lbl: "Fitness", val: (data.fitness || "—") + "%" },
      { lbl: "Value", val: data.value || "—" },
      { lbl: "Foot", val: data.foot || "—" },
      { lbl: "Age", val: data.age || "—" },
      { lbl: "Status", val: data.injury ? "Injured" : "Fit" },
    ];
    infoRow.innerHTML = items
      .map(
        (i) => `
      <div class="col-4">
        <div class="panel-info-chip">
          <span class="panel-info-lbl">${i.lbl}</span>
          <span class="panel-info-val">${i.val}</span>
        </div>
      </div>`,
      )
      .join("");
  }

  panel.classList.add("open");
  if (overlay) overlay.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closePanel() {
  document.getElementById("detailPanel")?.classList.remove("open");
  document.getElementById("panelOverlay")?.classList.remove("show");
  document.body.style.overflow = "";
  document
    .querySelectorAll(".inj-card, .squad-card")
    .forEach((c) => c.classList.remove("selected"));
}

// ── Card listeners ─────────────────────────────────────────────────────
function attachCardListeners() {
  document.querySelectorAll(".inj-card[data-player]").forEach((card) => {
    card.addEventListener("click", function (e) {
      if (e.target.closest("button")) return;
      document
        .querySelectorAll(".inj-card, .squad-card")
        .forEach((c) => c.classList.remove("selected"));
      this.classList.add("selected");
      openPanel({
        id: this.dataset.id,
        name: this.dataset.player,
        pos: this.dataset.pos,
        number: this.dataset.number,
        primary: this.dataset.primary,
        fitness: this.dataset.fitness,
        value: this.dataset.value,
        foot: this.dataset.foot,
        age: this.dataset.age,
        img: this.dataset.img,
        injury: this.dataset.injury,
      });
    });
  });
}

function attachSquadListeners() {
  document.querySelectorAll(".squad-card[data-player]").forEach((card) => {
    card.addEventListener("click", function () {
      document
        .querySelectorAll(".inj-card, .squad-card")
        .forEach((c) => c.classList.remove("selected"));
      this.classList.add("selected");
      openPanel({
        id: this.dataset.id,
        name: this.dataset.player,
        pos: this.dataset.pos,
        number: this.dataset.number,
        primary: this.dataset.primary,
        fitness: this.dataset.fitness,
        value: this.dataset.value,
        foot: this.dataset.foot,
        age: this.dataset.age,
        img: this.dataset.img,
        injury: this.dataset.injury,
      });
    });
  });
}

// ── Update modal sync ──────────────────────────────────────────────────
document.addEventListener("click", function (e) {
  const btn = e.target.closest(".btn-open-update");
  if (!btn) return;
  const card = btn.closest(".inj-card");
  if (!card) return;
  const nameEl = document.getElementById("updateModalPlayerName");
  const subEl = document.getElementById("updateModalSubtitle");
  const avatarEl = document.getElementById("updateModalAvatar");
  const playerIdEl = document.getElementById("updatePlayerId");
  if (nameEl)
    nameEl.textContent = "Update Recovery: " + (card.dataset.player || "");
  if (subEl)
    subEl.textContent =
      (card.dataset.injury || "") + " • " + (card.dataset.grade || "");
  if (avatarEl) avatarEl.src = card.dataset.img || "";
  if (playerIdEl) playerIdEl.value = card.dataset.id || card.dataset.player || "";
  const slider = document.getElementById("recoverySlider");
  const valEl = document.getElementById("recoveryVal");
  const notesEl = document.getElementById("updateNotes");
  const meta = INJURY_META[card.dataset.player];
  const pct = meta ? meta.recovery : 50;
  if (slider) slider.value = pct;
  if (valEl) valEl.textContent = pct + "%";
  if (notesEl) notesEl.value = meta && meta.notes ? meta.notes : "";
  if (meta && meta.status) {
    const statusInput = document.querySelector(
      'input[name="upStatus"][value="' + meta.status + '"]',
    );
    if (statusInput) statusInput.checked = true;
  }
});

document.addEventListener("click", function (e) {
  if (!e.target.closest(".btn-open-panel-update")) return;
  if (!currentPanelData) return;

  const name = currentPanelData.name || "";
  const meta = INJURY_META[name] || {};
  const nameEl = document.getElementById("updateModalPlayerName");
  const subEl = document.getElementById("updateModalSubtitle");
  const avatarEl = document.getElementById("updateModalAvatar");
  const playerIdEl = document.getElementById("updatePlayerId");
  const slider = document.getElementById("recoverySlider");
  const valEl = document.getElementById("recoveryVal");
  const notesEl = document.getElementById("updateNotes");

  if (nameEl) nameEl.textContent = "Update Recovery: " + name;
  if (subEl) subEl.textContent = meta.injury || currentPanelData.injury || "";
  if (avatarEl) avatarEl.src = currentPanelData.img || "";
  if (playerIdEl) playerIdEl.value = currentPanelData.id || name;
  if (slider) slider.value = meta.recovery ?? currentPanelData.fitness ?? 0;
  if (valEl) valEl.textContent = (slider ? slider.value : 0) + "%";
  if (notesEl) notesEl.value = meta.notes || "";

  const statusInput = document.querySelector(
    'input[name="upStatus"][value="' + (meta.status || "absent") + '"]',
  );
  if (statusInput) statusInput.checked = true;

  try {
    new bootstrap.Modal(document.getElementById("updateModal")).show();
  } catch {}
});

// ── Recovery slider ────────────────────────────────────────────────────
document.addEventListener("input", function (e) {
  if (e.target.id === "recoverySlider") {
    const valEl = document.getElementById("recoveryVal");
    if (valEl) valEl.textContent = e.target.value + "%";
  }
});

// ── Save → toast + close ───────────────────────────────────────────────
document.addEventListener("click", function (e) {
  if (!e.target.closest(".btn-save-action")) return;
  showToast("Saved successfully ✓");
  const modal = e.target.closest(".modal");
  if (modal) bootstrap.Modal.getInstance(modal)?.hide();
  closePanel();
});

// ── Search ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderInjuredCards();
  renderSquadCards();
  updateStats();
  populatePlayerSelect();

  // Injury date default
  const dEl = document.getElementById("injuryDate");
  if (dEl) dEl.value = new Date().toISOString().split("T")[0];

  // Panel close
  document
    .getElementById("panelOverlay")
    ?.addEventListener("click", closePanel);
  document
    .getElementById("closePanelBtn")
    ?.addEventListener("click", closePanel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });

  // Tab switching (player profile page)
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-pane")
        .forEach((p) => p.classList.remove("active"));
      this.classList.add("active");
      document
        .getElementById("tab-" + this.dataset.tab)
        ?.classList.add("active");
    });
  });
});
