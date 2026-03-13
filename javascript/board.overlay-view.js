// ---------------- Overlay events ----------------
/**
 * Initialize overlay events.
 */
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

/**
 * Get overlay elements.
 */
function getOverlayElements() {
  const els = collectOverlayElements();
  if (!els.backdrop || !els.closeBtn) {
    warnOverlayMissing();
    return null;
  }
  return els;
}

/**
 * Collect overlay elements.
 */
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

/**
 * Warn overlay missing.
 */
function warnOverlayMissing() {
  console.warn("Overlay elements not found (taskOverlayBackdrop/taskOverlayClose).");
}

/**
 * Bind overlay close.
 */
function bindOverlayClose(els) {
  els.closeBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeTaskOverlay();
  });
}

/**
 * Bind overlay backdrop.
 */
function bindOverlayBackdrop(els) {
  els.backdrop.addEventListener("click", function (e) {
    if (e.target === els.backdrop) closeTaskOverlay();
  });
}

/**
 * Bind overlay esc.
 */
function bindOverlayEsc(els) {
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !els.backdrop.hidden) closeTaskOverlay();
  });
}

/**
 * Bind overlay delete.
 */
function bindOverlayDelete(els) {
  if (!els.delBtn) return;
  els.delBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!openedTaskId) return;
    deleteTask(openedTaskId);
  });
}

/**
 * Bind overlay edit.
 */
function bindOverlayEdit(els) {
  if (!els.editBtn) return;
  els.editBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!openedTaskId) return;
    enterOverlayEditMode(openedTaskId, els);
  });
}

/**
 * Bind overlay save.
 */
function bindOverlaySave(els) {
  if (!els.saveBtn) return;
  els.saveBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!openedTaskId) return;
    saveOverlayEdits(openedTaskId, els);
  });
}

/**
 * Bind overlay edit form.
 */
function bindOverlayEditForm(els) {
  if (!els.editForm) return;
  els.editForm.addEventListener("submit", function (e) {
    e.preventDefault();
  });
}

/**
 * Bind overlay open by card.
 */
function bindOverlayOpenByCard() {
  document.addEventListener("click", function (e) {
    if (isDragging) return;
    if (e.target.closest(".task-overlay")) return;
    const card = e.target.closest(".card");
    if (!card) return;
    openTaskOverlay(card.dataset.id);
  });
}

// ---------------- Open / Close overlay ----------------
/**
 * Open task overlay.
 */
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
  showOverlay(task);
}

/**
 * Find task by id.
 */
function findTaskById(id) {
  const tasks = getTasks();
  for (let i = 0; i < tasks.length; i++) {
    if (String(tasks[i].id) === String(id)) return tasks[i];
  }
  return null;
}

/**
 * Set overlay category.
 */
function setOverlayCategory(task) {
  const chip = document.getElementById("taskOverlayCategory");
  if (!chip) return;
  const isTech = task.category === "tech";
  chip.textContent = isTech ? "Technical Task" : "User Story";
  chip.classList.remove("user", "tech");
  chip.classList.add(isTech ? "tech" : "user");
}

/**
 * Set overlay texts.
 */
function setOverlayTexts(task) {
  setText("taskOverlayTitle", task.title || "");
  setText("taskOverlayDesc", task.description || "");
  setText("taskOverlayDue", formatDate(task.dueDate || task.due || ""));
}

/**
 * Set overlay priority.
 */
function setOverlayPriority(task) {
  const prioEl = document.getElementById("taskOverlayPrio");
  if (!prioEl) return;
  const pr = getTaskPriority(task);
  resetOverlayPriorityEl(prioEl, pr);
  appendOverlayPriorityText(prioEl, pr);
  appendOverlayPriorityIcon(prioEl, task, pr);
}

/**
 * Render overlay assigned.
 */
function renderOverlayAssigned(task) {
  const assignedWrap = document.getElementById("taskOverlayAssigned");
  if (!assignedWrap) return;
  assignedWrap.innerHTML = "";
  const list = getAssignedList(task);
  for (let i = 0; i < list.length; i++) {
    assignedWrap.appendChild(createPersonRow(list[i], i));
  }
}

