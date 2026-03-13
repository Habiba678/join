// ================== ADD TASK → SAVE TO STORAGE ==================

/**
 * Currently selected priority value.
 * @type {string|null}
 */
let selectedPriority = null;

/**
 * Temporary list of subtasks before the task is saved.
 * @type {{title:string, done:boolean}[]}
 */
let pendingSubtasks = [];

/**
 * Stores selected contact IDs.
 * @type {Set<string>}
 */
const selectedContacts = new Set();
/**
 * Cached contacts list for assigned UI.
 * @type {Array}
 */
let cachedContacts = [];

// ------------------ INIT ------------------

/**
 * Initializes the add task page once the DOM is loaded.
 * Sets up UI, listeners and loads contacts.
 */
document.addEventListener("DOMContentLoaded", initAddTaskPage);

/**
 * Initialize add task page.
 */
function initAddTaskPage() {
  getCokkieCheck();
  initAddTaskUi();
  bindAddTaskButtons();
  setAddTaskDateMin();
}

/**
 * Initialize add task UI.
 */
function initAddTaskUi() {
  populateAssignedContacts();
  initPriorityButtons();
  initSubtasks();
  initAssignedDropdown();
  initCategoryDropdown();
  initValidationModal();
}

/**
 * Bind add task buttons.
 */
function bindAddTaskButtons() {
  const root = getAddTaskRoot();
  const createBtn = root.querySelector("#createTaskBtn");
  const clearBtn = root.querySelector(".primary-btn.--primary-btn-cancel");
  if (createBtn) createBtn.addEventListener("click", createTask);
  if (clearBtn) clearBtn.addEventListener("click", clearForm);
}

/**
 * Set add task date minimum.
 */
function setAddTaskDateMin() {
  const dateInput = document.getElementById("date");
  if (!dateInput) return;
  dateInput.setAttribute("min", getLocalDateInputValue());
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

// ------------------ PRIORITY ------------------

/**
 * Initializes priority buttons and click behavior.
 * Ensures only one priority can be selected.
 */
/**
 * Initialize priority buttons.
 */
function initPriorityButtons() {
  const buttons = getAddTaskRoot().querySelectorAll(
    ".priority-section .priority-btn",
  );

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("--selected"));
      btn.classList.add("--selected");
      selectedPriority = btn.textContent.trim();
    });
  });

  setDefaultPriority();
}

/**
 * Sets the default priority (medium) if available.
 */
/**
 * Set default priority.
 */
function setDefaultPriority() {
  const root = getAddTaskRoot();
  const defaultBtn = root.querySelector(".priority-btn.medium");
  if (!defaultBtn) return;

  root
    .querySelectorAll(".priority-section .priority-btn")
    .forEach((b) => b.classList.remove("--selected"));

  defaultBtn.classList.add("--selected");
  selectedPriority = defaultBtn.textContent.trim();
}

// ------------------ SUBTASKS ------------------

/**
 * Initializes subtask input behavior and remove handling.
 */
/**
 * Initialize subtasks.
 */
function initSubtasks() {
  const els = getSubtaskEls();
  if (!els) return;
  bindSubtaskInput(els);
  bindSubtaskClear(els);
  bindSubtaskList(els);
  syncSubtaskButtons(els.input);
}

/**
 * Get subtask elements.
 */
function getSubtaskEls() {
  const input = document.getElementById("subtasks");
  if (!input) return null;
  return {
    input: input,
    btn: document.getElementById("addSubtaskBtn"),
    clearBtn: document.getElementById("clearSubtaskBtn"),
    list: document.getElementById("subtasksList"),
  };
}

/**
 * Bind subtask input.
 */
function bindSubtaskInput(els) {
  if (els.btn) els.btn.onclick = addSubtasksFromInput;
  els.input.onkeydown = (e) => handleSubtaskEnter(e);
  els.input.addEventListener("input", () => syncSubtaskButtons(els.input));
}

/**
 * Handle subtask enter.
 */
function handleSubtaskEnter(e) {
  if (e.key !== "Enter") return;
  e.preventDefault();
  addSubtasksFromInput();
}

/**
 * Bind subtask clear.
 */
function bindSubtaskClear(els) {
  if (!els.clearBtn) return;
  els.clearBtn.onclick = () => clearSubtaskInput(els.input);
}

/**
 * Clear subtask input.
 */
function clearSubtaskInput(input) {
  input.value = "";
  input.focus();
  syncSubtaskButtons(input);
}

