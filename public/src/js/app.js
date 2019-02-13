let promptDeferment;
let enableNotificationsButtons = document.querySelectorAll('.enable-notifications ');

if(!window.Promise) {
  window.Promise = Promise;
}

if('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js', {scope: '/'})
    .then(() => {
      console.log('Service worker registered!');
    })
    .catch(error => {
      console.log('The Service Worker Registration failed', error);
    })
}


// Save install banner to show at a later time
// i.e.  Chrome listens for beforeinstallprompt
// Listen for beforeinstallprompt on the browser window object is triggered by Chrome right
//       before it is about to installl banner

// 'beforeinstallprompt' is triggered
window.addEventListener('beforeinstallprompt', event => {
  // The event is the install banner event
  console.log('beforeinstallprompt fired');
  event.preventDefault();  // Now Chrome will not show the banner
  promptDeferment = event;
  
  // Do not do anything upon this event (return false;) because we want to
  //    do something once the user clicks the plus icon (code in feed.js)
  return false;
  
});

