// ---------------- Delete confirm ----------------
/**
 * Initialize delete confirm.
 */
function initDeleteConfirm() {
  const els = getDeleteConfirmEls();
  if (!els) return;
  bindDeleteConfirmOk(els);
  bindDeleteConfirmCancel(els);
  bindDeleteConfirmBackdrop(els);
  bindDeleteConfirmEsc(els);
}

/**
 * Get delete confirm els.
 */
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

/**
 * Bind delete confirm ok.
 */
function bindDeleteConfirmOk(els) {
  els.okBtn.addEventListener("click", function () {
    handleDeleteConfirmOk();
  });
}

/**
 * Bind delete confirm cancel.
 */
function bindDeleteConfirmCancel(els) {
  els.cancelBtn.addEventListener("click", function () {
    handleDeleteConfirmCancel();
  });
}

/**
 * Bind delete confirm backdrop.
 */
function bindDeleteConfirmBackdrop(els) {
  els.backdrop.addEventListener("click", function (e) {
    if (e.target === els.backdrop) closeDeleteConfirm();
  });
}

/**
 * Bind delete confirm esc.
 */
function bindDeleteConfirmEsc(els) {
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !els.backdrop.hidden) closeDeleteConfirm();
  });
}

/**
 * Open delete confirm.
 */
function openDeleteConfirm(id) {
  const task = findTaskById(id);
  if (!task) return;
  pendingDeleteId = String(id);
  setDeleteConfirmText(task);
  showDeleteConfirm();
}

/**
 * Set delete confirm text.
 */
function setDeleteConfirmText(task) {
  const el = document.getElementById("deleteConfirmText");
  if (!el) return;
  el.textContent = 'Delete task "' + task.title + '"?';
}

/**
 * Show delete confirm.
 */
function showDeleteConfirm() {
  const backdrop = document.getElementById("deleteConfirmBackdrop");
  if (!backdrop) return;
  backdrop.hidden = false;
}

/**
 * Close delete confirm.
 */
function closeDeleteConfirm() {
  const backdrop = document.getElementById("deleteConfirmBackdrop");
  if (!backdrop) return;
  backdrop.hidden = true;
  pendingDeleteId = null;
}

/**
 * Handle delete confirm ok.
 */
function handleDeleteConfirmOk() {
  if (!pendingDeleteId) return closeDeleteConfirm();
  removeTaskById(pendingDeleteId);
  closeDeleteConfirm();
  closeTaskOverlay();
  renderBoardFromStorage();
}

/**
 * Handle delete confirm cancel.
 */
function handleDeleteConfirmCancel() {
  closeDeleteConfirm();
}

// ---------------- Delete / Edit ----------------
/**
 * Delete task.
 */
function deleteTask(id) {
  openDeleteConfirm(id);
}

/**
 * Remove task by id.
 */
function removeTaskById(id) {
  const tasks = getTasks();
  const next = [];
  for (let i = 0; i < tasks.length; i++) {
    if (String(tasks[i].id) !== String(id)) next.push(tasks[i]);
  }
  saveTasks(next);
}

/**
 * Find task index by id.
 */
function findTaskIndexById(id, tasks) {
  for (let i = 0; i < tasks.length; i++) {
    if (String(tasks[i].id) === String(id)) return i;
  }
  return -1;
}

/**
 * Fill overlay edit form.
 */
function fillOverlayEditForm(task) {
  setInputValue("taskEditTitle", task.title || "");
  setInputValue("taskEditDesc", task.description || "");
  setInputValue("taskEditDue", task.dueDate || task.due || "");
  const pr = String(task.priority || task.prio || "medium").toLowerCase();
  setOverlayPriorityButtons(pr);
  setOverlayAssignedFromTask(task);
  setOverlaySubtasksFromTask(task);
}

/**
 * Save overlay edits.
 */
async function saveOverlayEdits(id, els) {
  const ctx = buildOverlayEditContext(id);
  if (!ctx) return;
  applyOverlayEditValues(ctx);
  await saveTasks(ctx.tasks);
  exitOverlayEditModeSafe(els);
  refreshOverlayView(ctx.task);
  refreshBoardCards();
}

