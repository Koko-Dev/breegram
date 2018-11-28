const STATIC_CACHE = 'static-v6';
const DYNAMIC_CACHE = 'dynamic-v6';

// for storing request.url's in the cache, not file paths
const STATIC_FILES = [
  '/',
  '/index.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/material-design/material.min.js',
  '/src/material-design/material.min.css',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/css/help.css',
  '/help/index.html',
  '/src/images/breeGrams1.jpeg',
  '/src/images/parkour-main.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];


// install and activate are triggered by the Browser
/*self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker ... ', event);
  // caches.open() returns a promise --
  //    it  opens cache if it exists, or creates cache if doesn't
  // Note: The install event does not wait for caches.open() to load.
  //    To ensure it does, we use the waitUntil() method, which
  //    returns a promise, and install event now won't finish installation process
  //       until caches.open() has completed loading.
  event.waitUntil(caches.open(STATIC_FILES)
    .then(theStaticCache => {
      console.log('[Service Worker] Pre-caching App Shell');
      return theStaticCache.addAll(STATIC_FILES);
    }))
  
});*/



// The install event is the best place to cache static assets
self.addEventListener('install', function (event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  // waitUntil() ensures caches.open() finishes loading
  //     before installation process is complete
  event.waitUntil(
    caches.open(STATIC_CACHE)
          .then(cache => {
            console.log('[Service Worker] Pre-Caching App Shell');
            
            // addAll() takes an Array of strings identifying the request.url's
            //  we want to cache,  but will fail all if even one request.url fails.
            // We can use cache.add() to store individual
            //  files in the cache without risking that the entire cache is
            //  rejected for one request.url
            return cache.addAll(STATIC_FILES);
          }))
});  // End install event




/* The best place to do cache cleanup is in the activate event because
*      this will only be executed once the user closes all pages,
 *      in the service worker scope, and opens a new one (right at the start).
 *      At that point it is safe to update caches and remove old ones.
 *      */
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker ...', event);
  
  /* First, we want to wait until we are done with the cleanup
           before we continue, so we use waitUntil()
     If we do not do this, a fetch event may be triggered delivering
     files from the old cache which we are about to tear down.
 */
  event.waitUntil(
    // keys() is an array of strings
    //  -it outputs an array of strings, the names of sub-caches, in our cache storage
    // i.e. ['static-v3', 'static-v4', 'dynamic-v3', 'dynamic-v4']
    caches.keys()
      .then(keyList => {
        console.log('Service Worker', keyList);
        
        // Promise.all() takes an Array of Promises and waits for them all to finish
        // Using this so that we only return from this function once we are really
        //     done with the cleanup.
        // Now, at this point we do not have an Array of Promises, but we do have
        //    an Array of keys(), which is an Array of strings (names of caches).
        // So, we convert them into Promises using map( ).
        // map() is a default JS area operator which allows us to transform an Array
        // So, we want to transform this Array of strings into an Array of Promises
        return Promise.all(keyList.map(keyInList => {
          // if the key in the list is not equal to the current version of
          //  the static or dynamic cache names, then we want to delete it.
          // If the conditional is not satisfied, then it will return null
          // (i.e. It will replace the given string in the keyInList with nothing)
          if(keyInList !== STATIC_CACHE && keyInList !== DYNAMIC_CACHE) {
            console.log('Service Worker: Removing old cache: ', keyInList);
            
            //  caches.delete() returns a Promise and map() returns an Array
            //  The result of map() then, therefore, in this case,
            //      will return an Array of Promises.  Hence,
            //  Promises.all() therefore receives the required Array of Promises
            return caches.delete(keyInList);
          }
        }))
      })
  );
  
  /*
    From: https://developer.mozilla.org/en-US/docs/Web/API/Clients/claim
  * -- claim() method of 'Clients' allows active SW to set itself as the 'controller'
  *       for all clients within this 'scope'.
  * -- Triggers a "controllerchange" event on 'navigator.serviceWorker' in any clients
  *       that become controlled by this SW.
  * -- When an SW is initially registered, pages won't use it until they next load.
  *       The claim() method causes those pages to be controlled immediately.
  *        -- Be aware that this results in your SW controlling pages that loaded
  *           regularly over the network, or possibly via a different SW.
*/
  // return self.clients.claim();
  
  /*
   Using claim() inside service worker's "activate" event listener
   so that clients loaded in the same scope do not need to be reloaded
    before their fetches will go through this service worker.
  * */
  event.waitUntil(clients.claim());
});  // END activate event




  /* PRE-CACHING Only Strategy
    - fetch is triggered by the web application
 */
