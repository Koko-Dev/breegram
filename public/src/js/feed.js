let shareImageButton = document.querySelector('#share-image-button');
let createPostArea = document.querySelector('#create-post');
let closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
let sharedMomentsArea = document.querySelector('#shared-moments');

if(!window.Promise) {
  window.Promise = Promise;
}


// We want to install the app install banner prompt which we prevented in app.js at this point
function openCreatePostModal() {
  createPostArea.style.display = 'block';
  
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
    //      to install the banner.  They can enable banner manually if they canceled installation
    promptDeferment = null;
  }
  
  // For testing purposes, unregister the Service Worker when plus is clicked
  // In Applications/Service Worker tab, as soon as plus button is clicked
  //     it will show that the Service Worker has been deleted
  if('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => {
        for(let i = 0; i <registrations.length; i++) {
          registrations[i].unregister();
        }
      })
  }
  
  
  
}


function closeCreatePostModal() {
  createPostArea.style.display = 'none';
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
/*
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
}*/

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



// Creates the cards
function createCard() {
  let cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  
  let cardImage = document.createElement('div');
  cardImage.className = 'mdl-card__title';
  cardImage.style.backgroundImage = 'url("/src/images/breeGrams1.jpeg")';
  cardImage.style.backgroundSize = 'cover';
  cardImage.style.height = '180px';
  
  cardWrapper.appendChild(cardImage);
  
  let cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = 'Bronx Trip';
  cardTitleTextElement.style.color = "#F7F3EE";
  cardTitleTextElement.style.fontFamily = "'Indie Flower', cursive";
  cardTitleTextElement.style.fontWeight = '700';
  cardTitleTextElement.style.textShadow = '2px 2px #20262A';
  
  cardImage.appendChild(cardTitleTextElement);
  
  let cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = 'Bronx, NY';
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
let networkDataReceived = false;


// Creates the card via a pseudo get request
// Getting the card from the Network
// If this pseudo get request fails, then createCard() does not happen here
// This kicks off our Cache, then Network Strategy and
//   must be loaded first.  Ensure this in SW fetch event.
/*fetch(url)
  .then(response => {
    return response.json();
  })
  .then(data => {
    networkDataReceived = true;
    console.log('From Web', data);
    clearCards();
    createCard();
});*/


// Theoretically, you can't store this post request in the cache with this code
// It is storing the Response of the Post Request in the Dynamic Cache
// It is not storing the Post request itself, just what we got back (response)
// So, it does not work for offline-first
// But, it is still able to render the card because we find the matching url in the cache
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



// Getting the card from the Cache
// For Cache first and Network with Dynamic Caching
if('caches' in window) {
  caches.match(url)
        .then(response => {
          if(response) {
            return response.json();
          }
        })
        .then(data => {
          // Only create the card if networkDataReceived is false
          if(!networkDataReceived) {
            console.log('[feed.js] From Cache', data);
            clearCards();
            createCard();
          }
        });
}
