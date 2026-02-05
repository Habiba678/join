function initDragAndDrop() {
  bindDragStart();
  bindDragEnd();
  bindDropZones();
}

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

function bindDragEnd() {
  document.addEventListener("dragend", function (e) {
    const card = e.target.closest(".card");
    if (card) card.classList.remove("dragging");
    isDragging = false;
    clearDragOverClasses();
  });
}

function clearDragOverClasses() {
  const columns = document.querySelectorAll(".column");
  for (let i = 0; i < columns.length; i++) {
    columns[i].classList.remove("drag-over");
  }
}

function bindDropZones() {
  const zones = document.querySelectorAll(".column .cards");
  for (let i = 0; i < zones.length; i++) {
    attachZoneEvents(zones[i]);
  }
}

function attachZoneEvents(zone) {
  addDragOverHandler(zone);
  addDragLeaveHandler(zone);
  addDropHandler(zone);
}

function addDragOverHandler(zone) {
  zone.addEventListener("dragover", function (e) {
    e.preventDefault();
    const col = zone.closest(".column");
    if (col) col.classList.add("drag-over");
    e.dataTransfer.dropEffect = "move";
  });
}

function addDragLeaveHandler(zone) {
  zone.addEventListener("dragleave", function () {
    const col = zone.closest(".column");
    if (col) col.classList.remove("drag-over");
  });
}

function addDropHandler(zone) {
  zone.addEventListener("drop", function (e) {
    handleDrop(zone, e);
  });
}

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

function getDraggedCard(id) {
  if (id) {
    return document.querySelector('.card[data-id="' + CSS.escape(String(id)) + '"]');
  }
  return document.querySelector(".card.dragging");
}

function updateStatusAfterDrop(col, id) {
  const newStatus = col && col.dataset ? col.dataset.status : null;
  if (newStatus) updateTaskStatus(id, newStatus);
}

function updateTaskStatus(id, status) {
  const tasks = getTasks();
  const idx = findTaskIndexById(id, tasks);
  if (idx === -1) return;
  tasks[idx].status = status;
  saveTasks(tasks);
}

// ---------------- Empty placeholders ----------------
function updateEmptyStates() {
  const columns = document.querySelectorAll(".column");
  for (let i = 0; i < columns.length; i++) {
    setEmptyStateForColumn(columns[i]);
  }
}

function setEmptyStateForColumn(col) {
  const cards = col.querySelector(".cards");
  const empty = col.querySelector(".empty");
  if (!cards || !empty) return;
  empty.style.display = cards.children.length ? "none" : "block";
}

// ---------------- Utils ----------------
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function updateBodyScrollLock() {
  const addTaskOpen = isBackdropOpen("addTaskOverlayBackdrop");
  const taskOpen = isBackdropOpen("taskOverlayBackdrop");
  document.body.classList.toggle("no-scroll", addTaskOpen || taskOpen);
}

function isBackdropOpen(id) {
  const el = document.getElementById(id);
  return !!(el && !el.hidden);
}

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

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getAvatarColor(seed) {
  const colors = ["#00BEE8", "#6E52FF", "#FF7A00", "#FF5EB3", "#1FD7C1"];
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  return colors[sum % colors.length];
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
