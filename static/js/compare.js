/* ================================================================
   GUNNERS PULSE — Compare Players · compare.js
   ================================================================ */

/* ── 1. Theme: init immediately so no flash ── */
(function () {
  var t = localStorage.getItem("gp_theme") || "light";
  document.documentElement.setAttribute("data-theme", t);
})();

/* ── 2. Theme helpers ── */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("gp_theme", theme);
  var ico = document.getElementById("themeIco");
  var lbl = document.getElementById("themeLbl");
  if (ico) ico.textContent = theme === "dark" ? "light_mode" : "dark_mode";
  if (lbl) lbl.textContent = theme === "dark" ? "Light" : "Dark";
  var logo = document.getElementById("siteLogo");
  if (logo)
    logo.src =
      theme === "dark"
        ? "/static/images/dark_gun.jpg"
        : "/static/images/white_gun.jpg";
  if (typeof drawRadar === "function") drawRadar();
}

function toggleTheme() {
  var cur = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(cur === "dark" ? "light" : "dark");
}

/* ── 3. Sidebar mobile ── */
function openSidebar() {
  var s = document.getElementById("sidebar");
  var o = document.getElementById("mobOverlay");
  if (s) s.classList.add("mob-open");
  if (o) o.classList.add("open");
}
function closeSidebar() {
  var s = document.getElementById("sidebar");
  var o = document.getElementById("mobOverlay");
  if (s) s.classList.remove("mob-open");
  if (o) o.classList.remove("open");
}

/* ── 4. Page nav ── */
function goPage(p) {
  var cur = window.location.pathname.split("/").pop();
  if (cur !== p) window.location.href = p;
}

/* ── 5. In-page tab switch ── */
function switchTab(id) {
  document.querySelectorAll(".cmp-tab").forEach(function (t) {
    t.classList.remove("active");
  });
  document.querySelectorAll(".cmp-panel").forEach(function (p) {
    p.classList.remove("active");
  });
  var tab = document.querySelector('[data-tab="' + id + '"]');
  var panel = document.getElementById(id);
  if (tab) tab.classList.add("active");
  if (panel) panel.classList.add("active");
}

/* ================================================================
   PLAYERS DATA
   ================================================================ */
var PLAYERS = window.PLAYERS || [];

/* ================================================================
   SELECTED PLAYERS (defaults)
   ================================================================ */
var selectedA = PLAYERS.length > 9 ? PLAYERS[9] : PLAYERS[0];
var selectedB = PLAYERS.length > 10 ? PLAYERS[10] : PLAYERS[1] || PLAYERS[0];

/* ================================================================
   PLAYER DROPDOWN BUILDER
   ================================================================ */
function buildDropdown(containerId, inputId, side) {
  var container = document.getElementById(containerId);
  var input = document.getElementById(inputId);
  if (!container || !input) return;

  var drop = document.createElement("div");
  drop.className = "p-dropdown";
  drop.id = "drop-" + side;

  PLAYERS.forEach(function (p) {
    var item = document.createElement("div");
    item.className = "p-drop-item";
    item.innerHTML =
      '<div class="d-ava" style="background-image:url(\'' +
      p.img +
      "')\"></div>" +
      "<div>" +
      '<div class="d-name">' +
      p.name +
      "</div>" +
      '<div class="d-pos">' +
      p.primary +
      " · #" +
      p.number +
      "</div>" +
      "</div>";
    item.addEventListener("click", function () {
      if (side === "a") selectedA = p;
      else selectedB = p;
      input.value = p.name;
      drop.classList.remove("open");
    });
    drop.appendChild(item);
  });

  container.style.position = "relative";
  container.appendChild(drop);

  input.addEventListener("click", function (e) {
    e.stopPropagation();
    document.querySelectorAll(".p-dropdown").forEach(function (d) {
      d.classList.remove("open");
    });
    drop.classList.toggle("open");
  });

  document.addEventListener("click", function (e) {
    if (!container.contains(e.target)) drop.classList.remove("open");
  });
}

