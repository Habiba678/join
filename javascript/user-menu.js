document.addEventListener("DOMContentLoaded", initUserMenu);

/**
 * Initialize user menu.
 */
function initUserMenu() {
  const els = getUserMenuElements();
  if (!els) return;
  bindUserMenuEvents(els);
  populateHeaderInitials();
  updateActiveMenuLinks();
}

/**
 * Get user menu elements.
 */
function getUserMenuElements() {
  const btn = document.getElementById("headerUserBtn");
  const menu = document.getElementById("userMenu");
  if (!btn || !menu) return null;
  return { btn: btn, menu: menu };
}

/**
 * Bind user menu events.
 */
function bindUserMenuEvents(els) {
  bindUserMenuToggle(els);
  bindUserMenuStopPropagation(els);
  bindUserMenuOutsideClose(els);
  bindUserMenuEscape(els);
}

/**
 * Bind user menu toggle.
 */
function bindUserMenuToggle(els) {
  els.btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleUserMenu(els);
  });
}

/**
 * Bind user menu stop propagation.
 */
function bindUserMenuStopPropagation(els) {
  els.menu.addEventListener("click", (e) => e.stopPropagation());
}

/**
 * Bind user menu outside close.
 */
function bindUserMenuOutsideClose(els) {
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".header-user-area")) setUserMenuOpen(els, false);
  });
}

/**
 * Bind user menu escape.
 */
function bindUserMenuEscape(els) {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setUserMenuOpen(els, false);
  });
}

/**
 * Toggle user menu.
 */
function toggleUserMenu(els) {
  const open = !els.menu.classList.contains("is-open");
  setUserMenuOpen(els, open);
}

/**
 * Set user menu open.
 */
function setUserMenuOpen(els, open) {
  els.menu.classList.toggle("is-open", open);
  els.btn.setAttribute("aria-expanded", open ? "true" : "false");
  els.menu.setAttribute("aria-hidden", open ? "false" : "true");
}

/**
 * Populate header initials.
 */
function populateHeaderInitials() {
  const user = getLoggedUser();
  const displayName = getDisplayName(user);
  const initials = getInitialsFromName(displayName);
  applyHeaderInitials(displayName, initials);
}

/**
 * Get logged user.
 */
function getLoggedUser() {
  return readLoggedUserFromSession() || readLoggedUserFromCookie();
}

/**
 * Read logged user from session.
 */
function readLoggedUserFromSession() {
  try {
    return normalizeUserFromStorage(sessionStorage.getItem("loggedInUser"));
  } catch (e) {
    return null;
  }
}

/**
 * Read logged user from cookie.
 */
function readLoggedUserFromCookie() {
  const cookies = getCookieMap();
  if (!cookies.loggedInUser) return null;
  return normalizeUserFromStorage(cookies.loggedInUser);
}

/**
 * Normalize user from storage.
 */
function normalizeUserFromStorage(raw) {
  if (!raw) return null;
  const parsed = safeParseJson(raw);
  return buildUserObject(parsed ?? raw);
}

/**
 * Safe parse JSON.
 */
function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
}

/**
 * Build user object.
 */
function buildUserObject(value) {
  if (value && typeof value === "object") {
    return { ...value, namen: value.namen || value.name || value.fullName || value.mail };
  }
  return { namen: String(value) };
}

/**
 * Get cookie map.
 */
function getCookieMap() {
  return document.cookie.split(";").reduce((acc, cookie) => {
    const [k, ...rest] = cookie.trim().split("=");
    acc[k] = rest.length ? decodeURIComponent(rest.join("=")) : "";
    return acc;
  }, {});
}

/**
 * Get display name.
 */
function getDisplayName(user) {
  const raw = extractUserName(user);
  return cleanDisplayName(raw);
}

/**
 * Extract user name.
 */
function extractUserName(user) {
  if (!user) return null;
  return user.namen || user.name || user.fullName || user.mail || null;
}

/**
 * Clean display name.
 */
function cleanDisplayName(val) {
  const name = normalizeNameValue(val);
  if (!name || isObjectLikeString(name)) return null;
  return titleCaseWords(normalizeEmailOrName(name)) || null;
}

/**
 * Normalize name value.
 */
function normalizeNameValue(val) {
  if (!val) return "";
  const s = typeof val === "object" ? extractUserName(val) : String(val || "");
  return (s || "").trim();
}

/**
 * Check object-like string.
 */
function isObjectLikeString(s) {
  return /^\[object\b/i.test(s) || /^\{/.test(s) || /\bobject\b/i.test(s);
}

/**
 * Normalize email or name.
 */
function normalizeEmailOrName(s) {
  if (isEmailString(s)) s = s.split("@")[0].replace(/[._\\-]+/g, " ");
  return s.replace(/[._\\-]+/g, " ").replace(/\\s+/g, " ").trim();
}

/**
 * Check email string.
 */
function isEmailString(s) {
  return /^[^@\\s]+@[^@\\s]+$/.test(s);
}

/**
 * Title case words.
 */
function titleCaseWords(s) {
  return s.split(" ").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

/**
 * Get initials from name.
 */
function getInitialsFromName(name) {
  const s = normalizeInitialsSource(name);
  if (!s) return "G";
  const parts = s.split(/\\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] || "G").toUpperCase();
}

/**
 * Normalize initials source.
 */
function normalizeInitialsSource(name) {
  let s = normalizeNameValue(name);
  if (!s) return "";
  if (isEmailString(s)) s = s.split("@")[0];
  return s.trim();
}

/**
 * Apply header initials.
 */
function applyHeaderInitials(displayName, initials) {
  updateLegacyHeader(displayName, initials);
  updateUserButton(displayName, initials);
}

/**
 * Update legacy header.
 */
function updateLegacyHeader(displayName, initials) {
  const btnLegacy = document.querySelector(".header-guest");
  if (!btnLegacy) return;
  btnLegacy.textContent = initials;
  if (displayName) btnLegacy.setAttribute("title", displayName);
}

/**
 * Update user button.
 */
function updateUserButton(displayName, initials) {
  const btn = document.getElementById("headerUserBtn");
  if (!btn) return;
  btn.textContent = initials;
  if (displayName) btn.setAttribute("title", displayName);
  if (displayName) btn.setAttribute("aria-label", `User menu — ${displayName}`);
}

/**
 * Update active menu links.
 */
function updateActiveMenuLinks() {
  const links = document.querySelectorAll(".menu a[href]");
  const footerLinks = document.querySelectorAll(".sidebar-footer a[href]");
  if (!links.length || !footerLinks.length) return;
  const current = getCurrentPageName();
  setActiveLinks(links, current);
  setActiveLinks(footerLinks, current);
  bindActiveLinkClicks(links);
}

/**
 * Get current page name.
 */
function getCurrentPageName() {
  return location.pathname.split("/").pop() || "index.html";
}

/**
 * Set active links.
 */
function setActiveLinks(links, current) {
  links.forEach((a) => {
    const target = new URL(a.getAttribute("href"), location.href).pathname.split("/").pop();
    a.classList.toggle("active", target === current);
  });
}

/**
 * Bind active link clicks.
 */
function bindActiveLinkClicks(links) {
  links.forEach((a) => {
    a.addEventListener("click", () => setActiveLink(links, a));
  });
}

/**
 * Set active link.
 */
function setActiveLink(links, active) {
  links.forEach((x) => x.classList.remove("active"));
  active.classList.add("active");
}
