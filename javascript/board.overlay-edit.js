// ---------------- Delete confirm ----------------
function initDeleteConfirm() {
  const els = getDeleteConfirmEls();
  if (!els) return;
  bindDeleteConfirmOk(els);
  bindDeleteConfirmCancel(els);
  bindDeleteConfirmBackdrop(els);
  bindDeleteConfirmEsc(els);
}

function getDeleteConfirmEls() {
  const backdrop = document.getElementById("deleteConfirmBackdrop");
  const okBtn = document.getElementById("deleteConfirmOk");
  const cancelBtn = document.getElementById("deleteConfirmCancel");
  const textEl = document.getElementById("deleteConfirmText");
  if (!backdrop || !okBtn || !cancelBtn || !textEl) {
    console.warn("Delete confirm elements not found.");
    return null;
  }
  return { backdrop: backdrop, okBtn: okBtn, cancelBtn: cancelBtn, textEl: textEl };
}

function bindDeleteConfirmOk(els) {
  els.okBtn.addEventListener("click", function () {
    handleDeleteConfirmOk();
  });
}

function bindDeleteConfirmCancel(els) {
  els.cancelBtn.addEventListener("click", function () {
    handleDeleteConfirmCancel();
  });
}

function bindDeleteConfirmBackdrop(els) {
  els.backdrop.addEventListener("click", function (e) {
    if (e.target === els.backdrop) closeDeleteConfirm();
  });
}

function bindDeleteConfirmEsc(els) {
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !els.backdrop.hidden) closeDeleteConfirm();
  });
}

function openDeleteConfirm(id) {
  const task = findTaskById(id);
  if (!task) return;
  pendingDeleteId = String(id);
  setDeleteConfirmText(task);
  showDeleteConfirm();
}

function setDeleteConfirmText(task) {
  const el = document.getElementById("deleteConfirmText");
  if (!el) return;
  el.textContent = 'Delete task "' + task.title + '"?';
}

function showDeleteConfirm() {
  const backdrop = document.getElementById("deleteConfirmBackdrop");
  if (!backdrop) return;
  backdrop.hidden = false;
}

function closeDeleteConfirm() {
  const backdrop = document.getElementById("deleteConfirmBackdrop");
  if (!backdrop) return;
  backdrop.hidden = true;
  pendingDeleteId = null;
}

function handleDeleteConfirmOk() {
  if (!pendingDeleteId) return closeDeleteConfirm();
  removeTaskById(pendingDeleteId);
  closeDeleteConfirm();
  closeTaskOverlay();
  renderBoardFromStorage();
}

function handleDeleteConfirmCancel() {
  closeDeleteConfirm();
}

// ---------------- Delete / Edit ----------------
function deleteTask(id) {
  openDeleteConfirm(id);
}

function removeTaskById(id) {
  const tasks = getTasks();
  const next = [];
  for (let i = 0; i < tasks.length; i++) {
    if (String(tasks[i].id) !== String(id)) next.push(tasks[i]);
  }
  saveTasks(next);
}

function findTaskIndexById(id, tasks) {
  for (let i = 0; i < tasks.length; i++) {
    if (String(tasks[i].id) === String(id)) return i;
  }
  return -1;
}

function fillOverlayEditForm(task) {
  setInputValue("taskEditTitle", task.title || "");
  setInputValue("taskEditDesc", task.description || "");
  setInputValue("taskEditDue", task.dueDate || task.due || "");
  const pr = String(task.priority || task.prio || "medium").toLowerCase();
  setOverlayPriorityButtons(pr);
  setOverlayAssignedFromTask(task);
  setOverlaySubtasksFromTask(task);
}

async function saveOverlayEdits(id, els) {
  const tasks = getTasks();
  const idx = findTaskIndexById(id, tasks);
  if (idx === -1) return;
  const values = readOverlayEditForm();
  if (!values) return;
  tasks[idx] = buildEditedTaskFromForm(tasks[idx], values);

  // Persist and ensure storage is updated before reading it again
  await saveTasks(tasks);

  // Exit edit mode and refresh the overlay view from the saved task
  try {
    exitOverlayEditMode(els);
  } catch (e) {
    /* ignore if els not provided */
  }

  const task = tasks[idx];
  // Update view parts directly so overlay shows current data immediately
  if (typeof setOverlayCategory === "function") setOverlayCategory(task);
  if (typeof setOverlayTexts === "function") setOverlayTexts(task);
  if (typeof setOverlayPriority === "function") setOverlayPriority(task);
  if (typeof renderOverlayAssigned === "function") renderOverlayAssigned(task);
  if (typeof renderOverlaySubtasks === "function") renderOverlaySubtasks(task);

  // Refresh board cards
  if (typeof renderBoardFromStorage === "function") renderBoardFromStorage();
}

