/** Firebase storage key. */
const STORAGE_KEY = "join_contacts_v1", dbTask = "https://join-da53b-default-rtdb.firebaseio.com/";
let contacts = [], selectedId = null;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, phoneRegex = /^\+?\d+$/;

/** @returns {boolean} */
function isMobile() { return window.isMobile && window.isMobile(); }
/** Shows mobile list. */
function showMobileList() { window.showMobileList && window.showMobileList(); }
/** Shows mobile details. */
function showMobileDetails() { window.showMobileDetails && window.showMobileDetails(); }

document.addEventListener("DOMContentLoaded", async function () {
  await (window.idbStorage && window.idbStorage.ready ? window.idbStorage.ready : Promise.resolve());
  await init();
});

/** Initializes the page. */
async function init() {
  getCokkieCheck();
  removeModalNow();
  await loadContacts();
  renderContactsList();
  renderDetails();
  if (isMobile()) showMobileList();
  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
}

/** @param {string} str */
function normalize(str) { return (str || "").trim().replace(/\s+/g, " "); }
/** @returns {string} */
function generateId() { return crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "_" + Math.random().toString(16).slice(2); }
/** @param {string} str */
function hashString(str) {
  let h = 0, s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** @param {string} seed */
function colorClassFor(seed) { return "avatar-color-" + (hashString(seed) % 12); }
/** Picks a free avatar color. */
function pickUniqueColorClass(seed, usedSet) {
  let start = hashString(seed) % 12;
  for (let i = 0; i < 12; i++) {
    let cls = "avatar-color-" + ((start + i) % 12);
    if (!usedSet.has(cls)) return cls;
  }
  return "avatar-color-" + start;
}

/** @param {string} fullName */
function getInitials(fullName) {
  let n = normalize(fullName), p = n ? n.split(" ").filter(Boolean) : [];
  let f = (p[0] || "")[0] || "", l = p.length > 1 ? (p[p.length - 1] || "")[0] : (p[0] || "")[1] || "";
  return (f + l).toUpperCase();
}
/** Sorts by name. */
function sortContacts(a, b) { return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase()); }
/** @param {string} name */
function groupKey(name) { return (normalize(name)[0] || "").toUpperCase(); }

/** Loads contacts from Firebase. */
async function loadContacts() {
  let data = null;
  try { data = await (await fetch(dbTask + "contacts.json")).json(); } catch {}
  if (!data) contacts = [];
  else if (Array.isArray(data)) contacts = data.filter(Boolean);
  else contacts = Object.entries(data).map(([k, v]) => ({ ...(v || {}), id: v?.id || k }));
  ensureUniqueColors();
}

/** Saves contacts to Firebase. */
async function saveContacts() {
  const map = {};
  for (let c of contacts) {
    if (!c.id) c.id = generateId();
    map[c.id] = c;
  }
  await fetch(dbTask + "contacts.json", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(map) });
}

/** Ensures unique contact colors. */
function ensureUniqueColors() {
  let used = new Set();
  for (let c of contacts) {
    let seed = c.id || c.email || c.name || "";
    if (!c.colorClass || used.has(c.colorClass)) c.colorClass = pickUniqueColorClass(seed, used);
    used.add(c.colorClass);
  }
}

/** Removes modal instantly. */
function removeModalNow() {
  let m = document.getElementById("addContactModal");
  if (m) m.remove();
}

/** Adds field validation listeners. */
function initValidation() {
  document.getElementById("contactName")?.addEventListener("blur", validateNameField);
  document.getElementById("contactEmail")?.addEventListener("blur", validateEmailField);
  document.getElementById("contactPhone")?.addEventListener("blur", validatePhoneField);
}

/** Opens the create or edit modal. */
function openModal(mode, contact) {
  removeModalNow();
  document.body.insertAdjacentHTML("beforeend", contactModalTemplate(mode, buildModalData(mode, contact)));
  let m = document.getElementById("addContactModal"), form = document.getElementById("addContactForm");
  if (!m) return;
  m.setAttribute("data-mode", mode);
  if (form) form.dataset.mode = mode, form.dataset.editId = mode === "edit" && contact ? contact.id : "";
  m.classList.remove("d-none");
  requestAnimationFrame(function () { m.classList.add("is-open"); initValidation(); });
}

/** Closes the modal. */
function closeModal() {
  let m = document.getElementById("addContactModal");
  if (!m) return;
  m.classList.remove("is-open");
  setTimeout(removeModalNow, 300);
}

/** Shows the success toast. */
function showContactToast() {
  let toast = document.getElementById("contactSuccessToast");
  if (!toast) return;
  toast.classList.remove("d-none");
  setTimeout(function () { toast.classList.add("d-none"); }, 2000);
}

/** Builds modal template data. */
function buildModalData(mode, contact) {
  if (!contact) return {};
  return { id: contact.id, name: contact.name || "", email: contact.email || "", phone: contact.phone || "", initials: getInitials(contact.name), colorClass: contact.colorClass };
}

/** Renders the contacts list. */
function renderContactsList() {
  let list = document.getElementById("contactsList");
  if (!list) return;
  let sorted = [...contacts].sort(sortContacts), html = "", current = "";
  for (let c of sorted) {
    let g = groupKey(c.name);
    if (g && g !== current) current = g, html += letterGroupTemplate(current);
    html += contactListItemTemplate({ id: c.id, name: c.name, email: c.email, initials: getInitials(c.name), colorClass: c.colorClass }, c.id === selectedId);
  }
  list.innerHTML = html;
}

