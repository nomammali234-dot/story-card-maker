const $ = id => document.getElementById(id);

const TEMPLATES = {
  "Burgundy": { bg: "linear-gradient(165deg,#5b1818,#260909)", box: "rgba(168,52,32,.55)", text: "#fff6ee", hl: "#ffc533" },
  "Midnight": { bg: "linear-gradient(165deg,#12254a,#080f22)", box: "rgba(60,100,190,.35)", text: "#eef3ff", hl: "#7fb0ff" },
  "Forest": { bg: "linear-gradient(165deg,#15402a,#08190f)", box: "rgba(60,150,100,.35)", text: "#effaf2", hl: "#b6f06a" },
  "Charcoal": { bg: "linear-gradient(165deg,#2b2b30,#111113)", box: "rgba(255,255,255,.09)", text: "#f2f2f4", hl: "#ff8a5b" },
  "Paper": { bg: "linear-gradient(165deg,#f4ead4,#e5d6b6)", box: "rgba(255,252,242,.85)", text: "#2a2118", hl: "#b0381f" },
  "Aurora": { bg: "linear-gradient(160deg,#1f3a73,#4d2b7a)", box: "rgba(123,216,255,.18)", text: "#f1f6ff", hl: "#84f3ff" },
  "Sunset": { bg: "linear-gradient(150deg,#4a1d2e,#f27d5a)", box: "rgba(255,244,204,.16)", text: "#fff4f1", hl: "#ffd166" },
  "Lavender": { bg: "linear-gradient(160deg,#403c7a,#8d5fe8)", box: "rgba(255,255,255,.14)", text: "#f9f7ff", hl: "#f8c7ff" },
  "Ocean": { bg: "linear-gradient(160deg,#0a3d5c,#0d8ca8)", box: "rgba(210,245,255,.18)", text: "#edfaff", hl: "#84ffe6" }
};
const FONTS = {
  "Merriweather": '"Merriweather", Georgia, serif', "Lora": '"Lora", Georgia, serif', "Playfair Display": '"Playfair Display", Georgia, serif',
  "Roboto Slab": '"Roboto Slab", Georgia, serif', "Inter": '"Inter", "Segoe UI", sans-serif', "Poppins": '"Poppins", "Segoe UI", sans-serif',
  "Georgia": "Georgia, serif", "Arial": "Arial, sans-serif"
};
const STORY_PRESETS = {
  motivation: {
    name: "A Little Reminder", sub: "Keep going, one step at a time", tpl: "Sunset",
    text: "You do not have to have it all figured out today.\n\nTake one small step, then another. **Progress is still progress**, even when it feels slow."
  },
  travel: {
    name: "Somewhere New", sub: "Notes from the journey", tpl: "Ocean",
    text: "The best part of the trip was getting lost on a quiet street and finding a tiny cafe.\n\nI stayed until sunset, listening to stories from people I had just met. **Sometimes the detour becomes the destination.**"
  },
  friendship: {
    name: "The People Who Stay", sub: "A story about friendship", tpl: "Forest",
    text: "We started as strangers sharing a table. Soon, those quick lunches became long talks and inside jokes.\n\nYears later, life has taken us in different directions, but a message from an old friend still feels like home."
  },
  quote: {
    name: "A Thought to Keep", sub: "A little reminder for today", tpl: "Lavender",
    text: "**“You are allowed to begin again.”**\n\nA fresh start does not erase your progress. It gives you another chance to use what you have learned."
  }
};
const DEFAULT = {
  tpl: "Burgundy", photo: "", name: "Late Night Diaries", sub: "Read the full story below", nFont: "Merriweather", nSize: 18,
  text: "I moved to a new city last spring and knew nobody. For weeks the only voice I heard at night was the radio in the flat below.\n\nOne evening the radio stopped, and someone knocked on my door. It was my neighbour, holding a plate of food. **\"You look like you haven't eaten properly,\"** she said, and walked in like she had always lived there.\n\nThat was the start of the best friendship of my life.",
  tFont: "Merriweather", tSize: 15, align: "left", hl: "", foot: "Continue Reading in Comments..",
  ratio: "r916", bg: "", dim: 45, exportW: 1080, outline: false, textShadow: false, uppercase: false,
  textColor: "", lineHeight: 1.5, letterSpacing: 0,
  watermark: false, watermarkText: "Story Maker", logo: "", designName: "My story",
  exportName: "story-card", jpgQuality: 92,
};
const KEY = "story-maker-v1";
const DESIGN_KEY = "story-maker-designs-v1";
const slideFields = ["name", "sub", "text", "foot"];
let state = { ...DEFAULT, activeSlide: 0, slides: [{ name: DEFAULT.name, sub: DEFAULT.sub, text: DEFAULT.text, foot: DEFAULT.foot }] }, IMG = {};
let hist = [], at = -1, timer = null;

