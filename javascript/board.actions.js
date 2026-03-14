// ---------------- Redirects ----------------
/**
 * Initializes add-task entry points on the board page.
 * @returns {void}
 */
function initRedirects() {
  bindAddCardIcons();
  bindTopAddButton();
}

/**
 * Binds inline add-card icons inside each board column.
 * @returns {void}
 */
function bindAddCardIcons() {
  const icons = document.querySelectorAll(".add-card-icon");
  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    icon.addEventListener("click", function () {
      goToAddTask(getColumnStatus(icon));
    });
  }
}

/**
 * Binds the top-level add-task button in the board header.
 * @returns {void}
 */
function bindTopAddButton() {
  const topBtn = document.querySelector(".add-task-button");
  if (!topBtn) return;
  topBtn.addEventListener("click", function () {
    goToAddTask("todo");
  });
}

/**
 * Resolves the target board status for a column action button.
 * @param {Element} icon Column action icon.
 * @returns {string} Column status or `todo` as a fallback.
 */
function getColumnStatus(icon) {
  const col = icon.closest(".column");
  return col && col.dataset ? col.dataset.status : "todo";
}

/**
 * Opens the add-task overlay for a given board status.
 * @param {string} status Target board column status.
 * @returns {void}
 */
function goToAddTask(status) {
  openAddTaskOverlay(status);
}

// ---------------- Search ----------------
/**
 * Initializes board search interactions.
 * @returns {void}
 */
function initSearch() {
  const input = document.querySelector(".search-input");
  if (!input) return;
  const icon = document.querySelector(".search-icon");
  bindSearchInput(input);
  bindSearchEscape(input);
  bindSearchIcon(icon, input);
}

/**
 * Binds live filtering to the board search input.
 * @param {HTMLInputElement} input Search field element.
 * @returns {void}
 */
function bindSearchInput(input) {
  input.addEventListener("input", function () {
    applySearchQuery(input.value);
  });
}

/**
 * Binds `Escape` handling for the search input.
 * @param {HTMLInputElement} input Search field element.
 * @returns {void}
 */
function bindSearchEscape(input) {
  input.addEventListener("keydown", function (e) {
    handleSearchEscape(e, input);
  });
}

/**
 * Clears the search field when the user presses `Escape`.
 * @param {KeyboardEvent} e Keyboard event from the search field.
 * @param {HTMLInputElement} input Search field element.
 * @returns {void}
 */
function handleSearchEscape(e, input) {
  if (e.key !== "Escape") return;
  input.value = "";
  applySearchQuery("");
}

/**
 * Binds the clickable search icon next to the search input.
 * @param {Element|null} icon Search icon element.
 * @param {HTMLInputElement} input Search field element.
 * @returns {void}
 */
function bindSearchIcon(icon, input) {
  if (!icon) return;
  icon.addEventListener("click", function () {
    focusAndSearch(input);
  });
}

/**
 * Focuses the search field and reapplies the current query.
 * @param {HTMLInputElement} input Search field element.
 * @returns {void}
 */
function focusAndSearch(input) {
  input.focus();
  applySearchQuery(input.value);
}

/**
 * Normalizes and stores the active board search query.
 * @param {string} value Raw search input value.
 * @returns {void}
 */
function applySearchQuery(value) {
  activeSearchQuery = normalizeSearchQuery(value);
  window.activeSearchQuery = activeSearchQuery;
  renderBoardFromStorage();
}

/**
 * Normalizes a board search query for case-insensitive matching.
 * @param {string} value Raw search input value.
 * @returns {string} Normalized query string.
 */
function normalizeSearchQuery(value) {
  return String(value || "").trim().toLowerCase();
}

// ---------------- Add task overlay ----------------
/**
 * Initializes open and close handlers for the add-task overlay.
 * @returns {void}
 */
function initAddTaskOverlay() {
  const backdrop = document.getElementById("addTaskOverlayBackdrop");
  if (!backdrop) return;

  const closeBtn = document.getElementById("addTaskOverlayClose");
  if (closeBtn) closeBtn.addEventListener("click", closeAddTaskOverlay);

  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeAddTaskOverlay();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!backdrop.hasAttribute("hidden")) closeAddTaskOverlay();
  });
}

/**
 * Opens the add-task overlay and prepares the form for a target status.
 * @param {string} status Target board status for the new task.
 * @returns {void}
 */
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

/**
 * Closes the add-task overlay and clears the form state.
 * @returns {void}
 */
function closeAddTaskOverlay() {
  const backdrop = document.getElementById("addTaskOverlayBackdrop");
  if (!backdrop) return;
  backdrop.hidden = true;
  updateBodyScrollLock();
  if (typeof clearForm === "function") clearForm();
}
