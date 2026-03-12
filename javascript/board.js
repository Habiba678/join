const STORAGE_KEY = "tasks";
const CONTACTS_STORAGE_KEY = "join_contacts_v1";
const DB_TASK_URL = "https://join-da53b-default-rtdb.firebaseio.com/";
// Expose for other modules that need to call the DB
window.DB_TASK_URL = DB_TASK_URL;

let openedTaskId = null;
let isDragging = false;
let pendingDeleteId = null;
let isEditingOverlay = false;
let overlaySelectedContacts = new Set();
let overlayPendingSubtasks = [];
let overlaySelectedPriority = "medium";
let activeSearchQuery = "";
window.activeSearchQuery = activeSearchQuery;

document.addEventListener("DOMContentLoaded", onBoardReady);

async function onBoardReady() {
  getCokkieCheck();
  await waitForIdbReady();
  initBoardUi();
  await syncBoardData();
  finalizeBoardUi();
}

async function waitForIdbReady() {
  const ready = window.idbStorage && window.idbStorage.ready;
  if (!ready) return;
  await ready;
}

function initBoardUi() {
  initRedirects();
  initAddTaskOverlay();
  initSearch();
}

async function syncBoardData() {
  await trySyncTasks();
  await trySyncContacts();
}

async function trySyncTasks() {
  try {
    await syncTasksFromDB();
  } catch (e) {
    console.error("Initial sync failed, falling back to local storage", e);
  }
}

async function trySyncContacts() {
  try {
    await syncContactsFromDB();
  } catch (e) {
    console.warn("Initial contacts sync failed, continuing with local cache", e);
  }
}

function finalizeBoardUi() {
  renderBoardFromStorage();
  initDragAndDrop();
  initOverlayEvents();
  initDeleteConfirm();
  updateEmptyStates();
}

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

// ---------------- Search ----------------
function initSearch() {
  const input = document.querySelector(".search-input");
  if (!input) return;
  const icon = document.querySelector(".search-icon");
  bindSearchInput(input);
  bindSearchEscape(input);
  bindSearchIcon(icon, input);
}

function bindSearchInput(input) {
  input.addEventListener("input", function () {
    applySearchQuery(input.value);
  });
}

function bindSearchEscape(input) {
  input.addEventListener("keydown", function (e) {
    handleSearchEscape(e, input);
  });
}

function handleSearchEscape(e, input) {
  if (e.key !== "Escape") return;
  input.value = "";
  applySearchQuery("");
}

function bindSearchIcon(icon, input) {
  if (!icon) return;
  icon.addEventListener("click", function () {
    focusAndSearch(input);
  });
}

function focusAndSearch(input) {
  input.focus();
  applySearchQuery(input.value);
}

function applySearchQuery(value) {
  activeSearchQuery = normalizeSearchQuery(value);
  window.activeSearchQuery = activeSearchQuery;
  renderBoardFromStorage();
}

function normalizeSearchQuery(value) {
  return String(value || "").trim().toLowerCase();
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
    
    return (window.idbStorage && typeof window.idbStorage.getTasksSync === "function") ? window.idbStorage.getTasksSync() : [];
    
  } catch (e) {
    console.error("Storage access error:", e);
    return [];
  }
}

async function saveTasks(tasks) {
  await persistTasksToIdb(tasks);
  syncTasksToRemote(tasks);
}

// Sync tasks from Firebase RTDB and save to persistent storage (IndexedDB)
async function fetchDBNode(nodeName) {
  const direct = await tryFetchNode(nodeName);
  if (direct != null) return direct;
  return fetchNodeFromRoot(nodeName);
}


async function syncTasksFromDB() {
  try {
    const data = await fetchDBNode("tasks");
    let tasks = [];
    if (!data) tasks = [];
    else if (Array.isArray(data)) tasks = data.filter(Boolean);
    else tasks = Object.entries(data).map(([k, v]) => ({ ...(v || {}), id: v && v.id ? v.id : k }));
    await saveTasks(tasks);
    return tasks;
  } catch (e) {
    console.error("Failed to sync tasks from DB", e);
    throw e;
  }
}


