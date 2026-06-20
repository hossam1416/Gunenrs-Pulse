/* ================================================================
   GUNNERS PULSE — TACTICS JS
   All logic lives here. Zero inline JS in HTML.
   ================================================================ */

var TACTICS_SAVE_KEY = "gp_current_tactic";
var THEME_KEY = "gp_theme";

/* ── Set Piece Taker Roles ── */
var SPT_ROLES = [
  { id: "corners-right", label: "Corners (Right)", icon: "flag" },
  { id: "corners-left", label: "Corners (Left)", icon: "flag" },
  { id: "freekicks", label: "Free Kicks", icon: "sports_soccer" },
  { id: "longthrows", label: "Long Throws", icon: "sports_handball" },
  { id: "penalties", label: "Penalties", icon: "adjust" },
  { id: "throwin-final3rd", label: "Final 3rd Throw-ins", icon: "back_hand" },
];

var SPT_DEFAULTS = {
  "corners-right": "Saka",
  "corners-left": "Trossard",
  freekicks: "Ødegaard",
  longthrows: "Merino",
  penalties: "Gyökeres",
  "throwin-final3rd": "B.White",
};

/* ── Role short descriptions for enhanced tooltip ── */
var ROLE_SHORT_DESC = {
  Goalkeeper: "Stays on line, shot-stopping focus",
  "Sweeper Keeper": "Leaves area to collect, supports build-up",
  "Ball-Playing Keeper": "Active in build-up, stays on line defensively",
  Defender: "No-nonsense, holds the defensive line",
  Stopper: "Steps up aggressively to win the ball",
  "Ball-Playing Defender": "Comfortable in possession, pushes into midfield",
  "Wide Back": "Shifts wide to cover advancing fullbacks",
  Fullback: "Wide defender, protects and offers outlet",
  Falseback: "Inverts centrally when team has the ball",
  Wingback: "Pushes up to attack, tracks back to defend",
  "Attacking Wingback": "Primarily offensive, minimal defensive duties",
  "Inverted Wingback": "Cuts inside to link central play",
  Holding: "Screens the defence, protects back line",
  "Deep-Lying Playmaker": "Builds from deep, creative passing",
  "Centre-Half": "Drops between CBs to cover counter-attacks",
  "Wide Half": "Fills wide defensive positions as needed",
  "Box Crasher": "Times late runs into the box from midfield",
  "Box-to-Box": "Contributes at both ends of the pitch",
  Playmaker: "Links midfield and attack with clever movement",
  "Half-Winger": "Wide-positioned, stretches or cuts inside",
  Winger: "Hugs touchline, delivers crosses or cuts in",
  "Wide Midfielder": "Traditional wide role, strong both phases",
  "Wide Playmaker": "Creates from wide areas with clever passing",
  "Inside Forward": "Cuts inside onto strong foot to shoot or create",
  "Shadow Striker": "Makes late runs beyond the striker from deep",
  "Classic 10": "Traditional playmaker, drops deep to turn and play forward",
  "Advanced Forward": "Pushes the line, runs in behind, finishes",
  Poacher: "Penalty box specialist, always in position to score",
  "False 9": "Drops into midfield, pulls CBs out of position",
  "Target Forward": "Holds up ball, brings others into play physically",
};

/* ── State ── */
var state = {
  currentFormation: null,
  selectedIdx: null,
  playerRoles: {},
  starters: [],
  dragSource: null,
  assignments: {},
  sptAssignments: Object.assign({}, SPT_DEFAULTS),
};

var _baselineSnapshot = null;

/* ================================================================
   INIT
   ================================================================ */
document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  initSidebar();
  initHeaderButtons();
  initTabButtons();
  initFormControls();
  initRightPanel();
  initMobilePanels();
  buildPresetGrid();
  buildFormationsGrid();
  buildSetPieceTakers();
  loadSavedTactic();
  captureBaseline();
});

/* ================================================================
   THEME
   ================================================================ */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  var icon = document.getElementById("themeIcon");
  if (icon) icon.textContent = theme === "dark" ? "light_mode" : "dark_mode";
  var logo = document.getElementById("siteLogo");
  if (logo)
    logo.src =
      theme === "dark" ? "/static/images/dark_gun.jpg" : "/static/images/white_gun.jpg";
}

function initTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) || "light");
  document.getElementById("themeToggle").addEventListener("click", function () {
    var current =
      document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

/* ================================================================
   SIDEBAR
   ================================================================ */
function initSidebar() {
  var toggle = document.getElementById("sidebarToggle");
  var overlay = document.getElementById("mobOverlay");
  if (toggle) toggle.addEventListener("click", openSidebar);
  if (overlay) overlay.addEventListener("click", closeSidebar);
}

function openSidebar() {
  document.getElementById("sidebar").classList.add("mob-open");
  document.getElementById("mobOverlay").classList.add("show");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("mob-open");
  document.getElementById("mobOverlay").classList.remove("show");
}

/* ================================================================
   MOBILE PANEL CONTROLS
   ================================================================ */
function initMobilePanels() {
  var teamBtn = document.getElementById("mpc-team");
  var playerBtn = document.getElementById("mpc-player");
  var overlay = document.getElementById("mobilePanelOverlay");
  var closeLeft = document.getElementById("closeLeftPanel");

  if (teamBtn) {
    teamBtn.addEventListener("click", function () {
      toggleMobilePanel("left");
    });
  }
  if (playerBtn) {
    playerBtn.addEventListener("click", function () {
      toggleMobilePanel("right");
    });
  }
  if (overlay) {
    overlay.addEventListener("click", function () {
      closeMobilePanels();
    });
  }
  if (closeLeft) {
    closeLeft.addEventListener("click", function () {
      closeMobilePanels();
    });
  }

  /* Also close mobile panels when rp-close is clicked */
  var rpClose = document.getElementById("rp-close");
  if (rpClose) {
    rpClose.addEventListener("click", function () {
      closeMobilePanels();
    });
  }
}

function toggleMobilePanel(panelId) {
  var leftPanel = document.getElementById("leftPanel");
  var rightPanel = document.getElementById("rightPanel");
  var teamBtn = document.getElementById("mpc-team");
  var playerBtn = document.getElementById("mpc-player");
  var overlay = document.getElementById("mobilePanelOverlay");

  if (panelId === "left") {
    var isOpen = leftPanel.classList.contains("mob-open");
    closeMobilePanels();
    if (!isOpen) {
      leftPanel.classList.add("mob-open");
      overlay.classList.add("show");
      if (teamBtn) teamBtn.classList.add("active");
    }
  } else if (panelId === "right") {
    var isOpen = rightPanel.classList.contains("mob-open");
    closeMobilePanels();
    if (!isOpen) {
      rightPanel.classList.add("mob-open");
      overlay.classList.add("show");
      if (playerBtn) playerBtn.classList.add("active");
    }
  }
}

function openMobilePanel(panelId) {
  var leftPanel = document.getElementById("leftPanel");
  var rightPanel = document.getElementById("rightPanel");
  var teamBtn = document.getElementById("mpc-team");
  var playerBtn = document.getElementById("mpc-player");
  var overlay = document.getElementById("mobilePanelOverlay");

  if (panelId === "left") {
    if (leftPanel.classList.contains("mob-open")) return;
    closeMobilePanels();
    leftPanel.classList.add("mob-open");
    overlay.classList.add("show");
    if (teamBtn) teamBtn.classList.add("active");
  } else if (panelId === "right") {
    if (rightPanel.classList.contains("mob-open")) return;
    closeMobilePanels();
    rightPanel.classList.add("mob-open");
    overlay.classList.add("show");
    if (playerBtn) playerBtn.classList.add("active");
  }
}

function closeMobilePanels() {
  var leftPanel = document.getElementById("leftPanel");
  var rightPanel = document.getElementById("rightPanel");
  var teamBtn = document.getElementById("mpc-team");
  var playerBtn = document.getElementById("mpc-player");
  var overlay = document.getElementById("mobilePanelOverlay");

  if (leftPanel) leftPanel.classList.remove("mob-open");
  if (rightPanel) rightPanel.classList.remove("mob-open");
  if (overlay) overlay.classList.remove("show");
  if (teamBtn) teamBtn.classList.remove("active");
  if (playerBtn) playerBtn.classList.remove("active");
}

function isMobilePanel() {
  return window.innerWidth < 992;
}

/* ================================================================
   HEADER BUTTONS
   ================================================================ */
function initHeaderButtons() {
  document
    .getElementById("btn-reset")
    .addEventListener("click", resetFormation);
  document.getElementById("btn-save").addEventListener("click", savePlan);
}

/* ================================================================
   TAB BUTTONS  (event delegation)
   ================================================================ */
function initTabButtons() {
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-tab]");
    if (!btn) return;
    switchTab(btn.getAttribute("data-tab"), btn);
  });
}

function switchTab(id, btn) {
  document.querySelectorAll(".tab-panel").forEach(function (p) {
    p.classList.remove("active");
  });
  document.querySelectorAll(".inpage-tab, .mob-tab-btn").forEach(function (b) {
    b.classList.remove("active");
  });
  document.getElementById("tab-" + id).classList.add("active");
  btn.classList.add("active");
}

/* ================================================================
   FORM CONTROLS  (select + range via event delegation / data-attrs)
   ================================================================ */
function initFormControls() {
  /* Selects with data-label */
  document.addEventListener("change", function (e) {
    var el = e.target;
    if (!el.classList.contains("tac-form-select")) return;
    var labelId = el.getAttribute("data-label");
    if (labelId) {
      var lbl = document.getElementById(labelId);
      if (lbl) lbl.textContent = el.options[el.selectedIndex].text;
    }
    autoSave();
  });

  /* Ranges with data-label */
  document.addEventListener("input", function (e) {
    var el = e.target;
    if (el.type !== "range") return;
    var labelId = el.getAttribute("data-label");
    if (labelId) {
      var lbl = document.getElementById(labelId);
      if (lbl) lbl.textContent = el.value;
    }
    autoSave();
  });

  /* Toggle pills (Offside Trap) */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-toggle]");
    if (!btn) return;
    var group = btn.getAttribute("data-toggle");
    var val = btn.getAttribute("data-val");
    applyToggle(group, val);
    autoSave();
  });

  /* Collapsible sections */
  document.addEventListener("click", function (e) {
    var title = e.target.closest("[data-section]");
    if (!title) return;
    var sec = document.getElementById(title.getAttribute("data-section"));
    if (sec) sec.classList.toggle("collapsed");
  });
}

function applyToggle(group, val) {
  var onBtn = document.getElementById(group + "-on");
  var offBtn = document.getElementById(group + "-off");
  var hint = document.getElementById(group + "-hint");
  if (group === "offside") {
    if (val === "on") {
      onBtn.classList.add("active");
      offBtn.classList.remove("active");
      if (hint)
        hint.textContent = "Defensive line holds high, trapping runners";
    } else {
      offBtn.classList.add("active");
      onBtn.classList.remove("active");
      if (hint) hint.textContent = "Line drops to avoid offside risk";
    }
  }
}

/* ================================================================
   RIGHT PANEL WIRING
   ================================================================ */
function initRightPanel() {
  /* Role select */
  document
    .getElementById("rp-role-sel")
    .addEventListener("change", function () {
      onRoleChange(this.value, _currentTacticData);
    });

  /* Defensive support buttons */
  document
    .getElementById("rp-def-support")
    .addEventListener("click", function (e) {
      var btn = e.target.closest("[data-support]");
      if (!btn) return;
      setDefSupport(btn.getAttribute("data-support"), btn);
    });

  /* Player instruction pills */
  document
    .getElementById("rp-player-instructions")
    .addEventListener("click", function (e) {
      var btn = e.target.closest(".pi-pill");
      if (!btn) return;
      toggleInstruction(btn);
    });

  /* Coach notes */
  document.getElementById("rp-notes").addEventListener("input", function () {
    if (state.selectedIdx !== null) {
      saveOverride(state.selectedIdx, "notes", this.value);
      autoSave();
    }
  });

  /* Click pitch background → deselect */
  document.addEventListener("click", function (e) {
    var pitch = document.getElementById("pitch");
    if (
      e.target === pitch ||
      (e.target.tagName === "svg" && e.target.parentElement === pitch)
    ) {
      clearPlayerSelection();
    }
  });
}

