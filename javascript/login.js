let info = document.getElementById("noMatsh");

/**
 * Fetches the "register" node from the Firebase Realtime Database.
 * First tries to load /register.json directly. If that fails,
 * it inspects the root database to find the register entry.
 *
 * @async
 * @returns {Promise<Object|null>} The register data or null if not found.
 */
/**
 * Fetch register node.
 */
async function fetchRegisterNode() {
  const direct = await tryFetchRegisterDirect();
  if (direct != null) return direct;
  const root = await tryFetchRootDb();
  if (!root) return null;
  return extractRegisterFromRoot(root);
}

/**
 * Get login DB URL.
 */
function getLoginDbUrl() {
  return "https://join-da53b-default-rtdb.firebaseio.com/";
}

/**
 * Try fetch register direct.
 */
async function tryFetchRegisterDirect() {
  try {
    return await (await fetch(getLoginDbUrl() + "register.json")).json();
  } catch (e) {
    console.warn("fetchRegisterNode: failed to fetch /register.json", e);
    return null;
  }
}

/**
 * Try fetch root DB.
 */
async function tryFetchRootDb() {
  try {
    return await (await fetch(getLoginDbUrl() + ".json")).json();
  } catch (e) {
    console.warn("fetchRegisterNode: failed to inspect root DB", e);
    return null;
  }
}

/**
 * Extract register from root.
 */
function extractRegisterFromRoot(root) {
  if (Array.isArray(root)) return extractRegisterFromArray(root);
  if (root && typeof root === "object") return extractRegisterFromObject(root);
  return null;
}

/**
 * Extract register from array.
 */
function extractRegisterFromArray(root) {
  const entry = root.find((x) => x && x.id === "register");
  return entry ? pickRegisterEntry(entry) : null;
}

/**
 * Extract register from object.
 */
function extractRegisterFromObject(root) {
  const entry = Object.values(root).find((x) => x && x.id === "register");
  if (entry) return pickRegisterEntry(entry);
  return root.register !== undefined ? root.register : null;
}

/**
 * Pick register entry.
 */
function pickRegisterEntry(o) {
  const c = Object.assign({}, o);
  delete c.id;
  return c.hasOwnProperty("register") ? c.register : c;
}

/**
 * Logs in a guest user.
 * Stores a temporary user in cookies and sessionStorage
 * and redirects to the summary page.
 *
 * @returns {void}
 */
/**
 * Guast login.
 */
function guastLogin() {
  const payload = encodeURIComponent(JSON.stringify("Guest"));
  document.cookie = `loggedInUser=${payload}; path=/; max-age=3600`;

  try {
    sessionStorage.setItem("loggedInUser",JSON.stringify({ mail: "Guest", namen: "Guest" }),);
  } catch (e) {}

  window.location.href = "./subpages/summary.html";
}

/**
 * Verifies whether the entered password matches the stored hash.
 *
 * @async
 * @param {string} inputPassword - The password entered by the user.
 * @param {string} storedHash - The stored password hash.
 * @param {string} storedSalt - The stored salt value.
 * @returns {Promise<boolean>} True if the password is valid.
 */
/**
 * Verify password.
 */
async function verifyPassword(inputPassword, storedHash, storedSalt) {
  const result = await hashPasswordWithSalt(inputPassword, storedSalt);
  return result === storedHash;
}

/**
 * Handles the user login process.
 * Validates the input, compares credentials with the database,
 * stores the session, and redirects on success.
 *
 * @async
 * @returns {Promise<void>}
 */
/**
 * Log in.
 */
async function logIn() {
  const loginData = await fetchRegisterNode();
  validateLoginInputsSafe();
  const users = getLoginUsers(loginData);
  if (!users.length) return alertNoUsers();
  const infoEl = document.getElementById("info-no-match");
  const user = findUserByEmail(users, email?.value || "");
  if (!user) return handleEmailNotFound(infoEl);
  const ok = await verifyLoginPassword(user, password?.value || "");
  if (ok) return handleLoginSuccess(user, infoEl);
  handlePasswordMismatch(infoEl);
}

