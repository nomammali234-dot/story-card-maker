const $ = id => document.getElementById(id);

const TEMPLATES = {
  "Burgundy": { bg: "linear-gradient(165deg,#5b1818,#260909)", box: "rgba(168,52,32,.55)", text: "#fff6ee", hl: "#ffc533" },
  "Midnight": { bg: "linear-gradient(165deg,#12254a,#080f22)", box: "rgba(60,100,190,.35)", text: "#eef3ff", hl: "#7fb0ff" },
  "Forest":   { bg: "linear-gradient(165deg,#15402a,#08190f)", box: "rgba(60,150,100,.35)", text: "#effaf2", hl: "#b6f06a" },
  "Charcoal": { bg: "linear-gradient(165deg,#2b2b30,#111113)", box: "rgba(255,255,255,.09)", text: "#f2f2f4", hl: "#ff8a5b" },
  "Paper":    { bg: "linear-gradient(165deg,#f4ead4,#e5d6b6)", box: "rgba(255,252,242,.85)", text: "#2a2118", hl: "#b0381f" },
};
const FONTS = {
  "Merriweather": '"Merriweather", Georgia, serif', "Lora": '"Lora", Georgia, serif', "Playfair Display": '"Playfair Display", Georgia, serif',
  "Roboto Slab": '"Roboto Slab", Georgia, serif', "Inter": '"Inter", "Segoe UI", sans-serif', "Poppins": '"Poppins", "Segoe UI", sans-serif',
  "Georgia": "Georgia, serif", "Arial": "Arial, sans-serif",
};
const DEFAULT = {
  tpl: "Burgundy", photo: "", name: "Late Night Diaries", sub: "Read the full story below", nFont: "Merriweather", nSize: 18,
  text: "I moved to a new city last spring and knew nobody. For weeks the only voice I heard at night was the radio in the flat below.\n\nOne evening the radio stopped, and someone knocked on my door. It was my neighbour, holding a plate of food. **\"You look like you haven't eaten properly,\"** she said, and walked in like she had always lived there.\n\nThat was the start of the best friendship of my life.",
  tFont: "Merriweather", tSize: 15, align: "left", hl: "", foot: "Continue Reading in Comments..",
  ratio: "r916", bg: "", dim: 45, exportW: 1080,
};
const KEY = "story-maker-v1";
let state = { ...DEFAULT }, IMG = {};          // IMG: tasveeron ka khazana (history mein baar baar nakal na ho)

/* ---------- selects ---------- */
const fill = (sel, items) => Object.keys(items).forEach(k => sel.add(new Option(k, k)));
fill($("tpl"), TEMPLATES); fill($("nFont"), FONTS); fill($("tFont"), FONTS);

/* ---------- card ko state se banana ---------- */
const esc = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

function render() {
  const t = TEMPLATES[state.tpl], card = $("card"), hl = state.hl || t.hl;
  card.style.setProperty("--bg", t.bg); card.style.setProperty("--box", t.box);
  card.style.setProperty("--text", t.text); card.style.setProperty("--hl", hl);
  card.className = "card " + (state.ratio === "auto" ? "" : state.ratio);
  if (state.bg) {                                   // peeche ki tasveer + andhera
    const d = state.dim / 100;
    card.style.background = `linear-gradient(rgba(0,0,0,${d}),rgba(0,0,0,${d})), url(${IMG[state.bg]}) center / cover no-repeat`;
  } else card.style.background = "";

  $("cName").textContent = state.name; $("cName").style.cssText = `font-family:${FONTS[state.nFont]};font-size:${state.nSize}px`;
  $("cSub").textContent = state.sub; $("cSub").style.cssText = `font-family:${FONTS[state.nFont]};font-size:${Math.round(state.nSize * .78)}px`;
  $("av").style.backgroundImage = state.photo ? `url(${IMG[state.photo]})` : "none";
  $("av").textContent = state.photo ? "" : (state.name.trim()[0] || "?").toUpperCase();

  $("cStory").innerHTML = esc(state.text).replace(/\*\*(.+?)\*\*/gs, "<mark>$1</mark>").replace(/\n/g, "<br>");
  $("cStory").style.cssText = `font-family:${FONTS[state.tFont]};font-size:${state.tSize}px;text-align:${state.align}`;
  $("cFoot").textContent = state.foot; $("cFoot").hidden = !state.foot.trim();

  $("nOut").textContent = state.nSize + " px"; $("tOut").textContent = state.tSize + " px"; $("dOut").textContent = state.dim + "%";
  $("photoRm").hidden = !state.photo; $("bgRm").hidden = !state.bg;
  $("warn").hidden = card.scrollHeight <= card.clientHeight + 2;
}

function syncControls() {                           // state -> controls (undo ya restore ke baad)
  document.querySelectorAll("[data-k]").forEach(el => {
    const k = el.dataset.k;
    el.value = k === "hl" ? (state.hl || TEMPLATES[state.tpl].hl) : state[k];
  });
}

