/* ================================================================
   PLAYER TACTICS JS — READ-ONLY VIEW
   Loads tactic data from Django/Admin JSON via CURRENT_TACTIC.
   localStorage is kept only as a fallback.
   ================================================================ */

var TACTICS_SAVE_KEY = "gp_current_tactic";
var THEME_KEY = "gp_theme";
var CURRENT_PLAYER_SHORT =
  (window.PLAYER_TACTICS_DATA &&
    window.PLAYER_TACTICS_DATA.currentPlayerShort) ||
  window.CURRENT_PLAYER_SHORT ||
  "";

/* ── State ── */
var state = {
  formation: null,
  assignments: {},
  playerRoles: {},
  sptAssignments: Object.assign({}, SPT_DEFAULTS),
  tactics: null,
  selectedIdx: null,
  lastTacticRaw: null,
};

/* ── Instruction icon map ── */
var INSTR_ICONS = {
  "Get Further Forward": "arrow_upward",
  "Stay Wider": "open_in_full",
  "Cut Inside": "turn_slight_right",
  "Dribble More": "sports_soccer",
  "Shoot More": "rocket_launch",
  "Move Into Channels": "moving",
  "Cross More": "send",
  "Cross Less": "block",
  "Early Crosses": "fast_forward",
  "Tackle Harder": "fitness_center",
  "Stay Back": "arrow_downward",
  "Press More": "compress",
  "Play Simpler": "horizontal_rule",
  "Try Through Balls": "arrow_forward",
};

/* ================================================================
   INIT
   ================================================================ */
document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  initSidebar();
  initRightPanelClose();

  loadAndRender();
  initMobileTabs();

  /* ── Cross-tab sync ── */
  window.addEventListener("storage", function (e) {
    if (e.key === TACTICS_SAVE_KEY) {
      loadAndRender();
    }
  });
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
      theme === "dark"
        ? "/static/images/dark_gun_p.jpg"
        : "/static/images/white_gun_p.jpg";
}

function initTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) || "light");
  document.getElementById("themeToggle").addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(cur === "dark" ? "light" : "dark");
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
   LOAD SAVED TACTIC
   ================================================================ */
function loadAndRender() {
  try {
    var raw = localStorage.getItem(TACTICS_SAVE_KEY);
    var data = null;

    if (raw) {
      data = JSON.parse(raw);
    } else if (typeof CURRENT_TACTIC !== "undefined" && CURRENT_TACTIC) {
      data = CURRENT_TACTIC;
    }

    if (!data || !data.formationId) {
      loadDefault();
      return;
    }

    var f = FORMATIONS.find(function (x) {
      return x.id === data.formationId;
    });

    if (!f) {
      loadDefault();
      return;
    }

    state.formation = f;
    state.assignments = data.assignments || getDefaultAssignments(f);
    state.playerRoles = data.playerRoles || {};
    state.tactics = data.tactics || null;
    if (data.sptAssignments) state.sptAssignments = data.sptAssignments;

    state.lastTacticRaw = raw || JSON.stringify(data);

    renderAll();
  } catch (e) {
    console.warn("Load failed:", e);
    loadDefault();
  }
}

function loadDefault() {
  var f = FORMATIONS.find(function (x) {
    return x.id === "4-3-3-holding";
  });
  if (!f) return;

  state.formation = f;
  state.assignments = getDefaultAssignments(f);
  state.playerRoles = {};
  state.tactics = null;
  state.lastTacticRaw = null;
  renderAll();
}

function showNoTactic() {
  var overlay = document.getElementById("no-tactic-overlay");
  if (overlay) overlay.style.display = "flex";
}

/* ================================================================
   RENDER ALL
   ================================================================ */
function renderAll() {
  renderFormationSummary();
  renderTeamTactics();
  renderSetPieceTakers();
  renderPitch();
}

/* ── Formation Summary ── */
function renderFormationSummary() {
  var f = state.formation;
  document.getElementById("formation-name-display").textContent = f.name;
  document.getElementById("formation-desc-display").textContent = f.description;

  var styleRow = document.getElementById("formation-style-row");
  var sc =
    f.style === "Attacking"
      ? "style-attacking"
      : f.style === "Defensive"
        ? "style-defensive"
        : "style-balanced";

  styleRow.innerHTML =
    '<span class="formation-style-badge ' + sc + '">' + f.style + "</span>";
}