const fill = (sel, items) => Object.keys(items).forEach(k => sel.add(new Option(k, k)));
fill($("tpl"), TEMPLATES); fill($("nFont"), FONTS); fill($("tFont"), FONTS);

const esc = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

function getTextStyles() {
  let css = "";
  const hl = state.hl || TEMPLATES[state.tpl].hl;
  if (state.textShadow) css += `text-shadow: 0 2px 10px rgba(0,0,0,.35);`;
  if (state.outline) css += `-webkit-text-stroke: 0.8px rgba(0,0,0,.35); text-shadow: 0 2px 10px rgba(0,0,0,.35);`;
  if (state.uppercase) css += `text-transform: uppercase;`;
  css += `color: ${state.textColor || TEMPLATES[state.tpl].text};`;
  css += `--story-highlight: ${hl};`;
  return css;
}

function render() {
  const t = TEMPLATES[state.tpl];
  const card = $("card");
  const hl = state.hl || t.hl;

  card.style.setProperty("--bg", t.bg);
  card.style.setProperty("--box", t.box);
  card.style.setProperty("--text", t.text);
  card.style.setProperty("--hl", hl);
  card.className = "card " + (state.ratio === "auto" ? "" : state.ratio);

  if (state.bg) {
    const d = state.dim / 100;
    card.style.background = `linear-gradient(rgba(0,0,0,${d}),rgba(0,0,0,${d})), url(${IMG[state.bg]}) center / cover no-repeat`;
  } else {
    card.style.background = "";
  }

  $("cName").textContent = state.name;
  $("cName").style.cssText = `font-family:${FONTS[state.nFont]};font-size:${state.nSize}px`;
  $("cSub").textContent = state.sub;
  $("cSub").style.cssText = `font-family:${FONTS[state.nFont]};font-size:${Math.round(state.nSize * .78)}px`;
  $("av").style.backgroundImage = state.photo ? `url(${IMG[state.photo]})` : "none";
  $("av").textContent = state.photo ? "" : (state.name.trim()[0] || "?").toUpperCase();

  $("cStory").innerHTML = esc(state.text).replace(/\*\*(.+?)\*\*/gs, "<mark>$1</mark>").replace(/\n/g, "<br>");
  $("cStory").style.cssText = `font-family:${FONTS[state.tFont]};font-size:${state.tSize}px;text-align:${state.align};line-height:${state.lineHeight};letter-spacing:${state.letterSpacing}px;${getTextStyles()}`;

  $("cFoot").textContent = state.foot;
  $("cFoot").hidden = !state.foot.trim();

  const watermark = $("cardWatermark");
  if (state.watermark && (state.watermarkText.trim() || state.logo)) {
    watermark.hidden = false;
    watermark.innerHTML = "";
    if (state.logo) {
      watermark.style.backgroundImage = `url(${IMG[state.logo]})`;
      watermark.style.backgroundSize = "contain";
      watermark.style.backgroundRepeat = "no-repeat";
      watermark.style.backgroundPosition = "center";
      watermark.classList.add("is-image");
      watermark.textContent = "";
    } else {
      watermark.style.backgroundImage = "none";
      watermark.classList.remove("is-image");
      watermark.textContent = state.watermarkText.trim() || "Story Maker";
    }
  } else {
    watermark.hidden = true;
    watermark.textContent = "";
    watermark.style.backgroundImage = "none";
    watermark.classList.remove("is-image");
  }

  $("nOut").textContent = state.nSize + " px";
  $("tOut").textContent = state.tSize + " px";
  $("dOut").textContent = state.dim + "%";
  $("lineHeightOut").textContent = Number(state.lineHeight).toFixed(1);
  $("letterSpacingOut").textContent = Number(state.letterSpacing).toFixed(1) + " px";
  $("jpgQualityOut").textContent = state.jpgQuality + "%";
  $("photoRm").hidden = !state.photo;
  $("bgRm").hidden = !state.bg;
  $("logoRm").hidden = !state.logo;
  $("warn").hidden = card.scrollHeight <= card.clientHeight + 2;
  updateSlideControls();
}

