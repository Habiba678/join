async function regData() {
  // Grundlegende client-seitige Validierung (keine Fehlermeldung wenn validate nicht verfügbar)
  try { validateSingUpForm(); } catch (e) { /* ignore */ }
  const db = "https://join-da53b-default-rtdb.firebaseio.com/";
  try {
    const resp = await fetch(db + "register.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        namen: full_name.value,
        mail: email.value,
        passwort: password.value,
      }),
    });

    if (!resp.ok) {
      showRegNotice("Registrierung fehlgeschlagen. Bitte versuche es später.", "error");
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
  window.location.href = "../index.html?msg=" + encodeURIComponent("Erfolgreich registriert! Bitte logge dich ein.");
}

function showRegNotice(message, type = "info", duration = 4000) {
  const el = document.getElementById("reg-notice");
  if (!el) return;
  el.textContent = message;
  el.style.display = "block";
  el.style.color = type === "error" ? "#d32828" : "#2a9d2a";
  el.style.transition = "opacity 0.4s ease";
  el.style.opacity = "1";
  if (duration > 0) {
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => { el.style.display = "none"; el.textContent = ""; }, 400);
    }, duration);
  }
}