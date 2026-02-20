const STORAGE_KEY = "join_contacts_v1";
const dbTask = "https://join-da53b-default-rtdb.firebaseio.com/";
let contacts = [];
let selectedId = null;

async function init() {
  getCokkieCheck();
  removeModalNow();
  await loadContacts();
  selectedId = null;
  renderContactsList();
  renderDetails();
  if (isMobile()) showMobileList();
  bindGlobalEvents();
}
document.addEventListener("DOMContentLoaded", async function () {
  await (window.idbStorage && window.idbStorage.ready ? window.idbStorage.ready : Promise.resolve());
  await init();
});
function bindGlobalEvents() {
  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
}

function getEl(id) { return document.getElementById(id); }
function isMobile() { return window.isMobile && window.isMobile(); }
function showMobileList() { window.showMobileList && window.showMobileList(); }
function showMobileDetails() { window.showMobileDetails && window.showMobileDetails(); }
function closeMobileMenu() { window.closeMobileMenu && window.closeMobileMenu(); }
function normalize(str) { return (str || "").trim().replace(/\s+/g, " "); }
function generateId() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now() + "_" + Math.random().toString(16).slice(2);
}
function hashString(str) {
  let h = 0, s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function colorClassFor(seed) { return "avatar-color-" + (hashString(seed) % 12); }
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
function groupKey(name) { return (normalize(name)[0] || "").toUpperCase(); }

async function fetchDBNode(nodeName) {
  try {
    const resp = await fetch(dbTask + nodeName + ".json");
    const data = await resp.json();
    if (data != null) return data;
  } catch (e) {}
  try {
    const r = await fetch(dbTask + ".json");
    const root = await r.json();
    if (!root) return null;
    if (Array.isArray(root)) {
      const entry = root.find((e) => e && e.id === nodeName);
      if (entry) {
        const clone = { ...entry };
        delete clone.id;
        if (clone.hasOwnProperty(nodeName)) return clone[nodeName];
        return clone;
      }
    } else if (typeof root === "object") {
      const vals = Object.values(root);
      for (let e of vals) {
        if (e && e.id === nodeName) {
          const clone = { ...e };
          delete clone.id;
          if (clone.hasOwnProperty(nodeName)) return clone[nodeName];
          return clone;
        }
      }
      if (root[nodeName] !== undefined) return root[nodeName];
    }
  } catch (e) {}
  return null;
}
async function loadContacts() {
  let data = null;
  try { data = await fetchDBNode("contacts"); } catch { data = null; }
  if (!data) contacts = [];
  else if (Array.isArray(data)) contacts = data.filter(Boolean);
  else contacts = Object.entries(data).map(([k, v]) => ({ ...(v || {}), id: (v && v.id) ? v.id : k }));
  await saveToIDB();
  ensureUniqueColors();
}
async function saveContacts() {
  try {
    const map = {};
    for (let c of contacts) { if (!c.id) c.id = generateId(); map[c.id] = c; }
    await fetch(dbTask + "contacts.json", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(map),
    });
    await saveToIDB();
  } catch (e) {}
}
async function saveToIDB() {
  if (window.idbStorage && typeof window.idbStorage.saveContacts === "function") {
    try { await window.idbStorage.saveContacts(contacts); } catch (e) {}
  }
}
function ensureUniqueColors() {
  let used = new Set(), changed = false;
  for (let c of contacts) {
    let seed = c.id || c.email || c.name || "";
    if (!c.colorClass || used.has(c.colorClass)) { c.colorClass = pickUniqueColorClass(seed, used); changed = true; }
    used.add(c.colorClass);
  }
  if (changed) saveContacts();
}

