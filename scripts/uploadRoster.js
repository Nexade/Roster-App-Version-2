import admin from 'firebase-admin';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Set up `__dirname` in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account
const serviceAccount = JSON.parse(
  fs.readFileSync(`${__dirname}/../serviceAccountKey.json`, 'utf8')
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Read roster data
const rosterData = JSON.parse(fs.readFileSync(`${__dirname}/../roster.json`, 'utf8'));
console.log('🛠️ Uploading the following data:', rosterData);

const uploadRoster = async () => {
  const batch = db.batch();

  for (const [docId, docData] of Object.entries(rosterData)) {
    console.log(`➡️ Uploading ${docId}`);
    const formattedShifts = docData.shifts.map(shift => ({
      ...shift,
      start: new Date(shift.start),
      end: new Date(shift.end)
    }));

    const docRef = db.collection('rosters').doc(docId);
    batch.set(docRef, { shifts: formattedShifts });
  }

  await batch.commit();
  console.log('✅ Roster uploaded successfully!');
};

uploadRoster().catch(console.error);