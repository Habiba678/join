let touchDragCard = null;
let touchDragId = null;
let touchDragStartX = 0;
let touchDragStartY = 0;
let touchDragActive = false;
let lastTouchClientX = 0;
let lastTouchClientY = 0;
const TOUCH_DRAG_THRESHOLD = 10;

/**
 * Initialize drag and drop.
 */
function initDragAndDrop() {
  bindDragStart();
  bindDragEnd();
  bindDropZones();
  bindTouchDrag();
}

/**
 * Bind drag start.
 */
function bindDragStart() {
  document.addEventListener("dragstart", function (e) {
    const card = e.target.closest(".card");
    if (!card) return;
    isDragging = true;
    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", card.dataset.id || "");
  });
}

/**
 * Bind drag end.
 */
function bindDragEnd() {
  document.addEventListener("dragend", function (e) {
    const card = e.target.closest(".card");
    if (card) card.classList.remove("dragging");
    isDragging = false;
    clearDragOverClasses();
  });
}

/**
 * Clear drag over classes.
 */
function clearDragOverClasses() {
  const columns = document.querySelectorAll(".column");
  for (let i = 0; i < columns.length; i++) {
    columns[i].classList.remove("drag-over");
  }
}

/**
 * Bind drop zones.
 */
function bindDropZones() {
  const zones = document.querySelectorAll(".column .cards");
  for (let i = 0; i < zones.length; i++) {
    attachZoneEvents(zones[i]);
  }
}

/**
 * Attach zone events.
 */
function attachZoneEvents(zone) {
  addDragOverHandler(zone);
  addDragLeaveHandler(zone);
  addDropHandler(zone);
}

/**
 * Add drag over handler.
 */
function addDragOverHandler(zone) {
  zone.addEventListener("dragover", function (e) {
    e.preventDefault();
    const col = zone.closest(".column");
    if (col) col.classList.add("drag-over");
    e.dataTransfer.dropEffect = "move";
  });
}

/**
 * Add drag leave handler.
 */
function addDragLeaveHandler(zone) {
  zone.addEventListener("dragleave", function () {
    const col = zone.closest(".column");
    if (col) col.classList.remove("drag-over");
  });
}

/**
 * Add drop handler.
 */
function addDropHandler(zone) {
  zone.addEventListener("drop", function (e) {
    handleDrop(zone, e);
  });
}

/**
 * Handle drop.
 */
function handleDrop(zone, e) {
  e.preventDefault();
  const col = zone.closest(".column");
  if (col) col.classList.remove("drag-over");
  const id = e.dataTransfer.getData("text/plain");
  const card = getDraggedCard(id);
  if (!card) return;
  zone.appendChild(card);
  updateStatusAfterDrop(col, id);
  updateEmptyStates();
}

/**
 * Handle touch drop.
 */
function handleTouchDrop(zone, card, id) {
  const col = zone.closest(".column");
  if (col) col.classList.remove("drag-over");
  if (!card || !id) return;
  zone.appendChild(card);
  updateStatusAfterDrop(col, id);
  updateEmptyStates();
}

/**
 * Get dragged card.
 */
function getDraggedCard(id) {
  if (id) {
    return document.querySelector('.card[data-id="' + CSS.escape(String(id)) + '"]');
  }
  return document.querySelector(".card.dragging");
}

/**
 * Update status after drop.
 */
function updateStatusAfterDrop(col, id) {
  const newStatus = col && col.dataset ? col.dataset.status : null;
  if (newStatus) updateTaskStatus(id, newStatus);
}

/**
 * Update task status.
 */
function updateTaskStatus(id, status) {
  const tasks = getTasks();
  const idx = findTaskIndexById(id, tasks);
  if (idx === -1) return;
  tasks[idx].status = status;
  saveTasks(tasks);
}

// ---------------- Empty placeholders ----------------
/**
 * Update empty states.
 */
function updateEmptyStates() {
  const columns = document.querySelectorAll(".column");
  for (let i = 0; i < columns.length; i++) {
    setEmptyStateForColumn(columns[i]);
  }
}

/**
 * Set empty state for column.
 */
