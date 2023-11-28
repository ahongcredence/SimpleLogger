import React, { useState } from 'react';

function LogTable({ logHistory }) {
  const [showTable, setShowTable] = useState(false);

  const toggleTable = () => {
    setShowTable(!showTable);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <button onClick={toggleTable}>Show History</button>
      {showTable && (
        <table style={{ borderCollapse: 'collapse', width: '50%', marginTop: '10px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #dddddd', textAlign: 'left', padding: '8px' }}>Timestamp</th>
              <th style={{ border: '1px solid #dddddd', textAlign: 'left', padding: '8px' }}>System Code</th>
              <th style={{ border: '1px solid #dddddd', textAlign: 'left', padding: '8px' }}>Message</th>
            </tr>
          </thead>
          <tbody>
            {logHistory.map((logEntry, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #dddddd', padding: '8px' }}>{logEntry.timestamp}</td>
                <td style={{ border: '1px solid #dddddd', padding: '8px' }}>{logEntry.systemCode}</td>
                <td style={{ border: '1px solid #dddddd', padding: '8px' }}>{logEntry.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default LogTable;