/* ================================================================
   RENDER HERO CARDS + ALL DATA
   ================================================================ */
function renderAll() {
  renderCard("cardA", selectedA, "a");
  renderCard("cardB", selectedB, "b");
  document.querySelectorAll(".col-a").forEach(function (th) {
    th.textContent = selectedA.short;
  });
  document.querySelectorAll(".col-b").forEach(function (th) {
    th.textContent = selectedB.short;
  });
  buildBasicInfo();
  buildPerfStats();
  buildTactical();
  buildHistory();
  drawRadar();
}

function renderCard(id, p, side) {
  var el = document.getElementById(id);
  if (!el) return;
  var isA = side === "a";
  var acc = isA ? "#ec0024" : "#3b82f6";
  var rCol =
    p.rating >= 7.8 ? "#16a34a" : p.rating >= 7.0 ? "#d97706" : "#ef4444";
  var fCls =
    p.fitnessType === "green"
      ? "green"
      : p.fitnessType === "amber"
        ? "amber"
        : "red";

  el.className = "player-card card-" + side + " h-100";
  el.innerHTML =
    '<span class="card-badge b' +
    side +
    '">' +
    (isA ? "Player A" : "Player B") +
    "</span>" +
    '<div class="p-ava-wrap">' +
    '<div class="p-ava" style="background-image:url(\'' +
    p.img +
    "');border-color:" +
    acc +
    '"></div>' +
    '<span class="p-number-badge" style="background:' +
    acc +
    '">#' +
    p.number +
    "</span>" +
    "</div>" +
    '<h3 class="p-name-h">' +
    p.name +
    "</h3>" +
    '<p class="p-pos-h">' +
    p.primary +
    " · " +
    p.nationality +
    "</p>" +
    '<div class="mini-stats">' +
    '<div class="ms-item"><span class="ms-label">Rating</span><span class="ms-val" style="color:' +
    rCol +
    '">' +
    p.rating.toFixed(2) +
    "</span></div>" +
    '<div class="ms-item"><span class="ms-label">Fitness</span><span class="ms-val ' +
    fCls +
    '">' +
    p.fitness +
    "%</span></div>" +
    '<div class="ms-item"><span class="ms-label">Goals</span><span class="ms-val">' +
    p.g +
    "</span></div>" +
    '<div class="ms-item"><span class="ms-label">Assists</span><span class="ms-val">' +
    p.a +
    "</span></div>" +
    "</div>";
}

/* ================================================================
   RADAR SVG
   ================================================================ */
var RADAR_KEYS = [
  "Shooting",
  "Passing",
  "Dribbling",
  "Defending",
  "Physical",
  "Pace",
];

