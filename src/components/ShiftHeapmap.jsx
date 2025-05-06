import React from 'react';

const getMinutesSinceMidnight = (input) => {
  if (input instanceof Date) {
    return input.getHours() * 60 + input.getMinutes();
  } else if (typeof input === 'string') {
    const [h, m] = input.split(':').map(Number);
    return h * 60 + m;
  } else {
    return(0);
  }
};

const formatTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const generateTimeBlocks = () => {
  const start = 6 * 60;
  const end = 22 * 60;
  const interval = 15;
  const blocks = [];

  for (let mins = start; mins < end; mins += interval) {
    blocks.push(mins);
  }

  return blocks;
};

const ShiftHeatmap = ({ shifts }) => {
  const blockHeight = 120;
  const blockWidth = 400;
  const blockPixelWidth = 6;

  const simplifiedShifts = shifts.map((shift) => ({
    start: getMinutesSinceMidnight(shift.start),
    end: getMinutesSinceMidnight(shift.end),
  }));

  const timeBlocks = generateTimeBlocks();

  const heat = timeBlocks.map((blockTime) => {
    let count = 0;
    for (const shift of simplifiedShifts) {
      if (blockTime >= shift.start && blockTime < shift.end) {
        count++;
      }
    }
    return count;
  });

  const maxCount = Math.max(...heat, 1);
  const allTimes = simplifiedShifts.flatMap((s) => [s.start, s.end]);
  const earliest = formatTime(Math.min(...allTimes));
  const latest = formatTime(Math.max(...allTimes));

  // === JSX return ===
  return (
    <div style={{ width: `${blockWidth}px`, margin: '20px' }}>
      {/* Top labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          padding: '6px',
          height: '20px',
        }}
      >
        {heat.map((_, index) => (
          <div
            key={index}
            style={{
              width: `${blockPixelWidth}px`,
              fontSize: '10px',
              textAlign: 'center',
              color: '#333',
            }}
          >
            {index === 0 && <div style={{ transform: 'rotate(-45deg)' }}>{earliest}</div>}
            {index === heat.length - 1 && <div style={{ transform: 'rotate(-45deg)' }}>{latest}</div>}
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div
        style={{
          width: '100%',
          height: `${blockHeight}px`,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
          padding: '6px',
          border: '2px solid #333',
          borderRadius: '8px',
          background: '#fff',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {heat.map((count, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column-reverse',
              justifyContent: 'flex-start',
              alignItems: 'center',
              height: '100%',
              width: `${blockPixelWidth}px`,
            }}
            title={`${count} employee(s)`}
          >
            {[...Array(count)].map((_, i) => {
              const gradient = Math.round(((i + 1) / count) * 255);
              const color = `rgb(${gradient}, 0, 0)`;
              return (
                <div
                  key={i}
                  style={{
                    width: '100%',
                    height: `${blockHeight / maxCount - 2}px`,
                    backgroundColor: color,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom tick labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          padding: '6px',
          height: '20px',
        }}
      >
        {timeBlocks.filter((mins, index)=> index % 3 == 0).map((mins, index) => (
          <div
            key={index}
            style={{
              width: `${blockPixelWidth*3}px`,
              fontSize: '9px',
              textAlign: 'center',
              color: '#555',
            }}
          >
            {mins % 60 === 0 ? formatTime(mins) : ''}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShiftHeatmap;
