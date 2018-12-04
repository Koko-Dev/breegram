const dbPromise = idb.open('posts-store', 1, db => {
  if(!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', {keyPath: 'id', autoIncrement: true});
  }
});

/*const dbPromise = idb.open('posts-store', 1, db => {
  if(!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', {keyPath: 'id'});
  }
});*/


/*
*   -- Puts data into the indexedDB object store
*
*   @param {string} storeName - Name of Object Store
*   @param {Object} data - A post from the firebase database
* */

function storeIntoObjectStore(storeName, data) {
  return dbPromise
    .then(db => {
      let tx = db.transaction(storeName, 'readwrite');
      let store = tx.objectStore(storeName);
      store.put(data);
      return tx.complete;
    })
}

function readDataInObjectStore(storeName) {
  return dbPromise
    .then(db => {
      let tx = db.transaction(storeName, 'readonly');
      
    })
  
}