/**
 * Validate login inputs safe.
 */
function validateLoginInputsSafe() {
  try {
    validateEmail(email);
    validatePassword(password);
  } catch (e) {
    console.warn("Validation failed", e);
  }
}

/**
 * Get login users.
 */
function getLoginUsers(loginData) {
  return loginData ? Object.values(loginData) : [];
}

/**
 * Alert no users.
 */
function alertNoUsers() {
  alert("No users found in database. Please register first.");
}

/**
 * Find user by email.
 */
function findUserByEmail(users, emailValue) {
  return users.find((u) => (u.mail || "") === (emailValue || ""));
}

/**
 * Verify login password.
 */
async function verifyLoginPassword(user, value) {
  const hash = await hashPasswordWithSalt(value, user.salt);
  return hash === user.passwort;
}

/**
 * Handle login success.
 */
function handleLoginSuccess(user, infoEl) {
  sessionStorage.setItem("loggedInUser", JSON.stringify(user.namen));
  const payload = encodeURIComponent(JSON.stringify(user.namen || "Guest"));
  document.cookie = `loggedInUser=${payload}; path=/; max-age=3600`;
  hideInfoNoMatch(infoEl);
  window.location.href = "./subpages/summary.html";
}

/**
 * Handle password mismatch.
 */
function handlePasswordMismatch(infoEl) {
  showInfoNoMatch(infoEl);
  markInputInvalid(password);
}

/**
 * Handle email not found.
 */
function handleEmailNotFound(infoEl) {
  showInfoNoMatch(infoEl);
  markInputInvalid(email);
}

/**
 * Show info no match.
 */
function showInfoNoMatch(infoEl) {
  if (!infoEl) return;
  infoEl.style.opacity = "1";
  infoEl.style.visibility = "visible";
}

/**
 * Hide info no match.
 */
function hideInfoNoMatch(infoEl) {
  if (!infoEl) return;
  infoEl.style.opacity = "0";
  infoEl.style.visibility = "hidden";
}

/**
 * Mark input invalid.
 */
function markInputInvalid(input) {
  if (typeof input === "undefined" || !input) return;
  input.classList.add("isInvaled");
  input.classList.remove("isValidate");
}

/**
 * Logs out the current user.
 * Removes cookies and stored login data.
 *
 * @returns {void}
 */
/**
 * Logout.
 */
function logout() {
  /**
   * Clear cookie.
   */
  const clearCookie = (name) => { document.cookie = `${name}=; path=/; max-age=0`;};
  clearCookie("loggedInUser"); clearCookie("session"); clearCookie("sessionId"); clearCookie("accessToken"); clearCookie("auth"); clearCookie("token");

  try { sessionStorage.removeItem("loggedInUser");} catch (e) {}

  try {localStorage.removeItem("loggedInUser");} catch (e) {}

  try {console.debug("logout: cleared loggedInUser, session cookies and guest flags",);} catch (e) {}

  window.location.href = "../index.html";
}

/**
 * Checks whether a login cookie exists.
 * Redirects the user to the login page if not.
 *
 * @returns {string|null} The stored username or null.
 */
/**
 * Get cokkie check.
 */
function getCokkieCheck() {
  const cookies = document.cookie.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = decodeURIComponent(value || "");
    return acc;
  }, {});

  if (!cookies.loggedInUser) {
    const dest = "../index.html?notice=" + encodeURIComponent("pleaseLogin");
    return (window.location.href = dest);
  }

  return cookies.loggedInUser || null;
}

/**
 * Checks whether a login cookie exists.
 * changes the navigation and login button visibility based on the login state.
 *
 * @returns {string|null} The stored username or null.
 */
/**
 * Get cokkie check helper.
 */
function getCokkieCheckHelper() {
  const cookies = getCookieMap();
  if (!cookies.loggedInUser) applyLoggedOutNav();
  else applyLoggedInNav();
  return cookies.loggedInUser || null;
}
getCokkieCheckHelper();

/**
 * Get cookie map.
 */
