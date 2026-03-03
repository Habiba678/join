document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("headerUserBtn");
  const menu = document.getElementById("userMenu");
  if (!btn || !menu) return;

  function setOpen(open) {
    menu.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
  }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(!menu.classList.contains("is-open"));
  });

  menu.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".header-user-area")) setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });
  function populateHeaderInitials() {
    function cookieToObj() {
      return document.cookie.split(";").reduce((acc, cookie) => {
        const [k, ...rest] = cookie.trim().split("=");
        acc[k] = rest.length ? decodeURIComponent(rest.join("=")) : "";
        return acc;
      }, {});
    }

    function parseLoggedUser() {
      try {
        const s = sessionStorage.getItem('loggedInUser');
        if (s) {
          try { const p = JSON.parse(s); return (p && typeof p === 'object') ? { ...p, namen: p.namen || p.name || p.fullName || p.mail } : { namen: String(p) }; }
          catch (e) { return { namen: String(s) }; }
        }
      } catch (e) { /* ignore */ }

      const c = cookieToObj();
      if (!c.loggedInUser) return null;
      try {
        const p = JSON.parse(c.loggedInUser);
        return (p && typeof p === 'object') ? { ...p, namen: p.namen || p.name || p.fullName || p.mail } : { namen: String(p) };
      } catch (e) {
        return { namen: String(c.loggedInUser || '') };
      }
    }

    function cleanDisplayName(val) {
      if (!val) return null;
      let s = (typeof val === 'object') ? (val.namen || val.name || val.fullName || val.mail || '') : String(val || '');
      s = s.trim(); if (!s) return null;
      if (/^\[object\b/i.test(s) || /^\{/.test(s) || /\bobject\b/i.test(s)) return null;
      if (/^[^@\s]+@[^@\s]+$/.test(s)) s = s.split('@')[0].replace(/[._\-]+/g, ' ');
      s = s.replace(/[._\-]+/g, ' ').replace(/\s+/g, ' ').trim();
      s = s.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      return s || null;
    }

    function getInitials(name) {
      if (!name) return 'G';
      let s = (typeof name === 'object') ? (name.namen || name.name || name.fullName || name.mail || '') : String(name || '');
      s = s.trim(); if (!s) return 'G';
      if (/^[^@\s]+@[^@\s]+$/.test(s)) s = s.split('@')[0];
      const parts = s.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] || 'G').toUpperCase();
    }

    const user = parseLoggedUser();
    const rawName = user && (user.namen || user.name || user.fullName || user.mail) || null;
    const displayName = cleanDisplayName(rawName) || (user && (user.namen || user.name) ? cleanDisplayName(user.namen || user.name) : null);
    const initials = displayName ? getInitials(displayName) : 'G';
    const btnLegacy = document.querySelector('.header-guest');
    if (btnLegacy) {
      btnLegacy.textContent = initials;
      if (displayName) btnLegacy.setAttribute('title', displayName);
    }

    const btn = document.getElementById('headerUserBtn');
    if (btn) {
      btn.textContent = initials;
      if (displayName) btn.setAttribute('title', displayName);
      if (displayName) btn.setAttribute('aria-label', `User menu — ${displayName}`);
    }
  }

  populateHeaderInitials();

  const links = document.querySelectorAll(".menu a[href]");
  const footerLinks = document.querySelectorAll(".sidebar-footer a[href]");
  if (!links.length) return;
  if (!footerLinks.length) return;

  const current = location.pathname.split("/").pop() || "index.html";
links.forEach((a) => {
  const target = new URL(a.getAttribute("href"), location.href).pathname
    .split("/")
    .pop();
  a.classList.toggle("active", target === current);
});
  footerLinks.forEach((a) => {
    const target = new URL(a.getAttribute("href"), location.href).pathname.split("/").pop();
    a.classList.toggle("active", target === current);
  });

  links.forEach((a) => {
    a.addEventListener("click", () => {
      links.forEach((x) => x.classList.remove("active"));
      a.classList.add("active");
    });
  });

});
