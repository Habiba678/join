/** @typedef {{input: HTMLElement, dropdown: HTMLElement, arrow: HTMLElement}} OverlayAssignedElements */

/** Initializes the assigned-contacts dropdown. @returns {void} */
function initOverlayAssignedDropdown() {
  const els = getOverlayAssignedDropdownEls();
  if (!els) return;
  bindOverlayAssignedInput(els);
  bindOverlayAssignedArrow(els);
  bindOverlayAssignedOutside(els);
}

/** @returns {OverlayAssignedElements|null} Assigned-dropdown DOM references. */
function getOverlayAssignedDropdownEls() {
  const input = document.getElementById("taskEditAssignedInput");
  const dropdown = document.getElementById("taskEditAssignedDropdown");
  const arrow = document.getElementById("taskEditDropdownArrow");
  if (!input || !dropdown || !arrow) return null;
  return { input: input, dropdown: dropdown, arrow: arrow };
}

/** @param {OverlayAssignedElements} els Assigned-dropdown elements. @returns {void} */
function bindOverlayAssignedInput(els) {
  els.input.addEventListener("click", function (e) {
    e.stopPropagation();
    openOverlayAssignedDropdown(els);
  });
}

/** @param {OverlayAssignedElements} els Assigned-dropdown elements. @returns {void} */
function bindOverlayAssignedArrow(els) {
  els.arrow.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleOverlayAssignedDropdown(els);
  });
}

/** @param {OverlayAssignedElements} els Assigned-dropdown elements. @returns {void} */
function bindOverlayAssignedOutside(els) {
  document.addEventListener("click", function (e) {
    if (e.target.closest(".multi-select")) return;
    closeOverlayAssignedDropdown(els);
  });
}

/** @param {OverlayAssignedElements} els Assigned-dropdown elements. @returns {void} */
function toggleOverlayAssignedDropdown(els) {
  const isHidden = els.dropdown.classList.contains("hidden");
  isHidden ? openOverlayAssignedDropdown(els) : closeOverlayAssignedDropdown(els);
}

/** @param {OverlayAssignedElements} els Assigned-dropdown elements. @returns {void} */
function openOverlayAssignedDropdown(els) {
  els.dropdown.classList.remove("hidden");
  els.arrow.classList.add("open");
}

/** @param {OverlayAssignedElements} els Assigned-dropdown elements. @returns {void} */
function closeOverlayAssignedDropdown(els) {
  els.dropdown.classList.add("hidden");
  els.arrow.classList.remove("open");
}

/** Rebuilds the assigned-contacts option list from cached contacts. @returns {void} */
function populateOverlayAssignedContacts() {
  const dropdown = document.getElementById("taskEditAssignedDropdown");
  if (!dropdown) return;
  resetOverlayAssignedDropdown(dropdown);
  const contacts = loadContacts();
  for (let i = 0; i < contacts.length; i++) {
    appendOverlayContactRow(dropdown, contacts[i]);
  }
}

/** @param {string|number} id Contact ID to toggle. @returns {void} */
function toggleOverlayContact(id) {
  const key = String(id);
  overlaySelectedContacts.has(key)
    ? overlaySelectedContacts.delete(key)
    : overlaySelectedContacts.add(key);
  updateOverlayAssignedCheckboxes();
  renderOverlaySelectedContacts();
}

/** Syncs contact checkboxes with the current selected-contact set. @returns {void} */
function updateOverlayAssignedCheckboxes() {
  const dropdown = document.getElementById("taskEditAssignedDropdown");
  if (!dropdown) return;
  const rows = dropdown.querySelectorAll(".contact-option");
  rows.forEach(function (row) {
    const id = row.dataset.id;
    if (!id) return;
    const input = row.querySelector('input[type="checkbox"]');
    if (!input) return;
    input.checked = overlaySelectedContacts.has(String(id));
  });
}

/** Renders selected-contact avatars in the assigned field. @returns {void} */
function renderOverlaySelectedContacts() {
  const text = document.getElementById("taskEditAssignedText");
  const avatarsWrap = document.getElementById("taskEditAssignedAvatars");
  if (!text) return;
  if (!avatarsWrap) return;
  avatarsWrap.innerHTML = "";
  if (!overlaySelectedContacts.size) {
    setOverlayAssignedText(text);
    return;
  }
  const view = buildOverlaySelectedContactsView();
  avatarsWrap.innerHTML = view.avatarsHtml + view.moreHtml;
  setOverlayAssignedText(text);
}

/** @param {BoardTask} task Task whose assignees should initialize the dropdown state. @returns {void} */
function setOverlayAssignedFromTask(task) {
  overlaySelectedContacts.clear();
  const assignedArr = normalizeAssignedArray(task.assigned);
  const contacts = loadContacts();
  const contactsById = buildContactsById(contacts);
  const byName = buildContactsByNameMap(contacts);
  applyAssignedSelections(assignedArr, contactsById, byName);
  populateOverlayAssignedContacts();
  renderOverlaySelectedContacts();
}

