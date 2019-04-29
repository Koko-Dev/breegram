let shareImageButton = document.querySelector('#share-image-button');
let createPostArea = document.querySelector('#create-post');
let closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
let sharedMomentsArea = document.querySelector('#shared-moments');
let closeTheFab = document.querySelector('#close-create-post-modal-btn');
let form = document.querySelector('form');
let titleInput = document.querySelector('#title');
let locationInput = document.querySelector('#location');

/* Access the #create-post video, canvas, and
     capture button to be able to take an image for a post */
let videoPlayer = document.querySelector('#player');
let canvasElement = document.querySelector('#canvas');
let captureButton = document.querySelector('#capture-btn');

/*
  Access the image file input tag which uploads image file
*/
let imagePicker = document.querySelector('#image-picker');

/*  Access to the #pick-image div to be able to hide the
     ability to upload an image when the user's device
     has access to a camera and when the Browser supports
     using a camera. */
let uploadImage = document.querySelector('#pick-image');
let picture;

/*  Variables for Geolocation */
const locationButton = document.querySelector('#location-btn');
const locationLoader = document.querySelector('#location-loader');
let fetchedLocation = {lat: 0, lng: 0};


// Selecting the wrapping div for location, not the input element
// This is used for 'is-focused'
let locationInputDiv = document.querySelector('#manual-location');



