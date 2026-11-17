const $ = id => document.getElementById(id);

const TEMPLATES = {
  "Burgundy": { bg: "linear-gradient(165deg,#56313a,#2a1c24)", box: "rgba(174,100,115,.34)", text: "#fbf3ef", hl: "#e1bd78" },
  "Midnight": { bg: "linear-gradient(165deg,#26394c,#111d2a)", box: "rgba(84,127,162,.34)", text: "#f0f5f7", hl: "#8fc6d2" },
  "Forest": { bg: "linear-gradient(165deg,#2c493d,#152921)", box: "rgba(105,151,121,.32)", text: "#f2f6ef", hl: "#c3d6a0" },
  "Charcoal": { bg: "linear-gradient(165deg,#3b4248,#202529)", box: "rgba(255,255,255,.09)", text: "#f2f5f4", hl: "#d7ad79" },
  "Paper": { bg: "linear-gradient(165deg,#f3eadb,#e4d7bf)", box: "rgba(255,252,242,.85)", text: "#302b25", hl: "#9a5837" },
  "Aurora": { bg: "linear-gradient(160deg,#2c4760,#36475a)", box: "rgba(120,174,188,.2)", text: "#f2f6f7", hl: "#a6d9d3" },
  "Sunset": { bg: "linear-gradient(150deg,#573b40,#b96e5c)", box: "rgba(255,244,226,.16)", text: "#fff7f0", hl: "#f2ce88" },
  "Lavender": { bg: "linear-gradient(160deg,#46445e,#756684)", box: "rgba(255,255,255,.13)", text: "#fbf8ff", hl: "#e1c4d7" },
  "Ocean": { bg: "linear-gradient(160deg,#123f4a,#287d80)", box: "rgba(210,245,245,.17)", text: "#eef9f8", hl: "#9de2d1" }
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
  customGradient: false, gradientStart: "#28485a", gradientEnd: "#152631", gradientAngle: 135,
  bgBrightness: 100, bgSaturation: 100, bgBlur: 0, bgPositionX: 50, bgPositionY: 50,
  stickers: [], qrText: "", layerOrder: ["profile", "story", "footer", "watermark", "qr", "stickers"], hiddenLayers: {},
};
const KEY = "story-maker-v1";
const DESIGN_KEY = "story-maker-designs-v1";
const SCHEDULE_KEY = "story-maker-schedule-v1";
const BACKGROUND_KEY = "story-maker-backgrounds-v1";
const FONT_KEY = "story-maker-fonts-v1";
const BRAND_KEY = "story-maker-brand-kits-v1";
const FAVORITES_KEY = "story-maker-template-favorites-v1";
const LANGUAGE_KEY = "story-maker-language-v1";
const slideFields = ["name", "sub", "text", "foot"];
let state = { ...DEFAULT, activeSlide: 0, slides: [{ name: DEFAULT.name, sub: DEFAULT.sub, text: DEFAULT.text, foot: DEFAULT.foot }] }, IMG = {};
let hist = [], at = -1, timer = null;
let selectedStickerId = "";
let stickerDrag = null;
let currentLanguage = localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "ur";

function readCustomFontRecords() {
  const raw = localStorage.getItem(FONT_KEY);
  if (!raw) return [];
  const records = JSON.parse(raw);
  if (!Array.isArray(records)) throw new Error("Custom font data durust nahi hai.");
  return records.filter(item => item && typeof item.name === "string" && /^[\w -]{1,30}$/.test(item.name) &&
    typeof item.dataUrl === "string" && /^data:[\w.+/-]+;base64,[A-Za-z0-9+/=]+$/.test(item.dataUrl));
}

let customFontRecords = [];
const loadedCustomFonts = new Map();
try {
  customFontRecords = readCustomFontRecords();
  customFontRecords.forEach(font => {
    if (/^[\w -]{1,30}$/.test(font.name) && !FONTS[font.name]) FONTS[font.name] = `"${font.name}"`;
  });
} catch (e) {
  $("saved").textContent = `Custom fonts load nahi huay: ${e.message}`;
}

async function loadCustomFont(font) {
  const face = new FontFace(font.name, `url(${font.dataUrl})`);
  await face.load();
  document.fonts.add(face);
  loadedCustomFonts.set(font.name, face);
}

customFontRecords.forEach(font => {
  if (!/^[\w -]{1,30}$/.test(font.name) || !/^data:[\w.+/-]+;base64,[A-Za-z0-9+/=]+$/.test(font.dataUrl)) return;
  loadCustomFont(font).catch(error => {
    $("saved").textContent = `Font "${font.name}" load nahi hua: ${error.message}`;
  });
});

function refreshFontOptions() {
  [$("nFont"), $("tFont")].forEach(select => {
    const selected = select.value;
    select.replaceChildren(...Object.keys(FONTS).map(name => new Option(name, name)));
    if (FONTS[selected]) select.value = selected;
  });
}

