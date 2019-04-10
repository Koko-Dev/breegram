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
                    icon: '/src/images/icons2/icon1-96x96-2.png'
                },
                {
                    action: 'cancel',
                    title: 'Cancel',
                    icon: '/src/images/icons2/icon1-96x96-2.png'
                }
            ]
        };

        navigator.serviceWorker.ready
            .then(serviceWorkerRegistration => {
                serviceWorkerRegistration.showNotification('Successfully subscribed!', options);
            })
    }
}




function configPushSubscription() {
//  First ask if I do not have access to the Service Worker
//  This is handled when we decide to display,  or choose to not display
//   the enable notification button, so technically it will never get here,
//   but, I will put it here for a reminder that push subscriptions
//   are handled through the Service Worker
//      (i.e. No Service Worker == No Push Notifications)
    if (!('serviceWorker' in navigator)) {
        return;
    }

    /*
        Access the Service Worker from here and then access
          the pushManager to check for an existing subscription
        (Subscriptions are managed by the Service Worker)
     */

    // Will store the Service Worker Registration for later use
    let registration;

    // Use serviceWorker.ready to ensure that you can subscribe for push
    //   notifications
   /* navigator.serviceWorker.ready.then(
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
        });*/

    navigator.serviceWorker.ready
        .then(swregistration => {
            // Store the Service Worker Registration for later use
            registration = swregistration;
            /*
                Check for any existing subscription
                getSubscription returns a promise which will resolve
                with any subscriptions fetched and null otherwise
                The pushManager will only check for subscriptions
                for this browser on this device
            */
            return swregistration.pushManager.getSubscription();
        })
        .then(subscription => {
            /*
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
                If subscriptions is not null then we have an existing
                subscription.
            */
            if (subscription === null) {
                /*
                    Create a new subscription by accessing the pushManager
                    If there were a previous subscription, it would replace it.
                    Protection:
                        --Pass JS Object, setting userVisibility to true.
                            This means that push notifications that we send
                            are only visible to this user.
                          This ensures that messages can only come from our
                          backend server and that, should someone attain our
                          endpoint URL, they would not be able to push messages
                          to the API endpoint by the browser vendor server.

                          The security mechanism is that I will identify my
                          backend server as the only valid source sending push
                          notifications to the this particular subscription
                          (i.e. this user, this browser)

                          -- This is still easy to trick, not really secure enough
                          So, to this we add VAPID with WebPush
                          https://blog.mozilla.org/services/2016/04/04/using-vapid-with-webpush/
                */

                /*
                    In variable vapidPublicKey, store the VAPID public key, a urlBase64 string
                    generated by web-push once per production.  This will be converted to an
                    ArrayBuffer (Uint8Array)
                          -- The Uint8Array typed array represents an array of 8-bit
                             unsigned integers. The contents are initialized to 0.
                             Once established, you can reference  elements in the array
                             using the object's methods, or using standard array
                             index syntax -- that is, using bracket notation.

                     in indexedDB.js as required by the subscribe() API.
                */
                const vapidPublicKey = 'BDd4O-27BZ4O621rThSwI4fXTW5tynhJTB3GUSaIh9CZqxqVBitZrMWnk30qHzUCpd2kWgv19KGC7NOR1D2laY0';

                /*
                *   Store the Converted urlBase64 generated Vapid Public Key into
                *   the required ArrayBuffer via helper function urlBase64ToUint8Array
                *   in indexedDB.js which takes a base64String (vapidPublicKey)
                *   and returns the converted ArrayBuffer required by subscribe()
                *   options object parameter.  This is required by Chrome and Edge.
                *   */
                const convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);

                return registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidPublicKey
                });
                /*
                *   Note:
                *       -- At this point, we are generating a Subscription with a
                *       clear identification of a server who is allowed to
                *       send push messages.
                *
                *       -- This alone does not identify our backend Server.
                        We have to store the Private key on the backend Server so that
                        the Browser window or our backend Server will be able to match
                        the Public Key with its companion Private Key to authenticate
                        our backend Server.  Only then can the User receive push messages.
                */
            } else {
                /* We have a subscription.
                   We can send it to the Service Worker here for an update
                   or ignore it because we already have it stored on the
                   backend server.
                */
            }
        })

        .then(newSubscription => {
            // Pass the New Subscription to the Firebase (backend) Server
            // We want to store the subscription to our RealTime database.
            // So we create a POST request to store the new subscription
            // on Firebase Database.
            // Issue a new POST request to https://breegram-instagram.firebaseio.com/subscriptions  (Database)
            // and the Subscriptions Node will be added automatically.
            // Always add .json when directly targeting the Database interface on Firebase
            return fetch('https://breegram-instagram.firebaseio.com/subscriptions.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(newSubscription)
            })
        })
      .then(serverResponse => {
        if (serverResponse.ok) {
          console.log('Server Response for New Subscription POST request OK');

          // Display Confirmation Notification
          displayConfirmationNotification();
        }
      })
        .catch(error => {
            console.log("Error after Subscription Post Request to Firebase Database", error);
        })
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

     This code is from https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe
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

