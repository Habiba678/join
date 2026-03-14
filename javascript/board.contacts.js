// ---------------- Contacts storage ----------------
/**
 * Loads contacts from Firebase and stores them locally.
 * @returns {Promise<BoardContact[]>} Normalized contact list.
 */
async function syncContactsFromDB() {
  try {
    const data = await fetchDBNode("contacts");
    const contacts = normalizeContactsData(data);
    const local = await trySaveContactsToIdb(contacts);
    return local || contacts;
  } catch (e) {
    console.error("Failed to sync contacts from DB", e);
    throw e;
  }
}

/**
 * Normalizes contact payloads from Firebase into an array.
 * @param {*|null} data Raw contact payload.
 * @returns {BoardContact[]} Normalized contacts array.
 */
function normalizeContactsData(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(Boolean);
  return Object.entries(data).map(function ([k, v]) {
    return { ...(v || {}), id: v && v.id ? v.id : k };
  });
}

/**
 * Persists contacts to IndexedDB and reads them back for consistency.
 * @param {BoardContact[]} contacts Contacts to persist.
 * @returns {Promise<BoardContact[]|null>} Persisted contacts or `null` on failure.
 */
async function trySaveContactsToIdb(contacts) {
  if (!(window.idbStorage && typeof window.idbStorage.saveContacts === "function")) {
    return null;
  }
  try {
    await window.idbStorage.saveContacts(contacts);
  } catch (err) {
    console.warn("Failed to save contacts to IDB:", err);
    return null;
  }
  return readContactsFromIdb();
}

/**
 * Reads contacts from IndexedDB-backed storage.
 * @returns {BoardContact[]|null} Cached contacts or `null` on failure.
 */
function readContactsFromIdb() {
  try {
    return window.idbStorage.getContactsSync ? window.idbStorage.getContactsSync() : null;
  } catch (readErr) {
    console.warn("syncContactsFromDB: saved to IDB but failed to read back:", readErr);
    return null;
  }
}

/**
 * Loads cached contacts from IndexedDB-backed storage.
 * @returns {BoardContact[]} Cached contacts or an empty array on failure.
 */
function loadContacts() {
  try {
    return (window.idbStorage && typeof window.idbStorage.getContactsSync === "function")
      ? window.idbStorage.getContactsSync()
      : [];
  } catch (e) {
    console.error("Contacts access error:", e);
    return [];
  }
}

/**
 * Builds a lookup map of contacts keyed by stringified ID.
 * @param {BoardContact[]} contacts Contact list.
 * @returns {Map<string, BoardContact>} Contact lookup map.
 */
function buildContactsById(contacts) {
  const map = new Map();
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    if (contact && contact.id) map.set(String(contact.id), contact);
  }
  return map;
}

/**
 * Resolves assigned task entries into display names using the cached contacts list.
 * @param {BoardTask} task Task whose assignees should be resolved.
 * @returns {string[]} Display names or raw fallback values.
 */
function resolveAssignedList(task) {
  let assignedArr = [];
  if (Array.isArray(task.assigned)) assignedArr = task.assigned;
  else if (task.assigned) assignedArr = [task.assigned];
  if (!assignedArr.length) return [];

  const contactsById = buildContactsById(loadContacts());
  const result = [];
  for (let i = 0; i < assignedArr.length; i++) {
    const value = assignedArr[i];
    const key = String(value || "");
    if (!key) continue;
    const contact = contactsById.get(key);
    result.push(contact && contact.name ? contact.name : key);
  }
  return result;
}
