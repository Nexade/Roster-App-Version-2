import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore'; // For modular SDK
import RosterDropdown from '../components/RosterDropdown';
import ShiftHeatmap from '../components/ShiftHeapmap';
import "../styles/Roster.css";


const getWeekStart = (date) => {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.getFullYear(), date.getMonth(), diff);
};

  
const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDayName = (date) => date.toLocaleDateString(undefined, { weekday: 'long' });
const formatShortDate = (date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const formatTime = (date) => 
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  

const isValidShift = (shift) => {
  if (!shift?.start || !shift?.end) return false;
  const start = shift.start instanceof Date ? shift.start : new Date(shift.start);
  const end = shift.end instanceof Date ? shift.end : new Date(shift.end);
  return !isNaN(start) && !isNaN(end);
};

const parseTimeInput = (date, timeStr) => {
    // First try to match the standard format (with colons and optional AM/PM)
    const rangeMatch = timeStr.match(/^(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*[- ]\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)$/i);
    
    // If no match, try the simplified format (just numbers separated by space or dash)
    if (!rangeMatch) {
        const simpleMatch = timeStr.match(/^(\d{1,2})\s*[- ]\s*(\d{1,2})$/);
        if (simpleMatch) {
            // Convert simple format to standard format (e.g., "12-18" -> "12:00-18:00")
            timeStr = `${simpleMatch[1]}:00-${simpleMatch[2]}:00`;
            return parseTimeInput(date, timeStr); // Re-process with the converted format
        }
        return null;
    }

    const parseSingleTime = (t) => {
        // Handle cases where minutes might be omitted (e.g., "9" becomes "9:00")
        if (/^\d{1,2}\s*(AM|PM)?$/i.test(t)) {
            t = t.replace(/(\d+)(\s*(AM|PM)?)/i, '$1:00$2');
        }

        const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
        const match = timeRegex.exec(t);
        if (!match) return null;

        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const period = match[3]?.toUpperCase() || '';

        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        const newDate = new Date(date);
        newDate.setHours(hours, minutes, 0, 0);
        return newDate;
    };

    const start = parseSingleTime(rangeMatch[1]);
    const end = parseSingleTime(rangeMatch[2]);

    if (!start || !end || start >= end) return null;
    return { start, end };
};


const minutesToTime = (minutes) => {
    if (minutes === null || minutes === undefined) return "Unavailable";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };
  

const formatTimeForDisplay = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  });
};

const formatTimeForInput = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
};

