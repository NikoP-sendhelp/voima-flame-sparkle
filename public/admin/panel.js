/** @typedef {{ key: string, label: string, type: "text" | "textarea" | "date" | "time" | "select", required?: boolean, options?: {value: string, label: string}[], hint?: string, auto?: "slugFromName" | "sessionTitleFromService" | "defaultLocation" }} AdminFieldSchema */
/** @typedef {{ section: "sessions" | "services" | "sitecopy" | "news", title: string, fields: AdminFieldSchema[] }} AdminSectionSchema */
/** @typedef {{ field: string, message: string }} FieldValidationResult */

const state = {
  csrfToken: "",
  content: null,
  activeTab: "sessions",
  selectedSessionId: "",
  selectedServiceSlug: "",
  selectedSiteCopyKey: "",
  selectedNewsId: "",
  busy: false,
  sessionFilters: {
    serviceSlug: "all",
    status: "all",
    month: "all",
    search: "",
    sort: "upcoming",
  },
};

const knownSiteKeys = [
  { value: "default_location", label: "Oletussijainti" },
  { value: "default_booking_email", label: "Varaussähköposti" },
  { value: "default_booking_phone", label: "Varauspuhelin" },
];

const contextMap = [
  { key: "default_location", page: "Yhteys-sivu", description: "Osoite, joka näkyy kaikilla sivuilla ja palvelukorteissa" },
  { key: "default_booking_email", page: "Yhteys-sivu", description: "Sähköposti, jota käytetään varaustiedusteluihin" },
  { key: "default_booking_phone", page: "Yhteys-sivu", description: "Puhelinnumero, joka näkyy yhteystiedoissa" },
];

const schemas = /** @type {AdminSectionSchema[]} */ ([
  {
    section: "sessions",
    title: "Sessiot",
    fields: [
      { key: "id", label: "ID", type: "text", required: true, hint: "Esim. sointukylpy-2026-09-10" },
      { key: "serviceSlug", label: "Palvelu", type: "select", required: true },
      { key: "title", label: "Otsikko", type: "text", required: true, auto: "sessionTitleFromService" },
      { key: "date", label: "Päivämäärä", type: "date", required: true },
      { key: "startTime", label: "Alkaa", type: "time", required: true },
      { key: "endTime", label: "Päättyy", type: "time" },
      {
        key: "status",
        label: "Tila",
        type: "select",
        required: true,
        options: [
          { value: "scheduled", label: "Aikataulutettu" },
          { value: "cancelled", label: "Peruttu" },
          { value: "sold-out", label: "Loppuunmyyty" },
        ],
      },
      { key: "location", label: "Sijainti", type: "text", required: true, auto: "defaultLocation" },
      { key: "summary", label: "Kuvaus", type: "textarea", required: true },
      { key: "bookingUrl", label: "Varauslinkki", type: "text", hint: "Valinnainen" },
    ],
  },
  {
    section: "services",
    title: "Palvelut",
    fields: [
      { key: "slug", label: "Slug", type: "text", required: true, auto: "slugFromName" },
      { key: "number", label: "Numero", type: "text", required: true },
      { key: "name", label: "Nimi", type: "text", required: true },
      { key: "tagline", label: "Tagline", type: "text", required: true },
      { key: "duration", label: "Kesto", type: "text", required: true },
      { key: "price", label: "Hinta", type: "text", required: true },
      { key: "location", label: "Sijainti", type: "text" },
      { key: "image", label: "Kuvapolku", type: "text", required: true },
      { key: "short", label: "Lyhyt kuvaus", type: "textarea", required: true, hint: "Näkyy nostoissa" },
      { key: "body", label: "Pitkä kuvaus (kappaleet)", type: "textarea", required: true, hint: "Yksi kappale per rivi" },
    ],
  },
  {
    section: "sitecopy",
    title: "Sivutekstit",
    fields: [
      { key: "key", label: "Avain", type: "select", options: knownSiteKeys, required: true },
      { key: "value", label: "Arvo", type: "text", required: true },
    ],
  },
  {
    section: "news",
    title: "Uutiset (pohja)",
    fields: [
      { key: "id", label: "ID", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true, auto: "slugFromName" },
      { key: "title", label: "Otsikko", type: "text", required: true },
      { key: "excerpt", label: "Tiivistelmä", type: "textarea", required: true },
      { key: "body", label: "Sisältö", type: "textarea", required: true },
      { key: "status", label: "Tila", type: "select", options: [{ value: "draft", label: "Luonnos" }, { value: "published", label: "Julkaistu" }], required: true },
      { key: "publishedAt", label: "Julkaisuaika (ISO)", type: "text", hint: "Valinnainen" },
    ],
  },
]);

