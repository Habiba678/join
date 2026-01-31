// ADD TASK → SAVE TO STORAGE

let selectedPriority = null;

document.addEventListener("DOMContentLoaded", () => {
  const createBtn = document.getElementById("createTaskBtn");
  if (!createBtn) return;

  // Priority buttons: read value on click
  const priorityBtns = document.querySelectorAll(".priority-section li");
  priorityBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      priorityBtns.forEach((b) => b.classList.remove("--selected"));
      btn.classList.add("--selected");
      selectedPriority = btn.textContent.trim();
      console.log("Priority selected:", selectedPriority);
    });
  });

  createBtn.addEventListener("click", createTask);
});

function createTask() {
  const title = document.getElementById("titel").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("date").value;
  const category = document.getElementById("category").value;
  const subtaskInput = document.getElementById("subtasks").value.trim();

  if (!title || !dueDate || !category) {
    alert("Please fill all required fields");
    return;
  }

  const priority = selectedPriority || "";

  const subtasks = subtaskInput
    ? subtaskInput
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((title) => ({ title, done: false }))
    : [];

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status") || "todo";

  const newTask = {
    id: Date.now().toString(),
    title,
    description,
    dueDate,
    category,
    priority,
    status,
    subtasks,
  };

  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.push(newTask);
  localStorage.setItem("tasks", JSON.stringify(tasks));

  window.location.href = "./board.html";
}