/* ================================================================
   SET PIECE TAKERS
   ================================================================ */
function buildSetPieceTakers() {
  var grid = document.getElementById("spt-grid");
  if (!grid) return;
  grid.innerHTML = "";

  SPT_ROLES.forEach(function (role) {
    var assignedShort = state.sptAssignments[role.id] || "";
    var assignedPlayer = PLAYERS.find(function (p) {
      return p.short === assignedShort;
    });

    var row = document.createElement("div");
    row.className = "spt-row";

    var img = document.createElement("img");
    img.className = "spt-avatar";
    img.id = "spt-avatar-" + role.id;
    img.src = assignedPlayer
      ? assignedPlayer.img
      : "https://placehold.co/28/231517/fff?text=?";
    img.onerror = function () {
      this.src = "https://placehold.co/28/231517/fff?text=?";
    };
    if (assignedPlayer)
      img.style.borderColor = getPosColor(assignedPlayer.posGroup);

    var lbl = document.createElement("div");
    lbl.className = "spt-label";
    lbl.innerHTML =
      '<span class="material-symbols-outlined">' +
      role.icon +
      "</span>" +
      role.label;

    var sel = document.createElement("select");
    sel.className = "spt-select";
    sel.id = "spt-sel-" + role.id;

    var emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "— Assign —";
    sel.appendChild(emptyOpt);

    PLAYERS.forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p.short;
      opt.textContent = p.short + " (#" + p.number + ")";
      if (p.short === assignedShort) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener("change", function () {
      state.sptAssignments[role.id] = this.value;
      var np = PLAYERS.find(function (p) {
        return p.short === sel.value;
      });
      var av = document.getElementById("spt-avatar-" + role.id);
      if (av) {
        av.src = np ? np.img : "https://placehold.co/28/231517/fff?text=?";
        av.style.borderColor = np ? getPosColor(np.posGroup) : "var(--border2)";
      }
      autoSave();
    });

    row.appendChild(img);
    row.appendChild(lbl);
    row.appendChild(sel);
    grid.appendChild(row);
  });
}

/* ================================================================
   CHANGE TRACKING — autoSave() does NOT write to localStorage.
   Only savePlan() writes to localStorage, so a page refresh
   without saving discards all unsaved changes.
   ================================================================ */
var _autoSaveTimer = null;
var _hasUnsavedChanges = false;

function autoSave() {
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(function () {
    _hasUnsavedChanges = true;
    showUnsavedIndicator();
  }, 300);
}

function showUnsavedIndicator() {
  var ind = document.getElementById("autosave-indicator");
  if (!ind) return;
  ind.textContent = "Unsaved changes";
  ind.classList.add("unsaved");
  ind.classList.remove("saved");
}

function showAutoSaveIndicator() {
  var ind = document.getElementById("autosave-indicator");
  if (!ind) return;
  ind.textContent = "Saved!";
  ind.classList.add("saved");
  ind.classList.remove("unsaved");
  setTimeout(function () {
    ind.classList.remove("saved");
    ind.textContent = "";
  }, 2000);
}

function persistTactic() {
  /* Writes current state to localStorage. Called ONLY from savePlan(). */
  if (!state.currentFormation) return;
  try {
    var data = {
      formationId: state.currentFormation.id,
      assignments: state.assignments,
      playerRoles: state.playerRoles,
      sptAssignments: state.sptAssignments,
      tactics: {
        defStyle: getSelectVal("def-style"),
        pressTrigger: getSelectVal("press-trigger"),
        pressInt: getLabelVal("press-int-val"),
        offsideTrap: document
          .getElementById("offside-on")
          .classList.contains("active")
          ? "on"
          : "off",
        defWidth: getLabelVal("def-width-val"),
        defDepth: getLabelVal("def-depth-val"),
        transDef: getSelectVal("trans-def"),
        cornerDef: getSelectVal("corner-def"),
        fkDef: getSelectVal("fk-def"),
        buildPlay: getSelectVal("build-play"),
        chanceCreation: getSelectVal("chance-creation"),
        transAtt: getSelectVal("trans-att"),
        crossStyle: getSelectVal("cross-style"),
        crossFreq: getLabelVal("cross-freq-val"),
        offWidth: getLabelVal("off-width-val"),
        pib: getLabelVal("pib-val"),
        cornerAtt: getSelectVal("corner-att"),
        fkAtt: getSelectVal("fk-att"),
        postVal: getLabelVal("post-val"),
      },
    };
    localStorage.setItem(TACTICS_SAVE_KEY, JSON.stringify(data));
    _hasUnsavedChanges = false;
  } catch (e) {
    console.warn("Save failed:", e);
  }
}

