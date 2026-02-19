let info = document.getElementById("noMatsh");

async function fetchRegisterNode() {
  const db = "https://join-da53b-default-rtdb.firebaseio.com/";
  try {const r = await (await fetch(db + "register.json")).json();
    if (r != null) return r;
  } catch (e) {console.warn("fetchRegisterNode: failed to fetch /register.json", e);}
  try {const root = await (await fetch(db + ".json")).json();
    if (!root) return null;
    const pick = (o) => {const c = Object.assign({}, o); delete c.id; return c.hasOwnProperty("register") ? c.register : c;};
    if (Array.isArray(root)) {const e = root.find((x) => x && x.id === "register");
      if (e) return pick(e);}
    if (root && typeof root === "object") {const f = Object.values(root).find((x) => x && x.id === "register");
      if (f) return pick(f); if (root.register !== undefined) return root.register;}
  } catch (e) {console.warn("fetchRegisterNode: failed to inspect root DB", e);}
  return null;
}

function guastLogin() {
  
  const payload = encodeURIComponent(JSON.stringify("Guest"));
  document.cookie = `loggedInUser=${payload}; path=/; max-age=3600`;
  try {
    sessionStorage.setItem("loggedInUser", JSON.stringify({ mail: "Guest", namen: "Guest" }));
  } catch (e) { /* ignore */ }
  window.location.href = "./subpages/summary.html";
}

async function logIn() {
  const loginData = await fetchRegisterNode();
  try {validateEmail(email);validatePassword(password);} catch (e) {console.warn("Validation failed", e);}
  const users = loginData ? Object.values(loginData) : [];
  if (!users.length) return alert("No users found in database. Please register first.");
  const foundUser = users.find((u) =>(u.mail || "") === (email.value || "") && (u.passwort || "") === (password.value || ""),);
  if (foundUser) {
    try {sessionStorage.setItem("loggedInUser", JSON.stringify(foundUser.namen));} catch (e) {/* ignore */}
    const payload = encodeURIComponent(JSON.stringify(foundUser.namen || "Guest"));
    document.cookie = `loggedInUser=${payload}; path=/; max-age=3600`;
    try {console.debug("login: stored loggedInUser ->", foundUser);} catch (e) {}
    window.location.href = "./subpages/summary.html";
  } else alert("Check your email and password. Please try again");
}

function logout() {
  const clearCookie = (name) => {document.cookie = `${name}=; path=/; max-age=0`;};
  clearCookie("loggedInUser");
  clearCookie("session");
  clearCookie("sessionId");
  clearCookie("accessToken");
  clearCookie("auth");
  clearCookie("token");
  try {sessionStorage.removeItem("loggedInUser");} catch (e) {}
  try {localStorage.removeItem("loggedInUser");} catch (e) {}
  try {console.debug("logout: cleared loggedInUser, session cookies and guest flags");} catch (e) {}
  window.location.href = "../index.html";
}

function getCokkieCheck() {
  const cookies = document.cookie.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = decodeURIComponent(value || "");
    return acc; }, {});
  if (!cookies.loggedInUser) {
   const dest = "../index.html?notice=" + encodeURIComponent("pleaseLogin");
    return (window.location.href = dest);}
  return cookies.loggedInUser || null;
}

function showPleaseLoginMessageFromQuery(duration = 4000) {
    const params = new URLSearchParams(window.location.search);
    const notice = params.get("notice");
    if (notice !== "pleaseLogin") return; const el = document.getElementById("login-message");
  if (!el) return; el.textContent = "Bitte melden Sie sich an, um fortzufahren.";
    Object.assign(el.style, {display: "block",position: "relative",top: "20%",color: "#d32828",transition: "opacity 0.5s ease",opacity: "1",});
    setTimeout(() => {el.style.opacity = "0";
    setTimeout(() => { el.style.display = "none"; el.textContent = ""; }, 500);
    }, duration);
   window.history.replaceState({}, "", window.location.pathname + window.location.hash);
} showPleaseLoginMessageFromQuery();


function showRegistrationMessageFromQuery(duration = 4000) {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get("msg") || params.get("message");
    if (!msg) return;  const el = document.getElementById("reg-msg");
  if (!el) return; el.textContent = decodeURIComponent(msg);
   Object.assign(el.style, {display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", color: "#ffffff", height: "55px", width: "320px", borderRadius: "8px", backgroundColor: "rgb(26, 26, 26)",transition: "opacity 0.5s ease",opacity: "1",});
   setTimeout(() => { el.style.opacity = "0";
    setTimeout(() => { el.style.display = "none"; el.textContent = ""; }, 500);
    }, duration);
    window.history.replaceState({}, "", window.location.pathname + window.location.hash);
}showRegistrationMessageFromQuery();
