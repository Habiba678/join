/** @param {HTMLElement} item Editable subtask row. @param {number} index Subtask index. @param {string} title Existing subtask title. @returns {void} */
function startOverlayInlineSubtaskEdit(item, index, title) {
  if (!item) return;
  item.innerHTML = "";
  const input = createOverlaySubtaskEditInput(title);
  const actions = createOverlaySubtaskEditActions(index);
  item.appendChild(input);
  item.appendChild(actions);
  focusOverlaySubtaskEditInput(input);
}

/** @param {string} title Existing subtask title. @returns {HTMLInputElement} Inline edit input. */
function createOverlaySubtaskEditInput(title) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "subtasks-edit-input";
  input.value = title || "";
  return input;
}

/** @param {number} index Edited subtask index. @returns {HTMLDivElement} Inline action container. */
function createOverlaySubtaskEditActions(index) {
  const actions = document.createElement("div");
  actions.className = "subtasks-actions";
  actions.appendChild(createOverlaySubtaskSaveBtn(index));
  actions.appendChild(createOverlaySubtaskSeparator());
  actions.appendChild(createOverlaySubtaskCancelBtn(index));
  return actions;
}

/** @param {number} index Edited subtask index. @returns {HTMLButtonElement} Save button element. */
function createOverlaySubtaskSaveBtn(index) {
  const btn = document.createElement("button");
  btn.className = "subtasks-save-edit";
  btn.dataset.index = String(index);
  btn.innerHTML = '<img src="../assets/icons/check-black.svg" alt="Save subtask">';
  return btn;
}

/** @returns {HTMLSpanElement} Visual separator element. */
function createOverlaySubtaskSeparator() {
  const sep = document.createElement("span");
  sep.className = "subtasks-separator";
  return sep;
}

/** @param {number} index Edited subtask index. @returns {HTMLButtonElement} Cancel button element. */
function createOverlaySubtaskCancelBtn(index) {
  const btn = document.createElement("button");
  btn.className = "subtasks-cancel-edit";
  btn.dataset.index = String(index);
  btn.innerHTML = '<img src="../assets/icons/iconoir_cancel.svg" alt="Cancel edit">';
  return btn;
}

/** @param {HTMLInputElement} input Inline edit input. @returns {void} */
function focusOverlaySubtaskEditInput(input) {
  input.focus();
  const len = input.value.length;
  input.setSelectionRange(len, len);
}
