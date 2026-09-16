import { SUJETS, DOMAIN_LIST } from "./data.js";

const TINTS = { ai: "#E01D8C", agents: "#B0177F", devops: "#8A1B85", cyber: "#6B1E86", data: "#4A1A6E" };

const state = { active: "all", type: "all", query: "", sort: "id" };

const els = {
  query: document.getElementById("query"),
  type: document.getElementById("type"),
  sort: document.getElementById("sort"),
  chips: document.getElementById("chips"),
  countLabel: document.getElementById("countLabel"),
  reset: document.getElementById("reset"),
  grid: document.getElementById("grid"),
  empty: document.getElementById("empty"),
};

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
}

els.query.addEventListener("input", (e) => { state.query = e.target.value; render(); });
els.type.addEventListener("change", (e) => { state.type = e.target.value; render(); });
els.sort.addEventListener("change", (e) => { state.sort = e.target.value; render(); });
els.reset.addEventListener("click", () => {
  state.active = "all";
  state.type = "all";
  state.query = "";
  state.sort = "id";
  render();
});

render();
