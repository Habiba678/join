/** Initializes shared overlay-edit widgets. @returns {void} */
function initOverlayEditWidgets() {
  initOverlayPriorityButtons();
  initOverlayAssignedDropdown();
  initOverlaySubtasks();
  setOverlayDueMin();
}

/** Sets the minimum allowed due date to today. @returns {void} */
function setOverlayDueMin() {
  const dateInput = document.getElementById("taskEditDue");
  if (!dateInput) return;
  const today = getLocalDateInputValue();
  dateInput.setAttribute("min", today);
}

/** @param {Date} [date=new Date()] Source date. @returns {string} Local date in `YYYY-MM-DD` format. */
function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Binds overlay priority buttons and restores the current selection. @returns {void} */
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

/** @param {string} value Priority value to mark as selected. @returns {void} */
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
