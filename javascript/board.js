const STORAGE_KEY = "tasks";
const CONTACTS_STORAGE_KEY = "join_contacts_v1";
const DB_TASK_URL = "https://join-da53b-default-rtdb.firebaseio.com/";

let openedTaskId = null;
let isDragging = false;
let pendingDeleteId = null;
let isEditingOverlay = false;
let overlaySelectedContacts = new Set();
let overlayPendingSubtasks = [];
let overlaySelectedPriority = "medium";
let activeSearchQuery = "";

document.addEventListener("DOMContentLoaded", async function () {
  initRedirects();
  initAddTaskOverlay();
  initSearch();

  // Try to sync tasks from remote DB first (DB = source of truth)
  try {
    await syncTasksFromDB();
  } catch (e) {
    console.error("Initial sync failed, falling back to local storage", e);
  }

  renderBoardFromStorage();
  initDragAndDrop();
  initOverlayEvents();
  initDeleteConfirm();
  updateEmptyStates();
});

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

  input.addEventListener("input", function () {
    applySearchQuery(input.value);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    input.value = "";
    applySearchQuery("");
  });

  if (icon) {
    icon.addEventListener("click", function () {
      input.focus();
      applySearchQuery(input.value);
    });
  }
}

function applySearchQuery(value) {
  activeSearchQuery = normalizeSearchQuery(value);
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
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Storage parse error:", e);
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Sync tasks from Firebase RTDB and save to localStorage
async function syncTasksFromDB() {
  try {
    const resp = await fetch(DB_TASK_URL + ".json");
    const data = await resp.json();
    let tasks = [];
    if (!data) tasks = [];
    else if (Array.isArray(data)) tasks = data.filter(Boolean);
    else tasks = Object.entries(data).map(([k, v]) => ({ ...(v || {}), id: v && v.id ? v.id : k }));
    saveTasks(tasks);
    console.log("Synced tasks from DB:", tasks.length);
    return tasks;
  } catch (e) {
    console.error("Failed to sync tasks from DB", e);
    throw e;
  }
}

function loadContacts() {
  try {
    const raw = localStorage.getItem(CONTACTS_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error("Contacts parse error:", e);
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