function syncControls() {
  document.querySelectorAll("[data-k]").forEach(el => {
    const k = el.dataset.k;
    if (el.type === "checkbox") {
      el.checked = Boolean(state[k]);
      return;
    }
    if (k === "hl") {
      el.value = state.hl || TEMPLATES[state.tpl].hl;
      return;
    }
    if (k === "textColor") {
      el.value = state.textColor || TEMPLATES[state.tpl].text;
      return;
    }
    el.value = state[k] ?? "";
  });
}

function snapshot() {
  const s = JSON.stringify(state);
  if (s === hist[at]) return;
  hist = hist.slice(0, at + 1);
  hist.push(s);
  if (hist.length > 50) hist.shift();
  at = hist.length - 1;
  buttons();
}

function save() {
  try {
    const used = {};
    [state.photo, state.bg, state.logo].forEach(k => { if (k) used[k] = IMG[k]; });
    localStorage.setItem(KEY, JSON.stringify({ state, images: used }));
    $("saved").textContent = "Auto-save ho gaya";
  } catch (e) {
    $("saved").textContent = "Save nahi ho saka (jagah kam hai, tasveer chhoti karein)";
  }
}

function saveActiveSlide() {
  if (!Array.isArray(state.slides) || !state.slides.length) {
    state.slides = [{ name: state.name, sub: state.sub, text: state.text, foot: state.foot }];
    state.activeSlide = 0;
  }
  const index = Math.min(Math.max(0, state.activeSlide || 0), state.slides.length - 1);
  state.activeSlide = index;
  state.slides[index] = Object.fromEntries(slideFields.map(key => [key, state[key]]));
}

function normalizeSlides() {
  if (!Array.isArray(state.slides) || !state.slides.length) {
    state.slides = [Object.fromEntries(slideFields.map(key => [key, state[key] ?? ""]))];
  } else {
    state.slides = state.slides.map(slide => {
      const source = slide && typeof slide === "object" ? slide : {};
      return Object.fromEntries(slideFields.map(key => [key, typeof source[key] === "string" ? source[key] : ""]));
    });
  }
  state.activeSlide = Math.min(Math.max(0, Number(state.activeSlide) || 0), state.slides.length - 1);
  Object.assign(state, state.slides[state.activeSlide]);
}

function updateSlideControls() {
  const count = state.slides.length;
  $("slideCount").textContent = `Slide ${state.activeSlide + 1} / ${count}`;
  $("prevSlide").disabled = state.activeSlide <= 0;
  $("nextSlide").disabled = state.activeSlide >= count - 1;
  $("removeSlide").disabled = count <= 1;
}

function activateSlide(index, track = true, saveCurrent = true) {
  if (saveCurrent) saveActiveSlide();
  state.activeSlide = index;
  Object.assign(state, state.slides[index]);
  syncControls();
  render();
  if (track) {
    snapshot();
    save();
  }
}

function changed() {
  saveActiveSlide();
  render();
  clearTimeout(timer);
  timer = setTimeout(() => {
    snapshot();
    save();
  }, 500);
}

function jump(i) {
  if (i < 0 || i >= hist.length) return;
  at = i;
  state = { ...DEFAULT, ...JSON.parse(hist[at]) };
  syncControls();
  render();
  save();
  buttons();
}

function buttons() {
  $("undo").disabled = at <= 0;
  $("redo").disabled = at >= hist.length - 1;
}

$("undo").onclick = () => {
  clearTimeout(timer);
  snapshot();
  jump(at - 1);
};

$("redo").onclick = () => jump(at + 1);

