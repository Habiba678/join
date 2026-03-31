// ---------------- Tasks storage ----------------
/**
 * Reads the cached task list from IndexedDB-backed storage.
 * @returns {BoardTask[]} Cached tasks, or an empty array on failure.
 */
function getTasks() {
  try {
    return (window.idbStorage && typeof window.idbStorage.getTasksSync === "function")
      ? window.idbStorage.getTasksSync()
      : [];
  } catch (e) {
    console.error("Storage access error:", e);
    return [];
  }
}

/**
 * Persists tasks locally and triggers asynchronous remote synchronization.
 * @param {BoardTask[]} tasks Tasks to persist.
 * @returns {Promise<void>}
 */
async function saveTasks(tasks) {
  await persistTasksToIdb(tasks);
  syncTasksToRemote(tasks);
}

/**
 * Fetches a named node from Firebase, with a root-level fallback lookup.
 * @param {string} nodeName Firebase node name.
 * @returns {Promise<*|null>} Resolved node payload or `null`.
 */
async function fetchDBNode(nodeName) {
  const direct = await tryFetchNode(nodeName);
  if (direct != null) return direct;
  return fetchNodeFromRoot(nodeName);
}

/**
 * Loads tasks from Firebase and stores them locally.
 * @returns {Promise<BoardTask[]>} Normalized task list.
 */
async function syncTasksFromDB() {
  try {
    const data = await fetchDBNode("tasks");
    let tasks = [];
    if (!data) tasks = [];
    else if (Array.isArray(data)) tasks = data.filter(Boolean);
    else tasks = Object.entries(data).map(function ([k, v]) {
      return { ...(v || {}), id: v && v.id ? v.id : k };
    });
    await saveTasks(tasks);
    return tasks;
  } catch (e) {
    console.error("Failed to sync tasks from DB", e);
    throw e;
  }
}

/**
 * Writes the current task list to IndexedDB-backed storage.
 * @param {BoardTask[]} tasks Tasks to persist.
 * @returns {Promise<void>}
 */
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

/**
 * Starts a background sync of tasks to the remote database.
 * @param {BoardTask[]} tasks Tasks to synchronize.
 * @returns {void}
 */
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

/**
 * Sends the full task map to Firebase using a `PUT` request.
 * @param {BoardTask[]} tasks Tasks to upload.
 * @returns {Promise<void>}
 */
async function putTasksToRemote(tasks) {
  const url = getRemoteTasksUrl();
  const map = buildTasksMap(tasks);
  await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(map),
  });
}

/**
 * Builds the Firebase endpoint URL for the tasks collection.
 * @returns {string} Fully qualified tasks endpoint URL.
 */
function getRemoteTasksUrl() {
  const base = window.DB_TASK_URL || "https://join-da53b-default-rtdb.firebaseio.com/";
  return base + "tasks.json";
}

/**
 * Converts a task array into the keyed object shape expected by Firebase.
 * @param {BoardTask[]} tasks Tasks to map by ID.
 * @returns {Object<string, BoardTask>} Task map keyed by task ID.
 */
function buildTasksMap(tasks) {
  const map = {};
  for (const t of tasks || []) {
    map[getTaskIdForMap(t)] = t;
  }
  return map;
}

/**
 * Resolves a stable map key for a task, generating a temporary one if needed.
 * @param {BoardTask} task Task to map.
 * @returns {string} Existing or generated task ID.
 */
function getTaskIdForMap(task) {
  if (task && task.id) return String(task.id);
  return "tmp_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

/**
 * Attempts to fetch a Firebase node directly from its endpoint.
 * @param {string} nodeName Firebase node name.
 * @returns {Promise<*|null>} Node payload or `null` on failure.
 */
async function tryFetchNode(nodeName) {
  try {
    const resp = await fetch(DB_TASK_URL + nodeName + ".json");
    const data = await resp.json();
    return data != null ? data : null;
  } catch (e) {
    return null;
  }
}

/**
 * Attempts to resolve a node by downloading the database root payload.
 * @param {string} nodeName Firebase node name.
 * @returns {Promise<*|null>} Node payload or `null` on failure.
 */
async function fetchNodeFromRoot(nodeName) {
  try {
    const root = await fetchDbRoot();
    if (!root) return null;
    return extractNodeFromRoot(root, nodeName);
  } catch (e) {
    return null;
  }
}

/**
 * Fetches the Firebase database root payload.
 * @returns {Promise<*>} Parsed root JSON payload.
 */
async function fetchDbRoot() {
  const response = await fetch(DB_TASK_URL + ".json");
  return response.json();
}

/**
 * Extracts a named node from either an array- or object-shaped root payload.
 * @param {*} root Root payload fetched from Firebase.
 * @param {string} nodeName Firebase node name.
 * @returns {*|null} Extracted node payload or `null`.
 */
function extractNodeFromRoot(root, nodeName) {
  if (Array.isArray(root)) return extractNodeFromArray(root, nodeName);
  if (root && typeof root === "object") return extractNodeFromObject(root, nodeName);
  return null;
}

/**
 * Extracts a named node from an array-shaped Firebase root payload.
 * @param {Array<*>} root Root payload represented as an array.
 * @param {string} nodeName Firebase node name.
 * @returns {*|null} Extracted node payload or `null`.
 */
function extractNodeFromArray(root, nodeName) {
  const entry = root.find(function (item) {
    return item && item.id === nodeName;
  });
  return entry ? extractNodeFromEntry(entry, nodeName) : null;
}

/**
 * Extracts a named node from an object-shaped Firebase root payload.
 * @param {Object<string, *>} root Root payload represented as an object.
 * @param {string} nodeName Firebase node name.
 * @returns {*|null} Extracted node payload or `null`.
 */
function extractNodeFromObject(root, nodeName) {
  const vals = Object.values(root);
  for (let i = 0; i < vals.length; i++) {
    const candidate = extractNodeFromEntry(vals[i], nodeName);
    if (candidate !== null && candidate !== undefined) return candidate;
  }
  if (root[nodeName] !== undefined) return root[nodeName];
  return null;
}

/**
 * Extracts a named nested payload from a root entry matched by `id`.
 * @param {Object<string, *>|null} entry Root entry candidate.
 * @param {string} nodeName Firebase node name.
 * @returns {*|null} Extracted node payload or `null`.
 */
function extractNodeFromEntry(entry, nodeName) {
  if (!entry || entry.id !== nodeName) return null;
  const clone = Object.assign({}, entry);
  delete clone.id;
  if (Object.prototype.hasOwnProperty.call(clone, nodeName)) return clone[nodeName];
  const keys = Object.keys(clone);
  return keys.length ? clone : null;
}
