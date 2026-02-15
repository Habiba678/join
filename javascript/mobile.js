const MOBILE_BP = 680;

window.isMobile = function () {
  return window.matchMedia && window.matchMedia(`(max-width: ${MOBILE_BP}px)`).matches;
};

function el(id) {
  return document.getElementById(id);
}

function menuEl() {
  return el("mobileActionsMenu");
}

function btnEl() {
  return el("mobileMenuBtn");
}

function getSelectedId() {
  try {
    return typeof selectedId !== "undefined" ? selectedId : "";
  } catch {
    return "";
  }
}

function syncMenuIds() {
  const menu = menuEl();
  if (!menu) return;

  const editBtn = menu.querySelector('[data-action="edit"]');
  const delBtn = menu.querySelector('[data-action="delete"]');

  const id = getSelectedId();

  if (editBtn) editBtn.dataset.id = id || "";
  if (delBtn) delBtn.dataset.id = id || "";
}

window.showMobileDetails = function () {
  if (!window.isMobile()) return;
  document.body.classList.add("show-contact-details");
  const btn = btnEl();
  if (btn) btn.classList.remove("d-none");
  syncMenuIds();
  window.closeMobileMenu();
};

window.showMobileList = function () {
  document.body.classList.remove("show-contact-details");
  const btn = btnEl();
  if (btn) btn.classList.add("d-none");
  window.closeMobileMenu();
};

window.toggleMobileMenu = function () {
  const menu = menuEl();
  if (!menu) return;

  syncMenuIds();

  if (menu.classList.contains("is-open")) {
    window.closeMobileMenu();
  } else {
    menu.classList.remove("d-none");
    menu.classList.add("is-open");
  }
};

window.closeMobileMenu = function () {
  const menu = menuEl();
  if (!menu) return;
  menu.classList.remove("is-open");
  menu.classList.add("d-none");
};

window.handleOutsideMobileMenuClick = function (e) {
  if (!window.isMobile()) return;

  const menu = menuEl();
  if (!menu || !menu.classList.contains("is-open")) return;

  const insideMenu = e.target.closest("#mobileActionsMenu");
  const onBtn = e.target.closest("#mobileMenuBtn");

  if (!insideMenu && !onBtn) window.closeMobileMenu();
};

window.addEventListener("resize", () => {
  if (!window.isMobile()) window.showMobileList();
});

document.addEventListener("DOMContentLoaded", () => {
  const menu = menuEl();
  if (menu) menu.classList.add("d-none");

  if (window.isMobile()) window.showMobileList();
  else {
    const btn = btnEl();
    if (btn) btn.classList.add("d-none");
  }

  syncMenuIds();
});

(function () {
  if (typeof window.renderDetails !== "function") return;

  const _renderDetails = window.renderDetails;
  window.renderDetails = function () {
    _renderDetails();
    syncMenuIds();
    if (window.isMobile()) window.showMobileDetails();
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  const guest = document.querySelector(".header-guest");
  const menu = document.getElementById("userMenu");

  if (!guest || !menu) return;

  function closeMenu() {
    menu.classList.add("d-none");
  }

  function toggleMenu() {
    menu.classList.toggle("d-none");
  }

  guest.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !guest.contains(e.target)) {
      closeMenu();
    }
  });

  window.addEventListener("resize", closeMenu);
});