document.addEventListener("keydown", e => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase();
  if (k === "z" && !e.shiftKey) {
    e.preventDefault();
    $("undo").click();
  } else if (k === "y" || (k === "z" && e.shiftKey)) {
    e.preventDefault();
    $("redo").click();
  }
});

document.querySelectorAll("[data-k]").forEach(el => {
  const on = () => {
    if (el.type === "checkbox") {
      state[el.dataset.k] = el.checked;
    } else {
      state[el.dataset.k] = el.dataset.num !== undefined ? Number(el.value) : el.value;
    }
    if (slideFields.includes(el.dataset.k)) saveActiveSlide();
    changed();
  };
  el.addEventListener("input", on);
  el.addEventListener("change", on);
});

$("tpl").addEventListener("change", () => {
  state.hl = "";
  state.textColor = "";
  syncControls();
  changed();
});

$("hlRm").onclick = () => {
  state.hl = "";
  syncControls();
  changed();
};

$("textColorRm").onclick = () => {
  state.textColor = "";
  syncControls();
  changed();
};

$("applyPreset").onclick = () => {
  const preset = STORY_PRESETS[$("preset").value];
  if (!preset) {
    $("saved").textContent = "Pehle story preset chunein.";
    return;
  }
  state = { ...state, ...preset, hl: "", textColor: "" };
  syncControls();
  changed();
  $("saved").textContent = "Story preset apply ho gaya";
};

function pickImage(input, key) {
  input.addEventListener("change", () => {
    const f = input.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const id = "i" + Date.now().toString(36);
      IMG[id] = r.result;
      state[key] = id;
      changed();
    };
    r.readAsDataURL(f);
  });
}

pickImage($("photoIn"), "photo");
pickImage($("bgIn"), "bg");
pickImage($("logoIn"), "logo");

$("photoRm").onclick = () => {
  state.photo = "";
  $("photoIn").value = "";
  changed();
};

$("bgRm").onclick = () => {
  state.bg = "";
  $("bgIn").value = "";
  changed();
};

$("logoRm").onclick = () => {
  state.logo = "";
  $("logoIn").value = "";
  changed();
};

$("reset").onclick = () => {
  if (confirm("Sab kuch saaf kar ke naya card shuru karein?")) {
    state = { ...DEFAULT, activeSlide: 0, slides: [{ name: DEFAULT.name, sub: DEFAULT.sub, text: DEFAULT.text, foot: DEFAULT.foot }] };
    syncControls();
    changed();
  }
};

$("prevSlide").onclick = () => {
  if (state.activeSlide > 0) activateSlide(state.activeSlide - 1);
};

$("nextSlide").onclick = () => {
  if (state.activeSlide < state.slides.length - 1) activateSlide(state.activeSlide + 1);
};

$("addSlide").onclick = () => {
  if (state.slides.length >= 20) {
    $("saved").textContent = "Carousel mein zyada se zyada 20 slides ho sakti hain.";
    return;
  }
  saveActiveSlide();
  const slide = { name: `Slide ${state.slides.length + 1}`, sub: "", text: "", foot: "" };
  state.slides.push(slide);
  activateSlide(state.slides.length - 1);
};

$("removeSlide").onclick = () => {
  if (state.slides.length <= 1) return;
  state.slides.splice(state.activeSlide, 1);
  const index = Math.min(state.activeSlide, state.slides.length - 1);
  activateSlide(index, true, false);
};

function distributeItems(items, count) {
  const groups = [];
  let start = 0;
  for (let i = 0; i < count; i++) {
    const size = Math.floor(items.length / count) + (i < items.length % count ? 1 : 0);
    groups.push(items.slice(start, start + size).join("\n\n"));
    start += size;
  }
  return groups;
}

function makeSlidesFromText(text, count) {
  const posts = parseNumberedPosts(text, false);
  let items;
  if (posts.length) {
    if (count > posts.length) {
      throw new Error(`Text mein ${posts.length} numbered posts hain. ${posts.length} ya us se kam slides chunein.`);
    }
    items = posts.map(post =>
      `**${post.number}. ${post.title}**\n${post.body}${post.hashtags ? `\n\n${post.hashtags}` : ""}`
    );
  } else {
    items = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    if (items.length < count) {
      const words = text.trim().split(/\s+/);
      if (words.length < count) {
        throw new Error(`Itne lafz nahi hain. Zyada se zyada ${words.length} slides chunein.`);
      }
      items = [];
      let start = 0;
      for (let i = 0; i < count; i++) {
        const size = Math.floor(words.length / count) + (i < words.length % count ? 1 : 0);
        items.push(words.slice(start, start + size).join(" "));
        start += size;
      }
      return items;
    }
  }
  return distributeItems(items, count);
}