$("fontFile").addEventListener("change", async () => {
  const file = $("fontFile").files[0];
  if (!file) return;
  if (file.size > 750 * 1024) {
    $("saved").textContent = "Font file 750 KB se chhoti honi chahiye.";
    $("fontFile").value = "";
    return;
  }
  const extension = file.name.split(".").pop().toLowerCase();
  if (!["ttf", "otf", "woff", "woff2"].includes(extension)) {
    $("saved").textContent = "Sirf TTF, OTF, WOFF ya WOFF2 font upload karein.";
    $("fontFile").value = "";
    return;
  }
  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^\w -]/g, "").trim().slice(0, 24) || "Custom font";
  const name = /^[\w -]{1,30}$/.test(baseName) && !FONTS[baseName] ? baseName : `${baseName.slice(0, 20)} Custom`;
  if (FONTS[name]) {
    $("saved").textContent = "Is naam ka font pehle se maujood hai. File rename karke upload karein.";
    $("fontFile").value = "";
    return;
  }
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Font file read nahi ho saki."));
      reader.readAsDataURL(file);
    });
    const record = { name, dataUrl };
    const records = [...readCustomFontRecords(), record];
    const face = new FontFace(name, `url(${dataUrl})`);
    await face.load();
    localStorage.setItem(FONT_KEY, JSON.stringify(records));
    document.fonts.add(face);
    loadedCustomFonts.set(name, face);
    customFontRecords = records;
    FONTS[name] = `"${name}"`;
    refreshFontOptions();
    $("nFont").value = name;
    $("tFont").value = name;
    state.nFont = name;
    state.tFont = name;
    changed();
    $("saved").textContent = `Custom font "${name}" add ho gaya.`;
  } catch (e) {
    $("saved").textContent = `Custom font save nahi hua: ${e.message}`;
  } finally {
    $("fontFile").value = "";
  }
});

$("removeCustomFont").onclick = () => {
  const name = [state.tFont, state.nFont].find(fontName => loadedCustomFonts.has(fontName));
  if (!name) {
    $("saved").textContent = "Pehle custom font select karein.";
    return;
  }
  try {
    const records = readCustomFontRecords().filter(font => font.name !== name);
    localStorage.setItem(FONT_KEY, JSON.stringify(records));
    const face = loadedCustomFonts.get(name);
    if (face) document.fonts.delete(face);
    loadedCustomFonts.delete(name);
    delete FONTS[name];
    customFontRecords = records;
    if (state.nFont === name) state.nFont = DEFAULT.nFont;
    if (state.tFont === name) state.tFont = DEFAULT.tFont;
    refreshFontOptions();
    syncControls();
    changed();
    $("saved").textContent = `Custom font "${name}" remove ho gaya.`;
  } catch (e) {
    $("saved").textContent = `Custom font remove nahi hua: ${e.message}`;
  }
};

const fill = (sel, items) => Object.keys(items).forEach(k => sel.add(new Option(k, k)));
fill($("tpl"), TEMPLATES); fill($("nFont"), FONTS); fill($("tFont"), FONTS);

function readTemplateFavorites() {
  const raw = localStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];
  const items = JSON.parse(raw);
  if (!Array.isArray(items)) throw new Error("Favorite template data durust nahi hai.");
  return items.filter(name => Object.prototype.hasOwnProperty.call(TEMPLATES, name));
}

function syncTemplateFavorites() {
  const select = $("favoriteTemplates");
  let favorites = [];
  try {
    favorites = readTemplateFavorites();
  } catch (e) {
    $("saved").textContent = `Favorite templates load nahi huay: ${e.message}`;
  }
  select.replaceChildren();
  if (!favorites.length) select.add(new Option("No favorites yet", ""));
  favorites.forEach(name => select.add(new Option(name, name)));
  const button = $("toggleTemplateFavorite");
  const isFavorite = favorites.includes(state.tpl);
  button.textContent = currentLanguage === "en"
    ? (isFavorite ? "Remove favorite" : "Add favorite")
    : (isFavorite ? "Favorite se hataayein" : "Favorite mein rakhein");
}

