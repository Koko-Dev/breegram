let shareImageButton = document.querySelector('#share-image-button');
let createPostArea = document.querySelector('#create-post');
let closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
let sharedMomentsArea = document.querySelector('#shared-moments');
let closeTheFab = document.querySelector('#close-create-post-modal-btn');
let form = document.querySelector('form');
let titleInput = document.querySelector('#title');
let locationInput = document.querySelector('#location');




if(!window.Promise) {
  window.Promise = Promise;
}


// We want to install the app install banner prompt which we prevented in app.js at this point
function openCreatePostModal() {

  // createPostArea.style.display = 'block';

  /*setTimeout(() => {
    createPostArea.style.transform = 'translateY(0)';
  }, 1);*/

  createPostArea.style.transform = 'translateY(0)';

  // createPostArea.style.transform = 'translateY(0)';


  // Check to see if we previously were able to be prompted to install the app install banner
  //   because we can't show it on our own; we need to at least have had Chrome try to do so
  // So, we check to see if the promptDeferment from app.js 'beforeinstallprompt' event was  fired
  //    If promptDeferment is null or undefined, this is not execute
  if(promptDeferment) {
    // promptDeferment is set, therefore it is not null or undefined
    // We call the prompt() method which will now show this banner
    promptDeferment.prompt();

    // See what the user picked (whether or not they chose to install the banner)
    //     by using the Promise, userChoice()
    promptDeferment.userChoice.then(theChoiceResult => {
      console.log(theChoiceResult.outcome);

      if(theChoiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added banner to the home screen')
      }
    });

    // Set promptDeferment equal to null because you only have one shot to prompt the user
    //    to install the banner.  They can enable banner manually if they canceled installation
    promptDeferment = null;
  }

  // For testing purposes, unregister the Service Worker when plus is clicked
  // In Applications/Service Worker tab, as soon as plus button is clicked
  //     it will show that the Service Worker has been deleted
  /*
  if('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => {
        for(let i = 0; i <registrations.length; i++) {
          registrations[i].unregister();
        }
      })
  }
  */
}


closeTheFab.addEventListener('click', closeCreatePostModal);

function closeCreatePostModal() {
  createPostArea.style.transform = 'translateY(100vh)';
  // createPostArea.style.display = 'none';

}
/*
* shareImageButton from #share-image-button, from public/index.html, line 131
    * <button class="mdl-button mdl-js-button mdl-button--fab mdl-button--colored"
              id="share-image-button">
          <i class="material-icons">add</i>
     </button>
 */
shareImageButton.addEventListener('click', openCreatePostModal);


/*
* closeCreatePostModalButton is #close-create-post-modal-btn from public/index.html, line 113
* <div>
     <button class="mdl-button mdl-js-button mdl-button--fab"
             id="close-create-post-modal-btn" type="button">
        <i class="material-icons">close</i>
     </button>
 </div>
 */

// Currently not in use; Use case, User generated fetch event via button
//closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);


// Currently not in use; allows to save assets in cache on demand otherwise
// For clicked button to save Card
// Receives the event from addEventListener click event
function onSaveButtonClicked(event) {
  console.log('Clicked');

  // Check to make sure Browser accepts the Cache API
  // We can add an else statement that removes the button if
  //    the browser does not support caching later
  if('caches' in window) {
    // Set up a cache for user prompted events
    caches.open('user-requested')
          .then(cache => {
            // store the assets
            cache.add('https://httpbin.org/get');
            cache.add('/src/images/breeGrams1.jpeg');
          })
  }
}

