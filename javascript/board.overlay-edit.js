/** @typedef {{backdrop: HTMLElement, okBtn: HTMLElement, cancelBtn: HTMLElement, textEl: HTMLElement}} DeleteConfirmElements */
/** @typedef {{title: string, description: string, dueDate: string, priority: string, assigned: string[], subtasks: Array<{title:string, done:boolean}>}} OverlayEditValues */
/** @typedef {{tasks: BoardTask[], idx: number, values: OverlayEditValues, task: BoardTask}} OverlayEditContext */

// ---------------- Delete confirm ----------------
/** Initializes delete-confirm modal listeners. @returns {void} */
function initDeleteConfirm() {
  const els = getDeleteConfirmEls();
  if (!els) return;
  bindDeleteConfirmOk(els);
  bindDeleteConfirmCancel(els);
  bindDeleteConfirmBackdrop(els);
  bindDeleteConfirmEsc(els);
}

/** @returns {DeleteConfirmElements|null} Delete-confirm DOM references. */
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

/** @param {DeleteConfirmElements} els Delete-confirm elements. @returns {void} */
function bindDeleteConfirmOk(els) {
  els.okBtn.addEventListener("click", function () {
    handleDeleteConfirmOk();
  });
}

/** @param {DeleteConfirmElements} els Delete-confirm elements. @returns {void} */
function bindDeleteConfirmCancel(els) {
  els.cancelBtn.addEventListener("click", function () {
    handleDeleteConfirmCancel();
  });
}

/** @param {DeleteConfirmElements} els Delete-confirm elements. @returns {void} */
function bindDeleteConfirmBackdrop(els) {
  els.backdrop.addEventListener("click", function (e) {
    if (e.target === els.backdrop) closeDeleteConfirm();
  });
}

/** @param {DeleteConfirmElements} els Delete-confirm elements. @returns {void} */
function bindDeleteConfirmEsc(els) {
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !els.backdrop.hidden) closeDeleteConfirm();
  });
}

/** @param {string|number} id Task ID to confirm deletion for. @returns {void} */
function openDeleteConfirm(id) {
  const task = findTaskById(id);
  if (!task) return;
  pendingDeleteId = String(id);
  setDeleteConfirmText(task);
  showDeleteConfirm();
}

/** @param {BoardTask} task Task pending deletion. @returns {void} */
function setDeleteConfirmText(task) {
  const el = document.getElementById("deleteConfirmText");
  if (!el) return;
  el.textContent = 'Delete task "' + task.title + '"?';
}

/** Shows the delete-confirm modal. @returns {void} */
function showDeleteConfirm() {
  const backdrop = document.getElementById("deleteConfirmBackdrop");
  if (!backdrop) return;
  backdrop.hidden = false;
}

/** Hides the delete-confirm modal and clears pending state. @returns {void} */
function closeDeleteConfirm() {
  const backdrop = document.getElementById("deleteConfirmBackdrop");
  if (!backdrop) return;
  backdrop.hidden = true;
  pendingDeleteId = null;
}

/** Deletes the pending task after confirmation. @returns {void} */
function handleDeleteConfirmOk() {
  if (!pendingDeleteId) return closeDeleteConfirm();
  removeTaskById(pendingDeleteId);
  closeDeleteConfirm();
  closeTaskOverlay();
  renderBoardFromStorage();
}

/** Cancels delete confirmation. @returns {void} */
function handleDeleteConfirmCancel() {
  closeDeleteConfirm();
}

// ---------------- Delete / Edit ----------------
/** @param {string|number} id Task ID to delete. @returns {void} */
function deleteTask(id) {
  openDeleteConfirm(id);
}

/** @param {string|number} id Task ID to remove from storage. @returns {void} */
function removeTaskById(id) {
  const tasks = getTasks();
  const next = [];
  for (let i = 0; i < tasks.length; i++) {
    if (String(tasks[i].id) !== String(id)) next.push(tasks[i]);
  }
  saveTasks(next);
}

/** @param {string|number} id Task ID to find. @param {BoardTask[]} tasks Task list to search. @returns {number} Matching index or `-1`. */
function findTaskIndexById(id, tasks) {
  for (let i = 0; i < tasks.length; i++) {
    if (String(tasks[i].id) === String(id)) return i;
  }
  return -1;
}

/** @param {BoardTask} task Task whose values should populate the edit form. @returns {void} */
function fillOverlayEditForm(task) {
  setInputValue("taskEditTitle", task.title || "");
  setInputValue("taskEditDesc", task.description || "");
  setInputValue("taskEditDue", task.dueDate || task.due || "");
  const pr = String(task.priority || task.prio || "medium").toLowerCase();
  setOverlayPriorityButtons(pr);
  setOverlayAssignedFromTask(task);
  setOverlaySubtasksFromTask(task);
}

/** @param {string|number} id Edited task ID. @param {Object} els Overlay element bag from the view module. @returns {Promise<void>} */
async function saveOverlayEdits(id, els) {
  const ctx = buildOverlayEditContext(id);
  if (!ctx) return;
  applyOverlayEditValues(ctx);
  await saveTasks(ctx.tasks);
  exitOverlayEditModeSafe(els);
  refreshOverlayView(ctx.task);
  refreshBoardCards();
}

/** @returns {OverlayEditValues|null} Normalized form values or `null` when validation fails. */
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

/** @param {BoardTask} t Original task. @param {OverlayEditValues} values Normalized form values. @returns {BoardTask} Updated task payload. */
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

/** @param {string|number} id Edited task ID. @returns {OverlayEditContext|null} Update context or `null`. */
function buildOverlayEditContext(id) {
  const tasks = getTasks();
  const idx = findTaskIndexById(id, tasks);
  if (idx === -1) return null;
  const values = readOverlayEditForm();
  if (!values) return null;
  return { tasks: tasks, idx: idx, values: values, task: tasks[idx] };
}

/** @param {OverlayEditContext} ctx Mutable edit context. @returns {void} */
function applyOverlayEditValues(ctx) {
  ctx.tasks[ctx.idx] = buildEditedTaskFromForm(ctx.tasks[ctx.idx], ctx.values);
  ctx.task = ctx.tasks[ctx.idx];
}

/** @param {Object} els Overlay element bag from the view module. @returns {void} */
function exitOverlayEditModeSafe(els) {
  try {
    exitOverlayEditMode(els);
  } catch (e) {
    /* ignore if els not provided */
  }
}

/** @param {BoardTask} task Updated task to re-render in the overlay. @returns {void} */
function refreshOverlayView(task) {
  if (typeof setOverlayCategory === "function") setOverlayCategory(task);
  if (typeof setOverlayTexts === "function") setOverlayTexts(task);
  if (typeof setOverlayPriority === "function") setOverlayPriority(task);
  if (typeof renderOverlayAssigned === "function") renderOverlayAssigned(task);
  if (typeof renderOverlaySubtasks === "function") renderOverlaySubtasks(task);
}

/** Re-renders board cards after an edit. @returns {void} */
function refreshBoardCards() {
  if (typeof renderBoardFromStorage === "function") renderBoardFromStorage();
}

/** @param {string[]} assigned Selected contact IDs. @returns {string|string[]} Storage shape expected by the task payload. */
function getAssignedValue(assigned) {
  if (assigned.length === 1) return assigned[0];
  if (assigned.length > 1) return assigned;
  return "";
}
