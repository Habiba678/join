const STORAGE_KEY = "join_contacts_v1";
const dbTask = "https://join-da53b-default-rtdb.firebaseio.com/";

let contacts = [];
let selectedId = null;

function isMobile() { return window.isMobile && window.isMobile(); }
function showMobileList() { window.showMobileList && window.showMobileList(); }
function showMobileDetails() { window.showMobileDetails && window.showMobileDetails(); }

document.addEventListener("DOMContentLoaded", async function () {
  await (window.idbStorage && window.idbStorage.ready ? window.idbStorage.ready : Promise.resolve());
  await init();
});

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

function normalize(str) {
  return (str || "").trim().replace(/\s+/g, " ");
}

function generateId() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now() + "_" + Math.random().toString(16).slice(2);
}

function hashString(str) {
  let h = 0, s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function colorClassFor(seed) {
  return "avatar-color-" + (hashString(seed) % 12);
}

function pickUniqueColorClass(seed, usedSet) {
  let start = hashString(seed) % 12;
  for (let i = 0; i < 12; i++) {
    let cls = "avatar-color-" + ((start + i) % 12);
    if (!usedSet.has(cls)) return cls;
  }
  return "avatar-color-" + start;
}

function getInitials(fullName) {
  let n = normalize(fullName);
  if (!n) return "";
  let p = n.split(" ").filter(Boolean);
  let f = (p[0] || "")[0] || "";
  let l = p.length > 1 ? (p[p.length - 1] || "")[0] : (p[0] || "")[1] || "";
  return (f + l).toUpperCase();
}

function sortContacts(a, b) {
  return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
}

function groupKey(name) {
  return (normalize(name)[0] || "").toUpperCase();
}

async function loadContacts() {
  let data = null;
  try {
    const resp = await fetch(dbTask + "contacts.json");
    data = await resp.json();
  } catch {}

  if (!data) contacts = [];
  else if (Array.isArray(data)) contacts = data.filter(Boolean);
  else contacts = Object.entries(data).map(([k, v]) => ({ ...(v || {}), id: v?.id || k }));

  ensureUniqueColors();
}

async function saveContacts() {
  const map = {};
  for (let c of contacts) {
    if (!c.id) c.id = generateId();
    map[c.id] = c;
  }

  await fetch(dbTask + "contacts.json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(map),
  });
}

function ensureUniqueColors() {
  let used = new Set();
  for (let c of contacts) {
    let seed = c.id || c.email || c.name || "";
    if (!c.colorClass || used.has(c.colorClass))
      c.colorClass = pickUniqueColorClass(seed, used);
    used.add(c.colorClass);
  }
}

function removeModalNow() {
  let m = document.getElementById("addContactModal");
  if (m) m.remove();
}

function openModal(mode, contact) {
  removeModalNow();
  let data = buildModalData(mode, contact);
  document.body.insertAdjacentHTML("beforeend", contactModalTemplate(mode, data));

  let m = document.getElementById("addContactModal");
  if (!m) return;

  m.classList.remove("d-none");
  requestAnimationFrame(function () {
    m.classList.add("is-open");
  });
}

function closeModal() {
  let m = document.getElementById("addContactModal");
  if (!m) return;

  m.classList.remove("is-open");

  setTimeout(function () {
    removeModalNow();
  }, 300);
}

function buildModalData(mode, contact) {
  if (!contact) return {};
  return {
    id: contact.id,
    name: contact.name || "",
    email: contact.email || "",
    phone: contact.phone || "",
    initials: getInitials(contact.name),
    colorClass: contact.colorClass
  };
}

function renderContactsList() {
  let list = document.getElementById("contactsList");
  if (!list) return;

  let sorted = [...contacts].sort(sortContacts);
  let html = "", current = "";

  for (let c of sorted) {
    let g = groupKey(c.name);
    if (g && g !== current) {
      current = g;
      html += letterGroupTemplate(current);
    }

    html += contactListItemTemplate({
      id: c.id,
      name: c.name,
      email: c.email,
      initials: getInitials(c.name),
      colorClass: c.colorClass
    }, c.id === selectedId);
  }

  list.innerHTML = html;
}

function renderDetails() {
  let d = document.getElementById("contactDetails");
  if (!d) return;

  if (!selectedId) {
    d.innerHTML = "";
    return;
  }

  let c = contacts.find(x => x.id === selectedId);
  if (!c) return;

  d.innerHTML = contactDetailsTemplate({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone || "-",
    initials: getInitials(c.name),
    colorClass: c.colorClass
  });

  if (isMobile()) showMobileDetails();
}

function createFromForm() {
  let name = normalize(document.getElementById("contactName")?.value);
  let email = normalize(document.getElementById("contactEmail")?.value).toLowerCase();
  let phone = normalize(document.getElementById("contactPhone")?.value);

  if (!name || !email) return;

  let id = generateId();

  contacts.push({
    id,
    name,
    email,
    phone,
    colorClass: colorClassFor(id)
  });

  selectedId = id;

  saveContacts();
  renderContactsList();
  renderDetails();
  closeModal();
}

function saveEdit(editId) {
  let idx = contacts.findIndex(c => c.id === editId);
  if (idx === -1) return;

  let name = normalize(document.getElementById("contactName")?.value);
  let email = normalize(document.getElementById("contactEmail")?.value).toLowerCase();
  let phone = normalize(document.getElementById("contactPhone")?.value);

  if (!name || !email) return;

  contacts[idx] = { ...contacts[idx], name, email, phone };
  selectedId = editId;

  saveContacts();
  renderContactsList();
  renderDetails();
  closeModal();
}

function deleteContact(id) {
  contacts = contacts.filter(c => c.id !== id);
  selectedId = null;
  saveContacts();
  renderContactsList();
  renderDetails();
}

function handleClick(e) {
  if (e.target.closest("#openAddContact")) return openModal("create", null);

  let item = e.target.closest(".contact-item");
  if (item?.dataset.id) {
    selectedId = item.dataset.id;
    renderContactsList();
    renderDetails();
    return;
  }

  let act = e.target.closest(".contact-action");
  if (act?.dataset.action === "delete") return deleteContact(act.dataset.id);

  if (act?.dataset.action === "edit") {
    let contact = contacts.find(c => c.id === act.dataset.id);
    return openModal("edit", contact);
  }

  if (e.target.closest("#closeAddContact")) closeModal();

  let back = document.getElementById("addContactModal");
  if (back && e.target === back) closeModal();
}

function handleSubmit(e) {
  if (e.target.id !== "addContactForm") return;
  e.preventDefault();

  let mode = e.target.dataset.mode || "create";
  let editId = e.target.dataset.editId || "";

  if (mode === "edit" && editId) return saveEdit(editId);
  return createFromForm();
}