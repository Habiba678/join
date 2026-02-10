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
      <button class="mobile-back-btn" id="mobileBackBtn" type="button" aria-label="Back">
        <img src="../assets/icons/pfeil-links-blue.png" alt="Back">
      </button>
      <div class="contact-detail-topbar-spacer"></div>
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

function modalLeftTemplate(mode) {
  const m = String(mode || "").trim().toLowerCase();
  const isEdit = m === "edit";

  return `
    <div class="modal-left">
      <button class="modal-close" id="closeAddContact" type="button" aria-label="Close">×</button>
      <img src="../assets/icons/logo-white.svg" class="modal-logo" alt="">
      <h2 class="modal-title">${isEdit ? "Edit contact" : "Add contact"}</h2>
      <p class="modal-subtitle">Tasks are better with a team!</p>
      <div class="modal-line"></div>
    </div>
  `;
}

function modalAvatarTemplate(mode, data) {
  const m = String(mode || "").trim().toLowerCase();
  if (m === "edit") {
    return `
      <div class="modal-person ${data.colorClass || ""}">
        <span class="modal-initials">${data.initials || ""}</span>
      </div>
    `;
  }

  return `
    <div class="modal-person">
      <img src="../assets/icons/person.png" alt="">
    </div>
  `;
}

function modalActionsTemplate(mode) {
  const m = String(mode || "").trim().toLowerCase();
  const isEdit = m === "edit";

  return `
    <div class="modal-actions">
      <button type="button"
              class="btn-cancel"
              id="modalSecondaryBtn"
              data-action="${isEdit ? "delete" : "cancel"}">
        ${isEdit ? "Delete" : "Cancel"}
        <img src="../assets/icons/${isEdit ? "delete.svg" : "iconoir_cancel.svg"}" alt="">
      </button>

      <button type="submit" class="btn-create">
        ${isEdit ? "Save" : "Create contact"}
        <img src="../assets/icons/check-white.svg" alt="">
      </button>
    </div>
  `;
}

function modalFormTemplate(mode, data) {
  const m = String(mode || "").trim().toLowerCase();
  const editId = data && data.id ? data.id : "";

  return `
    <form id="addContactForm"
          data-mode="${m}"
          data-edit-id="${editId}">
      
      <div class="input-wrapper">
        <input id="contactName"
               type="text"
               placeholder="Name"
               required
               value="${(data && data.name) ? data.name : ""}">
        <img src="../assets/icons/person.png" class="input-icon" alt="">
      </div>

      <div class="input-wrapper">
        <input id="contactEmail"
               type="email"
               placeholder="Email"
               required
               value="${(data && data.email) ? data.email : ""}">
        <img src="../assets/icons/mail.png" class="input-icon" alt="">
      </div>

      <div class="input-wrapper">
        <input id="contactPhone"
               type="text"
               placeholder="Phone"
               value="${(data && data.phone) ? data.phone : ""}">
        <img src="../assets/icons/call.svg" class="input-icon" alt="">
      </div>

      ${modalActionsTemplate(m)}
    </form>
  `;
}

function modalRightTemplate(mode, data) {
  return `
    <div class="modal-right">
      ${modalAvatarTemplate(mode, data || {})}
      ${modalFormTemplate(mode, data || {})}
    </div>
  `;
}

function contactModalInnerTemplate(mode, data) {
  return `
    <div class="modal">
      ${modalLeftTemplate(mode)}
      ${modalRightTemplate(mode, data || {})}
    </div>
  `;
}

function contactModalTemplate(mode, data) {
  return `
    <div class="modal-backdrop d-none" id="addContactModal">
      ${contactModalInnerTemplate(mode, data || {})}
    </div>
  `;
}