function loadSavedTactic() {
  try {
    var raw = localStorage.getItem(TACTICS_SAVE_KEY);
    if (!raw) {
      loadFormation("4-3-3-holding");
      return;
    }
    var data = JSON.parse(raw);

    var f = FORMATIONS.find(function (x) {
      return x.id === data.formationId;
    });
    if (!f) {
      loadFormation("4-3-3-holding");
      return;
    }

    state.currentFormation = f;
    state.playerRoles = data.playerRoles || {};
    state.assignments = data.assignments || getDefaultAssignments(f);

    if (data.sptAssignments) {
      state.sptAssignments = data.sptAssignments;
      buildSetPieceTakers();
    }

    clearPlayerSelection();
    renderPitch(f);
    document.querySelectorAll(".preset-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-id") === f.id);
    });

    var t = data.tactics || {};
    restoreSelect("def-style", "def-style-val", t.defStyle);
    restoreSelect("press-trigger", "press-trigger-val", t.pressTrigger);
    restoreSelect("trans-def", "trans-def-val", t.transDef);
    restoreSelect("corner-def", "corner-def-val", t.cornerDef);
    restoreSelect("fk-def", "fk-def-val", t.fkDef);
    restoreSelect("build-play", "build-val", t.buildPlay);
    restoreSelect("chance-creation", "chance-val", t.chanceCreation);
    restoreSelect("trans-att", "trans-att-val", t.transAtt);
    restoreSelect("cross-style", "cross-style-val", t.crossStyle);
    restoreSelect("corner-att", "corner-att-val", t.cornerAtt);
    restoreSelect("fk-att", "fk-att-val", t.fkAtt);
    restoreRange("press-int", "press-int-val", t.pressInt);
    restoreRange("def-width", "def-width-val", t.defWidth);
    restoreRange("def-depth", "def-depth-val", t.defDepth);
    restoreRange("cross-freq", "cross-freq-val", t.crossFreq);
    restoreRange("off-width", "off-width-val", t.offWidth);
    restoreRange("pib", "pib-val", t.pib);
    restoreRange("post", "post-val", t.postVal);
    if (t.offsideTrap) applyToggle("offside", t.offsideTrap);
  } catch (e) {
    console.warn("Load failed:", e);
    loadFormation("4-3-3-holding");
  }
}

function restoreSelect(selectId, labelId, val) {
  if (!val) return;
  var sel = document.getElementById(selectId);
  if (!sel) return;
  for (var i = 0; i < sel.options.length; i++) {
    if (sel.options[i].text === val) {
      sel.selectedIndex = i;
      break;
    }
  }
  var lbl = document.getElementById(labelId);
  if (lbl && sel.options[sel.selectedIndex])
    lbl.textContent = sel.options[sel.selectedIndex].text;
}

function restoreRange(inputId, labelId, val) {
  if (!val) return;
  var input = document.getElementById(inputId);
  if (input) input.value = val;
  var lbl = document.getElementById(labelId);
  if (lbl) lbl.textContent = val;
}

function getSelectVal(id) {
  var el = document.getElementById(id);
  return el ? el.options[el.selectedIndex].text : "";
}
function getLabelVal(id) {
  var el = document.getElementById(id);
  return el ? el.textContent : "";
}

function showAutoSaveIndicator() {
  var ind = document.getElementById("autosave-indicator");
  if (!ind) return;
  ind.classList.add("saved");
  setTimeout(function () {
    ind.classList.remove("saved");
  }, 2000);
}

/* ================================================================
   CAPTURE BASELINE & RESET FORMATION
   ================================================================ */
function captureBaseline() {
  if (!state.currentFormation) return;
  /* Deep-clone assignments and playerRoles via JSON so future state
     mutations do NOT silently overwrite the snapshot. */
  _baselineSnapshot = JSON.stringify({
    formationId: state.currentFormation.id,
    assignments: JSON.parse(JSON.stringify(state.assignments)),
    playerRoles: JSON.parse(JSON.stringify(state.playerRoles)),
    sptAssignments: JSON.parse(JSON.stringify(state.sptAssignments)),
    tactics: {
      defStyle: getSelectVal("def-style"),
      pressTrigger: getSelectVal("press-trigger"),
      pressInt: getLabelVal("press-int-val"),
      offsideTrap: document
        .getElementById("offside-on")
        .classList.contains("active")
        ? "on"
        : "off",
      defWidth: getLabelVal("def-width-val"),
      defDepth: getLabelVal("def-depth-val"),
      transDef: getSelectVal("trans-def"),
      cornerDef: getSelectVal("corner-def"),
      fkDef: getSelectVal("fk-def"),
      buildPlay: getSelectVal("build-play"),
      chanceCreation: getSelectVal("chance-creation"),
      transAtt: getSelectVal("trans-att"),
      crossStyle: getSelectVal("cross-style"),
      crossFreq: getLabelVal("cross-freq-val"),
      offWidth: getLabelVal("off-width-val"),
      pib: getLabelVal("pib-val"),
      cornerAtt: getSelectVal("corner-att"),
      fkAtt: getSelectVal("fk-att"),
      postVal: getLabelVal("post-val"),
    },
  });
}

function resetFormation() {
  if (!_baselineSnapshot) return;

  var data = JSON.parse(_baselineSnapshot);
  var f = FORMATIONS.find(function (x) {
    return x.id === data.formationId;
  });
  if (!f) return;

  /* Restore in-memory state from snapshot */
  state.currentFormation = f;
  state.playerRoles = data.playerRoles || {};
  state.assignments = data.assignments || getDefaultAssignments(f);
  state.sptAssignments = data.sptAssignments || Object.assign({}, SPT_DEFAULTS);
  state.selectedIdx = null;
  _currentTacticData = null;

  /* Re-render UI */
  clearPlayerSelection();
  renderPitch(f);
  buildSetPieceTakers();

  document.querySelectorAll(".preset-btn").forEach(function (b) {
    b.classList.toggle("active", b.getAttribute("data-id") === f.id);
  });

  var t = data.tactics || {};
  restoreSelect("def-style", "def-style-val", t.defStyle);
  restoreSelect("press-trigger", "press-trigger-val", t.pressTrigger);
  restoreSelect("trans-def", "trans-def-val", t.transDef);
  restoreSelect("corner-def", "corner-def-val", t.cornerDef);
  restoreSelect("fk-def", "fk-def-val", t.fkDef);
  restoreSelect("build-play", "build-val", t.buildPlay);
  restoreSelect("chance-creation", "chance-val", t.chanceCreation);
  restoreSelect("trans-att", "trans-att-val", t.transAtt);
  restoreSelect("cross-style", "cross-style-val", t.crossStyle);
  restoreSelect("corner-att", "corner-att-val", t.cornerAtt);
  restoreSelect("fk-att", "fk-att-val", t.fkAtt);
  restoreRange("press-int", "press-int-val", t.pressInt);
  restoreRange("def-width", "def-width-val", t.defWidth);
  restoreRange("def-depth", "def-depth-val", t.defDepth);
  restoreRange("cross-freq", "cross-freq-val", t.crossFreq);
  restoreRange("off-width", "off-width-val", t.offWidth);
  restoreRange("pib", "pib-val", t.pib);
  restoreRange("post", "post-val", t.postVal);
  if (t.offsideTrap) applyToggle("offside", t.offsideTrap);

  /* Update localStorage so next page load stays consistent */
  autoSave();

  /* Visual feedback on button */
  var btn = document.getElementById("btn-reset");
  if (!btn) return;
  var orig = btn.innerHTML;
  btn.innerHTML =
    '<span class="material-symbols-outlined">check_circle</span>' +
    '<span class="d-none d-xl-inline">Reverted!</span>';
  btn.style.background = "#f59e0b";
  setTimeout(function () {
    btn.innerHTML = orig;
    btn.style.background = "";
  }, 2000);
}

