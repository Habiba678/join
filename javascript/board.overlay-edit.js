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

  input.addEventListener("click", function () {
    dropdown.classList.toggle("hidden");
    arrow.classList.toggle("open");
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
    row.innerHTML =
      '<div class="contact-avatar ' +
      colorClass +
      '">' +
      getInitials(c.name) +
      '</div><span>' +
      c.name +
      '</span><input type="checkbox" ' +
      (overlaySelectedContacts.has(String(c.id)) ? "checked" : "") +
      ">";
    row.onclick = function () {
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
  populateOverlayAssignedContacts();
  renderOverlaySelectedContacts();
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
    btn.onclick = addOverlaySubtasksFromInput;
    input.onkeydown = function (e) {
      if (e.key === "Enter") addOverlaySubtasksFromInput();
    };
  }
  if (list) {
    list.onclick = function (e) {
      const remove = e.target.closest(".subtasks-remove");
      if (!remove) return;
      overlayPendingSubtasks.splice(remove.dataset.index, 1);
      renderOverlaySubtasksList();
    };
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
      if (overlayPendingSubtasks.length < 3) {
        overlayPendingSubtasks.push({ title: title, done: false });
      }
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
      '</span><button class="subtasks-remove" data-index="' +
      i +
      '">x</button></li>';
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

// ---------------- Drag & Drop (persist status) ----------------
