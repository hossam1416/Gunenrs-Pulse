function getSectionById(id) {
  return (
    SECTIONS.find(function (s) {
      return s.id === id;
    }) || null
  );
}
function getDrillById(secId, dId) {
  var s = getSectionById(secId);
  return s
    ? s.drills.find(function (d) {
        return d.id === dId;
      }) || null
    : null;
}
function getPlayerById(id) {
  return (
    PLAYERS.find(function (p) {
      return p.id === id;
    }) || null
  );
}
function escHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function intensityBadgeClass(i) {
  var v = (i || "").toLowerCase();
  if (v === "hard") return "danger";
  if (v === "med" || v === "medium") return "warning";
  if (v === "easy" || v === "reg") return "success";
  return "secondary";
}
function medicalBadgeClass(m) {
  switch ((m || "").toLowerCase()) {
    case "fit":
      return "success";
    case "injured":
      return "danger";
    default:
      return "warning";
  }
}

var TrainPageSessionState = {
  KEY: "gp_published_session",
  default: function () {
    return {
      activeSectionId: "passing",
      activeDrillId: "p1",
      playerIds: [12, 7, 2],
      drillPlayerMap: {},
      date: new Date().toISOString().slice(0, 10),
      startTime: "10:00",
      duration: 60,
    };
  },
  get: function () {
    try {
      var r = localStorage.getItem(this.KEY);
      return r ? JSON.parse(r) : this.default();
    } catch (e) {
      return this.default();
    }
  },
};

var TRAIN_THEME_KEY = "gp_theme";
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(TRAIN_THEME_KEY, t);
  var i = document.getElementById("themeIcon");
  if (i) i.textContent = t === "dark" ? "light_mode" : "dark_mode";
  var l = document.getElementById("siteLogo");
  if (l)
    l.src = t === "dark" ? "/static/images/dark_gun.jpg" : "/static/images/white_gun.jpg";
}
function toggleTheme() {
  applyTheme(
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "light"
      : "dark",
  );
}
function initTheme() {
  applyTheme(localStorage.getItem(TRAIN_THEME_KEY) || "light");
}
function initSidebar() {
  var sb = document.getElementById("sidebar");
  var hm = document.getElementById("hamburgerBtn");
  var ov = document.getElementById("mobOverlay");
  if (!sb) return;
  hm.addEventListener("click", function () {
    sb.classList.add("mob-open");
    ov && ov.classList.add("active");
  });
  ov.addEventListener("click", function () {
    sb.classList.remove("mob-open");
    ov && ov.classList.remove("active");
  });
}

/* ================================================================
   MAIN INIT
   ================================================================ */