function drawRadar() {
  var wrap = document.getElementById("radarSvg");
  if (!wrap) return;
  var dark = document.documentElement.getAttribute("data-theme") === "dark";
  var W = 260,
    H = 260,
    cx = 130,
    cy = 130,
    r = 96,
    n = RADAR_KEYS.length;
  var gc = dark ? "#1e2235" : "#e4e7ef";
  var tc = dark ? "#5c6478" : "#9ca3af";

  function pt(val, i) {
    var angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    var d = (val / 100) * r;
    return { x: cx + d * Math.cos(angle), y: cy + d * Math.sin(angle) };
  }

  var s =
    '<svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:260px;display:block;margin:0 auto">';

  // Grid rings
  [0.25, 0.5, 0.75, 1].forEach(function (sc) {
    var pts = RADAR_KEYS.map(function (_, i) {
      var p = pt(sc * 100, i);
      return p.x + "," + p.y;
    }).join(" ");
    s +=
      '<polygon points="' +
      pts +
      '" fill="none" stroke="' +
      gc +
      '" stroke-width="1"/>';
  });
  // Spokes
  RADAR_KEYS.forEach(function (_, i) {
    var p = pt(100, i);
    s +=
      '<line x1="' +
      cx +
      '" y1="' +
      cy +
      '" x2="' +
      p.x +
      '" y2="' +
      p.y +
      '" stroke="' +
      gc +
      '" stroke-width="1"/>';
  });
  // Labels
  RADAR_KEYS.forEach(function (k, i) {
    var p = pt(128, i);
    s +=
      '<text x="' +
      p.x +
      '" y="' +
      p.y +
      '" text-anchor="middle" dominant-baseline="middle" font-size="8.5" font-weight="700" fill="' +
      tc +
      '" font-family="DM Sans,sans-serif">' +
      k.toUpperCase() +
      "</text>";
  });

  // Player A
  var ptsA = RADAR_KEYS.map(function (k, i) {
    var p = pt(selectedA.radar?.[k] || 0, i);
    return p.x + "," + p.y;
  }).join(" ");
  s +=
    '<polygon points="' +
    ptsA +
    '" fill="rgba(236,0,36,0.15)" stroke="#ec0024" stroke-width="2.5"/>';
  RADAR_KEYS.forEach(function (k, i) {
    var p = pt(selectedA.radar?.[k] || 0, i);
    s += '<circle cx="' + p.x + '" cy="' + p.y + '" r="3" fill="#ec0024"/>';
  });

  // Player B
  var ptsB = RADAR_KEYS.map(function (k, i) {
    var p = pt(selectedB.radar?.[k] || 0, i);
    return p.x + "," + p.y;
  }).join(" ");
  s +=
    '<polygon points="' +
    ptsB +
    '" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" stroke-width="2.5"/>';
  RADAR_KEYS.forEach(function (k, i) {
    var p = pt(selectedB.radar?.[k] || 0, i);
    s += '<circle cx="' + p.x + '" cy="' + p.y + '" r="3" fill="#3b82f6"/>';
  });

  s += "</svg>";
  wrap.innerHTML = s;

  var lA = document.getElementById("legendA");
  var lB = document.getElementById("legendB");
  if (lA) lA.textContent = selectedA?.short || "Player A";
  if (lB) lB.textContent = selectedB?.short || "Player B";
}

/* ================================================================
   TABLE HELPERS
   ================================================================ */
function calcDiff(a, b, higherBetter) {
  if (typeof a !== "number" || typeof b !== "number")
    return { cls: "diff-neu", txt: "—" };
  var d = a - b;
  if (d === 0) return { cls: "diff-neu", txt: "—" };
  var winning = higherBetter ? d > 0 : d < 0;
  var sign = d > 0 ? "+" : "";
  var txt = sign + (Number.isInteger(d) ? d : d.toFixed(1));
  return { cls: winning ? "diff-pos" : "diff-neg", txt: txt };
}

var WIN_A =
  '<span class="material-symbols-outlined win-icon" style="color:#ec0024;font-size:13px;vertical-align:middle;margin-left:3px">military_tech</span>';
var WIN_B =
  '<span class="material-symbols-outlined win-icon" style="color:#3b82f6;font-size:13px;vertical-align:middle;margin-left:3px">military_tech</span>';

function makeRow(metric, aRaw, bRaw, higherBetter, fmt) {
  if (!fmt)
    fmt = function (v) {
      return v;
    };
  var an = typeof aRaw === "number",
    bn = typeof bRaw === "number";
  var aWin = an && bn && (higherBetter ? aRaw > bRaw : aRaw < bRaw);
  var bWin = an && bn && (higherBetter ? bRaw > aRaw : bRaw < aRaw);
  var d =
    an && bn
      ? calcDiff(aRaw, bRaw, higherBetter)
      : { cls: "diff-neu", txt: "—" };
  return (
    "<tr>" +
    "<td>" +
    metric +
    "</td>" +
    '<td class="' +
    (aWin ? "winner-a" : "") +
    '">' +
    fmt(aRaw) +
    (aWin ? WIN_A : "") +
    "</td>" +
    '<td class="' +
    (bWin ? "winner-b" : "") +
    '">' +
    fmt(bRaw) +
    (bWin ? WIN_B : "") +
    "</td>" +
    '<td class="' +
    d.cls +
    '">' +
    d.txt +
    "</td>" +
    "</tr>"
  );
}