/**
 * Read overlay edit form.
 */
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

/**
 * Build edited task from form.
 */
function buildEditedTaskFromForm(t, values) {
  return {
    title: values.title,
    description: values.description,
    id: t.id,
    dueDate: values.dueDate,
    category: t.category,
    priority: values.priority,
    status: t.status,
    subtasks: values.subtasks,
    assigned: getAssignedValue(values.assigned),
  };
}

/**
 * Build overlay edit context.
 */
function buildOverlayEditContext(id) {
  const tasks = getTasks();
  const idx = findTaskIndexById(id, tasks);
  if (idx === -1) return null;
  const values = readOverlayEditForm();
  if (!values) return null;
  return { tasks: tasks, idx: idx, values: values, task: tasks[idx] };
}

/**
 * Apply overlay edit values.
 */
function applyOverlayEditValues(ctx) {
  ctx.tasks[ctx.idx] = buildEditedTaskFromForm(ctx.tasks[ctx.idx], ctx.values);
  ctx.task = ctx.tasks[ctx.idx];
}

/**
 * Exit overlay edit mode safe.
 */
function exitOverlayEditModeSafe(els) {
  try {
    exitOverlayEditMode(els);
  } catch (e) {
    /* ignore if els not provided */
  }
}

/**
 * Refresh overlay view.
 */
function refreshOverlayView(task) {
  if (typeof setOverlayCategory === "function") setOverlayCategory(task);
  if (typeof setOverlayTexts === "function") setOverlayTexts(task);
  if (typeof setOverlayPriority === "function") setOverlayPriority(task);
  if (typeof renderOverlayAssigned === "function") renderOverlayAssigned(task);
  if (typeof renderOverlaySubtasks === "function") renderOverlaySubtasks(task);
}

/**
 * Refresh board cards.
 */
function refreshBoardCards() {
  if (typeof renderBoardFromStorage === "function") renderBoardFromStorage();
}

/**
 * Get assigned value.
 */
function getAssignedValue(assigned) {
  if (assigned.length === 1) return assigned[0];
  if (assigned.length > 1) return assigned;
  return "";
}

// ---------------- Overlay edit widgets ----------------
/**
 * Initialize overlay edit widgets.
 */
function initOverlayEditWidgets() {
  initOverlayPriorityButtons();
  initOverlayAssignedDropdown();
  initOverlaySubtasks();
  setOverlayDueMin();
}

/**
 * Set overlay due min.
 */
function setOverlayDueMin() {
  const dateInput = document.getElementById("taskEditDue");
  if (!dateInput) return;
  const today = getLocalDateInputValue();
  dateInput.setAttribute("min", today);
}

/**
 * Returns today's date in local YYYY-MM-DD format for date inputs.
 * @param {Date} [date]
 */
/**
 * Get local date input value.
 */
function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Initialize overlay priority buttons.
 */
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

/**
 * Set overlay priority buttons.
 */
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

/**
 * Initialize overlay assigned dropdown.
 */
function initOverlayAssignedDropdown() {
  const els = getOverlayAssignedDropdownEls();
  if (!els) return;
  bindOverlayAssignedInput(els);
  bindOverlayAssignedArrow(els);
  bindOverlayAssignedOutside(els);
}

/**
 * Get overlay assigned dropdown els.
 */
function getOverlayAssignedDropdownEls() {
  const input = document.getElementById("taskEditAssignedInput");
  const dropdown = document.getElementById("taskEditAssignedDropdown");
  const arrow = document.getElementById("taskEditDropdownArrow");
  if (!input || !dropdown || !arrow) return null;
  return { input: input, dropdown: dropdown, arrow: arrow };
}

/**
 * Bind overlay assigned input.
 */
function bindOverlayAssignedInput(els) {
  els.input.addEventListener("click", function (e) {
    e.stopPropagation();
    openOverlayAssignedDropdown(els);
  });
}

