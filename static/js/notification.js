"use strict";
(function () {
  /* ═══════════════════════════════════════════════════════════════
     NOTIFICATION SYSTEM — EXTERNAL MODULE
     Drop <script src="../js/notification.js"></script> on ANY
     page. Missing DOM elements are created automatically.
     ═══════════════════════════════════════════════════════════════ */

  var _initialized = false;

  // ── CONFIG ──────────────────────────────────────────────────
  var NOTIF_CONFIG = {
    playerId: 12,
    toastDuration: 9000,
    maxHistory: 30,
    pollInterval: 4000,

    tacticsSaveKey: "gp_current_tactic",
    trainingSaveKey: "gp_published_session",

    historyKey: "gp_notif_history",
    tacticsHashKey: "gp_tactics_hash",
    trainingHashKey: "gp_training_hash",

    tacticsLink: "/player-tactics/",
    trainingLink: "/player-training/?playerId=12",

    coachName: "Coach Arteta",
  };

  // ── STATE ───────────────────────────────────────────────────
  var notifState = { dropdownOpen: false, unreadCount: 0 };

  // ── ENSURE DOM EXISTS ──────────────────────────────────────
  function ensureDOM() {
    // Toast container
    if (!document.getElementById("toastContainer")) {
      var tc = document.createElement("div");
      tc.id = "toastContainer";
      tc.className = "tac-toast-container";
      document.body.appendChild(tc);
    }

    // Dropdown
    if (!document.getElementById("notifDropdown")) {
      var dd = document.createElement("div");
      dd.id = "notifDropdown";
      dd.className = "notif-dropdown";
      dd.innerHTML =
        '<div class="notif-dropdown-header">' +
        '<span class="notif-dropdown-title">Notifications</span>' +
        '<button class="notif-clear-btn" id="clearNotifsBtn">Clear all</button>' +
        "</div>" +
        '<div class="notif-dropdown-body" id="notifBody">' +
        '<div class="notif-empty-state" id="notifEmptyState">' +
        '<span class="material-symbols-outlined" style="font-size:28px;color:var(--text-4)">notifications_off</span>' +
        "<p>No new notifications</p>" +
        "</div>" +
        "</div>";
      document.body.appendChild(dd);
    }

    // Badge elements inside bell button (if bell exists)
    var btn = document.getElementById("notifBtn");
    if (btn) {
      if (!document.getElementById("notifDot")) {
        var dot = document.createElement("span");
        dot.id = "notifDot";
        dot.className = "notif-dot";
        dot.style.display = "none";
        btn.appendChild(dot);
      }
      if (!document.getElementById("notifCount")) {
        var cnt = document.createElement("span");
        cnt.id = "notifCount";
        cnt.className = "notif-count";
        cnt.style.display = "none";
        btn.appendChild(cnt);
      }
    }
  }

  // ── UTILITIES ───────────────────────────────────────────────
  function simpleHash(str) {
    if (!str) return "empty";
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      hash = (hash << 5) - hash + ch;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  function timeAgo(ts) {
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 10) return "Just now";
    if (s < 60) return s + "s ago";
    var m = Math.floor(s / 60);
    if (m < 60) return m + " min ago";
    var h = Math.floor(m / 60);
    if (h < 24) return h + "h ago";
    var d = Math.floor(h / 24);
    if (d < 7) return d + "d ago";
    return new Date(ts).toLocaleDateString();
  }

  function escHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── BELL & DROPDOWN ─────────────────────────────────────────
  function initNotifBell() {
    var btn = document.getElementById("notifBtn");
    if (!btn) return;

    // Remove any existing listeners by cloning
    var clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);

    clone.addEventListener("click", function (e) {
      e.stopPropagation();
      notifState.dropdownOpen ? closeNotifDropdown() : openNotifDropdown();
    });

    var clearBtn = document.getElementById("clearNotifsBtn");
    if (clearBtn) {
      var clearClone = clearBtn.cloneNode(true);
      clearBtn.parentNode.replaceChild(clearClone, clearBtn);
      clearClone.addEventListener("click", function (e) {
        e.stopPropagation();
        saveNotifHistory([]);
        notifState.unreadCount = 0;
        updateNotifBadge();
        renderNotifDropdown([]);
      });
    }

    document.addEventListener("click", function (e) {
      if (!notifState.dropdownOpen) return;
      var dd = document.getElementById("notifDropdown");
      if (dd && !dd.contains(e.target) && !clone.contains(e.target)) {
        closeNotifDropdown();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && notifState.dropdownOpen) {
        closeNotifDropdown();
      }
    });
  }

  function openNotifDropdown() {
    notifState.dropdownOpen = true;
    var dd = document.getElementById("notifDropdown");
    if (dd) dd.classList.add("open");
    notifState.unreadCount = 0;
    updateNotifBadge();
    markAllRead();
  }

  function closeNotifDropdown() {
    notifState.dropdownOpen = false;
    var dd = document.getElementById("notifDropdown");
    if (dd) dd.classList.remove("open");
  }

  function updateNotifBadge() {
    var dot = document.getElementById("notifDot");
    var count = document.getElementById("notifCount");
    if (!dot || !count) return;

    if (notifState.unreadCount > 0) {
      dot.style.display = "none";
      count.style.display = "flex";
      count.textContent =
        notifState.unreadCount > 9 ? "9+" : notifState.unreadCount;
    } else {
      var hasUnread = getNotifHistory().some(function (n) {
        return !n.read;
      });
      dot.style.display = hasUnread ? "block" : "none";
      count.style.display = "none";
    }
  }

  // ── HISTORY (localStorage) ──────────────────────────────────
  function getNotifHistory() {
    try {
      var r = localStorage.getItem(NOTIF_CONFIG.historyKey);
      return r ? JSON.parse(r) : [];
    } catch (e) {
      return [];
    }
  }

  function saveNotifHistory(h) {
    if (h.length > NOTIF_CONFIG.maxHistory)
      h = h.slice(0, NOTIF_CONFIG.maxHistory);
    localStorage.setItem(NOTIF_CONFIG.historyKey, JSON.stringify(h));
  }

  function markAllRead() {
    var h = getNotifHistory();
    var changed = false;
    h.forEach(function (n) {
      if (!n.read) {
        n.read = true;
        changed = true;
      }
    });
    if (changed) saveNotifHistory(h);
  }

  function renderNotifDropdown(history) {
    var body = document.getElementById("notifBody");
    var empty = document.getElementById("notifEmptyState");
    if (!body) return;

    body.querySelectorAll(".notif-item").forEach(function (it) {
      it.remove();
    });

    if (!history || history.length === 0) {
      if (empty) empty.style.display = "flex";
      return;
    }
    if (empty) empty.style.display = "none";

    history.forEach(function (notif) {
      var item = document.createElement("div");
      item.className = "notif-item" + (notif.read ? "" : " unread");

      var iconSymbol = notif.type === "tactics" ? "strategy" : "fitness_center";

      item.innerHTML =
        '<div class="notif-item-icon">' +
        '<span class="material-symbols-outlined">' +
        iconSymbol +
        "</span>" +
        "</div>" +
        '<div class="notif-item-content">' +
        '<div class="notif-item-title">' +
        escHtml(notif.label) +
        "</div>" +
        '<div class="notif-item-summary">' +
        escHtml(notif.summary) +
        "</div>" +
        '<div class="notif-item-time">' +
        timeAgo(notif.timestamp) +
        "</div>" +
        "</div>";

      item.addEventListener("click", function () {
        closeNotifDropdown();
        if (notif.type === "tactics") {
          window.location.href = NOTIF_CONFIG.tacticsLink;
        } else {
          window.location.href = NOTIF_CONFIG.trainingLink;
        }
      });

      body.appendChild(item);
    });
  }

  function loadNotifHistory() {
    var h = getNotifHistory();
    notifState.unreadCount = h.filter(function (n) {
      return !n.read;
    }).length;
    updateNotifBadge();
    renderNotifDropdown(h);
  }

  // ── CHANGE DETECTION ────────────────────────────────────────
  function initChangeDetection() {
    var tRaw = localStorage.getItem(NOTIF_CONFIG.tacticsSaveKey);
    var trRaw = localStorage.getItem(NOTIF_CONFIG.trainingSaveKey);
    var currentTacticsHash = tRaw ? simpleHash(tRaw) : "empty";
    var currentTrainingHash = trRaw ? simpleHash(trRaw) : "empty";
    var lastTacticsHash =
      localStorage.getItem(NOTIF_CONFIG.tacticsHashKey) || "empty";
    var lastTrainingHash =
      localStorage.getItem(NOTIF_CONFIG.trainingHashKey) || "empty";

    if (currentTacticsHash !== lastTacticsHash && lastTacticsHash !== "empty") {
      var summary = detectTacticsChangeSummary(tRaw);
      if (summary)
        showChangeNotification("tactics", "Tactics Updated", summary);
    }
    if (
      currentTrainingHash !== lastTrainingHash &&
      lastTrainingHash !== "empty"
    ) {
      var summary2 = detectTrainingChangeSummary(trRaw);
      if (summary2)
        showChangeNotification("training", "Training Updated", summary2);
    }

    localStorage.setItem(NOTIF_CONFIG.tacticsHashKey, currentTacticsHash);
    localStorage.setItem(NOTIF_CONFIG.trainingHashKey, currentTrainingHash);

    window.addEventListener("storage", function (e) {
      if (e.key === NOTIF_CONFIG.tacticsSaveKey) handleTacticsChange();
      if (e.key === NOTIF_CONFIG.trainingSaveKey) handleTrainingChange();
    });

    setInterval(function () {
      handleTacticsChange();
      handleTrainingChange();
    }, NOTIF_CONFIG.pollInterval);

    loadNotifHistory();
  }

  var tacticsDebounce = null;
  function handleTacticsChange() {
    if (tacticsDebounce) return;
    tacticsDebounce = setTimeout(function () {
      tacticsDebounce = null;
      var raw = localStorage.getItem(NOTIF_CONFIG.tacticsSaveKey);
      var currentHash = raw ? simpleHash(raw) : "empty";
      var lastHash =
        localStorage.getItem(NOTIF_CONFIG.tacticsHashKey) || "empty";

      if (currentHash !== lastHash && lastHash !== "empty") {
        var summary = detectTacticsChangeSummary(raw);
        if (summary)
          showChangeNotification("tactics", "Tactics Updated", summary);
        localStorage.setItem(NOTIF_CONFIG.tacticsHashKey, currentHash);
      } else if (lastHash === "empty" && raw) {
        localStorage.setItem(NOTIF_CONFIG.tacticsHashKey, currentHash);
      }
    }, 800);
  }

  var trainingDebounce = null;
  function handleTrainingChange() {
    if (trainingDebounce) return;
    trainingDebounce = setTimeout(function () {
      trainingDebounce = null;
      var raw = localStorage.getItem(NOTIF_CONFIG.trainingSaveKey);
      var currentHash = raw ? simpleHash(raw) : "empty";
      var lastHash =
        localStorage.getItem(NOTIF_CONFIG.trainingHashKey) || "empty";

      if (currentHash !== lastHash && lastHash !== "empty") {
        var summary = detectTrainingChangeSummary(raw);
        if (summary)
          showChangeNotification("training", "Training Updated", summary);
        localStorage.setItem(NOTIF_CONFIG.trainingHashKey, currentHash);
      } else if (lastHash === "empty" && raw) {
        localStorage.setItem(NOTIF_CONFIG.trainingHashKey, currentHash);
      }
    }, 800);
  }

  // ── TACTICS DIFF ────────────────────────────────────────────
  function detectTacticsChangeSummary(raw) {
    try {
      var data = JSON.parse(raw);
      var parts = [];

      if (data.formationId) {
        var formations = [
          { id: "4-3-3-holding", name: "4-3-3 Holding" },
          { id: "4-3-3-attacking", name: "4-3-3 Attacking" },
          { id: "4-2-3-1", name: "4-2-3-1" },
          { id: "4-4-2", name: "4-4-2" },
          { id: "3-4-3", name: "3-4-3" },
          { id: "4-1-4-1", name: "4-1-4-1" },
          { id: "5-3-2", name: "5-3-2" },
          { id: "4-3-2-1", name: "4-3-2-1" },
          { id: "3-5-2", name: "3-5-2" },
          { id: "4-5-1", name: "4-5-1" },
        ];
        var f = formations.find(function (x) {
          return x.id === data.formationId;
        });
        if (f) parts.push("Formation: " + f.name);
      }

      var assignments = data.assignments || {};
      var playerRoles = (data.playerRoles || {})[data.formationId] || {};
      var myIdx = null;
      for (var idx in assignments) {
        if (assignments[idx] === "B. Saka") {
          myIdx = idx;
          break;
        }
      }

      if (myIdx !== null && playerRoles[myIdx]) {
        var ov = playerRoles[myIdx];
        if (ov.role) parts.push("Your role: " + ov.role);
        if (ov.focus) parts.push("Focus: " + ov.focus);
        if (ov.instructions && ov.instructions.length > 0) {
          parts.push(
            ov.instructions.length +
              " instruction" +
              (ov.instructions.length > 1 ? "s" : ""),
          );
        }
        if (ov.notes && ov.notes.trim()) parts.push("New coach note");
      }

      var t = data.tactics;
      if (t) {
        if (t.defStyle) parts.push("Defensive: " + t.defStyle);
        if (t.buildPlay) parts.push("Build-up: " + t.buildPlay);
        if (t.crossStyle) parts.push("Crossing: " + t.crossStyle);
      }

      return parts.length > 0
        ? parts.join(" · ")
        : "Tactical plan updated by coach";
    } catch (e) {
      return "Tactical plan updated by coach";
    }
  }

  // ── TRAINING DIFF ───────────────────────────────────────────
  function detectTrainingChangeSummary(raw) {
    try {
      var data = JSON.parse(raw);
      var map = data.drillPlayerMap || {};
      var myDrillIds = [];
      for (var dId in map) {
        if (!map.hasOwnProperty(dId)) continue;
        if (map[dId].indexOf(NOTIF_CONFIG.playerId) !== -1)
          myDrillIds.push(dId);
      }

      var parts = [];
      if (data.date) {
        try {
          parts.push(
            "Date: " +
              new Date(data.date + "T00:00:00").toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              }),
          );
        } catch (e) {
          /* ignore */
        }
      }
      if (data.duration) parts.push(data.duration + " min session");
      if (myDrillIds.length > 0) {
        parts.push(
          myDrillIds.length +
            " drill" +
            (myDrillIds.length > 1 ? "s" : "") +
            " assigned to you",
        );
      }

      return parts.length > 0
        ? parts.join(" · ")
        : "Training session updated by coach";
    } catch (e) {
      return "Training session updated by coach";
    }
  }

  // ── SHOW NOTIFICATION ───────────────────────────────────────
  function showChangeNotification(type, label, summary) {
    showToastNotification(type, label, summary);

    var history = getNotifHistory();
    history.unshift({
      id: Date.now(),
      timestamp: Date.now(),
      type: type,
      label: label,
      summary: summary,
      read: false,
    });
    saveNotifHistory(history);
    renderNotifDropdown(history);

    notifState.unreadCount++;
    updateNotifBadge();

    var bell = document.getElementById("notifBtn");
    if (bell) {
      bell.classList.remove("has-new");
      void bell.offsetWidth;
      bell.classList.add("has-new");
      setTimeout(function () {
        bell.classList.remove("has-new");
      }, 2000);
    }
  }

  // ── TOAST UI ────────────────────────────────────────────────
  function showToastNotification(type, label, summary) {
    var container = document.getElementById("toastContainer");
    if (!container) return;

    var isTactics = type === "tactics";
    var iconSymbol = isTactics ? "strategy" : "fitness_center";
    var btnLabel = isTactics ? "View Tactics" : "View Training";
    var btnIcon = isTactics ? "visibility" : "fitness_center";
    var btnHref = isTactics
      ? NOTIF_CONFIG.tacticsLink
      : NOTIF_CONFIG.trainingLink;

    var toast = document.createElement("div");
    toast.className = "tac-toast";

    toast.innerHTML =
      '<div class="tac-toast-header">' +
      '<div class="tac-toast-icon">' +
      '<span class="material-symbols-outlined">' +
      iconSymbol +
      "</span>" +
      "</div>" +
      '<div class="tac-toast-meta">' +
      '<div class="tac-toast-label">' +
      escHtml(label) +
      "</div>" +
      '<div class="tac-toast-time">' +
      escHtml(NOTIF_CONFIG.coachName) +
      " · Just now</div>" +
      "</div>" +
      '<button class="tac-toast-dismiss" title="Dismiss">' +
      '<span class="material-symbols-outlined">close</span>' +
      "</button>" +
      "</div>" +
      '<div class="tac-toast-body">' +
      '<div class="tac-toast-changes">' +
      '<div class="tac-toast-change-item change-personal">' +
      '<span class="material-symbols-outlined">info</span>' +
      "<span>" +
      escHtml(summary) +
      "</span>" +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="tac-toast-footer">' +
      '<a class="tac-toast-action-btn" href="' +
      btnHref +
      '">' +
      '<span class="material-symbols-outlined">' +
      btnIcon +
      "</span>" +
      escHtml(btnLabel) +
      "</a>" +
      "</div>" +
      '<div class="tac-toast-progress" style="animation-duration:' +
      NOTIF_CONFIG.toastDuration +
      'ms"></div>';

    container.appendChild(toast);

    toast
      .querySelector(".tac-toast-dismiss")
      .addEventListener("click", function () {
        removeToast(toast);
      });

    var autoDismiss = setTimeout(function () {
      removeToast(toast);
    }, NOTIF_CONFIG.toastDuration);

    toast.addEventListener("mouseenter", function () {
      clearTimeout(autoDismiss);
      var p = toast.querySelector(".tac-toast-progress");
      if (p) p.style.animationPlayState = "paused";
    });

    toast.addEventListener("mouseleave", function () {
      var p = toast.querySelector(".tac-toast-progress");
      if (p) p.style.animationPlayState = "running";
      autoDismiss = setTimeout(function () {
        removeToast(toast);
      }, 3000);
    });
  }

  function removeToast(toast) {
    if (toast.classList.contains("removing")) return;
    toast.classList.add("removing");
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  /* ═══════════════════════════════════════════════════════════
     AUTO-INIT (singleton — only runs once per page load)
     ═══════════════════════════════════════════════════════════ */
  function boot() {
    if (_initialized) return;
    _initialized = true;
    try {
      ensureDOM();
      initNotifBell();
      initChangeDetection();
    } catch (e) {
      console.warn("[Notif] Init error:", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
