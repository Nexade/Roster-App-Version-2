import { db, auth } from '../firebase.js'; // Your Firebase configuration
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  arrayUnion, onSnapshot
} from 'firebase/firestore';

export const retrieveMessages = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const userEmail = user.email;
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', userEmail));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        participants: data.participants || [],
        messages: (data.messages || []).map(message => ({
          ...message,
          date: message.date?.toDate() || new Date(0), // Handle missing dates
        }))
      };
    });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    throw error;
  }
};

export const listenToChat = (chatId, callback) => {
  const chatRef = doc(db, 'chats', chatId);
  const unsubscribe = onSnapshot(chatRef, (doc) => {
    const messages = doc.data()?.messages || [];
    callback(messages.map(message => ({
      ...message,
      date: message.date?.toDate() || new Date(0),
    })));
  });
  return unsubscribe; // Let the caller handle cleanup
};



export const sendMessage = async (chatID, messageString, userID) => {
  try {
    const chatRef = doc(db, 'chats', chatID);
    const newMessage = {
      string: messageString,
      senderID: userID,
      date: new Date(),
    };

    await updateDoc(chatRef, {
      messages: arrayUnion(newMessage)
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};