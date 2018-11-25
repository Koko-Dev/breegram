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
    })
    
    // Set promptDeferment equal to null because you only have one shot to prompt the user
    //      to install the banner.  They can enable banner manually if they canceled installation
    promptDeferment = null;
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
closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

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
  cardWrapper.appendChild(cardSupportingText);
  
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

fetch('https://httpbin.org/get')
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    createCard();
  });
