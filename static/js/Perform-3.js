const TACT_DATA = window.TACT_DATA || [];

let p3_filtered = [...TACT_DATA];
let p3_page = 1;

function p3_getRPP() {
  return parseInt(document.getElementById("rppSel3").value);
}

function p3_renderTable() {
  const rpp = p3_getRPP(),
    start = (p3_page - 1) * rpp;
  const page = p3_filtered.slice(start, start + rpp);
  if (!page.length) {
    document.getElementById("tableBody3").innerHTML =
      `<tr><td colspan="19"><div class="no-res"><span class="material-symbols-outlined">search_off</span>No players match.</div></td></tr>`;
    p3_renderPagination();
    return;
  }
  document.getElementById("tableBody3").innerHTML = page
    .map(
      (p, i) => `
    <tr style="animation-delay:${i * 0.04}s">
      <td class="cs" style="padding:13px 20px;">
        <div class="d-flex align-items-center gap-3">
          <div class="p-avatar" style="background-image:url('${p.img}')"></div>
          <div><p class="p-name">${p.name}</p><p class="p-sub">${p.pos} &bull; #${p.number}</p></div>
        </div>
      </td>
      <td style="color:var(--primary);font-weight:700;">${p.passAcc}</td>
      <td class="stat-reg">${p.keyPasses}</td><td class="stat-reg">${p.final3rd}</td>
      <td class="stat-reg">${p.longBalls}</td><td class="stat-reg br">${p.throughBalls}</td>
      <td class="stat-reg">${p.tackles}</td><td class="stat-reg">${p.interceptions}</td>
      <td class="stat-reg">${p.ballRecov}</td><td class="stat-reg">${p.blockedShots}</td>
      <td class="stat-reg br">${p.clearances}</td>
      <td class="stat-reg">${p.totalDuels}</td><td class="stat-reg">${p.aerial}</td>
      <td class="stat-reg">${p.ground}</td><td class="stat-reg br">${p.dribbles}</td>
      <td class="stat-reg">${p.distance}</td><td class="stat-reg">${p.hiSprints}</td>
      <td class="stat-reg">${p.topSpeed}</td>
      <td><div class="density-bar-wrap"><div class="density-bar" style="width:${p.density}%"></div><span class="density-val">${p.density}%</span></div></td>
    </tr>`,
    )
    .join("");
  p3_renderPagination();
}

function p3_renderPagination() {
  const rpp = p3_getRPP(),
    total = p3_filtered.length;
  const tp = Math.max(1, Math.ceil(total / rpp));
  const s = Math.min((p3_page - 1) * rpp + 1, total),
    e = Math.min(p3_page * rpp, total);
  document.getElementById("pgInfo3").textContent = total
    ? `Showing ${s}–${e} of ${total} players`
    : "No results";
  document.getElementById("pgBtns3").innerHTML = buildPaginationHTML(
    p3_page,
    tp,
  );
}

function p3_changePage(p) {
  const tp = Math.max(1, Math.ceil(p3_filtered.length / p3_getRPP()));
  if (p < 1 || p > tp) return;
  p3_page = p;
  p3_renderTable();
}

function p3_changeRPP() {
  p3_page = 1;
  p3_renderTable();
}

function p3_applyFilters() {
  const s = document.getElementById("searchInput").value.toLowerCase();
  const pos = document.getElementById("positionFilter").value;
  p3_filtered = TACT_DATA.filter(
    (p) =>
      (!s ||
        p.name.toLowerCase().includes(s) ||
        String(p.number).includes(s)) &&
      (!pos || p.posGroup === pos),
  );
  p3_page = 1;
  p3_renderTable();
}

function p3_resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("positionFilter").value = "";
  p3_filtered = [...TACT_DATA];
  p3_page = 1;
  p3_renderTable();
}

function p3_exportCSV() {
  const headers = [
    "Name",
    "Position",
    "#",
    "Pass Acc%",
    "Key Passes",
    "Final 3rd",
    "Long Balls%",
    "Through Balls",
    "Tackles%",
    "Interceptions",
    "Ball Recov",
    "Blocked Shots",
    "Clearances",
    "Total Duels%",
    "Aerial%",
    "Ground%",
    "Dribbles%",
    "Distance(km)",
    "HI Sprints",
    "Top Speed",
    "Density%",
  ];
  const rows = p3_filtered.map((p) => [
    p.name,
    p.pos,
    p.number,
    p.passAcc,
    p.keyPasses,
    p.final3rd,
    p.longBalls,
    p.throughBalls,
    p.tackles,
    p.interceptions,
    p.ballRecov,
    p.blockedShots,
    p.clearances,
    p.totalDuels,
    p.aerial,
    p.ground,
    p.dribbles,
    p.distance,
    p.hiSprints,
    p.topSpeed,
    p.density + "%",
  ]);
  downloadCSV(headers, rows, "gunners-tactical.csv");
}

/* expose render hook for tab switcher */
function renderTab3() {
  p3_renderTable();
}

p3_renderTable();