const LANGUAGE_EN = {
  ".brand-copy > p:last-child": "Write a story, choose a template, and download your card as an image.",
  ".panel-heading .eyebrow": "YOUR WORKSPACE",
  ".panel-heading h2": "Design your story",
  ".panel-hint": "Changes save automatically",
  ".stage-heading .eyebrow": "PREVIEW",
  ".stage-heading h2": "Live canvas",
  ".tabs [aria-controls='p-profile']": "Profile",
  ".tabs [aria-controls='p-text']": "Text",
  ".tabs [aria-controls='p-image']": "Image",
  ".tabs [aria-controls='p-size']": "Size",
  ".tabs [aria-controls='p-carousel']": "Carousel",
  "#toolProfile": "Profile",
  "#toolText": "Story text",
  "#toolQr": "QR code",
  "#toolFonts": "Custom fonts",
  "#toolLayers": "Layers & stickers",
  "#toolImages": "Images",
  "#toolBrand": "Brand kit",
  "#toolBackgrounds": "Backgrounds",
  "#toolExport": "Size & save",
  "#toolBackup": "Backup",
  "#toolCarousel": "Carousel",
  "label[for='templateSearch']": "Template search",
  "label[for='tpl']": "Template",
  "label[for='favoriteTemplates']": "Favorite templates",
  "label[for='photoIn']": "Profile photo",
  "label[for='name']": "Name / title",
  "label[for='sub']": "Subtitle",
  "label[for='nFont']": "Name font",
  "label[for='text']": "Story text",
  "label[for='preset']": "Story preset",
  "label[for='tFont']": "Story font",
  "label[for='fontPair']": "Font pairing",
  "label[for='align']": "Text alignment",
  "label[for='textColor']": "Text color",
  "label[for='foot']": "Footer line",
  "label[for='qrText']": "Website or social profile link",
  "label[for='fontFile']": "Upload a font (TTF, OTF, WOFF)",
  "label[for='bgIn']": "Background image",
  "label[for='logoIn']": "Watermark / logo",
  "label[for='watermarkText']": "Watermark text",
  "label[for='brandKitName']": "Brand kit name",
  "label[for='brandKits']": "Saved brand kits",
  "label[for='backgroundName']": "Background name",
  "label[for='savedBackgrounds']": "Saved backgrounds",
  "label[for='gradientStart']": "First gradient color",
  "label[for='gradientEnd']": "Second gradient color",
  "label[for='ratio']": "Card size",
  "label[for='exportW']": "Download width",
  "label[for='exportName']": "Download file name",
  "label[for='designName']": "Design name",
  "label[for='backupFile']": "Choose a backup file to restore",
  "label[for='designFolderFilter']": "Design folder",
  "label[for='newDesignFolder']": "New folder name",
  "label[for='shareLink']": "Shareable design link",
  "label[for='bulkText']": "Bulk text to create slides",
  "label[for='slidesWanted']": "Number of slides",
  "label[for='schedulePlatform']": "Platform",
  "label[for='scheduleGap']": "Days between posts",
  "label[for='scheduleStart']": "First post date and time",
  "label[for='siteLanguage']": "Language",
  "#applyPreset": "Use preset",
  "#applyFontPair": "Apply pairing",
  "#makeQr": "Add QR code",
  "#removeQr": "Remove QR code",
  "#removeCustomFont": "Remove selected uploaded font",
  "#saveBrandKit": "Save current brand kit",
  "#applyBrandKit": "Apply",
  "#deleteBrandKit": "Delete",
  "#saveBackground": "Save current background",
  "#applyBackground": "Apply",
  "#deleteBackground": "Delete",
  "#saveDesign": "Save design",
  "#loadDesign": "Load",
  "#renameDesign": "Rename selected",
  "#deleteDesign": "Delete selected",
  "#createDesignFolder": "Create folder",
  "#deleteDesignFolder": "Delete folder",
  "#createShareLink": "Create and copy link",
  "#exportBackup": "Download backup file",
  "#generateSlides": "Create slides from text",
  "#downloadPosts": "Download numbered post images ZIP",
  "#schedulePosts": "Schedule posts",
  "#exportSchedule": "Download calendar file",
  "#addSlide": "Add slide",
  "#duplicateSlide": "Duplicate slide",
  "#removeSlide": "Remove slide",
  "#downloadCarousel": "Download carousel ZIP",
  "#downloadPdf": "Download carousel PDF",
  "#dl": "Download PNG",
  "#dlJpg": "Download JPG",
  "#copy": "Copy image",
  "#exportAllSizes": "Export all sizes ZIP",
  "#undo": "Undo",
  "#redo": "Redo",
  "#reset": "New card (clear all)"
};
const LANGUAGE_ORIGINAL = new Map(Object.keys(LANGUAGE_EN).map(selector => {
  const element = document.querySelector(selector);
  return [selector, element ? element.textContent : ""];
}));

function applyLanguage() {
  document.documentElement.lang = currentLanguage;
  $("siteLanguage").value = currentLanguage;
  Object.keys(LANGUAGE_EN).forEach(selector => {
    const element = document.querySelector(selector);
    if (element) element.textContent = currentLanguage === "en" ? LANGUAGE_EN[selector] : LANGUAGE_ORIGINAL.get(selector);
  });
  syncTemplateFavorites();
}

