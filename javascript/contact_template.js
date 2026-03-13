/**
 * Creates the letter separator in the contact list.
 * @param {string} letter
 * @returns {string}
 */
function letterGroupTemplate(letter) {
  return `
    <div class="letter-group">
      ${letter}
    </div>
  `;
}

/**
 * Builds the HTML for a single contact list item.
 * @param {Object} c
 * @param {boolean} isActive
 * @returns {string}
 */
function contactListItemTemplate(c, isActive) {
  return `
    <div class="contact-item ${isActive ? "active" : ""}" data-id="${c.id}">
      <div class="avatar ${c.colorClass}">
        ${c.initials}
      </div>
      <div class="contact-text">
        <div class="contact-name">${c.name}</div>
        <div class="contact-mail">${c.email}</div>
      </div>
    </div>
  `;
}

/**
 * Creates the action buttons for a contact.
 * @param {Object} c
 * @returns {string}
 */
function contactActionsTemplate(c) {
  return `
    <div class="contact-actions">
      <button class="contact-action edit" data-action="edit" data-id="${c.id}">
        <img src="../assets/icons/edit.svg" alt="">
        <span>Edit</span>
      </button>
      <button class="contact-action delete" data-action="delete" data-id="${c.id}">
        <img src="../assets/icons/delete.svg" alt="">
        <span>Delete</span>
      </button>
    </div>
  `;
}

/**
 * Creates the detailed contact view.
 * @param {Object} c
 * @returns {string}
 */
function contactDetailsTemplate(c) {
  return `
    <div class="contact-detail-topbar">
      <button class="mobile-back-btn" id="mobileBackBtn" type="button">
        <img src="../assets/icons/pfeil-links-blue.png" alt="">
      </button>
      <div class="contact-detail-topbar-spacer"></div>
    </div>

    <div class="contact-detail-header">
      <div class="avatar big ${c.colorClass}">
        ${c.initials}
      </div>
      <div class="contact-detail-headtext">
        <h2 class="contact-detail-name">${c.name}</h2>
        ${contactActionsTemplate(c)}
      </div>
    </div>

    <div class="contact-info">
      <h3>Contact Information</h3>
      <p>
        <strong>Email</strong><br>
        <a href="mailto:${c.email}">${c.email}</a>
      </p>
      <p>
        <strong>Phone</strong><br>
        <span>${c.phone || "-"}</span>
      </p>
    </div>
  `;
}

/**
 * Creates the left side of the contact modal.
 * @param {string} mode
 * @returns {string}
 */
function modalLeftTemplate(mode) {
  return `
    <div class="modal-left">
      <button class="modal-close" id="closeAddContact" type="button">×</button>
      <img src="../assets/icons/logo-white.svg" class="modal-logo" alt="">
      <h2 class="modal-title">${String(mode || "").trim().toLowerCase() === "edit" ? "Edit contact" : "Add contact"}</h2>
      <p class="modal-subtitle">Tasks are better with a team!</p>
      <div class="modal-line"></div>
    </div>
  `;
}

/**
 * Creates the avatar section inside the modal.
 * @param {string} mode
 * @param {Object} data
 * @returns {string}
 */
function modalAvatarTemplate(mode, data) {
  return String(mode || "").trim().toLowerCase() === "edit"
    ? `
      <div class="modal-person ${(data && data.colorClass) ? data.colorClass : ""}">
        <span class="modal-initials">${(data && data.initials) ? data.initials : ""}</span>
      </div>
    `
    : `
      <div class="modal-person">
        <img src="../assets/icons/person.png" alt="">
      </div>
    `;
}

/**
 * Creates the action buttons inside the modal.
 * @param {string} mode
 * @param {Object} data
 * @returns {string}
 */
function modalActionsTemplate(mode, data) {
  return `
    <div class="modal-actions">
      <button type="button"
              class="${String(mode || "").trim().toLowerCase() === "edit" ? "btn-cancel contact-action" : "btn-cancel"}"
              id="${String(mode || "").trim().toLowerCase() === "edit" ? "modalSecondaryBtn" : "closeAddContact"}"
              data-action="${String(mode || "").trim().toLowerCase() === "edit" ? "delete" : "cancel"}"
              data-id="${String(mode || "").trim().toLowerCase() === "edit" && data ? data.id : ""}">
        ${String(mode || "").trim().toLowerCase() === "edit" ? "Delete" : "Cancel"}
        <img src="../assets/icons/${String(mode || "").trim().toLowerCase() === "edit" ? "delete.svg" : "iconoir_cancel.svg"}" alt="">
      </button>

      <button type="submit" class="btn-create">
        ${String(mode || "").trim().toLowerCase() === "edit" ? "Save" : "Create contact"}
        <img src="../assets/icons/check-white.svg" alt="">
      </button>
    </div>
  `;
}

/**
 * Creates the form inside the modal.
 * @param {string} mode
 * @param {Object} data
 * @returns {string}
 */
function modalFormTemplate(mode, data) {
  return `
    <form id="addContactForm"
          novalidate
          data-mode="${String(mode || "").trim().toLowerCase()}"
          data-edit-id="${(data && data.id) ? data.id : ""}">
      ...
      ${modalActionsTemplate(mode, data)}
    </form>
  `;
}

/**
 * Builds the right side of the modal.
 * @param {string} mode
 * @param {Object} data
 * @returns {string}
 */
function modalRightTemplate(mode, data) {
  return `
    <div class="modal-right">
      ${modalAvatarTemplate(mode, data || {})}
      ${modalFormTemplate(mode, data || {})}
    </div>
  `;
}

/**
 * Creates the modal container structure.
 * @param {string} mode
 * @param {Object} data
 * @returns {string}
 */

function contactModalInnerTemplate(mode, data) {
  return `
    <div class="modal">
      ${modalLeftTemplate(mode)}
      ${modalRightTemplate(mode, data || {})}
    </div>
  `;
}

/**
 * Creates the full modal including backdrop and toast.
 * @param {string} mode
 * @param {Object} data
 * @returns {string}
 */
function contactModalTemplate(mode, data) {
  return `
    <div class="modal-backdrop d-none" id="addContactModal">
      ${contactModalInnerTemplate(mode, data || {})}
    </div>
    <div id="contactSuccessToast" class="contact-toast d-none">
      Contact successfully created
    </div>
  `;
}