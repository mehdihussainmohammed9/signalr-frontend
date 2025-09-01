"use client";

import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async startConnection() {
    if (this.isConnected) return;

    this.connection = new HubConnectionBuilder()
      .withUrl("http://localhost:5006/chathub")
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    try {
      await this.connection.start();
      this.isConnected = true;
      console.log("SignalR Connected");
    } catch (err) {
      console.error("SignalR Connection Error: ", err);
    }
  }

  async stopConnection() {
    if (this.connection && this.isConnected) {
      await this.connection.stop();
      this.isConnected = false;
      console.log("SignalR Disconnected");
    }
  }

  on(methodName, callback) {
    if (this.connection) {
      this.connection.on(methodName, callback);
    }
  }

  off(methodName) {
    if (this.connection) {
      this.connection.off(methodName);
    }
  }

  async invoke(methodName, ...args) {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.invoke(methodName, ...args);
      } catch (err) {
        console.error(`Error invoking ${methodName}:`, err);
      }
    }
  }

  getConnectionState() {
    return this.connection?.state || "Disconnected";
  }
}

export const signalRService = new SignalRService();