let pendingBulkSlides = null;

$("generateSlides").onclick = () => {
  const text = $("bulkText").value.trim();
  if (!text) {
    $("saved").textContent = "Pehle bulk text paste karein.";
    return;
  }
  const slideCount = Number($("slidesWanted").value);
  if (!Number.isInteger(slideCount) || slideCount < 1 || slideCount > 20) {
    $("saved").textContent = "Slides ki tadaad 1 se 20 ke darmiyan rakhein.";
    return;
  }

  let contents;
  try {
    contents = makeSlidesFromText(text, slideCount);
  } catch (e) {
    $("saved").textContent = e.message;
    return;
  }
  pendingBulkSlides = contents;
  $("bulkConfirmMessage").textContent = `${contents.length} slides banengi aur mojooda carousel replace hoga. Continue karein?`;
  $("bulkConfirm").hidden = false;
  $("saved").textContent = "";
};

function applyBulkSlides(contents) {
  clearTimeout(timer);
  saveActiveSlide();
  state.slides = contents.map((content, index) => ({
    name: `Slide ${index + 1}`,
    sub: "",
    text: content,
    foot: index === contents.length - 1 ? state.foot : ""
  }));
  state.activeSlide = 0;
  Object.assign(state, state.slides[0]);
  syncControls();
  render();
  snapshot();
  save();
  $("saved").textContent = `${contents.length} slides tayyar hain. Har slide check karein.`;
}

$("confirmGenerateSlides").onclick = () => {
  if (!pendingBulkSlides) return;
  const contents = pendingBulkSlides;
  pendingBulkSlides = null;
  $("bulkConfirm").hidden = true;
  applyBulkSlides(contents);
};

$("cancelGenerateSlides").onclick = () => {
  pendingBulkSlides = null;
  $("bulkConfirm").hidden = true;
};

function parseNumberedPosts(text, required = true) {
  const heading = /^[ \t]*\*{0,2}[ \t]*(\d+)\.[ \t]*(.*?)[ \t]*\*{0,2}[ \t]*$/gm;
  const matches = [...text.matchAll(heading)];
  if (!matches.length) {
    if (!required) return [];
    throw new Error("Har post ke title ko **1. Title** format mein likhein.");
  }
  if (matches.length > 50) {
    throw new Error("Ek ZIP mein zyada se zyada 50 posts export karein.");
  }

  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
    const lines = text.slice(start, end).trim().split(/\r?\n/);
    const hashtags = lines.filter(line => /^\s*#[\w#\s]+\s*$/.test(line)).join(" ").trim();
    const body = lines.filter(line => !/^\s*#[\w#\s]+\s*$/.test(line)).join("\n").trim();
    const title = match[2].trim();
    if (!title || !body) {
      throw new Error(`Post ${match[1]} mein title ya message missing hai.`);
    }
    return { number: Number(match[1]), title, body, hashtags };
  });
}

function postFileName(post, index) {
  const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${String(index + 1).padStart(2, "0")}-${slug || "post"}.png`;
}

async function exportPostCards(posts) {
  if (!window.html2canvas) throw new Error("Image export ke liye internet connection check karein.");
  if (!window.JSZip) throw new Error("ZIP banane ke liye internet connection check karein.");

  const originalState = { ...state };
  const zip = new JSZip();
  try {
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      state = { ...originalState, name: post.title, sub: "", text: post.body, foot: post.hashtags };
      render();
      const canvas = await makeCanvas();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      canvas.width = 0;
      canvas.height = 0;
      if (!blob) throw new Error(`Post ${post.number} ki image export nahi hui.`);
      zip.file(postFileName(post, i), blob);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeExportName()}-posts.zip`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } finally {
    state = originalState;
    syncControls();
    render();
  }
}

