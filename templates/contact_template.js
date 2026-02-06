function letterGroupTemplate(letter) {
  return `<div class="letter-group">${letter}</div>`;
}

function contactListItemTemplate(c, isActive) {
  return `
    <div class="contact-item ${isActive ? "active" : ""}" data-id="${c.id}">
      <div class="avatar ${c.colorClass}">${c.initials}</div>
      <div class="contact-text">
        <div class="contact-name">${c.name}</div>
        <div class="contact-mail">${c.email}</div>
      </div>
    </div>
  `;
}

function contactActionsTemplate(c) {
  return `
    <div class="contact-actions">
      <button class="contact-action edit" data-action="edit" data-id="${c.id}">
        <img src="../assets/icons/edit.svg">
        <span>Edit</span>
      </button>
      <button class="contact-action delete" data-action="delete" data-id="${c.id}">
        <img src="../assets/icons/delete.svg">
        <span>Delete</span>
      </button>
    </div>
  `;
}

function contactDetailsTemplate(c) {
  return `
    <div class="contact-detail-topbar">
      <button class="mobile-back-btn" id="mobileBackBtn" type="button">
        <img src="../assets/icons/pfeil-links-blue.png">
      </button>
      <button class="mobile-menu-btn" id="mobileMenuBtn" type="button">
        <img src="../assets/icons/three-dots.png">
      </button>
    </div>

    <div class="mobile-actions-menu" id="mobileActionsMenu">
      <button class="contact-action edit" data-action="edit" data-id="${c.id}">
        <img src="../assets/icons/edit.svg"><span>Edit</span>
      </button>
      <button class="contact-action delete" data-action="delete" data-id="${c.id}">
        <img src="../assets/icons/delete.svg"><span>Delete</span>
      </button>
    </div>

    <div class="contact-detail-header">
      <div class="avatar big ${c.colorClass}">${c.initials}</div>
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

/* ================= MODAL ================= */

function modalLeftTemplate(mode) {
  const isCreate = String(mode).trim() === "create";
  const isEdit = String(mode).trim() === "edit";

  return `
    <div class="modal-left">
      <img src="../assets/icons/logo-white.svg" class="modal-logo">

      <h2 class="modal-title">
        ${isEdit ? "Edit contact" : "Add contact"}
      </h2>

      ${
        isCreate
          ? `<p class="modal-subtitle">Tasks are better with a team!</p>`
          : ``
      }

      <div class="modal-line"></div>
    </div>
  `;
}

function modalAvatarTemplate(mode, data) {
  if (mode === "edit") {
    return `
      <div class="modal-person ${data.colorClass}">
        <span class="modal-initials">${data.initials}</span>
      </div>
    `;
  }

  return `
    <div class="modal-person">
      <img src="../assets/icons/person.png">
    </div>
  `;
}

function modalActionsTemplate(mode) {
  return `
    <div class="modal-actions">
      <button type="button"
              class="btn-cancel"
              id="modalSecondaryBtn"
              data-action="${mode === "edit" ? "delete" : "cancel"}">
        ${mode === "edit" ? "Delete" : "Cancel"}
        <img src="../assets/icons/${mode === "edit" ? "delete.svg" : "iconoir_cancel.svg"}">
      </button>

      <button type="submit" class="btn-create">
        ${mode === "edit" ? "Save" : "Create contact"}
        <img src="../assets/icons/check-white.svg">
      </button>
    </div>
  `;
}

function modalFormTemplate(mode, data) {
  return `
    <form id="addContactForm"
          data-mode="${mode}"
          data-edit-id="${data.id || ""}">
      
      <div class="input-wrapper">
        <input id="contactName"
               type="text"
               placeholder="Name"
               required
               value="${data.name || ""}">
        <img src="../assets/icons/person.png" class="input-icon">
      </div>

      <div class="input-wrapper">
        <input id="contactEmail"
               type="email"
               placeholder="Email"
               required
               value="${data.email || ""}">
        <img src="../assets/icons/mail.png" class="input-icon">
      </div>

      <div class="input-wrapper">
        <input id="contactPhone"
               type="text"
               placeholder="Phone"
               value="${data.phone || ""}">
        <img src="../assets/icons/call.svg" class="input-icon">
      </div>

      ${modalActionsTemplate(mode)}
    </form>
  `;
}

function modalRightTemplate(mode, data) {
  return `
    <div class="modal-right">
      <button class="modal-close" id="closeAddContact" type="button">×</button>
      ${modalAvatarTemplate(mode, data)}
      ${modalFormTemplate(mode, data)}
    </div>
  `;
}

function contactModalTemplate(mode, data) {
  return `
    <div class="modal-backdrop d-none" id="addContactModal">
      <div class="modal">
        ${modalLeftTemplate(mode)}
        ${modalRightTemplate(mode, data)}
      </div>
    </div>
  `;
}