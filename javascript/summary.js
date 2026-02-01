function init() {
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
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let total_tasks = document.getElementById("todos-total");
  let tasks_in_board = document.getElementById("task-in-board");
  total_tasks.innerText = tasks.length;
  tasks_in_board.innerText = tasks.length;
}

function getTasksDone() {
  let done_tasks = document.getElementById("todos-done");
  let Todos_Done = [];
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

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
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

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
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

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
  let urgent_tasks = document.getElementById("todo-status-urgent");
  let due_date = document.getElementById("due-date");
  let Todos_urgent = [];
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  for (let i = 0; i < tasks.length; i++) {
    const urgent = tasks[i];
    let priority = urgent.priority;
    let dueDate = urgent.dueDate;

    if (priority == "urgent") {
      Todos_urgent.push(priority);
      due_date.innerText = dueDate;
    }
    urgent_tasks.innerText = Todos_urgent.length;
  }
}
/* date format kommende neue Function*/

// let newDueDate = new Date(dueDate);
// console.log(newDueDate);
// console.log(newDueDate.getDay());
// console.log(newDueDate.getFullYear());
