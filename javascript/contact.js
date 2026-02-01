const STORAGE_KEY = "join_contacts_v1";

let contacts = [];
let selectedId = null;

function $(id) {
  return document.getElementById(id);
}

function normalize(str) {
  return (str || "").trim().replace(/\s+/g, " ");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function generateId() {
  return crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + "_" + Math.random().toString(16).slice(2);
}

function loadContacts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    contacts = raw ? JSON.parse(raw) : [];
  } catch {
    contacts = [];
  }
}

function saveContacts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function colorClassFor(seed) {
  const idx = hashString(String(seed || "")) % 12;
  return `avatar-color-${idx}`;
}

function getInitials(fullName) {
  const name = normalize(fullName);
  if (!name) return "";
  const parts = name.split(" ").filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]) || "";
  return (first + last).toUpperCase();
}

function sortContacts(a, b) {
  return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
}

function groupKey(name) {
  const n = normalize(name);
  return (n[0] || "").toUpperCase();
}

function removeModalIfExists() {
  const modal = $("addContactModal");
  if (modal) modal.remove();
}

function openModal(mode, contact) {
  removeModalIfExists();

  const data = {
    id: contact?.id || "",
    name: contact ? escapeHtml(contact.name) : "",
    email: contact ? escapeHtml(contact.email) : "",
    phone: contact ? escapeHtml(contact.phone || "") : "",
    initials: contact ? escapeHtml(getInitials(contact.name)) : "",
    colorClass: contact ? colorClassFor(contact.email || contact.name) : ""
  };

  document.body.insertAdjacentHTML("beforeend", contactModalTemplate(mode, data));
  $("addContactModal").classList.remove("d-none");
}

function closeModal() {
  const modal = $("addContactModal");
  if (modal) modal.remove();
}

function renderContactsList() {
  const list = $("contactsList");
  if (!list) return;

  const sorted = [...contacts].sort(sortContacts);
  let html = "";
  let current = null;

  for (const c of sorted) {
    const g = groupKey(c.name);
    if (g && g !== current) {
      current = g;
      html += `<div class="letter-group">${escapeHtml(current)}</div>`;
    }

    html += contactListItemTemplate(
      {
        id: c.id,
        name: escapeHtml(c.name),
        email: escapeHtml(c.email),
        initials: escapeHtml(getInitials(c.name)),
        colorClass: colorClassFor(c.email || c.name)
      },
      c.id === selectedId
    );
  }

  list.innerHTML = html;
}

function renderDetails() {
  const details = $("contactDetails");
  if (!details) return;

  const c = contacts.find(x => x.id === selectedId);
  if (!c) {
    details.innerHTML = "";
    return;
  }

  details.innerHTML = contactDetailsTemplate({
    id: c.id,
    name: escapeHtml(c.name),
    email: escapeHtml(c.email),
    phone: escapeHtml(c.phone || "-"),
    initials: escapeHtml(getInitials(c.name)),
    colorClass: colorClassFor(c.email || c.name)
  });
}

function createFromModalForm() {
  const name = normalize($("contactName")?.value);
  const email = normalize($("contactEmail")?.value).toLowerCase();
  const phone = normalize($("contactPhone")?.value);

  if (!name || !email) return;

  const newContact = { id: generateId(), name, email, phone };
  contacts.push(newContact);
  selectedId = newContact.id;

  saveContacts();
  renderContactsList();
  renderDetails();
}

function saveEditFromModalForm(editId) {
  const idx = contacts.findIndex(x => x.id === editId);
  if (idx === -1) return;

  const name = normalize($("contactName")?.value);
  const email = normalize($("contactEmail")?.value).toLowerCase();
  const phone = normalize($("contactPhone")?.value);

  if (!name || !email) return;

  contacts[idx] = { ...contacts[idx], name, email, phone };
  selectedId = editId;

  saveContacts();
  renderContactsList();
  renderDetails();
}

function deleteContact(id) {
  contacts = contacts.filter(c => c.id !== id);
  selectedId = contacts[0]?.id || null;

  saveContacts();
  renderContactsList();
  renderDetails();
}

function init() {
  loadContacts();
  if (!selectedId && contacts.length) selectedId = contacts[0].id;

  renderContactsList();
  renderDetails();

  document.addEventListener("click", (e) => {
    if (e.target.closest("#openAddContact")) openModal("create", null);

    const item = e.target.closest(".contact-item");
    if (item?.dataset.id) {
      selectedId = item.dataset.id;
      renderContactsList();
      renderDetails();
    }

    const actionBtn = e.target.closest(".contact-action");
    if (actionBtn?.dataset.action && actionBtn?.dataset.id) {
      const id = actionBtn.dataset.id;
      const action = actionBtn.dataset.action;
      if (action === "delete") deleteContact(id);
      if (action === "edit") openModal("edit", contacts.find(x => x.id === id));
    }

    if (e.target.closest("#closeAddContact")) closeModal();

    const secondary = e.target.closest("#modalSecondaryBtn");
    if (secondary) {
      const action = secondary.dataset.action;
      const form = $("addContactForm");
      const editId = form?.dataset.editId || "";

      if (action === "cancel") closeModal();
      if (action === "delete" && editId) {
        deleteContact(editId);
        closeModal();
      }
    }

    const backdrop = $("addContactModal");
    if (backdrop && e.target === backdrop) closeModal();
  });

  document.addEventListener("submit", (e) => {
    if (e.target.id !== "addContactForm") return;
    e.preventDefault();

    const form = e.target;
    const mode = form.dataset.mode || "create";
    const editId = form.dataset.editId || "";

    if (mode === "create") createFromModalForm();
    if (mode === "edit" && editId) saveEditFromModalForm(editId);

    closeModal();
  });
}

document.addEventListener("DOMContentLoaded", init);