/**
 * Sync subtask buttons.
 */
function syncSubtaskButtons(input) {
  const wrap = input.closest(".subtasks-input");
  if (!wrap) return;
  const hasValue = !!input.value.trim();
  wrap.classList.toggle("is-empty", !hasValue);
}

/**
 * Bind subtask list.
 */
function bindSubtaskList(els) {
  if (!els.list) return;
  els.list.onclick = (e) => handleSubtaskListClick(e);
}

/**
 * Handle subtask list click.
 */
function handleSubtaskListClick(e) {
  const item = e.target.closest(".subtasks-item");
  if (!item) return;
  if (handleSubtaskRemove(e)) return;
  if (handleSubtaskEdit(e, item)) return;
  if (handleSubtaskSave(e, item)) return;
  handleSubtaskCancel(e);
}

/**
 * Handle subtask remove.
 */
function handleSubtaskRemove(e) {
  const remove = e.target.closest(".subtasks-remove");
  if (!remove) return false;
  const index = parseInt(remove.dataset.index, 10);
  if (!isNaN(index)) {
    pendingSubtasks.splice(index, 1);
    renderSubtasks();
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
  if (isNaN(index) || !pendingSubtasks[index]) return true;
  const currentTitle = pendingSubtasks[index].title || "";
  startInlineSubtaskEdit(item, index, currentTitle);
  return true;
}

/**
 * Handle subtask save.
 */
function handleSubtaskSave(e, item) {
  const save = e.target.closest(".subtasks-save-edit");
  if (!save) return false;
  const index = parseInt(save.dataset.index, 10);
  if (isNaN(index) || !pendingSubtasks[index]) return true;
  const input = item.querySelector(".subtasks-edit-input");
  if (!input) return true;
  return commitSubtaskTitle(index, input.value);
}

/**
 * Commit subtask title.
 */
function commitSubtaskTitle(index, value) {
  const trimmed = value.trim();
  if (!trimmed) return renderSubtasks(), true;
  pendingSubtasks[index].title = trimmed;
  renderSubtasks();
  return true;
}

/**
 * Handle subtask cancel.
 */
function handleSubtaskCancel(e) {
  const cancel = e.target.closest(".subtasks-cancel-edit");
  if (!cancel) return false;
  renderSubtasks();
  return true;
}

/**
 * Reads subtasks from the input field and adds them to the temporary list.
 * Supports comma, semicolon, or newline separation.
 */
/**
 * Add subtasks from input.
 */
function addSubtasksFromInput() {
  const input = document.getElementById("subtasks");
  if (!input || !input.value.trim()) return;

  input.value
    .split(/[,\n;]+/)
    .map((t) => t.trim())
    .forEach((title) => {
      if (!title) return;
      pendingSubtasks.push({ title, done: false });
    });

  input.value = "";
  renderSubtasks();
}

/**
 * Renders the current list of subtasks in the UI.
 */
/**
 * Render subtasks.
 */
function renderSubtasks() {
  const list = document.getElementById("subtasksList");
  if (!list) return;

  list.innerHTML = "";

  pendingSubtasks.forEach((s, i) => {
    list.innerHTML += `
      <li class="subtasks-item">
        <span>${s.title}</span>
        <div class="subtasks-actions">  
        <button class="subtasks-edit" data-index="${i}"><img src="../assets/icons/edit-gray.svg" alt="Edit subtask ${s.title}"></button>
       <span class="subtasks-separator"></span> <button class="subtasks-remove" data-index="${i}"><img src="../assets/icons/delete.svg" alt="Remove subtask ${s.title}"></button>
      </div></li>`;
  });
}

/**
 * Switches a subtask list item into inline edit mode
 * using an input field instead of a prompt.
 * @param {HTMLElement} item
 * @param {number} index
 * @param {string} title
 */
/**
 * Start inline subtask edit.
 */
function startInlineSubtaskEdit(item, index, title) {
  if (!item) return;
  item.innerHTML = "";
  const input = createSubtaskEditInput(title);
  const actions = createSubtaskEditActions(index);
  item.appendChild(input);
  item.appendChild(actions);
  focusSubtaskEditInput(input);
}

/**
 * Create subtask edit input.
 */
function createSubtaskEditInput(title) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "subtasks-edit-input";
  input.value = title || "";
  return input;
}

/**
 * Create subtask edit actions.
 */
