/**
 * Initializes drag-and-drop behaviour for desktop and touch devices.
 * @returns {void}
 */
function initDragAndDrop() {
  bindDragStart();
  bindDragEnd();
  bindDropZones();
  bindTouchDrag();
}

/**
 * Registers the global drag start handler for board cards.
 * @returns {void}
 */
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

/**
 * Registers the global drag end handler for board cards.
 * @returns {void}
 */
function bindDragEnd() {
  document.addEventListener("dragend", function (e) {
    const card = e.target.closest(".card");
    if (card) card.classList.remove("dragging");
    isDragging = false;
    clearDragOverClasses();
  });
}

/**
 * Removes drag highlight classes from all board columns.
 * @returns {void}
 */
function clearDragOverClasses() {
  const columns = document.querySelectorAll(".column");
  for (let i = 0; i < columns.length; i++) {
    columns[i].classList.remove("drag-over");
  }
}

/**
 * Attaches drag/drop listeners to every column card container.
 * @returns {void}
 */
function bindDropZones() {
  const zones = document.querySelectorAll(".column .cards");
  for (let i = 0; i < zones.length; i++) {
    attachZoneEvents(zones[i]);
  }
}

/**
 * Wires all drop-zone event handlers to one column card container.
 * @param {Element} zone Drop target container inside a board column.
 * @returns {void}
 */
function attachZoneEvents(zone) {
  addDragOverHandler(zone);
  addDragLeaveHandler(zone);
  addDropHandler(zone);
}

/**
 * Adds the `dragover` handler that enables dropping and highlights the column.
 * @param {Element} zone Drop target container inside a board column.
 * @returns {void}
 */
function addDragOverHandler(zone) {
  zone.addEventListener("dragover", function (e) {
    e.preventDefault();
    const col = zone.closest(".column");
    if (col) col.classList.add("drag-over");
    e.dataTransfer.dropEffect = "move";
  });
}

/**
 * Adds the `dragleave` handler that removes column highlighting.
 * @param {Element} zone Drop target container inside a board column.
 * @returns {void}
 */
function addDragLeaveHandler(zone) {
  zone.addEventListener("dragleave", function () {
    const col = zone.closest(".column");
    if (col) col.classList.remove("drag-over");
  });
}

/**
 * Adds the `drop` handler for one column card container.
 * @param {Element} zone Drop target container inside a board column.
 * @returns {void}
 */
function addDropHandler(zone) {
  zone.addEventListener("drop", function (e) {
    handleDrop(zone, e);
  });
}

/**
 * Moves a dragged card into the target zone and persists its new status.
 * @param {Element} zone Drop target container inside a board column.
 * @param {DragEvent} e Native drop event.
 * @returns {void}
 */
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

/**
 * Completes a touch drag by moving the card into the target zone.
 * @param {Element} zone Drop target container inside a board column.
 * @param {HTMLElement|null} card Card element being moved.
 * @param {string|null} id Task identifier associated with the dragged card.
 * @returns {void}
 */
function handleTouchDrop(zone, card, id) {
  const col = zone.closest(".column");
  if (col) col.classList.remove("drag-over");
  if (!card || !id) return;
  zone.appendChild(card);
  updateStatusAfterDrop(col, id);
  updateEmptyStates();
}

/**
 * Resolves the currently dragged card element.
 * @param {string} [id] Task ID from the drag data transfer payload.
 * @returns {HTMLElement|null} Matching card element, if found.
 */
function getDraggedCard(id) {
  if (id) {
    return document.querySelector('.card[data-id="' + CSS.escape(String(id)) + '"]');
  }
  return document.querySelector(".card.dragging");
}

/**
 * Reads the destination column status and persists it for the dropped task.
 * @param {Element|null} col Column element that received the card.
 * @param {string} id Task identifier to update.
 * @returns {void}
 */
function updateStatusAfterDrop(col, id) {
  const newStatus = col && col.dataset ? col.dataset.status : null;
  if (newStatus) updateTaskStatus(id, newStatus);
}

/**
 * Updates the task status in storage after a drag-and-drop action.
 * @param {string} id Task identifier to update.
 * @param {string} status New board status for the task.
 * @returns {void}
 */
function updateTaskStatus(id, status) {
  const tasks = getTasks();
  const idx = findTaskIndexById(id, tasks);
  if (idx === -1) return;
  tasks[idx].status = status;
  saveTasks(tasks);
}

/**
 * Refreshes empty placeholders for all board columns.
 * @returns {void}
 */
function updateEmptyStates() {
  const columns = document.querySelectorAll(".column");
  for (let i = 0; i < columns.length; i++) {
    setEmptyStateForColumn(columns[i]);
  }
}

/**
 * Shows or hides the empty placeholder for one board column.
 * @param {Element} col Board column element.
 * @returns {void}
 */
function setEmptyStateForColumn(col) {
  const cards = col.querySelector(".cards");
  const empty = col.querySelector(".empty");
  if (!cards || !empty) return;
  empty.style.display = cards.children.length ? "none" : "block";
}
