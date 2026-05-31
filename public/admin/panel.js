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
};

const knownSiteKeys = [
  { value: "default_location", label: "Oletussijainti" },
  { value: "default_booking_email", label: "Varaussähköposti" },
  { value: "default_booking_phone", label: "Varauspuhelin" },
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

function normalizeSlug(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function setStatus(message, kind = "ok") {
  el.status.textContent = message;
  el.status.className = `status ${kind === "error" ? "error" : "ok"}`;
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
    if (item.date && !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
      errors.push({ field: "date", message: "Muoto: YYYY-MM-DD" });
    }
    if (item.startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.startTime)) {
      errors.push({ field: "startTime", message: "Muoto: HH:MM" });
    }
    if (item.endTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.endTime)) {
      errors.push({ field: "endTime", message: "Muoto: HH:MM" });
    }
  }
  if (section === "services") {
    const slug = normalizeSlug(item.slug || "");
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
  const response = await request(endpoint, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (section === "sessions") state.content.sessions = response.sessions;
  if (section === "services") state.content.services = response.services;
  if (section === "sitecopy") state.content.siteCopy = response.siteCopy;
  if (section === "news") state.content.news = response.news;
  state.busy = false;
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
      item.slug = normalizeSlug(value);
    }
    if (section === "sessions" && field.key === "serviceSlug" && (!item.title || item.title.trim() === "")) {
      const selectedService = serviceOptions().find((entry) => entry.value === value);
      item.title = selectedService?.label || item.title;
    }
  });

  return wrapper;
}

function renderSection(section) {
  const schema = schemaWithDynamicOptions(schemas.find((entry) => entry.section === section));
  const root = document.getElementById(`section-${section}`);
  root.textContent = "";

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
      const created = makeDefaultItem(section);
      const data = getSectionData(section);
      data.unshift(created);
      setSelection(section, getItemId(section, created));
      renderSection(section);
    }),
  );
  toolbar.append(
    createButton("Poista", "danger", () => {
      if (!getSelection(section)) return;
      deleteSelected(section);
      renderSection(section);
    }),
  );

  const list = document.createElement("div");
  list.className = "list";
  listCard.append(list);

  const data = getSectionData(section);
  const selectedId = getSelection(section);
  for (const item of data) {
    const id = getItemId(section, item);
    const button = document.createElement("button");
    if (id === selectedId) button.classList.add("active");
    const title = section === "services" ? item.name : section === "sitecopy" ? item.key : item.title;
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

  const actions = document.createElement("div");
  actions.className = "actions";
  const saveButton = createButton("Tallenna", "primary", async () => {
    const latestErrors = validateItem(section, selectedItem);
    if (latestErrors.length) {
      setStatus("Korjaa lomakkeen virheet ennen tallennusta.", "error");
      renderSection(section);
      return;
    }
    saveButton.disabled = true;
    try {
      await saveSection(section);
      setStatus(`${schema.title} tallennettu.`, "ok");
      renderSection(section);
      document.getElementById(`section-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Tallennus epäonnistui.", "error");
    } finally {
      saveButton.disabled = false;
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

loadContent().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Tietojen lataus epäonnistui.", "error");
  if (error instanceof Error && error.message.includes("Kirjautuminen")) {
    window.location.assign("/admin/login");
  }
});
