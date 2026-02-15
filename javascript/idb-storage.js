(function(){
  const DB_NAME = "join_db_v1";
  const DB_VERSION = 1;
  const TASK_STORE = "tasks";
  const CONTACT_STORE = "contacts";

  let db = null;
  let cache = { tasks: [], contacts: [] };

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

  async function init(){
    try{
      // Guest mode: prefer sessionStorage-backed guest data so changes persist during the session
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('guest') === '1') {
        try {
          const sTasks = sessionStorage.getItem('guest_tasks');
          const sContacts = sessionStorage.getItem('guest_contacts');
          if (sTasks) cache.tasks = JSON.parse(sTasks);
          if (sContacts) cache.contacts = JSON.parse(sContacts);
          // If sessionStorage has nothing, seed demo data and persist into sessionStorage
          if ((!sTasks || !sContacts) && (!cache.tasks.length || !cache.contacts.length)) {
            cache.tasks = [
              { id: "g1", title: "Demo: Set up project", description: "Welcome task for guests", dueDate: "", category: "user", priority: "medium", status: "todo", subtasks: [], assigned: [] },
              { id: "g2", title: "Demo: Work in progress", description: "Example in-progress task", dueDate: "", category: "tech", priority: "urgent", status: "progress", subtasks: [{ title: "step 1", done: false }], assigned: ["c1"] },
              { id: "g3", title: "Demo: Waiting feedback", description: "", dueDate: "", category: "user", priority: "low", status: "feedback", subtasks: [], assigned: ["c2"] },
              { id: "g4", title: "Demo: Done task", description: "", dueDate: "", category: "tech", priority: "medium", status: "done", subtasks: [], assigned: [] }
            ];
            cache.contacts = [
              { id: "c1", name: "Anna Bauer", email: "anna@example.com" },
              { id: "c2", name: "Max Mustermann", email: "max@example.com" },
              { id: "c3", name: "Sophie Klein", email: "sophie@example.com" }
            ];
            try { sessionStorage.setItem('guest_tasks', JSON.stringify(cache.tasks)); } catch (e) {}
            try { sessionStorage.setItem('guest_contacts', JSON.stringify(cache.contacts)); } catch (e) {}
          }
          return;
        } catch (e) {
          console.warn('idb-storage: failed to load guest data from sessionStorage', e);
        }
      }

      await openDb();
      cache.tasks = await readAll(TASK_STORE);
      cache.contacts = await readAll(CONTACT_STORE);
    }catch(e){
      console.error("idb-storage init error:", e);
      cache = { tasks: [], contacts: [] };
    }
  }

  const ready = init();
  function getTasksSync(){ return Array.isArray(cache.tasks) ? cache.tasks.slice() : []; }
  function getContactsSync(){ return Array.isArray(cache.contacts) ? cache.contacts.slice() : []; }

  async function saveTasks(tasks){
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('guest') === '1') {
      cache.tasks = Array.isArray(tasks) ? tasks.slice() : [];
      try { sessionStorage.setItem('guest_tasks', JSON.stringify(cache.tasks)); } catch (e) { console.warn('saveTasks (guest): failed to write sessionStorage', e); }
      return;
    }
    await ready;
    try{
      await clearStore(TASK_STORE);
      if (Array.isArray(tasks) && tasks.length) await putMany(TASK_STORE, tasks);
      cache.tasks = Array.isArray(tasks) ? tasks.slice() : [];
    }catch(e){ console.error("saveTasks error:", e); throw e; }
  }

  async function saveContacts(list){
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('guest') === '1') {
      cache.contacts = Array.isArray(list) ? list.slice() : [];
      try { sessionStorage.setItem('guest_contacts', JSON.stringify(cache.contacts)); } catch (e) { console.warn('saveContacts (guest): failed to write sessionStorage', e); }
      return;
    }
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