const el = {
  tabs: document.getElementById("admin-tabs"),
  sectionHost: document.getElementById("admin-sections"),
  logout: document.getElementById("logout-btn"),
  status: document.getElementById("admin-status"),
};

const utils = window.AdminUtils;

function setStatus(message, kind = "ok") {
  el.status.textContent = message;
  el.status.className = `status ${kind === "error" ? "error" : "ok"}`;
}

/* Toast notifications */
function showToast(message, kind = "ok") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${kind}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("out");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* Loading overlay */
function showLoading() {
  let overlay = document.querySelector(".loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "loading-overlay";
    overlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(overlay);
  }
}
function hideLoading() {
  const overlay = document.querySelector(".loading-overlay");
  if (overlay) overlay.remove();
}

/* Autosave */
function autosaveKey(section, itemId) {
  return `vl_admin_autosave_${section}_${itemId || "new"}`;
}
function saveAutosave(section, item) {
  const key = autosaveKey(section, getItemId(section, item));
  try {
    localStorage.setItem(key, JSON.stringify({ data: item, timestamp: Date.now() }));
  } catch {}
}
function loadAutosave(section, itemId) {
  const key = autosaveKey(section, itemId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
function clearAllAutosave(section) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`vl_admin_autosave_${section}_`)) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
}

/* Undo */
const undoStack = {
  sessions: [],
  services: [],
  sitecopy: [],
  news: [],
};
function pushUndo(section) {
  const data = getSectionData(section);
  const stack = undoStack[section];
  if (!stack) return;
  const clone = JSON.parse(JSON.stringify(data));
  stack.push(clone);
  if (stack.length > 10) stack.shift();
}
function undo() {
  const section = state.activeTab;
  const stack = undoStack[section];
  if (!stack || !stack.length) {
    showToast("Ei mitään kumottavaa.", "ok");
    return;
  }
  const prev = stack.pop();
  if (section === "sessions") state.content.sessions.data = prev;
  else if (section === "services") state.content.services.data = prev;
  else if (section === "sitecopy") state.content.siteCopy.data = prev;
  else if (section === "news") state.content.news.data = prev;
  render();
  showToast("Kumottu.", "ok");
}

function mapApiError(errorCode, fallback) {
  const map = {
    unauthorized: "Kirjautuminen vanheni. Kirjaudu uudelleen.",
    invalid_csrf_token: "Turvatarkistus epäonnistui. Päivitä sivu ja yritä uudelleen.",
    not_found: "Toimintoa ei löytynyt.",
    missing_worker_secrets: "Ylläpidon asetukset puuttuvat Workeristä.",
    invalid_password_record: "ADMIN_PASSWORD_RECORD on virheellinen.",
  };
  return map[errorCode] || fallback || "Toiminto epäonnistui.";
}

async function request(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (state.csrfToken) headers["x-csrf-token"] = state.csrfToken;
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(mapApiError(payload.error, "Pyyntö epäonnistui."));
  return payload;
}

function createButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (className) button.className = className;
  button.addEventListener("click", onClick);
  return button;
}

function getSectionData(section) {
  if (section === "sessions") return state.content.sessions.data;
  if (section === "services") return state.content.services.data;
  if (section === "sitecopy") return state.content.siteCopy.data;
  return state.content.news.data;
}

function getSelection(section) {
  if (section === "sessions") return state.selectedSessionId;
  if (section === "services") return state.selectedServiceSlug;
  if (section === "sitecopy") return state.selectedSiteCopyKey;
  return state.selectedNewsId;
}

function setSelection(section, value) {
  if (section === "sessions") state.selectedSessionId = value;
  else if (section === "services") state.selectedServiceSlug = value;
  else if (section === "sitecopy") state.selectedSiteCopyKey = value;
  else state.selectedNewsId = value;
}

function getItemId(section, item) {
  if (section === "sessions") return item.id;
  if (section === "services") return item.slug;
  if (section === "sitecopy") return item.key;
  return item.id;
}

function listMeta(section, item) {
  if (section === "sessions") return `${item.date} ${item.startTime || ""} · ${item.location || ""}`.trim();
  if (section === "services") return `${item.price || ""} · ${item.duration || ""}`.trim();
  if (section === "sitecopy") return item.value || "";
  return item.status === "published" ? "Julkaistu" : "Luonnos";
}

