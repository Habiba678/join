async function init() {
  // Ensure IndexedDB cache is ready
  await (window.idbStorage && window.idbStorage.ready ? window.idbStorage.ready : Promise.resolve());
  greetingText();
  getTasksTotal();
  getTasksDone();
  getTasksProgress();
  getAwaitFeedback();
  getUrgrentTodo();
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