function removeModalNow() { let m = getEl("addContactModal"); if (m) m.remove(); }
function buildModalData(mode, contact) {
  let d = { id: "", name: "", email: "", phone: "", initials: "", colorClass: "" };
  if (!contact) return d;
  d.id = contact.id;
  d.name = contact.name || "";
  d.email = contact.email || "";
  d.phone = contact.phone || "";
  d.initials = getInitials(contact.name);
  d.colorClass = contact.colorClass || colorClassFor(contact.id || (contact.email || contact.name || ""));
  return d;
}
function findModalAvatar(modal, initials) {
  let a = modal.querySelector("#modalAvatar") || modal.querySelector("#editAvatar") ||
    modal.querySelector(".modal .contact-avatar") || modal.querySelector(".modal .avatar") ||
    modal.querySelector(".modal .avatar-circle") || modal.querySelector(".modal .profile-badge");
  if (a) return a;
  let candidates = Array.from(modal.querySelectorAll("div,span,p")).filter(function (el) {
    return (el.textContent || "").trim() === initials;
  });
  return candidates[0] || null;
}
function clearAvatarColors(avatar) {
  Array.from(avatar.classList).forEach(function (cls) {
    if (cls.indexOf("avatar-color-") === 0) avatar.classList.remove(cls);
  });
}
function colorFromClass(cls) {
  let probe = document.createElement("div");
  probe.className = cls;
  probe.style.position = "absolute";
  probe.style.left = "-9999px";
  probe.style.top = "-9999px";
  document.body.appendChild(probe);
  let bg = getComputedStyle(probe).backgroundColor || "";
  probe.remove();
  return bg;
}
function applyModalAvatar(data) {
  let m = getEl("addContactModal");
  if (!m) return;
  let initials = (data.initials || "").trim();
  let colorClass = (data.colorClass || "").trim();
  if (!initials || !colorClass) return;
  let avatar = findModalAvatar(m, initials);
  if (!avatar) return;
  clearAvatarColors(avatar);
  avatar.classList.add(colorClass);
  let bg = colorFromClass(colorClass);
  if (bg) avatar.style.backgroundColor = bg;
}
function openModal(mode, contact) {
  removeModalNow();
  let data = buildModalData(mode, contact);
  document.body.insertAdjacentHTML("beforeend", contactModalTemplate(mode, data));
  let m = getEl("addContactModal");
  if (!m) return;
  m.setAttribute("data-mode", String(mode || "").trim().toLowerCase());
  applyModalAvatar(data);
  m.classList.remove("d-none");
  m.classList.remove("is-closing");
  requestAnimationFrame(function () {
    m.classList.add("is-open");
    requestAnimationFrame(function () { applyModalAvatar(data); });
  });
}
function closeModal() {
  let m = getEl("addContactModal");
  if (!m) return;
  m.classList.remove("is-open");
  m.classList.add("is-closing");
  let box = m.querySelector(".modal");
  if (!box) return removeModalNow();
  let done = false;
  function finish() { if (done) return; done = true; removeModalNow(); }
  box.addEventListener("transitionend", finish, { once: true });
  setTimeout(finish, 3600);
}
function showContactSuccessBox(text) {
  const msg = String(text || "Contact successfully created");
  let box = document.getElementById("contactSuccessBox");
  if (box) box.remove();
  box = document.createElement("div");
  box.id = "contactSuccessBox";
  box.className = "contact-successbox";
  box.textContent = msg;
  document.body.appendChild(box);
  requestAnimationFrame(function () { box.classList.add("is-open"); });
  setTimeout(function () {
    box.classList.remove("is-open");
    setTimeout(function () { box.remove(); }, 350);
  }, 2200);
}

function contactViewModel(c) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    initials: getInitials(c.name),
    colorClass: c.colorClass || colorClassFor(c.id || (c.email || c.name || "")),
  };
}
function renderContactsList() {
  let list = getEl("contactsList");
  if (!list) return;
  let sorted = [...contacts].sort(sortContacts);
  let html = "", current = "";
  for (let i = 0; i < sorted.length; i++) {
    let c = sorted[i];
    let g = groupKey(c.name);
    if (g && g !== current) { current = g; html += letterGroupTemplate(current); }
    html += contactListItemTemplate(contactViewModel(c), c.id === selectedId);
  }
  list.innerHTML = html;
}
function findSelectedContact() {
  if (!selectedId) return null;
  return contacts.find(function (x) { return x.id === selectedId; }) || null;
}
function renderEmptyDetails(d) { d.innerHTML = ""; closeMobileMenu(); }
function renderDetails() {
  let d = getEl("contactDetails");
  if (!d) return;
  if (!selectedId) return renderEmptyDetails(d);
  let c = findSelectedContact();
  if (!c) return renderEmptyDetails(d);
  d.innerHTML = contactDetailsTemplate({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone || "-",
    initials: getInitials(c.name),
    colorClass: c.colorClass || colorClassFor(c.id || (c.email || c.name || "")),
  });
  closeMobileMenu();
  if (isMobile()) showMobileDetails();
}

