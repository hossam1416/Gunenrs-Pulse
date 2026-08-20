const PERF_DATA = window.PERF_DATA || [];

let p2_filtered = [...PERF_DATA];
let p2_page = 1;

function p2_getRPP() {
  return parseInt(document.getElementById("rppSel2").value);
}

function p2_renderTable() {
  const rpp = p2_getRPP(),
    start = (p2_page - 1) * rpp;
  const page = p2_filtered.slice(start, start + rpp);
  if (!page.length) {
    document.getElementById("tableBody2").innerHTML =
      `<tr><td colspan="21"><div class="no-res"><span class="material-symbols-outlined">search_off</span>No players match.</div></td></tr>`;
    p2_renderPagination();
    return;
  }
  document.getElementById("tableBody2").innerHTML = page
    .map(
      (p, i) => `
    <tr style="animation-delay:${i * 0.04}s">
      <td class="cs" style="padding:13px 20px;">
        <div class="d-flex align-items-center gap-3">
          <div class="p-avatar" style="background-image:url('${p.img}')"></div>
          <div><p class="p-name">${p.name}</p><p class="p-sub">${p.pos} &bull; #${p.number}</p></div>
        </div>
      </td>
      <td class="stat-reg">${p.mp}</td><td class="stat-reg">${p.gs}</td><td class="stat-reg">${p.min}</td>
      <td class="stat-reg">${p.subIn}</td><td class="stat-reg br">${p.out}</td>
      <td class="stat-primary">${p.g}</td><td class="stat-primary">${p.a}</td>
      <td class="stat-reg">${p.xg}</td><td class="stat-reg">${p.xa}</td><td class="stat-reg br">${p.conv}</td>
      <td class="stat-reg">${p.sh}</td><td class="stat-reg">${p.sot}</td><td class="stat-reg">${p.inBox}</td>
      <td class="stat-reg">${p.outBox}</td><td class="stat-reg br">${p.fkAcc}</td>
      <td class="stat-reg">${p.yc}</td><td class="stat-reg">${p.rc}</td>
      <td class="stat-reg">${p.fc}</td><td class="stat-reg">${p.fs}</td><td class="stat-reg">${p.off}</td>
    </tr>`,
    )
    .join("");
  p2_renderPagination();
}

function p2_renderPagination() {
  const rpp = p2_getRPP(),
    total = p2_filtered.length;
  const tp = Math.max(1, Math.ceil(total / rpp));
  const s = Math.min((p2_page - 1) * rpp + 1, total),
    e = Math.min(p2_page * rpp, total);
  document.getElementById("pgInfo2").textContent = total
    ? `Showing ${s}–${e} of ${total} players`
    : "No results";
  document.getElementById("pgBtns2").innerHTML = buildPaginationHTML(
    p2_page,
    tp,
  );
}

function p2_changePage(p) {
  const tp = Math.max(1, Math.ceil(p2_filtered.length / p2_getRPP()));
  if (p < 1 || p > tp) return;
  p2_page = p;
  p2_renderTable();
}

function p2_changeRPP() {
  p2_page = 1;
  p2_renderTable();
}

function p2_applyFilters() {
  const s = document.getElementById("searchInput").value.toLowerCase();
  const pos = document.getElementById("positionFilter").value;
  p2_filtered = PERF_DATA.filter(
    (p) =>
      (!s ||
        p.name.toLowerCase().includes(s) ||
        String(p.number).includes(s)) &&
      (!pos || p.posGroup === pos),
  );
  p2_page = 1;
  p2_renderTable();
}

function p2_resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("positionFilter").value = "";
  p2_filtered = [...PERF_DATA];
  p2_page = 1;
  p2_renderTable();
}

function p2_exportCSV() {
  const headers = [
    "Name",
    "Position",
    "#",
    "MP",
    "GS",
    "MIN",
    "Sub In",
    "Out",
    "G",
    "A",
    "xG",
    "xA",
    "Conv%",
    "SH",
    "SOT%",
    "In Box",
    "Out Box",
    "FK Acc",
    "YC",
    "RC",
    "FC",
    "FS",
    "OFF",
  ];
  const rows = p2_filtered.map((p) => [
    p.name,
    p.pos,
    p.number,
    p.mp,
    p.gs,
    p.min,
    p.subIn,
    p.out,
    p.g,
    p.a,
    p.xg,
    p.xa,
    p.conv,
    p.sh,
    p.sot,
    p.inBox,
    p.outBox,
    p.fkAcc,
    p.yc,
    p.rc,
    p.fc,
    p.fs,
    p.off,
  ]);
  downloadCSV(headers, rows, "gunners-performance.csv");
}

/* expose render hook for tab switcher */
function renderTab2() {
  p2_renderTable();
}

p2_renderTable();
