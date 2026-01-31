function groupHTML(letter) {
    return `<div class="letter-group">${letter}</div>`;
  }
  
  function contactHTML(c) {
    return `
      <div class="contact-item" data-id="${c.id}">
        <div class="avatar" style="background:${c.color}">${initials(c.name)}</div>
        <div>
          <div class="contact-name">${c.name}</div>
          <div class="contact-mail">${c.email}</div>
        </div>
      </div>
    `;
  }
  
  function detailsHTML(c) {
    return `
      <h2>${c.name}</h2>
      <div>${c.email}</div>
      <div>${c.phone || ""}</div>
      <div>${c.address || ""}</div>
    `;
  }