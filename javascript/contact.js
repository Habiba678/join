const STORAGE_KEY = "join_contacts_v1";
const dbTask = "https://join-da53b-default-rtdb.firebaseio.com/";

let contacts = [];
let selectedId = null;

async function init() {
  removeModalNow();
  await loadContacts();

  selectedId = null;

  renderContactsList();
  renderDetails();

  if (window.isMobile && window.isMobile()) {
    window.showMobileList && window.showMobileList();
  }

  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
}

document.addEventListener("DOMContentLoaded", async function () {
  await (window.idbStorage && window.idbStorage.ready ? window.idbStorage.ready : Promise.resolve());
  await init();
});

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
        const clone = Object.assign({}, entry);
        delete clone.id;
        if (clone.hasOwnProperty(nodeName)) return clone[nodeName];
        const keys = Object.keys(clone);
        if (keys.length) return clone;
      }
    } else if (typeof root === "object") {
      const vals = Object.values(root);
      for (let i = 0; i < vals.length; i++) {
        const e = vals[i];
        if (e && e.id === nodeName) {
          const clone = Object.assign({}, e);
          delete clone.id;
          if (clone.hasOwnProperty(nodeName)) return clone[nodeName];
          const keys = Object.keys(clone);
          if (keys.length) return clone;
        }
      }
      if (root[nodeName] !== undefined) return root[nodeName];
    }
  } catch (e) {}

  return null;
}

async function loadContacts() {


  let data = null;
  try {
    data = await fetchDBNode("contacts");
  } catch {
    data = null;
  }

  if (!data) {
    contacts = [];
  } else if (Array.isArray(data)) {
    contacts = data.filter(Boolean);
  } else if (typeof data === "object") {
    if (Object.keys(data).length && Object.keys(data).every((k) => data[k] && data[k].id)) {
      contacts = Object.values(data);
    } else {
      contacts = Object.entries(data).map(([key, val]) => ({ ...(val || {}), id: val && val.id ? val.id : key }));
    }
  } else {
    contacts = [];
  }

  if (window.idbStorage && typeof window.idbStorage.saveContacts === "function") {
    try {
      await window.idbStorage.saveContacts(contacts);
    } catch (err) {}
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

  if (changed) await saveContacts();
}

async function saveContacts() {


  try {
    const map = {};
    for (const c of contacts) {
      if (!c.id) c.id = generateId();
      map[c.id] = c;
    }

    const response = await fetch(dbTask + "contacts.json", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(map),
    });
    await response.json();

    if (window.idbStorage && typeof window.idbStorage.saveContacts === "function") {
      try {
        await window.idbStorage.saveContacts(contacts);
      } catch (err) {}
    }
  } catch (e) {}
}

function getEl(id) {
  return document.getElementById(id);
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

  m.setAttribute("data-mode", String(mode || "").trim().toLowerCase());

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

  requestAnimationFrame(function () {
    box.classList.add("is-open");
  });

  setTimeout(function () {
    box.classList.remove("is-open");
    setTimeout(function () {
      box.remove();
    }, 350);
  }, 2200);
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
      html += letterGroupTemplate(current);
    }

    html += contactListItemTemplate(
      {
        id: c.id,
        name: c.name,
        email: c.email,
        initials: getInitials(c.name),
        colorClass: c.colorClass || colorClassFor(c.id || (c.email || c.name || "")),
      },
      c.id === selectedId
    );
  }

  list.innerHTML = html;
}

function renderDetails() {
  let d = getEl("contactDetails");
  if (!d) return;

  if (!selectedId) {
    d.innerHTML = "";
    window.closeMobileMenu && window.closeMobileMenu();
    return;
  }

  let c = contacts.find(function (x) {
    return x.id === selectedId;
  });

  if (!c) {
    d.innerHTML = "";
    window.closeMobileMenu && window.closeMobileMenu();
    return;
  }

  d.innerHTML = contactDetailsTemplate({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone || "-",
    initials: getInitials(c.name),
    colorClass: c.colorClass || colorClassFor(c.id || (c.email || c.name || "")),
  });

  window.closeMobileMenu && window.closeMobileMenu();
  if (window.isMobile && window.isMobile()) window.showMobileDetails && window.showMobileDetails();
}

function createFromForm() {
  let n = getEl("contactName");
  let e = getEl("contactEmail");
  let p = getEl("contactPhone");

  let name = normalize(n ? n.value : "");
  let email = normalize(e ? e.value : "").toLowerCase();
  let phone = normalize(p ? p.value : "");

  if (!name || !email) return;

  let used = new Set(contacts.map(function (c) {
    return c.colorClass;
  }).filter(Boolean));

  let id = generateId();
  let nc = {
    id: id,
    name: name,
    email: email,
    phone: phone,
    colorClass: pickUniqueColorClass(id, used),
  };

  contacts.push(nc);
  selectedId = nc.id;

  saveContacts();
  renderContactsList();
  renderDetails();

  closeModal();
  showContactSuccessBox("Contact successfully created");
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

  closeModal();
  showContactSuccessBox("Contact successfully edited");
}

function deleteContact(id) {
  contacts = contacts.filter(function (c) {
    return c.id !== id;
  });

  selectedId = null;

  saveContacts();
  renderContactsList();
  renderDetails();

  if (window.isMobile && window.isMobile()) window.showMobileList && window.showMobileList();

  showContactSuccessBox("Contact successfully deleted");
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
    if (window.isMobile && window.isMobile()) window.showMobileList && window.showMobileList();
    return;
  }

  if (e.target.closest("#mobileMenuBtn")) {
    if (window.isMobile && window.isMobile()) window.toggleMobileMenu && window.toggleMobileMenu();
    return;
  }

  window.handleOutsideMobileMenuClick && window.handleOutsideMobileMenuClick(e);

  let item = e.target.closest(".contact-item");
  if (item && item.dataset.id) {
    selectedId = item.dataset.id;
    renderContactsList();
    renderDetails();
    return;
  }

  let act = e.target.closest(".contact-action");
  if (act && act.dataset.action && act.dataset.id) {
    let id = act.dataset.id;
    let a = act.dataset.action;

    if (a === "delete") {
      window.closeMobileMenu && window.closeMobileMenu();
      return deleteContact(id);
    }
    if (a === "edit") {
      window.closeMobileMenu && window.closeMobileMenu();
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
}