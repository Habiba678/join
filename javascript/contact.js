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
  let h = 0;
  let s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function colorClassFor(seed) {
  return "avatar-color-" + (hashString(seed) % 12);
}

function pickUniqueColorClass(seed, usedSet) {
  let start = hashString(seed) % 12;
  for (let k = 0; k < 12; k++) {
    let cls = "avatar-color-" + ((start + k) % 12);
    if (!usedSet.has(cls)) return cls;
  }
  return "avatar-color-" + start;
}

function getInitials(fullName) {
  let n = normalize(fullName);
  if (!n) return "";
  let p = n.split(" ").filter(Boolean);
  let f = (p[0] || "")[0] || "";
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

  let used = new Set();
  let changed = false;

  for (let i = 0; i < contacts.length; i++) {
    let c = contacts[i];
    let seed = c.id || (c.email || c.name || "");

    if (!c.colorClass || used.has(c.colorClass)) {
      c.colorClass = pickUniqueColorClass(seed, used);
      changed = true;
    }

    used.add(c.colorClass);
  }

  if (changed) saveContacts();
}

function saveContacts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch {}
}

function getEl(id) {
  return document.getElementById(id);
}

function isMobile() {
  return window.matchMedia && window.matchMedia("(max-width: 320px)").matches;
}

function showMobileDetails() {
  let l = getEl("contactsList");
  let d = getEl("contactDetails");
  if (l) l.classList.add("d-none");
  if (d) d.classList.remove("d-none");
}

function showMobileList() {
  let l = getEl("contactsList");
  let d = getEl("contactDetails");
  if (d) d.classList.add("d-none");
  if (l) l.classList.remove("d-none");
  let menu = getEl("mobileActionsMenu");
  if (menu) menu.classList.remove("is-open");
}

function toggleMobileMenu() {
  let menu = getEl("mobileActionsMenu");
  if (!menu) return;
  menu.classList.toggle("is-open");
}

function closeMobileMenu() {
  let menu = getEl("mobileActionsMenu");
  if (menu) menu.classList.remove("is-open");
}

function removeModalNow() {
  let m = getEl("addContactModal");
  if (m) m.remove();
}

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

function applyModalAvatar(data) {
  let m = getEl("addContactModal");
  if (!m) return;

  let initials = (data.initials || "").trim();
  let colorClass = (data.colorClass || "").trim();
  if (!initials || !colorClass) return;

  let avatar =
    m.querySelector("#modalAvatar") ||
    m.querySelector("#editAvatar") ||
    m.querySelector(".modal .contact-avatar") ||
    m.querySelector(".modal .avatar") ||
    m.querySelector(".modal .avatar-circle") ||
    m.querySelector(".modal .profile-badge");

  if (!avatar) {
    let candidates = Array.from(m.querySelectorAll("div,span,p")).filter(function (el) {
      return (el.textContent || "").trim() === initials;
    });
    avatar = candidates[0] || null;
  }

  if (!avatar) return;

  avatar.textContent = initials;

  Array.from(avatar.classList).forEach(function (cls) {
    if (cls.indexOf("avatar-color-") === 0) avatar.classList.remove(cls);
  });
  avatar.classList.add(colorClass);

  let probe = document.createElement("div");
  probe.className = colorClass;
  probe.style.position = "absolute";
  probe.style.left = "-9999px";
  probe.style.top = "-9999px";
  document.body.appendChild(probe);
  let bg = getComputedStyle(probe).backgroundColor || "";
  probe.remove();

  if (bg) avatar.style.backgroundColor = bg;
}

