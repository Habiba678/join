// ---------------- Overlay events ----------------
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

function getOverlayElements() {
  const els = collectOverlayElements();
  if (!els.backdrop || !els.closeBtn) {
    warnOverlayMissing();
    return null;
  }
  return els;
}

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

function warnOverlayMissing() {
  console.warn("Overlay elements not found (taskOverlayBackdrop/taskOverlayClose).");
}

function bindOverlayClose(els) {
  els.closeBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeTaskOverlay();
  });
}

function bindOverlayBackdrop(els) {
  els.backdrop.addEventListener("click", function (e) {
    if (e.target === els.backdrop) closeTaskOverlay();
  });
}

function bindOverlayEsc(els) {
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !els.backdrop.hidden) closeTaskOverlay();
  });
}

function bindOverlayDelete(els) {
  if (!els.delBtn) return;
  els.delBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!openedTaskId) return;
    deleteTask(openedTaskId);
  });
}

function bindOverlayEdit(els) {
  if (!els.editBtn) return;
  els.editBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!openedTaskId) return;
    enterOverlayEditMode(openedTaskId, els);
  });
}

function bindOverlaySave(els) {
  if (!els.saveBtn) return;
  els.saveBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!openedTaskId) return;
    saveOverlayEdits(openedTaskId, els);
  });
}

function bindOverlayEditForm(els) {
  if (!els.editForm) return;
  els.editForm.addEventListener("submit", function (e) {
    e.preventDefault();
  });
}

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

function findTaskById(id) {
  const tasks = getTasks();
  for (let i = 0; i < tasks.length; i++) {
    if (String(tasks[i].id) === String(id)) return tasks[i];
  }
  return null;
}

function setOverlayCategory(task) {
  const chip = document.getElementById("taskOverlayCategory");
  if (!chip) return;
  const isTech = task.category === "tech";
  chip.textContent = isTech ? "Technical Task" : "User Story";
  chip.classList.remove("user", "tech");
  chip.classList.add(isTech ? "tech" : "user");
}

function setOverlayTexts(task) {
  setText("taskOverlayTitle", task.title || "");
  setText("taskOverlayDesc", task.description || "");
  setText("taskOverlayDue", formatDate(task.dueDate || task.due || ""));
}

function setOverlayPriority(task) {
  const prioEl = document.getElementById("taskOverlayPrio");
  if (!prioEl) return;
  const pr = getTaskPriority(task);
  resetOverlayPriorityEl(prioEl, pr);
  appendOverlayPriorityText(prioEl, pr);
  appendOverlayPriorityIcon(prioEl, task, pr);
}

function renderOverlayAssigned(task) {
  const assignedWrap = document.getElementById("taskOverlayAssigned");
  if (!assignedWrap) return;
  assignedWrap.innerHTML = "";
  const list = getAssignedList(task);
  for (let i = 0; i < list.length; i++) {
    assignedWrap.appendChild(createPersonRow(list[i], i));
  }
}

function getAssignedList(task) {
  if (typeof resolveAssignedContacts === "function") return resolveAssignedContacts(task);
  const list = resolveAssignedList(task);
  return list.map(function (name) {
    const s = String(name || "");
    return { id: s, name: s };
  });
}

function createPersonRow(item, index) {
  const contact = normalizeOverlayContact(item);
  const row = document.createElement("div");
  row.className = "task-overlay-person";
  row.appendChild(createPersonBadge(contact, index));
  row.appendChild(createPersonText(contact));
  return row;
}

function createPersonBadge(contact, index) {
  const badge = document.createElement("div");
  const colorClass = getOverlayViewContactColorClass(contact, index);
  badge.className = "task-overlay-badge " + colorClass;
  badge.textContent = getInitials(String(contact.name || contact.id || ""));
  return badge;
}

function createPersonText(contact) {
  const text = document.createElement("div");
  text.textContent = String(contact.name || contact.id || "");
  return text;
}

function normalizeOverlayContact(item) {
  if (item && typeof item === "object") return item;
  const s = String(item || "");
  return { id: s, name: s };
}

