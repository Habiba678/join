// ================== ADD TASK → SAVE TO STORAGE ==================

/**
 * Currently selected priority value.
 * @type {string|null}
 */
let selectedPriority = null;

/**
 * Temporary list of subtasks before the task is saved.
 * @type {{title:string, done:boolean}[]}
 */
let pendingSubtasks = [];

/**
 * Stores selected contact IDs.
 * @type {Set<string>}
 */
const selectedContacts = new Set();

// ------------------ INIT ------------------

/**
 * Initializes the add task page once the DOM is loaded.
 * Sets up UI, listeners and loads contacts.
 */
document.addEventListener("DOMContentLoaded", () => {
  getCokkieCheck();
  populateAssignedContacts();
  initPriorityButtons();
  initSubtasks();
  initAssignedDropdown();
  initValidationModal();

  const root = getAddTaskRoot();
  const createBtn = root.querySelector("#createTaskBtn");
  const clearBtn = root.querySelector(".primary-btn.--primary-btn-cancel");

  if (createBtn) createBtn.addEventListener("click", createTask);
  if (clearBtn) clearBtn.addEventListener("click", clearForm);

  const dateInput = document.getElementById("date");
  if (!dateInput) return;

  const today = new Date().toISOString().split("T")[0];
  dateInput.setAttribute("min", today);
});

// ------------------ PRIORITY ------------------

/**
 * Initializes priority buttons and click behavior.
 * Ensures only one priority can be selected.
 */
function initPriorityButtons() {
  const buttons = getAddTaskRoot().querySelectorAll(
    ".priority-section .priority-btn",
  );

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("--selected"));
      btn.classList.add("--selected");
      selectedPriority = btn.textContent.trim();
    });
  });

  setDefaultPriority();
}

/**
 * Sets the default priority (medium) if available.
 */
function setDefaultPriority() {
  const root = getAddTaskRoot();
  const defaultBtn = root.querySelector(".priority-btn.medium");
  if (!defaultBtn) return;

  root
    .querySelectorAll(".priority-section .priority-btn")
    .forEach((b) => b.classList.remove("--selected"));

  defaultBtn.classList.add("--selected");
  selectedPriority = defaultBtn.textContent.trim();
}

// ------------------ SUBTASKS ------------------

/**
 * Initializes subtask input behavior and remove handling.
 */
function initSubtasks() {
  const input = document.getElementById("subtasks");
  const btn = document.getElementById("addSubtaskBtn");
  const clearBtn = document.getElementById("clearSubtaskBtn");
  const list = document.getElementById("subtasksList");

  const syncSubtaskButtons = () => {
    if (!input) return;
    const wrap = input.closest(".subtasks-input");
    if (!wrap) return;
    const hasValue = !!input.value.trim();
    wrap.classList.toggle("is-empty", !hasValue);
  };

  if (btn && input) {
    btn.onclick = addSubtasksFromInput;

    input.onkeydown = (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      addSubtasksFromInput();
    };
    input.addEventListener("input", syncSubtaskButtons);
  }

  if (clearBtn && input) {
    clearBtn.onclick = () => {
      input.value = "";
      input.focus();
      syncSubtaskButtons();
    };
  }

  syncSubtaskButtons();

  if (list) {
    list.onclick = (e) => {
      const item = e.target.closest(".subtasks-item");
      if (!item) return;

      const remove = e.target.closest(".subtasks-remove");
      const edit = e.target.closest(".subtasks-edit");
      const save = e.target.closest(".subtasks-save-edit");
      const cancel = e.target.closest(".subtasks-cancel-edit");

      if (remove) {
        const index = parseInt(remove.dataset.index, 10);
        if (isNaN(index)) return;
        pendingSubtasks.splice(index, 1);
        renderSubtasks();
        return;
      }

      if (edit) {
        const index = parseInt(edit.dataset.index, 10);
        if (isNaN(index) || !pendingSubtasks[index]) return;
        const currentTitle = pendingSubtasks[index].title || "";
        startInlineSubtaskEdit(item, index, currentTitle);
        return;
      }

      if (save) {
        const index = parseInt(save.dataset.index, 10);
        if (isNaN(index) || !pendingSubtasks[index]) return;
        const input = item.querySelector(".subtasks-edit-input");
        if (!input) return;
        const trimmed = input.value.trim();
        if (!trimmed) {
          renderSubtasks();
          return;
        }
        pendingSubtasks[index].title = trimmed;
        renderSubtasks();
        return;
      }

      if (cancel) {
        renderSubtasks();
      }
    };
  }
}

/**
 * Reads subtasks from the input field and adds them to the temporary list.
 * Supports comma, semicolon, or newline separation.
 */
