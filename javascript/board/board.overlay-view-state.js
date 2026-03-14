/** Shows the task overlay and locks body scrolling. @returns {void} */
function showOverlay() {
  const backdrop = document.getElementById("taskOverlayBackdrop");
  if (!backdrop) return;
  backdrop.hidden = false;
  updateBodyScrollLock();
}

/** Hides the task overlay and resets overlay edit state. @returns {void} */
function closeTaskOverlay() {
  const backdrop = document.getElementById("taskOverlayBackdrop");
  if (!backdrop) return;
  backdrop.hidden = true;
  updateBodyScrollLock();
  openedTaskId = null;
  resetOverlayEditMode();
}

/** Resets the overlay back to view mode. @returns {void} */
function resetOverlayEditMode() {
  const els = getOverlayElements();
  if (!els) return;
  isEditingOverlay = false;
  toggleOverlayEditState(els, false);
}

/** @param {string|number} id Task ID to edit. @param {OverlayViewElements} els Overlay element references. @returns {void} */
function enterOverlayEditMode(id, els) {
  const task = findTaskById(id);
  if (!task) return;
  isEditingOverlay = true;
  toggleOverlayEditState(els, true);
  fillOverlayEditForm(task);
  if (els.overlay) els.overlay.scrollTop = 0;
}

/** @param {OverlayViewElements} els Overlay element references. @returns {void} */
function exitOverlayEditMode(els) {
  isEditingOverlay = false;
  toggleOverlayEditState(els, false);
}

/** @param {OverlayViewElements} els Overlay element references. @param {boolean} editing Whether edit mode should be active. @returns {void} */
function toggleOverlayEditState(els, editing) {
  if (els.view) els.view.hidden = editing;
  if (els.editForm) els.editForm.hidden = !editing;
  if (els.overlay) {
    editing ? els.overlay.classList.add("is-editing") : els.overlay.classList.remove("is-editing");
  }
  if (els.editBtn) els.editBtn.hidden = editing;
  if (els.delBtn) els.delBtn.hidden = editing;
  if (els.saveBtn) els.saveBtn.hidden = !editing;
}
