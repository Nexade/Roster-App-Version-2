import { PushNotifications } from '@capacitor/push-notifications';
import { doc, setDoc } from 'firebase/firestore';
import {db} from '../firebase.js';

export const usePushNotifications = (userId) => {
  // Request permission
  console.log("Push notifications component activated");
  PushNotifications.requestPermissions().then(result => {
    if (result.receive === 'granted') {
      // Register with FCM/APNs
      console.log("Push notifications registered");
      PushNotifications.register();
    }
  });

  // On success: save the token to Firestore
  PushNotifications.addListener('registration', token => {
    console.log('Push registration success, token:', token.value);
    const tokenRef = doc(db, 'employees', userId);
    setDoc(tokenRef, { fcmToken: token.value }, { merge: true });
  });

  // On error
  PushNotifications.addListener('registrationError', err => {
    console.error('Push registration error:', err);
  });

  // On receiving push notification
  PushNotifications.addListener('pushNotificationReceived', notification => {
    console.log('Push received:', notification);
    // Optionally show local notification
  });

  // On tapping notification
  PushNotifications.addListener('pushNotificationActionPerformed', action => {
    console.log('Push action performed:', action.notification);
    // Navigate or handle action
  });
};