// Helper function to clear the last card
function clearCards() {

  // sharedMomentsArea are where cards are appended (#shared-moments)
  // while-loop will remove one child at a time and,
  //       once all children are removed, it quits
  while(sharedMomentsArea.hasChildNodes()){
    // Removes the last child and once all are removed it's done
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}



// Creates the cards based on data from  get request to firebase database of posts
function createCard(data) {

  // console.log('DATA FOR CARD', data);
  let cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';

  let cardImage = document.createElement('div');
  cardImage.className = 'mdl-card__title';
  // cardImage.style.backgroundImage = 'url("/src/images/breeGrams1.jpeg")';
  cardImage.style.backgroundImage =  'url(' + data.image + ')';

  cardImage.style.backgroundSize = 'cover';

  // cardImage.style.height = '180px';


  cardWrapper.appendChild(cardImage);

  let cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  // cardTitleTextElement.textContent = 'Bronx Trip';
  cardTitleTextElement.textContent = data.title;
  cardTitleTextElement.style.color = "#F7F3EE";
  cardTitleTextElement.style.fontFamily = "'Indie Flower', cursive";
  cardTitleTextElement.style.fontWeight = '700';
  cardTitleTextElement.style.textShadow = '2px 2px #20262A';
  cardTitleTextElement.style.backgroundPosition = 'center';

  cardImage.appendChild(cardTitleTextElement);

  let cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  // cardSupportingText.textContent = 'Bronx, NY';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  cardSupportingText.style.color = '#5B5E6F';
  cardSupportingText.style.textShadow = '1px 1px #9F9997';

  // Add a button to save the card for User Triggered fetch event
  //  Commented out for future possible capability
  //  Dynamic Caching re-added in its place
 /*
 let cardSaveButton = document.createElement('button');
  cardSaveButton.textContent = 'Save';

  // Add event listener click event
  cardSaveButton.addEventListener('click', onSaveButtonClicked);
  cardSupportingText.appendChild(cardSaveButton);
  */

  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}


const url = 'https://httpbin.org/get';
const posturl = 'https://httpbin.org/post';

// Backend
// const firebasePosts = 'https://breegram-instagram.firebaseio.com/posts.json';
const firebasePosts = 'https://us-central1-breegram-instagram.cloudfunctions.net/storePostData.json';
let networkDataReceived = false;


/*
*   A helper function to create cards dynamically via firebase database
*     based on the data fetched from the firebase database of posts
*
*   @param {Array} data -  An array of posts from firebase database
*                       - originally an object, we converted it to an array
* */
function updateUI(data) {
  // First the last card
  clearCards();
  // console.log('[feed.js]');

// Loops through the posts in the firebase database and calls createCard for each post
  for(let i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

//  FOR indexedDB STRATEGIES

// Getting the card from indexedDB object store when no network data is received
// Make sure the browser supports indexedDB (Most browsers support as of December 2018)
// This is not necessary to do in the Service Worker as indexedDB is supported there
if('indexedDB' in window) {
  // Access content in indexedDB  (An Array of all values)
  // readDataInObjectStore returns a Promise ( return store.getAll() ) of all items in store
  readDataInObjectStore('posts')
    .then(data => {
      // data is an Array of all of the values returned fro getAll()

      // Check to see if the network data was received because if we did, we don't want to
      //     override it with the cache
      if(!networkDataReceived) {
        // We did not receive the data from the Network,
        //    so we have to get it from indexedDB store
        // console.log('Network Data was not received, so ==> From indexedDB store: ', data);

        // Call updateUI(data) which already expects an Array of data
        //   to create a card for each post in the Array of data from readDataInObjectStore()
        updateUI(data);
      }
    })
}



// FOR CACHING STRATEGIES using the Cache API

// Creates the card via a get request for firebase database of posts
// Getting the card from the Network
// If this get request fails, then createCard() does not happen here
// This kicks off our Cache, then Network Strategy and
//   must be loaded first.  Ensure this in SW fetch event.
fetch('https://breegram-instagram.firebaseio.com/posts.json')
  .then(response => {
    return response.json();
  })
  .then(data => {
    networkDataReceived = true;
    // clearCards();
    // createCard();

    // Creates the Card dynamically by looping through the firebase object 'posts'
    // Since the data from firebase is an Object we will convert the data into an Array
    //   in order to e able to loop through each post in updateUI
    let dataArray = [];
    for(let key in data) {
      // console.log('[feed.js] key: ', key);

      dataArray.push(data[key]);
    }

    // console.log('[feed.js] Array of  Posts in firebase from the WEB', dataArray);

    // Clear the last card and create a new one
    updateUI(dataArray);
  });


/* Fallback sendData method:
  Send data to the backend  (var firebasePosts)
*   Used if client Browser does not support syncManager interface or Service Workers
*/
function sendData (){
  fetch('https://us-central1-breegram-instagram.cloudfunctions.net/storePostData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value,
      image: 'https://firebasestorage.googleapis.com/v0/b/breegram-instagram.appspot.com/o/waterbird-main.jpg?alt=media&token=7dbd4e56-4f1c-4e46-9053-cc28997f87f2'
    })
  })
    .then(response=> {
      console.log('Data Sent', response);

      //  Update the UI after the data has been sent
      // because now we can fetch data from the backend
      updateUI();
    })
}
/* Register a submit listener from the form submit (post) button */
form.addEventListener('submit', event => {
  console.log('[feed.js] Post!');
  /*
   Prevent default so that the page does not get loaded, because the default of
   a submit event is to get data to the server
   (and at this point the page reloads)
   We don't want to do that. At this point we want to do that via JS,
   so we cancel default.
   */
  event.preventDefault();

  /*
   Check to see if #title and #location from index.html
   (html input tags for title and location information)
   is populated with data (if it has a value)
   Use the trim method to get rid of whitespace
   .value gives us access to whatever the user entered.
   */
  if(titleInput.value.trim() === '' || locationInput.value.trim() === ''){
    alert('Please enter valid data');
    /*
     return if invalid data was entered by the user because if it is
     empty then we want to ignore that click on the post button
     */
    return;
  }

  // Close the post modal
  closeCreatePostModal();

  /*
   Register a Sync request:
   Use cases:
        -- If there is no or connectivity with server is not in sync or absent
        -- If the user closes tab too quickly

   Check to see that we do have access to service worker in given browser
   If no service worker access, then we cannot register background sync
   Check to see if the SyncManager interface of the ServiceWorker API is
   available because it provides an interface for registering and
   listing sync registrations. Returns a Promise..
   At current time 1/14/2019, only Chrome and Opera has Background Sync API,
     In development are Edge and Firefox, according to caniuse.com.

   Even if a Browser supports the service worker, it may yet not
   support SyncManager.  So we check for both.
 */
  if('serviceWorker' in navigator && 'SyncManager' in window) {
     /* Check to see that the Service Worker has been configured and activated,
          ready to take some input.. using .ready (returns a Promise)
       .ready is a reqd-only property of the SW interface which provides
             a way of delaying code execution until an SW is active.
       .ready returns a Promise that will never reject, and which waits
             indefinitely until the ServiceWorkerRegistration associated
             with the current page has an 'active' worker.
      Once that condition is met, it resolves with the ServiceWorkerRegistration.
    */
    navigator.serviceWorker.ready
      .then(sw => {
        /*
          Create an object with:
             -- id (new Date in string form as a unique identifier)
             -- title value, and
             -- location value
       */
        let post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value
        };

        /*
          We can now interact with the Service Worker
          We do it this way because we are not in sw.js and the event
          that triggers the SyncManager happens in feed.js (the form submission).

          We cannot listen to the SyncManager in sw.js because we
           do not have access to the DOM there (form submit listener in feed.js)

          Register a Synchronization Task (sync tag)
          i.e.  sw.sync.register('sync-new-post');

           -- This gives us access to the SyncManager from the SW's point of view.
           -- Takes tag as the input

         At this point we do not have all of the info
         We need to pass information:
           -- find out what we should do,
           -- what we should send (titleInput.value, locationInput.value),
           -- what data we want to send with that request.

         Next step, then, is to configure the data we want to synchronize,
         send, and then store in indexedDB;

          Used to reestablish connectivity and
             check which outstanding tasks we have.
          Use the tag to see what we need to do with the task.

          Requires a counterpart in the actual Service Worker (SW) and
              we need to pass it data/info to synchronize (i.e. post content).

          Cannot pass post content to register() method the sync manager
                  does not have a built-in database,
            so we use IndexedDB to store post (location, title, id).
        */
        storeIntoObjectStore('sync-posts', post)
          .then(() => {
            // We only register sync tag if we have successfully written
            //    data to IndexedDB (otherwise we would have the tags set
            //    up but the data would not be there.
            return sw.sync.register('sync-new-post');
        })
          .then(() => {
            let snackbarContainer = document.querySelector('#confirmation-toast');

            // Materialize syntax for user toast message
            let data = {message: 'Your Post was saved for Background Sync'};
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch(error => {
            console.log(error);
          })
      })
  } else {
    // Add a fallback in case the syncManager is not allowed by the Browser
    // Idea:  We can also add the card manually with JavaScript
    sendData();
  }
});


/*

// Getting the card from the Cache
// For Cache first and Network with Dynamic Caching
if('caches' in window) {
  caches.match(firebasePosts)
        .then(response => {
          if(response) {
            return response.json();
          }
        })
        .then(data => {
          // Only create the card if networkDataReceived is false
          if(!networkDataReceived) {
            // clearCards();
            // createCard();

            // Creates the Card dynamically by looping through the firebase object 'posts'
            // Since the data from firebase is an Object we will convert the data into an Array
            //   in order to e able to loop through each post in updateUI
            dataArray = [];
            for(let key in data) {
              console.log('[feed.js] key: ', key);
              dataArray.push(data[key]);
            }

            console.log('[feed.js] Array of Posts in firebase from the CACHE', dataArray);
            updateUI(dataArray);
          }
        });
}

*/

// Theoretically, you can't store this post request in the cache with this code
// It is storing the Response of the Post Request in the Dynamic Cache
// It is not storing the Post request itself, just what we got back (response)
// So, it does not work for offline-first
// But, it is still able to render the card because we find the matching url in the cache
/*
fetch(posturl, {
  method: "POST",
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({message: 'Some Message'})
})
  .then(networkResponse => {
    return networkResponse.json();
  })
  .then(data => {
    // Does not get here if no network response
    networkDataReceived = true;
    console.log('From Web', data);
    clearCards();
    createCard();
});

*/