/**
 * Get assigned list.
 */
function getAssignedList(task) {
  if (typeof resolveAssignedContacts === "function") return resolveAssignedContacts(task);
  const list = resolveAssignedList(task);
  return list.map(function (name) {
    const s = String(name || "");
    return { id: s, name: s };
  });
}

/**
 * Create person row.
 */
function createPersonRow(item, index) {
  const contact = normalizeOverlayContact(item);
  const row = document.createElement("div");
  row.className = "task-overlay-person";
  row.appendChild(createPersonBadge(contact, index));
  row.appendChild(createPersonText(contact));
  return row;
}

/**
 * Create person badge.
 */
function createPersonBadge(contact, index) {
  const badge = document.createElement("div");
  const colorClass = getOverlayViewContactColorClass(contact, index);
  badge.className = "task-overlay-badge " + colorClass;
  badge.textContent = getInitials(String(contact.name || contact.id || ""));
  return badge;
}

/**
 * Create person text.
 */
function createPersonText(contact) {
  const text = document.createElement("div");
  text.textContent = String(contact.name || contact.id || "");
  return text;
}

/**
 * Normalize overlay contact.
 */
function normalizeOverlayContact(item) {
  if (item && typeof item === "object") return item;
  const s = String(item || "");
  return { id: s, name: s };
}

/**
 * Get overlay view contact color class.
 */
function getOverlayViewContactColorClass(contact, index) {
  if (typeof getContactColorClass === "function") return getContactColorClass(contact);
  if (contact && contact.colorClass) return contact.colorClass;
  const seed = contact?.id || contact?.email || contact?.name || String(index || "");
  return "avatar-color-" + (overlayViewHashString(seed) % 12);
}

/**
 * Overlay view hash string.
 */