function getOverlayViewContactColorClass(contact, index) {
  if (typeof getContactColorClass === "function") return getContactColorClass(contact);
  if (contact && contact.colorClass) return contact.colorClass;
  const seed = contact?.id || contact?.email || contact?.name || String(index || "");
  return "avatar-color-" + (overlayViewHashString(seed) % 12);
}

function overlayViewHashString(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

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

function showNoSubtasks(wrap) {
  wrap.textContent = "No subtasks";
}

function createSubtaskRow(subtask, index, taskId) {
  const row = document.createElement("div");
  row.className = "task-overlay-subtask";
  row.appendChild(createSubtaskCheckbox(subtask, index, taskId));
  row.appendChild(createSubtaskLabel(subtask));
  return row;
}

function createSubtaskCheckbox(subtask, index, taskId) {
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = !!subtask.done;
  box.addEventListener("change", function () {
    updateSubtaskDone(taskId, index, box.checked);
  });
  return box;
}

function createSubtaskLabel(subtask) {
  const label = document.createElement("span");
  label.textContent = subtask.title || "";
  return label;
}

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

function getTaskPriority(task) {
  return String(task.priority || task.prio || "medium").toLowerCase();
}

function resetOverlayPriorityEl(prioEl, pr) {
  prioEl.textContent = "";
  prioEl.classList.remove("urgent", "medium", "low");
  prioEl.classList.add(pr);
}

function appendOverlayPriorityText(prioEl, pr) {
  const text = document.createElement("span");
  text.textContent = capitalize(pr);
  prioEl.appendChild(text);
}

function appendOverlayPriorityIcon(prioEl, task, pr) {
  const icon = getPriorityIcon(task);
  if (!icon) return;
  const img = document.createElement("img");
  img.src = icon;
  img.alt = "Priority " + pr;
  img.className = "task-overlay-prio-icon";
  prioEl.appendChild(img);
}

function getCardByTaskId(id) {
  return document.querySelector('.card[data-id="' + id + '"]');
}

function removeCardProgress(existing) {
  if (existing) existing.remove();
}

function ensureCardProgress(card, existing) {
  if (existing) return existing;
  const bottom = card.querySelector(".card-bottom");
  if (!bottom) return null;
  const progress = buildCardProgressElement();
  bottom.insertBefore(progress, bottom.firstChild);
  return progress;
}

function buildCardProgressElement() {
  const progress = document.createElement("div");
  progress.className = "card-progress";
  progress.innerHTML =
    '<div class="card-progress-bar"><div class="card-progress-fill"></div></div>' +
    '<div class="card-progress-text"></div>';
  return progress;
}

function updateCardProgressDisplay(progress, done, total, percent) {
  const fill = progress.querySelector(".card-progress-fill");
  const text = progress.querySelector(".card-progress-text");
  if (fill) fill.style.width = percent + "%";
  if (text) text.textContent = done + "/" + total;
}

function showOverlay() {
  const backdrop = document.getElementById("taskOverlayBackdrop");
  if (!backdrop) return;
  backdrop.hidden = false;
  updateBodyScrollLock();
}

function closeTaskOverlay() {
  const backdrop = document.getElementById("taskOverlayBackdrop");
  if (!backdrop) return;
  backdrop.hidden = true;
  updateBodyScrollLock();
  openedTaskId = null;
  resetOverlayEditMode();
}

function resetOverlayEditMode() {
  const els = getOverlayElements();
  if (!els) return;
  isEditingOverlay = false;
  toggleOverlayEditState(els, false);
}

function enterOverlayEditMode(id, els) {
  const task = findTaskById(id);
  if (!task) return;
  isEditingOverlay = true;
  toggleOverlayEditState(els, true);
  fillOverlayEditForm(task);
  if (els.overlay) els.overlay.scrollTop = 0;
}

function exitOverlayEditMode(els) {
  isEditingOverlay = false;
  toggleOverlayEditState(els, false);
}

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