/**
 * Bind overlay assigned arrow.
 */
function bindOverlayAssignedArrow(els) {
  els.arrow.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleOverlayAssignedDropdown(els);
  });
}

/**
 * Bind overlay assigned outside.
 */
function bindOverlayAssignedOutside(els) {
  document.addEventListener("click", function (e) {
    if (e.target.closest(".multi-select")) return;
    closeOverlayAssignedDropdown(els);
  });
}

/**
 * Toggle overlay assigned dropdown.
 */
function toggleOverlayAssignedDropdown(els) {
  const isHidden = els.dropdown.classList.contains("hidden");
  isHidden ? openOverlayAssignedDropdown(els) : closeOverlayAssignedDropdown(els);
}

/**
 * Open overlay assigned dropdown.
 */
function openOverlayAssignedDropdown(els) {
  els.dropdown.classList.remove("hidden");
  els.arrow.classList.add("open");
}

/**
 * Close overlay assigned dropdown.
 */
function closeOverlayAssignedDropdown(els) {
  els.dropdown.classList.add("hidden");
  els.arrow.classList.remove("open");
}

/**
 * Populate overlay assigned contacts.
 */
function populateOverlayAssignedContacts() {
  const dropdown = document.getElementById("taskEditAssignedDropdown");
  if (!dropdown) return;
  resetOverlayAssignedDropdown(dropdown);
  const contacts = loadContacts();
  for (let i = 0; i < contacts.length; i++) {
    appendOverlayContactRow(dropdown, contacts[i]);
  }
}

/**
 * Toggle overlay contact.
 */
function toggleOverlayContact(id) {
  const key = String(id);
  overlaySelectedContacts.has(key)
    ? overlaySelectedContacts.delete(key)
    : overlaySelectedContacts.add(key);
  updateOverlayAssignedCheckboxes();
  renderOverlaySelectedContacts();
}

/**
 * Updates the checked state of checkboxes in the overlay
 * contacts dropdown without rebuilding all rows.
 */
/**
 * Update overlay assigned checkboxes.
 */
function updateOverlayAssignedCheckboxes() {
  const dropdown = document.getElementById("taskEditAssignedDropdown");
  if (!dropdown) return;
  const rows = dropdown.querySelectorAll(".contact-option");
  rows.forEach(function (row) {
    const id = row.dataset.id;
    if (!id) return;
    const input = row.querySelector('input[type="checkbox"]');
    if (!input) return;
    input.checked = overlaySelectedContacts.has(String(id));
  });
}

/**
 * Render overlay selected contacts.
 */
function renderOverlaySelectedContacts() {
  const text = document.getElementById("taskEditAssignedText");
  const avatarsWrap = document.getElementById("taskEditAssignedAvatars");
  if (!text) return;
  if (!avatarsWrap) return;
  avatarsWrap.innerHTML = "";
  if (!overlaySelectedContacts.size) {
    setOverlayAssignedText(text);
    return;
  }
  const view = buildOverlaySelectedContactsView();
  avatarsWrap.innerHTML = view.avatarsHtml + view.moreHtml;
  setOverlayAssignedText(text);
}

/**
 * Set overlay assigned from task.
 */
function setOverlayAssignedFromTask(task) {
  overlaySelectedContacts.clear();
  const assignedArr = normalizeAssignedArray(task.assigned);
  const contacts = loadContacts();
  const contactsById = buildContactsById(contacts);
  const byName = buildContactsByNameMap(contacts);
  applyAssignedSelections(assignedArr, contactsById, byName);
  populateOverlayAssignedContacts();
  renderOverlaySelectedContacts();
}

/**
 * Reset overlay assigned dropdown.
 */
function resetOverlayAssignedDropdown(dropdown) {
  dropdown.innerHTML = "";
  const text = document.getElementById("taskEditAssignedText");
  if (text) setOverlayAssignedText(text);
}

/**
 * Append overlay contact row.
 */