function setEmptyStateForColumn(col) {
  const cards = col.querySelector(".cards");
  const empty = col.querySelector(".empty");
  if (!cards || !empty) return;
  empty.style.display = cards.children.length ? "none" : "block";
}

// ---------------- Touch drag & drop (mobile) ----------------
/**
 * Bind touch drag.
 */
function bindTouchDrag() {
  document.addEventListener("touchstart", onTouchStart, { passive: true });
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("touchend", onTouchEnd);
  document.addEventListener("touchcancel", onTouchEnd);
}

/**
 * On touch start.
 */
function onTouchStart(e) {
  if (e.touches.length !== 1) return;
  const card = e.target.closest(".card");
  if (!card) return;

  const touch = e.touches[0];
  touchDragCard = card;
  touchDragId = card.dataset.id || "";
  touchDragStartX = touch.clientX;
  touchDragStartY = touch.clientY;
  lastTouchClientX = touch.clientX;
  lastTouchClientY = touch.clientY;
  touchDragActive = false;
}

/**
 * On touch move.
 */
function onTouchMove(e) {
  if (!touchDragCard) return;
  const touch = e.touches[0];
  updateTouchPosition(touch);
  if (!ensureTouchDragActive()) return;
  e.preventDefault();
  updateTouchDragOver(lastTouchClientX, lastTouchClientY);
}

/**
 * Update touch position.
 */
function updateTouchPosition(touch) {
  lastTouchClientX = touch.clientX;
  lastTouchClientY = touch.clientY;
}

/**
 * Ensure touch drag active.
 */
function ensureTouchDragActive() {
  if (touchDragActive) return true;
  if (!hasTouchDragThreshold()) return false;
  activateTouchDrag();
  return true;
}

/**
 * Has touch drag threshold.
 */
function hasTouchDragThreshold() {
  const dx = lastTouchClientX - touchDragStartX;
  const dy = lastTouchClientY - touchDragStartY;
  return Math.abs(dx) + Math.abs(dy) >= TOUCH_DRAG_THRESHOLD;
}

/**
 * Activate touch drag.
 */
function activateTouchDrag() {
  touchDragActive = true;
  isDragging = true;
  touchDragCard.classList.add("dragging");
}

/**
 * On touch end.
 */
function onTouchEnd() {
  if (!touchDragCard) return;
  const card = touchDragCard; const id = touchDragId; const wasActive = touchDragActive;
  clearDragOverClasses();

  if (wasActive) {
    const el = document.elementFromPoint(lastTouchClientX, lastTouchClientY);
    const zone = el && el.closest ? el.closest(".column .cards") : null;
    if (zone) { handleTouchDrop(zone, card, id);}
  }
  card.classList.remove("dragging");
  touchDragCard = null; touchDragId = null; touchDragActive = false;  isDragging = false;
}

/**
 * Update touch drag over.
 */
function updateTouchDragOver(x, y) {
  clearDragOverClasses();
  const el = document.elementFromPoint(x, y);
  if (!el || !el.closest) return;
  const zone = el.closest(".column .cards");
  if (!zone) return;
  const col = zone.closest(".column");
  if (col) col.classList.add("drag-over");
}

// ---------------- Utils ----------------
/**
 * Set text.
 */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * Set input value.
 */
function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

/**
 * Get input value.
 */
function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

/**
 * Update body scroll lock.
 */
function updateBodyScrollLock() {
  const addTaskOpen = isBackdropOpen("addTaskOverlayBackdrop");
  const taskOpen = isBackdropOpen("taskOverlayBackdrop");
  document.body.classList.toggle("no-scroll", addTaskOpen || taskOpen);
}

/**
 * Is backdrop open.
 */
function isBackdropOpen(id) {
  const el = document.getElementById(id);
  return !!(el && !el.hidden);
}

/**
 * Format date.
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
 * Get initials.
 */
function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Get avatar color.
 */
function getAvatarColor(seed) {
  const colors = ["#00BEE8", "#6E52FF", "#FF7A00", "#FF5EB3", "#1FD7C1"];
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  return colors[sum % colors.length];
}

/**
 * Capitalize.
 */
function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Escape html.
 */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
