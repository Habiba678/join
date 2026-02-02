// ADD TASK → SAVE TO STORAGE

let selectedPriority = null;
let pendingSubtasks = [];

document.addEventListener("DOMContentLoaded", () => {
  const createBtn = document.getElementById("createTaskBtn");
  const clearBtn = document.querySelector(".primary-btn.--primary-btn-cancel");
  if (!createBtn) return;
  const subtaskInput = document.getElementById("subtasks");
  const addSubtaskBtn = document.getElementById("addSubtaskBtn");
  const subtaskList = document.getElementById("subtasksList");
  const modal = document.getElementById("validationModal");
  const modalOk = document.getElementById("validationOk");
  const modalClose = document.getElementById("validationClose");
  populateAssignedContacts();

  // Priority buttons: read value on click
  const priorityBtns = document.querySelectorAll(".priority-section .priority-btn");
  priorityBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      priorityBtns.forEach((b) => b.classList.remove("--selected"));
      btn.classList.add("--selected");
      selectedPriority = btn.textContent.trim();
      console.log("Priority selected:", selectedPriority);
    });
  });
  const defaultBtn = document.querySelector(".priority-section .priority-btn.medium");
  if (defaultBtn) {
    defaultBtn.classList.add("--selected");
    selectedPriority = defaultBtn.textContent.trim();
  }

  if (addSubtaskBtn && subtaskInput) {
    addSubtaskBtn.addEventListener("click", addSubtasksFromInput);
    subtaskInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addSubtasksFromInput();
      }
    });
  }

  if (subtaskList) {
    subtaskList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const removeBtn = target.closest(".subtasks-remove");
      if (!removeBtn) return;
      const index = Number(removeBtn.dataset.index);
      if (Number.isNaN(index)) return;
      pendingSubtasks.splice(index, 1);
      renderSubtasks();
    });
  }

  createBtn.addEventListener("click", createTask);
  if (clearBtn) {
    clearBtn.addEventListener("click", clearForm);
  }

  if (modalOk) {
    modalOk.addEventListener("click", closeValidationModal);
  }
  if (modalClose) {
    modalClose.addEventListener("click", closeValidationModal);
  }
  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeValidationModal();
    });
  }
});

function populateAssignedContacts() {
  const assigned = document.getElementById("assigned");
  if (!assigned) return;
  const contacts = loadContactsFromStorage();
  assigned.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select contacts to assign";
  assigned.appendChild(placeholder);
  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i];
    if (!c || !c.id || !c.name) continue;
    const opt = document.createElement("option");
    opt.value = String(c.id);
    opt.textContent = c.name;
    assigned.appendChild(opt);
  }
}

function loadContactsFromStorage() {
  try {
    const raw = localStorage.getItem("join_contacts_v1");
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function addSubtasksFromInput() {
  const input = document.getElementById("subtasks");
  if (!input) return;
  const rawValue = input.value.trim();
  if (!rawValue) return;

  const titles = rawValue
    .split(/[,\n;]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (!titles.length) return;

  titles.forEach((title) => {
    if (pendingSubtasks.length >= 3) return;
    pendingSubtasks.push({ title, done: false });
  });

  input.value = "";
  renderSubtasks();
}

function renderSubtasks() {
  const list = document.getElementById("subtasksList");
  if (!list) return;
  list.innerHTML = "";

  pendingSubtasks.forEach((subtask, index) => {
    const item = document.createElement("li");
    item.className = "subtasks-item";

    const title = document.createElement("span");
    title.className = "subtasks-title";
    title.textContent = subtask.title;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "subtasks-remove";
    removeBtn.dataset.index = String(index);
    removeBtn.textContent = "x";

    item.appendChild(title);
    item.appendChild(removeBtn);
    list.appendChild(item);
  });
}

function createTask() {
  const title = document.getElementById("titel").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("date").value;
  const category = document.getElementById("category").value;
  const assignedValue = document.getElementById("assigned").value;

  if (!title || !dueDate || !category) {
    openValidationModal();
    return;
  }

  const priority = selectedPriority || "";

  addSubtasksFromInput();
  const subtasks = pendingSubtasks.slice();

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
    assigned: assignedValue || "",
  };

  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.push(newTask);
  localStorage.setItem("tasks", JSON.stringify(tasks));

  window.location.href = "./board.html";
}

function openValidationModal() {
  const modal = document.getElementById("validationModal");
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeValidationModal() {
  const modal = document.getElementById("validationModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function clearForm() {
  const title = document.getElementById("titel");
  const description = document.getElementById("description");
  const dueDate = document.getElementById("date");
  const category = document.getElementById("category");
  const assigned = document.getElementById("assigned");
  const subtaskInput = document.getElementById("subtasks");
  const priorityBtns = document.querySelectorAll(".priority-section li");

  if (title) title.value = "";
  if (description) description.value = "";
  if (dueDate) dueDate.value = "";
  if (category) category.value = "";
  if (assigned) assigned.value = "";
  if (subtaskInput) subtaskInput.value = "";

  pendingSubtasks = [];
  renderSubtasks();

  priorityBtns.forEach((btn) => btn.classList.remove("--selected"));
  selectedPriority = null;
}
