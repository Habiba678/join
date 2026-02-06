const MOBILE_BP = 900;

window.isMobile = function () {
  return window.matchMedia && window.matchMedia(`(max-width: 
    ${MOBILE_BP}px)`).matches;
};

window.showMobileDetails = function () {
  if (!window.isMobile()) return;
  document.body.classList.add("show-contact-details");
};

window.showMobileList = function () {
  document.body.classList.remove("show-contact-details");
};

document.addEventListener("click", (e) => {
  const back = e.target.closest("#contactsBackBtn");
  if (!back) return;
  e.preventDefault();
  window.showMobileList();
});

window.addEventListener("resize", () => {
  if (!window.isMobile()) window.showMobileList();
});

document.addEventListener("DOMContentLoaded", () => {
  if (window.isMobile()) window.showMobileList();
});

function toggleMoreMenu(forceOpen) {
  const btn = document.getElementById("contactsMoreBtn");
  const menu = document.getElementById("contactsMoreMenu");
  if (!btn || !menu) return;

  const shouldOpen = typeof forceOpen === "boolean"
    ? forceOpen
    : menu.classList.contains("d-none");

  if (shouldOpen) {
    menu.classList.remove("d-none");
    btn.classList.remove("d-none");
  } else {
    menu.classList.add("d-none");
  }
}

function closeMoreMenu() {
  const menu = document.getElementById("contactsMoreMenu");
  if (menu) menu.classList.add("d-none");
}

function updateMoreBtnVisibility() {
  const btn = document.getElementById("contactsMoreBtn");
  if (!btn) return;

  if (selectedId) btn.classList.remove("d-none");
  else btn.classList.add("d-none");

  closeMoreMenu();
}

document.addEventListener("click", (e) => {
  const moreBtn = e.target.closest("#contactsMoreBtn");
  const menu = document.getElementById("contactsMoreMenu");
  const insideMenu = e.target.closest("#contactsMoreMenu");

  if (moreBtn) {
    e.preventDefault();
    toggleMoreMenu();
    return;
  }

  if (e.target.closest("#contactsMoreEdit")) {
    e.preventDefault();
    closeMoreMenu();
    if (!selectedId) return;

    const c = contacts.find(x => x.id === selectedId);
    if (c) openModal("edit", c);
    return;
  }

  if (e.target.closest("#contactsMoreDelete")) {
    e.preventDefault();
    closeMoreMenu();
    if (!selectedId) return;

    deleteContact(selectedId);
    return;
  }

  if (menu && !menu.classList.contains("d-none") && !insideMenu) {
    closeMoreMenu();
  }
});

const _renderDetails = renderDetails;
renderDetails = function () {
  _renderDetails();
  updateMoreBtnVisibility();
};