$("downloadPosts").onclick = () => busy($("downloadPosts"), "Posts ban rahe hain...", async () => {
  const posts = parseNumberedPosts($("bulkText").value);
  await exportPostCards(posts);
  $("saved").textContent = `${posts.length} post images ZIP mein download ho gayi.`;
});

["bulkText", "slidesWanted"].forEach(id => $(id).addEventListener("input", () => {
  if (!pendingBulkSlides) return;
  pendingBulkSlides = null;
  $("bulkConfirm").hidden = true;
}));

const tabs = [...document.querySelectorAll("[role=tab]")];
function openTab(tab) {
  tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute("aria-selected", on);
    t.tabIndex = on ? 0 : -1;
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

function readSavedDesigns() {
  try {
    const raw = localStorage.getItem(DESIGN_KEY);
    const parsed = raw ? JSON.parse(raw) : { designs: [] };
    return Array.isArray(parsed.designs) ? parsed.designs : [];
  } catch (e) {
    return [];
  }
}

function writeSavedDesigns(list) {
  localStorage.setItem(DESIGN_KEY, JSON.stringify({ designs: list }));
}

function syncSavedDesigns() {
  const select = $("savedDesigns");
  const items = readSavedDesigns();
  const current = select.value;
  select.innerHTML = "";
  if (!items.length) {
    const opt = new Option("No saved designs", "");
    select.add(opt);
    $("renameName").value = "";
    $("loadDesign").disabled = true;
    $("renameDesign").disabled = true;
    $("deleteDesign").disabled = true;
    return;
  }
  items.forEach(item => select.add(new Option(item.name, item.name)));
  if (current && items.some(item => item.name === current)) {
    select.value = current;
  } else {
    select.value = items[0].name;
  }
  $("renameName").value = select.value;
  const hasSelection = Boolean(select.value);
  $("loadDesign").disabled = !hasSelection;
  $("renameDesign").disabled = !hasSelection;
  $("deleteDesign").disabled = !hasSelection;
}

$("savedDesigns").addEventListener("change", () => {
  $("renameName").value = $("savedDesigns").value;
});

$("saveDesign").onclick = () => {
  try {
    const list = readSavedDesigns();
    const name = (state.designName || "My story").trim() || "My story";
    const payload = {
      name,
      state: { ...state },
      images: Object.fromEntries([state.photo, state.bg, state.logo].filter(Boolean).map(id => [id, IMG[id]]))
    };
    const idx = list.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) list[idx] = payload;
    else list.push(payload);
    writeSavedDesigns(list);
    syncSavedDesigns();
    $("saved").textContent = `Design "${name}" save ho gaya`;
  } catch (e) {
    $("saved").textContent = "Design save nahi ho saka. Browser storage ki jagah check karein.";
  }
};

$("loadDesign").onclick = () => {
  const name = $("savedDesigns").value;
  if (!name) return;
  const list = readSavedDesigns();
  const item = list.find(entry => entry.name === name);
  if (!item) return;
  state = { ...DEFAULT, ...item.state };
  normalizeSlides();
  IMG = item.images || {};
  syncControls();
  render();
  snapshot();
  save();
  $("saved").textContent = `Design "${name}" load ho gaya`;
};

$("renameDesign").onclick = () => {
  const selected = $("savedDesigns").value;
  if (!selected) return;
  const list = readSavedDesigns();
  const item = list.find(entry => entry.name === selected);
  if (!item) return;
  const trimmed = $("renameName").value.trim();
  if (!trimmed) {
    alert("Design name khali nahi ho sakta.");
    return;
  }
  if (list.some(entry => entry !== item && entry.name.toLowerCase() === trimmed.toLowerCase())) {
    alert("Is naam ka design pehle se maujood hai.");
    return;
  }
  try {
    item.name = trimmed.slice(0, 30);
    item.state.designName = item.name;
    writeSavedDesigns(list);
    if (state.designName === selected) state.designName = item.name;
    syncControls();
    syncSavedDesigns();
    $("savedDesigns").value = item.name;
    $("saved").textContent = `Design "${item.name}" rename ho gaya`;
  } catch (e) {
    $("saved").textContent = "Design rename nahi ho saka. Browser storage ki jagah check karein.";
  }
};

