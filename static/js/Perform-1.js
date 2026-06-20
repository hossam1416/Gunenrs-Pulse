let p1_filtered = [...PLAYERS];
let p1_page = 1;
let p1_sortKey = null;
let p1_sortDir = 1;

function p1_getRPP() {
  return parseInt(document.getElementById("rppSel1").value);
}

function p1_renderSummary(data) {
  const t = data.length;
  const av = data.filter((p) => p.medicalType === "fit").length;
  const inj = data.filter((p) => p.medicalType === "injured").length;
  const af = t
    ? Math.round(data.reduce((s, p) => s + (p.fitness ?? 0), 0) / t)
    : 0;
  const tv = data.reduce((s, p) => s + (p.valueNum ?? 0), 0);
  document.getElementById("summaryCards").innerHTML = `
    <div class="s-card"><div class="s-card-bar"></div>
      <div class="s-card-ico"><span class="material-symbols-outlined">group</span></div>
      <div class="s-card-lbl">Squad Size</div><div class="s-card-val">${t}</div><div class="s-card-sub">registered players</div>
    </div>
    <div class="s-card"><div class="s-card-bar"></div>
      <div class="s-card-ico"><span class="material-symbols-outlined">check_circle</span></div>
      <div class="s-card-lbl">Available</div><div class="s-card-val">${av}</div><div class="s-card-sub">fit to play</div>
    </div>
    <div class="s-card"><div class="s-card-bar"></div>
      <div class="s-card-ico"><span class="material-symbols-outlined">local_hospital</span></div>
      <div class="s-card-lbl">Injured</div><div class="s-card-val">${inj}</div><div class="s-card-sub">unavailable</div>
    </div>
    <div class="s-card"><div class="s-card-bar"></div>
      <div class="s-card-ico"><span class="material-symbols-outlined">monitor_heart</span></div>
      <div class="s-card-lbl">Avg Fitness</div><div class="s-card-val">${af}%</div><div class="s-card-sub">squad average</div>
    </div>
    <div class="s-card"><div class="s-card-bar"></div>
      <div class="s-card-ico"><span class="material-symbols-outlined">currency_exchange</span></div>
      <div class="s-card-lbl">Squad Value</div><div class="s-card-val">€${tv}m</div><div class="s-card-sub">market value</div>
    </div>`;
}

function p1_renderTable() {
  const rpp = p1_getRPP();
  const start = (p1_page - 1) * rpp;
  const page = p1_filtered.slice(start, start + rpp);
  if (!page.length) {
    document.getElementById("tableBody1").innerHTML =
      `<tr><td colspan="16"><div class="no-res"><span class="material-symbols-outlined">search_off</span>No players match.</div></td></tr>`;
    p1_renderPagination();
    return;
  }
  document.getElementById("tableBody1").innerHTML = page
    .map(
      (p, i) => `
    <tr style="animation-delay:${i * 0.04}s"
        data-tip="${encodeURIComponent(JSON.stringify({ name: p.name, h: p.height ?? "—", w: p.weight ?? "—", v: p.value ?? "—", f: p.fitness ?? "—", ft: p.foot ?? "—", pos: p.primary ?? p.pos ?? "—" }))}">
      <td class="cs" style="padding:12px 20px;">
        <div class="d-flex align-items-center gap-3">
          <div class="p-avatar" style="background-image:url('${p.img}')"></div>
          <p class="p-name">${p.name}</p>
        </div>
      </td>
      <td style="font-weight:700;color:var(--text);">${p.number ?? "—"}</td>
      <td style="font-weight:600;color:var(--text2);">${p.primary ?? "—"}</td>
      <td class="br" style="color:var(--text3);font-style:italic;">${p.secondary ?? "—"}</td>
      <td style="font-weight:600;">${p.age ?? "—"}</td>
      <td style="color:var(--text3);white-space:nowrap;">${p.dob ?? "—"}</td>
      <td style="font-weight:600;">${p.height ?? "—"}</td>
      <td style="font-weight:600;">${p.weight ?? "—"}</td>
      <td class="br" style="color:var(--text2);">${p.foot ?? "—"}</td>
      <td style="font-weight:700;">${p.value ?? "—"}</td>
      <td class="${p.trendType === "up" ? "tu" : p.trendType === "down" ? "td" : "tn"}">${p.trend ?? "—"}</td>
      <td style="color:var(--text3);font-size:11px;white-space:nowrap;">${p.startDate ?? "—"}</td>
      <td class="br" style="color:var(--text2);font-size:11px;">${p.expiry ?? "—"}</td>
      <td><div class="fit-badge f${p.fitnessType === "green" ? "g" : p.fitnessType === "amber" ? "a" : "r"}">${p.fitness != null ? p.fitness + "%" : "—"}</div></td>
      <td><span class="med-badge m${p.medicalType === "fit" ? "f" : "i"}"><span class="med-dot"></span>${p.medical ?? "—"}</span></td>
      <td>
        <div class="d-flex align-items-center justify-content-center gap-2">
          <span class="d-flex align-items-center gap-1"><span class="cy"></span><span style="font-weight:700;font-size:11px;">${p.yellowCards ?? 0}</span></span>
          <span class="d-flex align-items-center gap-1"><span class="cr"></span><span style="font-weight:700;font-size:11px;">${p.redCards ?? 0}</span></span>
        </div>
      </td>
    </tr>`,
    )
    .join("");
  p1_renderPagination();
  p1_bindTooltips();
}