/** @param {HTMLElement} dropdown Assigned-dropdown container. @returns {void} */
function resetOverlayAssignedDropdown(dropdown) {
  dropdown.innerHTML = "";
  const text = document.getElementById("taskEditAssignedText");
  if (text) setOverlayAssignedText(text);
}

/** @param {HTMLElement} dropdown Assigned-dropdown container. @param {BoardContact} contact Contact to append. @returns {void} */
function appendOverlayContactRow(dropdown, contact) {
  if (!contact || !contact.id || !contact.name) return;
  const row = buildOverlayContactRow(contact);
  dropdown.appendChild(row);
}

/** @param {BoardContact} contact Contact to render. @returns {HTMLDivElement} Dropdown row element. */
function buildOverlayContactRow(contact) {
  const row = document.createElement("div");
  row.className = "contact-option";
  row.dataset.id = String(contact.id);
  row.innerHTML = getOverlayContactRowHtml(contact);
  row.onclick = function (e) {
    e.stopPropagation();
    toggleOverlayContact(contact.id);
  };
  return row;
}

/** @param {BoardContact} contact Contact to render. @returns {string} Contact row markup. */
function getOverlayContactRowHtml(contact) {
  const colorClass = getOverlayEditContactColorClass(contact);
  const checked = overlaySelectedContacts.has(String(contact.id)) ? "checked" : "";
  return (
    '<div class="contact-avatar ' +
    colorClass +
    '">' +
    getInitials(contact.name) +
    '</div><span>' +
    contact.name +
    '</span><input type="checkbox" ' +
    checked +
    ">"
  );
}

/** @param {HTMLElement} textEl Summary text element. @returns {void} */
function setOverlayAssignedText(textEl) {
  textEl.textContent = "Select contacts to assign";
}

/** @returns {{avatarsHtml: string, moreHtml: string}} Avatar markup for the current selection. */
function buildOverlaySelectedContactsView() {
  const contacts = loadContacts();
  const selectedIds = Array.from(overlaySelectedContacts);
  const visible = selectedIds.slice(0, 8);
  const remaining = selectedIds.length - visible.length;
  return {
    avatarsHtml: buildOverlayAvatarsHtml(contacts, visible),
    moreHtml: buildOverlayMoreHtml(remaining),
  };
}

/** @param {BoardContact[]} contacts Available contacts. @param {string[]} ids Selected contact IDs to render. @returns {string} Avatar markup. */
function buildOverlayAvatarsHtml(contacts, ids) {
  return ids
    .map(function (id) {
      const c = contacts.find(function (x) {
        return String(x.id) === String(id);
      });
      if (!c) return "";
      const colorClass = getOverlayEditContactColorClass(c);
      return '<span class="contact-avatar ' + colorClass + '">' + getInitials(c.name) + "</span>";
    })
    .join("");
}

/** @param {number} remaining Number of hidden selected contacts. @returns {string} Overflow avatar markup. */
function buildOverlayMoreHtml(remaining) {
  if (remaining <= 0) return "";
  return '<span class="contact-avatar contact-avatar-more">+' + remaining + "</span>";
}

/** @param {string|string[]|undefined} assigned Raw assigned value from a task. @returns {string[]} Normalized assignment array. */
function normalizeAssignedArray(assigned) {
  if (Array.isArray(assigned)) return assigned;
  if (assigned) return [assigned];
  return [];
}

/** @param {BoardContact[]} contacts Contact list. @returns {Map<string, string>} Contact IDs keyed by lowercase name. */
function buildContactsByNameMap(contacts) {
  const byName = new Map();
  for (let i = 0; i < contacts.length; i++) {
    if (contacts[i] && contacts[i].name && contacts[i].id) {
      byName.set(String(contacts[i].name).toLowerCase(), String(contacts[i].id));
    }
  }
  return byName;
}

/** @param {string[]} assignedArr Normalized assignee list. @param {Map<string, BoardContact>} contactsById Contact lookup by ID. @param {Map<string, string>} byName Contact IDs keyed by lowercase name. @returns {void} */
function applyAssignedSelections(assignedArr, contactsById, byName) {
  for (let i = 0; i < assignedArr.length; i++) {
    const key = String(assignedArr[i] || "");
    if (!key) continue;
    if (contactsById.has(key)) overlaySelectedContacts.add(key);
    else addAssignedByName(key, byName);
  }
}

/** @param {string} key Raw assignee value. @param {Map<string, string>} byName Contact IDs keyed by lowercase name. @returns {void} */
function addAssignedByName(key, byName) {
  const matchId = byName.get(key.toLowerCase());
  if (matchId) overlaySelectedContacts.add(matchId);
}
