(function(){
  // Simple IndexedDB wrapper for tasks and contacts with an in-memory cache.
  // Exposes: window.idbStorage.ready (Promise), getTasksSync(), saveTasks(tasks), getContactsSync(), saveContacts(list)
  const DB_NAME = "join_db_v1";
  const DB_VERSION = 1;
  const TASK_STORE = "tasks";
  const CONTACT_STORE = "contacts";

  let db = null;
  let cache = { tasks: [], contacts: [] };

  /**
   * Open db.
   */
  function openDb(){
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e){
        const d = e.target.result;
        if (!d.objectStoreNames.contains(TASK_STORE)) d.createObjectStore(TASK_STORE, { keyPath: "id" });
        if (!d.objectStoreNames.contains(CONTACT_STORE)) d.createObjectStore(CONTACT_STORE, { keyPath: "id" });
      };
      req.onsuccess = function(){ db = req.result; resolve(db); };
      req.onerror = function(e){ reject(e); };
    });
  }

  /**
   * Read all.
   */
  function readAll(storeName){
    return new Promise((resolve, reject) => {
      if (!db) return resolve([]);
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = function(){ resolve(req.result || []); };
      req.onerror = function(e){ reject(e); };
    });
  }

  /**
   * Clear store.
   */
  function clearStore(storeName){
    return new Promise((resolve, reject) => {
      if (!db) return resolve();
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = function(){ resolve(); };
      req.onerror = function(e){ reject(e); };
    });
  }

  /**
   * Put many.
   */
  function putMany(storeName, items){
    return new Promise((resolve, reject) => {
      if (!db) return resolve();
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      let pending = items.length;
      if (!pending) return resolve();
      for (let i = 0; i < items.length; i++){
        const r = store.put(items[i]);
        r.onsuccess = function(){ pending--; if (!pending) resolve(); };
        r.onerror = function(e){ reject(e); };
      }
    });
  }

  /**
   * Initialize.
   */
  async function init(){
    try{
      await openDb();
      cache.tasks = await readAll(TASK_STORE);
      cache.contacts = await readAll(CONTACT_STORE);
    }catch(e){
      console.error("idb-storage init error:", e);
      cache = { tasks: [], contacts: [] };
    }
  }

  const ready = init();

  /**
   * Get tasks sync.
   */
  function getTasksSync(){ return Array.isArray(cache.tasks) ? cache.tasks.slice() : []; }
  /**
   * Get contacts sync.
   */
  function getContactsSync(){ return Array.isArray(cache.contacts) ? cache.contacts.slice() : []; }

  /**
   * Save tasks.
   */
  async function saveTasks(tasks){
    await ready;
    try{
      await clearStore(TASK_STORE);
      if (Array.isArray(tasks) && tasks.length) await putMany(TASK_STORE, tasks);
      cache.tasks = Array.isArray(tasks) ? tasks.slice() : [];
    }catch(e){ console.error("saveTasks error:", e); throw e; }
  }

  /**
   * Save contacts.
   */
  async function saveContacts(list){
    await ready;
    try{
      await clearStore(CONTACT_STORE);
      if (Array.isArray(list) && list.length) await putMany(CONTACT_STORE, list);
      cache.contacts = Array.isArray(list) ? list.slice() : [];
    }catch(e){ console.error("saveContacts error:", e); throw e; }
  }

  window.idbStorage = {
    ready: ready,
    getTasksSync: getTasksSync,
    saveTasks: saveTasks,
    getContactsSync: getContactsSync,
    saveContacts: saveContacts,
    loadTasks: async function(){ await ready; return getTasksSync(); },
    loadContacts: async function(){ await ready; return getContactsSync(); }
  };
})();