/* ================================================================
   PRESET GRID
   ================================================================ */
function buildPresetGrid() {
  var grid = document.getElementById("preset-grid");
  grid.innerHTML = "";
  FORMATIONS.forEach(function (f) {
    var btn = document.createElement("button");
    btn.className = "preset-btn";
    btn.textContent = f.name;
    btn.setAttribute("data-id", f.id);
    btn.title = f.description || f.name;
    btn.addEventListener("click", function () {
      loadFormation(this.getAttribute("data-id"));
    });
    grid.appendChild(btn);
  });
}

/* ================================================================
   BENCH
   ================================================================ */
function buildBench() {
  var container = document.getElementById("bench-players");
  container.innerHTML = "";
  var usedShorts = Object.values(state.assignments);
  var benchPlayers = PLAYERS.filter(function (p) {
    return usedShorts.indexOf(p.short) === -1;
  });

  benchPlayers.forEach(function (p) {
    var borderCol = getPosColor(p.posGroup || "MID");
    var el = document.createElement("div");
    el.className = "bench-player";
    el.setAttribute("draggable", "true");
    el.innerHTML =
      '<div class="bench-card" style="border-bottom-color:' +
      borderCol +
      '">' +
      '<img src="' +
      p.img +
      '" alt="' +
      p.short +
      '" onerror="this.src=\'https://placehold.co/52x42/231517/fff?text=' +
      p.number +
      "'\"/>" +
      '<div class="bench-pos-badge">' +
      p.primary +
      "</div></div>" +
      '<div class="bench-name">' +
      p.short +
      "</div>";

    el.addEventListener("click", function () {
      showPlayerPanel(p, null);
    });
    el.addEventListener("dragstart", function (e) {
      state.dragSource = { type: "bench", playerShort: p.short };
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", p.short);
      el.classList.add("dragging-bench");
      showDropHints();
    });
    el.addEventListener("dragend", function () {
      el.classList.remove("dragging-bench");
      hideDropHints();
    });
    container.appendChild(el);
  });

  var benchBar = document.getElementById("bench-bar");
  benchBar.ondragover = function (e) {
    if (state.dragSource && state.dragSource.type === "token") {
      e.preventDefault();
      benchBar.classList.add("bench-drop-hover");
    }
  };
  benchBar.ondragleave = function () {
    benchBar.classList.remove("bench-drop-hover");
  };
  benchBar.ondrop = function (e) {
    e.preventDefault();
    benchBar.classList.remove("bench-drop-hover");
    if (state.dragSource && state.dragSource.type === "token") {
      delete state.assignments[state.dragSource.idx];
      state.dragSource = null;
      hideDropHints();
      rerenderPitch();
      autoSave();
    }
  };
}

/* ================================================================
   LOAD / RENDER FORMATION
   ================================================================ */
function loadFormation(id) {
  var f = FORMATIONS.find(function (x) {
    return x.id === id;
  });
  if (!f) return;
  state.currentFormation = f;
  if (!state.playerRoles[id]) state.playerRoles[id] = {};
  state.assignments = getDefaultAssignments(f);
  clearPlayerSelection();
  renderPitch(f);
  document.querySelectorAll(".preset-btn").forEach(function (b) {
    b.classList.toggle("active", b.getAttribute("data-id") === id);
  });
  /* Do not autoSave here — loading a formation is not a user edit */
}

function rerenderPitch() {
  renderPitch(state.currentFormation);
}

function renderPitch(formation) {
  var pitch = document.getElementById("pitch");
  pitch.querySelectorAll(".player-token").forEach(function (el) {
    el.remove();
  });
  state.starters = Object.values(state.assignments);
  formation.positions.forEach(function (pos, idx) {
    var playerShort = state.assignments[idx] || null;
    var player = playerShort
      ? PLAYERS.find(function (p) {
          return p.short === playerShort;
        })
      : null;
    var ov = (state.playerRoles[formation.id] || {})[idx] || {};
    pitch.appendChild(
      createToken(pos, player, ov.role || pos.role, ov.focus || pos.focus, idx),
    );
  });
  buildBench();
}

function getDefaultAssignments(formation) {
  var POOL = {
    GK: ["Raya"],
    CB: ["Saliba", "Gabriel", "Timber"],
    LB: ["M.L-Skelly"],
    RB: ["B.White", "Timber"],
    CDM: ["Rice", "Zubimendi"],
    CM: ["Merino", "Zubimendi", "Rice"],
    LM: ["Martinelli", "Trossard"],
    RM: ["Saka"],
    CAM: ["Ødegaard", "Nwaneri", "Havertz"],
    LW: ["Martinelli", "Trossard"],
    RW: ["Saka", "Nwaneri"],
    ST: ["Gyökeres", "Havertz", "G.Jesus"],
  };
  var used = {},
    out = {};
  formation.positions.forEach(function (p, i) {
    var cands = POOL[p.pos] || [];
    for (var k = 0; k < cands.length; k++) {
      if (!used[cands[k]]) {
        out[i] = cands[k];
        used[cands[k]] = true;
        break;
      }
    }
  });
  return out;
}

/* ================================================================
   DROP HINTS
   ================================================================ */
function showDropHints() {
  document.querySelectorAll(".player-token").forEach(function (t) {
    t.classList.add("drop-target");
  });
}
function hideDropHints() {
  document.querySelectorAll(".player-token").forEach(function (t) {
    t.classList.remove("drop-target", "drop-hover");
  });
  var bench = document.getElementById("bench-bar");
  if (bench) bench.classList.remove("bench-drop-hover");
}