function createSubtaskEditActions(index) {
  const actions = document.createElement("div");
  actions.className = "subtasks-actions";
  actions.appendChild(createSubtaskSaveBtn(index));
  actions.appendChild(createSubtaskSeparator());
  actions.appendChild(createSubtaskCancelBtn(index));
  return actions;
}

/**
 * Create subtask save button.
 */
function createSubtaskSaveBtn(index) {
  const saveBtn = document.createElement("button");
  saveBtn.className = "subtasks-save-edit";
  saveBtn.dataset.index = String(index);
  saveBtn.innerHTML = '<img src="../assets/icons/check-black.svg" alt="Save subtask">';
  return saveBtn;
}

/**
 * Create subtask separator.
 */
function createSubtaskSeparator() {
  const sep = document.createElement("span");
  sep.className = "subtasks-separator";
  return sep;
}

/**
 * Create subtask cancel button.
 */
function createSubtaskCancelBtn(index) {
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "subtasks-cancel-edit";
  cancelBtn.dataset.index = String(index);
  cancelBtn.innerHTML = '<img src="../assets/icons/iconoir_cancel.svg" alt="Cancel edit">';
  return cancelBtn;
}

/**
 * Focus subtask edit input.
 */
function focusSubtaskEditInput(input) {
  input.focus();
  const len = input.value.length;
  input.setSelectionRange(len, len);
}

// ------------------ CONTACTS / MULTI SELECT ------------------

/**
 * Loads contacts and populates the assign dropdown.
 */
/**
 * Populate assigned contacts.
 */
async function populateAssignedContacts() {
  const dropdown = document.getElementById("assignedDropdown");
  if (!dropdown) return;
  resetAssignedDropdown(dropdown);
  const list = await getContactsListFromStorage();
  list.forEach((c) => appendAssignedContactRow(dropdown, c));
}

/**
 * Reset assigned dropdown.
 */
function resetAssignedDropdown(dropdown) {
  dropdown.innerHTML = "";
}

/**
 * Get contacts list from storage.
 */
async function getContactsListFromStorage() {
  const data = await loadContactsFromStorage();
  const list = Array.isArray(data) ? data : Object.values(data || {});
  syncCachedContacts(list);
  return list;
}

/**
 * Sync cached contacts.
 */
function syncCachedContacts(list) {
  if (!Array.isArray(list)) return;
  if (list.length || !cachedContacts.length) cachedContacts = list;
}

/**
 * Get cached contacts list.
 */
function getCachedContactsList() {
  return Array.isArray(cachedContacts) ? cachedContacts : [];
}

/**
 * Get contacts list for avatars.
 */
async function getContactsListForAvatars() {
  const cached = getCachedContactsList();
  if (cached.length) return cached;
  return await getContactsListFromStorage();
}

/**
 * Append assigned contact row.
 */
function appendAssignedContactRow(dropdown, contact) {
  if (!contact?.id) return;
  dropdown.appendChild(buildAssignedContactRow(contact));
}

/**
 * Build assigned contact row.
 */
function buildAssignedContactRow(contact) {
  const row = document.createElement("div");
  row.className = "contact-option";
  row.dataset.id = String(contact.id);
  row.innerHTML = getAssignedContactRowHtml(contact);
  row.onclick = (e) => {
    e.stopPropagation();
    toggleContact(contact.id);
  };
  return row;
}

/**
 * Get assigned contact row HTML.
 */
function getAssignedContactRowHtml(contact) {
  const name = getContactLabel(contact);
  const colorClass = addTaskGetContactColorClass(contact);
  const checked = selectedContacts.has(normalizeContactId(contact.id)) ? "checked" : "";
  return (
    `<div class="contact-avatar ${colorClass}">${addTaskGetInitials(name)}</div>` +
    `<span>${name}</span>` +
    `<input type="checkbox" ${checked}>`
  );
}

/**
 * Toggles selection state of a contact.
 * @param {string} id Contact ID
 */
/**
 * Toggle contact.
 */
function toggleContact(id) {
  const key = normalizeContactId(id);
  selectedContacts.has(key) ? selectedContacts.delete(key) : selectedContacts.add(key);
  updateAssignedCheckboxes();
  renderSelectedContacts();
}

/**
 * Updates the checked state of checkboxes in the existing
 * dropdown without rebuilding all rows.
 */
/**
 * Update assigned checkboxes.
 */