function openModal(mode, contact) {
  removeModalNow();
  let data = buildModalData(mode, contact);
  document.body.insertAdjacentHTML("beforeend", contactModalTemplate(mode, data));
  let m = getEl("addContactModal");
  if (!m) return;

  applyModalAvatar(data);

  m.classList.remove("d-none");
  m.classList.remove("is-closing");
  requestAnimationFrame(function () {
    m.classList.add("is-open");
    requestAnimationFrame(function () {
      applyModalAvatar(data);
    });
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
  function finish() {
    if (done) return;
    done = true;
    removeModalNow();
  }

  box.addEventListener("transitionend", finish, { once: true });
  setTimeout(finish, 300);
}

function renderContactsList() {
  let list = getEl("contactsList");
  if (!list) return;

  let sorted = [...contacts].sort(sortContacts);
  let html = "";
  let current = "";

  for (let i = 0; i < sorted.length; i++) {
    let c = sorted[i];
    let g = groupKey(c.name);

    if (g && g !== current) {
      current = g;
      html += `<div class="letter-group">${current}</div>`;
    }

    html += contactListItemTemplate(
      {
        id: c.id,
        name: c.name,
        email: c.email,
        initials: getInitials(c.name),
        colorClass: c.colorClass || colorClassFor(c.id || (c.email || c.name || ""))
      },
      c.id === selectedId
    );
  }

  list.innerHTML = html;
}

function renderDetails() {
  let d = getEl("contactDetails");
  if (!d) return;

  let c = contacts.find(function (x) {
    return x.id === selectedId;
  });

  if (!c) {
    d.innerHTML = "";
    return;
  }

  d.innerHTML = contactDetailsTemplate({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone || "-",
    initials: getInitials(c.name),
    colorClass: c.colorClass || colorClassFor(c.id || (c.email || c.name || ""))
  });

  closeMobileMenu();
  if (isMobile()) showMobileDetails();
}

function createFromForm() {
  let n = getEl("contactName");
  let e = getEl("contactEmail");
  let p = getEl("contactPhone");

  let name = normalize(n ? n.value : "");
  let email = normalize(e ? e.value : "").toLowerCase();
  let phone = normalize(p ? p.value : "");

  if (!name || !email) return;

  let used = new Set(contacts.map(function (c) { return c.colorClass; }).filter(Boolean));

  let id = generateId();
  let nc = {
    id: id,
    name: name,
    email: email,
    phone: phone,
    colorClass: pickUniqueColorClass(id, used)
  };

  contacts.push(nc);
  selectedId = nc.id;

  saveContacts();
  renderContactsList();
  renderDetails();
}

function saveEdit(editId) {
  let idx = contacts.findIndex(function (x) {
    return x.id === editId;
  });
  if (idx === -1) return;

  let n = getEl("contactName");
  let e = getEl("contactEmail");
  let p = getEl("contactPhone");

  let name = normalize(n ? n.value : "");
  let email = normalize(e ? e.value : "").toLowerCase();
  let phone = normalize(p ? p.value : "");

  if (!name || !email) return;

  contacts[idx] = { ...contacts[idx], name: name, email: email, phone: phone };
  selectedId = editId;

  saveContacts();
  renderContactsList();
  renderDetails();
}

function deleteContact(id) {
  contacts = contacts.filter(function (c) {
    return c.id !== id;
  });

  selectedId = contacts.length ? contacts[0].id : null;

  saveContacts();
  renderContactsList();
  renderDetails();
  if (isMobile()) showMobileList();
}

function handleSecondary(btn) {
  let form = getEl("addContactForm");
  let editId = form ? form.dataset.editId || "" : "";

  if (btn.dataset.action === "cancel") return closeModal();
  if (btn.dataset.action === "delete" && editId) {
    deleteContact(editId);
    closeModal();
  }
}

function handleClick(e) {
  if (e.target.closest("#openAddContact")) return openModal("create", null);

  if (e.target.closest("#mobileBackBtn")) {
    if (isMobile()) showMobileList();
    return;
  }

  if (e.target.closest("#mobileMenuBtn")) {
    if (isMobile()) toggleMobileMenu();
    return;
  }

  if (isMobile()) {
    let menu = getEl("mobileActionsMenu");
    if (menu && menu.classList.contains("is-open")) {
      let insideMenu = e.target.closest("#mobileActionsMenu");
      let onMenuBtn = e.target.closest("#mobileMenuBtn");
      if (!insideMenu && !onMenuBtn) closeMobileMenu();
    }
  }

  let item = e.target.closest(".contact-item");
  if (item && item.dataset.id) {
    selectedId = item.dataset.id;
    renderContactsList();
    renderDetails();
    return;
  }

  function closeModal(){
    let m = getEl("addContactModal");
    if (!m) return;

    m.classList.remove("is-open");
    m.classList.add("is-closing");

    let box = m.querySelector(".modal");
    if (!box) return removeModalNow();

    box.addEventListener("transitionend", function(ev){
      if (ev.propertyName !== "transform") return;
      removeModalNow();
    }, { once:true });
  }

  let act = e.target.closest(".contact-action");
  if (act && act.dataset.action && act.dataset.id) {
    let id = act.dataset.id;
    let a = act.dataset.action;

    if (a === "delete") {
      closeMobileMenu();
      return deleteContact(id);
    }
    if (a === "edit") {
      closeMobileMenu();
      let c = contacts.find(function (x) {
        return x.id === id;
      });
      return openModal("edit", c);
    }
  }

  if (e.target.closest("#closeAddContact")) return closeModal();

  let sec = e.target.closest("#modalSecondaryBtn");
  if (sec) return handleSecondary(sec);

  let back = getEl("addContactModal");
  if (back && e.target === back) closeModal();
}

function handleSubmit(e) {
  if (!e.target || e.target.id !== "addContactForm") return;
  e.preventDefault();

  let mode = e.target.dataset.mode || "create";
  let editId = e.target.dataset.editId || "";

  if (mode === "create") createFromForm();
  if (mode === "edit" && editId) saveEdit(editId);

  closeModal();
}

function init() {
  removeModalNow();
  loadContacts();

  if (!selectedId && contacts.length) selectedId = contacts[0].id;

  renderContactsList();
  renderDetails();

  if (isMobile()) showMobileList();

  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
}

document.addEventListener("DOMContentLoaded", init);