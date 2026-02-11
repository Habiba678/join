let info = document.getElementById("noMatsh");

async function fetchRegisterNode() {
  const db = "https://join-da53b-default-rtdb.firebaseio.com/";
  try {
    const response = await fetch(db + "register.json");
    const data = await response.json();
    if (data != null) return data;
  } catch (e) {
    console.warn("fetchRegisterNode: failed to fetch /register.json", e);
  }

  // Fallback: inspect root for an entry with id === 'register' or a property named 'register'
  try {
    const resp = await fetch(db + ".json");
    const root = await resp.json();
    if (!root) return null;

    if (Array.isArray(root)) {
      const entry = root.find((e) => e && e.id === "register");
      if (entry) {
        const clone = Object.assign({}, entry);
        delete clone.id;
        if (clone.hasOwnProperty("register")) return clone.register;
        return clone;
      }
    } else if (typeof root === "object") {
      const vals = Object.values(root);
      for (let i = 0; i < vals.length; i++) {
        const e = vals[i];
        if (e && e.id === "register") {
          const clone = Object.assign({}, e);
          delete clone.id;
          if (clone.hasOwnProperty("register")) return clone.register;
          return clone;
        }
      }
      if (root.register !== undefined) return root.register;
    }
  } catch (e) {
    console.warn("fetchRegisterNode: failed to inspect root DB", e);
  }

  return null;
}

async function logIn() {
  const loginData = await fetchRegisterNode();

  // Validate inputs (assumes email/password DOM elements and validators exist)
  try {
    validateEmail(email);
    validatePassword(password);
  } catch (e) {
    console.warn("Validation failed", e);
  }

  const users = loginData ? Object.values(loginData) : [];

  if (!users.length) {
    alert("No users found in database. Please register first.");
    return;
  }

  const foundUser = users.find(
    (user) => (user.mail || "") === (email.value || "") && (user.passwort || "") === (password.value || "")
  );

  if (foundUser) {
    window.location.href = "./subpages/summary.html";
  } else {
    alert("Check your email and password. Please try again");
  }
}
