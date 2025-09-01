"use client";

import { useState, useEffect } from "react";
import { gridService } from "@/lib/gridService";

export const CollaborativeGrid = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [cellSelections, setCellSelections] = useState({}); // cellId -> selection
  const [selectedCell, setSelectedCell] = useState(null);

  // Create a 5x5 grid (25 cells)
  const ROWS = 5;
  const COLS = 5;
  const cells = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells.push(`${row}-${col}`);
    }
  }

  useEffect(() => {
    // Set up event listeners
    gridService.on('userInfo', (userInfo) => {
      setCurrentUser(userInfo);
      setIsConnected(true);
    });

    gridService.on('gridState', (gridState) => {
      const selections = {};
      gridState.forEach(selection => {
        selections[selection.CellId] = selection;
      });
      setCellSelections(selections);
    });

    gridService.on('cellSelected', (selection) => {
      setCellSelections(prev => ({
        ...prev,
        [selection.CellId]: selection
      }));
    });

    gridService.on('cellDeselected', (cellId) => {
      setCellSelections(prev => {
        const newSelections = { ...prev };
        delete newSelections[cellId];
        return newSelections;
      });
    });

    gridService.on('connectedUsers', (users) => {
      setConnectedUsers(users);
    });

    gridService.on('userJoined', (user) => {
      setConnectedUsers(prev => [...prev, user]);
    });

    gridService.on('userLeft', (user) => {
      setConnectedUsers(prev => prev.filter(u => u.ConnectionId !== user.ConnectionId));
    });

    return () => {
      // Cleanup listeners
      gridService.off('userInfo');
      gridService.off('gridState');
      gridService.off('cellSelected');
      gridService.off('cellDeselected');
      gridService.off('connectedUsers');
      gridService.off('userJoined');
      gridService.off('userLeft');
    };
  }, []);

  const handleConnect = async () => {
    console.log("Attempting to connect to GridHub...");
    try {
      await gridService.connect();
      console.log("GridHub connection successful");
    } catch (error) {
      console.error("GridHub connection failed:", error);
      alert("Failed to connect to GridHub. Make sure backend is running with the new GridHub.");
    }
  };

  const handleDisconnect = async () => {
    await gridService.disconnect();
    setIsConnected(false);
    setCurrentUser(null);
    setConnectedUsers([]);
    setCellSelections({});
    setSelectedCell(null);
  };

  const handleCellClick = async (cellId) => {
    if (!isConnected) return;

    if (selectedCell === cellId) {
      // Deselect current cell
      await gridService.deselectCell();
      setSelectedCell(null);
    } else {
      // Select new cell
      await gridService.selectCell(cellId);
      setSelectedCell(cellId);
    }
  };

  const getColorClass = (color) => {
    const colorMap = {
      red: "border-red-500 bg-red-100",
      blue: "border-blue-500 bg-blue-100",
      green: "border-green-500 bg-green-100",
      purple: "border-purple-500 bg-purple-100",
      orange: "border-orange-500 bg-orange-100",
      pink: "border-pink-500 bg-pink-100",
      cyan: "border-cyan-500 bg-cyan-100",
      yellow: "border-yellow-500 bg-yellow-100",
      indigo: "border-indigo-500 bg-indigo-100",
      teal: "border-teal-500 bg-teal-100"
    };
    return colorMap[color] || "border-gray-300 bg-gray-100";
  };

  const getBorderColorClass = (color) => {
    const colorMap = {
      red: "border-red-600",
      blue: "border-blue-600", 
      green: "border-green-600",
      purple: "border-purple-600",
      orange: "border-orange-600",
      pink: "border-pink-600",
      cyan: "border-cyan-600",
      yellow: "border-yellow-600",
      indigo: "border-indigo-600",
      teal: "border-teal-600"
    };
    return colorMap[color] || "border-gray-600";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🌐 Real-time Collaborative Grid
        </h1>
        
        <div className="flex items-center gap-4 mb-4">
          {!isConnected ? (
            <>
              <button
                onClick={handleConnect}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
              >
                Connect to Grid
              </button>
              <button
                onClick={() => {
                  fetch('http://localhost:5006/gridhub')
                    .then(response => {
                      console.log('GridHub endpoint response:', response.status);
                      alert(`GridHub endpoint status: ${response.status}`);
                    })
                    .catch(error => {
                      console.error('GridHub endpoint error:', error);
                      alert('GridHub endpoint not found. Backend needs restart with new code.');
                    });
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Test GridHub
              </button>
            </>
          ) : (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
            >
              Disconnect
            </button>
          )}
          
          {currentUser && (
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${getBorderColorClass(currentUser.Color)} bg-current`}></div>
              <span className="font-medium">You are: {currentUser.UserName}</span>
              <span className={`px-2 py-1 rounded text-xs bg-green-100 text-green-800`}>
                Connected
              </span>
            </div>
          )}
        </div>

        {/* Connected Users */}
        {connectedUsers.length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg border">
            <h3 className="font-semibold text-blue-800 mb-2">
              👥 Online Users ({connectedUsers.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {connectedUsers.map((user, index) => (
                <div key={`user-${user.ConnectionId}-${index}`} className="flex items-center gap-1 bg-white px-2 py-1 rounded border">
                  <div className={`w-3 h-3 rounded-full ${getBorderColorClass(user.Color)} bg-current`}></div>
                  <span className="text-sm font-medium">{user.UserName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="mb-6">
        <div 
          className="inline-block border-2 border-gray-400 bg-white rounded-lg overflow-hidden shadow-lg"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, 80px)`,
            gridTemplateRows: `repeat(${ROWS}, 80px)`,
            gap: '1px',
            backgroundColor: '#e5e7eb'
          }}
        >
          {cells.map((cellId, index) => {
            const selection = cellSelections[cellId];
            const isSelected = selection != null;
            const isMySelection = selection?.UserId === currentUser?.ConnectionId;

            return (
              <div
                key={`cell-${cellId}-${index}`}
                onClick={() => handleCellClick(cellId)}
                className={`
                  relative cursor-pointer transition-all duration-200 flex items-center justify-center text-sm font-medium
                  ${isSelected 
                    ? `${getColorClass(selection.Color)} border-2 ${getBorderColorClass(selection.Color)}` 
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }
                  ${isMySelection ? 'ring-2 ring-offset-1 ring-blue-400' : ''}
                `}
                title={isSelected ? `Selected by ${selection.UserName}` : `Click to select ${cellId}`}
              >
                {/* Cell coordinates */}
                <span className="text-xs text-gray-500">
                  {cellId}
                </span>

                {/* User indicator */}
                {isSelected && (
                  <div className={`absolute -top-1 -right-1 px-1 py-0.5 text-xs font-bold text-white rounded shadow-sm ${getBorderColorClass(selection.Color)} bg-current`}>
                    {selection.UserName}
                  </div>
                )}

                {/* Selection pulse animation */}
                {isMySelection && (
                  <div className="absolute inset-0 animate-pulse bg-blue-200 opacity-30 rounded"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Selections */}
      {Object.keys(cellSelections).length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">🔴 Active Selections</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.values(cellSelections).map((selection, index) => (
              <div key={`selection-${selection.CellId}-${index}`} className="flex items-center gap-2 bg-white p-2 rounded border">
                <div className={`w-3 h-3 rounded-full ${getBorderColorClass(selection.Color)} bg-current`}></div>
                <span className="font-mono">Cell {selection.CellId}</span>
                <span className="text-gray-600">by {selection.UserName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">📋 How to Use:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>1. <strong>Connect to Grid</strong> - Click "Connect to Grid" button</li>
          <li>2. <strong>Select Cells</strong> - Click any cell to select it (shows your color and name)</li>
          <li>3. <strong>See Others</strong> - Watch other users' selections appear in real-time</li>
          <li>4. <strong>Multi-User Test</strong> - Open multiple browser tabs to test collaboration</li>
          <li>5. <strong>Move Around</strong> - Click different cells to see your selection move instantly</li>
        </ul>
      </div>
    </div>
  );
};