// ================== ADD TASK → SAVE TO STORAGE ==================

let selectedPriority = null;
let pendingSubtasks = [];
const selectedContacts = new Set();

// ------------------ INIT ------------------
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
});

// ------------------ PRIORITY ------------------
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
function initSubtasks() {
  const input = document.getElementById("subtasks");
  const btn = document.getElementById("addSubtaskBtn");
  const list = document.getElementById("subtasksList");

  if (btn && input) {
    btn.onclick = addSubtasksFromInput;
    input.onkeydown = (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      addSubtasksFromInput();
    };
  }

  if (list) {
    list.onclick = (e) => {
      const remove = e.target.closest(".subtasks-remove");
      if (!remove) return;
      pendingSubtasks.splice(remove.dataset.index, 1);
      renderSubtasks();
    };
  }
}

function addSubtasksFromInput() {
  const input = document.getElementById("subtasks");
  if (!input || !input.value.trim()) return;

  input.value
    .split(/[,\n;]+/)
    .map((t) => t.trim())
    .forEach((title) => {
      if (pendingSubtasks.length < 3) {
        pendingSubtasks.push({ title, done: false });
      }
    });

  input.value = "";
  renderSubtasks();
}

function renderSubtasks() {
  const list = document.getElementById("subtasksList");
  if (!list) return;

  list.innerHTML = "";
  pendingSubtasks.forEach((s, i) => {
    list.innerHTML += `
      <li class="subtasks-item">
        <span>${s.title}</span>
        <button class="subtasks-remove" data-index="${i}">x</button>
      </li>`;
  });
}

// ------------------ CONTACTS / MULTI SELECT ------------------
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
    row.innerHTML = `
      <div class="contact-avatar ${colorClass}">${getInitials(c.name)}</div>
      <span>${c.name}</span>
      <input type="checkbox" ${selectedContacts.has(c.id) ? "checked" : ""}>
    `;

    row.onclick = () => toggleContact(c.id);
    dropdown.appendChild(row);
  });
}

function toggleContact(id) {
  selectedContacts.has(id)
    ? selectedContacts.delete(id)
    : selectedContacts.add(id);

  populateAssignedContacts();
  renderSelectedContacts();
}


async function renderSelectedContacts() {
  const text = document.getElementById("assignedText");
  if (!text) return;

  if (!selectedContacts.size) {
    text.textContent = "Select contacts to assign";
    return;
  }

  const contactsData = await loadContactsFromStorage();
  const list = Array.isArray(contactsData)
    ? contactsData
    : Object.values(contactsData || {});

  text.innerHTML = [...selectedContacts]
    .map((id) => {
      const c = list.find((x) => x.id === id);
      const colorClass = getContactColorClass(c || {});
      return `<span class="contact-avatar ${colorClass}">${getInitials(c?.name || "")}</span>`;
    })
    .join("");
}

function initAssignedDropdown() {
  const input = document.getElementById("assignedInput");
  const dropdown = document.getElementById("assignedDropdown");
  const arrow = document.getElementById("dropdownArrow");
  if (!input || !dropdown || !arrow) return;

  input.onclick = () => {
    dropdown.classList.toggle("hidden");
    arrow.classList.toggle("open");
  };

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".multi-select")) {
      dropdown.classList.add("hidden");
      arrow.classList.remove("open");
    }
  });
}

// ------------------ TASK CREATE ------------------
async function createTask() {
 const titleEl = document.getElementById("titel");
 const descriptionEl = document.getElementById("description");
 const dueDateEl = document.getElementById("date");
 const categoryEl = document.getElementById("category");
 const title = titleEl?.value.trim() || "";
 const description = descriptionEl?.value.trim() || "";
 const dueDate = dueDateEl?.value || "";
 const category = categoryEl?.value || "";
 const dbTask = "https://join-da53b-default-rtdb.firebaseio.com/";
 let id = Date.now().toString();

  if (!title || !dueDate || !category) { openValidationModal(); return;}

  const task = {
    id, title, description, dueDate, category, priority: selectedPriority, status: getAddTaskStatus(),subtasks: [...pendingSubtasks], assigned: [...selectedContacts],
  };

  try {
    const response = await fetch(dbTask + `tasks/${id}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    await response.json();
  } catch (e) {console.error("Failed to save task remotely", e);}


  try {
    const resp = await fetch(dbTask + "tasks.json");
    const data = await resp.json();
    let tasks = [];
    if (!data) { tasks = []; } else if (Array.isArray(data)) { tasks = data.filter(Boolean);} else { tasks = Object.entries(data).map(([key, val]) => ({...(val || {}), id: val && val.id ? val.id : key,}));
    }
    console.log("Loaded tasks from DB:", tasks.length, tasks.slice(0, 3));
    await saveTasks(tasks);
    if (typeof renderBoardFromStorage === "function") renderBoardFromStorage();
    if (typeof updateEmptyStates === "function") updateEmptyStates();

    const overlay = document.getElementById("addTaskOverlayBackdrop");
    if (overlay) {
      if (typeof closeAddTaskOverlay === "function") closeAddTaskOverlay();
      return; }  location.href = "./board.html";
  } catch (e) {
    console.error( "Failed to load tasks from remote DB; keeping overlay open for retry",e,);
    const overlay = document.getElementById("addTaskOverlayBackdrop");
    if (!overlay) {location.href = "./board.html";}
    return;
  }
  location.href = "./board.html";
}


async function loadContactsFromStorage() {
  const dbTask = "https://join-da53b-default-rtdb.firebaseio.com/";
  try {
    // Try direct node first
    try {
      const response = await fetch(dbTask + "contacts.json");
      const data = await response.json();
      if (data != null) {
        if (Array.isArray(data)) return data.filter(Boolean);
        return Object.values(data);
      }
    } catch (e) {
      console.error(
        "Failed to load contacts from direct node, trying root inspection",
        e,
      );
    }

    try {
      const resp = await fetch(dbTask + ".json");
      const root = await resp.json();
      if (!root) return [];

      if (root.contacts !== undefined) {
        const data = root.contacts;
        console.info("loadContactsFromStorage: loaded from root.contacts");
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
            console.info(
              "loadContactsFromStorage: loaded from root entry.contacts",
            );
            if (Array.isArray(data)) return data.filter(Boolean);
            return Object.values(data);
          }
          console.info(
            "loadContactsFromStorage: loaded from root entry (as map)",
          );
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
              console.info(
                "loadContactsFromStorage: loaded from object value.contacts",
              );
              if (Array.isArray(data)) return data.filter(Boolean);
              return Object.values(data);
            }
            console.info(
              "loadContactsFromStorage: loaded from object value (as map)",
            );
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
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function hashString(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function colorClassFor(seed) {
  return "avatar-color-" + (hashString(seed) % 12);
}

function getContactColorClass(contact) {
  if (contact && contact.colorClass) return contact.colorClass;
  const seed = contact?.id || contact?.email || contact?.name || "";
  return colorClassFor(seed);
}

// ------------------ CLEAR ------------------
function clearForm() {
  const root = getAddTaskRoot();
  const title = document.getElementById("titel");
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

function resetAddTaskForm() {
  clearForm();
}

function getAddTaskRoot() {
  return document.getElementById("addTaskRoot") || document;
}

// ------------------ ADD TASK CONTEXT ------------------
function getAddTaskStatus() {
  const overlay = document.getElementById("addTaskOverlayBackdrop");
  if (overlay && overlay.dataset && overlay.dataset.status) {
    return overlay.dataset.status;
  }
  return new URLSearchParams(location.search).get("status") || "todo";
}

// ------------------ VALIDATION MODAL ------------------
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
