const DB_TASK_URL = window.DB_TASK_URL || "https://join-da53b-default-rtdb.firebaseio.com/";
const BOARD_PAGE_URL = "./board.html";
const months = ["January","February","March","April", "May","June","July","August","September","October","November","December",];
const urgent_tasks = document.getElementById("todo-status-urgent");
let urgent_tasks_months = document.getElementById("months");
let urgent_tasks_day = document.getElementById("day");
let urgent_tasks_year = document.getElementById("year");
let Todos_urgent = [];
let nearestUrgentDate = null;
/**
 * Go to board.
 */
function goToBoard() {window.location.href = BOARD_PAGE_URL;}

/**
 * Fetch dbnode.
 */
async function fetchDBNode(nodeName) {
  const direct = await tryFetchNode(nodeName);
  if (direct != null) return direct;
  return fetchNodeFromRoot(nodeName);
}

/**
 * Try fetch node.
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
 * Fetch node from root.
 */
async function fetchNodeFromRoot(nodeName) {
  try {
    const r = await fetch(DB_TASK_URL + ".json");
    const root = await r.json();
    if (!root) return null;
    return extractNodeFromRoot(root, nodeName);
  } catch (e) {
    return null;
  }
}

/**
 * Extract node from root.
 */
function extractNodeFromRoot(root, nodeName) {
  if (Array.isArray(root)) return extractNodeFromArray(root, nodeName);
  if (typeof root === "object") return extractNodeFromObject(root, nodeName);
  return null;
}

/**
 * Extract node from array.
 */
function extractNodeFromArray(root, nodeName) {
  const entry = root.find((e) => e && e.id === nodeName);
  return entry ? extractNodeFromEntry(entry, nodeName) : null;
}

/**
 * Extract node from object.
 */
function extractNodeFromObject(root, nodeName) {
  const vals = Object.values(root);
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] && vals[i].id === nodeName) return extractNodeFromEntry(vals[i], nodeName);
  }
  return root[nodeName] !== undefined ? root[nodeName] : null;
}

/**
 * Extract node from entry.
 */
function extractNodeFromEntry(entry, nodeName) {
  const clone = Object.assign({}, entry);
  delete clone.id;
  if (clone.hasOwnProperty(nodeName)) return clone[nodeName];
  const keys = Object.keys(clone);
  return keys.length ? clone : null;
}


/**
 * Sync tasks from db.
 */
async function syncTasksFromDB() {
  try {
    const data = await fetchDBNode("tasks");
    let tasks = [];
    if (!data) tasks = [];
    else if (Array.isArray(data)) tasks = data.filter(Boolean);
    else tasks = Object.entries(data).map(([k, v]) => ({ ...(v || {}), id: v && v.id ? v.id : k }));
    if (window.idbStorage && typeof window.idbStorage.saveTasks === "function") {
      try {await window.idbStorage.saveTasks(tasks);
        try {const local = window.idbStorage.getTasksSync ? window.idbStorage.getTasksSync() : null;} catch (readErr) {console.warn("syncTasksFromDB: saved to IDB but failed to read back:", readErr);}
      } catch (err) {console.warn("Failed to save tasks to IDB:", err);}
    }
    return tasks;
  } catch (e) {console.warn("Failed to sync tasks from DB", e); throw e;}
}


/**
 * Initialize.
 */
async function init() {
  await (window.idbStorage && window.idbStorage.ready ? window.idbStorage.ready : Promise.resolve());
  try { await syncTasksFromDB(); } catch (e) { console.warn("Initial tasks sync failed, continuing with local cache", e); }
  getCokkieCheck(); greetingText(); getTasksTotal(); getTasksDone(); getTasksProgress(); getAwaitFeedback(); getUrgrentTodo();
}

/**
 * Greeting text.
 */
