async function hashPasswordWithSalt(password, saltArray) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const salt = new Uint8Array(saltArray);

  const key = await crypto.subtle.importKey(
    "raw",
    data,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}



async function regData(saltArray) {
  const passwordResult = await hashPasswordWithSalt(password.value, saltArray);
  try {
    validateSingUpForm();
  } catch (e) {
    /* ignore */
  }
  const db = "https://join-da53b-default-rtdb.firebaseio.com/";
  try {
    const resp = await fetch(db + "register.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        namen: full_name.value,
        mail: email.value,
        passwort: passwordResult,
      }),
    });

    if (!resp.ok) {
      showRegNotice(
        "Registrierung fehlgeschlagen. Bitte versuche es später.",
        "error",
      );
      return null;
    }

    const result = await resp.json();
    // Erfolg → sofort weiterleiten (wie gewünscht)
    registrationSuccessRedirect();
    return result;
  } catch (err) {
    console.warn("regData error:", err);
    showRegNotice("Netzwerkfehler. Bitte überprüfe deine Verbindung.", "error");
    return null;
  }
}

function registrationSuccessRedirect() {
  // Weiterleitung zu index.html; index zeigt dort die Erfolgsmeldung an
  window.location.href =
    "../index.html?msg=" + encodeURIComponent("You Signed Up successfully.");
}

function showRegNotice(message, type = "info", duration = 4000) {
  const el = document.getElementById("reg-notice");
  if (!el) return;
  el.textContent = message;
  el.style.display = "block";
  el.style.backgroundColor = type === "error" ? "rgb(26, 26, 26)" : "#d4edda";
  el.style.width = "80%";
  el.style.height = "55px";
  el.style.position = "relative";
  el.style.top = "-130px";
  el.style.textAlign = "center";
  el.style.color = type === "error" ? "#d32828" : "#ffffff";
  el.style.transition = "opacity 0.4s ease";
  el.style.opacity = "1";
  if (duration > 0) {
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => {
        el.style.display = "none";
        el.textContent = "";
      }, 400);
    }, duration);
  }
}