/* ================================================================
   CREATE TOKEN
   ================================================================ */
function createToken(posData, player, role, focus, idx) {
  var token = document.createElement("div");
  token.className = "player-token";
  token.setAttribute("data-idx", idx);
  token.setAttribute("draggable", "true");
  token.style.left = posData.x + "%";
  token.style.top = posData.y + "%";

  var pg = player ? player.posGroup : getPosGroup(posData.pos);
  var borderCol = getPosColor(pg);
  var posTextCol =
    pg === "GK"
      ? "#f59e0b"
      : pg === "DEF"
        ? "#93c5fd"
        : pg === "FWD"
          ? "#fca5a5"
          : "#86efac";
  var imgSrc = player
    ? player.img
    : "https://placehold.co/64x52/231517/fff?text=" + posData.pos;
  var displayName = player ? player.short : posData.pos;
  var num = player ? player.number : "";

  token.innerHTML =
    '<div class="token-card" style="border-bottom-color:' +
    borderCol +
    '">' +
    '<img class="token-img" src="' +
    imgSrc +
    '" alt="' +
    displayName +
    '" onerror="this.src=\'https://placehold.co/64x52/231517/fff?text=' +
    posData.pos +
    "'\"/>" +
    '<div class="token-pos" style="color:' +
    posTextCol +
    '">' +
    posData.pos +
    "</div>" +
    '<div class="token-role-badge">' +
    abbreviateRole(role) +
    "</div></div>" +
    '<div class="token-name">' +
    (num ? "#" + num + " " : "") +
    displayName +
    "</div>";

  token.addEventListener("click", function (e) {
    e.stopPropagation();
    document.querySelectorAll(".player-token").forEach(function (t) {
      t.classList.remove("selected");
    });
    token.classList.add("selected");
    state.selectedIdx = idx;
    showPlayerPanel(player, {
      posData: posData,
      role: role,
      focus: focus,
      idx: idx,
    });
  });

  token.addEventListener("dragstart", function (e) {
    state.dragSource = {
      type: "token",
      idx: idx,
      playerShort: player ? player.short : null,
    };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
    token.classList.add("dragging");
    var bb = document.getElementById("bench-bar");
    if (bb) bb.classList.add("bench-droppable");
    showDropHints();
    token.classList.remove("drop-target");
  });
  token.addEventListener("dragend", function () {
    token.classList.remove("dragging");
    var bb = document.getElementById("bench-bar");
    if (bb) bb.classList.remove("bench-droppable");
    hideDropHints();
    state.dragSource = null;
  });
  token.addEventListener("dragover", function (e) {
    if (
      !state.dragSource ||
      (state.dragSource.type === "token" && state.dragSource.idx === idx)
    )
      return;
    e.preventDefault();
    token.classList.add("drop-hover");
  });
  token.addEventListener("dragleave", function () {
    token.classList.remove("drop-hover");
  });
  token.addEventListener("drop", function (e) {
    e.preventDefault();
    e.stopPropagation();
    token.classList.remove("drop-hover");
    var src = state.dragSource;
    if (!src) return;
    if (src.type === "token") {
      var sp = state.assignments[src.idx] || null;
      var dp = state.assignments[idx] || null;
      if (sp) state.assignments[idx] = sp;
      else delete state.assignments[idx];
      if (dp) state.assignments[src.idx] = dp;
      else delete state.assignments[src.idx];
    } else if (src.type === "bench") {
      state.assignments[idx] = src.playerShort;
    }
    state.dragSource = null;
    hideDropHints();
    rerenderPitch();
    autoSave();
  });

  token.addEventListener("mousedown", startMouseDrag);
  token.addEventListener("mouseenter", function (e) {
    showTooltip(e, displayName, role, focus);
  });
  token.addEventListener("mousemove", moveTooltip);
  token.addEventListener("mouseleave", hideTooltip);
  return token;
}

function getPosGroup(pos) {
  if (pos === "GK") return "GK";
  if (["CB", "LB", "RB", "LWB", "RWB"].indexOf(pos) > -1) return "DEF";
  if (["CDM", "CM", "LM", "RM", "CAM"].indexOf(pos) > -1) return "MID";
  return "FWD";
}
function getPosColor(pg) {
  if (pg === "GK") return "#f59e0b";
  if (pg === "DEF") return "#3b82f6";
  if (pg === "FWD") return "#ec0024";
  return "#22c55e";
}
function abbreviateRole(role) {
  var map = {
    Goalkeeper: "GK",
    "Sweeper Keeper": "SK",
    "Ball-Playing Keeper": "BPK",
    Defender: "DEF",
    Stopper: "STP",
    "Ball-Playing Defender": "BPD",
    "Wide Back": "WB",
    Fullback: "FB",
    Falseback: "FB+",
    Wingback: "WKB",
    "Attacking Wingback": "AWB",
    "Inverted Wingback": "IWB",
    Holding: "HLD",
    "Deep-Lying Playmaker": "DLP",
    "Centre-Half": "CH",
    "Wide Half": "WH",
    "Box Crasher": "BC",
    "Box-to-Box": "B2B",
    Playmaker: "PLY",
    "Half-Winger": "HW",
    Winger: "WIN",
    "Wide Midfielder": "WM",
    "Wide Playmaker": "WP",
    "Inside Forward": "IF",
    "Shadow Striker": "SS",
    "Classic 10": "10",
    "Advanced Forward": "AF",
    Poacher: "POA",
    "False 9": "F9",
    "Target Forward": "TF",
  };
  return map[role] || role.substring(0, 3).toUpperCase();
}

/* ── Mouse Drag ── */
var _drag = null,
  _ox = 0,
  _oy = 0;
