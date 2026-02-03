const STORAGE_KEY = "tasks";
const CONTACTS_STORAGE_KEY = "join_contacts_v1";

let openedTaskId = null;
let isDragging = false;
let pendingDeleteId = null;
let isEditingOverlay = false;
let overlaySelectedContacts = new Set();
let overlayPendingSubtasks = [];
let overlaySelectedPriority = "medium";

document.addEventListener("DOMContentLoaded", function () {
  initRedirects();
  initAddTaskOverlay();
  renderBoardFromStorage();
  initDragAndDrop();
  initOverlayEvents();
  initDeleteConfirm();
  updateEmptyStates();
});

// ---------------- Redirects ----------------
function initRedirects() {
  bindAddCardIcons();
  bindTopAddButton();
}

function bindAddCardIcons() {
  const icons = document.querySelectorAll(".add-card-icon");
  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    icon.addEventListener("click", function () {
      goToAddTask(getColumnStatus(icon));
    });
  }
}

function bindTopAddButton() {
  const topBtn = document.querySelector(".add-task-button");
  if (!topBtn) return;
  topBtn.addEventListener("click", function () {
    goToAddTask("todo");
  });
}

function getColumnStatus(icon) {
  const col = icon.closest(".column");
  return col && col.dataset ? col.dataset.status : "todo";
}

function goToAddTask(status) {
  openAddTaskOverlay(status);
}

// ---------------- Add task overlay ----------------
function initAddTaskOverlay() {
  const backdrop = document.getElementById("addTaskOverlayBackdrop");
  if (!backdrop) return;

  const closeBtn = document.getElementById("addTaskOverlayClose");
  if (closeBtn) closeBtn.addEventListener("click", closeAddTaskOverlay);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeAddTaskOverlay();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!backdrop.hasAttribute("hidden")) closeAddTaskOverlay();
  });
}

function openAddTaskOverlay(status) {
  const backdrop = document.getElementById("addTaskOverlayBackdrop");
  if (!backdrop) return;
  backdrop.dataset.status = status || "todo";
  backdrop.hidden = false;
  updateBodyScrollLock();

  if (typeof resetAddTaskForm === "function") resetAddTaskForm();
  else if (typeof clearForm === "function") clearForm();

  const titleInput = document.getElementById("titel");
  if (titleInput) titleInput.focus();
}

function closeAddTaskOverlay() {
  const backdrop = document.getElementById("addTaskOverlayBackdrop");
  if (!backdrop) return;
  backdrop.hidden = true;
  updateBodyScrollLock();
  if (typeof clearForm === "function") clearForm();
}

// ---------------- Storage ----------------
function getTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Storage parse error:", e);
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadContacts() {
  try {
    const raw = localStorage.getItem(CONTACTS_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error("Contacts parse error:", e);
    return [];
  }
}

function buildContactsById(contacts) {
  const map = new Map();
  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i];
    if (c && c.id) map.set(String(c.id), c);
  }
  return map;
}

function resolveAssignedList(task) {
  let assignedArr = [];
  if (Array.isArray(task.assigned)) assignedArr = task.assigned;
  else if (task.assigned) assignedArr = [task.assigned];
  if (!assignedArr.length) return [];
  const contactsById = buildContactsById(loadContacts());
  const result = [];
  for (let i = 0; i < assignedArr.length; i++) {
    const value = assignedArr[i];
    const key = String(value || "");
    if (!key) continue;
    const contact = contactsById.get(key);
    result.push(contact && contact.name ? contact.name : key);
  }
  return result;
}

// ---------------- Render board ----------------
function renderBoardFromStorage() {
  clearAllCards();
  renderAllTasks();
  updateEmptyStates();
}

function clearAllCards() {
  const cardsLists = document.querySelectorAll(".column .cards");
  for (let i = 0; i < cardsLists.length; i++) {
    cardsLists[i].innerHTML = "";
  }
}

function renderAllTasks() {
  const tasks = getTasks();
  for (let i = 0; i < tasks.length; i++) {
    renderTaskCard(tasks[i]);
  }
}

function renderTaskCard(task) {
  const cardsContainer = getCardsContainer(task.status);
  if (!cardsContainer) return;
  const card = createCardElement(task);
  card.innerHTML = buildCardHtml(task);
  cardsContainer.appendChild(card);
}

function getCardsContainer(status) {
  const selector = '.column[data-status="' + status + '"] .cards';
  return document.querySelector(selector);
}

