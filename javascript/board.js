// ==========================
// JOIN BOARD (clean version)
// - redirect to add_task.html from plus icons + top button
// - drag & drop cards between columns
// - empty state toggle
// ==========================

const ADD_TASK_PAGE = "./add_task.html"; // поменяй путь если надо (например "../html/add_task.html")

document.addEventListener("DOMContentLoaded", () => {
  initRedirects();
  initDragAndDrop();
  updateEmptyStates();
});

// ---------- Redirects ----------
function initRedirects() {
  // Plus icons in columns
  document.querySelectorAll(".add-card-icon").forEach((icon) => {
    icon.addEventListener("click", () => {
      const col = icon.closest(".column");
      const status = col?.dataset?.status || "todo";
      // передаём статус, чтобы на add_task.html ты мог сразу выставлять колонку
      window.location.href = `${ADD_TASK_PAGE}?status=${encodeURIComponent(
        status
      )}`;
    });
  });

  // Top button "Add task +"
  const topBtn = document.querySelector(".add-task-button");
  if (topBtn) {
    topBtn.addEventListener("click", () => {
      window.location.href = `${ADD_TASK_PAGE}?status=todo`;
    });
  }
}

// ---------- Drag & Drop ----------
function initDragAndDrop() {
  // 1) drag start / end (делегирование)
  document.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;

    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", card.dataset.id || "");
  });

  document.addEventListener("dragend", (e) => {
    const card = e.target.closest(".card");
    if (card) card.classList.remove("dragging");
    document
      .querySelectorAll(".column")
      .forEach((c) => c.classList.remove("drag-over"));
  });

  // 2) drop zones
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
        ? document.querySelector(`.card[data-id="${CSS.escape(id)}"]`)
        : document.querySelector(".card.dragging");

      if (!card) return;

      zone.appendChild(card);
      updateEmptyStates();

      // (опционально) если у тебя есть массив tasks — тут обновляй статус
      // const status = zone.closest(".column")?.dataset?.status;
      // const task = tasks.find(t => String(t.id) === String(id));
      // if (task) task.status = status;
    });
  });
}

// ---------- Empty placeholders ----------
function updateEmptyStates() {
  document.querySelectorAll(".column").forEach((col) => {
    const cards = col.querySelector(".cards");
    const empty = col.querySelector(".empty");
    if (!cards || !empty) return;
    empty.style.display = cards.children.length ? "none" : "block";
  });
}
