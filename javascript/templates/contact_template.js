/**
 * Letter group template.
 */
function letterGroupTemplate(letter) {
  return `
    <div class="letter-group">
      ${letter}
    </div>
  `;
}

/**
 * Contact list item template.
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
 * Contact actions template.
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
 * Contact details template.
 */
function contactDetailsTemplate(c) {
  return [
    contactDetailsTopbarTemplate(),
    contactDetailsHeaderTemplate(c),
    contactDetailsInfoTemplate(c),
  ].join("");
}

/**
 * Contact details topbar template.
 */
function contactDetailsTopbarTemplate() {
  return `
    <div class="contact-detail-topbar">
      <button class="mobile-back-btn" id="mobileBackBtn" type="button">
        <img src="../assets/icons/pfeil-links-blue.png" alt="">
      </button>
      <div class="contact-detail-topbar-spacer"></div>
    </div>
  `;
}

/**
 * Contact details header template.
 */
function contactDetailsHeaderTemplate(c) {
  return `
    <div class="contact-detail-header">
      <div class="avatar big ${c.colorClass}">
        ${c.initials}
      </div>
      <div class="contact-detail-headtext">
        <h2 class="contact-detail-name">${c.name}</h2>
        ${contactActionsTemplate(c)}
      </div>
    </div>
  `;
}

/**
 * Contact details info template.
 */
function contactDetailsInfoTemplate(c) {
  return `
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
 * Modal left template.
 */
function modalLeftTemplate(mode) {
  return `
    <div class="modal-left">
      <button class="modal-close" id="closeAddContact" type="button">×</button>
      <img src="../assets/icons/logo-white.svg" class="modal-logo" alt="">
      <h2 class="modal-title">${
        String(mode || "")
          .trim()
          .toLowerCase() === "edit"
          ? "Edit contact"
          : "Add contact"
      }</h2>
      <p class="modal-subtitle">Tasks are better with a team!</p>
      <div class="modal-line"></div>
    </div>
  `;
}

/**
 * Modal avatar template.
 */
function modalAvatarTemplate(mode, data) {
  return String(mode || "")
    .trim()
    .toLowerCase() === "edit"
    ? `
      <div class="modal-person ${data && data.colorClass ? data.colorClass : ""}">
        <span class="modal-initials">${data && data.initials ? data.initials : ""}</span>
      </div>
    `
    : `
      <div class="modal-person">
        <img src="../assets/icons/person.png" alt="">
      </div>
    `;
}

/**
 * Modal actions template.
 */
function modalActionsTemplate(mode, data) {
  const view = buildModalActionsView(mode, data);
  return [
    '<div class="modal-actions">',
    buildModalSecondaryAction(view),
    buildModalPrimaryAction(view),
    "</div>",
  ].join("");
}

/**
 * Build modal actions view.
 */
function buildModalActionsView(mode, data) {
  const edit = isEditMode(mode);
  return { edit: edit, id: edit && data ? data.id : "" };
}

/**
 * Build modal secondary action.
 */
function buildModalSecondaryAction(view) {
  return `
    <button type="button"
            class="${view.edit ? "btn-cancel contact-action" : "btn-cancel"}"
            id="${view.edit ? "modalSecondaryBtn" : "closeAddContact"}"
            data-action="${view.edit ? "delete" : "cancel"}"
            data-id="${view.id}">
      ${view.edit ? "Delete" : "Cancel"}
      <img src="../assets/icons/${view.edit ? "delete.svg" : "iconoir_cancel.svg"}" alt="">
    </button>
  `;
}

/**
 * Build modal primary action.
 */
function buildModalPrimaryAction(view) {
  return `
    <button type="submit" class="btn-create">
      ${view.edit ? "Save" : "Create contact"}
      <img src="../assets/icons/check-white.svg" alt="">
    </button>
  `;
}

/**
 * Modal form template.
 */
function modalFormTemplate(mode, data) {
  const modeValue = normalizeMode(mode);
  const editId = data && data.id ? data.id : "";
  return [
    `<form id="addContactForm" novalidate data-mode="${modeValue}" data-edit-id="${editId}">`,
    modalNameFieldTemplate(data),
    modalEmailFieldTemplate(data),
    modalPhoneFieldTemplate(data),
    modalActionsTemplate(mode, data),
    "</form>",
  ].join("");
}

/**
 * Modal name field template.
 */
function modalNameFieldTemplate(data) {
  return `
    <div class="input-wrapper">
      <input id="contactName" type="text" placeholder="Name" required value="${data?.name || ""}">
      <img src="../assets/icons/person.png" class="input-icon" alt="">
      <div class="input-error-message" id="nameError"></div>
    </div>
  `;
}

/**
 * Modal email field template.
 */
function modalEmailFieldTemplate(data) {
  return `
    <div class="input-wrapper">
      <input id="contactEmail" type="email" placeholder="Email" required value="${data?.email || ""}">
      <img src="../assets/icons/mail.png" class="input-icon" alt="">
      <div class="input-error-message" id="emailError"></div>
    </div>
  `;
}

/**
 * Modal phone field template.
 */
function modalPhoneFieldTemplate(data) {
  return `
    <div class="input-wrapper">
      <input id="contactPhone" type="text" placeholder="Phone" value="${data?.phone || ""}">
      <img src="../assets/icons/call.svg" class="input-icon" alt="">
      <div class="input-error-message" id="phoneError"></div>
    </div>
  `;
}

/**
 * Normalize mode.
 */
function normalizeMode(mode) {
  return String(mode || "")
    .trim()
    .toLowerCase();
}

/**
 * Check edit mode.
 */
function isEditMode(mode) {
  return normalizeMode(mode) === "edit";
}

/**
 * Modal right template.
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
 * Contact modal inner template.
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
 * Contact modal template.
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