function p1_renderPagination() {
  const rpp = p1_getRPP(),
    total = p1_filtered.length;
  const tp = Math.max(1, Math.ceil(total / rpp));
  const s = Math.min((p1_page - 1) * rpp + 1, total),
    e = Math.min(p1_page * rpp, total);
  document.getElementById("pgInfo1").textContent = total
    ? `Showing ${s}–${e} of ${total} players`
    : "No results";
  document.getElementById("pgBtns1").innerHTML = buildPaginationHTML(
    p1_page,
    tp,
  );
}

function p1_changePage(p) {
  const tp = Math.max(1, Math.ceil(p1_filtered.length / p1_getRPP()));
  if (p < 1 || p > tp) return;
  p1_page = p;
  p1_renderTable();
}

function p1_changeRPP() {
  p1_page = 1;
  p1_renderTable();
}

function p1_safeSort(arr, key, dir) {
  return arr.sort((a, b) => {
    const av = a[key] ?? (typeof a[key] === "number" ? 0 : "");
    const bv = b[key] ?? (typeof b[key] === "number" ? 0 : "");
    return (
      (typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv))) * dir
    );
  });
}

function doSort(key) {
  if (p1_sortKey === key) p1_sortDir *= -1;
  else {
    p1_sortKey = key;
    p1_sortDir = 1;
  }
  p1_filtered = p1_safeSort(p1_filtered, key, p1_sortDir);
  document.querySelectorAll(".tch th").forEach((th) => {
    th.classList.remove("sorted");
    const si = th.querySelector(".si");
    if (si) si.textContent = "unfold_more";
  });
  const colMap = {
    number: 1,
    primary: 2,
    age: 4,
    height: 6,
    weight: 7,
    valueNum: 9,
    fitness: 13,
  };
  const ths = document.querySelectorAll(".tch th");
  if (colMap[key] !== undefined && ths[colMap[key]]) {
    ths[colMap[key]].classList.add("sorted");
    const si = ths[colMap[key]].querySelector(".si");
    if (si)
      si.textContent =
        p1_sortDir === 1 ? "keyboard_arrow_up" : "keyboard_arrow_down";
  }
  p1_page = 1;
  p1_renderTable();
}