function createCardElement(task) {
  const card = document.createElement("div");
  card.className = "card";
  card.draggable = true;
  card.dataset.id = String(task.id);
  return card;
}

function buildCardHtml(task) {
  const labelText = getLabelText(task);
  const labelClass = getLabelClass(task);
  let html = "";
  html += '<div class="card-content">';
  html += '<div class="label ' + labelClass + '">' + labelText + "</div>";
  html += '<div class="title">' + escapeHtml(task.title || "") + "</div>";
  html += '<div class="desc">' + escapeHtml(task.description || "") + "</div>";
  html += "</div>";
  html += '<div class="card-bottom">';
  html += buildCardSubtaskProgressHtml(task);
  html += buildCardFooterHtml(task);
  html += "</div>";
  return html;
}

function getLabelText(task) {
  return task.category === "tech" ? "Technical Task" : "User Story";
}

function getLabelClass(task) {
  return task.category === "tech" ? "tech" : "user";
}

function buildCardSubtaskProgressHtml(task) {
  const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
  const total = subs.length;
  if (!total) return "";
  const done = countDoneSubtasks(subs);
  const percent = Math.round((done / total) * 100);
  let html = "";
  html += '<div class="card-progress">';
  html += '<div class="card-progress-bar">';
  html += '<div class="card-progress-fill" style="width:' + percent + '%"></div>';
  html += "</div>";
  html += '<div class="card-progress-text">' + done + "/" + total + "</div>";
  html += "</div>";
  return html;
}

function buildCardFooterHtml(task) {
  const avatars = buildAssignedAvatarsHtml(task);
  const prioIcon = getPriorityIcon(task);
  let html = "";
  html += '<div class="card-footer">';
  html += '<div class="card-contacts">' + avatars + "</div>";
  html += '<div class="card-priority">';
  if (prioIcon) {
    const prClass = getPriorityText(task);
    html +=
      '<img src="' +
      prioIcon +
      '" class="card-priority-icon ' +
      escapeHtml(prClass) +
      '" alt="Priority ' +
      escapeHtml(prClass) +
      '">';
  }
  html += "</div>";
  html += "</div>";
  return html;
}

function buildAssignedAvatarsHtml(task) {
  const list = getAssignedListForCard(task);
  if (!list.length) return "";
  let html = "";
  for (let i = 0; i < list.length; i++) {
    const name = String(list[i]);
    const initials = getInitials(name);
    const color = getAvatarColor(initials);
    html +=
      '<span class="card-avatar" style="background:' +
      color +
      '">' +
      escapeHtml(initials) +
      "</span>";
  }
  return html;
}

function getAssignedListForCard(task) {
  return resolveAssignedList(task);
}

function countDoneSubtasks(subs) {
  let done = 0;
  for (let i = 0; i < subs.length; i++) {
    if (subs[i] && subs[i].done) done += 1;
  }
  return done;
}

function getPriorityText(task) {
  return String(task.priority || task.prio || "").toLowerCase();
}

function getPriorityIcon(task) {
  const pr = getPriorityText(task);
  if (pr === "urgent") return "../assets/icons/urgent.svg";
  if (pr === "medium") return "../assets/icons/medium.png";
  if (pr === "low") return "../assets/icons/low.svg";
  return "";
}

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
  bindOverlayCancel(els);
  bindOverlayEditForm(els);
  initOverlayEditWidgets();
  bindOverlayOpenByCard();
}