function getCookieMap() {
  return document.cookie.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = decodeURIComponent(value || "");
    return acc;
  }, {});
}

/**
 * Apply logged out nav.
 */
function applyLoggedOutNav() {
  const hidenNav = document.querySelectorAll("#nav_li");
  const loginBtn = document.getElementById("login-btn");
  const buttoMenu = document.getElementById("headerUserBtn");
  const sidebarFooter = document.querySelector(".sidebar-footer");
  const menueUl = document.querySelector(".menu ul");
  if (menueUl) menueUl.style.justifyContent = "flex-start";
  if (hidenNav) hidenNav.forEach(el => el.style.display = "none");
  if (loginBtn) loginBtn.style.display = "block";
  if (buttoMenu) buttoMenu.style.opacity = "0";
  if (buttoMenu) buttoMenu.style.cursor = "none";
  if (sidebarFooter) sidebarFooter.style.display = "flex";
}

/**
 * Apply logged in nav.
 */
function applyLoggedInNav() {
  const hidenNav = document.querySelectorAll("#nav_li");
  const loginBtn = document.getElementById("login-btn");
  if (hidenNav) hidenNav.forEach(el => el.style.display = "block");
  if (loginBtn) loginBtn.style.display = "none";
}


/**
 * Displays a login reminder message if the URL contains
 * the query parameter ?notice=pleaseLogin.
 *
 * @param {number} [duration=4000] Duration the message is visible in ms.
 * @returns {void}
 */
/**
 * Show please login message from query.
 */
function showPleaseLoginMessageFromQuery(duration = 4000) {
  if (getQueryParam("notice") !== "pleaseLogin") return;
  const el = document.getElementById("login-message");
  if (!el) return;
  showMessageWrapper(el);
  setMessageText(el, "Bitte melden Sie sich an, um fortzufahren.");
  applyPleaseLoginStyles(el);
  fadeOutMessage(el, duration);
  replaceUrlState();
}
showPleaseLoginMessageFromQuery();

/**
 * Displays a registration message from the URL query parameters.
 * Supports ?msg= or ?message=.
 *
 * @param {number} [duration=4000] Duration the message is visible in ms.
 * @returns {void}
 */
/**
 * Show registration message from query.
 */
function showRegistrationMessageFromQuery(duration = 4000) {
  const msg = getQueryParam("msg") || getQueryParam("message");
  if (!msg) return;
  const el = document.getElementById("reg-msg");
  if (!el) return;
  showMessageWrapper(el);
  setMessageText(el, decodeURIComponent(msg));
  applyRegistrationStyles(el);
  fadeOutMessage(el, duration);
  replaceUrlState();
}
showRegistrationMessageFromQuery();

/**
 * Get query param.
 */
function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

/**
 * Show message wrapper.
 */
function showMessageWrapper(el) {
  const wrapper = el.closest(".login-message");
  if (wrapper) wrapper.classList.add("is-visible");
}

/**
 * Set message text.
 */
function setMessageText(el, text) {
  el.textContent = text;
}

/**
 * Apply please login styles.
 */
function applyPleaseLoginStyles(el) {
  Object.assign(el.style, {
    display: "block",
    position: "relative",
    top: "20%",
    color: "#d32828",
    transition: "opacity 0.5s ease",
    opacity: "1",
  });
}

/**
 * Apply registration styles.
 */
function applyRegistrationStyles(el) {
  Object.assign(el.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    color: "#ffffff",
    height: "55px",
    width: "320px",
    borderRadius: "8px",
    backgroundColor: "rgb(26, 26, 26)",
    transition: "opacity 0.5s ease",
    opacity: "1",
  });
}

/**
 * Fade out message.
 */
function fadeOutMessage(el, duration) {
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => clearMessage(el), 500);
  }, duration);
}

/**
 * Clear message.
 */
function clearMessage(el) {
  el.style.display = "none";
  el.textContent = "";
}

/**
 * Replace URL state.
 */
function replaceUrlState() {
  window.history.replaceState({}, "", window.location.pathname + window.location.hash);
}
