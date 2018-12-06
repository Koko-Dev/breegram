const dbPromise = idb.open('posts-store', 1, db => {
  if(!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', {keyPath: 'id', autoIncrement: true});
  }
});


/*
*   -- Puts data into an IndexedDB Object Store
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
      // This is a GET operation, therefore we never try to change the Database
      //      so, we do not need tx.complete
      // Can directly return results because Database integrity is never in danger
      // If it fails, it returns null or undefined
      // We never have that case where we need to wait for a transaction to successfully finish
      return store.getAll();
    })
}


