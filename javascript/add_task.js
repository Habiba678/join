// ADD TASK → SAVE TO STORAGE

document.addEventListener("DOMContentLoaded", () => {
  const createBtn = document.getElementById("createTaskBtn");
  if (!createBtn) return;

  createBtn.addEventListener("click", createTask);
});

function createTask() {
  const title = document.getElementById("titel").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("date").value;
  const category = document.getElementById("category").value;

  if (!title || !dueDate || !category) {
    alert("Please fill all required fields");
    return;
  }

  let priority = "medium";

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
  };

  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.push(newTask);
  localStorage.setItem("tasks", JSON.stringify(tasks));

  window.location.href = "./board.html";
}