function ensureSelection(section) {
  const data = getSectionData(section);
  if (!data.length) return null;
  const selected = getSelection(section);
  const found = data.find((item) => getItemId(section, item) === selected);
  if (found) return found;
  const first = data[0];
  setSelection(section, getItemId(section, first));
  return first;
}

function makeDefaultItem(section) {
  const serviceOptions = state.content.services.data.map((service) => ({ value: service.slug, label: service.name }));
  const firstService = serviceOptions[0]?.value || "";
  const defaultLocation = state.content.siteCopy.data.find((item) => item.key === "default_location")?.value || "";
  if (section === "sessions") {
    return {
      id: "",
      serviceSlug: firstService,
      title: serviceOptions[0]?.label || "",
      date: "",
      startTime: "",
      endTime: "",
      status: "scheduled",
      location: defaultLocation,
      summary: "",
      bookingUrl: "",
    };
  }
  if (section === "services") {
    return {
      slug: "",
      number: String(state.content.services.data.length + 1).padStart(2, "0"),
      name: "",
      tagline: "",
      short: "",
      body: [""],
      duration: "60 min",
      price: "0 €",
      image: "/service-aanimalja.jpg",
      location: defaultLocation,
    };
  }
  if (section === "sitecopy") {
    return {
      key: knownSiteKeys[0].value,
      value: "",
    };
  }
  return {
    id: "",
    slug: "",
    title: "",
    excerpt: "",
    body: "",
    status: "draft",
    publishedAt: "",
  };
}

function validateItem(section, item) {
  const errors = /** @type {FieldValidationResult[]} */ ([]);
  const schema = schemas.find((entry) => entry.section === section);
  if (!schema) return errors;
  for (const field of schema.fields) {
    const value = item[field.key];
    if (field.required && (!value || String(value).trim() === "")) {
      errors.push({ field: field.key, message: "Tämä kenttä on pakollinen." });
    }
  }
  if (section === "sessions") {
    if (item.date && !utils.isIsoDate(item.date)) {
      errors.push({ field: "date", message: "Muoto: YYYY-MM-DD" });
    }
    if (item.startTime && !utils.isIsoTime(item.startTime)) {
      errors.push({ field: "startTime", message: "Muoto: HH:MM" });
    }
    if (item.endTime && !utils.isIsoTime(item.endTime)) {
      errors.push({ field: "endTime", message: "Muoto: HH:MM" });
    }
    if (item.endTime && item.startTime && item.endTime <= item.startTime) {
      errors.push({ field: "endTime", message: "Päättymisajan tulee olla alkamisajan jälkeen." });
    }
  }
  if (section === "services") {
    const slug = utils.normalizeSlug(item.slug || "");
    if (!slug) errors.push({ field: "slug", message: "Slug ei voi olla tyhjä." });
    const duplicate = state.content.services.data.some(
      (service) => service.slug === slug && service.slug !== getSelection("services"),
    );
    if (duplicate) errors.push({ field: "slug", message: "Slug on jo käytössä." });
  }
  return errors;
}

function serviceOptions() {
  return state.content.services.data.map((service) => ({
    value: service.slug,
    label: service.name,
  }));
}

function schemaWithDynamicOptions(schema) {
  return {
    ...schema,
    fields: schema.fields.map((field) => {
      if (schema.section === "sessions" && field.key === "serviceSlug") {
        return { ...field, options: serviceOptions() };
      }
      if (schema.section === "sitecopy" && field.key === "key") {
        return { ...field, options: [...knownSiteKeys, { value: "__custom__", label: "Muu avain..." }] };
      }
      return field;
    }),
  };
}

function updateStore(section, currentId, item) {
  const data = getSectionData(section);
  const index = data.findIndex((entry) => getItemId(section, entry) === currentId);
  if (index >= 0) {
    data[index] = item;
    setSelection(section, getItemId(section, item));
  } else {
    data.push(item);
    setSelection(section, getItemId(section, item));
  }
}

function deleteSelected(section) {
  const selectedId = getSelection(section);
  const data = getSectionData(section);
  const next = data.filter((item) => getItemId(section, item) !== selectedId);
  if (section === "sessions") state.content.sessions.data = next;
  else if (section === "services") state.content.services.data = next;
  else if (section === "sitecopy") state.content.siteCopy.data = next;
  else state.content.news.data = next;
  const first = next[0];
  setSelection(section, first ? getItemId(section, first) : "");
}