/*  Add an event listener on the locaction button to get
*     User Location */
locationButton.addEventListener('click', event => {
  // Geolocation should be available at this point, but will check again
  if (!('geolocation' in navigator)){
    // We do not have geolocation capabilities
    return;
  }
   // Track whether alert that geolocation failed was displayed
  let alertDisplayed = false;

  // Show the spinner
  locationButton.style.display = 'none';
  locationLoader.style.display = 'block';

  // Get the User's current position
  // Prompts user for permission
  navigator.geolocation.getCurrentPosition(function (position) {
    // Success!
    // We have a position. Re-enable the Location button,
    //   and hide the loader/spinner
    locationButton.style.display = 'inline';
    locationLoader.style.display = 'none';
    /*fetchedLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }*/



    fetchedLocation ={
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    // Parsed address
    locationInput.value = "In Virginia";

    // Required by third party library
    //   to make it look correct once we manually set value
    locationInputDiv.classList.add('is-focused');


  }, function (err) {
    console.log(err);
    // Error, show location button and hide the spinner
    //  So that the user can either try again or enter manually
    locationButton.style.display = 'inline';
    locationLoader.style.display = 'none';

    // Since Geolocation failed, if alert was not displayed already, display it and
    //   set alertDisplayed to true
    if (!alertDisplayed) {
      alertDisplayed = true;
      alert('Epic fail!  We could not fetch your location, please enter manually!');
    }

    fetchedLocation = {lat: 0, lng: 0};
  }, {
    timeout: 7000
  })



});

function initializeLocation () {
  if (!('geolocation' in navigator)){
    // We do not have geolocation capabilities
    // Hide the Location Button
    locationButton.style.display = 'none';
    // locationLoader.style.display = 'none';
  } else {
    console.log('[from initialLocation() function] Initializing Location');
  }
}



if(!window.Promise) {
  window.Promise = Promise;
}

/*  Initialize Media -- Initializes the Camera or the Image Picker
*   according to the features supported by the device.
*    -- By the end of the second if statement, we can always call
*    mediaDevices.getUserMedia because it will either return a
*    Promise which rejects and give us an Error or a
*    Promise which will access the user media and give us a result
*    which is in line to modern syntax. */
function initializeMedia() {
  /*Check to see if we have media devices in the navigator
    --  'mediaDevices' API is an interface which gives us access
    to the device camera or microphone  (video or audio, respectively)
    -- video includes images
  */
  if (!('mediaDevices' in navigator)) {
    // No mediaDevices interface in the navigator,
    //   so we create a polyfill to extend support a bit

    // At this point there does not exist mediaDevices, so
    //   I will create it.  It's just JavaScript, right?
    navigator.mediaDevices = {};
  }

  // Now, this will never fail because even if mediaDevices
  //   does not exist in the old browsers, I just created it above
  // I do this to take advantage of some older camera implementations
  // Note: We only do this if we are on a browser which doesn't have
  //      a modern and valid implementation of media devices.
  if (!('getUserMedia' in navigator.mediaDevices)) {
    /*
        --  getUserMedia does not exist.
            - Set the getUserMedia equal to older properties which
                performed the same service
            - I am basically just rebuilding the native getUserMedia function
              modern Browsers have.  We are not recreating the
              mediaDevices interface, we are just bringing some older browsers
              up to date with the new syntax
        -- The constraints argument refers to whether I want to capture
            audio or video
        */
    navigator.mediaDevices.getUserMedia = constraints =>  {
      // Bind older implementations of getUserMedia to modern syntax
      // webkit = Safari, moz = Mozilla
      // Trying to bind older Safari and Mozilla GetUserMedia to current
      let getUserMedia = navigator.webkitGetUserMedia  || navigator.mozGetUserMedia;

      /*
          Now we can check to see if those older Browsers have their own implementation
            of getUserMedia.

          -- https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
          -- "MediaDevices.getUserMedia() method prompts the user for permission to use
          a media input which produces a MediaStream with tracks containing the
          requested types of media.  That stream can include, for example, a video track
          produced by either a hardware or virtual video source such as a camera,
          video recording device, screen sharing service, and so forth), an audio track
          (similarly, produced by a physical or virtual audio source like a microphone,
          A/D converter, or the like), and possibly other track types.
            -- It returns a Promise that resolves to a MediaStream Object.
            -- If the user denies permission, or matching media is not available,
               then the promise is rejected with NotAllowedError or NotFoundError, respectively.
             Note: It's possible for the returned promise to neither resolve nor reject,
                as the user is not required to make a choice at all and may simply
                ignore the request."


          If getUserMedia is still undefined, all hope is lost and we throw an error.
          We will eventually need a fallback.

      */
      //  TODO:  If getUserMedia is undefined, throw Error, but create a fallback later
      if ((!getUserMedia)) {

        /* Return a Promise because we do want to rebuild the getUsermedia behavior since the
           modern getUserMedia returns a Promise, so our own custom implementation
           also has to.  Since we can't get it to work, then this Promise simply
           rejects.*/
        return Promise.reject(new Error('getUserMedia is not implemented'));
      }

      // At this point, we have getUserMedia
      return new Promise((resolve,  reject) => {
        /*
          -- Since we are getting getUserMedia by pointing older browser's implementation
               to the new getUserMedia, we are going to rebuild it a little bit.
               -- We are going to call on the navigator so that inside getUserMedia refers to
                 the navigator, and we pass the constraints, along with resolve and reject,
                 so that whenever we call getUserMedia on media devices, we call that function
                 which in the end returns a Promise which will automatically resolve the result
                 of getUserMedia (which is this custom implementation of either webkit or Mozilla).
*/
        getUserMedia.call(navigator, constraints, resolve,  reject)
      })
    }
  } // At this point we can safely access navigator.mediaDevices.getUserMedia


  /*
    constraints -  "A MediaStreamConstraints object specifying the types
        of media to request, along with any requirements for each type.

        -- The constraints parameter is a MediaStreamConstraints object with
      two members: video and audio, describing the media types requested.
      Either or both must be specified.
        -- If the browser cannot find all media tracks with the specified
        types that meet the constraints given, then the returned promise
        is rejected with NotFoundError.

         constraint = { audio: true, video: true }

        -- If true is specified for a media type, the resulting stream
        is required to have that type of track in it. If one cannot be
        included for any reason, the call to getUserMedia() will result
        in an error.
  */
  // To get access to device camera - returns a Promise with a stream object
  // Will prompt user for permission to use video once
  navigator.mediaDevices.getUserMedia({video: true})
    .then(mediaStreamObject => {
      /*
          -- Get access to the camera by binding the video source object to the stream
          This will automatically play it because video tag is set to autoplay,
          which give a nice experience if you just want to show an ongoing
          image from the device camera.
          -- Video player is now set up
      */
      videoPlayer.srcObject = mediaStreamObject;

      //  Show the video player
      // image picker and video player are hidden by default
      videoPlayer.style.display = 'block';
    })
    .catch(error => {
      // User has denied access or Browser does not have getUserMedia method
      //   even with polyfill above.
      // Or we are on a device that does not have a camera

      // So, we show the image picker instead
      // image picker and video player are hidden by default
      uploadImage.style.display = 'block';

    })
}

/*
*     Link the Capture Button with event listener
*      -- Get the video element stream
*      -- Send it to the canvas, and since the canvas is there
*          to display static content, it will automatically take
*          the latest snapshot and just display that
*      --  Then, we stop the video player and all we get is
*          a canvas element with the latest snapshot,
*      -- And then extract the snapshot from the canvas element
*/
captureButton.addEventListener('click', event => {
  // Capture button has been clicked, so, we set the
  //   canvas and hide the video player and Capture button

  // Show the Canvas Element, which is empty by default
  canvasElement.style.display = 'block';

  /*
      Hide the Video Player

      Note:  Even though we hide it, the stream is still
      going on, So, we can do this first and still get
      access to the currently running stream.
   */
  videoPlayer.style.display = 'none';

  /*
      Set Capture button display to none because we also
      want to disable that once we take a screen shot.
  */
  captureButton.style.display = 'none';

  // Now we get the stream onto the canvas

  // Store the context of the canvas in a variable
  // getContext() is a method where we initialize
  //    how we want to draw on this canvas.
  //    - In this case we just want to draw a '2d' image
  //      (a screen shot or snapshot of my stream)

  let context =  canvasElement.getContext('2d');

  //  Use this 2d canvas context to draw an image, since it is
  //    two-dimensional
  //  Using videoPlayer as the Image Element is first argument we give the stream.
  //  Then we have to define the boundaries (the dimensions of the canvas).
  //  Start at the top left corner (0, 0) and expand to bottom right
  //  Next param will be the Width -- Use the default canvas width, which we set up in CSS,
  //    where we actually limit to the maximum  (max-width: 100%;)
  //    because we have to contain the image inside the screen
  //  Then calculate the Height -- canvas.height, which should fit the video aspect ratio
  //     videoPlayer.videoHeight / ( videoPlayer.videoWidth / canvas.width )
  //     -- Because the canvas width is set, and by dividing the video player width
  //        by the canvas width, we get the portion of the original source that I can use.
  //       - And then I can apply this to the video player video height by simply dividing it through that.
  //          This ensures I keep the aspect ratio
  context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));

  // Now stop streaming the video because otherwise it keeps on going even though we've closed it.
  //   to save resources and not scare the users.
  // We stop the video by accessing the video player.
  //   And on that video player, we can now access the source object
  // (Line 156) -- videoPlayer.srcObject = mediaStreamObject --
  //   That is where we added our stream and now you could think we just set it to null.
  //      But we are not going to do that.  We will loop through getVideoTracks(),
  //      which gives an array of tracks, and then stop each one individually.
  //  The getVideoTracks() method of the MediaStream interface returns a sequence  (Array)
  //    of MediaStreamTrack objects representing the video tracks in this stream.

  // Stop the Video
  //  Loop through the Video Tracks and stop each video stream
  videoPlayer.srcObject.getVideoTracks().forEach(track => {
    track.stop();
  });

  /*
    The image is now a base64Url and technically we could upload
    that and store it in the database, but storing such large strings
    isn't the way to go with a database.  We want to store files on
    a file server, our own server, or, since we are using Firebase at
    this point, we want to store it in Firebase storage.

    Note:  Firebase uses an ArrayBuffer now, but will keep notes below just in case
            I would like to reimplement.  Switched to using npm busboy on the backend.

    TODO: DELETE NOTES BELOW WHEN WE VERIFY THAT APP FUNCTION
    So, we will convert the canvas base64Url to a blob, so to a file.

    The HTMLCanvasElement.toDataURL() method returns a data URI containing a representation of the image in the format specified by the type parameter (defaults to PNG). The returned image is in a resolution of 96 dpi.

    If the height or width of the canvas is 0, the string "data:," is returned.
    If the requested type is not image/png, but the returned value starts with data:image/png, then the requested type is not supported.
    Chrome also supports the image/webp type.

    The function dataURItoBlob takes, as a parameter,
        canvasElement.toDataURL()
      and converts it into this data URI (the representation of the image
      in specified format and Returns the blob.

    A Blob object represents a file-like object of immutable, raw data.
  */
  picture = dataURItoBlob(canvasElement.toDataURL());

});