function updateAssignedCheckboxes() {
  const dropdown = document.getElementById("assignedDropdown");
  if (!dropdown) return;
  const rows = dropdown.querySelectorAll(".contact-option");
  rows.forEach((row) => {
    const id = row.dataset.id;
    if (!id) return;
    const input = row.querySelector('input[type="checkbox"]');
    if (!input) return;
    input.checked = selectedContacts.has(id);
  });
}

/**
 * Renders selected contacts as avatars.
 */
/**
 * Render selected contacts.
 */
async function renderSelectedContacts() {
  const text = document.getElementById("assignedText");
  if (!text) return;
  if (!selectedContacts.size) return setAssignedPlaceholder(text);
  const view = await buildSelectedContactsView();
  text.innerHTML = view.avatarsHtml + view.moreHtml;
}

/**
 * Set assigned placeholder.
 */
function setAssignedPlaceholder(text) {
  text.textContent = "Select contacts to assign";
}

/**
 * Build selected contacts view.
 */
async function buildSelectedContactsView() {
  const list = await getContactsListForAvatars();
  const selectedIds = Array.from(selectedContacts);
  const visible = selectedIds.slice(0, 8);
  const remaining = selectedIds.length - visible.length;
  return {
    avatarsHtml: addTaskBuildContactAvatarsHtml(list, visible),
    moreHtml: buildMoreAvatarsHtml(remaining),
  };
}

/**
 * Build contact avatars HTML.
 */
function addTaskBuildContactAvatarsHtml(list, ids) {
  return ids
    .map((id) => addTaskBuildSingleAvatarHtml(list, id))
    .join("");
}

/**
 * Build single avatar HTML.
 */
function addTaskBuildSingleAvatarHtml(list, id) {
  const c = findContactById(list, id);
  if (!c) return "";
  const colorClass = addTaskGetContactColorClass(c || {});
  const label = getContactLabel(c);
  return `<span class="contact-avatar ${colorClass}">${addTaskGetInitials(label)}</span>`;
}

/**
 * Normalize contact id.
 */
function normalizeContactId(id) {
  return String(id);
}

/**
 * Find contact by id.
 */
function findContactById(list, id) {
  const key = normalizeContactId(id);
  return list.find((x) => normalizeContactId(x.id) === key);
}

/**
 * Get contact label.
 */
function getContactLabel(contact) {
  return contact?.name || contact?.namen || contact?.email || contact?.mail || contact?.id || "";
}

/**
 * Build more avatars HTML.
 */
function buildMoreAvatarsHtml(remaining) {
  if (remaining > 0) return `<span class="contact-avatar contact-avatar-more">+${remaining}</span>`;
  return "";
}

/**
 * Initializes dropdown behavior for the contact selector.
 */
/**
 * Initialize assigned dropdown.
 */
function initAssignedDropdown() {
  const els = getAssignedDropdownEls();
  if (!els) return;
  bindAssignedInput(els);
  bindAssignedArrow(els);
  bindAssignedOutside(els);
}

/**
 * Get assigned dropdown elements.
 */
function getAssignedDropdownEls() {
  const input = document.getElementById("assignedInput");
  const dropdown = document.getElementById("assignedDropdown");
  const arrow = document.getElementById("dropdownArrow");
  if (!input || !dropdown || !arrow) return null;
  return { input: input, dropdown: dropdown, arrow: arrow, wrapper: input.closest(".multi-select") };
}

/**
 * Bind assigned input.
 */
function bindAssignedInput(els) {
  els.input.onclick = (e) => {
    e.stopPropagation();
    toggleAssignedDropdown(els);
  };
}

/**
 * Bind assigned arrow.
 */
function bindAssignedArrow(els) {
  els.arrow.onclick = (e) => {
    e.stopPropagation();
    toggleAssignedDropdown(els);
  };
}

/**
 * Bind assigned outside.
 */
function bindAssignedOutside(els) {
  document.addEventListener("click", (e) => {
    if (els.wrapper && els.wrapper.contains(e.target)) return;
    closeAssignedDropdown(els);
  });
}

/**
 * Toggle assigned dropdown.
 */
function toggleAssignedDropdown(els) {
  if (els.dropdown.classList.contains("hidden")) return openAssignedDropdown(els);
  closeAssignedDropdown(els);
}

/**
 * Open assigned dropdown.
 */
function openAssignedDropdown(els) {
  els.dropdown.classList.remove("hidden");
  els.arrow.classList.add("open");
}

