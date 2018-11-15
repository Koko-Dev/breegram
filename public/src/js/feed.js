let shareImageButton = document.querySelector('#share-image-button');
let createPostArea = document.querySelector('#create-post');
let closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');


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