function addSubtasksFromInput() {
  const input = document.getElementById("subtasks");
  if (!input || !input.value.trim()) return;

  input.value
    .split(/[,\n;]+/)
    .map((t) => t.trim())
    .forEach((title) => {
      if (!title) return;
      pendingSubtasks.push({ title, done: false });
    });

  input.value = "";
  renderSubtasks();
}

/**
 * Renders the current list of subtasks in the UI.
 */
function renderSubtasks() {
  const list = document.getElementById("subtasksList");
  if (!list) return;

  list.innerHTML = "";

  pendingSubtasks.forEach((s, i) => {
    list.innerHTML += `
      <li class="subtasks-item">
        <span>${s.title}</span>
        <div class="subtasks-actions">  
        <button class="subtasks-edit" data-index="${i}"><img src="../assets/icons/edit-gray.svg" alt="Edit subtask ${s.title}"></button>
       <span class="subtasks-separator"></span> <button class="subtasks-remove" data-index="${i}"><img src="../assets/icons/delete.svg" alt="Remove subtask ${s.title}"></button>
      </div></li>`;
  });
}

/**
 * Switches a subtask list item into inline edit mode
 * using an input field instead of a prompt.
 * @param {HTMLElement} item
 * @param {number} index
 * @param {string} title
 */
function startInlineSubtaskEdit(item, index, title) {
  if (!item) return;
  item.innerHTML = "";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "subtasks-edit-input";
  input.value = title || "";

  const actions = document.createElement("div");
  actions.className = "subtasks-actions";

  const saveBtn = document.createElement("button");
  saveBtn.className = "subtasks-save-edit";
  saveBtn.dataset.index = String(index);
  saveBtn.innerHTML = '<img src="../assets/icons/check-black.svg" alt="Save subtask">';

  const sep = document.createElement("span");
  sep.className = "subtasks-separator";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "subtasks-cancel-edit";
  cancelBtn.dataset.index = String(index);
  cancelBtn.innerHTML = '<img src="../assets/icons/iconoir_cancel.svg" alt="Cancel edit">';

  actions.appendChild(saveBtn);
  actions.appendChild(sep);
  actions.appendChild(cancelBtn);

  item.appendChild(input);
  item.appendChild(actions);

  input.focus();
  const len = input.value.length;
  input.setSelectionRange(len, len);
}

// ------------------ CONTACTS / MULTI SELECT ------------------

/**
 * Loads contacts and populates the assign dropdown.
 */
async function populateAssignedContacts() {
  const dropdown = document.getElementById("assignedDropdown");
  if (!dropdown) return;

  dropdown.innerHTML = "";
  const contactsData = await loadContactsFromStorage();

  const list = Array.isArray(contactsData)
    ? contactsData
    : Object.values(contactsData || {});

  list.forEach((c) => {
    if (!c?.id || !c?.name) return;

    const colorClass = getContactColorClass(c);

    const row = document.createElement("div");
    row.className = "contact-option";
    row.dataset.id = String(c.id);

    row.innerHTML = `
      <div class="contact-avatar ${colorClass}">${getInitials(c.name)}</div>
      <span>${c.name}</span>
      <input type="checkbox" ${selectedContacts.has(c.id) ? "checked" : ""}>
    `;

    row.onclick = (e) => {
      e.stopPropagation();
      toggleContact(c.id);
    };
    dropdown.appendChild(row);
  });
}

/**
 * Toggles selection state of a contact.
 * @param {string} id Contact ID
 */
function toggleContact(id) {
  selectedContacts.has(id) ? selectedContacts.delete(id) : selectedContacts.add(id);
  updateAssignedCheckboxes();
  renderSelectedContacts();
}

/**
 * Updates the checked state of checkboxes in the existing
 * dropdown without rebuilding all rows.
 */
function updateAssignedCheckboxes() {
  const dropdown = document.getElementById("assignedDropdown");
  if (!dropdown) return;
  const rows = dropdown.querySelectorAll(".contact-option");
  rows.forEach((row) => {
    const id = row.dataset.id;
    if (!id) return;
    const input = row.querySelector('input[type="checkbox"]');
    if (!input) return;
    input.checked = selectedContacts.has(id);
  });
}

/**
 * Renders selected contacts as avatars.
 */
