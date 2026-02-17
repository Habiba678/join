document.addEventListener("DOMContentLoaded", function () {
  (function populateHeaderInitials() {
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
        if (s) return JSON.parse(s);
      } catch (e) { /* ignore */ }
      const c = cookieToObj();
      if (!c.loggedInUser) return null;

      try { return JSON.parse(c.loggedInUser); }
      catch (e) {
        return { namen: String(c.loggedInUser || '') };
      }
    }

    function cleanDisplayName(val) {
      if (!val) return null;
      let s = String(val).trim();
      if (/^\[object\b/i.test(s) || /^\{/.test(s) || /\bobject\b/i.test(s)) return null;
      if (/^[^@\s]+@[^@\s]+$/.test(s)) {
        const lp = s.split('@')[0].replace(/[._\-]+/g, ' ');
        s = lp.split(/\s+/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      }
      return s || null;
    }

    function getInitials(name) {
      if (!name) return 'G';
      const n = String(name).trim();
      if (!n) return 'G';
      const parts = n.split(/\s+/);
      const first = parts[0] ? parts[0][0] : '';
      const last = parts.length > 1 ? (parts[parts.length-1][0] || '') : '';
      return (first + last).toUpperCase();
    }

    const user = parseLoggedUser();
    const rawName = user && (user.namen || user.name || user.fullName || user.mail || user.email) || null;
    const displayName = cleanDisplayName(rawName) || (user && user.mail ? cleanDisplayName(user.mail) : null);
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
  })();

  const btn = document.getElementById("headerUserBtn");
  const menu = document.getElementById("userMenu");

  if (btn && menu) {
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
  }

  const links = document.querySelectorAll(".menu a[href]");
  if (!links.length) return;

  const current = location.pathname.split("/").pop() || "index.html";

  links.forEach((a) => {
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
