// ---------------- Render board ----------------
function renderBoardFromStorage() {
  clearAllCards();
  renderAllTasks(getFilteredTasks());
  updateEmptyStates();
}

function clearAllCards() {
  const cardsLists = document.querySelectorAll(".column .cards");
  for (let i = 0; i < cardsLists.length; i++) {
    cardsLists[i].innerHTML = "";
  }
}

function renderAllTasks(tasks) {
  const list = Array.isArray(tasks) ? tasks : getTasks();
  for (let i = 0; i < list.length; i++) {
    renderTaskCard(list[i]);
  }
}

function getFilteredTasks() {
  const tasks = getTasks();
  if (!activeSearchQuery) return tasks;
  const filtered = [];
  for (let i = 0; i < tasks.length; i++) {
    if (taskMatchesQuery(tasks[i], activeSearchQuery)) filtered.push(tasks[i]);
  }
  return filtered;
}

function taskMatchesQuery(task, query) {
  const hay = buildTaskSearchText(task);
  return hay.includes(query);
}

function buildTaskSearchText(task) {
  const assigned = resolveAssignedList(task);
  const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
  const subtaskTitles = [];
  for (let i = 0; i < subs.length; i++) {
    if (subs[i] && subs[i].title) subtaskTitles.push(subs[i].title);
  }
  const values = [
    task.title,
    task.description,
    getLabelText(task),
    task.category,
    task.status,
    task.priority || task.prio,
    task.dueDate || task.due,
    assigned.join(" "),
    subtaskTitles.join(" "),
  ];
  return normalizeSearchQuery(values.join(" "));
}

function renderTaskCard(task) {
  const cardsContainer = getCardsContainer(task.status);
  if (!cardsContainer) return;
  const card = createCardElement(task);
  card.innerHTML = buildCardHtml(task);
  cardsContainer.appendChild(card);
}

function getCardsContainer(status) {
  const selector = '.column[data-status="' + status + '"] .cards';
  return document.querySelector(selector);
}

function createCardElement(task) {
  const card = document.createElement("div");
  card.className = "card";
  card.draggable = true;
  card.dataset.id = String(task.id);
  return card;
}

function buildCardHtml(task) {
  const labelText = getLabelText(task);
  const labelClass = getLabelClass(task);
  let html = "";
  html += '<div class="card-content">';
  html += '<div class="label ' + labelClass + '">' + labelText + "</div>";
  html += '<div class="title">' + escapeHtml(task.title || "") + "</div>";
  html += '<div class="desc">' + escapeHtml(task.description || "") + "</div>";
  html += "</div>";
  html += '<div class="card-bottom">';
  html += buildCardSubtaskProgressHtml(task);
  html += buildCardFooterHtml(task);
  html += "</div>";
  return html;
}

function getLabelText(task) {
  return task.category === "tech" ? "Technical Task" : "User Story";
}

function getLabelClass(task) {
  return task.category === "tech" ? "tech" : "user";
}

function buildCardSubtaskProgressHtml(task) {
  const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
  const total = subs.length;
  if (!total) return "";
  const done = countDoneSubtasks(subs);
  const percent = Math.round((done / total) * 100);
  let html = "";
  html += '<div class="card-progress">';
  html += '<div class="card-progress-bar">';
  html += '<div class="card-progress-fill" style="width:' + percent + '%"></div>';
  html += "</div>";
  html += '<div class="card-progress-text">' + done + "/" + total + "</div>";
  html += "</div>";
  return html;
}

function buildCardFooterHtml(task) {
  const avatars = buildAssignedAvatarsHtml(task);
  const prioIcon = getPriorityIcon(task);
  let html = "";
  html += '<div class="card-footer">';
  html += '<div class="card-contacts">' + avatars + "</div>";
  html += '<div class="card-priority">';
  if (prioIcon) {
    const prClass = getPriorityText(task);
    html +=
      '<img src="' +
      prioIcon +
      '" class="card-priority-icon ' +
      escapeHtml(prClass) +
      '" alt="Priority ' +
      escapeHtml(prClass) +
      '">';
  }
  html += "</div>";
  html += "</div>";
  return html;
}

function buildAssignedAvatarsHtml(task) {
  const list = getAssignedListForCard(task);
  if (!list.length) return "";
  let html = "";
  for (let i = 0; i < list.length; i++) {
    const name = String(list[i]);
    const initials = getInitials(name);
    const color = getAvatarColor(initials);
    html +=
      '<span class="card-avatar" style="background:' +
      color +
      '">' +
      escapeHtml(initials) +
      "</span>";
  }
  return html;
}

function getAssignedListForCard(task) {
  return resolveAssignedList(task);
}

function countDoneSubtasks(subs) {
  let done = 0;
  for (let i = 0; i < subs.length; i++) {
    if (subs[i] && subs[i].done) done += 1;
  }
  return done;
}

function getPriorityText(task) {
  return String(task.priority || task.prio || "").toLowerCase();
}

function getPriorityIcon(task) {
  const pr = getPriorityText(task);
  if (pr === "urgent") return "../assets/icons/urgent.svg";
  if (pr === "medium") return "../assets/icons/medium.png";
  if (pr === "low") return "../assets/icons/low.svg";
  return "";
}

