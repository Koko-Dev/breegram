const dbPromise = idb.open('posts-store', 2, db => {
  if(!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', {keyPath: 'id', autoIncrement: true});
  }
  if(!db.objectStoreNames.contains('sync-posts')) {
    db.createObjectStore('sync-posts', {keyPath: 'id', autoIncrement: true});
  }
});


/*
*   -- Puts data into an IndexedDB Object Store
*
*   @param {string} storeName - Name of Object Store
*   @param {Object} data - A post from the firebase database
*
*   @return - Returns a Promise
* */
function storeIntoObjectStore(storeName, data) {
  return dbPromise
    .then(db => {
      let tx = db.transaction(storeName, 'readwrite');
      let store = tx.objectStore(storeName);
      // put() overrides any value
      store.put(data);
      return tx.complete;
    })
}


/*
*   -- Reads data from the IndexedDB Object Store
*      This is a 'GET' Data operation used in feed.js
*
*      @param {string} storeName - The name of indexedDB  Object Store
*
*      @return - Returns a Promise because getAll() returns a Promise
*      which resolves once the data is read.
*      Resolves to null or undefined if there is no data.
*
* */
function readDataInObjectStore(storeName) {
  // Opend the IndexedDB Database 'posts-store'
  return dbPromise
    .then(db => {
      let tx = db.transaction(storeName, 'readonly');
      let store = tx.objectStore(storeName);
      // If the transaction does not complete we simply get back no data
      // This is a GET operation, therefore we never try to change
      //     the Database. It is not a readwrite operation
      //     so we do not need tx.complete
      // If it fails, it returns null or undefined
      // We never have the case where we need to
      //    wait for a transaction to successfully finish
      // Note that getAll() returns a Promise
      return store.getAll();
    })
}

function clearAllDataInIdbStore(storeName) {
  return dbPromise
    .then(db => {
      let tx = db.transaction(storeName, 'readwrite');
      let store = tx.objectStore(storeName);
      store.clear();
      // tx.complete is required on all readwrite operations
      // Here, we must ensure a finished transaction
      // Note:  tx.complete returns a Promise
      return tx.complete;
    })
}

// Allows us to delete a single post
function deleteSingleItemFromIdbStore(storeName, id) {
  dbPromise
    .then(db => {
      let tx = db.transaction(storeName, 'readwrite');
      let store = tx.objectStore(storeName);
      store.delete(id);
      return tx.complete;
    })
    .then(() => {
      console.log('Item Deleted');
    })
}