$("deleteDesign").onclick = () => {
  const selected = $("savedDesigns").value;
  if (!selected || !confirm(`"${selected}" design delete karein?`)) return;
  try {
    writeSavedDesigns(readSavedDesigns().filter(item => item.name !== selected));
    syncSavedDesigns();
    $("saved").textContent = `Design "${selected}" delete ho gaya`;
  } catch (e) {
    $("saved").textContent = "Design delete nahi ho saka.";
  }
};

async function makeCanvas() {
  await document.fonts.ready;
  return html2canvas($("card"), { scale: state.exportW / $("card").offsetWidth, backgroundColor: null, useCORS: true });
}

async function exportImage(type) {
  if (!window.html2canvas) throw new Error("HTML to canvas load nahi hua. Internet connection check karein.");
  const canvas = await makeCanvas();
  const mime = type === "jpg" ? "image/jpeg" : "image/png";
  const ext = type === "jpg" ? "jpg" : "png";
  const quality = type === "jpg" ? Math.min(1, Math.max(0.5, state.jpgQuality / 100)) : 1;
  const blob = await new Promise(resolve => canvas.toBlob(resolve, mime, quality));
  if (!blob) throw new Error("Image export fail ho gaya.");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeExportName()}.${ext}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function safeExportName() {
  return (state.exportName || "story-card").trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "-")
    .replace(/[. ]+$/g, "")
    .slice(0, 50) || "story-card";
}

async function exportCarousel() {
  if (!window.html2canvas) throw new Error("HTML to canvas load nahi hua. Internet connection check karein.");
  if (!window.JSZip) throw new Error("Carousel ZIP banane ke liye internet connection check karein.");

  saveActiveSlide();
  const active = state.activeSlide;
  const zip = new JSZip();
  try {
    for (let i = 0; i < state.slides.length; i++) {
      state.activeSlide = i;
      Object.assign(state, state.slides[i]);
      syncControls();
      render();
      const canvas = await makeCanvas();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error(`Slide ${i + 1} image export fail ho gaya.`);
      zip.file(`${safeExportName()}-${String(i + 1).padStart(2, "0")}.png`, blob);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeExportName()}-carousel.zip`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } finally {
    state.activeSlide = active;
    Object.assign(state, state.slides[active]);
    syncControls();
    render();
  }
}

async function busy(btn, label, job) {
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = label;
  try {
    await job();
  } catch (e) {
    alert(e.message);
  }
  btn.disabled = false;
  btn.textContent = old;
}

$("dl").onclick = () => busy($("dl"), "Ban raha hai...", async () => {
  await exportImage("png");
});

$("dlJpg").onclick = () => busy($("dlJpg"), "Ban raha hai...", async () => {
  await exportImage("jpg");
});

$("downloadCarousel").onclick = () => busy($("downloadCarousel"), "Carousel ban raha hai...", exportCarousel);

$("copy").onclick = () => busy($("copy"), "Copy ho raha hai...", async () => {
  if (!navigator.clipboard || !window.ClipboardItem) throw new Error("Image copy sirf localhost ya https par chalta hai. PNG/JPG download istemal karein.");
  const canvas = await makeCanvas();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Image clipboard mein copy nahi hui.");
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  $("saved").textContent = "Image copy ho gayi";
});

const dropTarget = $("card");
dropTarget.addEventListener("dragover", e => {
  e.preventDefault();
  dropTarget.classList.add("dragging");
});

dropTarget.addEventListener("dragleave", e => {
  e.preventDefault();
  dropTarget.classList.remove("dragging");
});

dropTarget.addEventListener("drop", e => {
  e.preventDefault();
  dropTarget.classList.remove("dragging");
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => {
    const id = "i" + Date.now().toString(36);
    IMG[id] = reader.result;
    state.bg = id;
    changed();
  };
  reader.readAsDataURL(file);
});

try {
  const d = JSON.parse(localStorage.getItem(KEY));
  if (d && d.state) {
    state = { ...DEFAULT, ...d.state };
    IMG = d.images || {};
  }
} catch (e) {}

normalizeSlides();
syncControls();
syncSavedDesigns();
render();
snapshot();
document.fonts.ready.then(render);