function getOverlayElements() {
  const overlay = document.querySelector(".task-overlay");
  const backdrop = document.getElementById("taskOverlayBackdrop");
  const top = document.querySelector(".task-overlay-top");
  const closeBtn = document.getElementById("taskOverlayClose");
  const delBtn = document.getElementById("taskOverlayDelete");
  const editBtn = document.getElementById("taskOverlayEdit");
  const saveBtn = document.getElementById("taskOverlaySave");
  const cancelBtn = document.getElementById("taskOverlayCancel");
  const view = document.getElementById("taskOverlayView");
  const editForm = document.getElementById("taskOverlayEditForm");
  if (!backdrop || !closeBtn) {
    console.warn("Overlay elements not found (taskOverlayBackdrop/taskOverlayClose).");
    return null;
  }
  return {
    overlay: overlay,
    backdrop: backdrop,
    top: top,
    closeBtn: closeBtn,
    delBtn: delBtn,
    editBtn: editBtn,
    saveBtn: saveBtn,
    cancelBtn: cancelBtn,
    view: view,
    editForm: editForm,
  };
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

function bindOverlayCancel(els) {
  if (!els.cancelBtn) return;
  els.cancelBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    exitOverlayEditMode(els);
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
  showOverlay();
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
  const pr = String(task.priority || task.prio || "medium").toLowerCase();
  prioEl.textContent = "";
  prioEl.classList.remove("urgent", "medium", "low");
  prioEl.classList.add(pr);

  const text = document.createElement("span");
  text.textContent = capitalize(pr);
  prioEl.appendChild(text);

  const icon = getPriorityIcon(task);
  if (icon) {
    const img = document.createElement("img");
    img.src = icon;
    img.alt = "Priority " + pr;
    img.className = "task-overlay-prio-icon";
    prioEl.appendChild(img);
  }
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
  return resolveAssignedList(task);
}

function createPersonRow(name, index) {
  const row = document.createElement("div");
  row.className = "task-overlay-person";
  row.appendChild(createPersonBadge(name, index));
  row.appendChild(createPersonText(name));
  return row;
}

function createPersonBadge(name, index) {
  const badge = document.createElement("div");
  badge.className = "task-overlay-badge";
  const colors = ["#00BEE8", "#6E52FF", "#FF7A00"];
  badge.style.background = colors[index % 3];
  badge.textContent = getInitials(String(name));
  return badge;
}

function createPersonText(name) {
  const text = document.createElement("div");
  text.textContent = String(name);
  return text;
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
  const card = document.querySelector('.card[data-id="' + task.id + '"]');
  if (!card) return;
  const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
  const total = subs.length;
  const existing = card.querySelector(".card-progress");
  if (!total) {
    if (existing) existing.remove();
    return;
  }
  const done = countDoneSubtasks(subs);
  const percent = Math.round((done / total) * 100);
  let progress = existing;
  if (!progress) {
    const bottom = card.querySelector(".card-bottom");
    if (!bottom) return;
    progress = document.createElement("div");
    progress.className = "card-progress";
    progress.innerHTML =
      '<div class="card-progress-bar"><div class="card-progress-fill"></div></div>' +
      '<div class="card-progress-text"></div>';
    bottom.insertBefore(progress, bottom.firstChild);
  }
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
  if (els.cancelBtn) els.cancelBtn.hidden = !editing;
}

// ---------------- Delete confirm ----------------
function initDeleteConfirm() {
  const els = getDeleteConfirmEls();
  if (!els) return;
  bindDeleteConfirmOk(els);
  bindDeleteConfirmCancel(els);
  bindDeleteConfirmBackdrop(els);
  bindDeleteConfirmEsc(els);
}

function getDeleteConfirmEls() {
  const backdrop = document.getElementById("deleteConfirmBackdrop");
  const okBtn = document.getElementById("deleteConfirmOk");
  const cancelBtn = document.getElementById("deleteConfirmCancel");
  const textEl = document.getElementById("deleteConfirmText");
  if (!backdrop || !okBtn || !cancelBtn || !textEl) {
    console.warn("Delete confirm elements not found.");
    return null;
  }
  return { backdrop: backdrop, okBtn: okBtn, cancelBtn: cancelBtn, textEl: textEl };
}

function bindDeleteConfirmOk(els) {
  els.okBtn.addEventListener("click", function () {
    handleDeleteConfirmOk();
  });
}

function bindDeleteConfirmCancel(els) {
  els.cancelBtn.addEventListener("click", function () {
    handleDeleteConfirmCancel();
  });
}

function bindDeleteConfirmBackdrop(els) {
  els.backdrop.addEventListener("click", function (e) {
    if (e.target === els.backdrop) closeDeleteConfirm();
  });
}

function bindDeleteConfirmEsc(els) {
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !els.backdrop.hidden) closeDeleteConfirm();
  });
}

function openDeleteConfirm(id) {
  const task = findTaskById(id);
  if (!task) return;
  pendingDeleteId = String(id);
  setDeleteConfirmText(task);
  showDeleteConfirm();
}

function setDeleteConfirmText(task) {
  const el = document.getElementById("deleteConfirmText");
  if (!el) return;
  el.textContent = 'Delete task "' + task.title + '"?';
}

function showDeleteConfirm() {
  const backdrop = document.getElementById("deleteConfirmBackdrop");
  if (!backdrop) return;
  backdrop.hidden = false;
}

function closeDeleteConfirm() {
  const backdrop = document.getElementById("deleteConfirmBackdrop");
  if (!backdrop) return;
  backdrop.hidden = true;
  pendingDeleteId = null;
}