async function renderSelectedContacts() {
  const text = document.getElementById("assignedText");
  if (!text) return;

  if (!selectedContacts.size) {
    text.textContent = "Select contacts to assign";
    return;
  }
 const limit = 8;
  if (selectedContacts.size > limit) {
    text.textContent = `${selectedContacts.size} contacts selected`;
    return;
  }
  const contactsData = await loadContactsFromStorage();
  const list = Array.isArray(contactsData) ? contactsData : Object.values(contactsData || {});
  text.innerHTML = [...selectedContacts]
    .map((id) => {
      const c = list.find((x) => x.id === id);
      const colorClass = getContactColorClass(c || {});
      return `<span class="contact-avatar ${colorClass}">${getInitials(c?.name || "")}</span>`;
    })
    .join("");
}

/**
 * Initializes dropdown behavior for the contact selector.
 */
function initAssignedDropdown() {
  const input = document.getElementById("assignedInput");
  const dropdown = document.getElementById("assignedDropdown");
  const arrow = document.getElementById("dropdownArrow");
  if (!input || !dropdown || !arrow) return;

  input.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.remove("hidden");
    arrow.classList.add("open");
  };

  arrow.onclick = (e) => {
    e.stopPropagation();
    const isHidden = dropdown.classList.contains("hidden");
    if (isHidden) {
      dropdown.classList.remove("hidden");
      arrow.classList.add("open");
    } else {
      dropdown.classList.add("hidden");
      arrow.classList.remove("open");
    }
  };

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".multi-select")) {
      dropdown.classList.add("hidden");
      arrow.classList.remove("open");
    }
  });
}

// ------------------ TASK CREATE ------------------

/**
 * Creates a new task and saves it to Firebase.
 * Also reloads tasks from the database and updates the board.
 */