function startMouseDrag(e) {
  if (e.button !== 0) return;
  _drag = e.currentTarget;
  e.preventDefault();
  var r = _drag.getBoundingClientRect();
  _ox = e.clientX - r.left - r.width / 2;
  _oy = e.clientY - r.top - r.height / 2;
  document.addEventListener("mousemove", onMouseDragMove);
  document.addEventListener("mouseup", onMouseDragEnd);
}
function onMouseDragMove(e) {
  if (!_drag) return;
  _drag.classList.add("dragging");
  var pr = document.getElementById("pitch").getBoundingClientRect();
  _drag.style.left =
    Math.max(2, Math.min(98, ((e.clientX - pr.left - _ox) / pr.width) * 100)) +
    "%";
  _drag.style.top =
    Math.max(2, Math.min(98, ((e.clientY - pr.top - _oy) / pr.height) * 100)) +
    "%";
}
function onMouseDragEnd() {
  if (_drag) {
    _drag.classList.remove("dragging");
    _drag = null;
    autoSave();
  }
  document.removeEventListener("mousemove", onMouseDragMove);
  document.removeEventListener("mouseup", onMouseDragEnd);
}

/* ================================================================
   RIGHT PANEL
   ================================================================ */
var _currentTacticData = null;

function showPlayerPanel(player, tacticData) {
  _currentTacticData = tacticData;
  document.getElementById("rp-empty").style.display = "none";
  document.getElementById("rp-player").style.display = "flex";

  var av = document.getElementById("rp-avatar");
  av.src = player ? player.img : "https://placehold.co/56/231517/fff?text=?";
  av.onerror = function () {
    this.src =
      "https://placehold.co/56/231517/fff?text=" +
      (player ? player.number : "?");
  };

  document.getElementById("rp-name").textContent = player
    ? player.name
    : tacticData
      ? tacticData.posData.pos
      : "Unknown";
  document.getElementById("rp-pos-badge").textContent = player
    ? player.primary
    : tacticData
      ? tacticData.posData.pos
      : "";
  document.getElementById("rp-number").textContent = player
    ? "#" +
      player.number +
      (player.nationality ? " \u00b7 " + player.nationality : "")
    : "";

  if (!tacticData) {
    document.getElementById("rp-role-sel").innerHTML = "";
    document.getElementById("rp-role-desc").textContent = "";
    document.getElementById("rp-focus-btns").innerHTML = "";
    document.getElementById("rp-focus-desc").textContent = "";
    restorePlayerInstructions([]);
    /* Auto-open right panel on mobile when viewing a bench player */
    if (isMobilePanel()) {
      openMobilePanel("right");
    }
    return;
  }

  var posKey = tacticData.posData.pos;
  var roleSel = document.getElementById("rp-role-sel");
  roleSel.innerHTML = "";
  var rg = ROLES_DATA[posKey];
  if (rg) {
    rg.roles.forEach(function (r) {
      var o = document.createElement("option");
      o.value = r.name;
      o.textContent = r.name;
      if (r.name === tacticData.role) o.selected = true;
      roleSel.appendChild(o);
    });
  }

  updateRoleDesc(tacticData.role, posKey);
  buildFocusBtns(posKey, tacticData.role, tacticData.focus, tacticData);

  var saved =
    (state.playerRoles[state.currentFormation.id] || {})[tacticData.idx] || {};
  setDefSupportUI(saved.defSupport || "come-back");
  document.getElementById("rp-notes").value = saved.notes || "";
  restorePlayerInstructions(saved.instructions || []);

  /* Auto-open right panel on mobile when a pitch player is selected */
  if (isMobilePanel()) {
    openMobilePanel("right");
  }
}

function updateRoleDesc(roleName, posKey) {
  var rg = ROLES_DATA[posKey];
  var rd = rg
    ? rg.roles.find(function (r) {
        return r.name === roleName;
      })
    : null;
  document.getElementById("rp-role-desc").textContent = rd
    ? rd.description
    : "";
}

function buildFocusBtns(posKey, roleName, activeFocus, tacticData) {
  var rg = ROLES_DATA[posKey];
  var rd = rg
    ? rg.roles.find(function (r) {
        return r.name === roleName;
      })
    : null;
  var focuses = rd ? rd.focuses : [activeFocus];
  var container = document.getElementById("rp-focus-btns");
  container.innerHTML = "";
  focuses.forEach(function (f) {
    var fc = FOCUS_COLORS[f] || {
      bg: "#f3f4f6",
      border: "#9ca3af",
      text: "#6b7280",
    };
    var btn = document.createElement("button");
    btn.className = "focus-pill" + (f === activeFocus ? " active" : "");
    btn.textContent = f;
    btn.style.cssText =
      "--fc-bg:" +
      fc.bg +
      ";--fc-border:" +
      fc.border +
      ";--fc-text:" +
      fc.text;
    btn.addEventListener("click", function () {
      container.querySelectorAll(".focus-pill").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      saveOverride(tacticData.idx, "focus", f);
      updateFocusDesc(posKey, roleName, f);
      rerenderPitch();
      autoSave();
    });
    container.appendChild(btn);
  });
  updateFocusDesc(posKey, roleName, activeFocus);
}

function updateFocusDesc(posKey, roleName, focus) {
  var rg = ROLES_DATA[posKey];
  var rd = rg
    ? rg.roles.find(function (r) {
        return r.name === roleName;
      })
    : null;
  document.getElementById("rp-focus-desc").textContent =
    rd && rd.focusDesc ? rd.focusDesc[focus] || "" : "";
}

function onRoleChange(newRole, tacticData) {
  if (!tacticData) return;
  var posKey = tacticData.posData.pos;
  saveOverride(tacticData.idx, "role", newRole);
  var rg = ROLES_DATA[posKey];
  var rd = rg
    ? rg.roles.find(function (r) {
        return r.name === newRole;
      })
    : null;
  var firstFocus = rd ? rd.focuses[0] : tacticData.focus;
  saveOverride(tacticData.idx, "focus", firstFocus);
  updateRoleDesc(newRole, posKey);
  buildFocusBtns(posKey, newRole, firstFocus, tacticData);
  rerenderPitch();
  autoSave();
}