function appendOverlayContactRow(dropdown, contact) {
  if (!contact || !contact.id || !contact.name) return;
  const row = buildOverlayContactRow(contact);
  dropdown.appendChild(row);
}

/**
 * Build overlay contact row.
 */
function buildOverlayContactRow(contact) {
  const row = document.createElement("div");
  row.className = "contact-option";
  row.dataset.id = String(contact.id);
  row.innerHTML = getOverlayContactRowHtml(contact);
  row.onclick = function (e) {
    e.stopPropagation();
    toggleOverlayContact(contact.id);
  };
  return row;
}

/**
 * Get overlay contact row html.
 */
function getOverlayContactRowHtml(contact) {
  const colorClass = getOverlayEditContactColorClass(contact);
  const checked = overlaySelectedContacts.has(String(contact.id)) ? "checked" : "";
  return (
    '<div class="contact-avatar ' +
    colorClass +
    '">' +
    getInitials(contact.name) +
    '</div><span>' +
    contact.name +
    '</span><input type="checkbox" ' +
    checked +
    ">"
  );
}

/**
 * Set overlay assigned text.
 */
function setOverlayAssignedText(textEl) {
  textEl.textContent = "Select contacts to assign";
}

/**
 * Build overlay selected contacts view.
 */
function buildOverlaySelectedContactsView() {
  const contacts = loadContacts();
  const selectedIds = Array.from(overlaySelectedContacts);
  const visible = selectedIds.slice(0, 8);
  const remaining = selectedIds.length - visible.length;
  return {
    avatarsHtml: buildOverlayAvatarsHtml(contacts, visible),
    moreHtml: buildOverlayMoreHtml(remaining),
  };
}

/**
 * Build overlay avatars html.
 */
function buildOverlayAvatarsHtml(contacts, ids) {
  return ids
    .map(function (id) {
      const c = contacts.find(function (x) {
        return String(x.id) === String(id);
      });
      if (!c) return "";
      const colorClass = getOverlayEditContactColorClass(c);
      return '<span class="contact-avatar ' + colorClass + '">' + getInitials(c.name) + "</span>";
    })
    .join("");
}

/**
 * Build overlay more html.
 */
function buildOverlayMoreHtml(remaining) {
  if (remaining <= 0) return "";
  return '<span class="contact-avatar contact-avatar-more">+' + remaining + "</span>";
}

/**
 * Normalize assigned array.
 */
function normalizeAssignedArray(assigned) {
  if (Array.isArray(assigned)) return assigned;
  if (assigned) return [assigned];
  return [];
}

/**
 * Build contacts by name map.
 */
function buildContactsByNameMap(contacts) {
  const byName = new Map();
  for (let i = 0; i < contacts.length; i++) {
    if (contacts[i] && contacts[i].name && contacts[i].id) {
      byName.set(String(contacts[i].name).toLowerCase(), String(contacts[i].id));
    }
  }
  return byName;
}

/**
 * Apply assigned selections.
 */
function applyAssignedSelections(assignedArr, contactsById, byName) {
  for (let i = 0; i < assignedArr.length; i++) {
    const key = String(assignedArr[i] || "");
    if (!key) continue;
    if (contactsById.has(key)) overlaySelectedContacts.add(key);
    else addAssignedByName(key, byName);
  }
}

/**
 * Add assigned by name.
 */
function addAssignedByName(key, byName) {
  const matchId = byName.get(key.toLowerCase());
  if (matchId) overlaySelectedContacts.add(matchId);
}

/**
 * Initialize overlay subtasks.
 */
function initOverlaySubtasks() {
  const els = getOverlaySubtaskEls();
  if (!els) return;
  bindOverlaySubtaskInput(els);
  bindOverlaySubtaskClear(els);
  bindOverlaySubtaskList(els);
  syncOverlaySubtaskButtons(els.input);
}

/**
 * Get overlay subtask els.
 */
function getOverlaySubtaskEls() {
  const input = document.getElementById("taskEditSubtaskInput");
  const btn = document.getElementById("taskEditAddSubtaskBtn");
  const clearBtn = document.getElementById("taskEditClearSubtaskBtn");
  const list = document.getElementById("taskEditSubtasksList");
  if (!input) return null;
  return { input: input, btn: btn, clearBtn: clearBtn, list: list };
}

