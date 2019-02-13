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


/* Confirm that Permission to receive Notifications was granted */
function displayConfirmationNotification() {
  
  /*
   Pass a title for this notification
   This will show a Real System Notification, not like a JS alert
   (I have since used the Service Worker Registration to push a notification)
   */
  // new Notification('Successfully subscribed!', options);
  
  if('serviceWorker' in navigator) {
    const options = {
      body: 'You are a Rock Star!',
      icon: '/src/images/icons2/icon1-96x96.png'
    };
    
    navigator.serviceWorker.ready
      .then(serviceWorkerRegistration => {
        serviceWorkerRegistration.showNotification('(From SW) You have successfully subscribed!', options);
      })
    
  }
}



/*
 -- Request Permission to send a Notification to the User
 
 -- Theoretically, if we want to display a notification, the browser will automatically
 prompt the user, but it is better to do it ourselves so that we can control the response
 and when we ask for it.  In this case, we are asking for Permission when the User actively
 clicks on a Enable Notifications button (so the chance of their agreeing to give us this
 permission is pretty high.
 */
function askForNotificationPermission() {
  /*
   requestPermission will prompt the user to ask to give permission for notifications
   The user has already clicked on a 'Enable Notifications button'
   Note:  if you ask for Notification permissions, you implicitly get Push Notification
   permissions
   -- If User denies permission, we cannot ask again
   -- If User is undecided and just closes the tab, then they will be asked again next time
   */
  Notification.requestPermission(resultOfUserChoice => {
    // console.log('User choice to receive Notifications: ', resultOfUserChoice);
    if(resultOfUserChoice !== 'granted'){
      console.log('No notification permission granted => ', resultOfUserChoice);
    } else {
      // Permission received and we can hide the button now
      // For testing purposes, I will not do this yet
      // At this point, we are receiving the 'granted' status
      //   but for some reason, Chrome did not deploy the
      //   popup asking to allow for notifications
      console.log('Permission received => ', resultOfUserChoice);
      displayConfirmationNotification();
    }
  });

}

 /*
    -- Enable Notification Button display if the client window supports Notifications
         and trigger the Permission request
 */

if('Notification' in window) {
  // Loop through the Notification buttons
  for(let i = 0; i < enableNotificationsButtons.length;i++){
    enableNotificationsButtons[i].style.display = "inline-block";
    enableNotificationsButtons[i].addEventListener('click', askForNotificationPermission);
  }

}