async function createTask() {
  const titleEl = document.getElementById("title");
  const descriptionEl = document.getElementById("description");
  const dueDateEl = document.getElementById("date");
  const categoryEl = document.getElementById("category");
  const subInput = document.getElementById("subtasks");
  if (subInput && subInput.value.trim()) addSubtasksFromInput();

  const title = titleEl?.value.trim() || "";
  const description = descriptionEl?.value.trim() || "";
  const dueDate = dueDateEl?.value || "";
  const category = categoryEl?.value || "";

  const dbTask = "https://join-da53b-default-rtdb.firebaseio.com/";
  let id = Date.now().toString();

  if (!title || !dueDate || !category) {
    openValidationModal();
    return;
  }

  const task = {
    id,
    title,
    description,
    dueDate,
    category,
    priority: selectedPriority,
    status: getAddTaskStatus(),
    subtasks: [...pendingSubtasks],
    assigned: [...selectedContacts],
  };

  try {
    const response = await fetch(dbTask + `tasks/${id}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });

    await response.json();
  } catch (e) {
    console.error("Failed to save task remotely", e);
  }

  try {
    const resp = await fetch(dbTask + "tasks.json");
    const data = await resp.json();

    let tasks = [];

    if (!data) {
      tasks = [];
    } else if (Array.isArray(data)) {
      tasks = data.filter(Boolean);
    } else {
      tasks = Object.entries(data).map(([key, val]) => ({
        ...(val || {}),
        id: val && val.id ? val.id : key,
      }));
    }

    await saveTasks(tasks);

    if (typeof renderBoardFromStorage === "function") renderBoardFromStorage();
    if (typeof updateEmptyStates === "function") updateEmptyStates();

    const overlay = document.getElementById("addTaskOverlayBackdrop");

    if (overlay) {
      if (typeof closeAddTaskOverlay === "function") closeAddTaskOverlay();
      return;
    }

    location.href = "./board.html";
  } catch (e) {
    console.error("Failed to load tasks from remote DB; keeping overlay open for retry", e);

    const overlay = document.getElementById("addTaskOverlayBackdrop");
    if (!overlay) {
      location.href = "./board.html";
    }

    return;
  }

  location.href = "./board.html";
}

/**
 * Loads contacts from Firebase storage.
 * Includes multiple fallback strategies in case the structure differs.
 * @returns {Promise<Object[]>}
 */
async function loadContactsFromStorage() {
  const dbTask = "https://join-da53b-default-rtdb.firebaseio.com/";

  try {
    try {
      const response = await fetch(dbTask + "contacts.json");
      const data = await response.json();

      if (data != null) {
        if (Array.isArray(data)) return data.filter(Boolean);
        return Object.values(data);
      }
    } catch (e) {
      console.error("Failed to load contacts from direct node, trying root inspection", e);
    }

    try {
      const resp = await fetch(dbTask + ".json");
      const root = await resp.json();
      if (!root) return [];

      if (root.contacts !== undefined) {
        const data = root.contacts;

        if (Array.isArray(data)) return data.filter(Boolean);
        return Object.values(data);
      }

      if (Array.isArray(root)) {
        const entry = root.find((e) => e && e.id === "contacts");

        if (entry) {
          const clone = Object.assign({}, entry);
          delete clone.id;

          if (clone.contacts !== undefined) {
            const data = clone.contacts;
            if (Array.isArray(data)) return data.filter(Boolean);
            return Object.values(data);
          }

          if (Array.isArray(clone)) return clone.filter(Boolean);
          return Object.values(clone);
        }
      }

      if (typeof root === "object") {
        const vals = Object.values(root);

        for (let i = 0; i < vals.length; i++) {
          const e = vals[i];

          if (e && e.id === "contacts") {
            const clone = Object.assign({}, e);
            delete clone.id;

            if (clone.contacts !== undefined) {
              const data = clone.contacts;
              if (Array.isArray(data)) return data.filter(Boolean);
              return Object.values(data);
            }

            if (Array.isArray(clone)) return clone.filter(Boolean);
            return Object.values(clone);
          }
        }
      }

      return [];
    } catch (e) {
      console.error("Failed to inspect DB root for contacts", e);
      return [];
    }
  } catch (e) {
    console.error("Failed to load contacts", e);
    return [];
  }
}

// ------------------ HELPERS ------------------

/**
 * Creates initials from a full name.
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/**
 * Generates a simple numeric hash from a string.
 * Used to create consistent avatar colors.
 * @param {string} str
 * @returns {number}
 */
function hashString(str) {
  let h = 0;
  const s = String(str || "");

  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;

  return Math.abs(h);
}

/**
 * Returns a color class based on a seed value.
 * @param {string} seed
 * @returns {string}
 */
function colorClassFor(seed) {
  return "avatar-color-" + (hashString(seed) % 12);
}

/**
 * Determines the avatar color class for a contact.
 * @param {{id?:string,email?:string,name?:string,colorClass?:string}} contact
 * @returns {string}
 */
function getContactColorClass(contact) {
  if (contact && contact.colorClass) return contact.colorClass;

  const seed = contact?.id || contact?.email || contact?.name || "";
  return colorClassFor(seed);
}

// ------------------ CLEAR ------------------

/**
 * Clears the entire add task form and resets internal state.
 */
function clearForm() {
  const root = getAddTaskRoot();

  const title = document.getElementById("title");
  const description = document.getElementById("description");
  const dueDate = document.getElementById("date");
  const category = document.getElementById("category");
  const assigned = document.getElementById("assigned");
  const subtaskInput = document.getElementById("subtasks");
  const priorityBtns = root.querySelectorAll(".priority-section li");
 
  if (title) title.value = "";
  if (description) description.value = "";
  if (dueDate) dueDate.value = "";
  if (category) category.value = "";
  if (assigned) assigned.value = "";
  if (subtaskInput) subtaskInput.value = "";

  if (selectedContacts) selectedContacts.clear();

  pendingSubtasks = [];

  renderSubtasks();

  priorityBtns.forEach((btn) => btn.classList.remove("--selected"));

  selectedPriority = null;

  populateAssignedContacts();
  renderSelectedContacts();
  setDefaultPriority();
}

/**
 * Resets the add task form.
 */
function resetAddTaskForm() {
  clearForm();
}

/**
 * Returns the root container for the add task page.
 * Falls back to the document if the container is not found.
 * @returns {HTMLElement|Document}
 */
function getAddTaskRoot() {
  return document.getElementById("addTaskRoot") || document;
}

// ------------------ ADD TASK CONTEXT ------------------

/**
 * Determines the task status based on overlay data
 * or URL query parameters.
 * @returns {string}
 */
function getAddTaskStatus() {
  const overlay = document.getElementById("addTaskOverlayBackdrop");

  if (overlay && overlay.dataset && overlay.dataset.status) {
    return overlay.dataset.status;
  }

  return new URLSearchParams(location.search).get("status") || "todo";
}

// ------------------ VALIDATION MODAL ------------------

/**
 * Initializes validation modal behavior.
 */
function initValidationModal() {
  const modal = document.getElementById("validationModal");
  const closeBtn = document.getElementById("validationClose");
  const okBtn = document.getElementById("validationOk");

  if (!modal) return;

  if (closeBtn) closeBtn.addEventListener("click", closeValidationModal);
  if (okBtn) okBtn.addEventListener("click", closeValidationModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeValidationModal();
  });
}

/**
 * Opens the validation modal.
 */
function openValidationModal() {
  const modal = document.getElementById("validationModal");
  if (!modal) return;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

/**
 * Closes the validation modal.
 */
function closeValidationModal() {
  const modal = document.getElementById("validationModal");
  if (!modal) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}


// addTasks.html Select fild Aniemation
function selectAnimate() {
  const wrapper = document.querySelector(".select-wrapper");
  wrapper.classList.toggle("open");
}
