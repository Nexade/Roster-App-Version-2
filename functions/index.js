const {onDocumentCreated, onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {initializeApp} = require("firebase-admin/app");
const {getMessaging} = require("firebase-admin/messaging");
const {getFirestore, Timestamp} = require("firebase-admin/firestore");
const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');
const { onSchedule } = require('firebase-functions/v2/scheduler');



const app = initializeApp();
const db = getFirestore(app);
const messaging = getMessaging();


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

exports.notifyRosterChange = onDocumentUpdated('rosters/{id}', async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
  
    const beforeShifts = beforeData?.shifts || [];
    const afterShifts = afterData?.shifts || [];
  
    const now = Timestamp.now();
    const oneWeekLater = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  
    const filterShifts = (shifts) =>
      shifts.filter((s) => s.start >= now && s.start <= oneWeekLater);
  
    const recentBefore = filterShifts(beforeShifts);
    const recentAfter = filterShifts(afterShifts);
  
    const stringify = (s) => JSON.stringify(s);
    const beforeMap = new Map(recentBefore.map((s) => [s.id + s.employeeId, stringify(s)]));
    const afterMap = new Map(recentAfter.map((s) => [s.id + s.employeeId, stringify(s)]));
  
    const affectedEmails = new Set();
  
    for (const [key, afterVal] of afterMap.entries()) {
      const beforeVal = beforeMap.get(key);
      if (beforeVal !== afterVal) {
        const parsed = JSON.parse(afterVal);
        affectedEmails.add(parsed.employeeId);
      }
    }
  
    for (const [key, beforeVal] of beforeMap.entries()) {
      if (!afterMap.has(key)) {
        const parsed = JSON.parse(beforeVal);
        affectedEmails.add(parsed.employeeId);
      }
    }
  
    if (affectedEmails.size === 0) {
      console.log('No changes to notify.');
      return;
    }
  
    const tokens = [];
  
    for (const email of affectedEmails) {
      const employeeSnap = await db.collection('employees')
        .where('email', '==', email)
        .limit(1)
        .get();
  
      if (!employeeSnap.empty) {
        const employee = employeeSnap.docs[0].data();
        if (employee.fcmToken) {
          tokens.push(employee.fcmToken);
        }
      }
    }
  
    if (tokens.length === 0) {
      console.log('No FCM tokens found.');
      return;
    }
  
    // AUTH: get access token for HTTP v1 API
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  
    const accessToken = await auth.getAccessToken();
    const projectId = process.env.GCLOUD_PROJECT;
  
    const messagePayload = {
      message: {
        notification: {
          title: 'Roster Updated',
          body: 'Your roster for the next week has changed. Please check the app.',
        }, 
        android: {
            priority: 'high',
            notification: {
              sound: 'default',
              defaultSound: true,
              defaultVibrateTimings: true,
              defaultLightSettings: true,
            },
        },
      },
    };
  
    // Send to each token (no batch option in HTTP v1 for client-side tokens)
    for (const token of tokens) {
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...messagePayload,
            message: {
              ...messagePayload.message,
              token,
            },
          }),
        }
      );
  
      if (!res.ok) {
        const error = await res.text();
        console.error(`Error sending to ${token}:`, error);
      } else {
        console.log(`Sent roster update to ${token}`);
      }
    }
  });

  //

  exports.sendShiftReminder = onSchedule('every 30 minutes', async (event) => {
    const now = new Date(new Date().getTime() + 10 * 60 * 60 * 1000); //Adjusts for current timezone
    console.log(`Current time: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, current date: ${now.toISOString().split('T')[0]}`);
    const windowStart = new Date(now.getTime() + 55 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 95 * 60 * 1000);

    console.log(`Scanning for time between '${windowStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}' and '${windowEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}'`);
  
    const rosterSnaps = await db.collection('rosters').get();
  
    const shiftsToNotify = [];

    const todayId = now.toISOString().split('T')[0]; // e.g., "2025-06-02"

    const todayRosterDoc = rosterSnaps.docs.find(doc => doc.id === todayId);

    if (!todayRosterDoc) {
    console.log(`No roster found for today (${todayId})`);
    return;
    }
  
      const shifts = todayRosterDoc.data().shifts || [];

      console.log(`There are ${shifts.length}, shifts today`);
  
      for (const shift of shifts) {
        const shiftStart = new Date(shift.start.toDate().getTime() + 10 * 60 * 60 * 1000);
        console.log(`Scanning shift for ${shift.name}: '${shiftStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}'`);

        const shiftIsSoon =
          shiftStart >= windowStart &&
          shiftStart <= windowEnd //&&!shift.notifiedBeforeShift;

  
        if (shiftIsSoon) {
          shiftsToNotify.push({
            ...shift,
            rosterId: todayRosterDoc.id,
          });
        }
      }
  
    if (shiftsToNotify.length === 0) {
      console.log('No upcoming shifts in the next hour.');
      return;
    }
  
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  
    const accessToken = await auth.getAccessToken();
    const projectId = process.env.GCLOUD_PROJECT;
  
    for (const shift of shiftsToNotify) {
      const employeeSnap = await db.collection('employees')
        .where('email', '==', shift.employeeId)
        .limit(1)
        .get();
  
      if (employeeSnap.empty) continue;
  
      const employee = employeeSnap.docs[0].data();
      const token = employee.fcmToken;
  
      if (!token) continue;
  
      const message = {
        message: {
          token,
          notification: {
            title: 'Upcoming Shift',
            body: `You have a shift starting at ${new Date(shift.start.toDate().getTime() + 10 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          },
        }
      };
  
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
  
      if (!res.ok) {
        console.error(`Failed to notify ${shift.employeeId}`, await res.text());
      } else {
        console.log(`Notified ${shift.employeeId} about upcoming shift`);
  
        // Optional: Update the shift to mark it as notified
        const rosterRef = db.collection('rosters').doc(shift.rosterId);
        const rosterData = (await rosterRef.get()).data();
  
        const updatedShifts = rosterData.shifts.map((s) => {
          if (
            s.id === shift.id &&
            s.employeeId === shift.employeeId &&
            s.start.toDate().getTime() === shift.start.toDate().getTime()
          ) {
            return { ...s, notifiedBeforeShift: true };
          }
          return s;
        });
  
        await rosterRef.update({ shifts: updatedShifts });
      }
    }
  });



  exports.notifyNewMessage = onDocumentUpdated('chats/{chatId}', async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
  
    const beforeMessages = before?.messages || [];
    const afterMessages = after?.messages || [];
  
    // Identify new messages added to the array
    const newMessages = afterMessages.slice(beforeMessages.length);
  
    if (newMessages.length === 0) {
      console.log('No new messages found.');
      return;
    }
  
    const chatName = after.name?.trim();
    const participants = after.participants || [];
  
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  
    const accessToken = await auth.getAccessToken();
    const projectId = process.env.GCLOUD_PROJECT;
  
    for (const msg of newMessages) {
      const { senderID, string: messageText } = msg;
  
      // Lookup sender's display name (assuming employee profile holds it)
      let senderName = senderID;
      const senderSnap = await db.collection('employees')
        .where('email', '==', senderID)
        .limit(1)
        .get();
  
      if (!senderSnap.empty) {
        const senderData = senderSnap.docs[0].data();
        senderName = senderData.name || senderID;
      }
  
      const notificationTitle = chatName
        ? `${chatName} – ${senderName}`
        : senderName;
  
      const body = messageText;
  
      for (const email of participants) {
        if (email === senderID) continue;
  
        const userSnap = await db.collection('employees')
          .where('email', '==', email)
          .limit(1)
          .get();
  
        if (userSnap.empty) continue;
  
        const user = userSnap.docs[0].data();
        const token = user.fcmToken;
  
        if (!token) continue;
  
        const message = {
          message: {
            token,
            notification: {
              title: notificationTitle,
              body,
            },
          },
        };
  
        const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });
  
        if (!res.ok) {
          console.error(`Failed to notify ${email}:`, await res.text());
        } else {
          console.log(`Notification sent to ${email} (${token}) for new message from ${senderName}`);
        }
      }
    }
  });
  
  
  

  