/**
 * Close assigned dropdown.
 */
function closeAssignedDropdown(els) {
  els.dropdown.classList.add("hidden");
  els.arrow.classList.remove("open");
}

// ------------------ CATEGORY SELECT ------------------

/**
 * Initializes dropdown behavior for the category selector.
 */
/**
 * Initialize category dropdown.
 */
function initCategoryDropdown() {
  const els = getCategoryDropdownEls();
  if (!els) return;
  bindCategoryInput(els);
  bindCategoryArrow(els);
  bindCategoryOptions(els);
  bindCategoryOutside(els);
  setCategorySelection(els.hidden.value || "");
}

/**
 * Get category dropdown elements.
 */
function getCategoryDropdownEls() {
  const input = document.getElementById("categoryInput");
  const dropdown = document.getElementById("categoryDropdown");
  const arrow = document.getElementById("categoryArrow");
  const hidden = document.getElementById("category");
  if (!input || !dropdown || !arrow || !hidden) return null;
  const wrapper = input.closest(".category-select") || input.parentElement;
  return { input: input, dropdown: dropdown, arrow: arrow, hidden: hidden, wrapper: wrapper };
}

/**
 * Bind category input.
 */
function bindCategoryInput(els) {
  els.input.onclick = (e) => {
    e.stopPropagation();
    toggleCategoryDropdown(els);
  };
}

/**
 * Bind category arrow.
 */
function bindCategoryArrow(els) {
  els.arrow.onclick = (e) => {
    e.stopPropagation();
    toggleCategoryDropdown(els);
  };
}

/**
 * Bind category options.
 */
function bindCategoryOptions(els) {
  els.dropdown.addEventListener("click", (e) => {
    const option = e.target.closest(".category-option");
    if (!option) return;
    setCategorySelection(option.dataset.value || "");
    closeCategoryDropdown(els);
  });
}

/**
 * Bind category outside.
 */
function bindCategoryOutside(els) {
  document.addEventListener("click", (e) => {
    if (els.wrapper && els.wrapper.contains(e.target)) return;
    closeCategoryDropdown(els);
  });
}

/**
 * Toggle category dropdown.
 */
function toggleCategoryDropdown(els) {
  if (els.dropdown.classList.contains("hidden")) return openCategoryDropdown(els);
  closeCategoryDropdown(els);
}

/**
 * Open category dropdown.
 */
function openCategoryDropdown(els) {
  els.dropdown.classList.remove("hidden");
  els.arrow.classList.add("open");
}

/**
 * Close category dropdown.
 */
function closeCategoryDropdown(els) {
  els.dropdown.classList.add("hidden");
  els.arrow.classList.remove("open");
}

/**
 * Applies the category selection to hidden input and UI.
 * @param {string} value
 */
/**
 * Set category selection.
 */
function setCategorySelection(value) {
  const els = getCategorySelectionEls();
  if (!els) return;
  const label = updateCategoryOptions(els.dropdown, value);
  applyCategorySelection(els, value, label);
}

/**
 * Get category selection elements.
 */
function getCategorySelectionEls() {
  const hidden = document.getElementById("category");
  const text = document.getElementById("categoryText");
  const dropdown = document.getElementById("categoryDropdown");
  if (!hidden || !text || !dropdown) return null;
  return { hidden: hidden, text: text, dropdown: dropdown };
}

/**
 * Update category options.
 */
function updateCategoryOptions(dropdown, value) {
  const options = dropdown.querySelectorAll(".category-option");
  let label = "Select task category";
  options.forEach((option) => {
    const isSelected = option.dataset.value === value;
    if (isSelected) label = option.textContent.trim();
    option.classList.toggle("selected", isSelected);
  });
  return label;
}

/**
 * Apply category selection.
 */
function applyCategorySelection(els, value, label) {
  els.hidden.value = value || "";
  els.text.textContent = label;
  els.text.classList.toggle("placeholder", !value);
}

// ------------------ TASK CREATE ------------------

/**
 * Creates a new task and saves it to Firebase.
 * Also reloads tasks from the database and updates the board.
 */
/**
 * Create task.
 */
async function createTask() {
  const values = collectTaskFormValues();
  if (!isTaskFormValid(values)) return openValidationModal();
  const task = buildTaskPayload(values);
  await trySaveTaskRemote(task);
  const tasks = await fetchTasksFromRemoteSafe();
  if (!tasks) return await saveTaskLocally(task);
  await saveTasksToStorage(tasks);
  refreshBoardIfPresent();
  finalizeCreateTask();
}