/* ── Team Tactics (read-only display) ── */
function renderTeamTactics() {
  var t = state.tactics;

  var defSec = document.getElementById("sec-def");
  var offSec = document.getElementById("sec-off");

  if (!t) {
    if (defSec) defSec.style.display = "none";
    if (offSec) offSec.style.display = "none";

    if (!document.getElementById("no-tactics-notice")) {
      var notice = document.createElement("div");
      notice.id = "no-tactics-notice";
      notice.className = "panel-section";
      notice.style.cssText =
        "display:flex;flex-direction:column;align-items:center;" +
        "gap:10px;padding:24px 16px;text-align:center;";
      notice.innerHTML =
        '<span class="material-symbols-outlined" ' +
        'style="font-size:36px;color:var(--primary)">info</span>' +
        '<p style="font-size:13px;color:var(--text3);margin:0;line-height:1.6">' +
        "No tactical instructions have been shared yet.<br>" +
        "Check back before the next session." +
        "</p>";
      if (defSec && defSec.parentNode) {
        defSec.parentNode.insertBefore(notice, defSec);
      }
    }
    return;
  }

  var notice = document.getElementById("no-tactics-notice");
  if (notice) notice.remove();
  if (defSec) defSec.style.display = "";
  if (offSec) offSec.style.display = "";

  function setVal(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val || "—";
  }

  function setBar(barId, valId, val, max) {
    max = max || 100;
    var bar = document.getElementById(barId);
    var lbl = document.getElementById(valId);
    if (!bar || !lbl) return;
    var pct = Math.round(((parseFloat(val) || 0) / max) * 100);
    bar.style.setProperty("--pct", pct + "%");
    lbl.textContent = val || "—";
  }

  /* ── Defensive ── */
  setVal("v-def-style", t.defStyle);
  setVal("v-press-trigger", t.pressTrigger);
  setBar("bar-press-int", "v-press-int", t.pressInt);
  setVal("v-offside", t.offsideTrap === "on" ? "On" : "Off");
  setBar("bar-def-width", "v-def-width", t.defWidth);
  setBar("bar-def-depth", "v-def-depth", t.defDepth);
  setVal("v-trans-def", t.transDef);
  setVal("v-corner-def", t.cornerDef);
  setVal("v-fk-def", t.fkDef);

  /* ── Offensive ── */
  setVal("v-build-play", t.buildPlay);
  setVal("v-chance-creation", t.chanceCreation);
  setVal("v-trans-att", t.transAtt);
  setVal("v-cross-style", t.crossStyle);
  setBar("bar-cross-freq", "v-cross-freq", t.crossFreq);
  setBar("bar-off-width", "v-off-width", t.offWidth);
  setBar("bar-pib", "v-pib", t.pib, 6);
  setVal("v-corner-att", t.cornerAtt);
  setVal("v-fk-att", t.fkAtt);
  setVal("v-post", t.postVal);

  /* ── Offside Trap pill styling ── */
  var offsideEl = document.getElementById("v-offside");
  if (offsideEl) {
    if (t.offsideTrap === "on") {
      offsideEl.style.background = "#22c55e20";
      offsideEl.style.borderColor = "#22c55e50";
      offsideEl.style.color = "#16a34a";
    } else {
      offsideEl.style.background = "#ec002415";
      offsideEl.style.borderColor = "#ec002440";
      offsideEl.style.color = "#ec0024";
    }
  }
}

