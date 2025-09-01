"use client";

import { useState } from "react";
import { signalRService } from "@/lib/signalr";
import { CollaborativeGrid } from "@/components/CollaborativeGrid";
import { SimpleCollaborativeGrid } from "@/components/SimpleCollaborativeGrid";
import config from "@/lib/config";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputData, setInputData] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [currentConnectionId, setCurrentConnectionId] = useState("");

  const handleConnect = async () => {
    try {
      await signalRService.startConnection();
      setIsConnected(true);
      setConnectionStatus("Connected");

      signalRService.on("ReceiveMessage", (data) => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { 
            type: "received", 
            data, 
            timestamp: new Date().toLocaleTimeString() 
          }
        ]);
      });

      signalRService.on("YourConnectionId", (connectionId) => {
        setCurrentConnectionId(connectionId);
        console.log("Your connection ID:", connectionId);
      });

      signalRService.on("UserConnected", (connectionId) => {
        setConnectedUsers((prev) => {
          const updatedUsers = [...prev, connectionId];
          setMessages((prevMessages) => [
            ...prevMessages,
            { 
              type: "system", 
              data: `User ${connectionId.substring(0, 8)}... connected | Total users: ${updatedUsers.length}`, 
              timestamp: new Date().toLocaleTimeString()
            }
          ]);
          return updatedUsers;
        });
      });

      signalRService.on("UserDisconnected", (connectionId) => {
        setConnectedUsers((prev) => {
          const updatedUsers = prev.filter(id => id !== connectionId);
          setMessages((prevMessages) => [
            ...prevMessages,
            { 
              type: "system", 
              data: `User ${connectionId.substring(0, 8)}... disconnected | Total users: ${updatedUsers.length}`, 
              timestamp: new Date().toLocaleTimeString()
            }
          ]);
          return updatedUsers;
        });
      });

      signalRService.on("AllConnectedUsers", (usersList) => {
        setConnectedUsers(usersList);
        setMessages((prevMessages) => [
          ...prevMessages,
          { 
            type: "system", 
            data: `Received user list: ${usersList.length} users online`, 
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      });

    } catch (error) {
      console.error("Connection failed: ", error);
      setConnectionStatus("Connection Failed");
    }
  };

  const handleSend = async () => {
    if (inputData && isConnected) {
      try {
        await signalRService.invoke("SendData", inputData);
        setMessages((prevMessages) => [
          ...prevMessages,
          { 
            type: "sent", 
            data: inputData, 
            timestamp: new Date().toLocaleTimeString() 
          }
        ]);
        setInputData("");
      } catch (error) {
        console.error("Send failed: ", error);
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await signalRService.stopConnection();
      setIsConnected(false);
      setConnectionStatus("Disconnected");
      setConnectedUsers([]);
      setCurrentConnectionId("");
      setMessages((prevMessages) => [
        ...prevMessages,
        { 
          type: "system", 
          data: "Manually disconnected", 
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (error) {
      console.error("Disconnect failed: ", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg">
            <h1 className="text-2xl font-bold">SignalR Connection Test</h1>
            <p className="text-blue-100">
              Status: {connectionStatus}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                config.isDevelopment 
                  ? 'bg-yellow-500 text-yellow-900' 
                  : 'bg-green-500 text-green-900'
              }`}>
                {config.isDevelopment ? '🔧 Development' : '☁️ Production (Azure)'}
              </span>
              <span className="text-blue-200 text-xs">
                Backend: {config.BACKEND_URL}
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            {/* Control Buttons */}
            <div className="mb-6 flex gap-4">
              <button
                onClick={handleConnect}
                disabled={isConnected}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                Connect
              </button>
              
              <button
                onClick={handleDisconnect}
                disabled={!isConnected}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
              >
                Disconnect
              </button>
            </div>

            {/* Send Data Section */}
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter data to send to backend..."
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!isConnected}
                />
                <button
                  onClick={handleSend}
                  disabled={!isConnected || !inputData}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Messages Display */}
            <div className="border border-gray-300 rounded-lg p-4 h-96 overflow-y-auto bg-gray-50">
              <h3 className="font-semibold mb-3">Messages:</h3>
              {messages.length === 0 ? (
                <p className="text-gray-500">No messages yet. Click Connect to start.</p>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-2 p-3 rounded ${
                      msg.type === "system" 
                        ? "bg-yellow-100 text-yellow-800" 
                        : msg.type === "sent"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-xs uppercase">
                          {msg.type === "sent" ? "→ SENT" : msg.type === "received" ? "← RECEIVED" : "SYSTEM"}
                        </span>
                        <p className="mt-1">{msg.data}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Connected Users Section */}
            <div className="mt-6 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <h3 className="font-semibold mb-3 text-blue-800">👥 Connected Users ({connectedUsers.length})</h3>
              {connectedUsers.length === 0 ? (
                <p className="text-blue-600 text-sm">No users connected</p>
              ) : (
                <div className="space-y-2">
                  {connectedUsers.map((userId, index) => (
                    <div
                      key={userId}
                      className={`flex justify-between items-center p-2 rounded ${
                        userId === currentConnectionId 
                          ? "bg-green-100 border border-green-300" 
                          : "bg-white border border-blue-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          userId === currentConnectionId ? "bg-green-500" : "bg-blue-500"
                        }`}></div>
                        <span className="font-mono text-xs">
                          {userId === currentConnectionId ? "YOU: " : `USER ${index + 1}: `}
                          {userId}
                        </span>
                      </div>
                      {userId === currentConnectionId && (
                        <span className="text-xs text-green-600 font-medium">CURRENT</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Connection Info */}
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Connection Info</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Connection State:</span>
                  <span className="ml-2 font-medium">{signalRService.getConnectionState()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Messages:</span>
                  <span className="ml-2 font-medium">{messages.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Your Connection ID:</span>
                  <span className="ml-2 font-mono text-xs">{currentConnectionId || "Not connected"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Backend URL:</span>
                  <span className="ml-2 font-medium">{config.BACKEND_URL}{config.CHAT_HUB}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Click <strong>Connect</strong> to establish connection to backend</li>
            <li>2. Enter data in input field and click <strong>Send</strong> (data will appear in backend terminal)</li>
            <li>3. Any data sent from backend will automatically appear here</li>
            <li>4. Click <strong>Disconnect</strong> to close the connection</li>
          </ol>
        </div>

        {/* Collaborative Grid Section */}
        <div className="mt-8">
          <CollaborativeGrid />
        </div>

        {/* Simple Collaborative Grid (Workaround) */}
        <div className="mt-8">
          <SimpleCollaborativeGrid />
        </div>
      </div>
    </div>
  );
}