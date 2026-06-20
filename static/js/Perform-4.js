const MATCH_HISTORY_DATA = window.MATCH_HISTORY_DATA || [];

const POS_COLS = {
  GK: [
    { key: "saves", label: "Saves" },
    { key: "punches", label: "Punches" },
  ],
  DEF: [
    { key: "tackles", label: "Tackles" },
    { key: "clearances", label: "Clr" },
  ],
  MID: [
    { key: "chancesCreated", label: "Chances" },
    { key: "interceptions", label: "Int" },
  ],
  FWD: [
    { key: "shots", label: "Shots" },
    { key: "dribbles", label: "Drb" },
  ],
};

let p4_selectedIdx = 0;

function p4_resultBadge(r) {
  const cls = r === "W" ? "p4-res-w" : r === "D" ? "p4-res-d" : "p4-res-l";
  return `<span class="p4-res-badge ${cls}">${r}</span>`;
}
function p4_ratingBadge(r) {
  const cls =
    r >= 8.5
      ? "p4-rating-elite"
      : r >= 7.5
        ? "rating-high"
        : r >= 6.5
          ? "rating-mid"
          : "p4-rating-low";
  return `<span class="${cls}">${r.toFixed(1)}</span>`;
}
function p4_cardCell(yc, rc) {
  if (rc) return `<span class="card-lg-r">RC</span>`;
  if (yc) return `<span class="card-lg-y">YC</span>`;
  return `<span style="color:var(--text4);">—</span>`;
}
function p4_haLabel(home) {
  return home
    ? `<span class="p4-ha-home">H</span>`
    : `<span class="p4-ha-away">A</span>`;
}

function p4_renderPlayerCards() {
  const wrap = document.getElementById("playerCardsRow");
  wrap.innerHTML = MATCH_HISTORY_DATA.map((p, i) => {
    const isActive = i === p4_selectedIdx;
    const avg = (
      p.matches.reduce((s, m) => s + m.rating, 0) / p.matches.length
    ).toFixed(1);
    return `
      <div class="p4-pcard${isActive ? " p4-pcard-active" : ""}" onclick="p4_selectPlayer(${i})" title="${p.name}">
        <div class="p4-pcard-avatar" style="background-image:url('${p.img}')"></div>
        <p class="p4-pcard-name">${p.name.split(" ").pop()}</p>
        <p class="p4-pcard-meta">#${p.number} · ${p.posGroup}</p>
        <p class="p4-pcard-avg">${avg}</p>
      </div>`;
  }).join("");
}

