const ADD_TASK_PAGE = "./add_task.html";
const STORAGE_KEY = "tasks";

let openedTaskId = null;
let isDragging = false;

document.addEventListener("DOMContentLoaded", () => {
  initRedirects();
  renderBoardFromStorage();
  initDragAndDrop();
  initOverlayEvents();
  updateEmptyStates();
});

// ---------------- Redirects ----------------
function initRedirects() {
  document.querySelectorAll(".add-card-icon").forEach((icon) => {
    icon.addEventListener("click", () => {
      const col = icon.closest(".column");
      const status = col?.dataset?.status || "todo";
      window.location.href = `${ADD_TASK_PAGE}?status=${encodeURIComponent(
        status
      )}`;
    });
  });

  const topBtn = document.querySelector(".add-task-button");
  if (topBtn) {
    topBtn.addEventListener("click", () => {
      window.location.href = `${ADD_TASK_PAGE}?status=todo`;
    });
  }
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

// ---------------- Render board ----------------
function renderBoardFromStorage() {
  document
    .querySelectorAll(".column .cards")
    .forEach((c) => (c.innerHTML = ""));

  const tasks = getTasks();
  tasks.forEach(renderTaskCard);

  updateEmptyStates();
}

function renderTaskCard(task) {
  const cardsContainer = document.querySelector(
    `.column[data-status="${task.status}"] .cards`
  );
  if (!cardsContainer) return;

  const card = document.createElement("div");
  card.className = "card";
  card.draggable = true;
  card.dataset.id = String(task.id);

  const isTech = task.category === "tech";
  const labelText = isTech ? "Technical Task" : "User Story";
  const labelClass = isTech ? "tech" : "user";

  card.innerHTML = `
    <div class="label ${labelClass}">${labelText}</div>
    <div class="title">${escapeHtml(task.title || "")}</div>
    <div class="desc">${escapeHtml(task.description || "")}</div>
  `;

  cardsContainer.appendChild(card);
}

// ---------------- Overlay events ----------------
function initOverlayEvents() {
  const backdrop = document.getElementById("taskOverlayBackdrop");
  const closeBtn = document.getElementById("taskOverlayClose");
  const delBtn = document.getElementById("taskOverlayDelete");
  const editBtn = document.getElementById("taskOverlayEdit");

  if (!backdrop || !closeBtn) {
    console.warn(
      "Overlay elements not found (taskOverlayBackdrop/taskOverlayClose)."
    );
    return;
  }

  // Close by X
  closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeTaskOverlay();
  });

  // Close by click on backdrop
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeTaskOverlay();
  });

  // Close by ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !backdrop.hidden) closeTaskOverlay();
  });

  // Delete
  if (delBtn) {
    delBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!openedTaskId) return;
      deleteTask(openedTaskId);
    });
  }

  // Edit (simple prompt)
  if (editBtn) {
    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!openedTaskId) return;
      editTaskPrompt(openedTaskId);
    });
  }

  // Open overlay by clicking card (event delegation)
  document.addEventListener("click", (e) => {
    if (isDragging) return;

    // If click inside overlay -> ignore (overlay has its own buttons)
    if (e.target.closest(".task-overlay")) return;

    const card = e.target.closest(".card");
    if (!card) return;

    openTaskOverlay(card.dataset.id);
  });
}

