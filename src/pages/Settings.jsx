import React, { useEffect, useState } from "react";
import "../styles/Settings.css";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const minutesToTime = (mins) => {
  const hours = String(Math.floor(mins / 60)).padStart(2, "0");
  const minutes = String(mins % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const getMode = (start, end) => {
  if (start === 0 && end === 0) return "Unavailable";
  if (start === 0 && end >= 1430) return "Available";
  return "Mixed";
};

const Settings = ({ user, employees, handleLogout, updateEmployeeAvailability, updatePassword }) => {
  const [employeeIndex, setEmployeeIndex] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [availabilityMessage, setAvailabilityMessage] = useState("");

  useEffect(() => {
    const index = employees.findIndex(emp => emp.email === user.email);
    setEmployeeIndex(index);

    if (index !== -1 && employees[index].availability) {
      setAvailability(employees[index].availability);
    }
  }, [user, employees]);

  const handleChangePassword = async () => {
    /*if (!newPassword || newPassword.length < 6) {
      setPasswordMessage("Password must be at least 6 characters.");
      return;
    }*/

    try {
      await updatePassword(user.email, newPassword);
      setPasswordMessage("Password updated successfully.");
      setNewPassword("");
    } catch (error) {
      setPasswordMessage(`Error: ${error.message}`);
    }
  };

  const handleModeChange = (dayIndex, mode) => {
    const updated = [...availability];
    if (mode === "Available") {
      updated[dayIndex] = { start: 0, end: 1439 };
    } else if (mode === "Unavailable") {
      updated[dayIndex] = { start: 0, end: 0 };
    }else {
        updated[dayIndex] = { start: 420, end: 1140 }; // 7:00 AM to 7:00 PM
      }
    setAvailability(updated);
  };

  useEffect(()=> {
    handleAvailabilityUpdate();
  },[availability])

  const handleTimeChange = (dayIndex, type, value) => {
    const updated = [...availability];
    updated[dayIndex][type] = timeToMinutes(value);
    setAvailability(updated);
  };

  const handleAvailabilityUpdate = async () => {
    try {
      const employeeId = employees[employeeIndex].id;
      await updateEmployeeAvailability(employeeId, availability);
      setAvailabilityMessage("Availability updated.");
    } catch (error) {
      setAvailabilityMessage(`Error: ${error.message}`);
    }
  };

  if (employeeIndex === null) return <p>Loading settings...</p>;

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      <section className="settings-section">
        <h3>Change Password</h3>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button onClick={handleChangePassword}>Update Password</button>
        {passwordMessage && <p>{passwordMessage}</p>}
      </section>

      <section>
        <h3>Weekly Availability</h3>
        <div style={{overflowX: 'auto'}}>
        <table className="availability-table">
        <thead>
            <tr>
              <th className="side-cell"> </th>
              {DAYS.map((day) => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="side-cell">Status</td>
              {availability.map((slot, i) => (
                <td key={i}>
                  <select
                    value={getMode(slot.start, slot.end)}
                    onChange={(e) => handleModeChange(i, e.target.value)}
                  >
                    <option value="Available">Available</option>
                    <option value="Mixed">Mixed</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </td>
              ))}
            </tr>
            <tr>
              <td className="side-cell" >Start</td>
              {availability.map((slot, i) => {
                const mode = getMode(slot.start, slot.end);
                return (
                  <td key={i}>
                    {mode === "Mixed" ? (
                      <input
                        type="time"
                        value={minutesToTime(slot.start)}
                        onChange={(e) => handleTimeChange(i, "start", e.target.value)}
                      />
                    ) : (
                      mode === "Available" ? <span>✅</span> :<span>❌</span>
                    )}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="side-cell" >End</td>
              {availability.map((slot, i) => {
                const mode = getMode(slot.start, slot.end);
                return (
                  <td key={i}>
                    {mode === "Mixed" ? (
                      <input
                        type="time"
                        value={minutesToTime(slot.end)}
                        onChange={(e) => handleTimeChange(i, "end", e.target.value)}
                      />
                    ) : (
                      mode === "Available" ? <span>✅</span> :<span>❌</span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
        </div>
        {availabilityMessage && <p className="availabilityMessage">{availabilityMessage}</p>}
      </section>

      <section className="logout-section">
        <button onClick={handleLogout}>Log Out</button>
      </section>
    </div>
  );
};

export default Settings;
