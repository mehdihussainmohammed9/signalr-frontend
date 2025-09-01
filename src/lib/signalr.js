"use client";

import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import config from "./config";

class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  buildConnection() {
    if (this.connection) return; // Connection already built

    this.connection = new HubConnectionBuilder()
      .withUrl(`${config.BACKEND_URL}${config.CHAT_HUB}`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();
  }

  async startConnection() {
    if (this.isConnected) return;

    // Build connection if not already built
    this.buildConnection();

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
    // Clear the connection object so it can be rebuilt
    this.connection = null;
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