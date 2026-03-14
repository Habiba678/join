/** @typedef {{input: HTMLInputElement, btn: HTMLElement|null, clearBtn: HTMLElement|null, list: HTMLElement|null}} OverlaySubtaskElements */

/** Initializes the overlay subtask input and list interactions. @returns {void} */
function initOverlaySubtasks() {
  const els = getOverlaySubtaskEls();
  if (!els) return;
  bindOverlaySubtaskInput(els);
  bindOverlaySubtaskClear(els);
  bindOverlaySubtaskList(els);
  syncOverlaySubtaskButtons(els.input);
}

/** @returns {OverlaySubtaskElements|null} Overlay subtask DOM references. */
function getOverlaySubtaskEls() {
  const input = document.getElementById("taskEditSubtaskInput");
  const btn = document.getElementById("taskEditAddSubtaskBtn");
  const clearBtn = document.getElementById("taskEditClearSubtaskBtn");
  const list = document.getElementById("taskEditSubtasksList");
  if (!input) return null;
  return { input: input, btn: btn, clearBtn: clearBtn, list: list };
}

/** @param {OverlaySubtaskElements} els Overlay subtask elements. @returns {void} */
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

/** @param {KeyboardEvent} e Keyboard event from the subtask input. @returns {void} */
function handleOverlaySubtaskEnter(e) {
  if (e.key !== "Enter") return;
  e.preventDefault();
  addOverlaySubtasksFromInput();
}

/** @param {OverlaySubtaskElements} els Overlay subtask elements. @returns {void} */
function bindOverlaySubtaskClear(els) {
  if (!els.clearBtn) return;
  els.clearBtn.addEventListener("click", function () {
    clearOverlaySubtaskInput(els.input);
  });
}

/** @param {HTMLInputElement} input Overlay subtask input. @returns {void} */
function clearOverlaySubtaskInput(input) {
  input.value = "";
  input.focus();
  syncOverlaySubtaskButtons(input);
}

/** @param {HTMLInputElement} input Overlay subtask input. @returns {void} */
function syncOverlaySubtaskButtons(input) {
  const wrap = input.closest(".subtasks-input");
  if (!wrap) return;
  const hasValue = !!input.value.trim();
  wrap.classList.toggle("is-empty", !hasValue);
}

/** @param {OverlaySubtaskElements} els Overlay subtask elements. @returns {void} */
function bindOverlaySubtaskList(els) {
  if (!els.list) return;
  els.list.addEventListener("click", function (e) {
    handleOverlaySubtaskListClick(e);
  });
}

/** @param {MouseEvent} e Click event from the subtask list. @returns {void} */
function handleOverlaySubtaskListClick(e) {
  const item = e.target.closest(".subtasks-item");
  if (!item) return;
  if (handleSubtaskRemove(e, item)) return;
  if (handleSubtaskEdit(e, item)) return;
  if (handleSubtaskSave(e, item)) return;
  handleSubtaskCancel(e);
}

/** @param {MouseEvent} e Click event from the subtask list. @param {HTMLElement} item Subtask row element. @returns {boolean} `true` when the action was handled. */
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

/** @param {MouseEvent} e Click event from the subtask list. @param {HTMLElement} item Subtask row element. @returns {boolean} `true` when the action was handled. */
function handleSubtaskEdit(e, item) {
  const edit = e.target.closest(".subtasks-edit");
  if (!edit) return false;
  const index = parseInt(edit.dataset.index, 10);
  if (isNaN(index) || !overlayPendingSubtasks[index]) return true;
  const currentTitle = overlayPendingSubtasks[index].title || "";
  startOverlayInlineSubtaskEdit(item, index, currentTitle);
  return true;
}

/** @param {MouseEvent} e Click event from the subtask list. @param {HTMLElement} item Subtask row element. @returns {boolean} `true` when the action was handled. */
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

/** @param {MouseEvent} e Click event from the subtask list. @returns {boolean} `true` when the action was handled. */
function handleSubtaskCancel(e) {
  const cancel = e.target.closest(".subtasks-cancel-edit");
  if (!cancel) return false;
  renderOverlaySubtasksList();
  return true;
}

/** Parses and appends new subtasks from the input value. @returns {void} */
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

/** Re-renders the editable subtask list. @returns {void} */
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

/** @param {BoardTask} task Task whose subtasks should populate the form. @returns {void} */
function setOverlaySubtasksFromTask(task) {
  overlayPendingSubtasks = Array.isArray(task.subtasks)
    ? task.subtasks.map(function (s) {
        return { title: s.title, done: !!s.done };
      })
    : [];
  renderOverlaySubtasksList();
}

/** @param {BoardContact|{id?:string,email?:string,name?:string,colorClass?:string}} contact Contact-like object. @returns {string} Avatar color class. */
function getOverlayEditContactColorClass(contact) {
  if (typeof getContactColorClass === "function") return getContactColorClass(contact);
  if (contact && contact.colorClass) return contact.colorClass;
  const seed = contact?.id || contact?.email || contact?.name || "";
  return "avatar-color-" + (overlayEditHashString(seed) % 12);
}

/** @param {string} str Seed string. @returns {number} Stable positive hash value. */
function overlayEditHashString(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
