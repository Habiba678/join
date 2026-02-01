function contactListItemTemplate(c, isActive) {
  return `
    <div class="contact-item ${isActive ? "active" : ""}" data-id="${c.id}">
      <div class="avatar ${c.colorClass}">
        ${c.initials}
      </div>
      <div>
        <div class="contact-name">${c.name}</div>
        <div class="contact-mail">${c.email}</div>
      </div>
    </div>
  `;
}

function contactDetailsTemplate(c) {
  return `
    <div class="contact-detail-header">
      <div class="avatar big ${c.colorClass}">
        ${c.initials}
      </div>

      <div>
        <h2>${c.name}</h2>

        <div class="contact-actions">
          <button class="contact-action edit" type="button" data-action="edit" data-id="${c.id}">
            <img src="../assets/icons/edit.svg" alt="">
            <span>Edit</span>
          </button>

          <button class="contact-action delete" type="button" data-action="delete" data-id="${c.id}">
            <img src="../assets/icons/delete.svg" alt="">
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>

    <div class="contact-info">
      <h3>Contact Information</h3>
      <p><strong>Email</strong><br>${c.email}</p>
      <p><strong>Phone</strong><br>${c.phone}</p>
    </div>
  `;
}


function contactModalTemplate(mode, data) {
  const isEdit = mode === "edit";

  const title = isEdit ? "Edit contact" : "Add contact";
  const primaryText = isEdit ? "Save" : "Create contact";
  const secondaryText = isEdit ? "Delete" : "Cancel";
  const secondaryAction = isEdit ? "delete" : "cancel";

  const avatarHtml = isEdit
    ? `<div class="modal-person ${data.colorClass}"><span class="modal-initials">${data.initials}</span></div>`
    : `<div class="modal-person"><img src="../assets/icons/person.png" alt=""></div>`;

  return `
    <div class="modal-backdrop d-none" id="addContactModal">
      <div class="modal">

        <div class="modal-left">
          <img src="../assets/icons/logo-white.svg" class="modal-logo" alt="">
          <h2>${title}</h2>
          <div class="modal-line"></div>
        </div>

        <div class="modal-right">
          <button class="modal-close" id="closeAddContact" type="button">×</button>

          ${avatarHtml}

          <form id="addContactForm" data-mode="${mode}" data-edit-id="${data.id || ""}">
            <div class="input-wrapper">
              <input id="contactName" type="text" placeholder="Name" required value="${data.name || ""}">
              <img src="../assets/icons/person.png" class="input-icon" alt="">
            </div>

            <div class="input-wrapper">
              <input id="contactEmail" type="email" placeholder="Email" required value="${data.email || ""}">
              <img src="../assets/icons/mail.png" class="input-icon" alt="">
            </div>

            <div class="input-wrapper">
              <input id="contactPhone" type="text" placeholder="Phone" value="${data.phone || ""}">
              <img src="../assets/icons/call.svg" class="input-icon" alt="">
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" id="modalSecondaryBtn" data-action="${secondaryAction}">
                ${secondaryText}
                <img src="../assets/icons/${isEdit ? "delete.svg" : "iconoir_cancel.svg"}" alt="">
              </button>

              <button type="submit" class="btn-create" id="modalPrimaryBtn">
                ${primaryText}
                <img src="../assets/icons/check-white.svg" alt="">
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  `;
}