$("siteLanguage").addEventListener("change", () => {
  currentLanguage = $("siteLanguage").value === "en" ? "en" : "ur";
  try {
    localStorage.setItem(LANGUAGE_KEY, currentLanguage);
    applyLanguage();
    $("saved").textContent = currentLanguage === "en" ? "Language preference saved." : "Zabaan ki setting save ho gayi.";
  } catch (e) {
    $("saved").textContent = `Language setting save nahi hui: ${e.message}`;
  }
});

function filterTemplates() {
  const query = $("templateSearch").value.trim().toLowerCase();
  [...$("tpl").options].forEach(option => {
    option.hidden = Boolean(query && !option.value.toLowerCase().includes(query) && option.value !== state.tpl);
  });
}

$("templateSearch").addEventListener("input", filterTemplates);
$("favoriteTemplates").addEventListener("change", () => {
  const favorite = $("favoriteTemplates").value;
  if (!favorite) return;
  $("tpl").value = favorite;
  $("tpl").dispatchEvent(new Event("change", { bubbles: true }));
});

$("toggleTemplateFavorite").onclick = () => {
  try {
    const favorites = readTemplateFavorites();
    const index = favorites.indexOf(state.tpl);
    if (index >= 0) favorites.splice(index, 1);
    else favorites.push(state.tpl);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    syncTemplateFavorites();
    $("saved").textContent = index >= 0 ? "Template favorites se hata diya." : "Template favorite mein save ho gaya.";
  } catch (e) {
    $("saved").textContent = `Favorite update nahi hua: ${e.message}`;
  }
};

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
  renderQr();
  card.classList.toggle("has-qr", !$("cardQr").hidden);
  applyLayerStack();
  renderLayerManager();

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

const LAYER_LABELS = {
  profile: "Profile block",
  story: "Story text",
  footer: "Footer",
  watermark: "Watermark",
  qr: "QR code",
  stickers: "Stickers"
};
const DEFAULT_LAYER_ORDER = ["profile", "story", "footer", "watermark", "qr", "stickers"];

function normalizedLayerOrder() {
  const saved = Array.isArray(state.layerOrder) ? state.layerOrder : [];
  state.layerOrder = [...new Set([...saved.filter(key => DEFAULT_LAYER_ORDER.includes(key)), ...DEFAULT_LAYER_ORDER])];
  return state.layerOrder;
}

function applyLayerStack() {
  const hidden = state.hiddenLayers && typeof state.hiddenLayers === "object" ? state.hiddenLayers : {};
  const elements = {
    profile: $("card").querySelector(".head"),
    story: $("card").querySelector(".mid"),
    footer: $("cFoot"),
    watermark: $("cardWatermark"),
    qr: $("cardQr")
  };
  normalizedLayerOrder().forEach((key, index) => {
    const element = elements[key];
    if (element) {
      element.style.zIndex = String(index + 1);
      element.style.visibility = hidden[key] ? "hidden" : "visible";
      element.style.pointerEvents = hidden[key] ? "none" : "";
    }
    if (key === "stickers") {
      $("card").querySelectorAll(".card-sticker").forEach(sticker => {
        sticker.style.zIndex = String(index + 1);
        sticker.style.visibility = hidden.stickers ? "hidden" : "visible";
        sticker.style.pointerEvents = hidden.stickers ? "none" : "";
      });
    }
  });
}

function renderLayerManager() {
  const list = $("layerList");
  if (!list) return;
  const order = normalizedLayerOrder();
  const hidden = state.hiddenLayers && typeof state.hiddenLayers === "object" ? state.hiddenLayers : {};
  list.replaceChildren();
  order.forEach((key, index) => {
    const row = document.createElement("div");
    row.className = "layer-row";
    const label = document.createElement("label");
    label.className = "checkbox";
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = !hidden[key];
    toggle.dataset.layerVisible = key;
    label.append(toggle, document.createTextNode(LAYER_LABELS[key]));
    const controls = document.createElement("span");
    controls.className = "layer-actions";
    const up = document.createElement("button");
    up.type = "button";
    up.className = "ghost";
    up.textContent = "Up";
    up.disabled = index === order.length - 1;
    up.dataset.layerMove = "up";
    up.dataset.layerKey = key;
    up.setAttribute("aria-label", `Move ${LAYER_LABELS[key]} forward`);
    const down = document.createElement("button");
    down.type = "button";
    down.className = "ghost";
    down.textContent = "Down";
    down.disabled = index === 0;
    down.dataset.layerMove = "down";
    down.dataset.layerKey = key;
    down.setAttribute("aria-label", `Move ${LAYER_LABELS[key]} backward`);
    controls.append(up, down);
    row.append(label, controls);
    list.append(row);
  });
}

