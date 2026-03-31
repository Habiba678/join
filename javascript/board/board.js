/**
 * Board task record persisted in IndexedDB and Firebase.
 * @typedef {Object} BoardTask
 * @property {string|number} [id] Unique task identifier.
 * @property {string} [title] Task title.
 * @property {string} [description] Task description.
 * @property {string} [dueDate] Due date in `YYYY-MM-DD` format.
 * @property {string} [due] Legacy due-date field used by older task payloads.
 * @property {string} [category] Task category such as `tech` or `user`.
 * @property {string} [priority] Priority label.
 * @property {string} [prio] Legacy priority field used by older task payloads.
 * @property {string} [status] Board column status.
 * @property {Array<{title:string, done:boolean}>} [subtasks] Task subtasks.
 * @property {string|string[]} [assigned] Assigned contact IDs or names.
 */

/**
 * Contact record used by board assignment UI.
 * @typedef {Object} BoardContact
 * @property {string|number} [id] Unique contact identifier.
 * @property {string} [name] Display name.
 * @property {string} [email] Contact email.
 * @property {string} [colorClass] CSS avatar color class.
 */

/**
 * Local storage key for board tasks.
 * @type {string}
 */
const STORAGE_KEY = "tasks";

/**
 * Local storage key for cached contacts.
 * @type {string}
 */
const CONTACTS_STORAGE_KEY = "join_contacts_v1";

/**
 * Firebase Realtime Database base URL for board data.
 * @type {string}
 */
const DB_TASK_URL = "https://join-da53b-default-rtdb.firebaseio.com/";

// Expose for other modules that need to call the DB
window.DB_TASK_URL = DB_TASK_URL;

/**
 * Task ID currently opened in the details overlay.
 * @type {string|null}
 */
let openedTaskId = null;

/**
 * Whether a drag operation is currently active.
 * @type {boolean}
 */
let isDragging = false;

/**
 * Task ID waiting for delete confirmation.
 * @type {string|null}
 */
let pendingDeleteId = null;

/**
 * Whether the task overlay is currently in edit mode.
 * @type {boolean}
 */
let isEditingOverlay = false;

/**
 * Selected contact IDs in the overlay edit form.
 * @type {Set<string>}
 */
let overlaySelectedContacts = new Set();

/**
 * Editable subtask draft list for the overlay form.
 * @type {Array<{title:string, done:boolean}>}
 */
let overlayPendingSubtasks = [];

/**
 * Priority currently selected in the overlay edit form.
 * @type {string}
 */
let overlaySelectedPriority = "medium";

/**
 * Active normalized search query for board filtering.
 * @type {string}
 */
let activeSearchQuery = "";

window.activeSearchQuery = activeSearchQuery;

document.addEventListener("DOMContentLoaded", onBoardReady);

/**
 * Boots the board page after the DOM is ready.
 * @returns {Promise<void>}
 */
async function onBoardReady() {
  getCokkieCheck();
  await waitForIdbReady();
  initBoardUi();
  await syncBoardData();
  finalizeBoardUi();
}

/**
 * Waits until IndexedDB helpers are initialized, when available.
 * @returns {Promise<void>}
 */
async function waitForIdbReady() {
  const ready = window.idbStorage && window.idbStorage.ready;
  if (!ready) return;
  await ready;
}

/**
 * Initializes board UI bindings that do not depend on loaded data.
 * @returns {void}
 */
function initBoardUi() {
  initRedirects();
  initAddTaskOverlay();
  initSearch();
}

/**
 * Synchronizes tasks and contacts into local persistent storage.
 * @returns {Promise<void>}
 */
async function syncBoardData() {
  await trySyncTasks();
  await trySyncContacts();
}

/**
 * Attempts to refresh tasks from the remote database.
 * @returns {Promise<void>}
 */
async function trySyncTasks() {
  try {
    await syncTasksFromDB();
  } catch (e) {
    console.error("Initial sync failed, falling back to local storage", e);
  }
}

/**
 * Attempts to refresh contacts from the remote database.
 * @returns {Promise<void>}
 */
async function trySyncContacts() {
  try {
    await syncContactsFromDB();
  } catch (e) {
    console.warn("Initial contacts sync failed, continuing with local cache", e);
  }
}

/**
 * Finalizes board initialization after data has been synchronized.
 * @returns {void}
 */
function finalizeBoardUi() {
  renderBoardFromStorage();
  initDragAndDrop();
  initOverlayEvents();
  initDeleteConfirm();
  updateEmptyStates();
}
