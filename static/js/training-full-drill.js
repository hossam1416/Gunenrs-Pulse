document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  document
    .getElementById("themeToggle")
    ?.addEventListener("click", toggleTheme);
  initSidebar();

  /* ── Build drill queue from session state ───────────────── */
  function buildQueue() {
    const st = SessionState.get();
    const map = st.drillPlayerMap || {};
    const entries = [];

    for (const [drillId, ids] of Object.entries(map)) {
      if (!ids || ids.length === 0) continue;
      let foundDrill = null,
        foundSection = null;
      for (const sec of SECTIONS) {
        const d = sec.drills.find((d) => d.id === drillId);
        if (d) {
          foundDrill = d;
          foundSection = sec;
          break;
        }
      }
      if (!foundDrill) continue;
      entries.push({
        drill: foundDrill,
        section: foundSection,
        players: ids.map((id) => getPlayerById(id)).filter(Boolean),
      });
    }

    if (entries.length > 0) return entries;

    /* Demo fallback */
    return [
      {
        drill: SECTIONS.find((s) => s.id === "passing")?.drills[0],
        section: SECTIONS.find((s) => s.id === "passing"),
        players: [7, 12, 2, 11].map(getPlayerById).filter(Boolean),
      },
      {
        drill: SECTIONS.find((s) => s.id === "dribbling")?.drills[1],
        section: SECTIONS.find((s) => s.id === "dribbling"),
        players: [12, 11, 15, 14].map(getPlayerById).filter(Boolean),
      },
      {
        drill: SECTIONS.find((s) => s.id === "shooting")?.drills[0],
        section: SECTIONS.find((s) => s.id === "shooting"),
        players: [15, 11, 12, 16].map(getPlayerById).filter(Boolean),
      },
      {
        drill: SECTIONS.find((s) => s.id === "defending")?.drills[0],
        section: SECTIONS.find((s) => s.id === "defending"),
        players: [7, 2, 4, 5].map(getPlayerById).filter(Boolean),
      },
      {
        drill: SECTIONS.find((s) => s.id === "physical")?.drills[0],
        section: SECTIONS.find((s) => s.id === "physical"),
        players: [7, 12, 2, 11, 15, 4].map(getPlayerById).filter(Boolean),
      },
    ].filter((e) => e.drill && e.section);
  }

  const queue = buildQueue();

  if (!queue.length) {
    document.querySelector(".fd-body").innerHTML = `
      <div class="d-flex flex-column align-items-center justify-content-center h-100 gap-3 p-4 text-center">
        <span class="material-symbols-outlined text-secondary" style="font-size:56px;opacity:.4">fitness_center</span>
        <p class="fw-bold text-secondary mb-0">No drills with assigned players found.</p>
        <p class="text-secondary small">Go back to the session and assign players to at least one drill first.</p>
        <a href="/train/" class="btn btn-danger d-flex align-items-center gap-1">
          <span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>Back to Session
        </a>
      </div>`;
    return;
  }

  /* ── State ─────────────────────────────────────────────── */
  let currentIdx = 0;
  let repeatCount = 1;
  let currentRep = 1;
  let timerTotal = 0;
  let timerLeft = 0;
  let timerRunning = true;
  let timerInterval = null;
  let nextCountdownVal = 5;
  let nextCountdownInterval = null;

  const RING_CIRC = 2 * Math.PI * 54;

  /* ── DOM refs ───────────────────────────────────────────── */
  const timerDisplay = document.getElementById("timerDisplay");
  const timerRing = document.getElementById("timerRing");
  const playIcon = document.getElementById("playIcon");
  const playPauseBtn = document.getElementById("btn-play-pause");
  const heroSection = document.getElementById("hero-section");
  const heroDrillName = document.getElementById("hero-drill-name");
  const heroTags = document.getElementById("hero-tags");
  const heroDrillDesc = document.getElementById("hero-drill-desc");
  const playerChips = document.getElementById("player-chips");
  const playersLabel = document.getElementById("players-label");
  const queueList = document.getElementById("queue-list");
  const ctrlCounter = document.getElementById("ctrl-drill-counter");
  const ctrlSession = document.getElementById("ctrl-session-name");
  const progressFill = document.getElementById("progress-fill");
  const progressPct = document.getElementById("progress-pct");
  const repStatus = document.getElementById("rep-status");
  const nextOverlay = document.getElementById("nextOverlay");
  const finishOverlay = document.getElementById("finishOverlay");

  /* Session label */
  try {
    const st = SessionState.get();
    if (st.date) {
      const d = new Date(st.date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      ctrlSession.textContent = `Session · ${d}`;
    }
  } catch {}

  /* ── Timer ─────────────────────────────────────────────── */
  function startTimer(seconds) {
    clearInterval(timerInterval);
    timerTotal = seconds;
    timerLeft = seconds;
    timerRunning = true;
    playIcon.textContent = "pause";
    playPauseBtn.classList.add("fd-tc-active");
    updateTimerDisplay();
    timerInterval = setInterval(tick, 1000);
  }

  function tick() {
    if (!timerRunning) return;
    timerLeft = Math.max(0, timerLeft - 1);
    updateTimerDisplay();
    if (timerLeft === 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      onDrillTimeUp();
    }
  }

  function updateTimerDisplay() {
    const m = Math.floor(timerLeft / 60),
      s = timerLeft % 60;
    timerDisplay.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    const frac = timerTotal > 0 ? timerLeft / timerTotal : 1;
    const offset = RING_CIRC * (1 - frac);
    timerRing.style.strokeDashoffset = offset;
    timerRing.classList.remove("fd-ring-warning", "fd-ring-danger");
    if (frac < 0.15) timerRing.classList.add("fd-ring-danger");
    else if (frac < 0.3) timerRing.classList.add("fd-ring-warning");
  }

  function onDrillTimeUp() {
    if (currentRep < repeatCount) {
      currentRep++;
      updateRepStatus();
      startTimer(timerTotal);
      return;
    }
    if (currentIdx < queue.length - 1) showNextOverlay();
    else showFinish();
  }

  playPauseBtn.addEventListener("click", () => {
    timerRunning = !timerRunning;
    if (timerRunning) {
      playIcon.textContent = "pause";
      playPauseBtn.classList.add("fd-tc-active");
      timerInterval = setInterval(tick, 1000);
    } else {
      clearInterval(timerInterval);
      playIcon.textContent = "play_arrow";
      playPauseBtn.classList.remove("fd-tc-active");
    }
  });

  document.getElementById("btn-rewind").addEventListener("click", () => {
    timerLeft = Math.min(timerLeft + 30, timerTotal);
    updateTimerDisplay();
  });

  document.getElementById("btn-reset-timer").addEventListener("click", () => {
    clearInterval(timerInterval);
    currentRep = 1;
    updateRepStatus();
    startTimer(queue[currentIdx].drill.duration * 60);
  });

  /* ── Render current drill ───────────────────────────────── */
  function renderDrill(idx) {
    currentIdx = idx;
    currentRep = 1;
    const { drill, section, players } = queue[idx];

    heroSection.textContent = section.name;
    heroDrillName.textContent = drill.name;
    heroDrillDesc.textContent = drill.description;

    const iBadge = intensityBadgeClass(drill.intensity);
    heroTags.innerHTML = `
      <span class="badge bg-secondary me-1">${escHtml(section.name)}</span>
      <span class="badge bg-danger me-1">${escHtml(drill.focusLabel)}</span>
      <span class="badge bg-${iBadge} me-1">${escHtml(drill.intensity)}</span>
      <span class="badge bg-primary me-1">${drill.duration} min</span>
      ${(drill.attrs || []).map((a) => `<span class="badge bg-secondary bg-opacity-50 me-1">${escHtml(a)}</span>`).join("")}`;

    /* ★ Player chips with completion dots ★ */
    playersLabel.textContent = `${players.length} Player${players.length !== 1 ? "s" : ""} assigned`;
    playerChips.innerHTML = players
      .map((p) => {
        const isDone =
          PlayerResponses.get(drill.id, p.id)?.status === "completed";
        const dotHtml = isDone
          ? '<span class="material-symbols-outlined text-success" style="font-size:12px">check_circle</span>'
          : "";
        return `
      <div class="fd-player-chip d-inline-flex align-items-center gap-1 border rounded-pill px-2 py-1 me-1 mb-1"
           style="font-size:11px;background:var(--bg-muted)">
        <img src="${escHtml(p.img)}" alt="${escHtml(p.short)}" width="22" height="22"
             class="rounded-circle object-fit-cover" onerror="this.style.display='none'"/>
        ${escHtml(p.short)}
        <span class="text-secondary" style="font-size:9px">${escHtml(p.pos)}</span>
        ${dotHtml}
      </div>`;
      })
      .join("");

    ctrlCounter.textContent = `Drill ${idx + 1} / ${queue.length}`;
    updateProgress();
    updateRepStatus();
    renderQueue();
    startTimer(drill.duration * 60);
  }

  function updateProgress() {
    const pct = Math.round((currentIdx / queue.length) * 100);
    progressFill.style.width = pct + "%";
    progressFill.setAttribute("aria-valuenow", pct);
    progressPct.textContent = pct + "%";
  }

  function updateRepStatus() {
    repStatus.textContent =
      repeatCount > 1 ? `Rep ${currentRep} of ${repeatCount}` : "";
  }

  /* ── Queue Sidebar ─────────────────────────────────────── */
  function renderQueue() {
    const total = queue.reduce((s, e) => s + e.drill.duration, 0);
    document.getElementById("queue-sub").textContent =
      `${queue.length} drills · ${total} min total`;

    queueList.innerHTML = queue
      .map((entry, i) => {
        const isDone = i < currentIdx;
        const isActive = i === currentIdx;

        /* ★ Completion count per drill in queue ★ */
        const doneCount = entry.players.filter(
          (p) =>
            PlayerResponses.get(entry.drill.id, p.id)?.status === "completed",
        ).length;
        const countHtml =
          doneCount > 0
            ? `<span class="material-symbols-outlined text-success" style="font-size:12px" title="${doneCount}/${entry.players.length} done">check_circle</span>`
            : "";

        return `
        <div class="fd-q-card d-flex align-items-center gap-2 p-2 rounded-3 mb-2 border
                    ${isActive ? "border-danger bg-danger bg-opacity-10" : isDone ? "opacity-50 border-0" : "border-0"}"
             style="cursor:pointer;background:${isActive ? "" : "var(--bg-card)"}"
             data-qi="${i}">
          <div class="fd-q-num rounded-circle d-flex align-items-center justify-content-center flex-shrink-0
                      ${isActive ? "bg-danger text-white" : "bg-secondary bg-opacity-25 text-secondary"}"
               style="width:26px;height:26px;font-size:10px;font-weight:800">
            ${
              isDone
                ? '<span class="material-symbols-outlined text-success" style="font-size:14px">check</span>'
                : i + 1
            }
          </div>
          <div class="flex-grow-1 min-w-0">
            <div class="fw-bold text-truncate" style="font-size:12px;${isDone ? "text-decoration:line-through" : ""}">${escHtml(entry.drill.name)}</div>
            <div class="text-secondary" style="font-size:10px">${escHtml(entry.section.name)} · ${entry.players.length} players</div>
          </div>
          <div class="d-flex align-items-center gap-1 flex-shrink-0">
            ${countHtml}
            <span class="text-secondary fw-bold ${isActive ? "text-danger" : ""}" style="font-size:10px">${entry.drill.duration} min</span>
          </div>
        </div>`;
      })
      .join("");

    queueList.querySelectorAll("[data-qi]").forEach((card) => {
      card.addEventListener("click", () => {
        clearInterval(timerInterval);
        closeNextOverlay();
        renderDrill(parseInt(card.dataset.qi));
      });
    });

    const active = queueList.querySelector(".border-danger");
    if (active)
      setTimeout(
        () => active.scrollIntoView({ behavior: "smooth", block: "nearest" }),
        60,
      );
  }

  /* ── Between-drill overlay ─────────────────────────────── */
  function showNextOverlay() {
    const next = queue[currentIdx + 1];
    if (!next) {
      showFinish();
      return;
    }
    document.getElementById("next-drill-name").textContent = next.drill.name;
    document.getElementById("next-drill-detail").textContent =
      `${next.section.name} · ${next.drill.duration} min · ${next.players.length} players`;
    nextCountdownVal = 5;
    document.getElementById("next-countdown").textContent = nextCountdownVal;
    nextOverlay.classList.add("fd-overlay-open");
    clearInterval(nextCountdownInterval);
    nextCountdownInterval = setInterval(() => {
      nextCountdownVal--;
      document.getElementById("next-countdown").textContent = nextCountdownVal;
      if (nextCountdownVal <= 0) {
        clearInterval(nextCountdownInterval);
        closeNextOverlay();
        renderDrill(currentIdx + 1);
      }
    }, 1000);
  }

  function closeNextOverlay() {
    clearInterval(nextCountdownInterval);
    nextOverlay.classList.remove("fd-overlay-open");
  }

  document.getElementById("btn-next-skip").addEventListener("click", () => {
    closeNextOverlay();
    renderDrill(currentIdx + 1);
  });
  document.getElementById("btn-next-cancel").addEventListener("click", () => {
    closeNextOverlay();
    if (!timerRunning) {
      timerRunning = true;
      playIcon.textContent = "pause";
      playPauseBtn.classList.add("fd-tc-active");
      timerInterval = setInterval(tick, 1000);
    }
  });

  /* ── Manual next / restart ─────────────────────────────── */
  document.getElementById("btn-next-drill").addEventListener("click", () => {
    clearInterval(timerInterval);
    if (currentIdx < queue.length - 1) showNextOverlay();
    else showFinish();
  });

  document.getElementById("btn-restart-all").addEventListener("click", () => {
    clearInterval(timerInterval);
    clearInterval(nextCountdownInterval);
    closeNextOverlay();
    finishOverlay.classList.remove("fd-overlay-open");
    renderDrill(0);
  });

  /* ── Repeat chips ──────────────────────────────────────── */
  document.querySelectorAll(".fd-replay-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".fd-replay-chip")
        .forEach((b) => b.classList.remove("active", "btn-danger"));
      btn.classList.add("active", "btn-danger");
      repeatCount = parseInt(btn.dataset.rep);
      currentRep = 1;
      updateRepStatus();
      clearInterval(timerInterval);
      startTimer(queue[currentIdx].drill.duration * 60);
    });
  });

  /* ── Finish overlay ────────────────────────────────────── */
  function showFinish() {
    clearInterval(timerInterval);
    clearInterval(nextCountdownInterval);
    closeNextOverlay();
    progressFill.style.width = "100%";
    progressFill.setAttribute("aria-valuenow", 100);
    progressPct.textContent = "100%";
    renderQueue();
    const totalPlayers = new Set(
      queue.flatMap((e) => e.players.map((p) => p.id)),
    ).size;
    const totalMins = queue.reduce((s, e) => s + e.drill.duration, 0);
    document.getElementById("stat-drills-done").textContent = queue.length;
    document.getElementById("stat-time-done").textContent = totalMins + " min";
    document.getElementById("stat-players-done").textContent = totalPlayers;
    document.getElementById("finish-sub").textContent =
      `${queue.length} drills completed. Excellent session!`;
    finishOverlay.classList.add("fd-overlay-open");
  }

  document
    .getElementById("btn-finish-session")
    .addEventListener("click", () => {
      window.location.href = "/train/";
    });
  document
    .getElementById("btn-restart-finish")
    .addEventListener("click", () => {
      finishOverlay.classList.remove("fd-overlay-open");
      renderDrill(0);
    });
  document.getElementById("btn-back-session").addEventListener("click", () => {
    clearInterval(timerInterval);
    window.location.href = "/train/";
  });

  /* ── Kick off ───────────────────────────────────────────── */
  renderDrill(0);
});
