(function () {
  const BP = 680;

  function isMobile() {
    return window.matchMedia && window.matchMedia(`(max-width: ${BP}px)`).matches;
  }

  function closeMenu() {
    const menu = document.getElementById("mobileActionsMenu");
    if (menu) menu.classList.remove("is-open");
  }

  function syncMenuDataId() {
    const menu = document.getElementById("mobileActionsMenu");
    if (!menu) return;
    const id = window.selectedId || "";
    menu.querySelectorAll(".contact-action").forEach((btn) => {
      btn.dataset.id = id;
    });
  }

  function showDetails() {
    if (!isMobile()) return;
    document.body.classList.add("show-contact-details");
    syncMenuDataId();
    closeMenu();
  }

  function showList() {
    document.body.classList.remove("show-contact-details");
    closeMenu();
  }

  window.isMobile = isMobile;
  window.showMobileDetails = showDetails;
  window.showMobileList = showList;

  const originalRenderDetails = window.renderDetails;
  if (typeof originalRenderDetails === "function") {
    window.renderDetails = function () {
      originalRenderDetails();
      syncMenuDataId();
      if (isMobile() && window.selectedId) showDetails();
    };
  }

  document.addEventListener("click", (e) => {
    const back = e.target.closest("#mobileBackBtn");
    if (back) {
      e.preventDefault();
      showList();
      return;
    }

    const menuBtn = e.target.closest("#mobileMenuBtn");
    const menu = document.getElementById("mobileActionsMenu");

    if (menuBtn) {
      e.preventDefault();
      if (!menu) return;
      syncMenuDataId();
      menu.classList.toggle("is-open");
      return;
    }

    if (e.target.closest("#mobileActionsMenu")) {
      return;
    }

    closeMenu();
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) {
      showList();
      return;
    }
    if (window.selectedId) showDetails();
  });

  document.addEventListener("DOMContentLoaded", () => {
    if (isMobile()) {
      if (window.selectedId) showDetails();
      else showList();
    }
  });
})();