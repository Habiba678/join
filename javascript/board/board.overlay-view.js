/** @typedef {{overlay: HTMLElement|null, backdrop: HTMLElement|null, top: HTMLElement|null, closeBtn: HTMLElement|null, delBtn: HTMLElement|null, editBtn: HTMLElement|null, saveBtn: HTMLElement|null, view: HTMLElement|null, editForm: HTMLElement|null}} OverlayViewElements */
/** @typedef {{id?: string|number, name?: string, email?: string, colorClass?: string}} OverlayViewContact */

// ---------------- Overlay events ----------------
/** Initializes task-overlay listeners and edit widgets. @returns {void} */
function initOverlayEvents() {
  const els = getOverlayElements();
  if (!els) return;
  toggleOverlayEditState(els, false);
  bindOverlayClose(els);
  bindOverlayBackdrop(els);
  bindOverlayEsc(els);
  bindOverlayDelete(els);
  bindOverlayEdit(els);
  bindOverlaySave(els);
  bindOverlayEditForm(els);
  initOverlayEditWidgets();
  bindOverlayOpenByCard();
}

/** @returns {OverlayViewElements|null} Required overlay element references. */
function getOverlayElements() {
  const els = collectOverlayElements();
  if (!els.backdrop || !els.closeBtn) {
    warnOverlayMissing();
    return null;
  }
  return els;
}

/** @returns {OverlayViewElements} All known task-overlay element references. */
function collectOverlayElements() {
  return {
    overlay: document.querySelector(".task-overlay"),
    backdrop: document.getElementById("taskOverlayBackdrop"),
    top: document.querySelector(".task-overlay-top"),
    closeBtn: document.getElementById("taskOverlayClose"),
    delBtn: document.getElementById("taskOverlayDelete"),
    editBtn: document.getElementById("taskOverlayEdit"),
    saveBtn: document.getElementById("taskOverlaySave"),
    view: document.getElementById("taskOverlayView"),
    editForm: document.getElementById("taskOverlayEditForm"),
  };
}

/** Logs a warning when critical overlay elements are missing. @returns {void} */
function warnOverlayMissing() {
  console.warn("Overlay elements not found (taskOverlayBackdrop/taskOverlayClose).");
}

/** @param {OverlayViewElements} els Overlay element references. @returns {void} */
function bindOverlayClose(els) {
  els.closeBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeTaskOverlay();
  });
}

/** @param {OverlayViewElements} els Overlay element references. @returns {void} */
function bindOverlayBackdrop(els) {
  els.backdrop.addEventListener("click", function (e) {
    if (e.target === els.backdrop) closeTaskOverlay();
  });
}

/** @param {OverlayViewElements} els Overlay element references. @returns {void} */
function bindOverlayEsc(els) {
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !els.backdrop.hidden) closeTaskOverlay();
  });
}

/** @param {OverlayViewElements} els Overlay element references. @returns {void} */
function bindOverlayDelete(els) {
  if (!els.delBtn) return;
  els.delBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!openedTaskId) return;
    deleteTask(openedTaskId);
  });
}

/** @param {OverlayViewElements} els Overlay element references. @returns {void} */
function bindOverlayEdit(els) {
  if (!els.editBtn) return;
  els.editBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!openedTaskId) return;
    enterOverlayEditMode(openedTaskId, els);
  });
}

/** @param {OverlayViewElements} els Overlay element references. @returns {void} */
function bindOverlaySave(els) {
  if (!els.saveBtn) return;
  els.saveBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!openedTaskId) return;
    saveOverlayEdits(openedTaskId, els);
  });
}

/** @param {OverlayViewElements} els Overlay element references. @returns {void} */
function bindOverlayEditForm(els) {
  if (!els.editForm) return;
  els.editForm.addEventListener("submit", function (e) {
    e.preventDefault();
  });
}

/** Opens the task overlay when a board card is clicked. @returns {void} */
function bindOverlayOpenByCard() {
  document.addEventListener("click", function (e) {
    if (isDragging) return;
    if (e.target.closest(".task-overlay")) return;
    const card = e.target.closest(".card");
    if (!card) return;
    openTaskOverlay(card.dataset.id);
  });
}

// ---------------- Open overlay ----------------
/** @param {string|number} id Task ID to open. @returns {void} */
function openTaskOverlay(id) {
  const task = findTaskById(id);
  if (!task) return;
  openedTaskId = String(id);
  resetOverlayEditMode();
  setOverlayCategory(task);
  setOverlayTexts(task);
  setOverlayPriority(task);
  renderOverlayAssigned(task);
  renderOverlaySubtasks(task);
  showOverlay();
}

