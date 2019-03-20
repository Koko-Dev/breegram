let promptDeferment;
let enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

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
            icon: '/src/images/icons2/icon1-96x96.png',
            image: '/src/images/waterbird-sm.jpg',
            dir: 'ltr',
            lang: 'en-US',
            vibrate: [100, 50, 200],
            badge: '/src/images/icons2/icon1-96x96.png',
            tag: 'confirm-notification',
            renotify: true,
            actions: [
                {
                    action: 'confirm',
                    title: 'Okay',
                    icon: '/src/images/icons2/icon1-96x96.png'
                },
                {
                    action: 'cancel',
                    title: 'Cancel',
                    icon: '/src/images/icons2/icon1-96x96.png'
                }
            ]
        };

        navigator.serviceWorker.ready
            .then(serviceWorkerRegistration => {
                serviceWorkerRegistration.showNotification('You have successfully subscribed!', options);
            })

    }
}

function configPushSubscription() {
//  First ask if I do not have access to the Service Worker
    if (!('serviceWorker' in navigator)) {
        return;
    }

    /*
        Access the Service Worker from here and then access
          the pushManager to check for an existing subscription
     */

    // Will store the Service Worker Registration for later use
    let registration;

    // Use serviceWorker.ready to ensure that you can subscribe for push
    navigator.serviceWorker.ready.then(
        function(serviceWorkerRegistration) {
            var options = {
                userVisibleOnly: true

            };
            serviceWorkerRegistration.pushManager.subscribe(options).then(
                function(pushSubscription) {
                    console.log(pushSubscription.endpoint);
                    // The push subscription details needed by the application
                    // server are now available, and can be sent to it using,
                    // for example, an XMLHttpRequest.
                }, function(error) {
                    // During development it often helps to log errors to the
                    // console. In a production environment it might make sense to
                    // also report information about errors back to the
                    // application server.
                    console.log('Error at app.js for push notification', error);
                }
            );
        });


   /* navigator.serviceWorker.ready
        .then(swregistration => {
            // Store the Service Worker Registration for later use
            registration = swregistration;
            /!*
                Check for any existing subscription
                getSubscription returns a promise which will resolve
                with any subscriptions fetched and null otherwise
                The pushManager will only check for subscriptions
                for this browser on this device
            *!/
            return swregistration.pushManager.getSubscription();
        })
        .then(subscriptions => {
            /!*
                A subscription contains the URL endpoint of the
                browser vendor server to which we push our push messages.
                Anyone with this endpoint URL can send messages to that
                server and this server will forward them to the app.
                A hacking nightmare.
                Protect by passing a configuration
                to subscribe() with a JavaScript Object.
                Null if there are no subscriptions on this browser
                for this device (the service worker is also
                registered in this browser for this device)
                Each browser/device combination yields one
                subscription
                If subscriptions is null, create a new subscription.
                If subscriptions is not null then we have existing
                subscriptions.
            *!/
            if (subscriptions === null) {
                /!*
                    Create a new subscription by accessing the pushManager
                    If there were a previous subscription, it would replace it.
                    Protection:
                        --Pass JS Object, setting userVisibility to true.
                          This ensures that messages can only come from our
                          backend server and that, should someone attain our
                          endpoint URL, they would not be able to push messages
                          to the API endpoint by the browser vendor server.
                          So, the security mechanism is that I will identify my
                          backend server as the only valid source sending push
                          notifications to the users
                *!/

                registration.pushManager.subscribe({
                    userVisibleOnly: true
                });


            } else {
                /!* We have a subscription.
                   We can send it to the Service Worker here for an update
                   or ignore it because we already have it stored on the
                   backend server
                *!/

            }
        })
        .catch(error => {
            console.log("An error, maybe no subscription =>", error);
        })
*/

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

            /*  Call configPushSubscription() function here instead of
                  the displayConfirmationNotification() function after I ask for
                  permission because I know now that I can send Notifications, so
                  I now want to setup the Push subscription
              *   */
            // displayConfirmationNotification();
            configPushSubscription();
        }
    });

}

/*
   -- Enable Notification Button display if the client window supports Notifications
        and trigger the Permission request
*/

if('Notification' in window && 'serviceWorker' in navigator) {
    // Loop through the Notification buttons
    for(let i = 0; i < enableNotificationsButtons.length;i++){
        enableNotificationsButtons[i].style.display = "inline-block";
        enableNotificationsButtons[i].addEventListener('click', askForNotificationPermission);
    }

}