/* ---------- history (undo / redo) aur auto-save ---------- */
let hist = [], at = -1, timer = null;
function snapshot() {
  const s = JSON.stringify(state);
  if (s === hist[at]) return;
  hist = hist.slice(0, at + 1); hist.push(s);
  if (hist.length > 50) hist.shift();
  at = hist.length - 1; buttons();
}
function save() {
  try {
    const used = {}; [state.photo, state.bg].forEach(k => { if (k) used[k] = IMG[k]; });
    localStorage.setItem(KEY, JSON.stringify({ state, images: used }));
    $("saved").textContent = "Auto-save ho gaya";
  } catch (e) { $("saved").textContent = "Save nahi ho saka (jagah kam hai, tasveer chhoti karein)"; }
}
function changed() { render(); clearTimeout(timer); timer = setTimeout(() => { snapshot(); save(); }, 500); }
function jump(i) {
  if (i < 0 || i >= hist.length) return;
  at = i; state = { ...DEFAULT, ...JSON.parse(hist[at]) }; syncControls(); render(); save(); buttons();
}
function buttons() { $("undo").disabled = at <= 0; $("redo").disabled = at >= hist.length - 1; }
$("undo").onclick = () => { clearTimeout(timer); snapshot(); jump(at - 1); };
$("redo").onclick = () => jump(at + 1);
document.addEventListener("keydown", e => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase();
  if (k === "z" && !e.shiftKey) { e.preventDefault(); $("undo").click(); }
  else if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); $("redo").click(); }
});

/* ---------- controls ---------- */
document.querySelectorAll("[data-k]").forEach(el => {
  const on = () => { state[el.dataset.k] = el.dataset.num !== undefined ? Number(el.value) : el.value; changed(); };
  el.addEventListener("input", on); el.addEventListener("change", on);
});
$("tpl").addEventListener("change", () => { state.hl = ""; syncControls(); changed(); });   // naya template = uska apna numaya rang
$("hlRm").onclick = () => { state.hl = ""; syncControls(); changed(); };

function pickImage(input, key) {
  input.addEventListener("change", () => {
    const f = input.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { const id = "i" + Date.now().toString(36); IMG[id] = r.result; state[key] = id; changed(); };
    r.readAsDataURL(f);
  });
}
pickImage($("photoIn"), "photo"); pickImage($("bgIn"), "bg");
$("photoRm").onclick = () => { state.photo = ""; $("photoIn").value = ""; changed(); };
$("bgRm").onclick = () => { state.bg = ""; $("bgIn").value = ""; changed(); };
$("reset").onclick = () => { if (confirm("Sab kuch saaf kar ke naya card shuru karein?")) { state = { ...DEFAULT }; syncControls(); changed(); } };

/* ---------- tabs ---------- */
const tabs = [...document.querySelectorAll("[role=tab]")];
function openTab(tab) {
  tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
    $(t.getAttribute("aria-controls")).hidden = !on;
  });
  tab.focus();
}
tabs.forEach((t, i) => {
  t.onclick = () => openTab(t);
  t.onkeydown = e => {
    if (e.key === "ArrowRight") openTab(tabs[(i + 1) % tabs.length]);
    if (e.key === "ArrowLeft") openTab(tabs[(i + tabs.length - 1) % tabs.length]);
  };
});

/* ---------- export ---------- */
async function makeCanvas() {
  await document.fonts.ready;
  return html2canvas($("card"), { scale: state.exportW / $("card").offsetWidth, backgroundColor: null, useCORS: true });
}
const toBlob = c => new Promise(res => c.toBlob(res, "image/png"));
async function busy(btn, label, job) {
  const old = btn.textContent; btn.disabled = true; btn.textContent = label;
  try { if (!window.html2canvas) throw new Error("PNG banane ke liye internet chahiye"); await job(); }
  catch (e) { alert(e.message); }
  btn.disabled = false; btn.textContent = old;
}
$("dl").onclick = () => busy($("dl"), "Ban raha hai...", async () => {
  const b = await toBlob(await makeCanvas()), a = document.createElement("a");
  a.href = URL.createObjectURL(b); a.download = "story-card.png"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
});
$("copy").onclick = () => busy($("copy"), "Copy ho raha hai...", async () => {
  if (!navigator.clipboard || !window.ClipboardItem) throw new Error("Image copy sirf localhost ya https par chalta hai. PNG download istemal karein.");
  await navigator.clipboard.write([new ClipboardItem({ "image/png": toBlob(await makeCanvas()) })]);
  $("saved").textContent = "Image copy ho gayi";
});

/* ---------- shuru ---------- */
try {
  const d = JSON.parse(localStorage.getItem(KEY));
  if (d && d.state) { state = { ...DEFAULT, ...d.state }; IMG = d.images || {}; }
} catch (e) {}
syncControls(); render(); snapshot();
document.fonts.ready.then(render);