/** @param {string|number} id Task ID to find. @returns {BoardTask|null} Matching task or `null`. */
function findTaskById(id) {
  const tasks = getTasks();
  for (let i = 0; i < tasks.length; i++) {
    if (String(tasks[i].id) === String(id)) return tasks[i];
  }
  return null;
}

/** @param {BoardTask} task Task to reflect in the category chip. @returns {void} */
function setOverlayCategory(task) {
  const chip = document.getElementById("taskOverlayCategory");
  if (!chip) return;
  const isTech = task.category === "tech";
  chip.textContent = isTech ? "Technical Task" : "User Story";
  chip.classList.remove("user", "tech");
  chip.classList.add(isTech ? "tech" : "user");
}

/** @param {BoardTask} task Task to reflect in title, description, and due date. @returns {void} */
function setOverlayTexts(task) {
  setText("taskOverlayTitle", task.title || "");
  setText("taskOverlayDesc", task.description || "");
  setText("taskOverlayDue", formatDate(task.dueDate || task.due || ""));
}

/** @param {BoardTask} task Task to reflect in the priority row. @returns {void} */
function setOverlayPriority(task) {
  const prioEl = document.getElementById("taskOverlayPrio");
  if (!prioEl) return;
  const pr = getTaskPriority(task);
  resetOverlayPriorityEl(prioEl, pr);
  appendOverlayPriorityText(prioEl, pr);
  appendOverlayPriorityIcon(prioEl, task, pr);
}

/** @param {BoardTask} task Task whose assignees should be rendered. @returns {void} */
function renderOverlayAssigned(task) {
  const assignedWrap = document.getElementById("taskOverlayAssigned");
  if (!assignedWrap) return;
  assignedWrap.innerHTML = "";
  const list = getAssignedList(task);
  for (let i = 0; i < list.length; i++) {
    assignedWrap.appendChild(createPersonRow(list[i], i));
  }
}

/** @param {BoardTask} task Task whose assignees should be normalized. @returns {OverlayViewContact[]} Overlay-ready contact list. */
function getAssignedList(task) {
  if (typeof resolveAssignedContacts === "function") return resolveAssignedContacts(task);
  const list = resolveAssignedList(task);
  return list.map(function (name) {
    const s = String(name || "");
    return { id: s, name: s };
  });
}

/** @param {OverlayViewContact|string} item Contact-like value to render. @param {number} index Fallback position for color hashing. @returns {HTMLDivElement} Assignee row element. */
function createPersonRow(item, index) {
  const contact = normalizeOverlayContact(item);
  const row = document.createElement("div");
  row.className = "task-overlay-person";
  row.appendChild(createPersonBadge(contact, index));
  row.appendChild(createPersonText(contact));
  return row;
}

/** @param {OverlayViewContact} contact Contact-like object. @param {number} index Fallback position for color hashing. @returns {HTMLDivElement} Avatar badge element. */
function createPersonBadge(contact, index) {
  const badge = document.createElement("div");
  const colorClass = getOverlayViewContactColorClass(contact, index);
  badge.className = "task-overlay-badge " + colorClass;
  badge.textContent = getInitials(String(contact.name || contact.id || ""));
  return badge;
}

/** @param {OverlayViewContact} contact Contact-like object. @returns {HTMLDivElement} Assignee name element. */
function createPersonText(contact) {
  const text = document.createElement("div");
  text.textContent = String(contact.name || contact.id || "");
  return text;
}

/** @param {OverlayViewContact|string} item Raw assignee value. @returns {OverlayViewContact} Normalized contact-like object. */
function normalizeOverlayContact(item) {
  if (item && typeof item === "object") return item;
  const s = String(item || "");
  return { id: s, name: s };
}

/** @param {OverlayViewContact} contact Contact-like object. @param {number} index Fallback position for color hashing. @returns {string} Avatar color class. */
function getOverlayViewContactColorClass(contact, index) {
  if (typeof getContactColorClass === "function") return getContactColorClass(contact);
  if (contact && contact.colorClass) return contact.colorClass;
  const seed = contact?.id || contact?.email || contact?.name || String(index || "");
  return "avatar-color-" + (overlayViewHashString(seed) % 12);
}

/** @param {string} str Seed string. @returns {number} Stable positive hash value. */
function overlayViewHashString(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
