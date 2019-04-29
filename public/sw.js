
importScripts('/src/js/idb.js');
importScripts('/src/js/indexedDB.js');


const STATIC_CACHE = 'static-v113';
const DYNAMIC_CACHE = 'dynamic-v108';

// for storing request.url's in the cache, not file paths
const STATIC_FILES = [
  '/',
  '/index.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/indexedDB.js',
  '/src/material-design/material.min.js',
  '/src/material-design/material.min.css',
  '/src/css/app.css',
  '/src/css/feed.css',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  '/offline.html'
];


/*

  Helper function to trim the Dynamic Cache
    - The is a recursive function which quits when the amount of elements is
      less than or equal to maxItems
    - This function is called

 @param {string} cacheName - The name of the Cache to trim
 @param {number} maxItems - The maximum number of items allowed to stay in the cache

*/
function trimCache(cacheName, maxItems) {
  caches.open(cacheName)
    .then(cache => {
      // returns an Array of all of the request.urls (strings) stored as keys
      return cache.keys()
        .then(cacheKeys => {
          if(cacheKeys.length > maxItems) {
            // Remove the oldest item, which would be the first element in the Array
            cache.delete(cacheKeys[0])
                 .then(trimCache(cacheName, maxItems))
          }
        })
    })
}


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
  // console.log('[Service Worker] Installing Service Worker ...', event);
  // waitUntil() ensures caches.open() finishes loading
  //     before installation process is complete
  event.waitUntil(
    caches.open(STATIC_CACHE)
          .then(cache => {
            // console.log('[Service Worker] Pre-Caching App Shell');

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
  // console.log('[Service Worker] Activating Service Worker ...', event);

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
        // console.log('Service Worker', keyList);

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
  );  // end waitUntil() in activate event

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



/*
  Helper function for fetch event Static Cache Asset request.url

  @param {string} string - The event.request.url
  @param {Array} array - The STATIC_FILES Array containing strings of the main request.url assets

*/
function isInArray(string, array) {
  let cachePath;

  // Request targets domain where we serve the page from (i.e. NOT a CDN)
  if (string.indexOf(self.origin) === 0) {
    // console.log('matched ', string);

    // Take the part of the URL AFTER the domain (e.g. after localhost:8080)
    cachePath = string.substring(self.origin.length);
  } else {
    // store the full request (for CDNs)
    cachePath = string;
  }
  return array.indexOf(cachePath) > -1;
}



// IndexedDB Strategy

self.addEventListener('fetch', event => {
  // Check which kind of request we are making
  // We only want to use the Cache then Network strategy with url used to create card
  // For all else, we use the Dynamic Caching with Offline Fallback Page Strategy
  // const url = 'https://httpbin.org/get';

  const url = 'https://breegram-instagram.firebaseio.com/posts';

  // Check to see if event.request.url contains this string ('https://httpbin.org/get')
  // If it does not then conditional is not greater than -1 (is -1)
  // If conditional is true, then we want to use the Cache, then Network Strategy
  if(event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Store the network response in indexedDB 'posts' store
          // Create a copy of the network response because Promises only allows for one use
          let response = networkResponse.clone();
          // Clear the indexedDB ObjectData Store before we extract any data
          //   and add to it from the firebase database to ensure that
          //   all posts are current
          // clearAllDataInIdbStore returns a Promise
          clearAllDataInIdbStore('posts')
            .then(() => {
              // We do not need to return anything from clearAllDataIdbStore
              //    as it is a utility function
              // return the
              // .json() returns a Promise
              return response.json()
            })
            .then(data => {
              // The keys are the post names from firebase database 'first-post', 'second-post', etc
              for(let key in data) {
                // Loop through the posts in firebase database,
                // Call helper function storeIntoObjectStore
                // This will populated indexedDB 'posts' object store
                storeIntoObjectStore('posts', data[key])
                // Delete the item directly after it is stored
                  /*.then(data => {
                    // This deletes the item immediately after it is written
                    // So, the indexedDB store should not become populated
                    // The expected behavior is to ensure the indexedDB store 'posts' remains empty
                    // This is used for TESTING only
                    // deleteSingleItemFromIdbStore('posts', key)
                  })*/
              } // end for loop
            });
          return networkResponse;
        })
    ); // end event.responseWith()
  } else if(isInArray(event.request.url, STATIC_FILES)) {
    // Use Case: Use Cache Only Strategy if event.request.url is in static cache.
    // Since the service worker uses version control, the main assets in shell will be current
    event.respondWith(
      caches.match(event.request)
    )
  } else {
    // Use Dynamic Caching with Offline Fallback Page Strategy
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // The parameter response is null if there is no match
          if(response) {
            return response;
          } else {
            // Dynamic Caching begins here
            // We return the event.request as usual, but we also...
            //  -- open/create a dynamic cache and..
            //  -- store the event request that was not in the Static Cache
            // into the new Dynamic Cache for later offline-first capabilities
            return fetch(event.request)
              .then(networkResponse => {
                // If you don't return caches.open, caches.put() will not do much
                return caches.open(DYNAMIC_CACHE)
                 .then(cache => {
                   // trimCache(DYNAMIC_CACHE, 7);
                   // console.log('Trimmed the Cache in else');
                   // Store the item in dynamic cache with a clone because..
                   // we can only use each parameter/response Once
                   // Network response is stored in cache and the other goes to user.
                   cache.put(event.request.url, networkResponse.clone());

                   // Return response to the user to get what they requested
                   return networkResponse;
                 })
              })
              .catch(error => {
                // Implement Fallback Page Strategy here:
                console.log('Service Worker -- Error: ', error);
                return caches.open(STATIC_CACHE)
                 .then(cache => {

                   // Get the Offline Fallback page and return it
                   // The command for getting something is cache.match()
                   // Drawback is whenever we make an HTTP request where we can't get a valid
                   //    return value, we will return to this page.
                   //   - This has a bad side effect that if at some point some other request
                   //   like fetching JSON from a url we can't reach, this will also be returned
                   //   Fine tuning required - will modify depending on route of resource, etc..

                   /*if(event.request.url.indexOf('/help') > -1) {
                     // if the event.request.url contains /help, then
                     //   then I know that it tried and failed to load
                     //   the help page.  Return offline.html instead
                     //   which gives the option to redirect to root page
                     //   which was pre-cached in the install event
                     return cache.match('/offline.html')
                   }*/


                   // An improved conditional
                   // As I add more pages, would have needed to add conditions
                   // i.e. if(event.request.url.indexOf('/help') || event.request.url.indexOf('/petunia')
                   if (event.request.headers.get('accept').includes('text/html')) {
                     return cache.match('/offline.html');
                   }
                 })
              })
          }
        })
    )
  }  // End Dynamic Caching with Network Fallback and Offline Fallback Page Strategy
});  // End CACHE, then NETWORK with Dynamic Caching Strategy



