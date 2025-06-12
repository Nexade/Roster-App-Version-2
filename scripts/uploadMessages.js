import { getFirestore, collection, addDoc } from "firebase/firestore";
import {db} from "../src/firebase.js"


// Sample JavaScript objects to upload
const sampleData = [
    {
      name: "Team Group Chat",
      participants: [
        "example@gmail.com",
        "xaeden.turner@gmail.com",
        "nexade100@gmail.com"
      ],
      messages: [
        {
          string: "Hey team, has anyone finished the report?",
          date: new Date("2025-05-14T09:15:00"),
          senderID: "xaeden.turner@gmail.com"
        },
        {
          string: "Almost done, I'll share it shortly.",
          date: new Date("2025-05-14T09:17:30"),
          senderID: "example@gmail.com"
        },
        {
          string: "Great, thanks!",
          date: new Date("2025-05-14T09:18:45"),
          senderID: "xaeden.turner@gmail.com"
        }
      ]
    },
    {
      name: "",
      participants: [
        "example@gmail.com",
        "xaeden.turner@gmail.com"
      ],
      messages: [
        {
          string: "Lunch today?",
          date: new Date("2025-05-15T12:03:00"),
          senderID: "example@gmail.com"
        },
        {
          string: "Sure, meet you in the break room at 12:30.",
          date: new Date("2025-05-15T12:04:10"),
          senderID: "xaeden.turner@gmail.com"
        }
      ]
    }
  ];

// Function to upload data to Firestore
async function uploadData() {
  try {
    // Reference to the collection (it will be created if it doesn't exist)
    const collectionRef = collection(db, "chats");
    
    // Add each document to the collection
    for (const data of sampleData) {
      const docRef = await addDoc(collectionRef, data);
      console.log("Document written with ID: ", docRef.id);
    }
    
    console.log("All data uploaded successfully!");
  } catch (error) {
    console.error("Error adding documents: ", error);
  }
}

// Call the function to upload data
uploadData();