function grpRow(label) {
  return '<tr class="cmp-group-hd"><td colspan="4">' + label + "</td></tr>";
}

/* ================================================================
   BUILD TABLE PANELS
   ================================================================ */
function buildBasicInfo() {
  var el = document.querySelector("#tab-basic tbody");
  if (!el) return;
  var a = selectedA,
    b = selectedB;
  var medA = a.medicalType === "fit";
  var medB = b.medicalType === "fit";
  el.innerHTML =
    grpRow("Profile") +
    makeRow("Age (years)", a.age, b.age, false) +
    makeRow("Height (cm)", a.height, b.height, true) +
    makeRow("Weight (kg)", a.weight, b.weight, false) +
    makeRow("Preferred Foot", a.foot, b.foot, true, function (v) {
      return v;
    }) +
    makeRow("Nationality", a.nationality, b.nationality, true, function (v) {
      return v;
    }) +
    grpRow("Contract &amp; Value") +
    makeRow("Market Value", a.valueN, b.valueN, true, function (v) {
      return "€" + v + "m";
    }) +
    grpRow("Fitness &amp; Medical") +
    makeRow("Fitness %", a.fitness, b.fitness, true, function (v) {
      return v + "%";
    }) +
    "<tr><td>Medical Status</td>" +
    '<td><span class="badge-fit ' +
    (medA ? "fit-green" : "fit-red") +
    '"><span class="fit-dot"></span>' +
    a.medical +
    "</span></td>" +
    '<td><span class="badge-fit ' +
    (medB ? "fit-green" : "fit-red") +
    '"><span class="fit-dot"></span>' +
    b.medical +
    "</span></td>" +
    '<td class="diff-neu">—</td></tr>' +
    makeRow(
      "Injury Proneness",
      a.injuryProneness,
      b.injuryProneness,
      true,
      function (v) {
        return v;
      },
    );
}

function buildPerfStats() {
  var el = document.querySelector("#tab-perf tbody");
  if (!el) return;
  var a = selectedA,
    b = selectedB;
  el.innerHTML =
    grpRow("Playing Time") +
    makeRow("Matches Played", a.mp, b.mp, true) +
    makeRow("Starts", a.gs, b.gs, true) +
    makeRow("Minutes", a.min, b.min, true) +
    grpRow("Goals &amp; Creativity") +
    makeRow("Goals", a.g, b.g, true) +
    makeRow("Assists", a.a, b.a, true) +
    makeRow("G + A", a.g + a.a, b.g + b.a, true) +
    makeRow("xG", a.xg, b.xg, true, function (v) {
      return v.toFixed(1);
    }) +
    makeRow("xA", a.xa, b.xa, true, function (v) {
      return v.toFixed(1);
    }) +
    makeRow("Conversion %", a.conv, b.conv, true, function (v) {
      return v + "%";
    }) +
    grpRow("Shooting") +
    makeRow("Total Shots", a.sh, b.sh, true) +
    makeRow("Shot on Target %", a.sot, b.sot, true, function (v) {
      return v + "%";
    }) +
    makeRow("Shots in Box", a.inBox, b.inBox, true) +
    grpRow("Discipline") +
    makeRow("Yellow Cards", a.yc_p, b.yc_p, false) +
    makeRow("Red Cards", a.rc_p, b.rc_p, false) +
    makeRow("Fouls Committed", a.fc, b.fc, false) +
    makeRow("Offsides", a.off, b.off, false);
}