function p1_applyFilters() {
  const s = document.getElementById("searchInput").value.toLowerCase().trim();
  const pos = document.getElementById("positionFilter").value;
  const med = document.getElementById("medFilter").value;
  p1_filtered = PLAYERS.filter((p) => {
    const matchSearch =
      !s ||
      p.name?.toLowerCase().includes(s) ||
      p.primary?.toLowerCase().includes(s) ||
      p.secondary?.toLowerCase().includes(s) ||
      String(p.number).includes(s);
    const matchPos = !pos || p.posGroup === pos;
    const matchMed = !med || p.medicalType === med;
    return matchSearch && matchPos && matchMed;
  });
  if (p1_sortKey) {
    p1_filtered = p1_safeSort(p1_filtered, p1_sortKey, p1_sortDir);
  }
  p1_page = 1;
  p1_renderSummary(p1_filtered);
  p1_renderTable();
}

function p1_resetFilters() {
  ["searchInput", "positionFilter", "medFilter"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  p1_sortKey = null;
  p1_sortDir = 1;
  p1_filtered = [...PLAYERS];
  p1_renderSummary(PLAYERS);
  p1_renderTable();
}

function p1_exportCSV() {
  const headers = [
    "Name",
    "#",
    "Primary",
    "Secondary",
    "Age",
    "DOB",
    "Height",
    "Weight",
    "Foot",
    "Value",
    "Trend",
    "Start",
    "Expiry",
    "Fitness",
    "Medical",
    "YC",
    "RC",
  ];
  const rows = p1_filtered.map((p) => [
    p.name,
    p.number ?? "—",
    p.primary ?? "—",
    p.secondary ?? "—",
    p.age ?? "—",
    p.dob ?? "—",
    p.height ?? "—",
    p.weight ?? "—",
    p.foot ?? "—",
    p.value ?? "—",
    p.trend ?? "—",
    p.startDate ?? "—",
    p.expiry ?? "—",
    p.fitness != null ? p.fitness + "%" : "—",
    p.medical ?? "—",
    p.yellowCards ?? 0,
    p.redCards ?? 0,
  ]);
  downloadCSV(headers, rows, "gunners-basic-info.csv");
}

function p1_bindTooltips() {
  const tt = document.getElementById("tooltip");
  document.querySelectorAll("#tableBody1 tr[data-tip]").forEach((row) => {
    row.addEventListener("mouseenter", (e) => {
      const d = JSON.parse(decodeURIComponent(row.dataset.tip));
      tt.innerHTML = `<div class="tt-name">${d.name}</div>
        <div class="tt-row"><span class="tt-lbl">Position</span><span class="tt-val">${d.pos}</span></div>
        <div class="tt-row"><span class="tt-lbl">Height</span><span class="tt-val">${d.h !== "—" ? d.h + " cm" : "—"}</span></div>
        <div class="tt-row"><span class="tt-lbl">Weight</span><span class="tt-val">${d.w !== "—" ? d.w + " kg" : "—"}</span></div>
        <div class="tt-row"><span class="tt-lbl">Value</span><span class="tt-val">${d.v}</span></div>
        <div class="tt-row"><span class="tt-lbl">Fitness</span><span class="tt-val">${d.f !== "—" ? d.f + "%" : "—"}</span></div>
        <div class="tt-row"><span class="tt-lbl">Foot</span><span class="tt-val">${d.ft}</span></div>`;
      p1_positionTip(e);
      tt.classList.add("vis");
    });
    row.addEventListener("mousemove", p1_positionTip);
    row.addEventListener("mouseleave", () => tt.classList.remove("vis"));
  });
}

function p1_positionTip(e) {
  const t = document.getElementById("tooltip");
  const x = e.clientX + 14,
    y = e.clientY - 8,
    tw = 210,
    th = 160;
  t.style.left = (x + tw > window.innerWidth ? x - tw - 28 : x) + "px";
  t.style.top = (y + th > window.innerHeight ? y - th : y) + "px";
}

/* expose render hook for tab switcher */
function renderTab1() {
  p1_renderSummary(p1_filtered);
  p1_renderTable();
}

["searchInput", "positionFilter", "medFilter"].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("change", p1_applyFilters);
  if (id === "searchInput") el.addEventListener("input", p1_applyFilters);
});

p1_renderSummary(PLAYERS);
p1_renderTable();