/*  Add Background Sync Capabilities
 *    -- Sync the data to the Service Worker
 *
 *  Steps:
 *    -- Listen for the sync event
 *    -- This event will be executed:
 *       1.  whenever the Service Worker believes it has
 *            reestablished connectivity, or
 *       2.  if the connectivity was always there
 *             (as soon as a new sync task was registered.
 *   -- So, whenever the Service Worker thinks it has connectivity
 *        and it has an outstanding synchronization task, it will
 *        trigger this event.
 *
 *  -- Steps:
 *       1.  React to Sync Event
 *       2.  Get data stored in sync-posts object store
 *       3.  Loop through stored data from sync-posts object store
 *       4.  Send a Post Request for each of the data pieces stored
 *       5.  Delete Post from indexedDB if we successfully sent it to the Server
 */
self.addEventListener('sync', event => {
  // Backend
  // const firebasePosts = 'https://breegram-instagram.firebaseio.com/posts.json';
  let firebasePosts = 'https://us-central1-breegram-instagram.cloudfunctions.net/storePostData';

  /*
   At this point, I want to send the request to the Server
     because I know that we have an internet connection.
  */
  console.log('[Service Worker] => Sync event has fired - Background Syncing', event);

  /*
  *
     -- In theory, we could have many sync tags and would want
     to do different things for each.

     -- I registered a sync tag, 'sync-new-post' in feed.js
         and would like to handle it here
   */

  // Check to see if there is an event tag
  if(event.tag === 'sync-new-post') {
      // If you have different sync tags, use a switch case
      console.log('[Service Worker]- Syncing new Posts', event.tag);


      //  Read and Send all post data
      event.waitUntil(
          readDataInObjectStore('sync-posts')
              .then(data => {
                  /*
                    -- User Posts Title, Location
                     -- Send the data from the sync-posts object store
                     to the Server.
                     -- We want to loop through the data because the user
                     may have sent multiple posts.
                     -- Use a for/of loop to gain access to all of the
                     posts queued up for synchronization
                     -- For now, I will temporarily hard-code the image
                     -- At this point the cloud function accepts JSON data

                     -- UPDATE:
                        -- Because we have converted the base64Url
                     image to a blob (file), we will no longer send
                     JSON data. So, we will get rid of the headers specifying
                     the Content-Type and Accept of JSON data so that it
                     can now infer that it is receiving, instead a file/blob.
                     NOTE:  We could keep the Accept header, but not mandatory
                        -- postData var creates a new FormData Object
                        This allows us to send form data to the backend
                        through Ajax or fetch, and it will replace body value.

                  */

                  for (let dt of data) {

                    // Using formData interface, append data properties
                    //  This is used in place of the POST body value
                    let postData =  new FormData();
                    postData.append('id', dt.id);
                    postData.append('title', dt.title);
                    postData.append('location', dt.location);
                    postData.append('rawLocationLat', dt.rawLocation.lat);
                    postData.append('rawLocationLng', dt.rawLocation.lng);

                    // Override dt.picture with dt.id + '.png'
                    //   Defaults to a png
                    postData.append('file', dt.picture, dt.id + '.png');

                      fetch('https://us-central1-breegram-instagram.cloudfunctions.net/storePostData', {
                          method: 'POST',
                          body: postData
                      })
                          .then(response => {
                              console.log('[Service Worker] Sent Data from sync event');
                              /* Clean sync-posts object store one post at a time.
                               * To be safe, check to see if response.ok is true
                                *  -- 'ok' is a helper property provided on the
                                *  response object which indicated if the response
                                *  code is in the 200 area, which means it was
                                *  successful
                                *  */
                              if (response.ok) {
                                  response.json()
                                      .then(responseData => {
                                          /*
                                           -Use helper function in indexedDB.js to delete post
                                           from indexedDB.
                                           -Later, upgrade this to get the ID from the Server,
                                           which would be much safer to execute the right
                                           code on the right response
                                           */
                                          // not working correctly because for-loops don't always work
                                          // correctly  with asynchronous code.  I will fix this later.
                                          deleteSingleItemFromIdbStore('sync-posts', responseData.id);
                                      })
                              }
                          })
                          .catch(error => {
                              console.log('[Service Worker] Sync listener => Error while sending data: ', error);
                          });
                  }  // end for loop
              })
      );
  }
});



