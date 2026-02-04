function contactListItemTemplate(c, isActive) {
  return `
  <div class="contact-item ${isActive ? "active" : ""}" data-id="${c.id}">
    <div class="avatar ${c.colorClass}">${c.initials}</div>
    <div class="contact-text">
      <div class="contact-name">${c.name}</div>
      <div class="contact-mail">${c.email}</div>
    </div>
  </div>`;
}

function contactActionsTemplate(c) {
  return `
  <div class="contact-actions desktop-actions">
    <button class="contact-action edit" data-action="edit" data-id="${c.id}">
      <img src="../assets/icons/edit.svg"><span>Edit</span>
    </button>
    <button class="contact-action delete" data-action="delete" data-id="${c.id}">
      <img src="../assets/icons/delete.svg"><span>Delete</span>
    </button>
  </div>`;
}

function contactMobileActionsTemplate(c) {
  return `
  <div class="mobile-actions-menu d-none" id="mobileActionsMenu" data-id="${c.id}">
    <button class="mobile-action-item" data-action="edit" data-id="${c.id}">
      <img src="../assets/icons/edit.svg"><span>Edit</span>
    </button>
    <button class="mobile-action-item" data-action="delete" data-id="${c.id}">
      <img src="../assets/icons/delete.svg"><span>Delete</span>
    </button>
  </div>`;
}

function contactDetailsHeaderMobileTemplate() {
  return `
  <div class="contact-detail-topbar mobile-only">
    <button class="mobile-back-btn" id="mobileBackBtn" type="button" aria-label="Back">
      <img src="../assets/icons/pfeil-links-blue.png" alt="Back">
    </button>
  </div>`;
}

function contactDetailsTemplate(c) {
  return `
  ${contactDetailsHeaderMobileTemplate()}
  <div class="contact-detail-header">
    <div class="avatar big ${c.colorClass}">${c.initials}</div>
    <div class="contact-detail-headtext">
      <h2 class="contact-detail-name">${c.name}</h2>
      ${contactActionsTemplate(c)}
    </div>
  </div>

  <div class="contact-info">
    <h3>Contact Information</h3>
    <p><strong>Email</strong><br><a class="contact-link" href="mailto:${c.email}">${c.email}</a></p>
    <p><strong>Phone</strong><br><span>${c.phone || "-"}</span></p>
  </div>

  <button class="mobile-fab-menu mobile-only" id="mobileMenuBtn" type="button" aria-label="More">
    ⋮
  </button>
  ${contactMobileActionsTemplate(c)}
  `;
}

function modalLeftTemplate(mode) {
  return `
    <div class="modal-left">
      <img src="../assets/icons/logo-white.svg" class="modal-logo">
      <h2 class="modal-title">${mode === "edit" ? "Edit contact" : "Add contact"}</h2>
      ${mode === "create" ? `<p class="modal-subtitle">Tasks are better with a team!</p>` : ""}
      <div class="modal-line"></div>
    </div>
  `;
}

function modalAvatarTemplate(mode, data) {
  return mode === "edit"
    ? `<div class="modal-person ${data.colorClass}"><span class="modal-initials">${data.initials}</span></div>`
    : `<div class="modal-person"><img src="../assets/icons/person.png"></div>`;
}

function modalActionsTemplate(mode) {
  return `
  <div class="modal-actions">
    <button type="button" class="btn-cancel" id="modalSecondaryBtn" data-action="${mode === "edit" ? "delete" : "cancel"}">
      ${mode === "edit" ? "Delete" : "Cancel"}<img src="../assets/icons/${mode === "edit" ? "delete.svg" : "iconoir_cancel.svg"}">
    </button>
    <button type="submit" class="btn-create">
      ${mode === "edit" ? "Save" : "Create contact"}<img src="../assets/icons/check-white.svg">
    </button>
  </div>`;
}

function modalFormTemplate(mode, data) {
  return `
  <form id="addContactForm" data-mode="${mode}" data-edit-id="${data.id || ""}">
    <div class="input-wrapper">
      <input id="contactName" type="text" placeholder="Name" required value="${data.name || ""}">
      <img src="../assets/icons/person.png" class="input-icon">
    </div>
    <div class="input-wrapper">
      <input id="contactEmail" type="email" placeholder="Email" required value="${data.email || ""}">
      <img src="../assets/icons/mail.png" class="input-icon">
    </div>
    <div class="input-wrapper">
      <input id="contactPhone" type="text" placeholder="Phone" value="${data.phone || ""}">
      <img src="../assets/icons/call.svg" class="input-icon">
    </div>
    ${modalActionsTemplate(mode)}
  </form>`;
}

function modalRightTemplate(mode, data) {
  return `
  <div class="modal-right">
    <button class="modal-close" id="closeAddContact" type="button">×</button>
    ${modalAvatarTemplate(mode, data)}
    ${modalFormTemplate(mode, data)}
  </div>`;
}

function contactModalTemplate(mode, data) {
  return `
  <div class="modal-backdrop d-none" id="addContactModal">
    <div class="modal">
      ${modalLeftTemplate(mode)}
      ${modalRightTemplate(mode, data)}
    </div>
  </div>`;
}