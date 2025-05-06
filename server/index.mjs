import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

app.post('/createEmployee', async (req, res) => {
    const { email, name, password } = req.body;
  
    if (!email || !name || !password) {
      return res.status(400).send({ message: 'Missing required fields' });
    }
  
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      });
  
      res.status(201).send({ 
        message: 'Employee created', 
        uid: userRecord.uid 
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Error creating employee', error });
    }
  });
  

app.delete('/deleteEmployee/:uid', async (req, res) => {
  const { uid } = req.params;

  try {
    await admin.auth().deleteUser(uid);
    await db.collection('employees').doc(uid).delete();

    res.send({ message: 'Employee deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error deleting employee', error });
  }
});

app.post('/updatePassword', async (req, res) => {
    const { email, newPassword } = req.body;
  
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(userRecord.uid, { password: newPassword });
  
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  });
  

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
