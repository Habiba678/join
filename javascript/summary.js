const DB_TASK_URL = window.DB_TASK_URL || "https://join-da53b-default-rtdb.firebaseio.com/";
const BOARD_PAGE_URL = "./board.html";

function goToBoard() {
  window.location.href = BOARD_PAGE_URL;
}

async function fetchDBNode(nodeName) {
  try {
    const resp = await fetch(DB_TASK_URL + nodeName + ".json");
    const data = await resp.json();
    if (data != null) return data;
  } catch (e) {}

  try {
    const r = await fetch(DB_TASK_URL + ".json");
    const root = await r.json();
    if (!root) return null;

    if (Array.isArray(root)) {
      const entry = root.find((e) => e && e.id === nodeName);
      if (entry) {
        const clone = Object.assign({}, entry);
        delete clone.id;
        if (clone.hasOwnProperty(nodeName)) return clone[nodeName];
        const keys = Object.keys(clone);
        if (keys.length) return clone;
      }
    } else if (typeof root === "object") {
      const vals = Object.values(root);
      for (let i = 0; i < vals.length; i++) {
        const e = vals[i];
        if (e && e.id === nodeName) {
          const clone = Object.assign({}, e);
          delete clone.id;
          if (clone.hasOwnProperty(nodeName)) return clone[nodeName];
          const keys = Object.keys(clone);
          if (keys.length) return clone;
        }
      }
      if (root[nodeName] !== undefined) return root[nodeName];
    }
  } catch (e) {}
  return null;
}

async function syncTasksFromDB() {
  try {
    const data = await fetchDBNode("tasks");
    let tasks = [];
    if (!data) tasks = [];
    else if (Array.isArray(data)) tasks = data.filter(Boolean);
    else tasks = Object.entries(data).map(([k, v]) => ({ ...(v || {}), id: v && v.id ? v.id : k }));

    if (window.idbStorage && typeof window.idbStorage.saveTasks === "function") {
      try {
        await window.idbStorage.saveTasks(tasks);
        try {
          const local = window.idbStorage.getTasksSync ? window.idbStorage.getTasksSync() : null;
          console.info("syncTasksFromDB: saved to IDB. Remote count:", tasks.length, "Local IDB count:", local ? local.length : "n/a");
        } catch (readErr) {
          console.warn("syncTasksFromDB: saved to IDB but failed to read back:", readErr);
        }
      } catch (err) {
        console.warn("Failed to save tasks to IDB:", err);
      }
    }

    return tasks;
  } catch (e) {
    console.warn("Failed to sync tasks from DB", e);
    throw e;
  }
}

async function init() {
  await (window.idbStorage && window.idbStorage.ready ? window.idbStorage.ready : Promise.resolve());
  if (!(typeof sessionStorage !== 'undefined' && sessionStorage.getItem('guest') === '1')) {
    try { await syncTasksFromDB(); } catch (e) { console.warn("Initial tasks sync failed, continuing with local cache", e); }
  } else {
    console.info('Guest mode: using demo/local tasks');
  }
  greetingText();
  getTasksTotal();
  getTasksDone();
  getTasksProgress();
  getAwaitFeedback();
  getUrgrentTodo();
  getCokkieCheck();
}

function greetingText() {
  const greeting = document.getElementById("greeting-text");
  const hour = new Date().getHours();

  if (hour < 12) {
    greeting.textContent = "Good morning!";
  } else if (hour < 18) {
    greeting.textContent = "Good afternoon!";
  } else {
    greeting.textContent = "Good evening!";
  }
}

function getTasksTotal() {
  const tasks = (window.idbStorage && typeof window.idbStorage.getTasksSync === "function") ? window.idbStorage.getTasksSync() : [];
  let filteredTasks = tasks.filter(task => task.title !== undefined);
  let tasks_to_board = document.getElementById("task-in-board");
  let todo_tasks = document.getElementById("todos-total");

  let Todos = [];

  for (let i = 0; i < tasks.length; i++) {
    const element = tasks[i];
    let status = element.status;

    if (status == "todo") {
      Todos.push(status);
    }
    todo_tasks.innerText = Todos.length;
  }
  tasks_to_board.innerText = filteredTasks.length;
}

function getTasksDone() {
  let done_tasks = document.getElementById("todos-done");
  let Todos_Done = [];
  const tasks = (window.idbStorage && typeof window.idbStorage.getTasksSync === "function") ? window.idbStorage.getTasksSync() : [];

  for (let i = 0; i < tasks.length; i++) {
    const element = tasks[i];
    let status = element.status;

    if (status == "done") {
      Todos_Done.push(status);
    }
    done_tasks.innerText = Todos_Done.length;
  }
}

function getTasksProgress() {
  let pogress_tasks = document.getElementById("task-in-pogress");
  let Todos_pogress = [];
  const tasks = (window.idbStorage && typeof window.idbStorage.getTasksSync === "function") ? window.idbStorage.getTasksSync() : [];

  for (let i = 0; i < tasks.length; i++) {
    const pogress = tasks[i];
    let status = pogress.status;

    if (status == "progress") {
      Todos_pogress.push(status);
    }
    pogress_tasks.innerText = Todos_pogress.length;
  }
}

function getAwaitFeedback() {
  let feedback_tasks = document.getElementById("task-in-feedback");
  let Todos_feedback = [];
  const tasks = (window.idbStorage && typeof window.idbStorage.getTasksSync === "function") ? window.idbStorage.getTasksSync() : [];

  for (let i = 0; i < tasks.length; i++) {
    const feedback = tasks[i];
    let status = feedback.status;

    if (status == "feedback") {
      Todos_feedback.push(status);
    }
    feedback_tasks.innerText = Todos_feedback.length;
  }
}

function getUrgrentTodo() {
  const urgent_tasks = document.getElementById("todo-status-urgent");
  let urgent_tasks_months = document.getElementById("months");
  let urgent_tasks_day = document.getElementById("day");
  let urgent_tasks_year = document.getElementById("year");
  let Todos_urgent = [];
  let nearestUrgentDate = null;
  const months = ["January","February","March","April", "May","June","July","August","September","October","November","December",];
  const tasks = (window.idbStorage && typeof window.idbStorage.getTasksSync === "function") ? window.idbStorage.getTasksSync() : [];
  for (let i = 0; i < tasks.length; i++) {
    const urgent = tasks[i];
    let priority = String(urgent.priority || "").toLowerCase();
    let dueDate = urgent.dueDate || urgent.due || "";
    let newDueDate = dueDate ? new Date(dueDate) : null;

    if (priority === "urgent") {
      Todos_urgent.push(priority);
      if (newDueDate && !isNaN(newDueDate)) {
        if (!nearestUrgentDate || newDueDate < nearestUrgentDate) {
          nearestUrgentDate = newDueDate;
        }
      }
    }
    urgent_tasks.innerText = Todos_urgent.length;
  }
  if (nearestUrgentDate) {
    urgent_tasks_months.innerText = months[nearestUrgentDate.getMonth()];
    urgent_tasks_day.innerText = nearestUrgentDate.getDate();
    urgent_tasks_year.innerText = nearestUrgentDate.getFullYear();
  }
}