/*
*   After the User clicks on an Enable Notifications button,
*   we displayed two actions the user can take:
*        1.  Verify that they are enabling Notifications -"Ok"
*        2.  Cancel Notifications - "Cancel"
*/
self.addEventListener('notificationclick', event => {

    let notification = event.notification;
    let action = event.action;

    // console.log('Notification is: ', notification);
    // console.log('Action is: ', action);

    if (action === 'confirm'){
        console.log('[Service Worker]  Confirm was chosen');
        notification.close();
    } else {

      console.log('[SW} Notification click not confirmed', action);


      /*

        TODO: Open a new page on Notification click in all cases where the action is not confirmed
          To ensure that the Service Worker gives the time to
          open a new page, use event.waitUntil()

          Clients interface => provides access to Client objects
            via self.clients within SW.
          - https://developer.mozilla.org/en-US/docs/Web/API/Clients#Browser_compatibility
          Note: Not compatible with IE or Safari

          Clients.mathAll() returns a Promise for an array of
            Client objects.  An options arg allows you to
            control the types of clients returned.

          Clients/WindowClient   =>  visibilityState

          clients - all windows or all browser tasks related to and managed by this SW
      */
      event.waitUntil(
        clients.matchAll()
          .then(clientLIst => {
            // clientLIst = managed by this SW  (array)

            // Find Windows managed by this SW which are Visible
            // (opened windows where our application runs)
            // var client identifies the first window our app running the app
            let client = clientLIst.find(firstTrueWindow => {
              // First element in array that has visibilityState = true
              // This means we have an open browser window running the app
              return firstTrueWindow.visibilityState === 'visible';
            });

            // If we found an opened browser window
            //  Note:  Changed url from http://localhost:8080 to notification.data.openUrl
            if (client !== undefined) {
              client.navigate(notification.data.url);
              client.focus();
            } else {
              // If there is no opened browser window running our app,
              //    then we open a window/tab with our application loaded,
              //    which is managed by this SW
              clients.openWindow(notification.data.url);
            }

            notification.close();

          })
      );
    }
});



