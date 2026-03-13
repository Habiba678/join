// ---------------- Render board ----------------
/**
 * Render board from storage.
 */
function renderBoardFromStorage() {
  clearAllCards();
  const filtered = getFilteredTasks();
  renderAllTasks(filtered);
  updateSearchEmptyState(filtered);
  updateEmptyStates();
}

/**
 * Get normalize search fn.
 */
function getNormalizeSearchFn() {
  if (typeof normalizeSearchQuery === "function") return normalizeSearchQuery;
  return function (value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  };
}

/**
 * Get active search query.
 */
function getActiveSearchQuery() {
  if (typeof activeSearchQuery !== "undefined") return activeSearchQuery;
  if (
    typeof window !== "undefined" &&
    typeof window.activeSearchQuery !== "undefined"
  ) {
    return window.activeSearchQuery;
  }
  return "";
}

/**
 * Clear all cards.
 */
function clearAllCards() {
  const cardsLists = document.querySelectorAll(".column .cards");
  for (let i = 0; i < cardsLists.length; i++) {
    cardsLists[i].innerHTML = "";
  }
}

/**
 * Render all tasks.
 */
function renderAllTasks(tasks) {
  const list = Array.isArray(tasks) ? tasks : getTasks();
  for (let i = 0; i < list.length; i++) {
    renderTaskCard(list[i]);
  }
}

/**
 * Get filtered tasks.
 */
function getFilteredTasks() {
  const tasks = getTasks();
  const normalize = getNormalizeSearchFn();
  const query = normalize(getActiveSearchQuery());
  if (!query) return tasks;
  const filtered = [];
  for (let i = 0; i < tasks.length; i++) {
    if (taskMatchesQuery(tasks[i], query)) filtered.push(tasks[i]);
  }
  return filtered;
}

/**
 * Update search empty state.
 */
function updateSearchEmptyState(tasks) {
  const el = document.getElementById("boardSearchEmpty");
  if (!el) return;
  const list = Array.isArray(tasks) ? tasks : [];
  const show = !!getActiveSearchQuery() && list.length === 0;
  el.style.display = show ? "block" : "none";
}

/**
 * Task matches query.
 */
function taskMatchesQuery(task, query) {
  const title = buildTaskSearchTitle(task);
  return title.includes(query);
}

/**
 * Build task search title.
 */
function buildTaskSearchTitle(task) {
  const normalize = getNormalizeSearchFn();
  return normalize(task && task.title ? task.title : "");
}

/**
 * Render task card.
 */
function renderTaskCard(task) {
  const cardsContainer = getCardsContainer(task.status);
  if (!cardsContainer) return;
  const card = createCardElement(task);
  card.innerHTML = buildCardHtml(task);
  cardsContainer.appendChild(card);
}

/**
 * Get cards container.
 */
function getCardsContainer(status) {
  const selector = '.column[data-status="' + status + '"] .cards';
  return document.querySelector(selector);
}

/**
 * Create card element.
 */
function createCardElement(task) {
  const card = document.createElement("div");
  card.className = "card";
  card.draggable = true;
  card.dataset.id = String(task.id);
  return card;
}

/**
 * Build card html.
 */
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

/**
 * Get label text.
 */
function getLabelText(task) {
  return task.category === "tech" ? "Technical Task" : "User Story";
}

/**
 * Get label class.
 */
function getLabelClass(task) {
  return task.category === "tech" ? "tech" : "user";
}

/**
 * Build card subtask progress html.
 */
function buildCardSubtaskProgressHtml(task) {
  const subs = getTaskSubtasks(task);
  const total = subs.length;
  if (!total) return "";
  const done = countDoneSubtasks(subs);
  const percent = Math.round((done / total) * 100);
  let html = "";
  html += '<div class="card-progress">';
  html += '<div class="card-progress-bar">';
  html +=
    '<div class="card-progress-fill" style="width:' + percent + '%"></div>';
  html += "</div>";
  html += '<div class="card-progress-text">' + done + "/" + total + "</div>";
  html += "</div>";
  return html;
}

/**
 * Build card footer html.
 */
function buildCardFooterHtml(task) {
  const avatars = buildAssignedAvatarsHtml(task);
  const prioIcon = getPriorityIcon(task);
  const prClass = prioIcon ? getPriorityText(task) : "";
  return [
    '<div class="card-footer">',
    '<div class="card-contacts">' + avatars + "</div>",
    buildCardFooterPriorityHtml(prioIcon, prClass),
    "</div>",
  ].join("");
}

/**
 * Build assigned avatars html.
 */
function buildAssignedAvatarsHtml(task) {
  const list = getAssignedContactsForCard(task);
  if (!list.length) return "";
  const maxAvatars = 5;
  const limit = Math.min(list.length, maxAvatars);
  const remaining = list.length - maxAvatars;
  return buildAvatarListHtml(list, limit) + buildAvatarRemainderHtml(remaining);
}

/**
 * Get assigned contacts for card.
 */
function getAssignedContactsForCard(task) {
  return resolveAssignedContacts(task);
}

/**
 * Resolve assigned contacts.
 */
