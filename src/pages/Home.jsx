import React, { useState, useEffect } from 'react';
import "../styles/Home.css";

const Home = ({ user, employees, roster, announcements, isAdmin, postAnnouncement, deleteAnnouncement }) => {

  const [showAnnouncementInput, setShowAnnouncementInput] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState('');


  const getDisplayName = () => {
    if (employees && Array.isArray(employees)) {
      const employee = employees.find(emp => emp.email === user?.email);
      if (employee) return employee.name;
    }
    return user.email;
  };

  const getNextShiftMessage = () => {
    if (!roster || !user?.email) return "You have no upcoming shifts.";
  
    const now = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(now.getDate() + 14);
  
    let upcomingShifts = [];
  
    Object.entries(roster).forEach(([date, data]) => {
      if (!data.shifts) return;
      data.shifts.forEach(shift => {
        if (shift.employeeId === user.email) {
          const shiftStart = new Date(shift.start);
          if (shiftStart > now && shiftStart < twoWeeksFromNow) {
            upcomingShifts.push(shiftStart);
          }
        }
      });
    });
  
    if (upcomingShifts.length === 0) {
      return "You have no upcoming shifts.";
    }
  
    // Sort to find the soonest upcoming shift
    upcomingShifts.sort((a, b) => a - b);
    const nextShift = upcomingShifts[0];
  
    const timeString = nextShift.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  
    const weekday = nextShift.toLocaleDateString(undefined, { weekday: 'long' });
  
    return `Your next shift is at ${timeString} on ${weekday}.`;
  };

  const handleAddAnnouncement = () => {
    if (newAnnouncement.trim()) {
    postAnnouncement(newAnnouncement.trim());
      setNewAnnouncement('');
      setShowAnnouncementInput(false);
    }
  };

  

  return (
    <div className="home-container">
      <h1 className="home-title">Welcome, {getDisplayName()}!</h1>
      <p className="next-shift">{getNextShiftMessage()}</p>
  
      {(announcements.length  > 0 || isAdmin) && (
        <div className="announcements-section">
          <h2 className="announcements-title">Announcements</h2>
          <ul className="announcements-list">
            {announcements.length  > 0 &&
            announcements.map((announcement, index) => (
              <li key={index}>
                <span>{announcement.announcement}</span>
                <button
                    onClick={() => deleteAnnouncement(announcement.id)}
                    className='delete-button'
                >
                    ✕
                </button>
                </li>

            ))
            }
            {isAdmin &&
                 (<li className="admin-announcement-controls">
                {!showAnnouncementInput ? <button onClick={() => setShowAnnouncementInput(true)} className='plus-button'>+</button> :
                 <>
                 <input
                   type="text"
                   value={newAnnouncement}
                   onChange={(e) => setNewAnnouncement(e.target.value)} //Sort out css for home page admin functions
                   placeholder="Type your announcement"
                 />
                 <button onClick={handleAddAnnouncement} className='submit'>Submit</button>
                 </>
                 }
               </li>)
            }
          </ul>
        </div>
      )}
    </div>
  );
};

export default Home;
