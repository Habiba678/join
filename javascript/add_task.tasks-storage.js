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