/*
    -- On a Mac, when the user clicks on an Enable Notifications button,
      the System Notification gives the option to close the notification  popup
    Listen for this event
    -- On Android, the notification can be swiped close or the user can hit the
      'Delete All' (notifications) button
      On the event that the user closes the system's notification popup,
*/
self.addEventListener('notificationclose', event => {

    /*  -- This is a great listener for sending analytics data to our server because
    *    the User did not interact with our Notification (closed the Notification).
    *    So, we can store the timestamp of the Notification and try to find out
    *    why the Users did not interact.
    */
    console.log('Notification was closed: ', event);
});



// Listen to Push Messages
// push event will fire whenever we get an incoming push message
// We get an incoming push message when subscribed user receives a push message

/*
*  https://developers.google.com/web/fundamentals/codelabs/push-notifications/
*  Considering what will actually happen when a subscribed user receives a push message.

      When we trigger a push message:
       -- the browser receives the push message,
       -- the browser figures out what service worker the push is for before waking up
      that service worker and dispatching a push event.

      We need to listen for this event and show a notification as a result.*/
self.addEventListener('push', event => {

  console.log('Push Notification received', event);

  // Retrieve any data we sent with push notification
  // The push message was sent from functions/index.js

  // First check to see if our event.data object exists,
  // i.e. if there is some data attached to the push event
  //  -- the data object is from the push message we sent in the payload argument
  //  which can be found in the .sendNotification payload argument in functions/index.js
  //    Note: payload is limited to 4K from remote server, link to image is acceptable

  // Set up some dummy data just in case there is no payload via push notification
  // Add url property to point to root page for testing because actual payload is /help
  let data ={title: 'New!', content: 'Something New Happened!', openUrl: '/'};

  // Check to see if there is data in the push event, since it
  //    was fired.
  if (event.data) {
    // We have data and can extract this data, so reassign to data var.
    // Remember, in functions/index.js .sendNotification payload (data) was JSON.stringify(),
    //   so we convert to a JS Object and extract the text
    data = JSON.parse(event.data.text());

    // Use var data to show a New Notification
    // First, set up some options for the Notification
    // -- Add data property url to point to payload openUrl property which points to /help
    //    - Extract this data in the notificationclick event
    let options = {
      body: data.content,
      icon: '/src/images/icons2/icon1-96x96-2.png',
      badge: '/src/images/icons2/icon1-96x96-2.png',
      data: {
        url: data.openUrl
      }
    };

    /*

      Display Notification
        Call event.waitUntil() to make sure the Service Worker(SW)
         waits for me to really show this notification.

        This gives access to the SW, but the active SW itself
        cannot show notifications because SW is there to listen
        to events running in the background.

        For this reason, we have to get access to the SW registration
         (self.registration)  because that is the part running in
         the Browser, so to speak, the part connecting the SW
         to the Browser.

        On self.registration, we can call .showNotification()
           just as before
   */
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
});


















//  Caching Strategies for experimentation only

//  Cache, then Network for 'https://httpbin.org/get' use to create card along with
//  Dynamic Caching with Network Fallback and Offline Fallback Page Strategy
//       for all other assets
/*
self.addEventListener('fetch', event => {
  // Check which kind of request we are making
  // We only want to use the Cache then Network strategy with url used to create card
  // For all else, we use the Dynamic Caching with Offline Fallback Page Strategy
  // const url = 'https://httpbin.org/get';
  const url = 'https://breegram-instagram.firebaseio.com/posts';

  // Check to see if event.request.url contains this string ('https://httpbin.org/get')
  // If it does not then conditional is not greater than -1 (is -1)
  // If conditional is true, then we want to use the Cache, then Network Strategy
  if(event.request.url.indexOf(url) > -1) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE)
            .then(cache => {
              // Initially this cache is empty because we have not visited pages
              // NOTE: This intercepts requests from feed.js
              return fetch(event.request)
                .then(networkResponse => {
                  trimCache(DYNAMIC_CACHE, 7);
                  console.log('Trimmed the Cache');
                  cache.put(event.request.url,  networkResponse.clone());
                  return networkResponse;
                })
            })
    )
  } else if(isInArray(event.request.url, STATIC_FILES)) {
    // Use Case: Use Cache Only Strategy if event.request.url is in static cache.
    // Since the service worker uses version control, the main assets in shell will be current
    event.respondWith(
      caches.match(event.request)
    )
  } else {
    // Use Dynamic Caching with Offline Fallback Page Strategy
    event.respondWith(
      caches.match(event.request)
            .then(response => {
              // The parameter response is null if there is no match
              if(response) {
                return response;
              } else {
                // Dynamic Caching begins here
                // We return the event.request as usual, but we also...
                //  -- open/create a dynamic cache and..
                //  -- store the event request that was not in the Static Cache
                // into the new Dynamic Cache for later offline-first capabilities
                return fetch(event.request)
                  .then(networkResponse => {
                    // If you don't return caches.open, caches.put() will not do much
                    return caches.open(DYNAMIC_CACHE)
                                 .then(cache => {
                                   trimCache(DYNAMIC_CACHE, 7);
                                   console.log('Trimmed the Cache in else');
                                   // Store the item in dynamic cache with a clone because..
                                   // we can only use each parameter/response Once
                                   // Network response is stored in cache and the other goes to user.
                                   cache.put(event.request.url, networkResponse.clone());

                                   // Return response to the user to get what they requested
                                   return networkResponse;
                                 })
                  })
                  .catch(error => {
                    // Implement Fallback Page Strategy here:
                    console.log('Service Worker -- Error: ', error);
                    return caches.open(STATIC_CACHE)
                                 .then(cache => {

                                   // Get the Offline Fallback page and return it
                                   // The command for getting something is cache.match()
                                   // Drawback is whenever we make an HTTP request where we can't get a valid
                                   //    return value, we will return to this page.
                                   //   - This has a bad side effect that if at some point some other request
                                   //   like fetching JSON from a url we can't reach, this will also be returned
                                   //   Fine tuning required - will modify depending on route of resource, etc..

                                   if(event.request.url.indexOf('/help') > -1) {
                                     // if the event.request.url contains /help, then
                                     //   then I know that it tried and failed to load
                                     //   the help page.  Return offline.html instead
                                     //   which gives the option to redirect to root page
                                     //   which was pre-cached in the install event
                                     return cache.match('/offline.html')
                                   }


                                   // An improved conditional
                                   // As I add more pages, would have needed to add conditions
                                   // i.e. if(event.request.url.indexOf('/help') || event.request.url.indexOf('/petunia')
                                   if (event.request.headers.get('accept').includes('text/html')) {
                                     return cache.match('/offline.html');
                                   }
                                 })
                  })
              }
            })
    )
  }  // End Dynamic Caching with Network Fallback and Offline Fallback Page Strategy
});  // End CACHE, then NETWORK with Dynamic Caching Strategy
*/



// Currently not in use
// CACHE then NETWORK with Dynamic Caching Strategy
// NOT offline-first
// The idea here is the get an asset as quickly as possible from the cache or network,
//    whichever is fastest while simultaneously going through the network
//    (implemented in feed.js) and implementing Dynamic caching in the Service Worker
// NOTE: This intercepts all fetch requests, including the network request in feed.js
// If we don't get it from the cache and we can't get it from the network, no-can-do
// NOTE 2: Because we are going through Dynamic Cache, we are updating assets
//       BUT, this breaks offline first. Must modify
/*
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(DYNAMIC_CACHE)
          .then(cache => {
            // Initially this cache is empty because we have not visited pages
            // NOTE: This intercepts requests from feed.js
            return fetch(event.request)
              .then(networkResponse => {
                cache.put(event.request.url,  networkResponse.clone());
                return networkResponse;
              })
          })
  )
});  // End CACHE, then NETWORK with Dynamic Caching Strategy
*/


// Currently not in use
// CACHE ONLY
/*
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
  )
});  // End CACHE ONLY
*/



// Currently not in use
// NETWORK ONLY STRATEGY -- no need for a service worker really
//  -- This would make sense for some resources which we will split up
//     when we parse an incoming request to funnel some through when
//     we just need the network result.  Otherwise, there is no need.
/*
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
  )
});
*/


// Currently not in use
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



// Currently not in use
/* DYNAMIC CACHING Strategy -- Cache with Network Fallback */
// Assets are cached for offline-first only when user accessed them while online
// For Dynamic caching, we have to go to the fetch listener because
//   Dynamic Caching means that we have a fetch request
//   that we have to go anyway when we are online, so we want to just store
//   the response in the cache for future offline-first use
// NOTE: THIS IS DEBT HEAVY because we do not update via network by default
//       but we go for the cache first
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
          //  -- open/create a dynamic cache and..
          //  -- store the event request that was not in the Static Cache
          // into the new Dynamic Cache for later offline-first capabilities
          return fetch(event.request)
            .then(networkResponse => {
              // If you don't return caches.open, caches.put() will not do much
              return caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  // Store the item in dynamic cache with a clone because..
                  // we can only use each parameter/response Once
                  // Network response is stored in cache and the other goes to user.
                  cache.put(event.request.url, networkResponse.clone());

                  // Return response to the user so that they get what they requested
                  return networkResponse;
                })
            })
            .catch(error => {
              console.log('Service Worker -- Error: ', error);
            })
        }
      })
  )
}); // End DYNAMIC CACHING Strategy*/