/* ── Set Piece Takers ── */
function renderSetPieceTakers() {
  var grid = document.getElementById("spt-grid");
  if (!grid) return;
  grid.innerHTML = "";

  SPT_ROLES.forEach(function (role) {
    var assignedShort = state.sptAssignments[role.id] || "";
    var assignedPlayer = PLAYERS.find(function (p) {
      return p.short === assignedShort;
    });
    var isMe = assignedShort === CURRENT_PLAYER_SHORT;

    var row = document.createElement("div");
    row.className = "spt-row";

    var img = document.createElement("img");
    img.className = "spt-avatar";
    img.src = assignedPlayer
      ? assignedPlayer.img
      : "https://placehold.co/26/231517/fff?text=?";
    img.onerror = function () {
      this.src = "https://placehold.co/26/231517/fff?text=?";
    };

    if (isMe) {
      img.style.borderColor = "#f59e0b";
    } else if (assignedPlayer) {
      img.style.borderColor = getPosColor(assignedPlayer.posGroup);
    }

    var lbl = document.createElement("div");
    lbl.className = "spt-label";
    lbl.innerHTML =
      '<span class="material-symbols-outlined">' +
      role.icon +
      "</span>" +
      role.label;

    var name = document.createElement("div");
    name.className = "spt-player-name" + (isMe ? " spt-highlight" : "");
    name.textContent = assignedShort
      ? assignedShort + (isMe ? " (You)" : "")
      : "—";

    row.append(img, lbl, name);
    grid.appendChild(row);
  });
}

/* ── PITCH ── */
function renderPitch() {
  var pitch = document.getElementById("pitch");
  pitch.querySelectorAll(".player-token").forEach(function (el) {
    el.remove();
  });

  var f = state.formation;
  f.positions.forEach(function (pos, idx) {
    var playerShort = state.assignments[idx] || null;
    var player = playerShort
      ? PLAYERS.find(function (p) {
          return p.short === playerShort;
        })
      : null;
    var ov = (state.playerRoles[f.id] || {})[idx] || {};
    var role = ov.role || pos.role;
    var focus = ov.focus || pos.focus;
    var isMe = playerShort === CURRENT_PLAYER_SHORT;

    var token = createToken(pos, player, role, focus, idx, isMe);
    pitch.appendChild(token);
  });

  initCollapsibles();
}

function createToken(posData, player, role, focus, idx, isMe) {
  var token = document.createElement("div");
  token.className = "player-token" + (isMe ? " is-me" : "");
  token.setAttribute("data-idx", idx);
  token.style.left = posData.x + "%";
  token.style.top = posData.y + "%";

  var pg = player ? player.posGroup : getPosGroup(posData.pos);
  var borderCol = getPosColor(pg);
  if (isMe) borderCol = "#f59e0b";

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
    "</div>" +
    "</div>" +
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
    showRightPanel(player, posData, role, focus, idx);
  });

  token.addEventListener("mouseenter", function (e) {
    showTooltip(e, displayName, role, focus);
  });
  token.addEventListener("mousemove", moveTooltip);
  token.addEventListener("mouseleave", hideTooltip);

  return token;
}

/* ================================================================
   RIGHT PANEL (click player)
   ================================================================ */
function initRightPanelClose() {
  document
    .getElementById("rp-close")
    .addEventListener("click", closeRightPanel);
  document.addEventListener("click", function (e) {
    var pitch = document.getElementById("pitch");
    if (
      e.target === pitch ||
      (e.target.tagName === "svg" && e.target.parentElement === pitch)
    ) {
      closeRightPanel();
    }
  });
}

function closeRightPanel() {
  state.selectedIdx = null;
  document.querySelectorAll(".player-token").forEach(function (t) {
    t.classList.remove("selected");
  });
  document.getElementById("rp-empty").style.display = "flex";
  document.getElementById("rp-player").style.display = "none";
}