function setDefSupport(val, btn) {
  document.querySelectorAll(".def-support-btn").forEach(function (b) {
    b.classList.remove("active");
  });
  btn.classList.add("active");
  if (state.selectedIdx !== null) {
    saveOverride(state.selectedIdx, "defSupport", val);
    autoSave();
  }
}
function setDefSupportUI(val) {
  var map = {
    basic: "Basic",
    "come-back": "Come Back",
    "stay-forward": "Stay Forward",
  };
  document.querySelectorAll(".def-support-btn").forEach(function (b) {
    b.classList.toggle("active", b.textContent.trim() === (map[val] || val));
  });
}

function toggleInstruction(btn) {
  btn.classList.toggle("active");
  if (state.selectedIdx === null) return;
  var active = [];
  document.querySelectorAll(".pi-pill.active").forEach(function (p) {
    active.push(p.getAttribute("data-instr"));
  });
  saveOverride(state.selectedIdx, "instructions", active);
  autoSave();
}
function restorePlayerInstructions(activeList) {
  document.querySelectorAll(".pi-pill").forEach(function (p) {
    p.classList.toggle(
      "active",
      activeList.indexOf(p.getAttribute("data-instr")) > -1,
    );
  });
}

function saveOverride(idx, field, value) {
  var fid = state.currentFormation.id;
  if (!state.playerRoles[fid]) state.playerRoles[fid] = {};
  if (!state.playerRoles[fid][idx]) {
    var pos = state.currentFormation.positions[idx];
    state.playerRoles[fid][idx] = {
      role: pos.role,
      focus: pos.focus,
      defSupport: "come-back",
      notes: "",
      instructions: [],
    };
  }
  state.playerRoles[fid][idx][field] = value;
}

function clearPlayerSelection() {
  state.selectedIdx = null;
  _currentTacticData = null;
  document.querySelectorAll(".player-token").forEach(function (t) {
    t.classList.remove("selected");
  });
  document.getElementById("rp-empty").style.display = "flex";
  document.getElementById("rp-player").style.display = "none";
  /* Close mobile right panel when deselecting */
  if (isMobilePanel()) {
    closeMobilePanels();
  }
}

/* ================================================================
   TOOLTIP
   ================================================================ */
function showTooltip(e, name, role, focus) {
  var tt = document.getElementById("tooltip");
  document.getElementById("tt-name").textContent = name;
  var shortDesc = ROLE_SHORT_DESC[role] || "";
  document.getElementById("tt-role").innerHTML =
    "<strong>" +
    role +
    "</strong>" +
    (shortDesc
      ? "<br><small style='opacity:0.75'>" + shortDesc + "</small>"
      : "");
  document.getElementById("tt-focus").textContent = "Focus: " + focus;
  tt.style.display = "block";
  moveTooltip(e);
}
function moveTooltip(e) {
  var tt = document.getElementById("tooltip");
  tt.style.left = e.clientX + 14 + "px";
  tt.style.top = e.clientY - 20 + "px";
}
function hideTooltip() {
  document.getElementById("tooltip").style.display = "none";
}

/* ================================================================
   FORMATIONS PAGE
   ================================================================ */
function buildFormationsGrid() {
  var grid = document.getElementById("formations-grid");
  grid.innerHTML = "";
  FORMATIONS.forEach(function (formation) {
    var card = document.createElement("div");
    card.className = "formation-card";
    var sc =
      formation.style === "Attacking"
        ? "style-attacking"
        : formation.style === "Defensive"
          ? "style-defensive"
          : "style-balanced";
    var dots = formation.positions
      .map(function (p) {
        var col = getPosColor(getPosGroup(p.pos));
        return (
          '<div class="mini-player-dot" style="left:' +
          p.x +
          "%;top:" +
          p.y +
          "%;border-color:" +
          col +
          '">' +
          p.pos.substring(0, 1) +
          "</div>"
        );
      })
      .join("");
    var rows = formation.positions
      .map(function (p) {
        var fc = FOCUS_COLORS[p.focus] || {
          bg: "#f3f4f6",
          border: "#9ca3af",
          text: "#6b7280",
        };
        return (
          '<div class="formation-role-row"><div class="frr-pos">' +
          p.pos +
          "</div>" +
          '<div class="frr-role">' +
          p.role +
          "</div>" +
          '<div class="frr-focus" style="background:' +
          fc.bg +
          ";border-color:" +
          fc.border +
          ";color:" +
          fc.text +
          ';">' +
          p.focus +
          "</div></div>"
        );
      })
      .join("");
    card.innerHTML =
      '<div class="formation-card-header"><div class="formation-card-name">' +
      formation.name +
      "</div>" +
      '<span class="formation-style-badge ' +
      sc +
      '">' +
      formation.style +
      "</span></div>" +
      '<div class="formation-mini-pitch">' +
      dots +
      "</div>" +
      '<div class="formation-card-body"><div class="formation-card-desc">' +
      formation.description +
      "</div>" +
      '<div class="formation-roles-grid">' +
      rows +
      "</div></div>";
    card.addEventListener("click", function () {
      loadFormation(formation.id);
      var boardBtn = document.querySelector('.inpage-tab[data-tab="board"]');
      if (boardBtn) switchTab("board", boardBtn);
      /* On mobile, also switch to board tab via mobile buttons */
      var mobBoardBtn = document.querySelector(
        '.mob-tab-btn[data-tab="board"]',
      );
      if (mobBoardBtn) switchTab("board", mobBoardBtn);
    });
    grid.appendChild(card);
  });
}

/* ================================================================
   SAVE PLAN  ← captureBaseline() added so Reset reverts to last save
   ================================================================ */
function savePlan() {
  persistTactic();
  /* captureBaseline is intentionally NOT called here.
     Reset always reverts to the state at page load, not last save. */
  var btn = document.getElementById("btn-save");
  if (!btn) return;
  var orig = btn.innerHTML;
  btn.innerHTML =
    '<span class="material-symbols-outlined">check_circle</span><span class="d-none d-xl-inline">Saved!</span>';
  btn.style.background = "#16a34a";
  setTimeout(function () {
    btn.innerHTML = orig;
    btn.style.background = "";
  }, 2000);
}
