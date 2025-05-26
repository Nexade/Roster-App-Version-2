import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, getDocs, getDoc, setDoc, doc, updateDoc, addDoc, deleteDoc, Timestamp, query, where} from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { retrieveMessages } from './services/messaging';


import Authorisation from './pages/Authorisation';
import Home from './pages/Home';
import Roster from './pages/Roster';
import Messages from './pages/Messages';
import Management from './pages/Management';
import Navbar from './components/Navbar'; 
import Settings from './pages/Settings';
import LoadScreen from './components/LoadScreen';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roster, setRoster] = useState({});
  const [employees, setEmployees] = useState([]);
  const [chats, setChats] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  

  const blankAvailabilityTemplate = [
    { start: 0, end: 1439 },
    { start: 0, end: 1439 },
    { start: 0, end: 1439 },
    { start: 0, end: 1439 },
    { start: 0, end: 1439 },
    { start: 0, end: 1439 },
    { start: 0, end: 1439 }
  ];
  const isNative = Capacitor.isNativePlatform();
  const updateEmployeeAvailability = async (employeeId, newAvailability) => {
    const ref = doc(db, "employees", employeeId);
    await updateDoc(ref, {
      availability: newAvailability,
    });

    setEmployees((prevEmployees) =>
      prevEmployees.map((emp) =>
        emp.id === employeeId ? { ...emp, availability: newAvailability } : emp
      )
    );  
  };
  
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  useEffect(() => {
    console.log("Initializing Firebase Auth and Firestore", auth, db);
    
    // 1. First try to get user immediately (no waiting)
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log("✅ User found immediately:", currentUser.email);
      handleUserData(currentUser); // Process user data immediately
      return;
    }
  
    // 2. Set up auth listener with timeout safety net
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? user.email : "No user");
      await handleUserData(user); // Process user data when auth changes
    });
  
    // 3. Safety net - force loading to complete after 3 seconds
    const timeout = setTimeout(() => {
      console.warn("Auth check timeout - proceeding anyway");
      setLoading(false);
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  
    // Helper function to handle user data (reused for immediate check and listener)
    async function handleUserData(currentUser) {
      setUser(currentUser);
      
      if (currentUser) {
        console.log("✅ User is authenticated:", currentUser.email, currentUser.uid);
        const token = await currentUser.getIdTokenResult();
        setIsAdmin(token.claims.admin === true);
  
        try {
          // Fetch roster data (EXACTLY AS IN YOUR ORIGINAL CODE)
          console.log("Fetching roster...");
          const rosterSnapshot = await getDocs(collection(db, 'rosters'));
          console.log("roster snapshot:", rosterSnapshot);
          
          const rosterData = {};
          rosterSnapshot.forEach(doc => {
            const docData = doc.data();
            const formattedShifts = docData.shifts
              .filter(shift => shift.start && shift.end && shift.employeeId)
              .map(shift => ({
                ...shift,
                start: shift.start.toDate ? shift.start.toDate() : new Date(shift.start.seconds * 1000),
                end: shift.end.toDate ? shift.end.toDate() : new Date(shift.end.seconds * 1000),
              }));
            
            rosterData[doc.id] = {
              shifts: formattedShifts,
              date: new Date(doc.id)
            };
          });
          setRoster(rosterData);

          console.log("Fetching employees...");
          const employeesSnapshot = await getDocs(collection(db, 'employees'));
          const employeeList = employeesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setEmployees(employeeList);
          
          //Announcements

          const now = Timestamp.now();
          const allAnnouncementsSnap = await getDocs(collection(db, 'announcements'));
    
          const validAnnouncements = [];
    
          for (const document of allAnnouncementsSnap.docs) {
            const data = document.data();
            if (data.expiry.toMillis() <= now.toMillis()) {
              // Delete expired announcement
              await deleteDoc(doc(db, 'announcements', document.id));
            } else {
              validAnnouncements.push({
                id: document.id,
                ...data
              });
            }
          }
    
          // Sort by date descending
          validAnnouncements.sort((a, b) => b.date.toMillis() - a.date.toMillis());
    
            if(validAnnouncements.length > 0){
              setAnnouncements(validAnnouncements);
              console.log("Announcements: ", data);
            }

        //Messages
        const messages = await retrieveMessages();
        console.log("Messages: ", messages);
        setChats(messages);

        } catch (error) {
          console.error('Error fetching data:', error);
        }
      } else {
        console.log("❌ No authenticated user");
        setIsAdmin(false);
        setRoster({});
        setEmployees([]);
      }
      
      setLoading(false); // CRITICAL: Always set loading to false
    }
  }, []);


  useEffect(()=>{
    console.log("Roster updated to: ",roster);
  },[roster]);
  

  if (loading) return <LoadScreen/>;


  async function postAnnouncement(announcement) {
    const date = new Date();
    const expiry = new Date(date)
    expiry.setDate(date.getDate() + 14);
  
    try {
      const docRef = await addDoc(collection(db, 'announcements'), {
        announcement,
        date: date,
        expiry: expiry,
      });
      console.log('Announcement posted with ID:', docRef.id);
      setAnnouncements((prev) => [
        ...prev,
        {announcement, date, expiry, id: docRef.id}
      ]);
      return docRef.id;
    } catch (error) {
      console.error('Error posting announcement:', error);
      throw error;
    }
  }
  
  async function deleteAnnouncement(id) {
    if (!id) throw new Error('No ID provided for deletion.');
  
    try {
      await deleteDoc(doc(db, 'announcements', id));
      console.log(`Announcement with ID "${id}" deleted successfully.`);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
    const newAnnouncements = announcements.filter((a) => a.id !== id);

    console.log("New announcements: ", newAnnouncements);
    setAnnouncements(newAnnouncements);
  }

  const addEmployee = async (newEmployee) => {
    console.log("New employee:", newEmployee);
    const { email, name } = newEmployee;
  
    // First send to backend to create auth user
    try {
      const response = await fetch('http://localhost:5000/createEmployee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmployee.email,
          name: newEmployee.name,
          password: 'defaultPassword123',
        }),
      });
  
      const result = await response.json();
      const uid = result.uid; // Get the UID from auth user creation
      // Now create Firestore doc using the same UID
      const availability = blankAvailabilityTemplate;

      await setDoc(doc(db, 'employees', uid), {
        email, 
        name,
        availability,
        uid
      });
      // Update state with the UID
      setEmployees(prev => [...prev, { uid, email, name }]);
    } catch (error) {
      console.error("Error adding employee:", error);
    }
  };  

  const updateEmployee = async (id, updatedData) => {
    console.log("id: ", id);
    console.log("updateData: ", updatedData)
    await updateDoc(doc(db, 'employees', id), updatedData);
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updatedData } : emp));
  };

  const updatePassword = async (email, newPassword) => {
    try {
      const response = await fetch('http://localhost:5000/updatePassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });
  
      const data = await response.json();
      if (response.ok) {
        console.log(data.message);
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error('Error calling updatePassword:', err);
    }
  };  
  
  const deleteEmployee = async (uid) => {  // Note: parameter is now uid
    console.log("Delete employee with UID: ", uid);
    try {
      await deleteDoc(doc(db, 'employees', uid));
      setEmployees(prev => prev.filter(emp => emp.id !== uid));
      await fetch(`http://localhost:5000/deleteEmployee/${uid}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };  
  
  // Update Roster Functions
  const setShift = async (date, newShift) => {
    console.log("date: ", date);
    console.log("newShift", newShift);
    if (typeof date !== 'string') {
      console.error('❗ setShift expected date as a string, but got:', date);
      return;
    }
  
    const docRef = doc(db, 'rosters', date);
    const docSnap = await getDoc(docRef);
  
    let updatedShifts = [];
  
    if (docSnap.exists()) {
      const currentShifts = docSnap.data().shifts || [];
  
      const existingIndex = currentShifts.findIndex(
        shift => shift.employeeId === (typeof newShift === 'string' ? newShift : newShift.employeeId)
      );
  
      if (typeof newShift === 'string') {
        // Delete shift if employee ID matches
        if (existingIndex !== -1) {
          currentShifts.splice(existingIndex, 1);
        }
      } else if (existingIndex !== -1) {
        const existingShift = currentShifts[existingIndex];
        if (
          existingShift.start === newShift.start &&
          existingShift.end === newShift.end
        ) {
          // Shift data matches — remove
          currentShifts.splice(existingIndex, 1);
        } else {
          // Shift data different — update
          currentShifts[existingIndex] = newShift;
        }
      } else {
        // No existing shift — add new
        currentShifts.push(newShift);
      }
  
      updatedShifts = currentShifts;
    } else {
      if (typeof newShift !== 'string') {
        updatedShifts = [newShift];
      }
    }
  
    await setDoc(docRef, { shifts: updatedShifts });
  
    // ✨ Now update the local roster state with proper Date objects
    setRoster(prevRoster => {
      // Create a deep copy of the updated shifts with proper Date objects
      const processedShifts = updatedShifts.map(shift => {
        // If shift times are timestamps, convert them to Date objects
        const start = shift.start?.toDate ? shift.start.toDate() : shift.start;
        const end = shift.end?.toDate ? shift.end.toDate() : shift.end;
        return {
          ...shift,
          start,
          end
        };
      });
      
      return {
        ...prevRoster,
        [date]: { shifts: processedShifts }
      };
    });
  };

      
  

  return ( 
    <>
      {user && <Navbar isAdmin={isAdmin} />}
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/home" /> : <Authorisation />}
        />
        <Route
          path="/home"
          element={user ? <Home user={user} employees={employees} roster={roster} announcements={announcements} deleteAnnouncement={deleteAnnouncement} isAdmin={isAdmin} postAnnouncement={postAnnouncement}/> : <Navigate to="/" />}
        />
        <Route
          path="/roster"
          element={user ? <Roster user={user} roster={roster} employees={employees} setShift={setShift} isAdmin={isAdmin}/> : <Navigate to="/" />}
        />
        <Route
          path="/messages"
          element={user ? <Messages user={user} baseChats={chats} employees={employees}/> : <Navigate to="/" />}
        />
        <Route
          path="/management"
          element={user && isAdmin ? <Management user={user} roster={roster} employees={employees} updateEmployee={updateEmployee} deleteEmployee={deleteEmployee} addEmployee={addEmployee}/> : <Navigate to="/home" />}
        />
         <Route
          path="/settings"
          element={user ? <Settings user={user} employees={employees} handleLogout={handleLogout} updatePassword={updatePassword} updateEmployeeAvailability={updateEmployeeAvailability}/> : <Navigate to="/home" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