function handleDeleteConfirmOk() {
  if (!pendingDeleteId) return closeDeleteConfirm();
  removeTaskById(pendingDeleteId);
  closeDeleteConfirm();
  closeTaskOverlay();
  renderBoardFromStorage();
}

function handleDeleteConfirmCancel() {
  closeDeleteConfirm();
}

// ---------------- Delete / Edit ----------------
function deleteTask(id) {
  openDeleteConfirm(id);
}

function removeTaskById(id) {
  const tasks = getTasks();
  const next = [];
  for (let i = 0; i < tasks.length; i++) {
    if (String(tasks[i].id) !== String(id)) next.push(tasks[i]);
  }
  saveTasks(next);
}

function findTaskIndexById(id, tasks) {
  for (let i = 0; i < tasks.length; i++) {
    if (String(tasks[i].id) === String(id)) return i;
  }
  return -1;
}

function fillOverlayEditForm(task) {
  setInputValue("taskEditTitle", task.title || "");
  setInputValue("taskEditDesc", task.description || "");
  setInputValue("taskEditDue", task.dueDate || task.due || "");
  const pr = String(task.priority || task.prio || "medium").toLowerCase();
  setOverlayPriorityButtons(pr);
  setOverlayAssignedFromTask(task);
  setOverlaySubtasksFromTask(task);
}

function saveOverlayEdits(id, els) {
  const tasks = getTasks();
  const idx = findTaskIndexById(id, tasks);
  if (idx === -1) return;
  const values = readOverlayEditForm();
  if (!values) return;
  tasks[idx] = buildEditedTaskFromForm(tasks[idx], values);
  saveTasks(tasks);
  renderBoardFromStorage();
  exitOverlayEditMode(els);
  openTaskOverlay(id);
}

function readOverlayEditForm() {
  const title = getInputValue("taskEditTitle").trim();
  if (!title) {
    alert("Title is required");
    return null;
  }
  return {
    title: title,
    description: getInputValue("taskEditDesc").trim(),
    dueDate: getInputValue("taskEditDue"),
    priority: overlaySelectedPriority || "medium",
    assigned: Array.from(overlaySelectedContacts),
    subtasks: overlayPendingSubtasks.map((s) => ({ title: s.title, done: !!s.done })),
  };
}

function buildEditedTaskFromForm(t, values) {
  let assignedValue = "";
  if (values.assigned.length === 1) assignedValue = values.assigned[0];
  if (values.assigned.length > 1) assignedValue = values.assigned;

  return {
    title: values.title,
    description: values.description,
    id: t.id,
    dueDate: values.dueDate,
    category: t.category,
    priority: values.priority,
    status: t.status,
    subtasks: values.subtasks,
    assigned: assignedValue,
  };
}

// ---------------- Overlay edit widgets ----------------
function initOverlayEditWidgets() {
  initOverlayPriorityButtons();
  initOverlayAssignedDropdown();
  initOverlaySubtasks();
}

function initOverlayPriorityButtons() {
  const wrap = document.getElementById("taskEditPriority");
  if (!wrap) return;
  const buttons = wrap.querySelectorAll(".priority-btn");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function () {
      setOverlayPriorityButtons(buttons[i].dataset.value || "medium");
    });
  }
  setOverlayPriorityButtons(overlaySelectedPriority || "medium");
}

function setOverlayPriorityButtons(value) {
  const wrap = document.getElementById("taskEditPriority");
  if (!wrap) return;
  const buttons = wrap.querySelectorAll(".priority-btn");
  overlaySelectedPriority = String(value || "medium").toLowerCase();
  for (let i = 0; i < buttons.length; i++) {
    const btnValue = String(buttons[i].dataset.value || "").toLowerCase();
    if (btnValue === overlaySelectedPriority) buttons[i].classList.add("--selected");
    else buttons[i].classList.remove("--selected");
  }
}

function initOverlayAssignedDropdown() {
  const input = document.getElementById("taskEditAssignedInput");
  const dropdown = document.getElementById("taskEditAssignedDropdown");
  const arrow = document.getElementById("taskEditDropdownArrow");
  if (!input || !dropdown || !arrow) return;

  input.addEventListener("click", function () {
    dropdown.classList.toggle("hidden");
    arrow.classList.toggle("open");
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".multi-select")) {
      dropdown.classList.add("hidden");
      arrow.classList.remove("open");
    }
  });
}

