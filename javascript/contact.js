const addContactModal = document.getElementById('addContactModal');
const openAddContactBtn = document.getElementById('openAddContact'); 
const closeAddContactBtn = document.getElementById('closeAddContact');

if (openAddContactBtn) {
  openAddContactBtn.addEventListener('click', () => {
    addContactModal.style.display = 'flex';
  });
}


if (closeAddContactBtn) {
  closeAddContactBtn.addEventListener('click', () => {
    addContactModal.style.display = 'none';
  });
}

addContactModal.addEventListener('click', (e) => {
  if (e.target === addContactModal) {
    addContactModal.style.display = 'none';
  }
});