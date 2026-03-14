/**
 * Sets the text content of an element by its ID.
 * @param {string} id Element ID.
 * @param {string} value Text value to apply.
 * @returns {void}
 */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * Sets the value of an input-like element by its ID.
 * @param {string} id Element ID.
 * @param {string} value Value to apply.
 * @returns {void}
 */
function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

/**
 * Reads the value of an input-like element by its ID.
 * @param {string} id Element ID.
 * @returns {string} Current input value or an empty string.
 */
function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

/**
 * Toggles the body scroll lock depending on currently open backdrops.
 * @returns {void}
 */
function updateBodyScrollLock() {
  const addTaskOpen = isBackdropOpen("addTaskOverlayBackdrop");
  const taskOpen = isBackdropOpen("taskOverlayBackdrop");
  document.body.classList.toggle("no-scroll", addTaskOpen || taskOpen);
}

/**
 * Checks whether a backdrop element exists and is currently visible.
 * @param {string} id Backdrop element ID.
 * @returns {boolean} `true` when the backdrop is open.
 */
function isBackdropOpen(id) {
  const el = document.getElementById(id);
  return !!(el && !el.hidden);
}

/**
 * Formats an ISO date string to `DD/MM/YYYY` for board UI output.
 * @param {string} value Raw date value.
 * @returns {string} Formatted date string or the original value.
 */
function formatDate(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parts = value.split("-");
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    return d + "/" + m + "/" + y;
  }
  return value;
}

/**
 * Builds avatar initials from a full name.
 * @param {string} name Full name or label.
 * @returns {string} One- or two-letter uppercase initials.
 */
function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Picks one of the predefined avatar colors based on a deterministic seed.
 * @param {string} seed Input string used to derive the color.
 * @returns {string} Hex color string.
 */
function getAvatarColor(seed) {
  const colors = ["#00BEE8", "#6E52FF", "#FF7A00", "#FF5EB3", "#1FD7C1"];
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  return colors[sum % colors.length];
}

/**
 * Capitalizes the first character of a string.
 * @param {string} s Source string.
 * @returns {string} Capitalized string or the original falsy value.
 */
function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Escapes unsafe HTML characters for safe string interpolation.
 * @param {string} str Source text.
 * @returns {string} Escaped HTML string.
 */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