/**
 * Collect task form values.
 */
function collectTaskFormValues() {
  ensureSubtasksFromInput();
  return {
    title: getTaskFieldValue("title") || getTaskFieldValue("titel"),
    description: getTaskFieldValue("description"),
    dueDate: getTaskFieldValue("date", false),
    category: getTaskFieldValue("category", false),
  };
}

/**
 * Ensure subtasks from input.
 */
function ensureSubtasksFromInput() {
  const subInput = document.getElementById("subtasks");
  if (subInput && subInput.value.trim()) addSubtasksFromInput();
}

/**
 * Get task field value.
 */
function getTaskFieldValue(id, trim = true) {
  const el = document.getElementById(id);
  if (!el) return "";
  return trim ? el.value.trim() : (el.value || "");
}

/**
 * Check task form validity.
 */
function isTaskFormValid(values) {
  return !!(values.title && values.dueDate && values.category);
}

/**
 * Build task payload.
 */
function buildTaskPayload(values) {
  return {
    id: getTaskId(),
    title: values.title,
    description: values.description,
    dueDate: values.dueDate,
    category: values.category,
    priority: selectedPriority,
    status: getAddTaskStatus(),
    subtasks: [...pendingSubtasks],
    assigned: [...selectedContacts],
  };
}

/**
 * Get task id.
 */
function getTaskId() {
  return Date.now().toString();
}

/**
 * Save task locally when remote fetch fails.
 */
async function saveTaskLocally(task) {
  const local = await loadTasksFromStorageSafe();
  const next = mergeTaskIntoList(local, task);
  await saveTasksToStorage(next);
  finalizeCreateTask();
}

/**
 * Load tasks from storage safe.
 */
async function loadTasksFromStorageSafe() {
  try {
    if (window.idbStorage && typeof window.idbStorage.loadTasks === "function") {
      return await window.idbStorage.loadTasks();
    }
  } catch (e) {
    console.error("Failed to load local tasks", e);
  }
  return [];
}

/**
 * Save tasks to storage.
 */
async function saveTasksToStorage(tasks) {
  if (window.idbStorage && typeof window.idbStorage.saveTasks === "function") {
    return await window.idbStorage.saveTasks(tasks);
  }
  console.warn("idbStorage not available; tasks not persisted");
}

/**
 * Merge task into list.
 */
function mergeTaskIntoList(list, task) {
  const items = Array.isArray(list) ? list.slice() : [];
  items.push(task);
  return items;
}

/**
 * Try save task remote.
 */
async function trySaveTaskRemote(task) {
  try {
    await putTaskRemote(task);
  } catch (e) {
    console.error("Failed to save task remotely", e);
  }
}

/**
 * Put task remote.
 */