function getFormValues() {
  let n = getEl("contactName");
  let e = getEl("contactEmail");
  let p = getEl("contactPhone");
  let name = normalize(n ? n.value : "");
  let email = normalize(e ? e.value : "").toLowerCase();
  let phone = normalize(p ? p.value : "");
  return { name, email, phone };
}
function usedColorSet() {
  return new Set(contacts.map(function (c) { return c.colorClass; }).filter(Boolean));
}
function createFromForm() {
  let v = getFormValues();
  if (!v.name || !v.email) return;
  let used = usedColorSet();
  let id = generateId();
  let nc = { id: id, name: v.name, email: v.email, phone: v.phone, colorClass: pickUniqueColorClass(id, used) };
  contacts.push(nc);
  selectedId = nc.id;
  saveContacts();
  renderContactsList();
  renderDetails();
  closeModal();
  showContactSuccessBox("Contact successfully created");
}
function saveEdit(editId) {
  let idx = contacts.findIndex(function (x) { return x.id === editId; });
  if (idx === -1) return;
  let v = getFormValues();
  if (!v.name || !v.email) return;
  contacts[idx] = { ...contacts[idx], name: v.name, email: v.email, phone: v.phone };
  selectedId = editId;
  saveContacts();
  renderContactsList();
  renderDetails();
  closeModal();
  showContactSuccessBox("Contact successfully edited");
}
function deleteContact(id) {
  contacts = contacts.filter(function (c) { return c.id !== id; });
  selectedId = null;
  saveContacts();
  renderContactsList();
  renderDetails();
  if (isMobile()) showMobileList();
  showContactSuccessBox("Contact successfully deleted");
}
function handleSecondary(btn) {
  let form = getEl("addContactForm");
  let editId = form ? form.dataset.editId || "" : "";
  if (btn.dataset.action === "cancel") return closeModal();
  if (btn.dataset.action === "delete" && editId) { deleteContact(editId); closeModal(); }
}
function handleMobileNav(e) {
  if (e.target.closest("#mobileBackBtn")) { if (isMobile()) showMobileList(); return true; }
  if (e.target.closest("#mobileMenuBtn")) { if (isMobile()) window.toggleMobileMenu && window.toggleMobileMenu(); return true; }
  return false;
}
function handleSelectContact(e) {
  let item = e.target.closest(".contact-item");
  if (!item || !item.dataset.id) return false;
  selectedId = item.dataset.id;
  renderContactsList();
  renderDetails();
  return true;
}
function handleActionButtons(e) {
  let act = e.target.closest(".contact-action");
  if (!act || !act.dataset.action || !act.dataset.id) return false;
  let id = act.dataset.id;
  let a = act.dataset.action;
  if (a === "delete") { closeMobileMenu(); deleteContact(id); return true; }
  if (a === "edit") { closeMobileMenu(); openModal("edit", contacts.find(function (x) { return x.id === id; })); return true; }
  return false;
}
function handleModalCloseClicks(e) {
  if (e.target.closest("#closeAddContact")) return closeModal(), true;
  let sec = e.target.closest("#modalSecondaryBtn");
  if (sec) return handleSecondary(sec), true;
  let back = getEl("addContactModal");
  if (back && e.target === back) return closeModal(), true;
  return false;
}
function handleClick(e) {
  if (e.target.closest("#openAddContact")) return openModal("create", null);
  if (handleMobileNav(e)) return;
  window.handleOutsideMobileMenuClick && window.handleOutsideMobileMenuClick(e);
  if (handleSelectContact(e)) return;
  if (handleActionButtons(e)) return;
  handleModalCloseClicks(e);
}
function handleSubmit(e) {
  if (!e.target || e.target.id !== "addContactForm") return;
  e.preventDefault();
  let mode = e.target.dataset.mode || "create";
  let editId = e.target.dataset.editId || "";
  if (mode === "create") createFromForm();
  if (mode === "edit" && editId) saveEdit(editId);
}