function showRightPanel(player, posData, role, focus, idx) {
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
    : posData.pos;
  document.getElementById("rp-pos-badge").textContent = player
    ? player.primary
    : posData.pos;
  document.getElementById("rp-number").textContent = player
    ? "#" +
      player.number +
      (player.nationality ? " · " + player.nationality : "")
    : "";

  document.getElementById("rp-role-display").textContent = role;
  var rg = ROLES_DATA[posData.pos];
  var rd = rg
    ? rg.roles.find(function (r) {
        return r.name === role;
      })
    : null;
  document.getElementById("rp-role-desc").textContent = rd
    ? rd.description
    : "";

  var focusPillEl = document.getElementById("rp-focus-display");
  focusPillEl.textContent = focus;
  var fc = FOCUS_COLORS[focus] || {
    bg: "#f3f4f6",
    border: "#9ca3af",
    text: "#6b7280",
  };
  focusPillEl.style.background = fc.bg;
  focusPillEl.style.borderColor = fc.border;
  focusPillEl.style.color = fc.text;
  var focusDescText = rd && rd.focusDesc ? rd.focusDesc[focus] || "" : "";
  document.getElementById("rp-focus-desc").textContent = focusDescText;

  var ov = (state.playerRoles[state.formation.id] || {})[idx] || {};
  var defSupport = ov.defSupport || "come-back";
  var defSupMap = {
    basic: "Basic",
    "come-back": "Come Back",
    "stay-forward": "Stay Forward",
  };
  document.getElementById("rp-defsup-display").textContent =
    defSupMap[defSupport] || defSupport;

  var instructions = ov.instructions || [];
  var instrSec = document.getElementById("rp-instrs-sec");
  var instrPills = document.getElementById("rp-instrs-pills");
  if (instructions.length > 0) {
    instrSec.style.display = "block";
    instrPills.innerHTML = "";
    instructions.forEach(function (instr) {
      var icon = INSTR_ICONS[instr] || "check";
      var pill = document.createElement("div");
      pill.className = "pi-pill-ro";
      pill.innerHTML =
        '<span class="material-symbols-outlined">' + icon + "</span>" + instr;
      instrPills.appendChild(pill);
    });
  } else {
    instrSec.style.display = "none";
  }

  var notes = ov.notes || "";
  var notesSec = document.getElementById("rp-notes-sec");
  var notesDisp = document.getElementById("rp-notes-display");
  if (notes.trim()) {
    notesSec.style.display = "block";
    notesDisp.textContent = notes;
  } else {
    notesSec.style.display = "none";
  }
}

/* ================================================================
   COLLAPSIBLE SECTIONS
   ================================================================ */