function p4_renderTable() {
  const player = MATCH_HISTORY_DATA[p4_selectedIdx];
  const posCols = POS_COLS[player.posGroup] || [];

  document.getElementById("p4_playerAvatar").style.backgroundImage =
    `url('${player.img}')`;
  document.getElementById("p4_playerName").textContent = player.name;
  document.getElementById("p4_playerMeta").textContent =
    `${player.pos} · #${player.number}`;

  const last5 = player.matches.slice(0, 5);
  document.getElementById("p4_formDots").innerHTML =
    `<span style="font-size:10px;color:var(--text4);font-weight:600;margin-right:4px;">FORM</span>` +
    last5
      .map((m) => {
        const cls =
          m.result === "W"
            ? "p4-form-w"
            : m.result === "D"
              ? "p4-form-d"
              : "p4-form-l";
        return `<span class="p4-form-dot ${cls}">${m.result}</span>`;
      })
      .join("");

  document.getElementById("p4_posGroupHeader").textContent =
    player.posGroup === "GK"
      ? "GK Stats"
      : player.posGroup === "DEF"
        ? "Defensive"
        : player.posGroup === "MID"
          ? "Midfield"
          : "Attacking";
  document.getElementById("p4_dynH1").textContent = posCols[0]?.label || "—";
  document.getElementById("p4_dynH2").textContent = posCols[1]?.label || "—";

  document.getElementById("tableBody4").innerHTML = player.matches
    .map((m, i) => {
      const posStats = posCols
        .map((c) => `<td class="stat-reg">${m[c.key] ?? "—"}</td>`)
        .join("");
      return `
      <tr style="animation-delay:${i * 0.04}s">
        <td class="cs stat-reg" style="font-size:12px;color:var(--text3);font-variant-numeric:tabular-nums;min-width:100px;">${m.date}</td>
        <td class="cs br" style="padding:10px 16px;text-align:left;">
          <div style="display:flex;align-items:center;gap:7px;">
            ${p4_haLabel(m.home)}
            <span class="p-name" style="font-size:13px;">${m.opponent}</span>
          </div>
        </td>
        <td>${p4_resultBadge(m.result)}</td>
        <td class="stat-reg br" style="font-weight:700;letter-spacing:0.5px;">${m.score}</td>
        <td class="stat-reg br">${m.min}'</td>
        <td class="stat-primary">${m.g}</td>
        <td class="stat-primary">${m.a}</td>
        <td class="stat-primary br">${m.g + m.a}</td>
        <td class="br">${p4_cardCell(m.yc, m.rc)}</td>
        ${posStats}
        <td>${p4_ratingBadge(m.rating)}</td>
      </tr>`;
    })
    .join("");

  const tots = player.matches.reduce(
    (acc, m) => {
      acc.g += m.g;
      acc.a += m.a;
      acc.min += m.min;
      acc.yc += m.yc;
      acc.rc += m.rc;
      acc.rating += m.rating;
      acc.w += m.result === "W" ? 1 : 0;
      acc.d += m.result === "D" ? 1 : 0;
      acc.l += m.result === "L" ? 1 : 0;
      posCols.forEach((c) => {
        acc[c.key] = (acc[c.key] || 0) + (m[c.key] || 0);
      });
      return acc;
    },
    { g: 0, a: 0, min: 0, yc: 0, rc: 0, rating: 0, w: 0, d: 0, l: 0 },
  );

  const avgRating = (tots.rating / player.matches.length).toFixed(2);
  const posSum = posCols
    .map(
      (c) =>
        `<span class="p4-chip">${c.label} <strong>${tots[c.key]}</strong></span>`,
    )
    .join("");

  document.getElementById("p4_summary").innerHTML = `
    <span class="p4-chip p4-chip-g">Goals <strong>${tots.g}</strong></span>
    <span class="p4-chip p4-chip-a">Assists <strong>${tots.a}</strong></span>
    <span class="p4-chip">G+A <strong>${tots.g + tots.a}</strong></span>
    <span class="p4-chip">Minutes <strong>${tots.min}'</strong></span>
    <span class="p4-chip p4-chip-w">W <strong>${tots.w}</strong></span>
    <span class="p4-chip p4-chip-d">D <strong>${tots.d}</strong></span>
    <span class="p4-chip p4-chip-l">L <strong>${tots.l}</strong></span>
    <span class="p4-chip">YC <strong>${tots.yc}</strong></span>
    <span class="p4-chip">RC <strong>${tots.rc}</strong></span>
    ${posSum}
    <span class="p4-chip p4-chip-rating">Avg Rating <strong>${avgRating}</strong></span>
  `;
}

function p4_selectPlayer(idx) {
  p4_selectedIdx = idx;
  document.querySelectorAll(".p4-pcard").forEach((el, i) => {
    el.classList.toggle("p4-pcard-active", i === idx);
  });
  p4_renderTable();
}

function exportCSV() {
  const player = MATCH_HISTORY_DATA[p4_selectedIdx];
  const posCols = POS_COLS[player.posGroup] || [];
  const headers = [
    "Date",
    "Opponent",
    "H/A",
    "Result",
    "Score",
    "Min",
    "G",
    "A",
    "G+A",
    "Card",
    ...posCols.map((c) => c.label),
    "Rating",
  ];
  const rows = player.matches.map((m) => [
    m.date,
    m.opponent,
    m.home ? "H" : "A",
    m.result,
    m.score,
    m.min,
    m.g,
    m.a,
    m.g + m.a,
    m.rc ? "RC" : m.yc ? "YC" : "—",
    ...posCols.map((c) => m[c.key] ?? ""),
    m.rating,
  ]);
  downloadCSV(
    headers,
    rows,
    `${player.name.replace(/\s+/g, "-")}-match-history.csv`,
  );
}

/* expose render hook for tab switcher */
function renderTab4() {
  p4_renderPlayerCards();
  p4_renderTable();
}

p4_renderPlayerCards();
p4_renderTable();