const Roster = ({ roster, employees, isAdmin = false, setShift, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: null,  // 'shift', 'employee', or 'date'
    contextData: null // will hold relevant data
  });
  const [copyData, setCopyData] = useState({
    type: null,  // 'shift' | 'day' | 'week'
    data: null   // will contain the copied data
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [hoveredDate, setHoveredDate] = useState(new Date());
  

  const hasAvailabilityConflict = (shift, employee, date) => {

    if (!shift?.start || !shift?.end || !employee.availability || !isAdmin) return false;
    
    const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
    const availability = employee.availability[dayOfWeek];
    if (!availability) return false; // No availability = no conflict
    const shiftStart = shift.start instanceof Date ? shift.start : new Date(shift.start);
    const shiftEnd = shift.end instanceof Date ? shift.end : new Date(shift.end);
    
    // Convert shift times to seconds since midnight
    const shiftStartSec = shiftStart.getHours() * 60 + shiftStart.getMinutes();
    const shiftEndSec = shiftEnd.getHours() * 60 + shiftEnd.getMinutes();
    
    // Check if shift falls completely outside availability
    return (
      shiftStartSec < availability.start || 
      shiftEndSec > availability.end
    );
  };
  
  const handleContextMenu = (e, type, data) => {
    if(!isAdmin) return;
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type,
      contextData: data
    });
  };
  
  const handleCloseContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };
  
  // Add copy/paste handlers
  const handleCopyShift = () => {
    const { date, employee } = contextMenu.contextData;
    const dateKey = formatDateKey(date);
    
    // Find the shift for this employee on this date
    const shifts = roster[dateKey]?.shifts || [];
    const employeeShift = shifts.find(shift => shift.employeeId === employee.email);
  
    if (employeeShift) {
      // Copy the valid shift
      setCopyData({
        type: 'shift',
        data: {
          ...employeeShift,
          start: employeeShift.start instanceof Date ? new Date(employeeShift.start) : employeeShift.start,
          end: employeeShift.end instanceof Date ? new Date(employeeShift.end) : employeeShift.end
        }
      });
    } else {
      // No shift exists - store null
      setCopyData({
        type: 'shift',
        data: null
      });
    }

    handleCloseContextMenu();
  };
  
  
  const handlePasteShift = () => {
    console.log("PasteShift: ", copyData);
    const { date, employee } = contextMenu.contextData;
    const dateKey = formatDateKey(date);

    console.log(copyData?.data);
  
    // Case 1: No data or null data - clear the shift
    if (!copyData?.data) {
      setShift(dateKey, {
        employeeId: employee.email,
        name: employee.name,
        start: null,
        end: null
      });
      console.log(`Cleared shift for ${employee.name} on ${dateKey}`);
      handleCloseContextMenu();
      return;
    }
  
    // Case 2: Valid shift data - paste with time adjustment
    try {
      // Parse original timestamps (handle both Date objects and strings)
      const originalStart = copyData.data.start instanceof Date ? 
        new Date(copyData.data.start) : 
        new Date(copyData.data.start);
      
      const originalEnd = copyData.data.end instanceof Date ? 
        new Date(copyData.data.end) : 
        new Date(copyData.data.end);
  
      // Calculate time components from original shift
      const startHours = originalStart.getHours();
      const startMinutes = originalStart.getMinutes();
      const endHours = originalEnd.getHours();
      const endMinutes = originalEnd.getMinutes();
  
      // Create new dates with original times but target day
      const newStart = new Date(date);
      newStart.setHours(startHours, startMinutes, 0, 0);
      
      const newEnd = new Date(date);
      newEnd.setHours(endHours, endMinutes, 0, 0);
  
      // Handle overnight shifts (end time next day)
      if (originalEnd.getDate() !== originalStart.getDate()) {
        const dayDifference = originalEnd.getDate() - originalStart.getDate();
        newEnd.setDate(newEnd.getDate() + dayDifference);
      }
  
      // Prepare the new shift
      const newShift = {
        ...copyData.data,
        employeeId: employee.email,
        name: employee.name,
        start: newStart,
        end: newEnd
      };
  
      // Update the roster
      setShift(dateKey, newShift);
      console.log(`Pasted adjusted shift to ${employee.name} on ${dateKey}`);
    } catch (error) {
      console.error("Error pasting shift:", error);
      // Fallback to clearing the shift if parsing fails
      setShift(dateKey, {
        employeeId: employee.email,
        name: employee.name,
        start: null,
        end: null
      });
    }
  
    handleCloseContextMenu();
  };

  const getTodaysShifts = (date) => {
    const todayKey = formatDateKey(date);
    const todaysShifts = roster[todayKey]?.shifts || [];
    
    // Enrich shifts with employee details
    return todaysShifts.map(shift => {
      const employee = employees.find(e => e.email === shift.employeeId) || {};
      return {
        ...shift,
        employeeName: employee.name,
        // Convert Firestore Timestamps to Dates if needed
        start: shift.start?.toDate ? shift.start.toDate() : shift.start,
        end: shift.end?.toDate ? shift.end.toDate() : shift.end
      };
    });
  };
  
  const handleCopyWeek = (employee) => {
    const weekShifts = weekDates.flatMap(date => {
      const dateKey = formatDateKey(date);
      return (roster[dateKey]?.shifts || [])
        .filter(shift => shift.employeeId === employee.email)
        .map(shift => ({
          ...shift,
          dateKey, // Store original date for reference
          start: shift.start instanceof Date ? new Date(shift.start) : shift.start,
          end: shift.end instanceof Date ? new Date(shift.end) : shift.end
        }));
    });

    console.log("Weekshifts", weekShifts)
  
    if (weekShifts.length > 0) {
      setCopyData({
        type: 'week',
        data: weekShifts,
        employeeId: employee.email // Store for paste validation
      });
      console.log(`Copied ${weekShifts.length} shifts for ${employee.name}'s week`);
    } else {
      setCopyData({
        type: 'week',
        data: []
      });
      console.log("No shifts to copy for this week");
    }
    handleCloseContextMenu();
  };

  
  
  const handlePasteWeek = (targetEmployee) => {
    if (!copyData || copyData.type !== 'week') return;
  
    // Create a map of all 7 weekdays (0-6) with empty arrays
    const shiftsByWeekday = Array(7).fill().map(() => []);
  
    // First pass: populate with actual shifts
    copyData.data.forEach(shift => {
      const weekday = shift.start 
        ? new Date(shift.start).getDay() 
        : new Date(shift.dateKey).getDay();
      
      shiftsByWeekday[weekday].push(shift);
    });
  
    // Second pass: ensure empty shifts for missing weekdays
    const originalEmployeeId = copyData.employeeId;
    weekDates.forEach(date => {
      const weekday = date.getDay();
      if (shiftsByWeekday[weekday].length === 0) {
        // Add an empty shift placeholder
        shiftsByWeekday[weekday].push({
          dateKey: formatDateKey(date),
          employeeId: originalEmployeeId,
          name: copyData.data[0]?.name || "Unknown",
          start: null,
          end: null
        });
      }
    });
  
    // Apply to target week
    weekDates.forEach(date => {
      const weekday = date.getDay();
      const dateKey = formatDateKey(date);
      
      shiftsByWeekday[weekday].forEach(shift => {
        if (shift.start === null || shift.end === null) {
          // Paste empty shift
          setShift(dateKey, {
            employeeId: targetEmployee.email,
            name: targetEmployee.name,
            start: null,
            end: null
          });
        } else {
          // Paste regular shift with time adjustment
          const originalStart = new Date(shift.start);
          const originalEnd = new Date(shift.end);
          
          const newStart = new Date(date);
          newStart.setHours(originalStart.getHours(), originalStart.getMinutes());
          
          const newEnd = new Date(date);
          newEnd.setHours(originalEnd.getHours(), originalEnd.getMinutes());
          
          if (originalEnd.getDate() !== originalStart.getDate()) {
            const dayDiff = originalEnd.getDate() - originalStart.getDate();
            newEnd.setDate(newEnd.getDate() + dayDiff);
          }
          
          setShift(dateKey, {
            ...shift,
            employeeId: targetEmployee.email,
            name: targetEmployee.name,
            start: newStart,
            end: newEnd
          });
        }
      });
    });
    setRefreshKey(prev => prev + 1); 
    handleCloseContextMenu();
  }; //Figure out invalid time value error :(
  


  if (!roster || typeof roster !== 'object' || !employees || !Array.isArray(employees)) {
    return <div>Loading roster...</div>;
  }

  // Create a map of employee emails for quick lookup
  const employeeEmails = new Set(employees.map(emp => emp.email));

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    return d;
  });

  // Filter shifts to only include those with valid employees
  const shiftsByDate = {};
  Object.entries(roster).forEach(([dateKey, day]) => {
    shiftsByDate[dateKey] = (day.shifts || []).filter(shift => 
      shift.employeeId && employeeEmails.has(shift.employeeId)
    );
  });

  const handleShiftChange = (value, date, employee) => {
    const trimmedValue = value.trim();
    const dateStr = formatDateKey(date);
  
    if (!trimmedValue) {
      setShift(dateStr, { employeeId: employee.email });
      return;
    }
  
    //const formattedValue = formatSimpleTimeInput(trimmedValue);
    const timeRange = parseTimeInput(date, trimmedValue);
  
    if (!timeRange) {
      alert('Invalid time format. Use format like "9:00 AM-5:00 PM" or "09:00-17:00"');
      return;
    }

    
    setShift(dateStr, {
      name: employee.name,
      employeeId: employee.email,
      start: timeRange.start,
      end: timeRange.end
    });
    console.log("It should be returning: ", formatTimeRangeForInput(timeRange.start, timeRange.end));
    return formatTimeRangeForInput(timeRange.start, timeRange.end);
  };

  const handleInputFocus = () =>{
    return;
}

  
const formatSimpleTimeInput = (input) => {
    // Handle formats like "9-5" or "11-15"
    const simpleFormat = input.match(/^(\d{1,2})\s*[-]\s*(\d{1,2})$/);
    if (simpleFormat) {
      return `${simpleFormat[1]}:00-${simpleFormat[2]}:00`;
    }
    return input;
  };
  
  const formatTimeRangeForInput = (start, end) => {
    // Format as "HH:MM-HH:MM" (24-hour format)
    const format = (date) => {
      if (!date) return '';
      const d = date instanceof Date ? date : new Date(date);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    return `${format(start)}-${format(end)}`;
  };
  

  const formatShiftDisplay = (shift) => {
    try {
      if (!isValidShift(shift)) return "No shift time";

      const start = shift.start instanceof Date ? shift.start : new Date(shift.start);
      const end = shift.end instanceof Date ? shift.end : new Date(shift.end);

      return `${formatTimeForDisplay(start)} - ${formatTimeForDisplay(end)}`;
    } catch (e) {
      console.error('Error formatting shift:', e);
      return "Invalid time";
    }
  };

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${formatShortDate(start)} - ${formatShortDate(end)}`;
  };
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  return (
    <>
    <div className="week-nav">
        <button onClick={() => navigateWeek('prev')}>
          Previous Week
        </button>
        <div className="week-range">{formatWeekRange()}</div>
        <button onClick={() => navigateWeek('next')}>
          Next Week
        </button>
      </div>
    <div>
        
      {/* Week Navigation */}
      
  
      {/* Edit Toggle Button */}
      {isAdmin && (<div className="admin-controls">
        {!showAvailability && <button onClick={() => setIsEditing(!isEditing)} >
          {isEditing ? 'Stop Editing' : 'Edit Roster'}
        </button>}
        {!isEditing && <button onClick={() => setShowAvailability(!showAvailability)} >
            {showAvailability ? "Show Roster" :"Show Employee Availability"}
        </button>}
        </div>
      )}
  
      {/* Main Roster Table */}
      <table>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Employees</th>
            {weekDates.map((date) => {
              const isCurrentDay = date.toDateString() === currentDate.toDateString();
              return (
                <th 
                  key={date} 
                  onMouseEnter={()=>{setHoveredDate(date)}}
                  //className={isCurrentDay && "current-day"}
                  /*onContextMenu={(e) => handleContextMenu(e, 'date', { date })}*/
                >
                  {formatDayName(date)}<br />
                  {formatShortDate(date)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => {
            const isCurrentUser = user?.email === employee.email;
            return (
              <tr 
                key={employee.id}
                className={isCurrentUser ? 'current-user' : ""}
              >
                <td 
                  className= {"employee-cell"}
                  onContextMenu={(e) => handleContextMenu(e, 'employee', { employee })}
                >
                  {employee.name}
                </td>
                {weekDates.map((date) => {
                  const dateKey = formatDateKey(date);
                  const shifts = shiftsByDate[dateKey] || [];
                  const employeeShifts = shifts.filter(shift => shift.employeeId === employee.email);
                  const isCurrentDay = date.toDateString() === currentDate.toDateString();
  
                  return (
                    <td
                      key={dateKey}
                      onMouseEnter={()=>{setHoveredDate(date)}}
                      className={isCurrentDay ? "current-day" : ""}
                    >
                      {isEditing ? (
                        <input
                        key={`${employee.email}-${dateKey}-${refreshKey}`} 
                          type="text"
                          defaultValue={employeeShifts
                            .filter(isValidShift)
                            .map(shift => 
                              `${formatTimeForInput(shift.start)}-${formatTimeForInput(shift.end)}`
                            )
                            .join(', ')}
                          onBlur={(e) => 
                            {const formattedValue = handleShiftChange(e.target.value, date, employee);
                            if (formattedValue) {
                              e.target.value = formattedValue; // Update input with formatted value
                            }
                      }}
                          onFocus={handleInputFocus}
                          onClick={(e) => e.target.select()}
                          style={{ 
                            width: '100%', 
                            border: 'none', 
                            background: 'transparent',
                            cursor: 'text',
                            fontWeight: isCurrentUser ? 'bold' : 'normal'
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handleContextMenu(e, 'shift', { date, employee });
                          }}
                        />
                      ) :
                        showAvailability ? (
                            // Show availability for this day
                            (() => {
                              const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
                              const availability = employee.availability?.[dayOfWeek];
                              return (
                                <div style={{ minHeight: '20px' }}>
                                  {availability ? 
                                        (availability.start == 0 && availability.end > 1430) ? "" :
                                        (availability.start == 0 && availability.end == 0) ? "X" : 
                                        `${minutesToTime(availability.start)}-${minutesToTime(availability.end)}`
                                         : 
                                    'Not Available'}
                                </div>
                              );
                            })()
                          ) : employeeShifts.length > 0 ? (
                            employeeShifts
                              .filter(isValidShift)
                              .map((shift, index) => {
                                const isConflict =
                                  hasAvailabilityConflict(shift, employee, date);
                                
                                return (
                                  <div 
                                    key={index}
                                    style={{ 
                                      color: isConflict ? 'maroon' : 'inherit',
                                      fontWeight: isConflict ? 'bolder' : 'normal'
                                    }}
                                  >
                                    {formatShiftDisplay(shift)}
                                    {isConflict && (
                                      <span style={{ fontSize: '0.8em', marginLeft: '5px' }}>
                                       
                                      </span>
                                    )}
                                  </div>
                                );
                              })
                          ) : (
                        <div 
                          style={{ minHeight: '20px' }}
                          onContextMenu={(e) => handleContextMenu(e, 'shift', { date, employee })}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {isAdmin &&
    <ShiftHeatmap shifts={getTodaysShifts(hoveredDate)}/>}
      {/* Context Menu */}
      {contextMenu.visible && (
        <RosterDropdown
          position={contextMenu}
          copyData={copyData}
          onClose={handleCloseContextMenu}
          onCopyShift={handleCopyShift}
          onPasteShift={handlePasteShift}
          onCopyDay={() => handleCopyDay(contextMenu.contextData.date)}
          onPasteDay={() => handlePasteDay(contextMenu.contextData.date)}
          onCopyEmployeeWeek={() => handleCopyWeek(contextMenu.contextData.employee)}
          onPasteEmployeeWeek={() => handlePasteWeek(contextMenu.contextData.employee)}
          contextType={contextMenu.type}
        />
      )}
    </div>
    </>
  );
};

export default Roster;