// Currently not in use
// Cache, then Dynamic Cache, then Network
//  USE CASE: User triggers a fetch event
//    --When the user triggers a fetch event, such as an
//        article on a news site which you want to save and access
//        later, perhaps even offline.
//    --To do this, we need to temporarily turn off our dynamic caching
//        (cache.put()) because if it's turned on, we can't simulate
//        this because we are caching everything anyway.
/*

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
              //    -- store the event request that was not in the
              //       Static Cache into the new Dynamic Cache
              //       for later offline-first capabilities
              return fetch(event.request)
                .then(networkResponse => {
                  // If you don't return caches.open, caches.put() will not do much
                  return caches.open(DYNAMIC_CACHE)
                               .then(cache => {
                                 // Temporarily disable cache.put() to simulate Use Case
                                  /!*cache.put(event.request.url, networkResponse.clone());*!/

                                 // Return the response to the user
                                 //      so that they get what they requested
                                 return networkResponse;
                               })
                })
                .catch(error => {
                  console.log('Service Worker -- Error: ', error);
                })
            }
          })
  )
});  // End Cache on Demand. Use Case: button triggers caching
*/



// Currently not in use
// DYNAMIC CACHING with OFFLINE FALLBACK PAGE Strategy
/*
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
              //  -- open/create a dynamic cache and..
              //  -- store the event request that was not in the Static Cache
              // into the new Dynamic Cache for later offline-first capabilities
              return fetch(event.request)
                .then(networkResponse => {
                  // If you don't return caches.open, caches.put() will not do much
                  return caches.open(DYNAMIC_CACHE)
                               .then(cache => {
                                 // Store the item in dynamic cache with a clone because..
                                 // we can only use each parameter/response Once
                                 // Network response is stored in cache and the other goes to user.
                                 cache.put(event.request.url, networkResponse.clone());

                                 // Return response to the user to get what they requested
                                 return networkResponse;
                               })
                })
                .catch(error => {
                  // Implement Fallback Page Strategy here:
                  console.log('Service Worker -- Error: ', error);
                  return caches.open(STATIC_CACHE)
                    .then(cache => {
                      // Get the Offline Fallback page and return it
                      // The command for getting something is cache.match()
                      // Drawback is whenever we make an HTTP request where we can't get a valid
                      //    return value, we will return to this page.
                      //   - This has a bad side effect that if at some point some other request
                      //   like fetching JSON from a url we can't reach, this will also be returned
                      //   Fine tuning required - will modify depending on route of resource, etc..
                      return cache.match('/offline.html')
                    })
                })
            }
          })
  )
}); // End DYNAMIC CACHING with Offline Fallback Page Strategy
*/