function readOverlayEditForm() {
  const title = getInputValue("taskEditTitle").trim();
  if (!title) {
    alert("Title is required");
    return null;
  }
  return {
    title: title,
    description: getInputValue("taskEditDesc").trim(),
    dueDate: getInputValue("taskEditDue"),
    priority: overlaySelectedPriority || "medium",
    assigned: Array.from(overlaySelectedContacts),
    subtasks: overlayPendingSubtasks.map((s) => ({ title: s.title, done: !!s.done })),
  };
}

function buildEditedTaskFromForm(t, values) {
  let assignedValue = "";
  if (values.assigned.length === 1) assignedValue = values.assigned[0];
  if (values.assigned.length > 1) assignedValue = values.assigned;

  return {
    title: values.title,
    description: values.description,
    id: t.id,
    dueDate: values.dueDate,
    category: t.category,
    priority: values.priority,
    status: t.status,
    subtasks: values.subtasks,
    assigned: assignedValue,
  };
}

// ---------------- Overlay edit widgets ----------------
function initOverlayEditWidgets() {
  initOverlayPriorityButtons();
  initOverlayAssignedDropdown();
  initOverlaySubtasks();
  setOverlayDueMin();
}

function setOverlayDueMin() {
  const dateInput = document.getElementById("taskEditDue");
  if (!dateInput) return;
  const today = new Date().toISOString().split("T")[0];
  dateInput.setAttribute("min", today);
}

function initOverlayPriorityButtons() {
  const wrap = document.getElementById("taskEditPriority");
  if (!wrap) return;
  const buttons = wrap.querySelectorAll(".priority-btn");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function () {
      setOverlayPriorityButtons(buttons[i].dataset.value || "medium");
    });
  }
  setOverlayPriorityButtons(overlaySelectedPriority || "medium");
}

function setOverlayPriorityButtons(value) {
  const wrap = document.getElementById("taskEditPriority");
  if (!wrap) return;
  const buttons = wrap.querySelectorAll(".priority-btn");
  overlaySelectedPriority = String(value || "medium").toLowerCase();
  for (let i = 0; i < buttons.length; i++) {
    const btnValue = String(buttons[i].dataset.value || "").toLowerCase();
    if (btnValue === overlaySelectedPriority) buttons[i].classList.add("--selected");
    else buttons[i].classList.remove("--selected");
  }
}

function initOverlayAssignedDropdown() {
  const input = document.getElementById("taskEditAssignedInput");
  const dropdown = document.getElementById("taskEditAssignedDropdown");
  const arrow = document.getElementById("taskEditDropdownArrow");
  if (!input || !dropdown || !arrow) return;

  input.addEventListener("click", function (e) {
    e.stopPropagation();
    dropdown.classList.remove("hidden");
    arrow.classList.add("open");
  });

  arrow.addEventListener("click", function (e) {
    e.stopPropagation();
    const isHidden = dropdown.classList.contains("hidden");
    if (isHidden) {
      dropdown.classList.remove("hidden");
      arrow.classList.add("open");
    } else {
      dropdown.classList.add("hidden");
      arrow.classList.remove("open");
    }
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".multi-select")) {
      dropdown.classList.add("hidden");
      arrow.classList.remove("open");
    }
  });
}

function populateOverlayAssignedContacts() {
  const dropdown = document.getElementById("taskEditAssignedDropdown");
  if (!dropdown) return;
  dropdown.innerHTML = "";
  const contacts = loadContacts();
  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i];
    if (!c || !c.id || !c.name) continue;
    const colorClass = getOverlayEditContactColorClass(c);
    const row = document.createElement("div");
    row.className = "contact-option";
    row.dataset.id = String(c.id);
    row.innerHTML =
      '<div class="contact-avatar ' + colorClass + '">' +getInitials(c.name) + '</div><span>' + c.name + '</span><input type="checkbox" ' + (overlaySelectedContacts.has(String(c.id)) ? "checked" : "") +">";
    row.onclick = function (e) {
      e.stopPropagation();
      toggleOverlayContact(c.id);
    };
    dropdown.appendChild(row);
  }
}

function toggleOverlayContact(id) {
  const key = String(id);
  overlaySelectedContacts.has(key)
    ? overlaySelectedContacts.delete(key)
    : overlaySelectedContacts.add(key);
  updateOverlayAssignedCheckboxes();
  renderOverlaySelectedContacts();
}

/**
 * Updates the checked state of checkboxes in the overlay
 * contacts dropdown without rebuilding all rows.
 */
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