function overlayViewHashString(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Render overlay subtasks.
 */
function renderOverlaySubtasks(task) {
  const subtasksWrap = document.getElementById("taskOverlaySubtasks");
  if (!subtasksWrap) return;
  subtasksWrap.innerHTML = "";
  const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
  if (!subs.length) return showNoSubtasks(subtasksWrap);
  for (let i = 0; i < subs.length; i++) {
    subtasksWrap.appendChild(createSubtaskRow(subs[i], i, task.id));
  }
}

/**
 * Show no subtasks.
 */
function showNoSubtasks(wrap) {
  wrap.textContent = "No subtasks";
}

/**
 * Create subtask row.
 */
function createSubtaskRow(subtask, index, taskId) {
  const row = document.createElement("div");
  row.className = "task-overlay-subtask";
  row.appendChild(createSubtaskCheckbox(subtask, index, taskId));
  row.appendChild(createSubtaskLabel(subtask));
  return row;
}

/**
 * Create subtask checkbox.
 */
function createSubtaskCheckbox(subtask, index, taskId) {
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = !!subtask.done;
  box.addEventListener("change", function () {
    updateSubtaskDone(taskId, index, box.checked);
  });
  return box;
}

/**
 * Create subtask label.
 */
function createSubtaskLabel(subtask) {
  const label = document.createElement("span");
  label.textContent = subtask.title || "";
  return label;
}

/**
 * Update subtask done.
 */
function updateSubtaskDone(taskId, subIndex, done) {
  const tasks = getTasks();
  const idx = findTaskIndexById(taskId, tasks);
  if (idx < 0) return;
  const task = tasks[idx];
  if (!Array.isArray(task.subtasks) || !task.subtasks[subIndex]) return;
  task.subtasks[subIndex].done = !!done;
  saveTasks(tasks);
  updateCardSubtaskProgress(task);
}

/**
 * Update card subtask progress.
 */
function updateCardSubtaskProgress(task) {
  const card = getCardByTaskId(task.id);
  if (!card) return;
  const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
  const total = subs.length;
  const existing = card.querySelector(".card-progress");
  if (!total) return removeCardProgress(existing);
  const done = countDoneSubtasks(subs);
  const percent = Math.round((done / total) * 100);
  const progress = ensureCardProgress(card, existing);
  if (!progress) return;
  updateCardProgressDisplay(progress, done, total, percent);
}

/**
 * Get task priority.
 */
function getTaskPriority(task) {
  return String(task.priority || task.prio || "medium").toLowerCase();
}

/**
 * Reset overlay priority el.
 */
function resetOverlayPriorityEl(prioEl, pr) {
  prioEl.textContent = "";
  prioEl.classList.remove("urgent", "medium", "low");
  prioEl.classList.add(pr);
}

/**
 * Append overlay priority text.
 */
function appendOverlayPriorityText(prioEl, pr) {
  const text = document.createElement("span");
  text.textContent = capitalize(pr);
  prioEl.appendChild(text);
}

/**
 * Append overlay priority icon.
 */
function appendOverlayPriorityIcon(prioEl, task, pr) {
  const icon = getPriorityIcon(task);
  if (!icon) return;
  const img = document.createElement("img");
  img.src = icon;
  img.alt = "Priority " + pr;
  img.className = "task-overlay-prio-icon";
  prioEl.appendChild(img);
}

/**
 * Get card by task id.
 */
function getCardByTaskId(id) {
  return document.querySelector('.card[data-id="' + id + '"]');
}

/**
 * Remove card progress.
 */
function removeCardProgress(existing) {
  if (existing) existing.remove();
}

/**
 * Ensure card progress.
 */
function ensureCardProgress(card, existing) {
  if (existing) return existing;
  const bottom = card.querySelector(".card-bottom");
  if (!bottom) return null;
  const progress = buildCardProgressElement();
  bottom.insertBefore(progress, bottom.firstChild);
  return progress;
}

/**
 * Build card progress element.
 */
function buildCardProgressElement() {
  const progress = document.createElement("div");
  progress.className = "card-progress";
  progress.innerHTML =
    '<div class="card-progress-bar"><div class="card-progress-fill"></div></div>' +
    '<div class="card-progress-text"></div>';
  return progress;
}

/**
 * Update card progress display.
 */
function updateCardProgressDisplay(progress, done, total, percent) {
  const fill = progress.querySelector(".card-progress-fill");
  const text = progress.querySelector(".card-progress-text");
  if (fill) fill.style.width = percent + "%";
  if (text) text.textContent = done + "/" + total;
}

/**
 * Show overlay.
 */
function showOverlay() {
  const backdrop = document.getElementById("taskOverlayBackdrop");
  if (!backdrop) return;
  backdrop.hidden = false;
  updateBodyScrollLock();
}

/**
 * Close task overlay.
 */
function closeTaskOverlay() {
  const backdrop = document.getElementById("taskOverlayBackdrop");
  if (!backdrop) return;
  backdrop.hidden = true;
  updateBodyScrollLock();
  openedTaskId = null;
  resetOverlayEditMode();
}

/**
 * Reset overlay edit mode.
 */
function resetOverlayEditMode() {
  const els = getOverlayElements();
  if (!els) return;
  isEditingOverlay = false;
  toggleOverlayEditState(els, false);
}

/**
 * Enter overlay edit mode.
 */
function enterOverlayEditMode(id, els) {
  const task = findTaskById(id);
  if (!task) return;
  isEditingOverlay = true;
  toggleOverlayEditState(els, true);
  fillOverlayEditForm(task);
  if (els.overlay) els.overlay.scrollTop = 0;
}

/**
 * Exit overlay edit mode.
 */
function exitOverlayEditMode(els) {
  isEditingOverlay = false;
  toggleOverlayEditState(els, false);
}

/**
 * Toggle overlay edit state.
 */
function toggleOverlayEditState(els, editing) {
  if (els.view) els.view.hidden = editing;
  if (els.editForm) els.editForm.hidden = !editing;
  if (els.overlay) {
    editing ? els.overlay.classList.add("is-editing") : els.overlay.classList.remove("is-editing");
  }
  if (els.editBtn) els.editBtn.hidden = editing;
  if (els.delBtn) els.delBtn.hidden = editing;
  if (els.saveBtn) els.saveBtn.hidden = !editing;
}