// Currently not in use
// NETWORK with CACHE FALLBACK Strategy
// Plus:  We serve updated content first
// Drawbacks:  -We do not take advantage of the faster response with a cache first strategy.
//             - If a fetch fails, the Network does not respond instantly;
//              this is especially problematic with LIE-FI
//             (ie. a request may timeout in 60 sec where user would have to wait a full 60 sec
//             before you reach out to the backup cache == Terrible user experience)
// Use Case:  For assets which you can fetch in the background
//     that do not have to be used immediately
/*
self.addEventListener('fetch', event => {
  // We want to first respond with our network and then fall back to the cache if no connection
  event.respondWith(
    fetch(event.request)
      .catch(error => {
        return caches.match(event.request)
      })
  );
}); // End of NETWORK with CACHE FALLBACK Strategy
*/



// NETWORK FIRST, then DYNAMIC, then CACHE FALLBACK Strategy
/*
self.addEventListener('fetch', event => {
  // Network First
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Dynamically Cache and then return response
        return caches.open(DYNAMIC_CACHE)
          .then(cache => {
            cache.put(event.request.url, networkResponse.clone());
            return networkResponse;
          })
      })
      .catch(error => {
        // Return response from the Cache
        return caches.match(event.request);
      })
  )
});   // End NETWORK FIRST, then DYNAMIC WITH CACHE FALLBACK Strategy

*/