function renderQr() {
  const container = $("cardQr");
  container.replaceChildren();
  if (!state.qrText || !window.QRCode) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  new QRCode(container, {
    text: state.qrText,
    width: 88,
    height: 88,
    colorDark: "#111827",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
}

$("layerList").addEventListener("change", e => {
  const key = e.target.dataset.layerVisible;
  if (!key) return;
  state.hiddenLayers = { ...(state.hiddenLayers || {}), [key]: !e.target.checked };
  changed();
});

$("layerList").addEventListener("click", e => {
  const button = e.target.closest("[data-layer-move]");
  if (!button) return;
  const order = normalizedLayerOrder();
  const index = order.indexOf(button.dataset.layerKey);
  const next = index + (button.dataset.layerMove === "up" ? 1 : -1);
  if (index < 0 || next < 0 || next >= order.length) return;
  [order[index], order[next]] = [order[next], order[index]];
  state.layerOrder = order;
  changed();
});

$("makeQr").onclick = () => {
  try {
    const value = $("qrText").value.trim();
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("http ya https website link istemal karein.");
    if (!window.QRCode) throw new Error("QR code library load nahi hui. Internet connection check karein.");
    state.qrText = url.href;
    syncControls();
    changed();
    $("saved").textContent = "QR code card par add ho gaya.";
  } catch (e) {
    $("saved").textContent = `QR code nahi bana: ${e.message}`;
  }
};

$("removeQr").onclick = () => {
  state.qrText = "";
  syncControls();
  changed();
  $("saved").textContent = "QR code remove ho gaya.";
};

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
  $("qrText").value = typeof state.qrText === "string" ? state.qrText : "";
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
  state.qrText = typeof state.qrText === "string" && state.qrText.length <= 500 ? state.qrText : "";
  if (state.qrText) {
    try {
      const url = new URL(state.qrText);
      if (!["http:", "https:"].includes(url.protocol)) state.qrText = "";
      else state.qrText = url.href;
    } catch (e) {
      state.qrText = "";
    }
  }
  state.layerOrder = Array.isArray(state.layerOrder)
    ? [...new Set(state.layerOrder.filter(key => DEFAULT_LAYER_ORDER.includes(key)))]
    : [];
  state.hiddenLayers = state.hiddenLayers && typeof state.hiddenLayers === "object" && !Array.isArray(state.hiddenLayers)
    ? Object.fromEntries(DEFAULT_LAYER_ORDER.map(key => [key, typeof state.hiddenLayers[key] === "boolean" && state.hiddenLayers[key]]))
    : {};
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
  syncTemplateFavorites();
  filterTemplates();
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

const BRAND_FIELDS = ["tpl", "hl", "textColor", "nFont", "tFont", "watermark", "watermarkText"];

function readBrandKits() {
  const raw = localStorage.getItem(BRAND_KEY);
  if (!raw) return [];
  const kits = JSON.parse(raw);
  if (!Array.isArray(kits)) throw new Error("Brand kit data durust nahi hai.");
  return kits.filter(kit => kit && typeof kit.name === "string" && kit.settings && typeof kit.settings === "object");
}

function syncBrandKits() {
  const select = $("brandKits");
  const previous = select.value;
  const kits = readBrandKits();
  select.replaceChildren();
  if (!kits.length) select.add(new Option("No saved brand kits", ""));
  kits.forEach(kit => select.add(new Option(kit.name, kit.name)));
  if (kits.some(kit => kit.name === previous)) select.value = previous;
  $("applyBrandKit").disabled = !kits.length;
  $("deleteBrandKit").disabled = !kits.length;
}

$("saveBrandKit").onclick = () => {
  try {
    const kits = readBrandKits();
    const name = $("brandKitName").value.trim().slice(0, 30);
    if (!name) throw new Error("Brand kit ka naam likhein.");
    const settings = Object.fromEntries(BRAND_FIELDS.map(key => [key, state[key]]));
    const logoData = state.logo && IMG[state.logo] ? IMG[state.logo] : "";
    const existing = kits.find(kit => kit.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.name = name;
      existing.settings = settings;
      existing.logoData = logoData;
    } else {
      kits.push({ name, settings, logoData });
    }
    localStorage.setItem(BRAND_KEY, JSON.stringify(kits));
    syncBrandKits();
    $("brandKits").value = name;
    $("saved").textContent = `Brand kit "${name}" save ho gaya.`;
  } catch (e) {
    $("saved").textContent = `Brand kit save nahi hua: ${e.message}`;
  }
};

$("applyBrandKit").onclick = () => {
  try {
    const kit = readBrandKits().find(item => item.name === $("brandKits").value);
    if (!kit) throw new Error("Pehle brand kit chunein.");
    if (!TEMPLATES[kit.settings.tpl] || !FONTS[kit.settings.nFont] || !FONTS[kit.settings.tFont] ||
        (kit.settings.hl && !/^#[0-9a-f]{6}$/i.test(kit.settings.hl)) ||
        (kit.settings.textColor && !/^#[0-9a-f]{6}$/i.test(kit.settings.textColor))) {
      throw new Error("Brand kit ke colors ya fonts invalid hain.");
    }
    BRAND_FIELDS.forEach(key => {
      if (typeof kit.settings[key] === typeof DEFAULT[key]) state[key] = kit.settings[key];
    });
    if (kit.logoData) {
      if (!kit.logoData.startsWith("data:image/")) throw new Error("Brand kit ka logo invalid hai.");
      const id = `brand-${Date.now().toString(36)}`;
      IMG[id] = kit.logoData;
      state.logo = id;
    } else {
      state.logo = "";
    }
    $("brandKitName").value = kit.name;
    syncControls();
    changed();
    $("saved").textContent = `Brand kit "${kit.name}" apply ho gaya.`;
  } catch (e) {
    $("saved").textContent = `Brand kit apply nahi hua: ${e.message}`;
  }
};

$("deleteBrandKit").onclick = () => {
  try {
    const name = $("brandKits").value;
    const kits = readBrandKits();
    if (!name || !kits.some(kit => kit.name === name)) throw new Error("Pehle brand kit chunein.");
    localStorage.setItem(BRAND_KEY, JSON.stringify(kits.filter(kit => kit.name !== name)));
    syncBrandKits();
    $("saved").textContent = `Brand kit "${name}" delete ho gaya.`;
  } catch (e) {
    $("saved").textContent = `Brand kit delete nahi hua: ${e.message}`;
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
function openTab(tab, focus = true) {
  tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute("aria-selected", on);
    t.tabIndex = on ? 0 : -1;
    $(t.getAttribute("aria-controls")).hidden = !on;
  });
  if (focus) tab.focus();
}

tabs.forEach((t, i) => {
  t.onclick = () => openTab(t);
  t.onkeydown = e => {
    if (e.key === "ArrowRight") openTab(tabs[(i + 1) % tabs.length]);
    if (e.key === "ArrowLeft") openTab(tabs[(i + tabs.length - 1) % tabs.length]);
  };
});

const toolButtons = [...document.querySelectorAll("[data-tool-tab]")];
toolButtons.forEach(button => {
  button.onclick = () => {
    const tab = $(button.dataset.toolTab);
    if (!tab) return;
    openTab(tab, false);
    toolButtons.forEach(item => {
      const active = item === button;
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
    const target = $(button.dataset.toolTarget) || $(tab.getAttribute("aria-controls"));
    if (target) target.scrollIntoView({ block: "start", behavior: "smooth" });
  };
});

const GENERAL_FOLDER = "General";

function readDesignStore() {
  try {
    const raw = localStorage.getItem(DESIGN_KEY);
    const parsed = raw ? JSON.parse(raw) : { designs: [] };
    const folders = Array.isArray(parsed.folders) ? parsed.folders
      .filter(folder => typeof folder === "string" && folder.trim())
      .map(folder => folder.trim().slice(0, 24)) : [];
    const designs = Array.isArray(parsed.designs) ? parsed.designs.map(item => ({
      ...item,
      folder: typeof item.folder === "string" && item.folder.trim()
        ? item.folder.trim().slice(0, 24)
        : GENERAL_FOLDER
    })) : [];
    const allFolders = [...new Set([GENERAL_FOLDER, ...folders, ...designs.map(item => item.folder)])];
    return { designs, folders: allFolders };
  } catch (e) {
    return { designs: [], folders: [GENERAL_FOLDER] };
  }
}

function readSavedDesigns() {
  return readDesignStore().designs;
}

function writeSavedDesigns(list, folders = readDesignStore().folders) {
  const allFolders = [...new Set([GENERAL_FOLDER, ...folders, ...list.map(item => item.folder || GENERAL_FOLDER)])];
  localStorage.setItem(DESIGN_KEY, JSON.stringify({ designs: list, folders: allFolders }));
}

function syncDesignFolders() {
  const { folders } = readDesignStore();
  const filter = $("designFolderFilter");
  const currentFilter = filter.value || "all";
  filter.replaceChildren(new Option("All folders", "all"));
  folders.forEach(folder => filter.add(new Option(folder, folder)));
  filter.value = folders.includes(currentFilter) ? currentFilter : "all";

  const destination = $("moveDesignFolder");
  const currentDestination = destination.value;
  destination.replaceChildren(...folders.map(folder => new Option(folder, folder)));
  destination.value = folders.includes(currentDestination) ? currentDestination : GENERAL_FOLDER;
  $("deleteDesignFolder").disabled = filter.value === "all" || filter.value === GENERAL_FOLDER;
}

function syncSavedDesigns() {
  const select = $("savedDesigns");
  const allItems = readSavedDesigns();
  const folder = $("designFolderFilter").value || "all";
  const items = folder === "all" ? allItems : allItems.filter(item => item.folder === folder);
  const current = select.value;
  select.innerHTML = "";
  if (!items.length) {
    const opt = new Option(folder === "all" ? "No saved designs" : "No designs in this folder", "");
    select.add(opt);
    $("renameName").value = "";
    $("loadDesign").disabled = true;
    $("renameDesign").disabled = true;
    $("deleteDesign").disabled = true;
    $("moveDesign").disabled = true;
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
  const selected = items.find(item => item.name === select.value);
  $("moveDesignFolder").value = selected.folder;
  $("moveDesign").disabled = !hasSelection || selected.folder === $("moveDesignFolder").value;
}

$("savedDesigns").addEventListener("change", () => {
  $("renameName").value = $("savedDesigns").value;
  const item = readSavedDesigns().find(design => design.name === $("savedDesigns").value);
  if (item) {
    $("moveDesignFolder").value = item.folder;
    $("moveDesign").disabled = true;
  }
});

$("designFolderFilter").addEventListener("change", () => {
  $("deleteDesignFolder").disabled = $("designFolderFilter").value === "all" ||
    $("designFolderFilter").value === GENERAL_FOLDER;
  syncSavedDesigns();
});
$("moveDesignFolder").addEventListener("change", () => {
  const item = readSavedDesigns().find(design => design.name === $("savedDesigns").value);
  $("moveDesign").disabled = !item || item.folder === $("moveDesignFolder").value;
});

$("createDesignFolder").onclick = () => {
  const name = $("newDesignFolder").value.trim().slice(0, 24);
  if (!name) {
    $("saved").textContent = "Pehle folder ka naam likhein.";
    return;
  }
  try {
    const store = readDesignStore();
    if (store.folders.some(folder => folder.toLowerCase() === name.toLowerCase())) {
      throw new Error("Is naam ka folder pehle se hai.");
    }
    store.folders.push(name);
    writeSavedDesigns(store.designs, store.folders);
    syncDesignFolders();
    $("designFolderFilter").value = name;
    $("deleteDesignFolder").disabled = false;
    $("newDesignFolder").value = "";
    syncSavedDesigns();
    $("saved").textContent = `Folder "${name}" bana diya.`;
  } catch (e) {
    $("saved").textContent = `Folder nahi bana: ${e.message}`;
  }
};

$("deleteDesignFolder").onclick = () => {
  const folder = $("designFolderFilter").value;
  if (!folder || folder === "all" || folder === GENERAL_FOLDER) return;
  if (!confirm(`"${folder}" folder delete karein? Iske designs General mein move honge.`)) return;
  try {
    const store = readDesignStore();
    const designs = store.designs.map(item => item.folder === folder ? { ...item, folder: GENERAL_FOLDER } : item);
    const folders = store.folders.filter(item => item !== folder);
    writeSavedDesigns(designs, folders);
    syncDesignFolders();
    $("designFolderFilter").value = GENERAL_FOLDER;
    syncSavedDesigns();
    $("saved").textContent = `Folder "${folder}" delete hua; uske designs General mein hain.`;
  } catch (e) {
    $("saved").textContent = `Folder delete nahi hua: ${e.message}`;
  }
};

$("moveDesign").onclick = () => {
  try {
    const store = readDesignStore();
    const item = store.designs.find(design => design.name === $("savedDesigns").value);
    if (!item) throw new Error("Pehle saved design chunein.");
    const folder = $("moveDesignFolder").value;
    if (!store.folders.includes(folder)) throw new Error("Destination folder nahi mila.");
    item.folder = folder;
    writeSavedDesigns(store.designs, store.folders);
    syncDesignFolders();
    syncSavedDesigns();
    $("saved").textContent = `Design "${item.name}" "${folder}" folder mein move ho gaya.`;
  } catch (e) {
    $("saved").textContent = `Design move nahi hua: ${e.message}`;
  }
};

$("saveDesign").onclick = () => {
  try {
    const store = readDesignStore();
    const list = store.designs;
    const name = (state.designName || "My story").trim() || "My story";
    const payload = {
      name,
      folder: store.designs.find(item => item.name.toLowerCase() === name.toLowerCase())?.folder ||
        ($("designFolderFilter").value === "all" ? GENERAL_FOLDER : $("designFolderFilter").value),
      state: { ...state },
      images: Object.fromEntries([state.photo, state.bg, state.logo].filter(Boolean).map(id => [id, IMG[id]]))
    };
    const idx = list.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) list[idx] = payload;
    else list.push(payload);
    writeSavedDesigns(list, store.folders);
    syncDesignFolders();
    syncSavedDesigns();
    $("savedDesigns").value = name;
    $("renameName").value = name;
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
  const canvas = await html2canvas($("card"), {
    scale: state.exportW / $("card").offsetWidth,
    backgroundColor: null,
    useCORS: true
  });
  if (canvas.width === Number(state.exportW)) return canvas;

  const normalized = document.createElement("canvas");
  normalized.width = Number(state.exportW);
  normalized.height = Math.round(canvas.height * normalized.width / canvas.width);
  const context = normalized.getContext("2d");
  if (!context) throw new Error("Export image resize nahi ho saki.");
  context.imageSmoothingQuality = "high";
  context.drawImage(canvas, 0, 0, normalized.width, normalized.height);
  canvas.width = 0;
  canvas.height = 0;
  return normalized;
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

const BACKUP_KEYS = [KEY, DESIGN_KEY, SCHEDULE_KEY, BACKGROUND_KEY, FONT_KEY, BRAND_KEY, FAVORITES_KEY, LANGUAGE_KEY];

$("exportBackup").onclick = () => {
  try {
    const storage = Object.fromEntries(BACKUP_KEYS.map(key => [key, localStorage.getItem(key)]));
    const backup = { app: "story-card-maker", version: 1, createdAt: new Date().toISOString(), storage };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "story-maker-backup.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    $("saved").textContent = "Backup file download ho gayi.";
  } catch (e) {
    $("saved").textContent = `Backup nahi ban saki: ${e.message}`;
  }
};

$("backupFile").addEventListener("change", async () => {
  const file = $("backupFile").files[0];
  if (!file) return;
  try {
    if (file.size > 10 * 1024 * 1024) throw new Error("Backup file 10 MB se chhoti honi chahiye.");
    const text = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Backup file read nahi ho saki."));
      reader.readAsText(file);
    });
    const backup = JSON.parse(text);
    if (!backup || backup.app !== "story-card-maker" || backup.version !== 1 || !backup.storage || typeof backup.storage !== "object" || Array.isArray(backup.storage)) {
      throw new Error("Yeh Story Maker backup file nahi hai ya version support nahi hota.");
    }
    const keys = Object.keys(backup.storage);
    if (keys.length !== BACKUP_KEYS.length || keys.some(key => !BACKUP_KEYS.includes(key)) ||
        BACKUP_KEYS.some(key => typeof backup.storage[key] !== "string" && backup.storage[key] !== null)) {
      throw new Error("Backup mein required data keys missing ya invalid hain.");
    }
    if (!confirm("Restore se is browser ke current designs aur settings replace ho jayenge. Kya aap jari rakhna chahte hain?")) return;

    const previous = Object.fromEntries(BACKUP_KEYS.map(key => [key, localStorage.getItem(key)]));
    try {
      BACKUP_KEYS.forEach(key => {
        if (backup.storage[key] === null) localStorage.removeItem(key);
        else localStorage.setItem(key, backup.storage[key]);
      });
    } catch (restoreError) {
      const rollbackErrors = [];
      BACKUP_KEYS.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError.message);
        }
      });
      BACKUP_KEYS.forEach(key => {
        if (previous[key] === null) return;
        try {
          localStorage.setItem(key, previous[key]);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError.message);
        }
      });
      if (rollbackErrors.length) {
        throw new Error(`Restore fail hua (${restoreError.message}) aur rollback bhi mukammal nahi hua: ${rollbackErrors.join("; ")}`);
      }
      throw new Error(`Restore fail hua; purana data wapas rakh diya gaya: ${restoreError.message}`);
    }
    $("saved").textContent = "Backup restore ho gayi. App ko update karne ke liye reload ho raha hai.";
    setTimeout(() => location.reload(), 1200);
  } catch (e) {
    $("saved").textContent = `Backup restore nahi hui: ${e.message}`;
  } finally {
    $("backupFile").value = "";
  }
});

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

async function exportCarouselPdf() {
  const PdfDocument = window.jspdf && window.jspdf.jsPDF;
  if (!PdfDocument) throw new Error("PDF library load nahi hui. Internet connection check karein.");
  if (!window.html2canvas) throw new Error("HTML to canvas load nahi hua. Internet connection check karein.");
  saveActiveSlide();
  const active = state.activeSlide;
  let pdf;
  try {
    for (let i = 0; i < state.slides.length; i++) {
      state.activeSlide = i;
      Object.assign(state, state.slides[i]);
      syncControls();
      render();
      const canvas = await makeCanvas();
      const width = canvas.width * 0.75;
      const height = canvas.height * 0.75;
      const orientation = width >= height ? "landscape" : "portrait";
      if (!pdf) {
        pdf = new PdfDocument({ unit: "pt", format: [width, height], orientation, compress: true });
      } else {
        pdf.addPage([width, height], orientation);
      }
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, width, height);
      canvas.width = 0;
      canvas.height = 0;
    }
    pdf.save(`${safeExportName()}-carousel.pdf`);
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
$("downloadPdf").onclick = () => busy($("downloadPdf"), "PDF ban rahi hai...", exportCarouselPdf);
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
syncDesignFolders();
syncSavedDesigns();
try {
  syncBrandKits();
} catch (e) {
  $("saved").textContent = `Brand kits load nahi huay: ${e.message}`;
}
applyLanguage();
filterTemplates();
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