async function putTaskRemote(task) {
  const response = await fetch(getDbTaskUrl() + `tasks/${task.id}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  await response.json();
}

/**
 * Get DB task URL.
 */
function getDbTaskUrl() {
  return "https://join-da53b-default-rtdb.firebaseio.com/";
}

/**
 * Fetch tasks from remote safe.
 */
async function fetchTasksFromRemoteSafe() {
  try {
    return await fetchTasksFromRemote();
  } catch (e) {
    handleCreateTaskFetchFailure(e);
    return null;
  }
}

/**
 * Fetch tasks from remote.
 */
async function fetchTasksFromRemote() {
  const resp = await fetch(getDbTaskUrl() + "tasks.json");
  const data = await resp.json();
  return normalizeTasksData(data);
}

/**
 * Normalize tasks data.
 */
function normalizeTasksData(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(Boolean);
  return Object.entries(data).map(([key, val]) => ({
    ...(val || {}),
    id: val && val.id ? val.id : key,
  }));
}

/**
 * Refresh board if present.
 */
function refreshBoardIfPresent() {
  if (typeof renderBoardFromStorage === "function") renderBoardFromStorage();
  if (typeof updateEmptyStates === "function") updateEmptyStates();
}

/**
 * Finalize create task.
 */
function finalizeCreateTask() {
  if (closeAddTaskOverlayIfOpen()) return;
  redirectToBoard();
}

/**
 * Handle create task fetch failure.
 */
function handleCreateTaskFetchFailure(e) {
  console.error("Failed to load tasks from remote DB; keeping overlay open for retry", e);
  if (!isAddTaskOverlayOpen()) redirectToBoard();
}

/**
 * Close add task overlay if open.
 */
function closeAddTaskOverlayIfOpen() {
  const overlay = document.getElementById("addTaskOverlayBackdrop");
  if (!overlay) return false;
  if (typeof closeAddTaskOverlay === "function") closeAddTaskOverlay();
  return true;
}

/**
 * Check add task overlay open.
 */
function isAddTaskOverlayOpen() {
  return !!document.getElementById("addTaskOverlayBackdrop");
}

/**
 * Redirect to board.
 */
function redirectToBoard() {
  location.href = "./board.html";
}

/**
 * Loads contacts from Firebase storage.
 * Includes multiple fallback strategies in case the structure differs.
 * @returns {Promise<Object[]>}
 */
/**
 * Load contacts from storage.
 */
async function loadContactsFromStorage() {
  const direct = await tryFetchContactsDirect();
  if (direct != null) return normalizeContactsPayload(direct);
  const root = await tryFetchDbRoot();
  if (!root) return [];
  return extractContactsFromRoot(root);
}

/**
 * Try fetch contacts direct.
 */
async function tryFetchContactsDirect() {
  try {
    const response = await fetch(getDbTaskUrl() + "contacts.json");
    const data = await response.json();
    return data != null ? data : null;
  } catch (e) {
    console.error("Failed to load contacts from direct node, trying root inspection", e);
    return null;
  }
}

/**
 * Try fetch DB root.
 */
async function tryFetchDbRoot() {
  try {
    const resp = await fetch(getDbTaskUrl() + ".json");
    return await resp.json();
  } catch (e) {
    console.error("Failed to inspect DB root for contacts", e);
    return null;
  }
}

/**
 * Extract contacts from root.
 */
function extractContactsFromRoot(root) {
  if (!root) return [];
  if (root.contacts !== undefined) return normalizeContactsPayload(root.contacts);
  if (Array.isArray(root)) return extractContactsFromArrayRoot(root);
  if (typeof root === "object") return extractContactsFromObjectRoot(root);
  return [];
}

/**
 * Extract contacts from array root.
 */
function extractContactsFromArrayRoot(root) {
  const entry = root.find((e) => e && e.id === "contacts");
  if (!entry) return [];
  return extractContactsFromEntry(entry);
}

/**
 * Extract contacts from object root.
 */
function extractContactsFromObjectRoot(root) {
  const vals = Object.values(root);
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] && vals[i].id === "contacts") return extractContactsFromEntry(vals[i]);
  }
  return [];
}

/**
 * Extract contacts from entry.
 */
function extractContactsFromEntry(entry) {
  const clone = Object.assign({}, entry);
  delete clone.id;
  if (clone.contacts !== undefined) return normalizeContactsPayload(clone.contacts);
  return normalizeContactsPayload(clone);
}

/**
 * Normalize contacts payload.
 */
function normalizeContactsPayload(data) {
  if (Array.isArray(data)) return data.filter(Boolean).map(ensureContactId);
  return Object.entries(data || {}).map(([key, val]) => withContactId(val, key));
}

/**
 * Ensure contact id.
 */
function ensureContactId(contact, index = 0) {
  if (!contact) return contact;
  if (contact.id) return contact;
  const fallback = contact.email || contact.mail || contact.name || contact.namen || String(index);
  return { ...contact, id: String(fallback) };
}

/**
 * With contact id.
 */
function withContactId(val, key) {
  const c = { ...(val || {}) };
  if (!c.id) c.id = key;
  return c;
}

// ------------------ HELPERS ------------------

/**
 * Creates initials from a full name.
 * @param {string} name
 * @returns {string}
 */
/**
 * Get initials.
 */
function addTaskGetInitials(name) {
  return String(name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/**
 * Generates a simple numeric hash from a string.
 * Used to create consistent avatar colors.
 * @param {string} str
 * @returns {number}
 */
/**
 * Hash string.
 */
function addTaskHashString(str) {
  let h = 0;
  const s = String(str || "");

  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;

  return Math.abs(h);
}

/**
 * Returns a color class based on a seed value.
 * @param {string} seed
 * @returns {string}
 */
/**
 * Color class for.
 */
function addTaskColorClassFor(seed) {
  return "avatar-color-" + (addTaskHashString(seed) % 12);
}

/**
 * Determines the avatar color class for a contact.
 * @param {{id?:string,email?:string,name?:string,colorClass?:string}} contact
 * @returns {string}
 */
/**
 * Get contact color class.
 */
function addTaskGetContactColorClass(contact) {
  if (contact && contact.colorClass) return contact.colorClass;

  const seed = contact?.id || contact?.email || contact?.mail || contact?.name || contact?.namen || "";
  return addTaskColorClassFor(seed);
}

// ------------------ CLEAR ------------------

/**
 * Clears the entire add task form and resets internal state.
 */
/**
 * Clear form.
 */
function clearForm() {
  const root = getAddTaskRoot();
  const els = getClearFormEls(root);
  clearAddTaskInputs(els);
  resetAddTaskState(root);
}

/**
 * Get clear form elements.
 */
function getClearFormEls(root) {
  return {
    root: root,
    title: document.getElementById("title") || document.getElementById("titel"),
    description: document.getElementById("description"),
    dueDate: document.getElementById("date"),
    category: document.getElementById("category"),
    assigned: document.getElementById("assigned"),
    subtaskInput: document.getElementById("subtasks"),
  };
}

/**
 * Clear add task inputs.
 */
function clearAddTaskInputs(els) {
  if (els.title) els.title.value = "";
  if (els.description) els.description.value = "";
  if (els.dueDate) els.dueDate.value = "";
  if (els.category) els.category.value = "";
  if (els.assigned) els.assigned.value = "";
  if (els.subtaskInput) els.subtaskInput.value = "";
}

/**
 * Reset add task state.
 */
function resetAddTaskState(root) {
  setCategorySelection("");
  clearSelectedContacts();
  resetPendingSubtasks();
  clearPriorityButtons(root);
  selectedPriority = null;
  refreshAssignedContacts();
  setDefaultPriority();
}

/**
 * Clear selected contacts.
 */
function clearSelectedContacts() {
  if (selectedContacts) selectedContacts.clear();
}

/**
 * Reset pending subtasks.
 */
function resetPendingSubtasks() {
  pendingSubtasks = [];
  renderSubtasks();
}

/**
 * Clear priority buttons.
 */
function clearPriorityButtons(root) {
  const priorityBtns = root.querySelectorAll(".priority-section li");
  priorityBtns.forEach((btn) => btn.classList.remove("--selected"));
}

/**
 * Refresh assigned contacts.
 */
function refreshAssignedContacts() {
  populateAssignedContacts();
  renderSelectedContacts();
}

/**
 * Resets the add task form.
 */
/**
 * Reset add task form.
 */
function resetAddTaskForm() {
  clearForm();
}

/**
 * Returns the root container for the add task page.
 * Falls back to the document if the container is not found.
 * @returns {HTMLElement|Document}
 */
/**
 * Get add task root.
 */
function getAddTaskRoot() {
  return document.getElementById("addTaskRoot") || document;
}

// ------------------ ADD TASK CONTEXT ------------------

/**
 * Determines the task status based on overlay data
 * or URL query parameters.
 * @returns {string}
 */
/**
 * Get add task status.
 */
function getAddTaskStatus() {
  const overlay = document.getElementById("addTaskOverlayBackdrop");

  if (overlay && overlay.dataset && overlay.dataset.status) {
    return overlay.dataset.status;
  }

  return new URLSearchParams(location.search).get("status") || "todo";
}

// ------------------ VALIDATION MODAL ------------------

/**
 * Initializes validation modal behavior.
 */
/**
 * Initialize validation modal.
 */
function initValidationModal() {
  const modal = document.getElementById("validationModal");
  const closeBtn = document.getElementById("validationClose");
  const okBtn = document.getElementById("validationOk");

  if (!modal) return;

  if (closeBtn) closeBtn.addEventListener("click", closeValidationModal);
  if (okBtn) okBtn.addEventListener("click", closeValidationModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeValidationModal();
  });
}

/**
 * Opens the validation modal.
 */
/**
 * Open validation modal.
 */
function openValidationModal() {
  const modal = document.getElementById("validationModal");
  if (!modal) return;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

/**
 * Closes the validation modal.
 */
/**
 * Close validation modal.
 */
function closeValidationModal() {
  const modal = document.getElementById("validationModal");
  if (!modal) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}


// addTasks.html Select fild Aniemation
/**
 * Select animate.
 */
function selectAnimate() {
  const wrapper = document.querySelector(".select-wrapper");
  wrapper.classList.toggle("open");
}
