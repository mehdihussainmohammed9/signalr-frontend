"use client";

import { useMemo, useState, useEffect } from "react";
import GridLayout from "react-grid-layout";
import { FaArrowsAltV, FaArrowsAltH } from "react-icons/fa";
import { signalRService } from "@/lib/signalr";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

export const InteractiveMergeGrid = () => {
  // 16 cells (4x4)
  const initialLayout = [
    {
      i: "1", x: 0, y: 0, w: 1, h: 1, content: {
        type: "product",
        title: "RBC5A",
        subtitle: "Repco 12 Volt 5 Amp Battery Charger",
        discount: "20%",
        price: "$80.00",
        salePrice: "$20.00"
      }
    },
    { i: "2", x: 1, y: 0, w: 1, h: 1, content: "Empty" },
    { i: "3", x: 2, y: 0, w: 1, h: 1, content: "Empty" },
    { i: "4", x: 3, y: 0, w: 1, h: 1, content: "Empty" },

    { i: "5", x: 0, y: 1, w: 1, h: 1, content: "Empty" },
    { i: "6", x: 1, y: 1, w: 1, h: 1, content: "Empty" },
    { i: "7", x: 2, y: 1, w: 1, h: 1, content: "Empty" },
    { i: "8", x: 3, y: 1, w: 1, h: 1, content: "Empty" },

    { i: "9", x: 0, y: 2, w: 1, h: 1, content: "Empty" },
    { i: "10", x: 1, y: 2, w: 1, h: 1, content: "Empty" },
    { i: "11", x: 2, y: 2, w: 1, h: 1, content: "Empty" },
    { i: "12", x: 3, y: 2, w: 1, h: 1, content: "Empty" },

    { i: "13", x: 0, y: 3, w: 1, h: 1, content: "Empty" },
    { i: "14", x: 1, y: 3, w: 1, h: 1, content: "Empty" },
    { i: "15", x: 2, y: 3, w: 1, h: 1, content: "Empty" },
    { i: "16", x: 3, y: 3, w: 1, h: 1, content: "Empty" },
  ];

  const [layout, setLayout] = useState(initialLayout);
  const [selectedId, setSelectedId] = useState(null);
  const [gridCellActivity, setGridCellActivity] = useState({}); // cellId -> { connectionId, color }
  const [currentUserColor, setCurrentUserColor] = useState("blue");
  const [isSignalRConnected, setIsSignalRConnected] = useState(false);

  const COLS = 4;
  const ROWS = 4;

  // Check if SignalR is connected and setup event listeners
  useEffect(() => {
    const checkConnection = () => {
      setIsSignalRConnected(signalRService.isConnected);
    };

    const setupEventListeners = () => {
      if (signalRService.connection && signalRService.isConnected) {
        console.log("Setting up grid event listeners...");

        // Remove existing listeners to prevent duplicates
        signalRService.off("GridCellActivity");
        signalRService.off("GridCellDeselected");
        signalRService.off("CurrentGridActivity");
        signalRService.off("YourUserColor");

        // Listen for grid activity events via ReceiveMessage (workaround)
        signalRService.on("ReceiveMessage", (data) => {
          if (typeof data === 'string' && data.includes('GRID_')) {
            console.log("Grid message received:", data);
            
            if (data.includes('GRID_SELECT:')) {
              const parts = data.split('GRID_SELECT:')[1].split(':');
              const cellId = parts[0];
              const color = parts[1];
              
              // Extract connection ID from the echo message format
              const connectionId = data.match(/Echo: GRID_SELECT/)?.[0] ? 'remote-user' : 'unknown';
              
              console.log("Processing grid selection:", cellId, connectionId, color);
              setGridCellActivity(prev => ({
                ...prev,
                [cellId]: { connectionId, color }
              }));
            }
            
            if (data.includes('GRID_DESELECT:')) {
              const cellId = data.split('GRID_DESELECT:')[1];
              console.log("Processing grid deselection:", cellId);
              setGridCellActivity(prev => {
                const newActivity = { ...prev };
                delete newActivity[cellId];
                return newActivity;
              });
            }
          }
        });

        // Listen for grid activity events (if backend has the new methods)
        signalRService.on("GridCellActivity", (cellId, connectionId, color) => {
          console.log("Grid cell activity received:", cellId, connectionId, color);
          setGridCellActivity(prev => ({
            ...prev,
            [cellId]: { connectionId, color }
          }));
        });

        signalRService.on("GridCellDeselected", (cellId) => {
          console.log("Grid cell deselected:", cellId);
          setGridCellActivity(prev => {
            const newActivity = { ...prev };
            delete newActivity[cellId];
            return newActivity;
          });
        });

        signalRService.on("CurrentGridActivity", (activity) => {
          console.log("Current grid activity received:", activity);
          setGridCellActivity(activity || {});
        });

        signalRService.on("YourUserColor", (color) => {
          console.log("User color received:", color);
          setCurrentUserColor(color);
        });

        // Add test event to verify SignalR is working
        signalRService.on("TestEvent", (message) => {
          console.log("Test event received:", message);
        });
      }
    };

    checkConnection();
    setupEventListeners();
    
    const interval = setInterval(() => {
      checkConnection();
      if (signalRService.isConnected && !isSignalRConnected) {
        setupEventListeners();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isSignalRConnected]);

  // Send grid selection events via SendData (using existing working SignalR method)
  const handleGridSelection = async (cellId) => {
    console.log("Handling grid selection for cell:", cellId);
    if (isSignalRConnected && cellId) {
      try {
        // Use the working SendData method to send grid events
        await signalRService.invoke("SendData", `GRID_SELECT:${cellId}:${currentUserColor}`);
        console.log("Grid cell selection sent via SendData");
      } catch (error) {
        console.error("Failed to send grid selection:", error);
      }
    } else {
      console.log("SignalR not connected or no cellId");
    }
  };

  const handleGridDeselection = async (cellId) => {
    console.log("Handling grid deselection for cell:", cellId);
    if (isSignalRConnected && cellId) {
      try {
        // Use the working SendData method to send grid events
        await signalRService.invoke("SendData", `GRID_DESELECT:${cellId}`);
        console.log("Grid cell deselection sent via SendData");
      } catch (error) {
        console.error("Failed to send grid deselection:", error);
      }
    }
  };

  // Clear all selections when clicking outside grid
  const handleGlobalDeselect = async () => {
    if (selectedId) {
      await handleGridDeselection(selectedId);
      setSelectedId(null);
    }
  };

  const overlaps = (a, b) =>
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;

  const clampToCanvas = (rect) => {
    let yMin = Math.max(0, Math.min(rect.y, ROWS - 1));
    let yEnd = Math.min(ROWS, rect.y + rect.h);
    if (yMin === ROWS - 1 && rect.y + rect.h > ROWS) {
      yMin = ROWS - rect.h;
      yEnd = ROWS;
    }
    const h = Math.max(1, Math.min(ROWS - yMin, yEnd - yMin));

    const xMin = Math.max(0, Math.min(rect.x, COLS - 1));
    const xEnd = Math.min(COLS, rect.x + rect.w);
    const w = Math.max(1, xEnd - xMin);

    return { ...rect, x: xMin, w, y: yMin, h };
  };

  const handleCommitChange = (changedItem) => {
    let next = layout.map((c) =>
      c.i === changedItem.i ? { ...c, x: changedItem.x, y: changedItem.y, w: changedItem.w, h: changedItem.h } : c
    );

    const me = next.find((c) => c.i === changedItem.i);
    const myOverlaps = next.filter(
      (c) =>
        c.i !== me.i &&
        !(c.hidden && c.hiddenBy && c.hiddenBy !== me.i) &&
        overlaps(me, c)
    );

    next = next.map((c) => {
      if (myOverlaps.some((o) => o.i === c.i)) {
        return { ...c, hidden: true, hiddenBy: me.i };
      }
      if (c.hidden && c.hiddenBy === me.i && !overlaps(me, c)) {
        return { ...c, hidden: false, hiddenBy: undefined };
      }
      return c;
    });

    const group = [me, ...myOverlaps];
    const minX = Math.min(...group.map((g) => g.x));
    const maxX = Math.max(...group.map((g) => g.x + g.w));
    const minY = Math.min(...group.map((g) => g.y));
    const maxY = Math.max(...group.map((g) => g.y + g.h));
    let mergedMe = { ...me, x: minX, w: maxX - minX, y: minY, h: maxY - minY };

    mergedMe = clampToCanvas(mergedMe);

    next = next.map((c) => (c.i === me.i ? mergedMe : c));

    setLayout(next);
  };

  const visible = useMemo(() => layout.filter((c) => !c.hidden), [layout]);

  const labelMap = useMemo(() => {
    const ordered = [...visible].sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
    const map = new Map();
    ordered.forEach((c, idx) => map.set(c.i, idx + 1));
    return map;
  }, [visible]);

  // Get color class for border highlighting
  const getColorClass = (color, type = "border") => {
    const colorMap = {
      red: type === "border" ? "border-red-500 ring-red-300" : "bg-red-100",
      blue: type === "border" ? "border-blue-500 ring-blue-300" : "bg-blue-100", 
      green: type === "border" ? "border-green-500 ring-green-300" : "bg-green-100",
      purple: type === "border" ? "border-purple-500 ring-purple-300" : "bg-purple-100",
      orange: type === "border" ? "border-orange-500 ring-orange-300" : "bg-orange-100",
      pink: type === "border" ? "border-pink-500 ring-pink-300" : "bg-pink-100",
      cyan: type === "border" ? "border-cyan-500 ring-cyan-300" : "bg-cyan-100",
      yellow: type === "border" ? "border-yellow-500 ring-yellow-300" : "bg-yellow-100",
      indigo: type === "border" ? "border-indigo-500 ring-indigo-300" : "bg-indigo-100",
      teal: type === "border" ? "border-teal-500 ring-teal-300" : "bg-teal-100"
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="p-4 w-full" onClick={handleGlobalDeselect}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Interactive Draggable Grid</h1>
        <div className="flex items-center gap-4">
          <p className="text-gray-600">Drag, resize, and merge grid items. Items can overlap and merge automatically.</p>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded border-2 ${getColorClass(currentUserColor)}`}></div>
            <span className="text-sm text-gray-600">Your color: {currentUserColor}</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${isSignalRConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isSignalRConnected ? "SignalR Connected" : "SignalR Disconnected"}
            </span>
            {isSignalRConnected && (
              <button 
                onClick={() => handleGridSelection("test-cell")}
                className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                Test Grid Event
              </button>
            )}
          </div>
        </div>
      </div>

      <GridLayout
        className="layout"
        layout={visible}
        cols={COLS}
        rowHeight={148}
        width={640}
        isResizable={true}
        isDraggable={true}
        resizeHandles={["e", "s"]}
        compactType={null}
        preventCollision={false}
        onResize={(_layout, _oldItem, newItem) => {
          if (newItem.y + newItem.h > ROWS) {
            newItem.h = ROWS - newItem.y;
          }
        }}
        onResizeStop={(_newLayout, _oldItem, newItem) => {
          setSelectedId(newItem.i);
          handleCommitChange(newItem);
        }}
        onDragStop={(_newLayout, _oldItem, newItem) => {
          setSelectedId(newItem.i);
          handleCommitChange(newItem);
        }}
        resizeHandle={(axis, ref) => {
          if (axis === "e") {
            return (
              <div
                ref={ref}
                className="react-resizable-handle flex items-center justify-center w-6 h-6 rounded-full border border-blue-500 bg-white absolute top-1/2 right-[-12px] -translate-y-1/2 cursor-ew-resize"
              >
                <div className="h-[20px] w-[20px] rounded-[10px] border-2 border-[#29317E] flex items-center justify-center absolute bg-white">
                  <FaArrowsAltH size={14} className="text-[#7D7D7D]" />
                </div>
              </div>
            );
          }
          if (axis === "s") {
            return (
              <div
                ref={ref}
                className="react-resizable-handle flex items-center justify-center w-6 h-6 rounded-full border border-blue-500 bg-white absolute bottom-[-12px] left-1/2 -translate-x-1/2 cursor-ns-resize "
              >
                <div className="h-[20px] w-[20px] rounded-[10px] border-2 border-[#29317E] flex items-center justify-center absolute bg-white">
                  <FaArrowsAltV size={14} className="text-[#7D7D7D]" />
                </div>
              </div>
            );
          }
        }}
      >
        {visible.map((item) => {
          const cellActivity = gridCellActivity[item.i];
          const isActiveByOtherUser = cellActivity && cellActivity.connectionId !== (signalRService.connection?.connectionId || '');
          const isActiveByCurrentUser = selectedId === item.i;
          
          return (
            <div
              key={item.i}
              onClick={async (e) => {
                e.stopPropagation();
                console.log("Grid cell clicked:", item.i, "Current selection:", selectedId);
                
                // Always deselect previous selection first
                if (selectedId && selectedId !== item.i) {
                  await handleGridDeselection(selectedId);
                }
                
                if (selectedId === item.i) {
                  // Clicking same cell - deselect
                  await handleGridDeselection(item.i);
                  setSelectedId(null);
                } else {
                  // Selecting new cell
                  setSelectedId(item.i);
                  await handleGridSelection(item.i);
                }
              }}
              className={
                `border-2 rounded relative flex items-center justify-center transition-all duration-200 hover:shadow-lg ` +
                (isActiveByCurrentUser 
                  ? `${getColorClass(currentUserColor)} ${getColorClass(currentUserColor, "bg")} ring-2 ring-offset-2` 
                  : isActiveByOtherUser 
                  ? `${getColorClass(cellActivity.color)} ${getColorClass(cellActivity.color, "bg")} ring-2 ring-offset-1` 
                  : "border-[#B0B0B0] bg-white")
              }
            >
              {/* User Activity Indicator */}
              {cellActivity && (
                <div className={`absolute -top-1 -right-1 px-1 py-0.5 text-xs font-bold text-white rounded ${getColorClass(cellActivity.color).split(' ')[0].replace('border-', 'bg-')} z-10`}>
                  {cellActivity.connectionId.substring(0, 3)}
                </div>
              )}
            <span className="absolute bottom-1 left-1 text-xs text-[#B0B0B0] font-medium">
              #{labelMap.get(item.i)}
            </span>

            {typeof item.content === "string" ? (
              <span className="text-[#B0B0B0] text-[12px]">{item.content || "Empty"}</span>
            ) : (
              <div className="w-full h-full p-2">
                <div className="w-[48px] h-[24px] bg-[#29317E] p-[1px] flex justify-center items-center absolute left-0 top-0 rounded-tl">
                  <span className=" font-[600] text-[12px] text-white">{item?.content?.discount}</span>
                </div>
                <div className="absolute top-[30px] left-2">
                  <p className="font-[500] text-[12px] text-[#171717]">{item?.content?.title}</p>
                  <p className="font-[400] text-[10px] text-[#4A4A4A] line-clamp-2">{item?.content?.subtitle}</p>
                </div>
                <div className="absolute bottom-2 right-2">
                  <p className="font-[600] text-[14px] text-[#171717] line-through">{item?.content?.price}</p>
                  <p className="font-[500] text-[12px] text-[#29317E]">{item?.content?.salePrice}</p>
                </div>
              </div>
            )}
            </div>
          );
        })}
      </GridLayout>

      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Grid Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Items:</span>
            <span className="ml-2 font-medium">{layout.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Visible Items:</span>
            <span className="ml-2 font-medium">{visible.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Hidden Items:</span>
            <span className="ml-2 font-medium">{layout.length - visible.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Selected Item:</span>
            <span className="ml-2 font-medium">{selectedId || "None"}</span>
          </div>
        </div>
      </div>

      {/* Real-time Grid Activity Panel */}
      {isSignalRConnected && Object.keys(gridCellActivity).length > 0 && (
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-md font-semibold mb-3 text-blue-800">🔴 Live User Activity</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(gridCellActivity).map(([cellId, activity]) => (
              <div key={cellId} className="flex items-center gap-2 p-2 bg-white rounded border">
                <div className={`w-3 h-3 rounded-full ${getColorClass(activity.color).split(' ')[0].replace('border-', 'bg-')}`}></div>
                <span className="font-mono text-xs">Cell #{cellId}</span>
                <span className="text-xs text-gray-500">
                  User: {activity.connectionId.substring(0, 6)}...
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 bg-blue-50 p-4 rounded-lg">
        <h3 className="text-md font-semibold mb-2 text-blue-800">How to Use:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Drag</strong>: Click and drag any grid item to move it</li>
          <li>• <strong>Resize</strong>: Use the resize handles (arrows) on the right and bottom edges</li>
          <li>• <strong>Merge</strong>: Overlapping items will automatically merge into larger cells</li>
          <li>• <strong>Select</strong>: Click on any item to select it (colored border based on your user color)</li>
          <li>• <strong>Real-time Collaboration</strong>: When connected to SignalR, see other users' selections in real-time</li>
          <li>• <strong>Color Indicators</strong>: Each user gets a unique color for their selections and activity</li>
        </ul>
      </div>
    </div>
  );
};