async function syncContactsFromDB() {
  try {
    const data = await fetchDBNode("contacts");
    const contacts = normalizeContactsData(data);
    const local = await trySaveContactsToIdb(contacts);
    return local || contacts;
  } catch (e) {
    console.error("Failed to sync contacts from DB", e);
    throw e;
  }
}

async function persistTasksToIdb(tasks) {
  if (!(window.idbStorage && typeof window.idbStorage.saveTasks === "function")) {
    console.warn("idbStorage not available - tasks not persisted");
    return;
  }
  try {
    await window.idbStorage.saveTasks(tasks);
  } catch (e) {
    console.error("Failed to save tasks to IDB:", e);
  }
}

function syncTasksToRemote(tasks) {
  (async function () {
    try {
      await putTasksToRemote(tasks);
      renderBoardFromStorage();
    } catch (err) {
      console.warn("Failed to sync tasks to remote DB:", err);
    }
  })();
}

async function putTasksToRemote(tasks) {
  const url = getRemoteTasksUrl();
  const map = buildTasksMap(tasks);
  await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(map),
  });
}

function getRemoteTasksUrl() {
  const base = window.DB_TASK_URL || "https://join-da53b-default-rtdb.firebaseio.com/";
  return base + "tasks.json";
}

function buildTasksMap(tasks) {
  const map = {};
  for (const t of (tasks || [])) {
    map[getTaskIdForMap(t)] = t;
  }
  return map;
}

function getTaskIdForMap(task) {
  if (task && task.id) return String(task.id);
  return "tmp_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

async function tryFetchNode(nodeName) {
  try {
    const resp = await fetch(DB_TASK_URL + nodeName + ".json");
    const data = await resp.json();
    return data != null ? data : null;
  } catch (e) {
    return null;
  }
}

async function fetchNodeFromRoot(nodeName) {
  try {
    const root = await fetchDbRoot();
    if (!root) return null;
    return extractNodeFromRoot(root, nodeName);
  } catch (e) {
    return null;
  }
}

async function fetchDbRoot() {
  const r = await fetch(DB_TASK_URL + ".json");
  return r.json();
}

function extractNodeFromRoot(root, nodeName) {
  if (Array.isArray(root)) return extractNodeFromArray(root, nodeName);
  if (root && typeof root === "object") return extractNodeFromObject(root, nodeName);
  return null;
}

function extractNodeFromArray(root, nodeName) {
  const entry = root.find((e) => e && e.id === nodeName);
  return entry ? extractNodeFromEntry(entry, nodeName) : null;
}

function extractNodeFromObject(root, nodeName) {
  const vals = Object.values(root);
  for (let i = 0; i < vals.length; i++) {
    const candidate = extractNodeFromEntry(vals[i], nodeName);
    if (candidate !== null && candidate !== undefined) return candidate;
  }
  if (root[nodeName] !== undefined) return root[nodeName];
  return null;
}

function extractNodeFromEntry(entry, nodeName) {
  if (!entry || entry.id !== nodeName) return null;
  const clone = Object.assign({}, entry);
  delete clone.id;
  if (clone.hasOwnProperty(nodeName)) return clone[nodeName];
  const keys = Object.keys(clone);
  return keys.length ? clone : null;
}

function normalizeContactsData(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(Boolean);
  return Object.entries(data).map(([k, v]) => ({ ...(v || {}), id: v && v.id ? v.id : k }));
}

async function trySaveContactsToIdb(contacts) {
  if (!(window.idbStorage && typeof window.idbStorage.saveContacts === "function")) return null;
  try {
    await window.idbStorage.saveContacts(contacts);
  } catch (err) {
    console.warn("Failed to save contacts to IDB:", err);
    return null;
  }
  return readContactsFromIdb();
}

function readContactsFromIdb() {
  try {
    return window.idbStorage.getContactsSync ? window.idbStorage.getContactsSync() : null;
  } catch (readErr) {
    console.warn("syncContactsFromDB: saved to IDB but failed to read back:", readErr);
    return null;
  }
}

function loadContacts() {
  try {
    return (window.idbStorage && typeof window.idbStorage.getContactsSync === "function")
      ? window.idbStorage.getContactsSync()
      : [];
  } catch (e) {
    console.error("Contacts access error:", e);
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