async function saveSection(section) {
  state.busy = true;
  showLoading();
  const endpoint = section === "sessions"
    ? "/api/admin/sessions"
    : section === "services"
      ? "/api/admin/services"
      : section === "sitecopy"
        ? "/api/admin/sitecopy"
        : "/api/admin/news";
  const payload = section === "sessions"
    ? { sessions: state.content.sessions.data }
    : section === "services"
      ? { services: state.content.services.data }
      : section === "sitecopy"
        ? { items: state.content.siteCopy.data }
        : { posts: state.content.news.data };
  try {
    const response = await request(endpoint, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (section === "sessions") state.content.sessions = response.sessions;
    if (section === "services") state.content.services = response.services;
    if (section === "sitecopy") state.content.siteCopy = response.siteCopy;
    if (section === "news") state.content.news = response.news;
    clearAllAutosave(section);
    showToast(`${schemas.find(s => s.section === section)?.title || section} tallennettu.`, "ok");
    render();
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Tallennus epäonnistui.", "error");
    throw error;
  } finally {
    state.busy = false;
    hideLoading();
  }
}

function renderField(field, item, errors, section) {
  const wrapper = document.createElement("div");
  const label = document.createElement("label");
  label.textContent = field.label;
  wrapper.append(label);

  let control;
  if (field.type === "textarea") {
    control = document.createElement("textarea");
  } else if (field.type === "select") {
    control = document.createElement("select");
    for (const option of field.options || []) {
      const entry = document.createElement("option");
      entry.value = option.value;
      entry.textContent = option.label;
      control.append(entry);
    }
  } else {
    control = document.createElement("input");
    control.type = field.type;
  }

  const raw = item[field.key];
  if (field.key === "body" && Array.isArray(raw)) {
    control.value = raw.join("\n");
  } else {
    control.value = raw ?? "";
  }
  control.dataset.field = field.key;
  wrapper.append(control);

  if (field.hint) {
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = field.hint;
    wrapper.append(hint);
  }

  const error = document.createElement("div");
  error.className = "field-error";
  const currentError = errors.find((entry) => entry.field === field.key);
  error.textContent = currentError?.message || "";
  wrapper.append(error);

  control.addEventListener("change", () => {
    let value = control.value;
    if (section === "sitecopy" && field.key === "key" && value === "__custom__") {
      const custom = window.prompt("Anna uusi avain", "");
      if (!custom) {
        control.value = item.key || knownSiteKeys[0].value;
        return;
      }
      value = custom.trim();
    }
    item[field.key] = field.key === "body" ? value.split("\n").filter((entry) => entry.trim()) : value;
    if (section === "services" && field.key === "name") {
      item.slug = utils.normalizeSlug(value);
    }
    if (section === "sessions" && field.key === "serviceSlug" && (!item.title || item.title.trim() === "")) {
      const selectedService = serviceOptions().find((entry) => entry.value === value);
      item.title = selectedService?.label || item.title;
    }
    if (section === "sessions" && field.key === "serviceSlug") {
      const selectedService = state.content.services.data.find((entry) => entry.slug === value);
      const defaultLocation = state.content.siteCopy.data.find((entry) => entry.key === "default_location")?.value || "";
      if (!item.title || item.title.trim() === "") item.title = selectedService?.name || item.title;
      if (!item.location || item.location.trim() === "") item.location = selectedService?.location || defaultLocation;
    }
    saveAutosave(section, item);
  });

  return wrapper;
}

function isSessionPast(session) {
  const startsAt = utils.parseSessionDateTime(session.date, session.startTime);
  if (!startsAt) return false;
  return startsAt.getTime() < Date.now();
}

function compareSessionOrder(a, b, sort) {
  const aDate = utils.parseSessionDateTime(a.date, a.startTime)?.getTime() || 0;
  const bDate = utils.parseSessionDateTime(b.date, b.startTime)?.getTime() || 0;
  return sort === "past" ? bDate - aDate : aDate - bDate;
}

function renderSessionFilters(toolbar) {
  const filters = document.createElement("div");
  filters.className = "session-filters";
  const byService = document.createElement("select");
  byService.innerHTML = `<option value="all">Kaikki palvelut</option>${serviceOptions()
    .map((opt) => `<option value="${opt.value}">${opt.label}</option>`)
    .join("")}`;
  byService.value = state.sessionFilters.serviceSlug;
  byService.addEventListener("change", () => {
    state.sessionFilters.serviceSlug = byService.value;
    renderSection("sessions");
  });

  const byStatus = document.createElement("select");
  byStatus.innerHTML = `
    <option value="all">Kaikki tilat</option>
    <option value="scheduled">Aikataulutettu</option>
    <option value="sold-out">Loppuunmyyty</option>
    <option value="cancelled">Peruttu</option>
  `;
  byStatus.value = state.sessionFilters.status;
  byStatus.addEventListener("change", () => {
    state.sessionFilters.status = byStatus.value;
    renderSection("sessions");
  });

  const byMonth = document.createElement("select");
  const months = [...new Set(state.content.sessions.data.map((item) => item.date?.slice(0, 7)).filter(Boolean))].sort();
  byMonth.innerHTML = `<option value="all">Kaikki kuukaudet</option>${months
    .map((month) => `<option value="${month}">${month}</option>`)
    .join("")}`;
  byMonth.value = state.sessionFilters.month;
  byMonth.addEventListener("change", () => {
    state.sessionFilters.month = byMonth.value;
    renderSection("sessions");
  });

  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Hae otsikolla tai sijainnilla";
  search.value = state.sessionFilters.search;
  search.addEventListener("input", () => {
    state.sessionFilters.search = search.value;
    renderSection("sessions");
  });

  const sort = document.createElement("select");
  sort.innerHTML = `
    <option value="upcoming">Järjestys: tulevat</option>
    <option value="past">Järjestys: menneet</option>
  `;
  sort.value = state.sessionFilters.sort;
  sort.addEventListener("change", () => {
    state.sessionFilters.sort = sort.value;
    renderSection("sessions");
  });

  filters.append(byService, byStatus, byMonth, sort, search);
  toolbar.append(filters);
}

function filteredSessionList(data) {
  const q = state.sessionFilters.search.trim().toLowerCase();
  return data
    .filter((item) => state.sessionFilters.serviceSlug === "all" || item.serviceSlug === state.sessionFilters.serviceSlug)
    .filter((item) => state.sessionFilters.status === "all" || (item.status || "scheduled") === state.sessionFilters.status)
    .filter((item) => state.sessionFilters.month === "all" || item.date?.slice(0, 7) === state.sessionFilters.month)
    .filter((item) => !q || item.title?.toLowerCase().includes(q) || item.location?.toLowerCase().includes(q))
    .sort((a, b) => compareSessionOrder(a, b, state.sessionFilters.sort));
}

function quickActionButtons(selectedItem, onDone) {
  const wrap = document.createElement("div");
  wrap.className = "quick-actions";
  const duplicate = createButton("Duplikoi", "", () => {
    pushUndo("sessions");
    const clone = { ...selectedItem, id: `${selectedItem.id}-copy` };
    state.content.sessions.data.unshift(clone);
    state.selectedSessionId = clone.id;
    onDone();
  });
  const moveWeek = createButton("+7 pv", "", () => {
    if (!utils.isIsoDate(selectedItem.date)) return;
    pushUndo("sessions");
    const moved = new Date(`${selectedItem.date}T00:00:00`);
    moved.setDate(moved.getDate() + 7);
    selectedItem.date = moved.toISOString().slice(0, 10);
    onDone();
  });
  const cancel = createButton("Merkitse perutuksi", "danger", () => {
    pushUndo("sessions");
    selectedItem.status = "cancelled";
    onDone();
  });
  const next = createButton("Luo seuraava sessio", "", () => {
    if (!utils.isIsoDate(selectedItem.date)) return;
    pushUndo("sessions");
    const d = new Date(`${selectedItem.date}T00:00:00`);
    d.setDate(d.getDate() + 7);
    const copy = {
      ...selectedItem,
      id: `${selectedItem.serviceSlug}-${d.toISOString().slice(0, 10)}`,
      date: d.toISOString().slice(0, 10),
      status: "scheduled",
    };
    state.content.sessions.data.unshift(copy);
    state.selectedSessionId = copy.id;
    onDone();
  });
  wrap.append(duplicate, moveWeek, cancel, next);
  return wrap;
}

function findSessionConflicts(session) {
  if (!session?.id || !session?.date || !session?.startTime) return [];
  const start = utils.parseSessionDateTime(session.date, session.startTime);
  if (!start) return [];
  const end = session.endTime
    ? utils.parseSessionDateTime(session.date, session.endTime)
    : new Date(start.getTime() + 60 * 60 * 1000);
  return state.content.sessions.data.filter((entry) => {
    if (entry.id === session.id) return false;
    if (entry.serviceSlug !== session.serviceSlug || entry.date !== session.date) return false;
    const entryStart = utils.parseSessionDateTime(entry.date, entry.startTime);
    if (!entryStart) return false;
    const entryEnd = entry.endTime
      ? utils.parseSessionDateTime(entry.date, entry.endTime)
      : new Date(entryStart.getTime() + 60 * 60 * 1000);
    return start < entryEnd && end > entryStart;
  });
}

function renderChecklist(section, selectedItem, errors) {
  if (section !== "sessions") return null;
  const checklist = document.createElement("div");
  checklist.className = "checklist";
  const required = ["id", "serviceSlug", "title", "date", "startTime", "location", "summary"];
  const missing = required.filter((key) => !String(selectedItem[key] || "").trim());
  const conflicts = findSessionConflicts(selectedItem);
  const localPreview = utils.formatLocalDateTime(selectedItem.date, selectedItem.startTime);
  checklist.innerHTML = `
    <p class="check-title">Tarkistuslista</p>
    <p class="check-row ${missing.length ? "warn" : "ok"}">${missing.length ? `Puuttuu kenttiä: ${missing.join(", ")}` : "Pakolliset kentät täytetty."}</p>
    <p class="check-row ${conflicts.length ? "warn" : "ok"}">${conflicts.length ? `Aikakonflikti: ${conflicts.length} päällekkäistä sessiota.` : "Ei aikakonflikteja samalle palvelulle."}</p>
    <p class="check-row ${errors.length ? "warn" : "ok"}">${errors.length ? "Korjaa lomakevirheet ennen tallennusta." : "Lomake on valmis tallennettavaksi."}</p>
    <p class="check-row">${localPreview ? `Paikallinen esikatselu: ${localPreview}` : "Valitse päivä ja aika nähdäksesi esikatselun."}</p>
  `;
  return checklist;
}

function renderPreview(section, selectedItem) {
  if (!selectedItem) return;
  let overlay = document.querySelector(".preview-modal-overlay");
  if (overlay) overlay.remove();
  overlay = document.createElement("div");
  overlay.className = "preview-modal-overlay";
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  const modal = document.createElement("div");
  modal.className = "preview-modal";

  const header = document.createElement("header");
  const title = document.createElement("h3");
  title.textContent = "Esikatselu";
  const close = document.createElement("button");
  close.className = "close";
  close.textContent = "✕";
  close.addEventListener("click", () => overlay.remove());
  header.append(title, close);
  modal.append(header);

  const body = document.createElement("div");
  body.className = "preview-content";

  if (section === "services") {
    const card = document.createElement("div");
    card.className = "preview-card";
    if (selectedItem.image) {
      const img = document.createElement("img");
      img.src = selectedItem.image;
      img.alt = selectedItem.name || "";
      img.className = "card-image";
      card.appendChild(img);
    }
    const cardBody = document.createElement("div");
    cardBody.className = "card-body";
    cardBody.innerHTML = `
      <p class="card-meta">${selectedItem.number || ""} · ${selectedItem.duration || ""} · ${selectedItem.price || ""}</p>
      <h4 class="card-title">${selectedItem.name || "(nimetön)"}</h4>
      <p class="card-short">${selectedItem.tagline || ""}</p>
    `;
    card.appendChild(cardBody);
    if (Array.isArray(selectedItem.body) && selectedItem.body.length) {
      const bodyList = document.createElement("div");
      bodyList.className = "card-body-list";
      selectedItem.body.forEach((p) => {
        const para = document.createElement("p");
        para.textContent = p;
        bodyList.appendChild(para);
      });
      card.appendChild(bodyList);
    }
    body.appendChild(card);
  } else if (section === "sitecopy") {
    body.innerHTML = `<p><strong>${selectedItem.key}:</strong> ${selectedItem.value}</p>`;
  } else if (section === "sessions") {
    body.innerHTML = `
      <p><strong>${selectedItem.title}</strong></p>
      <p>${selectedItem.date} ${selectedItem.startTime}${selectedItem.endTime ? "–" + selectedItem.endTime : ""}</p>
      <p>${selectedItem.location}</p>
      <p>${selectedItem.summary}</p>
    `;
  } else {
    body.innerHTML = `<p><strong>${selectedItem.title || "(nimetön)"}</strong></p>`;
  }

  modal.appendChild(body);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function renderContextMap() {
  const map = document.createElement("div");
  map.className = "context-map";
  const title = document.createElement("p");
  title.className = "context-map-title";
  title.textContent = "Missä tietoa käytetään sivustolla:";
  map.appendChild(title);
  contextMap.forEach((item) => {
    const row = document.createElement("div");
    row.className = "context-map-item";
    row.innerHTML = `<span class="key">${item.key}</span><span class="page">${item.page}</span>`;
    const desc = document.createElement("p");
    desc.style = "margin:2px 0 0;font-size:13px;color:var(--muted);";
    desc.textContent = item.description;
    row.appendChild(desc);
    map.appendChild(row);
  });
  return map;
}

function renderRecoveryBanner(section) {
  const savedKeys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`vl_admin_autosave_${section}_`)) {
        savedKeys.push(key);
      }
    }
  } catch {}
  if (!savedKeys.length) return null;
  const banner = document.createElement("div");
  banner.className = "recovery-banner";
  banner.innerHTML = `<p>🔄 Paikallisia tallentamattomia muutoksia löytyi.</p>`;
  const restoreBtn = createButton("Palauta muutokset", "primary", () => {
    for (const key of savedKeys) {
      try {
        const saved = JSON.parse(localStorage.getItem(key));
        if (!saved || !saved.data) continue;
        const data = getSectionData(section);
        const savedId = getItemId(section, saved.data);
        const index = data.findIndex((item) => getItemId(section, item) === savedId);
        if (index >= 0) {
          data[index] = saved.data;
        }
      } catch {}
    }
    showToast("Muutokset palautettu.", "ok");
    renderSection(section);
    banner.remove();
  });
  const discardBtn = createButton("Hylkää", "", () => {
    for (const key of savedKeys) {
      try { localStorage.removeItem(key); } catch {}
    }
    banner.remove();
  });
  banner.append(restoreBtn, discardBtn);
  return banner;
}

