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
  customGradient: false, gradientStart: "#243b55", gradientEnd: "#141e30", gradientAngle: 135,
  bgBrightness: 100, bgSaturation: 100, bgBlur: 0, bgPositionX: 50, bgPositionY: 50,
  stickers: [],
};
const KEY = "story-maker-v1";
const DESIGN_KEY = "story-maker-designs-v1";
const SCHEDULE_KEY = "story-maker-schedule-v1";
const BACKGROUND_KEY = "story-maker-backgrounds-v1";
const slideFields = ["name", "sub", "text", "foot"];
let state = { ...DEFAULT, activeSlide: 0, slides: [{ name: DEFAULT.name, sub: DEFAULT.sub, text: DEFAULT.text, foot: DEFAULT.foot }] }, IMG = {};
let hist = [], at = -1, timer = null;
let selectedStickerId = "";
let stickerDrag = null;

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
  card.style.background = state.customGradient
    ? `linear-gradient(${state.gradientAngle}deg, ${state.gradientStart}, ${state.gradientEnd})`
    : t.bg;
  const background = $("cardBackground");
  if (state.bg && IMG[state.bg]) {
    const dim = state.dim / 100;
    background.hidden = false;
    background.style.backgroundImage = `linear-gradient(rgba(0,0,0,${dim}),rgba(0,0,0,${dim})), url("${IMG[state.bg]}")`;
    background.style.backgroundPosition = `${state.bgPositionX}% ${state.bgPositionY}%`;
    background.style.filter = `brightness(${state.bgBrightness / 100}) saturate(${state.bgSaturation / 100}) blur(${state.bgBlur}px)`;
  } else {
    background.hidden = true;
    background.style.backgroundImage = "none";
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
  renderStickers();

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
  $("gradientAngleOut").textContent = state.gradientAngle + "°";
  $("bgBrightnessOut").textContent = state.bgBrightness + "%";
  $("bgSaturationOut").textContent = state.bgSaturation + "%";
  $("bgBlurOut").textContent = state.bgBlur + " px";
  $("bgPositionXOut").textContent = state.bgPositionX + "%";
  $("bgPositionYOut").textContent = state.bgPositionY + "%";
  $("photoRm").hidden = !state.photo;
  $("bgRm").hidden = !state.bg;
  $("logoRm").hidden = !state.logo;
  $("warn").hidden = card.scrollHeight <= card.clientHeight + 2;
  updateSlideControls();
}

function renderStickers() {
  const card = $("card");
  card.querySelectorAll(".card-sticker").forEach(sticker => sticker.remove());
  if (!Array.isArray(state.stickers)) state.stickers = [];
  state.stickers.forEach(sticker => {
    const element = document.createElement("span");
    element.className = "card-sticker";
    if (sticker.id === selectedStickerId) element.classList.add("selected");
    element.textContent = sticker.emoji;
    element.style.left = `${sticker.x}%`;
    element.style.top = `${sticker.y}%`;
    element.dataset.stickerId = sticker.id;
    element.setAttribute("role", "button");
    element.setAttribute("tabindex", "0");
    element.setAttribute("aria-label", `${sticker.emoji} sticker; drag to move`);
    element.addEventListener("keydown", e => {
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeSticker(sticker.id);
      }
    });
    card.append(element);
  });
  $("removeSticker").disabled = !state.stickers.some(sticker => sticker.id === selectedStickerId);
}

function removeSticker(id) {
  state.stickers = state.stickers.filter(sticker => sticker.id !== id);
  selectedStickerId = "";
  changed();
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
  state.stickers = Array.isArray(state.stickers) ? state.stickers.map(sticker => ({ ...sticker })) : [];
}