// The 'change' event is fired whenever a User changes a file, picks a new image
// imagePicker is the input element itself
imagePicker.addEventListener('change', event => {
  // event.target.files is a list of files  == an Array
  //  Our picker will only accept One, so we will use the first element in this Array -[0]
  // This gives us access to whatever the User picked
  picture = event.target.files[0]
});








// We want to install the app install banner prompt which we prevented in app.js at this point
function openCreatePostModal() {

  // Wrap animation in a 1ms delay to avoid intermittent
  //  clunkiness on open post modal
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(0)';
  }, 1);

  // Initialize Camera in as many devices as possible
  // We want to open it after the User clicks on the modal
  initializeMedia();

  //  Initialize GeoLocation
  initializeLocation();


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
  // createPostArea.style.transform = 'translateY(100vh)';
  // createPostArea.style.display = 'none';

  // Modal closed. Hide the video player, image picker, and canvas.
  videoPlayer.style.display = 'none';
  uploadImage.style.display = 'none';
  canvasElement.style.display = 'none';

  // Show the location button, if hidden
  locationButton.style.display = 'inline';

  // Hide location loader, in case it was showing before
  locationLoader.style.display = 'none';

  /*
  *   Use case:  At this point, when we close this modal, t
  *   he camera starts sending.  We don't want this kept on
  *   because it costs resources and is not a good User Experience.
  *
  *   So, we want to stop the camera stream when modal is closed.
  *
  *   The videoPlayer source object is set if we set a stream to it.
  *   Check to see if we have the video player source object set.
  *   If so, we want to get all of the video tracks and stop them
  *   manually.
  *   */


  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach(track => {
      track.stop();
    })
  }

  // The animation is a bit clunky because closing videoPlayer tracks
  //    takes a lot of resources, so we put the animation on a delay
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(100vh)';

  }, 1);
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
*
*   UPDATE:  Remove body value and replace with postData (FormData object)
*/
function sendData (){
  let id = new Date().toISOString();

  // Using formData interface, append data properties
  //  This is used in place of the POST body value
  let postData =  new FormData();
  postData.append('id', id);
  postData.append('title', titleInput.value);
  postData.append('location', locationInput.value);
  postData.append('rawLocationLat', fetchedLocation.lat);
  postData.append('rawLocationLng', fetchedLocation.lng);
  postData.append('file', picture, id + '.png');

  fetch('https://us-central1-breegram-instagram.cloudfunctions.net/storePostData', {
    method: 'POST',
    body: postData
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
       .ready is a read-only property of the SW interface which provides
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
             -- title value,
             -- location value,
             -- rawLocation value

             UPDATE:  This is going to indexedDB, so we will add picture
             UPDATE 2:  Add fetchedLocation (location coordinates)
       */
        let post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value,
          picture: picture,
          rawLocation: fetchedLocation
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



