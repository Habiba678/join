/** @param {BoardTask} task Task whose subtasks should be rendered. @returns {void} */
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

/** @param {HTMLElement} wrap Subtask container element. @returns {void} */
function showNoSubtasks(wrap) {
  wrap.textContent = "No subtasks";
}

/** @param {{title?: string, done?: boolean}} subtask Subtask payload. @param {number} index Subtask index. @param {string|number} taskId Parent task ID. @returns {HTMLDivElement} Subtask row element. */
function createSubtaskRow(subtask, index, taskId) {
  const row = document.createElement("div");
  row.className = "task-overlay-subtask";
  row.appendChild(createSubtaskCheckbox(subtask, index, taskId));
  row.appendChild(createSubtaskLabel(subtask));
  return row;
}

/** @param {{title?: string, done?: boolean}} subtask Subtask payload. @param {number} index Subtask index. @param {string|number} taskId Parent task ID. @returns {HTMLInputElement} Checkbox element. */
function createSubtaskCheckbox(subtask, index, taskId) {
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = !!subtask.done;
  box.addEventListener("change", function () {
    updateSubtaskDone(taskId, index, box.checked);
  });
  return box;
}

/** @param {{title?: string}} subtask Subtask payload. @returns {HTMLSpanElement} Subtask label element. */
function createSubtaskLabel(subtask) {
  const label = document.createElement("span");
  label.textContent = subtask.title || "";
  return label;
}

/** @param {string|number} taskId Parent task ID. @param {number} subIndex Subtask index. @param {boolean} done Next completion state. @returns {void} */
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

/** @param {BoardTask} task Updated task whose card progress should be refreshed. @returns {void} */
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

/** @param {BoardTask} task Task whose priority should be normalized. @returns {string} Lowercase priority value. */
function getTaskPriority(task) {
  return String(task.priority || task.prio || "medium").toLowerCase();
}

/** @param {HTMLElement} prioEl Priority container element. @param {string} pr Normalized priority value. @returns {void} */
function resetOverlayPriorityEl(prioEl, pr) {
  prioEl.textContent = "";
  prioEl.classList.remove("urgent", "medium", "low");
  prioEl.classList.add(pr);
}

/** @param {HTMLElement} prioEl Priority container element. @param {string} pr Normalized priority value. @returns {void} */
function appendOverlayPriorityText(prioEl, pr) {
  const text = document.createElement("span");
  text.textContent = capitalize(pr);
  prioEl.appendChild(text);
}

/** @param {HTMLElement} prioEl Priority container element. @param {BoardTask} task Task to derive the icon from. @param {string} pr Normalized priority value. @returns {void} */
function appendOverlayPriorityIcon(prioEl, task, pr) {
  const icon = getPriorityIcon(task);
  if (!icon) return;
  const img = document.createElement("img");
  img.src = icon;
  img.alt = "Priority " + pr;
  img.className = "task-overlay-prio-icon";
  prioEl.appendChild(img);
}

/** @param {string|number} id Task ID to match. @returns {HTMLElement|null} Matching board card element. */
function getCardByTaskId(id) {
  return document.querySelector('.card[data-id="' + id + '"]');
}

/** @param {Element|null} existing Existing progress element. @returns {void} */
function removeCardProgress(existing) {
  if (existing) existing.remove();
}

/** @param {HTMLElement} card Board card element. @param {Element|null} existing Existing progress element. @returns {HTMLElement|null} Progress element to update. */
function ensureCardProgress(card, existing) {
  if (existing) return existing;
  const bottom = card.querySelector(".card-bottom");
  if (!bottom) return null;
  const progress = buildCardProgressElement();
  bottom.insertBefore(progress, bottom.firstChild);
  return progress;
}

/** @returns {HTMLDivElement} Card progress wrapper element. */
function buildCardProgressElement() {
  const progress = document.createElement("div");
  progress.className = "card-progress";
  progress.innerHTML =
    '<div class="card-progress-bar"><div class="card-progress-fill"></div></div>' +
    '<div class="card-progress-text"></div>';
  return progress;
}

/** @param {HTMLElement} progress Progress wrapper element. @param {number} done Completed subtasks. @param {number} total Total subtasks. @param {number} percent Completion percent. @returns {void} */
function updateCardProgressDisplay(progress, done, total, percent) {
  const fill = progress.querySelector(".card-progress-fill");
  const text = progress.querySelector(".card-progress-text");
  if (fill) fill.style.width = percent + "%";
  if (text) text.textContent = done + "/" + total;
}