function resolveAssignedContacts(task) {
  const assignedArr = normalizeAssigned(task.assigned);
  if (!assignedArr.length) return [];
  const contacts = typeof loadContacts === "function" ? loadContacts() : [];
  return resolveAssignedFromContacts(assignedArr, contacts);
}

/**
 * Get contacts by id.
 */
function getContactsById(contacts) {
  if (typeof buildContactsById === "function")
    return buildContactsById(contacts);
  const map = new Map();
  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i];
    if (c && c.id) map.set(String(c.id), c);
  }
  return map;
}

/**
 * Get contacts by name.
 */
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

/**
 * Hash string local.
 */
function hashStringLocal(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Color class for seed.
 */
function colorClassForSeed(seed) {
  return "avatar-color-" + (hashStringLocal(seed) % 12);
}

/**
 * Get contact color class.
 */
function getContactColorClass(contact) {
  if (contact && contact.colorClass) return contact.colorClass;
  const seed = contact?.id || contact?.email || contact?.name || "";
  return colorClassForSeed(seed);
}

/**
 * Returns a normalized subtasks array for a task.
 * Supports both array and object map shapes and
 * also falls back to possible legacy keys.
 *
 * @param {Object} task
 * @returns {Array<{title:string, done:boolean}>}
 */
/**
 * Get task subtasks.
 */
function getTaskSubtasks(task) {
  const subs = getRawSubtasks(task);
  if (!Array.isArray(subs)) return [];
  return normalizeSubtasks(subs);
}

/**
 * Build card footer priority html.
 */
function buildCardFooterPriorityHtml(prioIcon, prClass) {
  let html = '<div class="card-priority">';
  if (prioIcon) html += buildPriorityIconHtml(prioIcon, prClass);
  html += "</div>";
  return html;
}

/**
 * Build priority icon html.
 */
function buildPriorityIconHtml(prioIcon, prClass) {
  return (
    '<img src="' +
    prioIcon +
    '" class="card-priority-icon ' +
    escapeHtml(prClass) +
    '" alt="Priority ' +
    escapeHtml(prClass) +
    '">'
  );
}

/**
 * Build avatar list html.
 */
function buildAvatarListHtml(list, limit) {
  let html = "";
  for (let i = 0; i < limit; i++) {
    html += buildSingleAvatarHtml(list[i] || {});
  }
  return html;
}

/**
 * Build single avatar html.
 */
function buildSingleAvatarHtml(contact) {
  const name = String(contact.name || contact.id || "");
  const initials = getInitials(name);
  const colorClass = getContactColorClass(contact);
  return (
    '<span class="card-avatar ' +
    escapeHtml(colorClass) +
    '">' +
    escapeHtml(initials) +
    "</span>"
  );
}

/**
 * Build avatar remainder html.
 */
function buildAvatarRemainderHtml(remaining) {
  if (remaining > 0)
    return (
      '<span class="card-avatar card-avatar-more">+' + remaining + "</span>"
    );
  return "";
}

/**
 * Normalize assigned.
 */
function normalizeAssigned(assigned) {
  if (Array.isArray(assigned)) return assigned;
  if (assigned) return [assigned];
  return [];
}

/**
 * Resolve assigned from contacts.
 */
function resolveAssignedFromContacts(assignedArr, contacts) {
  const byId = getContactsById(contacts);
  const byName = getContactsByName(contacts);
  const result = [];
  for (let i = 0; i < assignedArr.length; i++) {
    const entry = resolveAssignedEntry(assignedArr[i], byId, byName);
    if (entry) result.push(entry);
  }
  return result;
}

/**
 * Resolve assigned entry.
 */
function resolveAssignedEntry(value, byId, byName) {
  const key = String(value || "").trim();
  if (!key) return null;
  const contact = byId.get(key) || byName.get(key.toLowerCase());
  return contact ? contact : { id: key, name: key };
}

/**
 * Get raw subtasks.
 */
function getRawSubtasks(task) {
  if (!task) return [];
  if (Array.isArray(task.subtasks)) return task.subtasks;
  if (task.subtasks && typeof task.subtasks === "object")
    return Object.values(task.subtasks);
  if (Array.isArray(task.subtask)) return task.subtask;
  if (task.subtask && typeof task.subtask === "object")
    return Object.values(task.subtask);
  return [];
}

/**
 * Normalize subtasks.
 */
function normalizeSubtasks(subs) {
  return subs
    .filter(Boolean)
    .map(function (s) {
      if (typeof s === "string") return { title: s, done: false };
      return {
        title: s && s.title ? String(s.title) : "",
        done: !!(s && s.done),
      };
    })
    .filter(function (s) {
      return !!s.title;
    });
}

/**
 * Count done subtasks.
 */
function countDoneSubtasks(subs) {
  let done = 0;
  for (let i = 0; i < subs.length; i++) {
    if (subs[i] && subs[i].done) done += 1;
  }
  return done;
}

/**
 * Get priority text.
 */
function getPriorityText(task) {
  return String(task.priority || task.prio || "").toLowerCase();
}

/**
 * Get priority icon.
 */
function getPriorityIcon(task) {
  const pr = getPriorityText(task);
  if (pr === "urgent") return "../assets/icons/urgent.svg";
  if (pr === "medium") return "../assets/icons/medium.png";
  if (pr === "low") return "../assets/icons/low.svg";
  return "";
}
