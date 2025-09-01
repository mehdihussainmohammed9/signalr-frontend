"use client";

import { useState, useEffect } from "react";
import { signalRService } from "@/lib/signalr";

export const SimpleCollaborativeGrid = () => {
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
    // Check SignalR connection
    const checkConnection = () => {
      setIsConnected(signalRService.isConnected);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    // Listen for messages via the existing SignalR connection
    if (signalRService.connection) {
      signalRService.on("ReceiveMessage", (data) => {
        console.log("Received message:", data);
        
        if (typeof data === 'string') {
          // Parse grid selection messages
          if (data.includes('GRID_SELECT:')) {
            const parts = data.split(':');
            if (parts.length >= 4) {
              const cellId = parts[1];
              const userName = parts[2];
              const color = parts[3];
              
              console.log("Processing grid selection:", { cellId, userName, color });
              
              setCellSelections(prev => ({
                ...prev,
                [cellId]: { cellId, userName, color, timestamp: Date.now() }
              }));
            }
          }
          
          if (data.includes('GRID_DESELECT:')) {
            const cellId = data.split(':')[1];
            console.log("Processing grid deselection:", cellId);
            
            setCellSelections(prev => {
              const newSelections = { ...prev };
              delete newSelections[cellId];
              return newSelections;
            });
          }
        }
      });

      signalRService.on("YourConnectionId", (connectionId) => {
        setCurrentUser({ 
          connectionId, 
          userName: `User-${connectionId.substring(0, 4)}`,
          color: getColorForUser(connectionId)
        });
      });

      signalRService.on("AllConnectedUsers", (users) => {
        const userList = users.map(userId => ({
          connectionId: userId,
          userName: `User-${userId.substring(0, 4)}`,
          color: getColorForUser(userId)
        }));
        setConnectedUsers(userList);
      });
    }

    return () => {
      clearInterval(interval);
    };
  }, []);

  const getColorForUser = (connectionId) => {
    const colors = ["red", "blue", "green", "purple", "orange", "pink", "cyan", "yellow", "indigo", "teal"];
    const hash = connectionId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const handleConnect = async () => {
    if (!signalRService.isConnected) {
      alert("Please connect to SignalR first using the main Connect button above!");
      return;
    }
    setIsConnected(true);
  };

  const handleCellClick = async (cellId) => {
    if (!isConnected || !currentUser) return;

    if (selectedCell === cellId) {
      // Deselect current cell
      await signalRService.invoke("SendData", `GRID_DESELECT:${cellId}`);
      setSelectedCell(null);
    } else {
      // Deselect previous cell if any
      if (selectedCell) {
        await signalRService.invoke("SendData", `GRID_DESELECT:${selectedCell}`);
      }
      
      // Select new cell
      await signalRService.invoke("SendData", `GRID_SELECT:${cellId}:${currentUser.userName}:${currentUser.color}`);
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
      red: "bg-red-600",
      blue: "bg-blue-600",
      green: "bg-green-600",
      purple: "bg-purple-600",
      orange: "bg-orange-600",
      pink: "bg-pink-600",
      cyan: "bg-cyan-600",
      yellow: "bg-yellow-600",
      indigo: "bg-indigo-600",
      teal: "bg-teal-600"
    };
    return colorMap[color] || "bg-gray-600";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🌐 Simple Collaborative Grid (Using Existing SignalR)
        </h1>
        
        <div className="flex items-center gap-4 mb-4">
          {!signalRService.isConnected ? (
            <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded border">
              ⚠️ Connect to SignalR first using the main Connect button above!
            </div>
          ) : !isConnected ? (
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
            >
              Enable Grid Collaboration
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-green-100 text-green-800 rounded border">
                ✅ Grid Collaboration Active
              </div>
              {currentUser && (
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${getBorderColorClass(currentUser.color)}`}></div>
                  <span className="font-medium">You: {currentUser.userName}</span>
                </div>
              )}
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
                <div key={`simple-user-${user.connectionId}-${index}`} className="flex items-center gap-1 bg-white px-2 py-1 rounded border">
                  <div className={`w-3 h-3 rounded-full ${getBorderColorClass(user.color)}`}></div>
                  <span className="text-sm font-medium">{user.userName}</span>
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
            const isMySelection = selectedCell === cellId;

            return (
              <div
                key={`simple-cell-${cellId}-${index}`}
                onClick={() => handleCellClick(cellId)}
                className={`
                  relative cursor-pointer transition-all duration-200 flex items-center justify-center text-sm font-medium
                  ${isSelected 
                    ? `${getColorClass(selection.color)} border-2 border-current` 
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }
                  ${isMySelection ? 'ring-2 ring-offset-1 ring-blue-400' : ''}
                `}
                title={isSelected ? `Selected by ${selection.userName}` : `Click to select ${cellId}`}
              >
                {/* Cell coordinates */}
                <span className="text-xs text-gray-500">
                  {cellId}
                </span>

                {/* User indicator */}
                {isSelected && (
                  <div className={`absolute -top-1 -right-1 px-1 py-0.5 text-xs font-bold text-white rounded shadow-sm ${getBorderColorClass(selection.color)}`}>
                    {selection.userName}
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
              <div key={`simple-selection-${selection.cellId}-${index}`} className="flex items-center gap-2 bg-white p-2 rounded border">
                <div className={`w-3 h-3 rounded-full ${getBorderColorClass(selection.color)}`}></div>
                <span className="font-mono">Cell {selection.cellId}</span>
                <span className="text-gray-600">by {selection.userName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">📋 How to Use:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>1. <strong>Connect to SignalR first</strong> using the main Connect button above</li>
          <li>2. <strong>Enable Grid Collaboration</strong> using the button below</li>
          <li>3. <strong>Click cells</strong> to select them (your color and name appear)</li>
          <li>4. <strong>Open another browser</strong> and repeat to test real-time collaboration</li>
          <li>5. <strong>Watch selections</strong> appear instantly across all browsers!</li>
        </ul>
      </div>
    </div>
  );
};