function updateSlideControls() {
  const count = state.slides.length;
  $("slideCount").textContent = `Slide ${state.activeSlide + 1} / ${count}`;
  $("prevSlide").disabled = state.activeSlide <= 0;
  $("nextSlide").disabled = state.activeSlide >= count - 1;
  $("removeSlide").disabled = count <= 1;
  $("duplicateSlide").disabled = count >= 20;
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

const FONT_PAIRS = {
  classic: { nFont: "Playfair Display", tFont: "Lora" },
  modern: { nFont: "Poppins", tFont: "Inter" },
  editorial: { nFont: "Merriweather", tFont: "Lora" },
  bold: { nFont: "Roboto Slab", tFont: "Inter" }
};

$("applyFontPair").onclick = () => {
  const pair = FONT_PAIRS[$("fontPair").value];
  if (!pair) return;
  Object.assign(state, pair);
  syncControls();
  changed();
  $("saved").textContent = "Font pairing apply ho gayi.";
};

document.querySelectorAll("[data-sticker]").forEach(button => {
  button.addEventListener("click", () => {
    if (state.stickers.length >= 30) {
      $("saved").textContent = "Ek card par zyada se zyada 30 stickers laga sakte hain.";
      return;
    }
    const id = `s${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    state.stickers.push({ id, emoji: button.dataset.sticker, x: 50, y: 50 });
    selectedStickerId = id;
    changed();
    $("saved").textContent = "Sticker add ho gaya. Card par drag karke jagah badlein.";
  });
});

$("removeSticker").onclick = () => {
  if (selectedStickerId) removeSticker(selectedStickerId);
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

function readBackgroundLibrary() {
  const raw = localStorage.getItem(BACKGROUND_KEY);
  if (!raw) return [];
  const items = JSON.parse(raw);
  if (!Array.isArray(items)) throw new Error("Background library data durust nahi hai.");
  return items;
}

function syncBackgroundLibrary() {
  const select = $("savedBackgrounds");
  const previous = select.value;
  const backgrounds = readBackgroundLibrary();
  select.replaceChildren();
  if (!backgrounds.length) {
    select.add(new Option("No saved backgrounds", ""));
  } else {
    backgrounds.forEach(item => select.add(new Option(item.name, item.id)));
    if (backgrounds.some(item => item.id === previous)) select.value = previous;
  }
  $("applyBackground").disabled = backgrounds.length === 0;
  $("deleteBackground").disabled = backgrounds.length === 0;
}

$("saveBackground").onclick = () => {
  try {
    if (!state.bg || !IMG[state.bg]) throw new Error("Pehle background photo upload ya apply karein.");
    const list = readBackgroundLibrary();
    const name = $("backgroundName").value.trim().slice(0, 30) || `Background ${list.length + 1}`;
    const existing = list.find(item => item.name.toLowerCase() === name.toLowerCase());
    let selectedId;
    if (existing) {
      existing.dataUrl = IMG[state.bg];
      selectedId = existing.id;
    } else {
      const id = `background-${Date.now().toString(36)}`;
      list.push({ id, name, dataUrl: IMG[state.bg] });
      selectedId = id;
    }
    localStorage.setItem(BACKGROUND_KEY, JSON.stringify(list));
    syncBackgroundLibrary();
    $("savedBackgrounds").value = selectedId;
    $("saved").textContent = `Background "${name}" library mein save ho gaya.`;
  } catch (e) {
    $("saved").textContent = `Background save nahi hua: ${e.message}`;
  }
};

$("applyBackground").onclick = () => {
  try {
    const item = readBackgroundLibrary().find(entry => entry.id === $("savedBackgrounds").value);
    if (!item || !item.dataUrl.startsWith("data:image/")) throw new Error("Saved background nahi mila ya file invalid hai.");
    const id = `i${Date.now().toString(36)}`;
    IMG[id] = item.dataUrl;
    state.bg = id;
    $("backgroundName").value = item.name;
    changed();
    $("saved").textContent = `Background "${item.name}" apply ho gaya.`;
  } catch (e) {
    $("saved").textContent = `Background apply nahi hua: ${e.message}`;
  }
};

$("deleteBackground").onclick = () => {
  try {
    const id = $("savedBackgrounds").value;
    const list = readBackgroundLibrary();
    const item = list.find(entry => entry.id === id);
    if (!item) throw new Error("Pehle saved background chunein.");
    localStorage.setItem(BACKGROUND_KEY, JSON.stringify(list.filter(entry => entry.id !== id)));
    syncBackgroundLibrary();
    $("saved").textContent = `Background "${item.name}" library se delete ho gaya.`;
  } catch (e) {
    $("saved").textContent = `Background delete nahi hua: ${e.message}`;
  }
};

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
    state = { ...DEFAULT, stickers: [], activeSlide: 0, slides: [{ name: DEFAULT.name, sub: DEFAULT.sub, text: DEFAULT.text, foot: DEFAULT.foot }] };
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

$("duplicateSlide").onclick = () => {
  if (state.slides.length >= 20) {
    $("saved").textContent = "Carousel mein zyada se zyada 20 slides ho sakti hain.";
    return;
  }
  saveActiveSlide();
  const index = state.activeSlide + 1;
  state.slides.splice(index, 0, { ...state.slides[state.activeSlide] });
  activateSlide(index);
  $("saved").textContent = "Slide duplicate ho gayi.";
};

$("removeSlide").onclick = () => {
  if (state.slides.length <= 1) return;
  state.slides.splice(state.activeSlide, 1);
  const index = Math.min(state.activeSlide, state.slides.length - 1);
  activateSlide(index, true, false);
};

let swipeStart = null;
const previewCard = $("card");
function finishSwipe(x, y, id, source) {
  if (!swipeStart || swipeStart.id !== id || swipeStart.source !== source) return;
  const dx = x - swipeStart.x;
  const dy = y - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return;
  if (dx < 0 && state.activeSlide < state.slides.length - 1) activateSlide(state.activeSlide + 1);
  else if (dx > 0 && state.activeSlide > 0) activateSlide(state.activeSlide - 1);
}

previewCard.addEventListener("pointerdown", e => {
  const stickerElement = e.target.closest(".card-sticker");
  if (stickerElement) {
    e.preventDefault();
    const sticker = state.stickers.find(item => item.id === stickerElement.dataset.stickerId);
    if (!sticker) return;
    selectedStickerId = sticker.id;
    previewCard.querySelectorAll(".card-sticker").forEach(item => item.classList.toggle("selected", item === stickerElement));
    $("removeSticker").disabled = false;
    stickerDrag = { id: e.pointerId, sticker, element: stickerElement };
    return;
  }
  if (e.pointerType === "touch" || e.button !== 0 || !e.isPrimary) return;
  swipeStart = { x: e.clientX, y: e.clientY, id: e.pointerId, source: "pointer" };
});

window.addEventListener("pointermove", e => {
  if (!stickerDrag || stickerDrag.id !== e.pointerId) return;
  const bounds = previewCard.getBoundingClientRect();
  stickerDrag.sticker.x = Math.min(100, Math.max(0, ((e.clientX - bounds.left) / bounds.width) * 100));
  stickerDrag.sticker.y = Math.min(100, Math.max(0, ((e.clientY - bounds.top) / bounds.height) * 100));
  stickerDrag.element.style.left = `${stickerDrag.sticker.x}%`;
  stickerDrag.element.style.top = `${stickerDrag.sticker.y}%`;
});

window.addEventListener("pointerup", e => {
  finishSwipe(e.clientX, e.clientY, e.pointerId, "pointer");
  if (stickerDrag && stickerDrag.id === e.pointerId) {
    stickerDrag = null;
    changed();
  }
});

window.addEventListener("pointercancel", e => {
  if (swipeStart && swipeStart.source === "pointer" && e.pointerId === swipeStart.id) swipeStart = null;
  if (stickerDrag && stickerDrag.id === e.pointerId) stickerDrag = null;
});

previewCard.addEventListener("touchstart", e => {
  if (e.target.closest(".card-sticker")) return;
  const touch = e.changedTouches[0];
  if (!touch) return;
  swipeStart = { x: touch.clientX, y: touch.clientY, id: touch.identifier, source: "touch" };
}, { passive: true });

window.addEventListener("touchend", e => {
  const touch = Array.from(e.changedTouches).find(item => swipeStart && item.identifier === swipeStart.id);
  if (touch) finishSwipe(touch.clientX, touch.clientY, touch.identifier, "touch");
}, { passive: true });

window.addEventListener("touchcancel", e => {
  if (swipeStart && swipeStart.source === "touch" &&
      Array.from(e.changedTouches).some(item => item.identifier === swipeStart.id)) {
    swipeStart = null;
  }
});

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

function readScheduledPosts() {
  const raw = localStorage.getItem(SCHEDULE_KEY);
  if (!raw) return [];
  const items = JSON.parse(raw);
  if (!Array.isArray(items)) throw new Error("Saved schedule data durust nahi hai.");
  return items;
}

function renderScheduledPosts() {
  const container = $("scheduledPosts");
  container.replaceChildren();
  const posts = readScheduledPosts().sort((a, b) => new Date(a.when) - new Date(b.when));
  if (!posts.length) {
    const empty = document.createElement("li");
    empty.textContent = "Abhi koi post schedule nahi hui.";
    container.append(empty);
    return;
  }

  posts.forEach(post => {
    const row = document.createElement("li");
    const details = document.createElement("span");
    const date = new Date(post.when);
    details.textContent = `${date.toLocaleString()} · ${post.platform} · ${post.title}`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ghost";
    remove.textContent = "Hataayen";
    remove.setAttribute("aria-label", `${post.title} schedule se hataayen`);
    remove.onclick = () => {
      try {
        localStorage.setItem(SCHEDULE_KEY, JSON.stringify(readScheduledPosts().filter(item => item.id !== post.id)));
        renderScheduledPosts();
        $("saved").textContent = "Scheduled post hata di gayi.";
      } catch (e) {
        $("saved").textContent = `Schedule update nahi hui: ${e.message}`;
      }
    };
    row.append(details, remove);
    container.append(row);
  });
}

$("schedulePosts").onclick = () => {
  try {
    const posts = parseNumberedPosts($("bulkText").value);
    const start = new Date($("scheduleStart").value);
    const gapDays = Number($("scheduleGap").value);
    if (!Number.isFinite(start.getTime()) || start <= new Date()) {
      throw new Error("Pehli post ke liye future date aur waqt chunein.");
    }
    if (!Number.isInteger(gapDays) || gapDays < 1 || gapDays > 30) {
      throw new Error("Posts ke darmiyan 1 se 30 din chunein.");
    }

    const platform = $("schedulePlatform").value;
    const scheduled = posts.map((post, index) => {
      const when = new Date(start);
      when.setDate(when.getDate() + gapDays * index);
      return {
        id: `${Date.now().toString(36)}-${index}`,
        title: post.title,
        caption: `${post.title}\n\n${post.body}${post.hashtags ? `\n\n${post.hashtags}` : ""}`,
        platform,
        when: when.toISOString()
      };
    });
    const all = [...readScheduledPosts(), ...scheduled];
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(all));
    renderScheduledPosts();
    $("saved").textContent = `${scheduled.length} posts ke reminders save ho gaye.`;
  } catch (e) {
    $("saved").textContent = `Schedule nahi hui: ${e.message}`;
  }
};

function escapeCalendarText(value) {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function calendarDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function foldCalendarLine(line) {
  const encoder = new TextEncoder();
  const segments = [];
  let segment = "";
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) {
      segments.push(segment);
      segment = ` ${character}`;
      bytes = size + 1;
    } else {
      segment += character;
      bytes += size;
    }
  }
  segments.push(segment);
  return segments.join("\r\n");
}

$("exportSchedule").onclick = () => {
  try {
    const posts = readScheduledPosts();
    if (!posts.length) throw new Error("Pehle numbered posts schedule karein.");
    const stamp = calendarDate(new Date());
    const events = posts.map(post => {
      const when = new Date(post.when);
      if (!Number.isFinite(when.getTime())) throw new Error("Schedule mein invalid date hai.");
      return [
        "BEGIN:VEVENT",
        `UID:${post.id}@story-card-maker`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${calendarDate(when)}`,
        "DURATION:PT30M",
        `SUMMARY:${escapeCalendarText(`${post.platform} post: ${post.title}`)}`,
        `DESCRIPTION:${escapeCalendarText(post.caption)}`,
        "BEGIN:VALARM",
        "TRIGGER:-PT15M",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeCalendarText(`Post reminder: ${post.title}`)}`,
        "END:VALARM",
        "END:VEVENT"
      ].map(foldCalendarLine).join("\r\n");
    });
    const calendar = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Story Maker//Post Schedule//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
    const blob = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "story-maker-schedule.ics";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    $("saved").textContent = "Calendar file download ho gayi.";
  } catch (e) {
    $("saved").textContent = `Calendar export nahi hui: ${e.message}`;
  }
};

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

function shareableState() {
  const shared = { ...state, photo: "", bg: "", logo: "" };
  return { version: 1, state: shared };
}

$("createShareLink").onclick = async () => {
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(shareableState()))));
    if (encoded.length > 8000) throw new Error("Link lamba hai. Text chhota karein ya slides kam karein.");
    const base = /^https?:$/.test(location.protocol)
      ? `${location.origin}${location.pathname}${location.search}`
      : "https://nomammali234-dot.github.io/story-card-maker/";
    const link = `${base}#design=${encoded}`;
    $("shareLink").value = link;
    try {
      await navigator.clipboard.writeText(link);
      $("saved").textContent = "Design link copy ho gaya. Images link mein shamil nahi hain.";
    } catch (e) {
      $("shareLink").focus();
      $("shareLink").select();
      $("saved").textContent = "Link ban gaya. Copy ke liye Ctrl+C dabayein.";
    }
  } catch (e) {
    $("saved").textContent = `Share link nahi bana: ${e.message}`;
  }
};

function importShareFromHash() {
  const match = location.hash.match(/(?:^#|&)design=([^&]+)/);
  if (!match) return false;
  const payload = JSON.parse(decodeURIComponent(escape(atob(match[1]))));
  if (payload.version !== 1 || !payload.state || typeof payload.state !== "object") {
    throw new Error("Share link ka design format durust nahi hai.");
  }
  const incoming = payload.state;
  const next = { ...DEFAULT };
  Object.keys(DEFAULT).forEach(key => {
    if (key !== "stickers" && typeof incoming[key] === typeof DEFAULT[key]) next[key] = incoming[key];
  });
  if (!TEMPLATES[next.tpl]) next.tpl = DEFAULT.tpl;
  if (!FONTS[next.nFont]) next.nFont = DEFAULT.nFont;
  if (!FONTS[next.tFont]) next.tFont = DEFAULT.tFont;
  if (!["left", "center", "right"].includes(next.align)) next.align = DEFAULT.align;
  if (!["r916", "r45", "r34", "r11", "r169", "auto"].includes(next.ratio)) next.ratio = DEFAULT.ratio;
  if (!/^#[0-9a-f]{6}$/i.test(next.gradientStart)) next.gradientStart = DEFAULT.gradientStart;
  if (!/^#[0-9a-f]{6}$/i.test(next.gradientEnd)) next.gradientEnd = DEFAULT.gradientEnd;
  if (next.hl && !/^#[0-9a-f]{6}$/i.test(next.hl)) next.hl = "";
  if (next.textColor && !/^#[0-9a-f]{6}$/i.test(next.textColor)) next.textColor = "";
  const clamp = (value, min, max, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  };
  next.nSize = clamp(next.nSize, 12, 30, DEFAULT.nSize);
  next.tSize = clamp(next.tSize, 11, 26, DEFAULT.tSize);
  next.exportW = [720, 1080, 1440, 2160].includes(Number(next.exportW)) ? Number(next.exportW) : DEFAULT.exportW;
  next.gradientAngle = clamp(next.gradientAngle, 0, 360, DEFAULT.gradientAngle);
  next.bgBrightness = clamp(next.bgBrightness, 30, 170, DEFAULT.bgBrightness);
  next.bgSaturation = clamp(next.bgSaturation, 0, 200, 100);
  next.bgBlur = clamp(next.bgBlur, 0, 12, 0);
  next.bgPositionX = clamp(next.bgPositionX, 0, 100, 50);
  next.bgPositionY = clamp(next.bgPositionY, 0, 100, 50);
  next.dim = clamp(next.dim, 0, 85, DEFAULT.dim);
  next.lineHeight = clamp(next.lineHeight, 1.1, 2.2, DEFAULT.lineHeight);
  next.letterSpacing = clamp(next.letterSpacing, 0, 3, 0);
  next.jpgQuality = clamp(next.jpgQuality, 50, 100, DEFAULT.jpgQuality);
  next.slides = Array.isArray(incoming.slides) ? incoming.slides.slice(0, 20) : [];
  next.activeSlide = Math.min(Number(incoming.activeSlide) || 0, Math.max(0, next.slides.length - 1));
  next.stickers = Array.isArray(incoming.stickers) ? incoming.stickers.slice(0, 30)
    .filter(item => item && typeof item.emoji === "string" && item.emoji.length <= 8)
    .map((item, index) => ({
      id: `shared-${index}`,
      emoji: item.emoji,
      x: Math.min(100, Math.max(0, Number(item.x) || 0)),
      y: Math.min(100, Math.max(0, Number(item.y) || 0))
    })) : [];
  next.photo = "";
  next.bg = "";
  next.logo = "";
  state = next;
  normalizeSlides();
  return true;
}

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

async function exportAllSizes() {
  if (!window.html2canvas) throw new Error("Image export ke liye internet connection check karein.");
  if (!window.JSZip) throw new Error("ZIP banane ke liye internet connection check karein.");
  const originalRatio = state.ratio;
  const sizes = [
    { ratio: "r916", name: "story-9x16" },
    { ratio: "r45", name: "portrait-4x5" },
    { ratio: "r34", name: "portrait-3x4" },
    { ratio: "r11", name: "square-1x1" },
    { ratio: "r169", name: "landscape-16x9" }
  ];
  const zip = new JSZip();
  try {
    for (const size of sizes) {
      state.ratio = size.ratio;
      render();
      const canvas = await makeCanvas();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      canvas.width = 0;
      canvas.height = 0;
      if (!blob) throw new Error(`${size.name} export nahi hua.`);
      zip.file(`${safeExportName()}-${size.name}-${state.exportW}px.png`, blob);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeExportName()}-all-sizes.zip`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } finally {
    state.ratio = originalRatio;
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
$("exportAllSizes").onclick = () => busy($("exportAllSizes"), "All sizes ban rahe hain...", exportAllSizes);

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

let importedShare = false;
try {
  importedShare = importShareFromHash();
} catch (e) {
  $("saved").textContent = `Share link load nahi hua: ${e.message}`;
}

normalizeSlides();
syncControls();
syncSavedDesigns();
try {
  syncBackgroundLibrary();
} catch (e) {
  $("saved").textContent = `Background library load nahi hui: ${e.message}`;
}
try {
  renderScheduledPosts();
} catch (e) {
  $("saved").textContent = `Saved schedule load nahi hui: ${e.message}`;
}
render();
snapshot();
if (importedShare) save();
document.fonts.ready.then(render);
