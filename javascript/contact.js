const STORAGE_KEY = "join_contacts_v1";

let contacts = [];
let selectedId = null;

function normalize(str) {
  return (str || "").trim().replace(/\s+/g, " ");
}

function generateId() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now()) + "_" + Math.random().toString(16).slice(2);
}

function hashString(str) {
  let h = 0, s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function colorClassFor(seed) {
  return "avatar-color-" + (hashString(seed) % 12);
}

function getInitials(fullName) {
  let n = normalize(fullName);
  if (!n) return "";
  let p = n.split(" ").filter(Boolean), f = (p[0] || "")[0] || "";
  let l = (p.length > 1 ? (p[p.length - 1] || "")[0] : (p[0] || "")[1]) || "";
  return (f + l).toUpperCase();
}

function sortContacts(a, b) {
  return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
}

function groupKey(name) {
  let n = normalize(name);
  return (n[0] || "").toUpperCase();
}

function loadContacts() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    contacts = raw ? JSON.parse(raw) : [];
  } catch {
    contacts = [];
  }
}

function saveContacts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch {}
}

function forceCloseModal() {
  let m = document.getElementById("addContactModal");
  if (!m) return;
  m.classList.add("d-none");
  m.remove();
}

function openModal(mode, contact) {
  forceCloseModal();
  let data = { id: "", name: "", email: "", phone: "", initials: "", colorClass: "" };
  if (contact) data = { id: contact.id, name: contact.name, email: contact.email, phone: contact.phone || "", initials: getInitials(contact.name), colorClass: colorClassFor(contact.email || contact.name) };
  document.body.insertAdjacentHTML("beforeend", contactModalTemplate(mode, data));
  let m = document.getElementById("addContactModal"); if (!m) return;
  m.classList.remove("d-none");
  let box = m.querySelector(".modal");
  if (box && box.animate) box.animate([{ transform: "translateX(120px)", opacity: 0 }, { transform: "translateX(0)", opacity: 1 }], { duration: 250, easing: "ease-out", fill: "forwards" });
}

function closeModal() {
  let m = document.getElementById("addContactModal");
  if (!m) return;
  let box = m.querySelector(".modal");
  if (box && box.animate) {
    let a = box.animate([{ transform: "translateX(0)", opacity: 1 }, { transform: "translateX(120px)", opacity: 0 }], { duration: 200, easing: "ease-in", fill: "forwards" });
    a.onfinish = function () { forceCloseModal(); };
    return;
  }
  forceCloseModal();
}

function renderContactsList() {
  let list = document.getElementById("contactsList");
  if (!list) return;
  let sorted = [...contacts].sort(sortContacts), html = "", current = "";
  for (let i = 0; i < sorted.length; i++) {
    let c = sorted[i], g = groupKey(c.name);
    if (g && g !== current) { current = g; html += `<div class="letter-group">${current}</div>`; }
    html += contactListItemTemplate({ id: c.id, name: c.name, email: c.email, initials: getInitials(c.name), colorClass: colorClassFor(c.email || c.name) }, c.id === selectedId);
  }
  list.innerHTML = html;
}

function renderDetails() {
  let d = document.getElementById("contactDetails");
  if (!d) return;
  let c = contacts.find(function (x) { return x.id === selectedId; });
  if (!c) { d.innerHTML = ""; return; }
  d.innerHTML = contactDetailsTemplate({ id: c.id, name: c.name, email: c.email, phone: c.phone || "-", initials: getInitials(c.name), colorClass: colorClassFor(c.email || c.name) });
}

function createFromForm() {
  let nEl = document.getElementById("contactName"), eEl = document.getElementById("contactEmail"), pEl = document.getElementById("contactPhone");
  let name = normalize(nEl ? nEl.value : ""), email = normalize(eEl ? eEl.value : "").toLowerCase(), phone = normalize(pEl ? pEl.value : "");
  if (!name || !email) return;
  let nc = { id: generateId(), name: name, email: email, phone: phone };
  contacts.push(nc); selectedId = nc.id;
  saveContacts(); renderContactsList(); renderDetails();
}

function saveEdit(editId) {
  let idx = contacts.findIndex(function (x) { return x.id === editId; });
  if (idx === -1) return;
  let nEl = document.getElementById("contactName"), eEl = document.getElementById("contactEmail"), pEl = document.getElementById("contactPhone");
  let name = normalize(nEl ? nEl.value : ""), email = normalize(eEl ? eEl.value : "").toLowerCase(), phone = normalize(pEl ? pEl.value : "");
  if (!name || !email) return;
  contacts[idx] = { ...contacts[idx], name: name, email: email, phone: phone };
  selectedId = editId; saveContacts(); renderContactsList(); renderDetails();
}

function deleteContact(id) {
  contacts = contacts.filter(function (c) { return c.id !== id; });
  selectedId = contacts.length ? contacts[0].id : null;
  saveContacts(); renderContactsList(); renderDetails();
}

function handleClick(e) {
  if (e.target.closest("#openAddContact")) { openModal("create", null); return; }
  let item = e.target.closest(".contact-item");
  if (item && item.dataset.id) { selectedId = item.dataset.id; renderContactsList(); renderDetails(); return; }
  let act = e.target.closest(".contact-action");
  if (act && act.dataset.action && act.dataset.id) {
    let id = act.dataset.id, a = act.dataset.action;
    if (a === "delete") { deleteContact(id); return; }
    if (a === "edit") { openModal("edit", contacts.find(function (x) { return x.id === id; })); return; }
  }
  if (e.target.closest("#closeAddContact")) { closeModal(); return; }
  let sec = e.target.closest("#modalSecondaryBtn");
  if (sec) { let form = document.getElementById("addContactForm"), id = form ? form.dataset.editId : ""; if (sec.dataset.action === "cancel") closeModal(); if (sec.dataset.action === "delete" && id) { deleteContact(id); closeModal(); } return; }
  let back = document.getElementById("addContactModal"); if (back && e.target === back) closeModal();
}

function handleSubmit(e) {
  if (!e.target || e.target.id !== "addContactForm") return;
  e.preventDefault();
  let mode = e.target.dataset.mode || "create", editId = e.target.dataset.editId || "";
  if (mode === "create") createFromForm();
  if (mode === "edit" && editId) saveEdit(editId);
  closeModal();
}

function init() {
  forceCloseModal();
  loadContacts();
  if (!selectedId && contacts.length) selectedId = contacts[0].id;
  renderContactsList();
  renderDetails();
  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
}

document.addEventListener("DOMContentLoaded", init);