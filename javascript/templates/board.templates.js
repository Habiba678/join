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
  const list = getAssignedContactsForCard(task);
  if (!list.length) return "";
  let html = "";
  for (let i = 0; i < list.length; i++) {
    const contact = list[i] || {};
    const name = String(contact.name || contact.id || "");
    const initials = getInitials(name);
    const colorClass = getContactColorClass(contact);
    html +=
      '<span class="card-avatar ' +
      escapeHtml(colorClass) +
      '">' +
      escapeHtml(initials) +
      "</span>";
  }
  return html;
}

function getAssignedContactsForCard(task) {
  return resolveAssignedContacts(task);
}

function resolveAssignedContacts(task) {
  let assignedArr = [];
  if (Array.isArray(task.assigned)) assignedArr = task.assigned;
  else if (task.assigned) assignedArr = [task.assigned];
  if (!assignedArr.length) return [];

  const contacts =
    typeof loadContacts === "function" ? loadContacts() : [];
  const byId = getContactsById(contacts);
  const byName = getContactsByName(contacts);
  const result = [];

  for (let i = 0; i < assignedArr.length; i++) {
    const value = assignedArr[i];
    const key = String(value || "").trim();
    if (!key) continue;
    const contact = byId.get(key) || byName.get(key.toLowerCase());
    result.push(contact ? contact : { id: key, name: key });
  }
  return result;
}

function getContactsById(contacts) {
  if (typeof buildContactsById === "function") return buildContactsById(contacts);
  const map = new Map();
  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i];
    if (c && c.id) map.set(String(c.id), c);
  }
  return map;
}

function getContactsByName(contacts) {
  const map = new Map();
  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i];
    const name = String(c && c.name ? c.name : "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!map.has(key)) map.set(key, c);
  }
  return map;
}

function hashStringLocal(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function colorClassForSeed(seed) {
  return "avatar-color-" + (hashStringLocal(seed) % 12);
}

function getContactColorClass(contact) {
  if (contact && contact.colorClass) return contact.colorClass;
  const seed = contact?.id || contact?.email || contact?.name || "";
  return colorClassForSeed(seed);
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
