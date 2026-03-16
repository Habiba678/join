/** @typedef {{title: string, done: boolean}} BoardSubtask */

// ---------------- Render board ----------------
/** Renders the full board from cached storage. @returns {void} */
function renderBoardFromStorage() {
  clearAllCards();
  const filtered = getFilteredTasks();
  renderAllTasks(filtered);
  updateSearchEmptyState(filtered);
  updateEmptyStates();
}
/** @returns {(value: string) => string} Search normalization function. */
function getNormalizeSearchFn() {
  if (typeof normalizeSearchQuery === "function") return normalizeSearchQuery;
  return function (value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  };
}
/** @returns {string} Current normalized search query. */
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
/** Removes all currently rendered cards from every board column. @returns {void} */
function clearAllCards() {
  const cardsLists = document.querySelectorAll(".column .cards");
  for (let i = 0; i < cardsLists.length; i++) {
    cardsLists[i].innerHTML = "";
  }
}
/** @param {BoardTask[]} [tasks] Tasks to render. Falls back to cached tasks. @returns {void} */
function renderAllTasks(tasks) {
  const list = Array.isArray(tasks) ? tasks : getTasks();
  for (let i = 0; i < list.length; i++) {
    renderTaskCard(list[i]);
  }
}
/** @returns {BoardTask[]} Tasks filtered by the active search query. */
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
/** @param {BoardTask[]} tasks Filtered task list. @returns {void} */
function updateSearchEmptyState(tasks) {
  const el = document.getElementById("boardSearchEmpty");
  if (!el) return;
  const list = Array.isArray(tasks) ? tasks : [];
  const show = !!getActiveSearchQuery() && list.length === 0;
  el.style.display = show ? "block" : "none";
}
/** @param {BoardTask} task Task to test. @param {string} query Normalized search query. @returns {boolean} `true` when the task matches. */
function taskMatchesQuery(task, query) {
  const title = buildTaskSearchTitle(task);
  return title.includes(query);
}
/** @param {BoardTask} task Task to extract searchable text from. @returns {string} Normalized title string. */
function buildTaskSearchTitle(task) {
  const normalize = getNormalizeSearchFn();
  return normalize(task && task.title ? task.title : "");
}
/** @param {BoardTask} task Task to render as a card. @returns {void} */
function renderTaskCard(task) {
  const cardsContainer = getCardsContainer(task.status);
  if (!cardsContainer) return;
  const card = createCardElement(task);
  card.innerHTML = buildCardHtml(task);
  cardsContainer.appendChild(card);
}
/** @param {string} status Target board status. @returns {HTMLElement|null} Matching column cards container. */
function getCardsContainer(status) {
  const selector = '.column[data-status="' + status + '"] .cards';
  return document.querySelector(selector);
}
/** @param {BoardTask} task Task to wrap in a card element. @returns {HTMLDivElement} Empty card element. */
function createCardElement(task) {
  const card = document.createElement("div");
  card.className = "card";
  card.draggable = true;
  card.dataset.id = String(task.id);
  return card;
}
/** @param {BoardTask} task Task to render. @returns {string} Card markup. */
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
/** @param {BoardTask} task Task to inspect. @returns {string} Human-readable category label. */
function getLabelText(task) {
  return task.category === "tech" ? "Technical Task" : "User Story";
}
/** @param {BoardTask} task Task to inspect. @returns {string} Category CSS modifier class. */
function getLabelClass(task) {
  return task.category === "tech" ? "tech" : "user";
}
/** @param {BoardTask} task Task to inspect. @returns {string} Subtask progress markup. */
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
/** @param {BoardTask} task Task to inspect. @returns {string} Card footer markup. */
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
/** @param {BoardTask} task Task to inspect. @returns {string} Assigned-avatar markup. */
function buildAssignedAvatarsHtml(task) {
  const list = getAssignedContactsForCard(task);
  if (!list.length) return "";
  const maxAvatars = 5;
  const limit = Math.min(list.length, maxAvatars);
  const remaining = list.length - maxAvatars;
  return buildAvatarListHtml(list, limit) + buildAvatarRemainderHtml(remaining);
}
/** @param {BoardTask} task Task to inspect. @returns {BoardContact[]} Resolved assigned contacts. */
function getAssignedContactsForCard(task) {
  return resolveAssignedContacts(task);
}
/** @param {BoardTask} task Task to inspect. @returns {BoardContact[]} Resolved assigned contacts. */
function resolveAssignedContacts(task) {
  const assignedArr = normalizeAssigned(task.assigned);
  if (!assignedArr.length) return [];
  const contacts = typeof loadContacts === "function" ? loadContacts() : [];
  return resolveAssignedFromContacts(assignedArr, contacts);
}
/** @param {BoardContact[]} contacts Contact list. @returns {Map<string, BoardContact>} Contacts keyed by ID. */
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
/** @param {BoardContact[]} contacts Contact list. @returns {Map<string, BoardContact>} Contacts keyed by lowercase name. */
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
/** @param {string} str Seed string. @returns {number} Stable positive hash value. */
function hashStringLocal(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
/** @param {string} seed Seed string. @returns {string} Avatar color CSS class. */
function colorClassForSeed(seed) {
  return "avatar-color-" + (hashStringLocal(seed) % 12);
}
/** @param {BoardContact|{id?:string,email?:string,name?:string,colorClass?:string}} contact Contact-like object. @returns {string} Avatar color CSS class. */
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
function getTaskSubtasks(task) {
  const subs = getRawSubtasks(task);
  if (!Array.isArray(subs)) return [];
  return normalizeSubtasks(subs);
}
/** @param {string} prioIcon Icon URL. @param {string} prClass Priority CSS/text class. @returns {string} Priority markup for the card footer. */
function buildCardFooterPriorityHtml(prioIcon, prClass) {
  let html = '<div class="card-priority">';
  if (prioIcon) html += buildPriorityIconHtml(prioIcon, prClass);
  html += "</div>";
  return html;
}
/** @param {string} prioIcon Icon URL. @param {string} prClass Priority CSS/text class. @returns {string} Priority icon markup. */
function buildPriorityIconHtml(prioIcon, prClass) {
  return ( '<img src="' + prioIcon + '" class="card-priority-icon ' + escapeHtml(prClass) + '" alt="Priority ' + escapeHtml(prClass) + '">');
}
/** @param {BoardContact[]} list Resolved assigned contacts. @param {number} limit Number of avatars to render. @returns {string} Avatar-list markup. */
function buildAvatarListHtml(list, limit) {
  let html = "";
  for (let i = 0; i < limit; i++) { html += buildSingleAvatarHtml(list[i] || {}); }
  return html;
}
/** @param {BoardContact} contact Contact to render. @returns {string} Single avatar markup. */
function buildSingleAvatarHtml(contact) {
  const name = String(contact.name || contact.id || "");
  const initials = getInitials(name);
  const colorClass = getContactColorClass(contact);
  return ( '<span class="card-avatar ' + escapeHtml(colorClass) + '">' + escapeHtml(initials) + "</span>" );
}
/** @param {number} remaining Number of hidden avatars. @returns {string} Overflow avatar markup. */
function buildAvatarRemainderHtml(remaining) {
  if (remaining > 0)
    return ('<span class="card-avatar card-avatar-more">+' + remaining + "</span>");
  return "";
}
/** @param {string|string[]|undefined} assigned Raw assigned value. @returns {string[]} Normalized assigned array. */
function normalizeAssigned(assigned) {
  if (Array.isArray(assigned)) return assigned;
  if (assigned) return [assigned];
  return [];
}
/** @param {string[]} assignedArr Normalized assigned values. @param {BoardContact[]} contacts Contact list. @returns {BoardContact[]} Resolved contact list. */
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
/** @param {string} value Raw assigned entry. @param {Map<string, BoardContact>} byId Contacts keyed by ID. @param {Map<string, BoardContact>} byName Contacts keyed by lowercase name. @returns {BoardContact|null} Resolved contact or fallback object. */
function resolveAssignedEntry(value, byId, byName) {
  const key = String(value || "").trim();
  if (!key) return null;
  const contact = byId.get(key) || byName.get(key.toLowerCase());
  return contact ? contact : { id: key, name: key };
}
/** @param {BoardTask} task Task to inspect. @returns {Array<BoardSubtask|string|Object>} Raw subtask collection in any supported format. */
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
/** @param {Array<BoardSubtask|string|Object>} subs Raw subtasks. @returns {BoardSubtask[]} Normalized subtasks. */
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
/** @param {BoardSubtask[]} subs Normalized subtasks. @returns {number} Completed subtask count. */
function countDoneSubtasks(subs) {
  let done = 0;
  for (let i = 0; i < subs.length; i++) { if (subs[i] && subs[i].done) done += 1; }
  return done;
}
/** @param {BoardTask} task Task to inspect. @returns {string} Normalized priority value. */
function getPriorityText(task) {
  return String(task.priority || task.prio || "").toLowerCase();
}
/** @param {BoardTask} task Task to inspect. @returns {string} Priority icon path or an empty string. */
function getPriorityIcon(task) {
  const pr = getPriorityText(task);
  if (pr === "urgent") return "../assets/icons/urgent.svg";
  if (pr === "medium") return "../assets/icons/medium.png";
  if (pr === "low") return "../assets/icons/low.svg";
  return "";
}