/**
 * Bind overlay subtask input.
 */
function bindOverlaySubtaskInput(els) {
  if (els.btn) {
    els.btn.addEventListener("click", addOverlaySubtasksFromInput);
  }
  els.input.addEventListener("keydown", function (e) {
    handleOverlaySubtaskEnter(e);
  });
  els.input.addEventListener("input", function () {
    syncOverlaySubtaskButtons(els.input);
  });
}

/**
 * Handle overlay subtask enter.
 */
function handleOverlaySubtaskEnter(e) {
  if (e.key !== "Enter") return;
  e.preventDefault();
  addOverlaySubtasksFromInput();
}

/**
 * Bind overlay subtask clear.
 */
function bindOverlaySubtaskClear(els) {
  if (!els.clearBtn) return;
  els.clearBtn.addEventListener("click", function () {
    clearOverlaySubtaskInput(els.input);
  });
}

/**
 * Clear overlay subtask input.
 */
function clearOverlaySubtaskInput(input) {
  input.value = "";
  input.focus();
  syncOverlaySubtaskButtons(input);
}

/**
 * Sync overlay subtask buttons.
 */
function syncOverlaySubtaskButtons(input) {
  const wrap = input.closest(".subtasks-input");
  if (!wrap) return;
  const hasValue = !!input.value.trim();
  wrap.classList.toggle("is-empty", !hasValue);
}

/**
 * Bind overlay subtask list.
 */
function bindOverlaySubtaskList(els) {
  if (!els.list) return;
  els.list.addEventListener("click", function (e) {
    handleOverlaySubtaskListClick(e);
  });
}

/**
 * Handle overlay subtask list click.
 */
function handleOverlaySubtaskListClick(e) {
  const item = e.target.closest(".subtasks-item");
  if (!item) return;
  if (handleSubtaskRemove(e, item)) return;
  if (handleSubtaskEdit(e, item)) return;
  if (handleSubtaskSave(e, item)) return;
  handleSubtaskCancel(e);
}

/**
 * Handle subtask remove.
 */
function handleSubtaskRemove(e, item) {
  const remove = e.target.closest(".subtasks-remove");
  if (!remove) return false;
  const index = parseInt(remove.dataset.index, 10);
  if (!isNaN(index)) {
    overlayPendingSubtasks.splice(index, 1);
    renderOverlaySubtasksList();
  }
  return true;
}

/**
 * Handle subtask edit.
 */
function handleSubtaskEdit(e, item) {
  const edit = e.target.closest(".subtasks-edit");
  if (!edit) return false;
  const index = parseInt(edit.dataset.index, 10);
  if (isNaN(index) || !overlayPendingSubtasks[index]) return true;
  const currentTitle = overlayPendingSubtasks[index].title || "";
  startOverlayInlineSubtaskEdit(item, index, currentTitle);
  return true;
}

/**
 * Handle subtask save.
 */
function handleSubtaskSave(e, item) {
  const save = e.target.closest(".subtasks-save-edit");
  if (!save) return false;
  const index = parseInt(save.dataset.index, 10);
  if (isNaN(index) || !overlayPendingSubtasks[index]) return true;
  const input = item.querySelector(".subtasks-edit-input");
  if (!input) return true;
  const trimmed = input.value.trim();
  if (!trimmed) return renderOverlaySubtasksList(), true;
  overlayPendingSubtasks[index].title = trimmed;
  renderOverlaySubtasksList();
  return true;
}

/**
 * Handle subtask cancel.
 */
function handleSubtaskCancel(e) {
  const cancel = e.target.closest(".subtasks-cancel-edit");
  if (!cancel) return false;
  renderOverlaySubtasksList();
  return true;
}

/**
 * Add overlay subtasks from input.
 */
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
      overlayPendingSubtasks.push({ title: title, done: false });
    });
  input.value = "";
  renderOverlaySubtasksList();
}