function greetingText() {
  const el = document.getElementById("greeting-text"); if (!el) return;
  const h = new Date().getHours();
  const base = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  try {
    const cookieMatch = document.cookie.split(";").map(c => c.trim()).find(c => c.startsWith("loggedInUser="));
    if (cookieMatch) {
      const cookieValue = cookieMatch.split("=")[1];
      name = JSON.parse(decodeURIComponent(cookieValue));
    } else if (sessionStorage.getItem("loggedInUser")) {
      name = JSON.parse(sessionStorage.getItem("loggedInUser"));
    }
    el.textContent = `${base}, ${name}!`;
  } catch (e) { el.textContent = base + "!"; }
}
/**
 * Get tasks total.
 */
function getTasksTotal() {
  const tasks = (window.idbStorage && typeof window.idbStorage.getTasksSync === "function") ? window.idbStorage.getTasksSync() : [];
  let filteredTasks = tasks.filter(task => task.title !== undefined);
  let tasks_to_board = document.getElementById("task-in-board");
  let todo_tasks = document.getElementById("todos-total");
  let Todos = [];

  for (let i = 0; i < tasks.length; i++) {
    const element = tasks[i];
    let status = element.status;
    if (status == "todo") { Todos.push(status);}
    todo_tasks.innerText = Todos.length;
  }
  tasks_to_board.innerText = filteredTasks.length;
}


/**
 * Get tasks done.
 */
function getTasksDone() {
  let done_tasks = document.getElementById("todos-done");
  let Todos_Done = [];
  const tasks = (window.idbStorage && typeof window.idbStorage.getTasksSync === "function") ? window.idbStorage.getTasksSync() : [];

  for (let i = 0; i < tasks.length; i++) {
    const element = tasks[i];
    let status = element.status;
    if (status == "done") {Todos_Done.push(status);}
    done_tasks.innerText = Todos_Done.length;
  }
}


/**
 * Get tasks progress.
 */
function getTasksProgress() {
  let pogress_tasks = document.getElementById("task-in-pogress");
  let Todos_pogress = [];
  const tasks = (window.idbStorage && typeof window.idbStorage.getTasksSync === "function") ? window.idbStorage.getTasksSync() : [];
  for (let i = 0; i < tasks.length; i++) {
    const pogress = tasks[i];
    let status = pogress.status;
    if (status == "progress") {Todos_pogress.push(status);}
    pogress_tasks.innerText = Todos_pogress.length;
  }
}


/**
 * Get await feedback.
 */
function getAwaitFeedback() {
  let feedback_tasks = document.getElementById("task-in-feedback");
  let Todos_feedback = [];
  const tasks = (window.idbStorage && typeof window.idbStorage.getTasksSync === "function") ? window.idbStorage.getTasksSync() : [];
  for (let i = 0; i < tasks.length; i++) {
    const feedback = tasks[i];
    let status = feedback.status;
    if (status == "feedback") {Todos_feedback.push(status);}
    feedback_tasks.innerText = Todos_feedback.length;
  }
}


/**
 * Get urgrent todo.
 */
function getUrgrentTodo() {
  const tasks = (window.idbStorage && typeof window.idbStorage.getTasksSync === "function") ? window.idbStorage.getTasksSync() : [];
  for (let i = 0; i < tasks.length; i++) {
    const urgent = tasks[i];
    let priority = String(urgent.priority || "").toLowerCase();
    let dueDate = urgent.dueDate || urgent.due || "";
    let newDueDate = dueDate ? new Date(dueDate) : null;
    if (priority === "urgent") { Todos_urgent.push(priority);
      if (newDueDate && !isNaN(newDueDate)) { if (!nearestUrgentDate || newDueDate < nearestUrgentDate) {nearestUrgentDate = newDueDate;}
      }}urgent_tasks.innerText = Todos_urgent.length;}
  if (nearestUrgentDate) {
    urgent_tasks_months.innerText = months[nearestUrgentDate.getMonth()];
    urgent_tasks_day.innerText = nearestUrgentDate.getDate();
    urgent_tasks_year.innerText = nearestUrgentDate.getFullYear();
  }
}
