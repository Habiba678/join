let info = document.getElementById("noMatsh");

/**
 * Fetches the "register" node from the Firebase Realtime Database.
 * First tries to load /register.json directly. If that fails,
 * it inspects the root database to find the register entry.
 *
 * @async
 * @returns {Promise<Object|null>} The register data or null if not found.
 */
async function fetchRegisterNode() {
  const db = "https://join-da53b-default-rtdb.firebaseio.com/";
  try {
    const r = await (await fetch(db + "register.json")).json();
    if (r != null) return r;
  } catch (e) {
    console.warn("fetchRegisterNode: failed to fetch /register.json", e);
  }

  try {
    const root = await (await fetch(db + ".json")).json();
    if (!root) return null;

    const pick = (o) => {
      const c = Object.assign({}, o);
      delete c.id;
      return c.hasOwnProperty("register") ? c.register : c;
    };

    if (Array.isArray(root)) {
      const e = root.find((x) => x && x.id === "register");
      if (e) return pick(e);
    }

    if (root && typeof root === "object") {
      const f = Object.values(root).find((x) => x && x.id === "register");
      if (f) return pick(f);
      if (root.register !== undefined) return root.register;
    }
  } catch (e) {
    console.warn("fetchRegisterNode: failed to inspect root DB", e);
  }

  return null;
}

/**
 * Logs in a guest user.
 * Stores a temporary user in cookies and sessionStorage
 * and redirects to the summary page.
 *
 * @returns {void}
 */
function guastLogin() {
  const payload = encodeURIComponent(JSON.stringify("Guest"));
  document.cookie = `loggedInUser=${payload}; path=/; max-age=3600`;

  try {
    sessionStorage.setItem(
      "loggedInUser",
      JSON.stringify({ mail: "Guest", namen: "Guest" }),
    );
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
async function logIn() {
  const loginData = await fetchRegisterNode();
  try {
    validateEmail(email);
    validatePassword(password);
  } catch (e) {
    console.warn("Validation failed", e);
  }
  const users = loginData ? Object.values(loginData) : [];
  if (!users.length) { alert("No users found in database. Please register first."); return;}
  const infoPasswordElement = document.getElementById("info-password");
  let emailFound = false;
  for (const user of users) {
    if ((user.mail || "") === (email.value || "")) {
      emailFound = true;
      const hash = await hashPasswordWithSalt(password.value, user.salt);
      if (hash === user.passwort) {
        sessionStorage.setItem("loggedInUser", JSON.stringify(user.namen));
        const payload = encodeURIComponent(JSON.stringify(user.namen || "Guest"));
        document.cookie = `loggedInUser=${payload}; path=/; max-age=3600`;
        if (infoPasswordElement) {
          infoPasswordElement.style.opacity = "0";
          infoPasswordElement.style.visibility = "hidden";
        }
        window.location.href = "./subpages/summary.html";
        return;
      }

      if (infoPasswordElement) {
        infoPasswordElement.style.opacity = "1";
        infoPasswordElement.style.visibility = "visible";
      }

      if (typeof password !== "undefined" && password) {
        password.classList.add("isInvaled");
        password.classList.remove("isValidate");
      }
      return;
    }
  }
  if (infoPasswordElement) {
    infoPasswordElement.style.opacity = "1";
    infoPasswordElement.style.visibility = "visible";
  }
  if (typeof email !== "undefined" && email) {
    email.classList.add("isInvaled");
    email.classList.remove("isValidate");
  }
}

/**
 * Logs out the current user.
 * Removes cookies and stored login data.
 *
 * @returns {void}
 */
function logout() {
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
function getCokkieCheckHelper() {
  const cookies = document.cookie.split(";").reduce((acc, cookie) => { const [key, value] = cookie.trim().split("="); acc[key] = decodeURIComponent(value || ""); return acc;}, {});

  if (!cookies.loggedInUser) {
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
  } else {
    const hidenNav = document.querySelectorAll("#nav_li");
    const loginBtn = document.getElementById("login-btn");
    if (hidenNav) hidenNav.forEach(el => el.style.display = "block");
    if (loginBtn) loginBtn.style.display = "none";
  }
  return cookies.loggedInUser || null;
}getCokkieCheckHelper();


/**
 * Displays a login reminder message if the URL contains
 * the query parameter ?notice=pleaseLogin.
 *
 * @param {number} [duration=4000] Duration the message is visible in ms.
 * @returns {void}
 */
function showPleaseLoginMessageFromQuery(duration = 4000) {
  const params = new URLSearchParams(window.location.search);
  const notice = params.get("notice");
  
  if (notice !== "pleaseLogin") return;
  
  const el = document.getElementById("login-message");
  
  if (!el) return;
  
  const wrapper = el.closest(".login-message");
  
  if (wrapper) { wrapper.classList.add("is-visible"); }
  
  el.textContent = "Bitte melden Sie sich an, um fortzufahren.";

  Object.assign(el.style, { display: "block", position: "relative", top: "20%", color: "#d32828", transition: "opacity 0.5s ease", opacity: "1",});

  setTimeout(() => { el.style.opacity = "0";
  setTimeout(() => { el.style.display = "none"; el.textContent = "";}, 500); }, duration);
  window.history.replaceState({}, "", window.location.pathname + window.location.hash,);
}
showPleaseLoginMessageFromQuery();

/**
 * Displays a registration message from the URL query parameters.
 * Supports ?msg= or ?message=.
 *
 * @param {number} [duration=4000] Duration the message is visible in ms.
 * @returns {void}
 */
function showRegistrationMessageFromQuery(duration = 4000) {
  const params = new URLSearchParams(window.location.search);
  const msg = params.get("msg") || params.get("message");
  if (!msg) return;

  const el = document.getElementById("reg-msg");
  if (!el) return;

  const wrapper = el.closest(".login-message");
  if (wrapper) {wrapper.classList.add("is-visible");}

  el.textContent = decodeURIComponent(msg);

  Object.assign(el.style, {display: "flex",alignItems: "center",justifyContent: "center",margin: "0 auto",color: "#ffffff",height: "55px",width: "320px",borderRadius: "8px",backgroundColor: "rgb(26, 26, 26)",transition: "opacity 0.5s ease",opacity: "1",});

  setTimeout(() => {el.style.opacity = "0";
  setTimeout(() => {el.style.display = "none"; el.textContent = "";}, 500);}, duration);

  window.history.replaceState({},"", window.location.pathname + window.location.hash,);
}
showRegistrationMessageFromQuery();
