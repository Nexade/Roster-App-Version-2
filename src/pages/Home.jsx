import React, { useState, useEffect } from 'react';
import "../styles/Home.css";

const Home = ({ user, employees, roster }) => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    // Placeholder for announcements
    setAnnouncements(["Remember to update your availability this week!"]);
  }, []);

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
  

  return (
    <div className="home-container">
      <h1 className="home-title">Welcome, {getDisplayName()}!</h1>
      <p className="next-shift">{getNextShiftMessage()}</p>
  
      {announcements.length > 0 && (
        <div className="announcements-section">
          <h2 className="announcements-title">Announcements</h2>
          <ul className="announcements-list">
            {announcements.map((announcement, index) => (
              <li key={index}>{announcement}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Home;