function renderOverlaySelectedContacts() {
  const text = document.getElementById("taskEditAssignedText");
  const avatarsWrap = document.getElementById("taskEditAssignedAvatars");
  if (!text) return;
  text.textContent = "Select contacts to assign";
  if (!avatarsWrap) return;
  avatarsWrap.innerHTML = "";
  if (!overlaySelectedContacts.size) return;
  const contacts = loadContacts();
  avatarsWrap.innerHTML = Array.from(overlaySelectedContacts)
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

function setOverlayAssignedFromTask(task) {
  overlaySelectedContacts.clear();
  const assignedArr = Array.isArray(task.assigned)
    ? task.assigned
    : task.assigned
    ? [task.assigned]
    : [];
  const contacts = loadContacts();
  const contactsById = buildContactsById(contacts);
  const byName = new Map();
  for (let i = 0; i < contacts.length; i++) {
    if (contacts[i] && contacts[i].name && contacts[i].id) {
      byName.set(String(contacts[i].name).toLowerCase(), String(contacts[i].id));
    }
  }
  for (let i = 0; i < assignedArr.length; i++) {
    const key = String(assignedArr[i] || "");
    if (!key) continue;
    if (contactsById.has(key)) overlaySelectedContacts.add(key);
    else {
      const matchId = byName.get(key.toLowerCase());
      if (matchId) overlaySelectedContacts.add(matchId);
    }
  }
  populateOverlayAssignedContacts();
  renderOverlaySelectedContacts();
}

function initOverlaySubtasks() {
  const input = document.getElementById("taskEditSubtaskInput");
  const btn = document.getElementById("taskEditAddSubtaskBtn");
  const list = document.getElementById("taskEditSubtasksList");

  if (btn && input) {
    btn.addEventListener("click", addOverlaySubtasksFromInput);

    input.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      addOverlaySubtasksFromInput();
    });
  }

  if (list) {
    list.addEventListener("click", function (e) {
      const item = e.target.closest(".subtasks-item");
      if (!item) return;

      const remove = e.target.closest(".subtasks-remove");
      const edit = e.target.closest(".subtasks-edit");
      const save = e.target.closest(".subtasks-save-edit");
      const cancel = e.target.closest(".subtasks-cancel-edit");

      if (remove) {
        const index = parseInt(remove.dataset.index, 10);
        if (!isNaN(index)) {
          overlayPendingSubtasks.splice(index, 1);
          renderOverlaySubtasksList();
        }
        return;
      }

      if (edit) {
        const index = parseInt(edit.dataset.index, 10);
        if (isNaN(index) || !overlayPendingSubtasks[index]) return;
        const currentTitle = overlayPendingSubtasks[index].title || "";
        startOverlayInlineSubtaskEdit(item, index, currentTitle);
        return;
      }

      if (save) {
        const index = parseInt(save.dataset.index, 10);
        if (isNaN(index) || !overlayPendingSubtasks[index]) return;
        const input = item.querySelector(".subtasks-edit-input");
        if (!input) return;
        const trimmed = input.value.trim();
        if (!trimmed) {
          renderOverlaySubtasksList();
          return;
        }
        overlayPendingSubtasks[index].title = trimmed;
        renderOverlaySubtasksList();
        return;
      }

      if (cancel) {
        renderOverlaySubtasksList();
      }
    });
  }
}

function addOverlaySubtasksFromInput() {
  const input = document.getElementById("taskEditSubtaskInput");
  if (!input || !input.value.trim()) return;
  input.value
    .split(/[,\n;]+/)
    .map(function (t) {
      return t.trim();
    })
    .forEach(function (title) {
      if (!title) return;
      overlayPendingSubtasks.push({ title: title, done: false });
    });
  input.value = "";
  renderOverlaySubtasksList();
}

function renderOverlaySubtasksList() {
  const list = document.getElementById("taskEditSubtasksList");
  if (!list) return;
  list.innerHTML = "";
  for (let i = 0; i < overlayPendingSubtasks.length; i++) {
    list.innerHTML +=
      '<li class="subtasks-item"><span>' +
      overlayPendingSubtasks[i].title +
      '</span><div class="subtasks-actions"><button class="subtasks-edit" data-index="' +
      i +
      '" ><img class="subtasks-icon" src="../assets/icons/edit-gray.svg" alt="Edit subtask"></button><span class="subtasks-separator"></span><button class="subtasks-remove" data-index="' +
      i +
      '"><img class="subtasks-icon"src="../assets/icons/delete.svg" alt="Remove subtask"></button></div></li > ';
  }
}

function setOverlaySubtasksFromTask(task) {
  overlayPendingSubtasks = Array.isArray(task.subtasks)
    ? task.subtasks.map(function (s) {
        return { title: s.title, done: !!s.done };
      })
    : [];
  renderOverlaySubtasksList();
}

function getOverlayEditContactColorClass(contact) {
  if (typeof getContactColorClass === "function") return getContactColorClass(contact);
  if (contact && contact.colorClass) return contact.colorClass;
  const seed = contact?.id || contact?.email || contact?.name || "";
  return "avatar-color-" + (overlayEditHashString(seed) % 12);
}

function overlayEditHashString(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Switches an overlay subtask list item into inline edit mode
 * using an input field instead of a prompt.
 * @param {HTMLElement} item
 * @param {number} index
 * @param {string} title
 */
function startOverlayInlineSubtaskEdit(item, index, title) {
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
  saveBtn.innerHTML = '<img src="../assets/icons/check.svg" alt="Save subtask">';

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

// ---------------- Drag & Drop (persist status) ----------------