/** Renders selected contact details. */
function renderDetails() {
  let d = document.getElementById("contactDetails");
  if (!d) return;
  if (!selectedId) return void (d.innerHTML = "");
  let c = contacts.find(x => x.id === selectedId);
  if (!c) return;
  d.innerHTML = contactDetailsTemplate({ id: c.id, name: c.name, email: c.email, phone: c.phone || "-", initials: getInitials(c.name), colorClass: c.colorClass });
  if (isMobile()) showMobileDetails();
}

/** Clears one field error. */
function clearError(inputId, errorId) {
  document.getElementById(inputId)?.classList.remove("input-error");
  let e = document.getElementById(errorId);
  if (e) e.textContent = "";
}

/** Sets one field error. */
function setError(inputId, errorId, msg) {
  document.getElementById(inputId)?.classList.add("input-error");
  let e = document.getElementById(errorId);
  if (e) e.textContent = msg;
}

/** Clears all contact errors. */
function clearContactErrors() {
  clearError("contactName", "nameError");
  clearError("contactEmail", "emailError");
  clearError("contactPhone", "phoneError");
}

/** @param {string} name */
function isValidName(name) { return /^[A-Za-zÀ-ÿ\s]+$/.test(name) && name.trim().length >= 2; }
/** @param {string} email */
function isValidEmail(email) { return emailRegex.test(email); }
/** @param {string} phone */
function isValidPhone(phone) { return !phone || phoneRegex.test(phone); }

/** Validates the name field. */
function validateNameField() {
  let name = normalize(document.getElementById("contactName")?.value);
  clearError("contactName", "nameError");
  if (!isValidName(name)) setError("contactName", "nameError", "Please enter a valid name");
}

/** Validates the email field. */
function validateEmailField() {
  let email = normalize(document.getElementById("contactEmail")?.value).toLowerCase();
  clearError("contactEmail", "emailError");
  if (!email) setError("contactEmail", "emailError", "Please enter an email");
  else if (!isValidEmail(email)) setError("contactEmail", "emailError", "Please enter a valid email");
}

/** Validates the phone field. */
function validatePhoneField() {
  let phone = normalize(document.getElementById("contactPhone")?.value);
  clearError("contactPhone", "phoneError");
  if (!isValidPhone(phone)) setError("contactPhone", "phoneError", "Please enter a valid phone number");
}

/** Validates the contact form. */
function validateContactForm() {
  let name = normalize(document.getElementById("contactName")?.value), email = normalize(document.getElementById("contactEmail")?.value).toLowerCase();
  let phone = normalize(document.getElementById("contactPhone")?.value), valid = true;
  clearContactErrors();
  if (!isValidName(name)) setError("contactName", "nameError", "Please enter a valid name"), valid = false;
  if (!email) setError("contactEmail", "emailError", "Please enter an email"), valid = false;
  else if (!isValidEmail(email)) setError("contactEmail", "emailError", "Please enter a valid email"), valid = false;
  if (!isValidPhone(phone)) setError("contactPhone", "phoneError", "Please enter a valid phone number"), valid = false;
  return valid;
}

/** Reads form values. */
function formData() {
  return { name: normalize(document.getElementById("contactName")?.value), email: normalize(document.getElementById("contactEmail")?.value).toLowerCase(), phone: normalize(document.getElementById("contactPhone")?.value) };
}

/** Creates a contact. */
function createFromForm() {
  if (!validateContactForm()) return;
  let id = generateId(), data = formData();
  contacts.push({ id, ...data, colorClass: colorClassFor(id) });
  selectedId = id;
  saveContacts(), renderContactsList(), renderDetails(), closeModal(), showContactToast();
}

/** Saves an edited contact. */
function saveEdit(editId) {
  let idx = contacts.findIndex(c => c.id === editId);
  if (idx === -1 || !validateContactForm()) return;
  contacts[idx] = { ...contacts[idx], ...formData() };
  selectedId = editId;
  saveContacts(), renderContactsList(), renderDetails(), closeModal();
}

/** Deletes a contact. */
function deleteContact(id) {
  contacts = contacts.filter(c => c.id !== id);
  selectedId = null;
  saveContacts(), renderContactsList(), renderDetails();
}

/** Handles page clicks. */
function handleClick(e) {
  if (e.target.closest("#openAddContact")) return openModal("create", null);
  let item = e.target.closest(".contact-item");
  if (item?.dataset.id) return selectedId = item.dataset.id, renderContactsList(), renderDetails();
  let act = e.target.closest(".contact-action");
  if (act?.dataset.action === "delete") return deleteContact(act.dataset.id), closeModal();
  if (act?.dataset.action === "edit") return window.closeMobileMenu && window.closeMobileMenu(), openModal("edit", contacts.find(c => c.id === act.dataset.id));
  if (e.target.closest("#closeAddContact")) closeModal();
  let back = document.getElementById("addContactModal");
  if (back && e.target === back) closeModal();
}

/** Handles form submit. */
function handleSubmit(e) {
  if (e.target.id !== "addContactForm") return;
  e.preventDefault();
  let mode = e.target.dataset.mode || "create", editId = e.target.dataset.editId || "";
  return mode === "edit" && editId ? saveEdit(editId) : createFromForm();
}