function populateOverlayAssignedContacts() {
  const dropdown = document.getElementById("taskEditAssignedDropdown");
  if (!dropdown) return;
  dropdown.innerHTML = "";
  const contacts = loadContacts();
  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i];
    if (!c || !c.id || !c.name) continue;
    const row = document.createElement("div");
    row.className = "contact-option";
    row.innerHTML =
      '<div class="contact-avatar">' +
      getInitials(c.name) +
      '</div><span>' +
      c.name +
      '</span><input type="checkbox" ' +
      (overlaySelectedContacts.has(String(c.id)) ? "checked" : "") +
      ">";
    row.onclick = function () {
      toggleOverlayContact(c.id);
    };
    dropdown.appendChild(row);
  }
}

function toggleOverlayContact(id) {
  const key = String(id);
  overlaySelectedContacts.has(key)
    ? overlaySelectedContacts.delete(key)
    : overlaySelectedContacts.add(key);
  populateOverlayAssignedContacts();
  renderOverlaySelectedContacts();
}

function renderOverlaySelectedContacts() {
  const text = document.getElementById("taskEditAssignedText");
  const avatarsWrap = document.getElementById("taskEditAssignedAvatars");
  if (!text) return;
  text.textContent = "Select contacts to assign";
  if (!avatarsWrap) return;
  avatarsWrap.innerHTML = "";
  if (!overlaySelectedContacts.size) return;
  const contacts = loadContacts();
  avatarsWrap.innerHTML = Array.from(overlaySelectedContacts)
    .map(function (id) {
      const c = contacts.find(function (x) {
        return String(x.id) === String(id);
      });
      return c ? '<span class="contact-avatar">' + getInitials(c.name) + "</span>" : "";
    })
    .join("");
}

function setOverlayAssignedFromTask(task) {
  overlaySelectedContacts.clear();
  const assignedArr = Array.isArray(task.assigned)
    ? task.assigned
    : task.assigned
    ? [task.assigned]
    : [];
  const contacts = loadContacts();
  const contactsById = buildContactsById(contacts);
  const byName = new Map();
  for (let i = 0; i < contacts.length; i++) {
    if (contacts[i] && contacts[i].name && contacts[i].id) {
      byName.set(String(contacts[i].name).toLowerCase(), String(contacts[i].id));
    }
  }
  for (let i = 0; i < assignedArr.length; i++) {
    const key = String(assignedArr[i] || "");
    if (!key) continue;
    if (contactsById.has(key)) overlaySelectedContacts.add(key);
    else {
      const matchId = byName.get(key.toLowerCase());
      if (matchId) overlaySelectedContacts.add(matchId);
    }
  }
  populateOverlayAssignedContacts();
  renderOverlaySelectedContacts();
}

function initOverlaySubtasks() {
  const input = document.getElementById("taskEditSubtaskInput");
  const btn = document.getElementById("taskEditAddSubtaskBtn");
  const list = document.getElementById("taskEditSubtasksList");
  if (btn && input) {
    btn.onclick = addOverlaySubtasksFromInput;
    input.onkeydown = function (e) {
      if (e.key === "Enter") addOverlaySubtasksFromInput();
    };
  }
  if (list) {
    list.onclick = function (e) {
      const remove = e.target.closest(".subtasks-remove");
      if (!remove) return;
      overlayPendingSubtasks.splice(remove.dataset.index, 1);
      renderOverlaySubtasksList();
    };
  }
}

function addOverlaySubtasksFromInput() {
  const input = document.getElementById("taskEditSubtaskInput");
  if (!input || !input.value.trim()) return;
  input.value
    .split(/[,\n;]+/)
    .map(function (t) {
      return t.trim();
    })
    .forEach(function (title) {
      if (!title) return;
      if (overlayPendingSubtasks.length < 3) {
        overlayPendingSubtasks.push({ title: title, done: false });
      }
    });
  input.value = "";
  renderOverlaySubtasksList();
}

function renderOverlaySubtasksList() {
  const list = document.getElementById("taskEditSubtasksList");
  if (!list) return;
  list.innerHTML = "";
  for (let i = 0; i < overlayPendingSubtasks.length; i++) {
    list.innerHTML +=
      '<li class="subtasks-item"><span>' +
      overlayPendingSubtasks[i].title +
      '</span><button class="subtasks-remove" data-index="' +
      i +
      '">x</button></li>';
  }
}

function setOverlaySubtasksFromTask(task) {
  overlayPendingSubtasks = Array.isArray(task.subtasks)
    ? task.subtasks.map(function (s) {
        return { title: s.title, done: !!s.done };
      })
    : [];
  renderOverlaySubtasksList();
}

// ---------------- Drag & Drop (persist status) ----------------
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
