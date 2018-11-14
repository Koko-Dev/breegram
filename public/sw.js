self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker ... ', event);
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker ...', event);
  
  /*
  * claim() method of 'Clients' allows active SW to set itself as the 'controller'
  * for all clients within this 'scope'.
  * -- Triggers a "controllerchange" event */
  return self.clients.claim();
});


