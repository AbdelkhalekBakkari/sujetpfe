import { SUJETS, DOMAIN_LIST, TYPES } from "./data.js";

const TINTS = { ai: "#E01D8C", agents: "#B0177F", devops: "#8A1B85", cyber: "#6B1E86", data: "#4A1A6E" };

const DEFAULTS = { active: "all", type: "all", query: "", sort: "id" };
const SORTS = ["id", "title", "months"];

/**
 * Deep links — the filters are mirrored in the URL so a subject list can be shared or
 * linked from the Subul academies (e.g. ?domain=ai&q=PyTorch, ?q=PFE-0042, ?type=PFE%20Licence).
 *   domain : ai | agents | devops | cyber | data
 *   type   : one of TYPES (exact label)
 *   q      : free text (title, stack or id)
 *   sort   : id | title | months
 */
function stateFromUrl() {
  const p = new URLSearchParams(window.location.search);
  const domain = (p.get("domain") || "").toLowerCase();
  const type = p.get("type") || "";
  const sort = (p.get("sort") || "").toLowerCase();
  return {
    active: DOMAIN_LIST.some((d) => d.key === domain) ? domain : DEFAULTS.active,
    type: TYPES.includes(type) ? type : DEFAULTS.type,
    query: (p.get("q") || "").slice(0, 200),
    sort: SORTS.includes(sort) ? sort : DEFAULTS.sort,
  };
}

function syncUrl() {
  const p = new URLSearchParams();
  if (state.active !== DEFAULTS.active) p.set("domain", state.active);
  if (state.type !== DEFAULTS.type) p.set("type", state.type);
  if (state.query.trim()) p.set("q", state.query.trim());
  if (state.sort !== DEFAULTS.sort) p.set("sort", state.sort);
  const qs = p.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(null, "", url);
  }
}

const state = stateFromUrl();

const els = {
  query: document.getElementById("query"),
  type: document.getElementById("type"),
  sort: document.getElementById("sort"),
  chips: document.getElementById("chips"),
  countLabel: document.getElementById("countLabel"),
  reset: document.getElementById("reset"),
  grid: document.getElementById("grid"),
  empty: document.getElementById("empty"),
  totalCount: document.getElementById("totalCount"),
};

els.totalCount.textContent = SUJETS.length;

function chipLabel(active) {
  return active
    ? "font-weight:700;color:#FFFFFF;background:linear-gradient(90deg,#E01D8C,#6B1E86);border-color:transparent;"
    : "";
}

function renderChips() {
  els.chips.innerHTML = "";

  const allChip = document.createElement("button");
  allChip.className = "chip" + (state.active === "all" ? " active" : "");
  allChip.textContent = `Tous les domaines · ${SUJETS.length}`;
  allChip.addEventListener("click", () => { state.active = "all"; render(); });
  els.chips.appendChild(allChip);

  for (const d of DOMAIN_LIST) {
    const chip = document.createElement("button");
    chip.className = "chip" + (state.active === d.key ? " active" : "");
    chip.textContent = `${d.label} · ${d.count}`;
    chip.addEventListener("click", () => { state.active = d.key; render(); });
    els.chips.appendChild(chip);
  }
}

function getResults() {
  const q = state.query.trim().toLowerCase();

  let results = SUJETS.filter((s) => {
    if (state.active !== "all" && s.domain !== state.active) return false;
    if (state.type !== "all" && s.type !== state.type) return false;
    if (q && !(s.title.toLowerCase().includes(q) || s.stack.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))) return false;
    return true;
  });

  if (state.sort === "title") {
    results = [...results].sort((a, b) => a.title.localeCompare(b.title, "fr"));
  } else if (state.sort === "months") {
    results = [...results].sort((a, b) => a.months - b.months || a.title.localeCompare(b.title, "fr"));
  }

  return results;
}

function renderCards(results) {
  els.grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  for (const s of results) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-top">
        <div class="card-id">${s.id}</div>
        <div class="card-domain" style="background:${TINTS[s.domain] || "#6B1E86"}">${s.domainLabel}</div>
      </div>
      <div class="card-title">${s.title}</div>
      <div class="card-stack">${s.stack}</div>
      <div class="card-meta">
        <div class="pill">${s.type}</div>
        <div class="pill">${s.months} mois</div>
      </div>
    `;
    frag.appendChild(card);
  }
  els.grid.appendChild(frag);
}

function render() {
  renderChips();

  const results = getResults();
  renderCards(results);

  els.empty.classList.toggle("show", SUJETS.length > 0 && results.length === 0);
  els.countLabel.textContent = `${results.length} sujet${results.length > 1 ? "s affichés" : " affiché"}`;

  els.type.value = state.type;
  els.sort.value = state.sort;
  if (els.query.value !== state.query) els.query.value = state.query;

  syncUrl();
}

// Back/forward navigation restores the filters encoded in the URL.
window.addEventListener("popstate", () => { Object.assign(state, stateFromUrl()); render(); });

els.query.addEventListener("input", (e) => { state.query = e.target.value; render(); });
els.type.addEventListener("change", (e) => { state.type = e.target.value; render(); });
els.sort.addEventListener("change", (e) => { state.sort = e.target.value; render(); });
els.reset.addEventListener("click", () => { Object.assign(state, DEFAULTS); render(); });

render();
