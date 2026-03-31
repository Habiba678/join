/**
 * Hash password with salt.
 */
async function hashPasswordWithSalt(password, saltArray) {
  const key = await importPasswordKey(password);
  const hashBuffer = await derivePasswordBits(key, saltArray);
  return bufferToHex(hashBuffer);
}

/**
 * Import password key.
 */
async function importPasswordKey(password) {
  const data = new TextEncoder().encode(password);
  return crypto.subtle.importKey("raw", data, { name: "PBKDF2" }, false, ["deriveBits"]);
}

/**
 * Derive password bits.
 */
async function derivePasswordBits(key, saltArray) {
  const salt = new Uint8Array(saltArray);
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    key,
    256,
  );
}

/**
 * Buffer to hex.
 */
function bufferToHex(hashBuffer) {
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Reg data.
 */
async function regData(saltArray) {
  const passwordResult = await hashPasswordWithSalt(password.value, saltArray);
  if (!validateSingUpForm()) return invalidRegistration();
  try {
    const result = await postRegistration(passwordResult);
    if (!result) return null;
    registrationSuccessRedirect();
    return result;
  } catch (err) {
    return handleRegistrationError(err);
  }
}

/**
 * Post registration.
 */
async function postRegistration(passwordResult) {
  const resp = await fetch(getRegisterDbUrl() + "register.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      namen: full_name.value,
      mail: email.value,
      passwort: passwordResult,
    }),
  });
  if (!resp.ok) return registrationFailed();
  return resp.json();
}

/**
 * Get register DB URL.
 */
function getRegisterDbUrl() {
  return "https://join-da53b-default-rtdb.firebaseio.com/";
}

/**
 * Invalid registration.
 */
function invalidRegistration() {
  showRegNotice("Please fill in all fields correctly.", "error", 4000);
  return null;
}

/**
 * Registration failed.
 */
function registrationFailed() {
  showRegNotice("Registration failed. Please try again later.", "error", 4000);
  return null;
}

/**
 * Handle registration error.
 */
function handleRegistrationError(err) {
  console.warn("regData error:", err);
  showRegNotice("Network error. Please check your connection.", "error", 4000);
  return null;
}

/**
 * Registration success redirect.
 */
function registrationSuccessRedirect() {
  window.location.href = "../index.html?msg=" + encodeURIComponent("You Signed Up successfully.");
}

/**
 * Show reg notice.
 */
function showRegNotice(message, type = "info", duration = 4000) {
  const el = document.getElementById("reg-notice");
  if (!el) return;
  applyRegNotice(el, message, type);
  hideRegNoticeAfter(el, duration);
}

/**
 * Apply reg notice.
 */
function applyRegNotice(el, message, type) {
  el.textContent = message;
  el.style.display = "flex";
  el.style.backgroundColor = type === "error" ? "#ffffff" : "#d4edda";
  el.style.borderRadius = "8px";
  el.style.border = type === "error" ? "1px solid #d32828" : "1px solid transparent";
  el.style.color = type === "error" ? "#d32828" : "#ffffff";
  el.style.transition = "opacity 0.4s ease";
  el.style.opacity = "1";
}

/**
 * Hide reg notice after.
 */
function hideRegNoticeAfter(el, duration) {
  if (duration <= 0) return;
  setTimeout(() => fadeRegNotice(el), duration);
}

/**
 * Fade reg notice.
 */
function fadeRegNotice(el) {
  el.style.opacity = "0";
  setTimeout(() => clearRegNotice(el), 400);
}

/**
 * Clear reg notice.
 */
function clearRegNotice(el) {
  el.style.display = "none";
  el.textContent = "";
}