/*self.addEventListener('fetch', (event) => {
  // console.log('[Service Worker] Fetch Event triggered ... ', event.request.url);
  
  // Fetch the data from the cache, if available
  // event.request must be a request object, never a string
  // caches.match requests a request object which are our cache keys
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // response is null if there is no match
        if(response) {
          // Here we are not making a network request,
          // but we are intercepting the request and we are not issuing a new one
          // Instead we are just looking to see if there is a match
          // If there is a match iin the cache, then we return the cached response
          return response;
        } else {
          // If it is not in the cache, get it from the Network
          return fetch(event.request);
        }
      })
  );
});    // End fetch event -- PRE-CACHING Only Strategy
*/



/* DYNAMIC CACHING Strategy */
// Assets are cached for offline-first only when user accessed them while online
// For Dynamic caching, we have to go to the fetch listener because
//   Dynamic Caching means that we have a fetch request
//   that we have to go anyway when we are online, so we want to just store
//   the response in the cache for future offline-first use
/*self.addEventListener('fetch', event => {
  // console.log('Service Worker - fetch event - Dynamic Caching', event);
  // We want to respond with our cached assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // The parameter response is null if there is no match
        if(response) {
          return response;
      } else {
          // Dynamic Caching begins here
          // We return the event.request as usual, but we also...
          //    -- open/create a dynamic cache and..
          //    -- store the event request that was not in the Static Cache
          //     into the new Dynamic Cache for later offline-first capabilities
          return fetch(event.request)
            .then(networkResponse => {
              // If you don't return caches.open, caches.put() will not do much
              return caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  // Store the item in dynamic cache with a clone because..
                  //   we can only use each parameter/response Once
                  //  One network response is stored in cache and the other goes to user.
                  cache.put(event.request.url, networkResponse.clone());
                  
                  // Return the response to the user so that they get what they requested
                  return networkResponse;
                })
            })
            .catch(error => {
              console.log('Service Worker -- Error: ', error);
            })
        }
      })
  )
});*/ // End DYNAMIC CACHING Strategy




//  USE CASE: User triggers a fetch event
//    --When the user triggers a fetch event, such as an article on a news site which
//      you want to access later, perhaps even offline.
//    -- To do this, we need to temporarily turn off our dynamic caching because
//      if it's turned on, we can't simulate this because we are caching everything anyway.
self.addEventListener('fetch', event => {
  // console.log('Service Worker - fetch event - Dynamic Caching', event);
  // We want to respond with our cached assets
  event.respondWith(
    caches.match(event.request)
          .then(response => {
            // The parameter response is null if there is no match
            if(response) {
              return response;
            } else {
              // Dynamic Caching begins here
              // We return the event.request as usual, but we also...
              //    -- open/create a dynamic cache and..
              //    -- store the event request that was not in the Static Cache
              //     into the new Dynamic Cache for later offline-first capabilities
              return fetch(event.request)
                .then(networkResponse => {
                  // If you don't return caches.open, caches.put() will not do much
                  return caches.open(DYNAMIC_CACHE)
                               .then(cache => {
                                 // Store the item in dynamic cache with a clone because..
                                 //   we can only use each parameter/response Once
                                 //  One network response is stored in cache and the other goes to user.
                                 
                                 // Temporarily disable cache.put() to simulate Use Case
                                  /*cache.put(event.request.url, networkResponse.clone());*/
              
                                 // Return the response to the user so that they get what they requested
                                 return networkResponse;
                               })
                })
                .catch(error => {
                  console.log('Service Worker -- Error: ', error);
                })
            }
          })
  )
});

