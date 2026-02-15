let info = document.getElementById("noMatsh");

async function fetchRegisterNode() {
  const db = "https://join-da53b-default-rtdb.firebaseio.com/";
  try { const r = await (await fetch(db + "register.json")).json(); if (r != null) return r; }
  catch (e) { console.warn("fetchRegisterNode: failed to fetch /register.json", e); }
  try {
    const root = await (await fetch(db + ".json")).json(); if (!root) return null;
    const pick = (o) => { const c = Object.assign({}, o); delete c.id; return c.hasOwnProperty("register") ? c.register : c };
    if (Array.isArray(root)) { const e = root.find(x => x && x.id === "register"); if (e) return pick(e); }
    if (root && typeof root === "object") { const f = Object.values(root).find(x => x && x.id === "register"); if (f) return pick(f); if (root.register !== undefined) return root.register; }
  } catch (e) { console.warn("fetchRegisterNode: failed to inspect root DB", e); }
  return null;
}

async function logIn() {
  const loginData = await fetchRegisterNode();
  try { validateEmail(email); validatePassword(password); }
  catch (e) { console.warn("Validation failed", e); }
  const users = loginData ? Object.values(loginData) : [];
  if (!users.length) return alert("No users found in database. Please register first.");
  const foundUser = users.find(u => (u.mail||"") === (email.value||"") && (u.passwort||"") === (password.value||""));
  if (foundUser) { document.cookie = `loggedInUser=${encodeURIComponent(foundUser)}; path=/; max-age=3600`; window.location.href = "./subpages/summary.html"; }
  else alert("Check your email and password. Please try again");
}


function logout() {
  document.cookie = `loggedInUser=; path=/; max-age=0`;
  window.location.href = "../index.html";
}


function getCokkieCheck() {
  const cookies = document.cookie.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = decodeURIComponent(value || "");
    return acc;
  }, {});
  if (!cookies.loggedInUser) {
    // Redirect to login and include a query param so the login page can display a message
    const dest = "../index.html?notice=" + encodeURIComponent("pleaseLogin");
    window.location.href = dest;
    return null;
  }
  console.log(`cookies`, cookies.accessToken, cookies.loggedInUser);
  return cookies.loggedInUser || null;
}


function showLoginMessageFromQuery() {
  try {
    const p = new URLSearchParams(window.location.search);
    const n = p.get("notice") || p.get("msg") || p.get("message"); if (!n) return;
    const el = document.getElementById("login-message"); if (!el) return;
    el.textContent = n === "pleaseLogin" ? "Bitte melden Sie sich an, um fortzufahren." : decodeURIComponent(n);
    Object.assign(el.style, { display: "block", position: "relative", top: "20%", color: "#d32828", transition: "opacity 0.5s ease", opacity: "1" });
    setTimeout(() => { el.style.opacity = "0"; setTimeout(()=>{ el.style.display = "none"; el.textContent = ""; }, 500); }, 4000);
    window.history.replaceState({}, "", window.location.pathname + window.location.hash);
  } catch (e) { console.warn("showLoginMessageFromQuery error:", e); }
}
showLoginMessageFromQuery();