document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);
  initSidebar();

  var PLAYER_ID =
    parseInt(TRAINING_DATA.currentPlayerId) ||
    null;
  var currentPlayer = getPlayerById(PLAYER_ID);

  if (!currentPlayer) {
    var view = document.getElementById("view-session");
    if (view) {
      view.innerHTML =
        '<div class="p-4 text-center text-secondary fw-bold">No player profile is linked to this account.</div>';
    }
    return;
  }

  var headerName = document.getElementById("player-header-name");
  var headerAvatar = document.getElementById("player-header-avatar");
  if (headerName) headerName.textContent = currentPlayer.name;
  if (headerAvatar) {
    headerAvatar.src = currentPlayer.img;
    headerAvatar.alt = currentPlayer.name;
  }

  var session = TrainPageSessionState.get();
  var rawMap = session.drillPlayerMap || {};

  var myDrills = [];
  for (var drillId in rawMap) {
    if (!rawMap.hasOwnProperty(drillId)) continue;
    var playerIds = rawMap[drillId];
    if (!playerIds || !playerIds.includes(PLAYER_ID)) continue;
    for (var si = 0; si < SECTIONS.length; si++) {
      var sec = SECTIONS[si];
      var d = null;
      for (var di = 0; di < sec.drills.length; di++) {
        if (sec.drills[di].id === drillId) {
          d = sec.drills[di];
          break;
        }
      }
      if (d) {
        var teammates = [];
        for (var pi = 0; pi < playerIds.length; pi++) {
          var p = getPlayerById(playerIds[pi]);
          if (p && p.id !== PLAYER_ID) teammates.push(p);
        }
        myDrills.push({ drill: d, section: sec, teammates: teammates });
        break;
      }
    }
  }

  var hasDrills = myDrills.length > 0;

  var currentSection = getSectionById(session.activeSectionId) || SECTIONS[0];
  var currentDrill =
    getDrillById(currentSection.id, session.activeDrillId) ||
    currentSection.drills[0];

  var tabsEl = document.getElementById("section-tabs");
  var heroTagsEl = document.getElementById("hero-tags");
  var heroTitleEl = document.getElementById("hero-title");
  var heroDescEl = document.getElementById("hero-desc");
  var carouselEl = document.getElementById("drill-carousel");
  var playerListEl = document.getElementById("player-list");
  var playerCountEl = document.getElementById("player-count");
  var myDrillsGrid = document.getElementById("my-drills-grid");
  var sessionViewContent = document.getElementById("session-view-content");
  var myDrillsContent = document.getElementById("my-drills-content");
  var viewSession = document.getElementById("view-session");
  var viewFulldrill = document.getElementById("view-fulldrill");
  var drillLink = document.getElementById("startDrillModeLink");

  function getMyDrillsForSection(secId) {
    return myDrills.filter(function (e) {
      return e.section.id === secId;
    });
  }
  function getTeammatesForDrill(drillId) {
    var e = null;
    for (var i = 0; i < myDrills.length; i++) {
      if (myDrills[i].drill.id === drillId) {
        e = myDrills[i];
        break;
      }
    }
    return e ? e.teammates : [];
  }

  function emptyStateHtml(icon, title, sub) {
    return (
      '<div class="empty-state">' +
      '<span class="material-symbols-outlined" style="font-size:56px;opacity:.25;color:var(--text-3)">' +
      icon +
      "</span>" +
      '<p class="fw-bold text-secondary mb-0" style="font-size:15px">' +
      escHtml(title) +
      "</p>" +
      '<p class="text-secondary mb-0" style="font-size:13px;max-width:340px">' +
      escHtml(sub) +
      "</p>" +
      "</div>"
    );
  }

  function renderMeta() {
    var ds = "—";
    try {
      ds = new Date(session.date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {}
    var eD = document.getElementById("meta-date-bar");
    var eDu = document.getElementById("meta-dur-bar");
    var eC = document.getElementById("meta-drill-count");
    if (eD) eD.textContent = ds;
    if (eDu) eDu.textContent = session.duration + " Min Session";
    if (eC) eC.textContent = myDrills.length + " drills";
  }

  function renderTabs() {
    tabsEl.innerHTML = SECTIONS.map(function (s) {
      return (
        '<button class="nav-link ' +
        (s.id === currentSection.id ? "active" : "") +
        ' s-tab" data-sec="' +
        s.id +
        '">' +
        '<span class="material-symbols-outlined me-1" style="font-size:14px;vertical-align:-3px">' +
        s.icon +
        "</span>" +
        escHtml(s.name) +
        "</button>"
      );
    }).join("");
    tabsEl.querySelectorAll("[data-sec]").forEach(function (b) {
      b.addEventListener("click", function () {
        currentSection = getSectionById(b.dataset.sec);
        var m = getMyDrillsForSection(currentSection.id);
        currentDrill = m.length ? m[0].drill : currentSection.drills[0];
        renderAll();
      });
    });
  }

  function renderHero() {
    var myD = getMyDrillsForSection(currentSection.id);
    var assigned = myD.length > 0;

    if (!currentDrill) {
      heroTagsEl.innerHTML = "";
      heroTitleEl.textContent = currentSection.name;
      heroDescEl.textContent = currentSection.description;
      heroTitleEl.style.fontSize = "42px";
      if (drillLink) {
        drillLink.onclick = function (e) {
          e.preventDefault();
        };
        drillLink.style.opacity = "0.4";
        drillLink.style.pointerEvents = "none";
      }
      return;
    }

    heroTitleEl.style.fontSize = "";
    if (drillLink) {
      drillLink.style.opacity = assigned ? "" : "0.4";
      drillLink.style.pointerEvents = assigned ? "" : "none";
    }
    var iB = intensityBadgeClass(currentDrill.intensity);
    heroTagsEl.innerHTML =
      '<span class="badge bg-secondary me-1">' +
      escHtml(currentSection.name) +
      "</span>" +
      '<span class="badge bg-danger me-1">' +
      escHtml(currentDrill.focusLabel) +
      "</span>" +
      '<span class="badge bg-' +
      iB +
      ' me-1">' +
      escHtml(currentDrill.intensity) +
      "</span>" +
      '<span class="badge bg-primary">' +
      currentDrill.duration +
      " min</span>";
    heroTitleEl.textContent = currentDrill.name;
    heroDescEl.textContent = currentDrill.description;
    if (drillLink && assigned) {
      drillLink.onclick = function (e) {
        e.preventDefault();
        openFullDrillMode();
      };
    }
  }

  function renderCarousel() {
    var myD = getMyDrillsForSection(currentSection.id);
    var displayDrills =
      myD.length > 0
        ? myD
        : currentSection.drills.map(function (d) {
            return { drill: d, section: currentSection, teammates: [] };
          });

    if (!displayDrills.length) {
      carouselEl.innerHTML = "";
      return;
    }
    carouselEl.innerHTML = displayDrills
      .map(function (e) {
        var a = e.drill.id === currentDrill.id;
        var iB = intensityBadgeClass(e.drill.intensity);
        var pills = (e.drill.attrs || [])
          .slice(0, 3)
          .map(function (at) {
            return (
              '<span class="badge bg-secondary bg-opacity-50 me-1" style="font-size:9px">' +
              escHtml(at) +
              "</span>"
            );
          })
          .join("");
        return (
          '<div class="d-card card border-2 ' +
          (a ? "border-danger text-danger" : "border-0") +
          ' flex-shrink-0" style="min-width:200px;cursor:pointer;background:var(--drill-bg)" data-drill="' +
          e.drill.id +
          '">' +
          '<div class="card-body p-3">' +
          '<div class="d-flex justify-content-between align-items-start mb-2">' +
          '<span class="fw-bold text-uppercase" style="font-size:11px;letter-spacing:.04em;color:var(--drill-name)">' +
          escHtml(e.drill.shortName) +
          "</span>" +
          '<span class="badge bg-' +
          iB +
          '" style="font-size:9px">' +
          escHtml(e.drill.intensity) +
          "</span>" +
          "</div><div>" +
          pills +
          "</div></div></div>"
        );
      })
      .join("");
    carouselEl.querySelectorAll("[data-drill]").forEach(function (c) {
      c.addEventListener("click", function (e) {
        e.stopPropagation();
        var f = null;
        for (var i = 0; i < displayDrills.length; i++) {
          if (displayDrills[i].drill.id === c.dataset.drill) {
            f = displayDrills[i];
            break;
          }
        }
        if (!f) return;
        currentDrill = f.drill;
        renderAll();
        setTimeout(function () {
          c.scrollIntoView({ behavior: "smooth", inline: "center" });
        }, 50);
      });
    });
    var ac = carouselEl.querySelector(".border-danger");
    if (ac)
      setTimeout(function () {
        ac.scrollIntoView({ behavior: "smooth", inline: "center" });
      }, 80);
  }

  function renderTeammates() {
    var myD = getMyDrillsForSection(currentSection.id);
    var assigned = myD.length > 0;

    if (!assigned || !currentDrill) {
      playerCountEl.textContent = "0";
      playerListEl.innerHTML = emptyStateHtml("person_off", "No Teammates", "");
      return;
    }
    var tm = getTeammatesForDrill(currentDrill.id);
    playerCountEl.textContent = tm.length;
    if (!tm.length) {
      playerListEl.innerHTML =
        '<div class="text-center py-4 text-secondary">' +
        '<span class="material-symbols-outlined d-block mb-2" style="font-size:32px;opacity:.3">person_off</span>' +
        '<small class="text-uppercase fw-bold" style="letter-spacing:.08em;font-size:10px">Solo drill</small></div>';
      return;
    }
    playerListEl.innerHTML = tm
      .map(function (p) {
        var fP = p.fitness;
        var fC = fP >= 90 ? "success" : fP >= 75 ? "warning" : "danger";
        var mC = medicalBadgeClass(p.medical);
        return (
          '<div class="p-card card border-0 mb-2 p-2" style="background:var(--pcrd-bg)">' +
          '<div class="d-flex align-items-center gap-2">' +
          '<img src="' +
          escHtml(p.img) +
          '" alt="' +
          escHtml(p.name) +
          '" width="38" height="38" class="rounded-circle object-fit-cover border flex-shrink-0" onerror="this.style.opacity=\'0\'"/>' +
          '<div class="flex-grow-1 min-w-0">' +
          '<div class="fw-bold" style="font-size:13px">' +
          escHtml(p.short) +
          "</div>" +
          '<div class="text-uppercase fw-bold" style="font-size:10px;color:var(--text-3)">' +
          escHtml(p.pos) +
          " · #" +
          p.number +
          "</div>" +
          "</div></div>" +
          '<div class="mt-2 d-flex align-items-center gap-2">' +
          '<div class="flex-grow-1"><div class="progress" style="height:4px;border-radius:2px">' +
          '<div class="progress-bar bg-' +
          fC +
          '" style="width:' +
          fP +
          '%"></div></div></div>' +
          '<small class="fw-bold text-' +
          fC +
          '" style="font-size:10px">' +
          fP +
          "%</small>" +
          '<span class="badge bg-' +
          mC +
          '" style="font-size:9px">' +
          escHtml(p.medical) +
          "</span>" +
          "</div></div>"
        );
      })
      .join("");
  }

  function renderMyDrillsGrid() {
    if (!hasDrills) {
      myDrillsGrid.innerHTML = emptyStateHtml(
        "fitness_center",
        "No Drills Assigned",
        "The coach hasn't assigned any drills to you for this session.",
      );
      return;
    }
    var totalMins = 0;
    for (var i = 0; i < myDrills.length; i++)
      totalMins += myDrills[i].drill.duration;
    var headerHtml =
      '<div class="col-12 mb-3">' +
      '<div class="d-flex align-items-center gap-3 flex-wrap">' +
      '<div><span class="fw-black text-uppercase" style="font-size:20px;letter-spacing:-1px">' +
      myDrills.length +
      " Drills Assigned</span>" +
      '<span class="text-secondary ms-2" style="font-size:13px">' +
      totalMins +
      " min total</span></div>" +
      '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 d-flex align-items-center gap-1 px-3 py-2" style="font-size:12px">' +
      '<span class="material-symbols-outlined" style="font-size:14px">person</span>' +
      escHtml(currentPlayer.pos) +
      " · #" +
      currentPlayer.number +
      "</span></div></div>";

    var cardsHtml = myDrills
      .map(function (e, i) {
        var iB = intensityBadgeClass(e.drill.intensity);
        var pills = (e.drill.attrs || [])
          .slice(0, 4)
          .map(function (at) {
            return (
              '<span class="badge bg-secondary bg-opacity-50" style="font-size:9px">' +
              escHtml(at) +
              "</span>"
            );
          })
          .join(" ");
        var tmImgs = e.teammates.length
          ? '<div class="mt-2 pt-2" style="border-top:1px solid var(--border)"><div class="d-flex gap-1">' +
            e.teammates
              .slice(0, 5)
              .map(function (t) {
                return (
                  '<img src="' +
                  escHtml(t.img) +
                  '" alt="' +
                  escHtml(t.short) +
                  '" width="24" height="24" class="rounded-circle border" style="border-color:var(--border);object-fit:cover" onerror="this.style.display=\'none\'" title="' +
                  escHtml(t.name) +
                  '"/>'
                );
              })
              .join("") +
            (e.teammates.length > 5
              ? '<span class="fw-bold text-secondary" style="font-size:10px;align-self:center">+' +
                (e.teammates.length - 5) +
                "</span>"
              : "") +
            "</div></div>"
          : "";
        return (
          '<div class="my-drill-card" data-goto-sec="' +
          e.section.id +
          '" data-goto-drill="' +
          e.drill.id +
          '">' +
          '<div class="d-flex align-items-start gap-3 mb-2">' +
          '<div class="drill-num">' +
          (i + 1) +
          "</div>" +
          '<div class="flex-grow-1">' +
          '<div class="fw-bold text-uppercase" style="font-size:10px;color:var(--text-3);letter-spacing:.1em;margin-bottom:2px">' +
          escHtml(e.section.name) +
          "</div>" +
          '<div class="fw-black text-uppercase" style="font-size:16px;letter-spacing:-.5px;line-height:1.1">' +
          escHtml(e.drill.name) +
          "</div>" +
          '</div><span class="badge bg-' +
          iB +
          '" style="font-size:10px">' +
          escHtml(e.drill.intensity) +
          "</span></div>" +
          '<p class="text-secondary mb-2" style="font-size:12px;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' +
          escHtml(e.drill.description) +
          "</p>" +
          '<div class="d-flex align-items-center justify-content-between"><div class="d-flex gap-1 flex-wrap">' +
          pills +
          "</div>" +
          '<div class="d-flex align-items-center gap-2"><span class="fw-bold text-secondary" style="font-size:11px">' +
          e.drill.duration +
          " min</span>" +
          '<span class="material-symbols-outlined text-secondary" style="font-size:16px">arrow_forward</span></div></div>' +
          tmImgs +
          "</div>"
        );
      })
      .join("");

    myDrillsGrid.innerHTML = headerHtml + cardsHtml;

    myDrillsGrid.querySelectorAll("[data-goto-sec]").forEach(function (c) {
      c.addEventListener("click", function () {
        currentSection = getSectionById(c.dataset.gotoSec);
        var m = getMyDrillsForSection(currentSection.id);
        currentDrill =
          m.find(function (e) {
            return e.drill.id === c.dataset.gotoDrill;
          }).drill ||
          m[0].drill ||
          currentSection.drills[0];
        switchView("session");
        renderAll();
      });
    });
  }

  function switchView(v) {
    document.querySelectorAll(".view-tab").forEach(function (t) {
      t.classList.toggle("active", t.dataset.view === v);
    });
    if (v === "session") {
      sessionViewContent.style.display = "";
      myDrillsContent.style.display = "none";
    } else {
      sessionViewContent.style.display = "none";
      myDrillsContent.style.display = "flex";
      renderMyDrillsGrid();
    }
  }
  document.querySelectorAll(".view-tab").forEach(function (t) {
    t.addEventListener("click", function () {
      switchView(t.dataset.view);
    });
  });

  /* ── Video Overlay ── */
  var videoOverlay = document.getElementById("videoOverlay");
  var videoIframe = document.getElementById("videoIframe");
  document
    .getElementById("watchVideoBtn")
    .addEventListener("click", function () {
      if (!currentDrill || !currentDrill.video) return;
      document.getElementById("videoOverlayTitle").textContent =
        currentDrill.name;
      videoIframe.src = currentDrill.video + "?autoplay=1&rel=0";
      videoOverlay.classList.add("open");
    });
  var closeVideo = function () {
    videoIframe.src = "";
    videoOverlay.classList.remove("open");
  };
  document
    .getElementById("closeVideoBtn")
    .addEventListener("click", closeVideo);
  videoOverlay.addEventListener("click", function (e) {
    if (e.target === videoOverlay) closeVideo();
  });
  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Escape" &&
      videoOverlay &&
      videoOverlay.classList.contains("open")
    )
      closeVideo();
  });

  /* ── Mobile Squad Toggle ── */
  (function () {
    var p = document.querySelector(".player-panel");
    var b = document.querySelector(".bottom-bar-content");
    if (!p || !b) return;
    var o = document.createElement("div");
    o.className = "squad-overlay";
    document.body.appendChild(o);
    var btn = document.createElement("button");
    btn.className = "mobile-squad-toggle";
    btn.innerHTML =
      '<span class="material-symbols-outlined">group</span>Teammates';
    b.appendChild(btn);
    btn.addEventListener("click", function () {
      p.classList.add("mobile-open");
      o.classList.add("active");
    });
    o.addEventListener("click", function () {
      p.classList.remove("mobile-open");
      o.classList.remove("active");
    });
    var ty = 0;
    p.addEventListener("touchstart", function (e) {
      ty = e.touches[0].clientY;
    });
    p.addEventListener("touchend", function (e) {
      if (e.changedTouches[0].clientY - ty > 60) {
        p.classList.remove("mobile-open");
        o.classList.remove("active");
      }
    });
  })();

  /* ═══════ FULL DRILL MODE ═══════ */
  var RING_CIRC = 2 * Math.PI * 54;

  function openFullDrillMode() {
    if (!hasDrills) return;
    var startIdx = -1;
    for (var fi = 0; fi < myDrills.length; fi++) {
      if (
        myDrills[fi].drill.id === currentDrill.id &&
        myDrills[fi].section.id === currentSection.id
      ) {
        startIdx = fi;
        break;
      }
    }
    var queue =
      startIdx >= 0
        ? myDrills.slice(startIdx).concat(myDrills.slice(0, startIdx))
        : myDrills.slice();
    if (!queue.length) return;

    viewSession.style.display = "none";
    viewFulldrill.style.display = "flex";

    var idx = 0,
      repCount = 1,
      currentRep = 1,
      timerTotal = 0,
      timerLeft = 0,
      timerRunning = true,
      timerInt = null,
      nextCdVal = 5,
      nextCdInt = null;

    viewFulldrill.innerHTML =
      '<div class="fd-body">' +
      '<div class="d-flex align-items-center justify-content-between gap-2 px-4 py-2 border-bottom flex-wrap" style="background:var(--bg-card)">' +
      '<div class="d-flex align-items-center gap-2 flex-wrap">' +
      '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 d-flex align-items-center gap-1 px-3 py-2">' +
      '<span class="material-symbols-outlined" style="font-size:14px">fitness_center</span><span id="fd-cs">My Training</span></span>' +
      '<span class="fw-bold text-uppercase text-secondary" style="font-size:11px;letter-spacing:.08em" id="fd-cc">Drill 1 / ' +
      queue.length +
      "</span></div>" +
      '<div class="d-flex gap-2 flex-wrap">' +
      '<button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" id="fd-bb"><span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>Back</button>' +
      '<button class="btn btn-secondary btn-sm d-flex align-items-center gap-1" id="fd-br"><span class="material-symbols-outlined" style="font-size:16px">restart_alt</span>Restart</button>' +
      '<button class="btn btn-danger btn-sm d-flex align-items-center gap-1" id="fd-bn"><span class="material-symbols-outlined" style="font-size:16px">skip_next</span>Next</button></div></div>' +
      '<div class="fd-main"><div class="fd-hero">' +
      '<div class="d-flex align-items-start gap-4 flex-wrap">' +
      '<div class="d-flex flex-column align-items-center gap-2 flex-shrink-0">' +
      '<div class="fd-timer-ring-container"><svg class="fd-timer-ring-svg" viewBox="0 0 120 120">' +
      '<circle class="fd-timer-ring-bg" cx="60" cy="60" r="54"/>' +
      '<circle class="fd-timer-ring-fg" id="fd-ring" cx="60" cy="60" r="54"/></svg>' +
      '<div class="fd-timer-label"><span class="fd-timer-time" id="fd-time">00:00</span><span class="fd-timer-unit">min</span></div></div>' +
      '<div class="d-flex gap-2">' +
      '<button class="fd-tc-btn" id="fd-rw" title="+30s"><span class="material-symbols-outlined">replay_30</span></button>' +
      '<button class="fd-tc-btn fd-tc-active" id="fd-pl"><span class="material-symbols-outlined" id="fd-pi">pause</span></button>' +
      '<button class="fd-tc-btn" id="fd-rs" title="Reset"><span class="material-symbols-outlined">refresh</span></button></div></div>' +
      '<div class="flex-grow-1">' +
      '<p class="fw-bold text-uppercase text-danger mb-1" style="font-size:10px;letter-spacing:.15em" id="fd-sec">—</p>' +
      '<h2 class="fd-drill-name" id="fd-nm">—</h2>' +
      '<div class="d-flex flex-wrap gap-1 mb-2" id="fd-tg"></div>' +
      '<p class="text-secondary mb-0" style="font-size:14px;line-height:1.7;max-width:500px" id="fd-ds">—</p></div></div>' +
      '<div><p class="fw-bold text-uppercase mb-2" style="font-size:10px;color:var(--text-3);letter-spacing:.1em" id="fd-pl2">0 teammates</p>' +
      '<div id="fd-ch" class="d-flex flex-wrap gap-1"></div></div>' +
      '<div class="d-flex align-items-center gap-2 flex-wrap">' +
      '<span class="fw-bold text-uppercase text-secondary" style="font-size:11px;letter-spacing:.08em">Repeat:</span>' +
      '<div class="d-flex gap-1">' +
      '<button class="fd-replay-chip active" data-rep="1">x1</button>' +
      '<button class="fd-replay-chip" data-rep="2">x2</button>' +
      '<button class="fd-replay-chip" data-rep="3">x3</button></div>' +
      '<span class="fw-bold text-secondary ms-2" style="font-size:11px" id="fd-rs2"></span></div>' +
      '<div><div class="d-flex justify-content-between mb-1" style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em">' +
      '<span>Progress</span><span id="fd-pc">0%</span></div>' +
      '<div class="progress" style="height:4px;border-radius:2px"><div class="progress-bar bg-danger" id="fd-pg" style="width:0%"></div></div></div></div>' +
      '<div class="fd-sidebar-panel"><div class="p-3 border-bottom">' +
      '<p class="fw-bold text-uppercase mb-0" style="font-size:11px;letter-spacing:.12em;color:var(--text-2)">Drill Queue</p>' +
      '<p class="text-secondary mb-0" style="font-size:10px" id="fd-qs">0 drills · 0 min</p></div></div>' +
      '<div class="fd-queue-list" id="fd-ql"></div></div></div>' +
      '<div class="fd-next-overlay" id="fd-no"><div class="fd-next-box">' +
      '<p class="fw-bold text-uppercase text-danger mb-2" style="font-size:10px;letter-spacing:.2em">Up Next</p>' +
      '<h3 class="fw-black text-uppercase mb-1" style="font-style:italic;letter-spacing:-1px" id="fd-nn">—</h3>' +
      '<p class="text-secondary mb-4" style="font-size:12px" id="fd-nd">—</p>' +
      '<div class="fd-next-countdown" id="fd-nc">5</div>' +
      '<div class="d-flex gap-2 justify-content-center flex-wrap">' +
      '<button class="btn btn-danger d-flex align-items-center gap-1" id="fd-ns"><span class="material-symbols-outlined" style="font-size:16px">skip_next</span>Start Now</button>' +
      '<button class="btn btn-outline-secondary d-flex align-items-center gap-1" id="fd-nst"><span class="material-symbols-outlined" style="font-size:16px">pause</span>Stay Here</button></div></div></div>' +
      '<div class="fd-finish-overlay" id="fd-fo"><div class="fd-finish-box">' +
      '<div class="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4" style="width:80px;height:80px;background:rgba(34,197,94,.1);border:2px solid rgba(34,197,94,.3)">' +
      '<span class="material-symbols-outlined text-success" style="font-size:40px;font-variation-settings:\'FILL\' 1">check_circle</span></div>' +
      '<h2 class="fw-black text-uppercase mb-2" style="letter-spacing:-1px">Session Complete!</h2>' +
      '<p class="text-secondary mb-4" id="fd-fs">Great work today.</p>' +
      '<div class="row g-0 border rounded-3 overflow-hidden mb-4">' +
      '<div class="col text-center py-3 border-end"><div class="fw-black mb-1" style="font-size:22px" id="fd-sd">0</div><div class="fw-bold text-uppercase text-secondary" style="font-size:10px;letter-spacing:.08em">Drills</div></div>' +
      '<div class="col text-center py-3 border-end"><div class="fw-black mb-1" style="font-size:22px" id="fd-st">0 min</div><div class="fw-bold text-uppercase text-secondary" style="font-size:10px;letter-spacing:.08em">Total Time</div></div>' +
      '<div class="col text-center py-3"><div class="fw-black mb-1" style="font-size:22px" id="fd-sp">0</div><div class="fw-bold text-uppercase text-secondary" style="font-size:10px;letter-spacing:.08em">Teammates</div></div></div>' +
      '<div class="d-flex gap-2 justify-content-center flex-wrap">' +
      '<button class="btn btn-danger d-flex align-items-center gap-1" id="fd-fd"><span class="material-symbols-outlined" style="font-size:16px">check</span>Done</button>' +
      '<button class="btn btn-secondary d-flex align-items-center gap-1" id="fd-fr"><span class="material-symbols-outlined" style="font-size:16px">restart_alt</span>Restart</button></div></div></div></div>';

    var $ = function (id) {
      return document.getElementById(id);
    };
    var ring = $("fd-ring"),
      timeEl = $("fd-time"),
      pIcon = $("fd-pi"),
      pBtn = $("fd-pl"),
      secEl = $("fd-sec"),
      nmEl = $("fd-nm"),
      tgEl = $("fd-tg"),
      dsEl = $("fd-ds"),
      plEl = $("fd-pl2"),
      chEl = $("fd-ch"),
      rsEl = $("fd-rs2"),
      pgEl = $("fd-pg"),
      pcEl = $("fd-pc"),
      ccEl = $("fd-cc"),
      ql = $("fd-ql"),
      nOv = $("fd-no"),
      fOv = $("fd-fo");

    var ds2 = "—";
    try {
      ds2 = new Date(session.date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
    } catch (e) {}
    $("fd-cs").textContent = "Session · " + ds2;

    function startT(s) {
      clearInterval(timerInt);
      timerTotal = s;
      timerLeft = s;
      timerRunning = true;
      pIcon.textContent = "pause";
      pBtn.classList.add("fd-tc-active");
      updT();
      timerInt = setInterval(tick, 1000);
    }
    function tick() {
      if (!timerRunning) return;
      timerLeft = Math.max(0, timerLeft - 1);
      updT();
      if (timerLeft === 0) {
        clearInterval(timerInt);
        timerRunning = false;
        onUp();
      }
    }
    function updT() {
      var m = Math.floor(timerLeft / 60),
        s = timerLeft % 60;
      timeEl.textContent =
        String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
      var f = timerTotal > 0 ? timerLeft / timerTotal : 1;
      ring.style.strokeDashoffset = RING_CIRC * (1 - f);
      ring.classList.remove("fd-ring-warning", "fd-ring-danger");
      if (f < 0.15) ring.classList.add("fd-ring-danger");
      else if (f < 0.3) ring.classList.add("fd-ring-warning");
    }
    function onUp() {
      if (currentRep < repCount) {
        currentRep++;
        updR();
        startT(timerTotal);
        return;
      }
      if (idx < queue.length - 1) showN();
      else showF();
    }
    function updR() {
      rsEl.textContent =
        repCount > 1 ? "Rep " + currentRep + " of " + repCount : "";
    }

    pBtn.addEventListener("click", function () {
      timerRunning = !timerRunning;
      if (timerRunning) {
        pIcon.textContent = "pause";
        pBtn.classList.add("fd-tc-active");
        timerInt = setInterval(tick, 1000);
      } else {
        clearInterval(timerInt);
        pIcon.textContent = "play_arrow";
        pBtn.classList.remove("fd-tc-active");
      }
    });
    $("fd-rw").addEventListener("click", function () {
      timerLeft = Math.min(timerLeft + 30, timerTotal);
      updT();
    });
    $("fd-rs").addEventListener("click", function () {
      clearInterval(timerInt);
      currentRep = 1;
      updR();
      startT(queue[idx].drill.duration * 60);
    });

    function renderD(i) {
      idx = i;
      currentRep = 1;
      var drill = queue[i].drill;
      var sec = queue[i].section;
      var tm = queue[i].teammates;
      secEl.textContent = sec.name;
      nmEl.textContent = drill.name;
      dsEl.textContent = drill.description;
      var iB = intensityBadgeClass(drill.intensity);
      tgEl.innerHTML =
        '<span class="badge bg-secondary me-1">' +
        escHtml(sec.name) +
        "</span>" +
        '<span class="badge bg-danger me-1">' +
        escHtml(drill.focusLabel) +
        "</span>" +
        '<span class="badge bg-' +
        iB +
        ' me-1">' +
        escHtml(drill.intensity) +
        "</span>" +
        '<span class="badge bg-primary me-1">' +
        drill.duration +
        " min</span>" +
        (drill.attrs || [])
          .map(function (at) {
            return (
              '<span class="badge bg-secondary bg-opacity-50 me-1">' +
              escHtml(at) +
              "</span>"
            );
          })
          .join("");
      var allPlayers =
        tm.length > 0
          ? tm
          : [
              {
                short: currentPlayer.short,
                pos: currentPlayer.pos,
                img: currentPlayer.img,
              },
            ];
      plEl.textContent =
        allPlayers.length <= 1
          ? allPlayers.length === 1
            ? "Solo drill"
            : "No players"
          : allPlayers.length + " Teammates";
      chEl.innerHTML = allPlayers
        .map(function (p) {
          return (
            '<div class="fd-player-chip d-inline-flex align-items-center gap-1 border rounded-pill px-2 py-1 me-1 mb-1" style="font-size:11px;background:var(--bg-muted)">' +
            '<img src="' +
            escHtml(p.img) +
            '" alt="' +
            escHtml(p.short || p.name) +
            '" width="22" height="22" class="rounded-circle object-fit-cover" onerror="this.style.display=\'none\'"/>' +
            escHtml(p.short || p.name) +
            '<span class="text-secondary" style="font-size:9px">' +
            escHtml(p.pos) +
            "</span></div>"
          );
        })
        .join("");
      ccEl.textContent = "Drill " + (i + 1) + " / " + queue.length;
      var pct = Math.round((i / queue.length) * 100);
      pgEl.style.width = pct + "%";
      pcEl.textContent = pct + "%";
      updR();
      renderQ();
      startT(drill.duration * 60);
    }

    function renderQ() {
      var total = 0;
      for (var qi = 0; qi < queue.length; qi++)
        total += queue[qi].drill.duration;
      $("fd-qs").textContent =
        queue.length + " drills · " + total + " min total";
      ql.innerHTML = queue
        .map(function (e, i) {
          var done = i < idx,
            act = i === idx;
          return (
            '<div class="d-flex align-items-center gap-2 p-2 rounded-3 mb-2 border ' +
            (act
              ? "border-danger bg-danger bg-opacity-10"
              : done
                ? "opacity-50 border-0"
                : "border-0") +
            '" style="cursor:pointer;background:' +
            (act ? "" : "var(--bg-card)") +
            '" data-qi="' +
            i +
            '">' +
            '<div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ' +
            (act
              ? "bg-danger text-white"
              : "bg-secondary bg-opacity-25 text-secondary") +
            '" style="width:26px;height:26px;font-size:10px;font-weight:800">' +
            (done
              ? '<span class="material-symbols-outlined text-success" style="font-size:14px">check</span>'
              : i + 1) +
            "</div>" +
            '<div class="flex-grow-1 min-w-0"><div class="fw-bold text-truncate" style="font-size:12px;' +
            (done ? "text-decoration:line-through" : "") +
            '">' +
            escHtml(e.drill.name) +
            "</div>" +
            '<div class="text-secondary" style="font-size:10px">' +
            escHtml(e.section.name) +
            " · " +
            (e.teammates.length + 1) +
            " players</div></div>" +
            '<span class="text-secondary flex-shrink-0 fw-bold ' +
            (act ? "text-danger" : "") +
            '" style="font-size:10px">' +
            e.drill.duration +
            " min</span></div>" +
            (done
              ? '<div class="d-flex align-items-center gap-1">' +
                '<span class="badge bg-danger bg-opacity-10 text-danger" style="font-size:8px">Assigned</span></div>'
              : "") +
            "</div>"
          );
        })
        .join("");
      ql.querySelectorAll("[data-qi]").forEach(function (c) {
        c.addEventListener("click", function () {
          clearInterval(timerInt);
          clN();
          renderD(parseInt(c.dataset.qi));
        });
      });
      var ac = ql.querySelector(".border-danger");
      if (ac)
        setTimeout(function () {
          ac.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 60);
    }

    function showN() {
      var n = queue[idx + 1];
      if (!n) {
        showF();
        return;
      }
      $("fd-nn").textContent = n.drill.name;
      $("fd-nd").textContent =
        n.section.name +
        " · " +
        n.drill.duration +
        " min · " +
        (n.teammates.length + 1) +
        " players";
      nextCdVal = 5;
      $("fd-nc").textContent = nextCdVal;
      nOv.classList.add("fd-overlay-open");
      clearInterval(nextCdInt);
      nextCdInt = setInterval(function () {
        nextCdVal--;
        $("fd-nc").textContent = nextCdVal;
        if (nextCdVal <= 0) {
          clearInterval(nextCdInt);
          clN();
          renderD(idx + 1);
        }
      }, 1000);
    }
    function clN() {
      clearInterval(nextCdInt);
      nOv.classList.remove("fd-overlay-open");
    }
    $("fd-ns").addEventListener("click", function () {
      clN();
      renderD(idx + 1);
    });
    $("fd-nst").addEventListener("click", function () {
      clN();
      if (!timerRunning) {
        timerRunning = true;
        pIcon.textContent = "pause";
        pBtn.classList.add("fd-tc-active");
        timerInt = setInterval(tick, 1000);
      }
    });
    $("fd-bn").addEventListener("click", function () {
      clearInterval(timerInt);
      if (idx < queue.length - 1) showN();
      else showF();
    });
    $("fd-br").addEventListener("click", function () {
      clearInterval(timerInt);
      clearInterval(nextCdInt);
      clN();
      fOv.classList.remove("fd-overlay-open");
      renderD(0);
    });
    viewFulldrill.querySelectorAll(".fd-replay-chip").forEach(function (b) {
      b.addEventListener("click", function () {
        viewFulldrill.querySelectorAll(".fd-replay-chip").forEach(function (x) {
          x.classList.remove("active", "btn-danger");
        });
        b.classList.add("active", "btn-danger");
        repCount = parseInt(b.dataset.rep);
        currentRep = 1;
        updR();
        clearInterval(timerInt);
        startT(queue[idx].drill.duration * 60);
      });
    });
    function showF() {
      clearInterval(timerInt);
      clearInterval(nextCdInt);
      clN();
      pgEl.style.width = "100%";
      pcEl.textContent = "100%";
      renderQ();
      var allTm = {};
      for (var qi = 0; qi < queue.length; qi++) {
        for (var ti = 0; ti < queue[qi].teammates.length; ti++) {
          allTm[queue[qi].teammates[ti].id] = true;
        }
      }
      allTm[PLAYER_ID] = true;
      var tM = 0;
      for (qi = 0; qi < queue.length; qi++) tM += queue[qi].drill.duration;
      $("fd-sd").textContent = queue.length;
      $("fd-st").textContent = tM + " min";
      $("fd-sp").textContent = Object.keys(allTm).length;
      $("fd-fs").textContent =
        queue.length + " drills completed. Excellent session!";
      fOv.classList.add("fd-overlay-open");
    }
    $("fd-fd").addEventListener("click", closeFDM);
    $("fd-fr").addEventListener("click", function () {
      fOv.classList.remove("fd-overlay-open");
      renderD(0);
    });
    $("fd-bb").addEventListener("click", closeFDM);
    renderD(0);
  }

  function closeFDM() {
    viewFulldrill.style.display = "none";
    viewFulldrill.innerHTML = "";
    viewSession.style.display = "flex";
    renderAll();
  }

  function renderAll() {
    renderTabs();
    renderHero();
    renderCarousel();
    renderTeammates();
    renderMeta();
  }
  renderAll();
});
