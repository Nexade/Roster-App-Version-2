import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync(new URL('../serviceAccountKey.json', import.meta.url))
);

initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();

const setAdminRole = async (email) => {
  try {
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Successfully made ${email} an Admin.`);
  } catch (error) {
    console.error('❌ Error setting admin role:', error);
  }
};


  // Change this to the email you want to make an admin
  const userEmail = 'xaeden.turner@gmail.com';
  
  setAdminRole(userEmail);
  