function buildTactical() {
  var el = document.querySelector("#tab-tactical tbody");
  if (!el) return;
  var a = selectedA,
    b = selectedB;
  el.innerHTML =
    grpRow("Passing") +
    makeRow("Pass Accuracy", a.passAcc, b.passAcc, true, function (v) {
      return v + "%";
    }) +
    makeRow("Key Passes / 90", a.keyPasses, b.keyPasses, true, function (v) {
      return v.toFixed(1);
    }) +
    makeRow("Final 3rd Passes", a.final3rd, b.final3rd, true) +
    makeRow("Long Ball %", a.longBalls, b.longBalls, true, function (v) {
      return v + "%";
    }) +
    makeRow("Through Balls", a.throughBalls, b.throughBalls, true) +
    grpRow("Defending") +
    makeRow("Tackle Win %", a.tackles, b.tackles, true, function (v) {
      return v + "%";
    }) +
    makeRow(
      "Interceptions / 90",
      a.interceptions,
      b.interceptions,
      true,
      function (v) {
        return v.toFixed(1);
      },
    ) +
    makeRow(
      "Ball Recoveries / 90",
      a.ballRecov,
      b.ballRecov,
      true,
      function (v) {
        return v.toFixed(1);
      },
    ) +
    grpRow("Duels") +
    makeRow("Total Duel Win %", a.totalDuels, b.totalDuels, true, function (v) {
      return v + "%";
    }) +
    makeRow("Aerial Win %", a.aerial, b.aerial, true, function (v) {
      return v + "%";
    }) +
    makeRow("Dribble Success %", a.dribbles, b.dribbles, true, function (v) {
      return v + "%";
    }) +
    grpRow("Athletic") +
    makeRow("Distance / 90 (km)", a.distance, b.distance, true, function (v) {
      return v.toFixed(1);
    }) +
    makeRow("HI Sprints / 90", a.hiSprints, b.hiSprints, true) +
    makeRow("Top Speed (km/h)", a.topSpeed, b.topSpeed, true, function (v) {
      return v.toFixed(1);
    });
}

function buildHistory() {
  var el = document.querySelector("#tab-history tbody");
  if (!el) return;
  var a = selectedA,
    b = selectedB;
  el.innerHTML =
    grpRow("Season") +
    makeRow("Availability %", a.avl, b.avl, true, function (v) {
      return v + "%";
    }) +
    makeRow("Man of the Match", a.motm, b.motm, true) +
    makeRow("Season Rating", a.rating, b.rating, true, function (v) {
      return v.toFixed(2);
    }) +
    grpRow("Career") +
    makeRow("Career Apps", a.careerApps, b.careerApps, true) +
    makeRow("Career Goals", a.careerGoals, b.careerGoals, true) +
    makeRow("Trophies", a.trophies, b.trophies, true) +
    grpRow("Injury") +
    makeRow("Days Missed (Season)", a.injury, b.injury, false) +
    makeRow(
      "Injury Proneness",
      a.injuryProneness,
      b.injuryProneness,
      true,
      function (v) {
        return v;
      },
    );
}

/* ================================================================
   ACTIVE TAB
   ================================================================ */
function activateTab(tabId) {
  document.querySelectorAll(".cmp-tab").forEach(function (t) {
    t.classList.remove("active");
  });
  document.querySelectorAll(".cmp-panel").forEach(function (p) {
    p.classList.remove("active");
  });
  var tabEl = document.querySelector('[data-tab="' + tabId + '"]');
  var panelEl = document.getElementById(tabId);
  if (tabEl) tabEl.classList.add("active");
  if (panelEl) panelEl.classList.add("active");
}

/* ================================================================
   INIT
   ================================================================ */
document.addEventListener("DOMContentLoaded", function () {
  /* 1. Theme */
  var saved = localStorage.getItem("gp_theme") || "light";
  applyTheme(saved);

  /* 2. Theme button */
  var themeBtn = document.getElementById("themeToggle");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

  /* 3. Dropdowns */
  buildDropdown("dropWrapA", "inputA", "a");
  buildDropdown("dropWrapB", "inputB", "b");

  /* 4. Set default input text */
  var ia = document.getElementById("inputA");
  var ib = document.getElementById("inputB");
  if (ia) ia.value = selectedA.name;
  if (ib) ib.value = selectedB.name;

  /* 5. Compare button */
  var btn = document.getElementById("compareBtn");
  if (btn) {
    btn.addEventListener("click", function () {
      renderAll();
      activateTab("tab-basic");
    });
  }

  /* 6. Render all data */
  renderAll();

  /* 7. Activate first tab */
  activateTab("tab-basic");
});