function renderEmptyState(section, onCreate) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  const title = document.createElement("p");
  const schema = schemas.find((s) => s.section === section);
  title.innerHTML = `<strong>Ei vielä ${schema?.title.toLowerCase() || "merkintöjä"}.</strong>`;
  empty.appendChild(title);
  const desc = document.createElement("p");
  desc.textContent = "Aloita luomalla ensimmäinen merkintä.";
  empty.appendChild(desc);
  const btn = createButton(`Luo ensimmäinen ${schema?.title.toLowerCase() || "merkintä"}`, "primary", onCreate);
  empty.appendChild(btn);
  return empty;
}

function renderSection(section) {
  const schema = schemaWithDynamicOptions(schemas.find((entry) => entry.section === section));
  const root = document.getElementById(`section-${section}`);
  root.textContent = "";

  const recovery = renderRecoveryBanner(section);
  if (recovery) root.appendChild(recovery);

  const layout = document.createElement("div");
  layout.className = "layout";
  const listCol = document.createElement("div");
  const formCol = document.createElement("div");
  layout.append(listCol, formCol);
  root.append(layout);

  const listCard = document.createElement("div");
  listCard.className = "card";
  listCol.append(listCard);

  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";
  listCard.append(toolbar);
  toolbar.append(
    createButton("Uusi", "primary", () => {
      pushUndo(section);
      const created = makeDefaultItem(section);
      const data = getSectionData(section);
      data.unshift(created);
      setSelection(section, getItemId(section, created));
      renderSection(section);
    }),
  );
  if (section === "sessions") {
    renderSessionFilters(listCard);
  }
  toolbar.append(
    createButton("Poista", "danger", () => {
      if (!getSelection(section)) return;
      if (!confirm("Haluatko varmasti poistaa tämän?")) return;
      pushUndo(section);
      deleteSelected(section);
      renderSection(section);
      showToast("Poistettu.", "ok");
    }),
  );

  const list = document.createElement("div");
  list.className = "list";
  listCard.append(list);

  const rawData = getSectionData(section);
  const data = section === "sessions" ? filteredSessionList(rawData) : rawData;
  const selectedId = getSelection(section);

  if (!rawData.length && section !== "sessions") {
    list.appendChild(renderEmptyState(section, () => {
      pushUndo(section);
      const created = makeDefaultItem(section);
      rawData.unshift(created);
      setSelection(section, getItemId(section, created));
      renderSection(section);
    }));
  }

  for (const item of data) {
    const id = getItemId(section, item);
    const button = document.createElement("button");
    if (id === selectedId) button.classList.add("active");
    const title = section === "services" ? item.name : section === "sitecopy" ? item.key : item.title;
    const sessionTone = section === "sessions" ? (isSessionPast(item) ? "past" : "upcoming") : "";
    if (sessionTone) button.classList.add(sessionTone);
    button.innerHTML = `<p class="title">${title || "(nimetön)"}</p><p class="meta">${listMeta(section, item)}</p>`;
    button.addEventListener("click", () => {
      setSelection(section, id);
      renderSection(section);
    });
    list.append(button);
  }

  const selectedItem = ensureSelection(section);
  const formCard = document.createElement("div");
  formCard.className = "card";
  formCol.append(formCard);
  if (!selectedItem) {
    formCard.innerHTML = "<p class='meta'>Ei merkintöjä.</p>";
    return;
  }

  const errors = validateItem(section, selectedItem);
  const formGrid = document.createElement("div");
  formGrid.className = "grid cols-2";
  for (const field of schema.fields) {
    const fieldNode = renderField(field, selectedItem, errors, section);
    if (field.type === "textarea") fieldNode.style.gridColumn = "1 / -1";
    formGrid.append(fieldNode);
  }
  formCard.append(formGrid);
  if (section === "sessions") {
    formCard.append(quickActionButtons(selectedItem, () => renderSection(section)));
  }
  if (section === "services") {
    const previewBtn = createButton("Esikatsele", "", () => renderPreview("services", selectedItem));
    formCard.appendChild(previewBtn);
  }
  if (section === "sitecopy") {
    formCard.appendChild(renderContextMap());
  }
  const checklist = renderChecklist(section, selectedItem, errors);
  if (checklist) formCard.append(checklist);

  const actions = document.createElement("div");
  actions.className = "actions";
  if (section === "services" || section === "sessions") {
    const previewBtn = createButton("Esikatsele", "", () => renderPreview(section, selectedItem));
    actions.append(previewBtn);
  }
  const saveButton = createButton("Tallenna", "primary", async () => {
    const latestErrors = validateItem(section, selectedItem);
    if (latestErrors.length) {
      setStatus("Korjaa lomakkeen virheet ennen tallennusta.", "error");
      renderSection(section);
      return;
    }
    pushUndo(section);
    try {
      await saveSection(section);
      renderSection(section);
      document.getElementById(`section-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Tallennus epäonnistui.", "error");
    }
  });
  actions.append(saveButton);
  formCard.append(actions);
}

function renderTabs() {
  el.tabs.textContent = "";
  for (const schema of schemas) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = `tab ${state.activeTab === schema.section ? "active" : ""}`;
    tab.textContent = schema.title;
    tab.addEventListener("click", () => {
      state.activeTab = schema.section;
      render();
    });
    el.tabs.append(tab);
  }
}

function renderSectionsHost() {
  el.sectionHost.textContent = "";
  for (const schema of schemas) {
    const section = document.createElement("section");
    section.id = `section-${schema.section}`;
    section.className = `section ${state.activeTab === schema.section ? "active" : ""}`;
    el.sectionHost.append(section);
  }
}

function render() {
  renderTabs();
  renderSectionsHost();
  renderSection(state.activeTab);
}

async function loadContent() {
  const response = await request("/api/admin/content");
  state.csrfToken = response.csrfToken;
  state.content = response.content;
  render();
}

el.logout.addEventListener("click", async () => {
  try {
    await request("/api/admin/auth/logout", { method: "POST" });
  } finally {
    window.location.assign("/admin/login");
  }
});

/* Keyboard shortcuts */
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
    e.preventDefault();
    const saveBtn = document.querySelector(".actions button.primary");
    if (saveBtn && !saveBtn.disabled) saveBtn.click();
  }
  if (e.ctrlKey && (e.key === "z" || e.key === "Z")) {
    e.preventDefault();
    undo();
  }
});

/* Warn about unsaved changes on page unload */
window.addEventListener("beforeunload", (e) => {
  const section = state.activeTab;
  const data = getSectionData(section);
  const selectedId = getSelection(section);
  if (!selectedId) return;
  const item = data.find((i) => getItemId(section, i) === selectedId);
  if (!item) return;
  const saved = loadAutosave(section, selectedId);
  if (saved && JSON.stringify(saved.data) !== JSON.stringify(item)) {
    e.preventDefault();
    e.returnValue = "";
  }
});

loadContent().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Tietojen lataus epäonnistui.", "error");
  if (error instanceof Error && error.message.includes("Kirjautuminen")) {
    window.location.assign("/admin/login");
  }
});
