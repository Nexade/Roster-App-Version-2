const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {initializeApp} = require("firebase-admin/app");
const {getMessaging} = require("firebase-admin/messaging");
const {getFirestore} = require("firebase-admin/firestore");

const app = initializeApp();
const db = getFirestore(app);

exports.sendAnnouncementNotification = onDocumentCreated("announcements/{id}", async (event) => {
    const announcement = event.data?.data();
    if (!announcement) return;
  
    const message = announcement.announcement;
  
    // Get all employees with FCM tokens
    const snapshot = await db.collection("employees").get();
  
    const tokens = [];
    snapshot.forEach(doc => {
      const token = doc.data().fcmToken;
      if (token) tokens.push(token);
    });
  
    if (tokens.length === 0) return;
  
    await getMessaging().sendEach(
      tokens.map(token => ({
        token,
        notification: {
          title: "New Announcement",
          body: message,
        },
      }))
    );
});
  