/**
 * Render overlay subtasks list.
 */
function renderOverlaySubtasksList() {
  const list = document.getElementById("taskEditSubtasksList");
  if (!list) return;
  list.innerHTML = "";
  for (let i = 0; i < overlayPendingSubtasks.length; i++) {
    list.innerHTML +=
      '<li class="subtasks-item"><span>' +
      overlayPendingSubtasks[i].title +
      '</span><div class="subtasks-actions"><button class="subtasks-edit" data-index="' +
      i +
      '" ><img class="subtasks-icon" src="../assets/icons/edit-gray.svg" alt="Edit subtask"></button><span class="subtasks-separator"></span><button class="subtasks-remove" data-index="' +
      i +
      '"><img class="subtasks-icon"src="../assets/icons/delete.svg" alt="Remove subtask"></button></div></li > ';
  }
}

/**
 * Set overlay subtasks from task.
 */
function setOverlaySubtasksFromTask(task) {
  overlayPendingSubtasks = Array.isArray(task.subtasks)
    ? task.subtasks.map(function (s) {
        return { title: s.title, done: !!s.done };
      })
    : [];
  renderOverlaySubtasksList();
}

/**
 * Get overlay edit contact color class.
 */
function getOverlayEditContactColorClass(contact) {
  if (typeof getContactColorClass === "function") return getContactColorClass(contact);
  if (contact && contact.colorClass) return contact.colorClass;
  const seed = contact?.id || contact?.email || contact?.name || "";
  return "avatar-color-" + (overlayEditHashString(seed) % 12);
}

/**
 * Overlay edit hash string.
 */
function overlayEditHashString(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Switches an overlay subtask list item into inline edit mode
 * using an input field instead of a prompt.
 * @param {HTMLElement} item
 * @param {number} index
 * @param {string} title
 */
/**
 * Start overlay inline subtask edit.
 */
function startOverlayInlineSubtaskEdit(item, index, title) {
  if (!item) return;
  item.innerHTML = "";
  const input = createOverlaySubtaskEditInput(title);
  const actions = createOverlaySubtaskEditActions(index);
  item.appendChild(input);
  item.appendChild(actions);
  focusOverlaySubtaskEditInput(input);
}

/**
 * Create overlay subtask edit input.
 */
function createOverlaySubtaskEditInput(title) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "subtasks-edit-input";
  input.value = title || "";
  return input;
}

/**
 * Create overlay subtask edit actions.
 */
function createOverlaySubtaskEditActions(index) {
  const actions = document.createElement("div");
  actions.className = "subtasks-actions";
  actions.appendChild(createOverlaySubtaskSaveBtn(index));
  actions.appendChild(createOverlaySubtaskSeparator());
  actions.appendChild(createOverlaySubtaskCancelBtn(index));
  return actions;
}

/**
 * Create overlay subtask save btn.
 */
function createOverlaySubtaskSaveBtn(index) {
  const btn = document.createElement("button");
  btn.className = "subtasks-save-edit";
  btn.dataset.index = String(index);
  btn.innerHTML = '<img src="../assets/icons/check-black.svg" alt="Save subtask">';
  return btn;
}

/**
 * Create overlay subtask separator.
 */
function createOverlaySubtaskSeparator() {
  const sep = document.createElement("span");
  sep.className = "subtasks-separator";
  return sep;
}

/**
 * Create overlay subtask cancel btn.
 */
function createOverlaySubtaskCancelBtn(index) {
  const btn = document.createElement("button");
  btn.className = "subtasks-cancel-edit";
  btn.dataset.index = String(index);
  btn.innerHTML = '<img src="../assets/icons/iconoir_cancel.svg" alt="Cancel edit">';
  return btn;
}

/**
 * Focus overlay subtask edit input.
 */
function focusOverlaySubtaskEditInput(input) {
  input.focus();
  const len = input.value.length;
  input.setSelectionRange(len, len);
}

// ---------------- Drag & Drop (persist status) ----------------