// ---------------- Open / Close overlay ----------------
function openTaskOverlay(id) {
  const task = getTasks().find((t) => String(t.id) === String(id));
  if (!task) return;

  openedTaskId = String(id);

  // Category chip
  const chip = document.getElementById("taskOverlayCategory");
  if (chip) {
    const isTech = task.category === "tech";
    chip.textContent = isTech ? "Technical Task" : "User Story";
    chip.classList.remove("user", "tech");
    chip.classList.add(isTech ? "tech" : "user");
  }

  // Text fields
  setText("taskOverlayTitle", task.title || "");
  setText("taskOverlayDesc", task.description || "");
  setText("taskOverlayDue", formatDate(task.dueDate || task.due || ""));

  // Priority
  const prioEl = document.getElementById("taskOverlayPrio");
  if (prioEl) {
    const pr = String(task.priority || task.prio || "medium").toLowerCase();
    prioEl.textContent = capitalize(pr);
    prioEl.classList.remove("urgent", "medium", "low");
    prioEl.classList.add(pr);
  }

  // Assigned
  const assignedWrap = document.getElementById("taskOverlayAssigned");
  if (assignedWrap) {
    assignedWrap.innerHTML = "";

    const assignedArr = Array.isArray(task.assigned)
      ? task.assigned
      : task.assigned
      ? [task.assigned]
      : [];

    const list = assignedArr.length
      ? assignedArr
      : ["Oleg Olanovski (You)", "Mike Pankow", "Habiba"];

    list.forEach((name, idx) => {
      const row = document.createElement("div");
      row.className = "task-overlay-person";

      const badge = document.createElement("div");
      badge.className = "task-overlay-badge";
      badge.style.background = ["#00BEE8", "#6E52FF", "#FF7A00"][idx % 3];
      badge.textContent = getInitials(String(name));

      const text = document.createElement("div");
      text.textContent = String(name);

      row.appendChild(badge);
      row.appendChild(text);
      assignedWrap.appendChild(row);
    });
  }

  // Subtasks
  const subtasksWrap = document.getElementById("taskOverlaySubtasks");
  if (subtasksWrap) {
    subtasksWrap.innerHTML = "";
    const subs = Array.isArray(task.subtasks) ? task.subtasks : [];

    if (!subs.length) {
      subtasksWrap.textContent = "No subtasks";
    } else {
      subs.forEach((s) => {
        const row = document.createElement("div");
        row.className = "task-overlay-subtask";

        const box = document.createElement("input");
        box.type = "checkbox";
        box.checked = !!s.done;
        box.disabled = true;

        const label = document.createElement("span");
        label.textContent = s.title || "";

        row.appendChild(box);
        row.appendChild(label);
        subtasksWrap.appendChild(row);
      });
    }
  }

  const backdrop = document.getElementById("taskOverlayBackdrop");
  if (!backdrop) return;

  backdrop.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeTaskOverlay() {
  const backdrop = document.getElementById("taskOverlayBackdrop");
  if (!backdrop) return;

  backdrop.hidden = true;
  document.body.style.overflow = "";
  openedTaskId = null;
}

// ---------------- Delete / Edit ----------------
function deleteTask(id) {
  const tasks = getTasks();
  const task = tasks.find((t) => String(t.id) === String(id));
  if (!task) return;

  const ok = confirm(`Delete task "${task.title}"?`);
  if (!ok) return;

  const next = tasks.filter((t) => String(t.id) !== String(id));
  saveTasks(next);

  closeTaskOverlay();
  renderBoardFromStorage();
}

function editTaskPrompt(id) {
  const tasks = getTasks();
  const idx = tasks.findIndex((t) => String(t.id) === String(id));
  if (idx === -1) return;

  const t = tasks[idx];

  const newTitle = prompt("Edit title:", t.title || "");
  if (newTitle === null) return;

  const newDesc = prompt("Edit description:", t.description || "");
  if (newDesc === null) return;

  tasks[idx] = {
    ...t,
    title: newTitle.trim(),
    description: newDesc.trim(),
  };

  saveTasks(tasks);

  renderBoardFromStorage();
  openTaskOverlay(id);
}

// ---------------- Drag & Drop (persist status) ----------------
function initDragAndDrop() {
  document.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;

    isDragging = true;
    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", card.dataset.id || "");
  });

  document.addEventListener("dragend", (e) => {
    const card = e.target.closest(".card");
    if (card) card.classList.remove("dragging");

    isDragging = false;
    document
      .querySelectorAll(".column")
      .forEach((c) => c.classList.remove("drag-over"));
  });

  document.querySelectorAll(".column .cards").forEach((zone) => {
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.closest(".column")?.classList.add("drag-over");
      e.dataTransfer.dropEffect = "move";
    });

    zone.addEventListener("dragleave", () => {
      zone.closest(".column")?.classList.remove("drag-over");
    });

    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.closest(".column")?.classList.remove("drag-over");

      const id = e.dataTransfer.getData("text/plain");
      const card = id
        ? document.querySelector(`.card[data-id="${CSS.escape(String(id))}"]`)
        : document.querySelector(".card.dragging");

      if (!card) return;

      zone.appendChild(card);

      const col = zone.closest(".column");
      const newStatus = col?.dataset?.status;
      if (newStatus) updateTaskStatus(id, newStatus);

      updateEmptyStates();
    });
  });
}

function updateTaskStatus(id, status) {
  const tasks = getTasks();
  const idx = tasks.findIndex((t) => String(t.id) === String(id));
  if (idx === -1) return;

  tasks[idx].status = status;
  saveTasks(tasks);
}

// ---------------- Empty placeholders ----------------
function updateEmptyStates() {
  document.querySelectorAll(".column").forEach((col) => {
    const cards = col.querySelector(".cards");
    const empty = col.querySelector(".empty");
    if (!cards || !empty) return;

    empty.style.display = cards.children.length ? "none" : "block";
  });
}

// ---------------- Utils ----------------
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatDate(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y}`;
  }
  return value;
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
