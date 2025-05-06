import React from 'react';

const RosterDropdown = ({ 
  position, 
  onClose,
  onCopyShift,
  onPasteShift,
  onCopyDay,
  onPasteDay,
  onCopyEmployeeWeek,
  onPasteEmployeeWeek,
  contextType, // 'shift', 'employee', or 'date'
  copyData
}) => {
  if (!position.visible) return null;

  const style = {
    position: 'fixed',
    top: `${position.y}px`,
    left: `${position.x}px`,
    backgroundColor: 'white',
    border: '1px solid #ccc',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    zIndex: 1000,
    padding: '5px 0',
    minWidth: '150px'
  };

  const itemStyle = {
    padding: '5px 15px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#f5f5f5'
    }
  };

  return (
    <div style={style} onMouseLeave={onClose}>
      {contextType === 'shift' && (
        <>
          <div style={itemStyle} onClick={onCopyShift}>Copy Shift</div>
          {copyData.type == 'shift' && <div style={itemStyle} onClick={onPasteShift}>Paste Shift</div>}
        </>
      )}
      {contextType === 'employee' && (
        <>
          <div style={itemStyle} onClick={onCopyEmployeeWeek}>Copy All Shifts (Week)</div>
          {copyData.type == 'week' && <div style={itemStyle} onClick={onPasteEmployeeWeek}>Paste Shifts (Week)</div>}
        </>
      )}
      {false && ( //figure this out later when I want
        <>
          <div style={itemStyle} onClick={onCopyDay}>Copy All Shifts (Day)</div>
          {copyData.type == 'day' && <div style={itemStyle} onClick={onPasteDay}>Paste Shifts (Day)</div>}
        </>
      )}
    </div>
  );
};

export default RosterDropdown;