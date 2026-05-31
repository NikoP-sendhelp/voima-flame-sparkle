(function () {
  function normalizeSlug(input) {
    return String(input || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "");
  }

  function isIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  }

  function isIsoTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
  }

  function parseSessionDateTime(date, time) {
    if (!isIsoDate(date) || !isIsoTime(time)) return null;
    return new Date(`${date}T${time}:00`);
  }

  function formatLocalDateTime(date, time) {
    const dt = parseSessionDateTime(date, time);
    if (!dt) return "";
    return new Intl.DateTimeFormat("fi-FI", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dt);
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  window.AdminUtils = {
    normalizeSlug,
    isIsoDate,
    isIsoTime,
    parseSessionDateTime,
    formatLocalDateTime,
    todayIso,
  };
})();