function initCollapsibles() {
  document.querySelectorAll(".panel-title-toggle").forEach(function (title) {
    var clone = title.cloneNode(true);
    title.parentNode.replaceChild(clone, title);
  });
  document.querySelectorAll(".panel-title-toggle").forEach(function (title) {
    title.addEventListener("click", function () {
      var sec = title.closest(".panel-section-collapsible");
      if (sec) sec.classList.toggle("collapsed");
    });
  });
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
   HELPERS
   ================================================================ */
function getDefaultAssignments(formation) {
  var currentShort = CURRENT_PLAYER_SHORT || "Player";
  var POOL = {
    GK: ["Raya"],
    CB: ["Saliba", "Gabriel", "Timber"],
    LB: ["M.L-Skelly"],
    RB: ["B.White", "Timber"],
    CDM: ["Rice", "Zubimendi"],
    CM: ["Merino", "Zubimendi", "Rice"],
    LM: ["Martinelli", "Trossard"],
    RM: [currentShort],
    CAM: ["Ødegaard", "Nwaneri", "Havertz"],
    LW: ["Martinelli", "Trossard"],
    RW: [currentShort, "Nwaneri"],
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

function getPosGroup(pos) {
  if (pos === "GK") return "GK";
  if (["CB", "LB", "RB"].includes(pos)) return "DEF";
  if (["CDM", "CM", "LM", "RM", "CAM"].includes(pos)) return "MID";
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

/* ================================================================
   MOBILE TAB SYSTEM
   ================================================================ */
function initMobileTabs() {
  if (window.innerWidth > 1200) return;

  /* ── Inject tab bar HTML ── */
  var tabBar = document.createElement("div");
  tabBar.className = "mob-tab-bar";
  tabBar.id = "mobTabBar";
  tabBar.innerHTML =
    '<button class="mob-tab-btn active" data-mob-tab="pitch">' +
    '<span class="material-symbols-outlined">sports_soccer</span>Pitch' +
    "</button>" +
    '<button class="mob-tab-btn" data-mob-tab="tactics">' +
    '<span class="material-symbols-outlined">strategy</span>Tactics' +
    '<span class="mob-tab-badge" id="mobTacticsBadge" style="display:none"></span>' +
    "</button>" +
    '<button class="mob-tab-btn" data-mob-tab="player">' +
    '<span class="material-symbols-outlined">person</span>Player' +
    "</button>";
  document.body.appendChild(tabBar);

  /* ── Inject backdrop ── */
  var backdrop = document.createElement("div");
  backdrop.className = "mob-panel-backdrop";
  backdrop.id = "mobPanelBackdrop";
  document.body.appendChild(backdrop);

  /* ── Inject close buttons into panels ── */
  injectPanelCloseBtn(
    document.querySelector(".left-panel"),
    "Team Tactics",
    "close",
  );
  injectPanelCloseBtn(
    document.querySelector(".right-panel"),
    "Player Info",
    "close",
  );

  /* ── Tab click handler ── */
  tabBar.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-mob-tab]");
    if (!btn) return;
    var tab = btn.getAttribute("data-mob-tab");

    tabBar.querySelectorAll(".mob-tab-btn").forEach(function (b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");

    if (tab === "tactics") {
      openMobPanel("left");
    } else if (tab === "player") {
      openMobPanel("right");
    } else {
      closeMobPanels();
    }
  });

  /* ── Backdrop click → close ── */
  backdrop.addEventListener("click", function () {
    closeMobPanels();
    setMobTabActive("pitch");
  });

  /* ── Re-check on resize ── */
  window.addEventListener("resize", function () {
    if (window.innerWidth > 1200) {
      closeMobPanels();
      var tb = document.getElementById("mobTabBar");
      if (tb) tb.style.display = "none";
    } else {
      var tb2 = document.getElementById("mobTabBar");
      if (tb2) tb2.style.display = "flex";
    }
  });

  /* ── When a player token is clicked on mobile/tablet, open right panel ── */
  document.addEventListener("click", function (e) {
    if (window.innerWidth > 1200) return;
    var token = e.target.closest(".player-token");
    if (!token) return;
    setTimeout(function () {
      openMobPanel("right");
      setMobTabActive("player");
    }, 50);
  });

  /* ── Override closeRightPanel to also close mob panel ── */
  var _origClose = closeRightPanel;
  closeRightPanel = function () {
    _origClose();
    if (window.innerWidth <= 1200) {
      closeMobPanel("right");
      setMobTabActive("pitch");
    }
  };
}

/* ── Mobile tab helpers ── */
function injectPanelCloseBtn(panel, label, icon) {
  if (!panel) return;
  if (panel.querySelector(".mob-panel-close")) return;
  var btn = document.createElement("button");
  btn.className = "mob-panel-close";
  btn.innerHTML =
    '<span class="material-symbols-outlined">' + icon + "</span>" + label;
  btn.addEventListener("click", function () {
    closeMobPanels();
    setMobTabActive("pitch");
  });
  panel.insertBefore(btn, panel.firstChild);
}

function openMobPanel(side) {
  var leftPanel = document.querySelector(".left-panel");
  var rightPanel = document.querySelector(".right-panel");
  var backdrop = document.getElementById("mobPanelBackdrop");

  if (side === "left") {
    rightPanel && rightPanel.classList.remove("mob-panel-open");
    leftPanel && leftPanel.classList.add("mob-panel-open");
  } else {
    leftPanel && leftPanel.classList.remove("mob-panel-open");
    rightPanel && rightPanel.classList.add("mob-panel-open");
  }

  backdrop && backdrop.classList.add("show");
}

function closeMobPanel(side) {
  var panel = document.querySelector(
    side === "left" ? ".left-panel" : ".right-panel",
  );
  if (panel) panel.classList.remove("mob-panel-open");

  var left = document.querySelector(".left-panel");
  var right = document.querySelector(".right-panel");
  if (
    !left.classList.contains("mob-panel-open") &&
    !right.classList.contains("mob-panel-open")
  ) {
    var backdrop = document.getElementById("mobPanelBackdrop");
    if (backdrop) backdrop.classList.remove("show");
  }
}

function closeMobPanels() {
  document.querySelectorAll(".left-panel, .right-panel").forEach(function (p) {
    p.classList.remove("mob-panel-open");
  });
  var backdrop = document.getElementById("mobPanelBackdrop");
  if (backdrop) backdrop.classList.remove("show");
}

function setMobTabActive(tab) {
  document.querySelectorAll(".mob-tab-btn").forEach(function (b) {
    b.classList.toggle("active", b.getAttribute("data-mob-tab") === tab);
  });
}
