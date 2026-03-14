/**
 * Card element currently tracked during touch dragging.
 * @type {HTMLElement|null}
 */
let touchDragCard = null;

/**
 * ID of the card currently tracked during touch dragging.
 * @type {string|null}
 */
let touchDragId = null;

/**
 * Initial horizontal touch coordinate in pixels.
 * @type {number}
 */
let touchDragStartX = 0;

/**
 * Initial vertical touch coordinate in pixels.
 * @type {number}
 */
let touchDragStartY = 0;

/**
 * Whether the touch gesture has crossed the drag threshold.
 * @type {boolean}
 */
let touchDragActive = false;

/**
 * Last horizontal touch coordinate in pixels.
 * @type {number}
 */
let lastTouchClientX = 0;

/**
 * Last vertical touch coordinate in pixels.
 * @type {number}
 */
let lastTouchClientY = 0;

/**
 * Minimum combined pointer movement before touch dragging becomes active.
 * @type {number}
 */
const TOUCH_DRAG_THRESHOLD = 10;

/**
 * Registers touch listeners used to emulate drag-and-drop on mobile devices.
 * @returns {void}
 */
function bindTouchDrag() {
  document.addEventListener("touchstart", onTouchStart, { passive: true });
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("touchend", onTouchEnd);
  document.addEventListener("touchcancel", onTouchEnd);
}

/**
 * Captures touch state when the user starts touching a card.
 * @param {TouchEvent} e Native touch start event.
 * @returns {void}
 */
function onTouchStart(e) {
  if (e.touches.length !== 1) return;
  const card = e.target.closest(".card");
  if (!card) return;

  const touch = e.touches[0];
  touchDragCard = card;
  touchDragId = card.dataset.id || "";
  touchDragStartX = touch.clientX;
  touchDragStartY = touch.clientY;
  lastTouchClientX = touch.clientX;
  lastTouchClientY = touch.clientY;
  touchDragActive = false;
}

/**
 * Tracks touch movement and activates drag mode after the threshold is met.
 * @param {TouchEvent} e Native touch move event.
 * @returns {void}
 */
function onTouchMove(e) {
  if (!touchDragCard) return;
  const touch = e.touches[0];
  updateTouchPosition(touch);
  if (!ensureTouchDragActive()) return;
  e.preventDefault();
  updateTouchDragOver(lastTouchClientX, lastTouchClientY);
}

/**
 * Stores the latest touch coordinates for drag feedback and drop resolution.
 * @param {Touch} touch Active touch object.
 * @returns {void}
 */
function updateTouchPosition(touch) {
  lastTouchClientX = touch.clientX;
  lastTouchClientY = touch.clientY;
}

/**
 * Ensures the touch gesture has switched into drag mode.
 * @returns {boolean} `true` when dragging is active.
 */
function ensureTouchDragActive() {
  if (touchDragActive) return true;
  if (!hasTouchDragThreshold()) return false;
  activateTouchDrag();
  return true;
}

/**
 * Checks whether touch movement is large enough to count as a drag.
 * @returns {boolean} `true` when the configured drag threshold is met.
 */
function hasTouchDragThreshold() {
  const dx = lastTouchClientX - touchDragStartX;
  const dy = lastTouchClientY - touchDragStartY;
  return Math.abs(dx) + Math.abs(dy) >= TOUCH_DRAG_THRESHOLD;
}

/**
 * Marks the current touch interaction as an active drag gesture.
 * @returns {void}
 */
function activateTouchDrag() {
  touchDragActive = true;
  isDragging = true;
  touchDragCard.classList.add("dragging");
}

/**
 * Finalizes touch dragging and drops the card into the column under the pointer.
 * @returns {void}
 */
function onTouchEnd() {
  if (!touchDragCard) return;

  const card = touchDragCard;
  const id = touchDragId;
  const wasActive = touchDragActive;

  clearDragOverClasses();

  if (wasActive) {
    const el = document.elementFromPoint(lastTouchClientX, lastTouchClientY);
    const zone = el && el.closest ? el.closest(".column .cards") : null;
    if (zone) handleTouchDrop(zone, card, id);
  }

  card.classList.remove("dragging");
  touchDragCard = null;
  touchDragId = null;
  touchDragActive = false;
  isDragging = false;
}

/**
 * Updates the currently highlighted drop zone for touch dragging.
 * @param {number} x Current horizontal pointer position.
 * @param {number} y Current vertical pointer position.
 * @returns {void}
 */
function updateTouchDragOver(x, y) {
  clearDragOverClasses();
  const el = document.elementFromPoint(x, y);
  if (!el || !el.closest) return;
  const zone = el.closest(".column .cards");
  if (!zone) return;
  const col = zone.closest(".column");
  if (col) col.classList.add("drag-over");
}
