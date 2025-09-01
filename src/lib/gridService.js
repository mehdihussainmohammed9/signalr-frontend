"use client";

import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import config from "./config";

class GridService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.currentUser = null;
    this.callbacks = {};
  }

  async connect() {
    if (this.isConnected) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(`${config.BACKEND_URL}${config.GRID_HUB}`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    // Set up event listeners
    this.connection.on("UserInfo", (userInfo) => {
      console.log("User info received:", userInfo);
      console.log("User info received:", userInfo);
      this.currentUser = userInfo;
      this.trigger('userInfo', userInfo);
    });

    this.connection.on("GridState", (gridState) => {
      console.log("Grid state received:", gridState);
      this.trigger('gridState', gridState);
    });

    this.connection.on("CellSelected", (selection) => {
      console.log("Cell selected:", selection);
      this.trigger('cellSelected', selection);
    });

    this.connection.on("CellDeselected", (cellId) => {
      console.log("Cell deselected:", cellId);
      this.trigger('cellDeselected', cellId);
    });

    this.connection.on("ConnectedUsers", (users) => {
      console.log("Connected users:", users);
      this.trigger('connectedUsers', users);
    });

    this.connection.on("UserJoined", (user) => {
      console.log("User joined:", user);
      this.trigger('userJoined', user);
    });

    this.connection.on("UserLeft", (user) => {
      console.log("User left:", user);
      this.trigger('userLeft', user);
    });

    try {
      await this.connection.start();
      this.isConnected = true;
      console.log("Grid Service Connected");
    } catch (err) {
      console.error("Grid Connection Error: ", err);
    }
  }

  async disconnect() {
    if (this.connection && this.isConnected) {
      await this.connection.stop();
      this.isConnected = false;
      this.currentUser = null;
      console.log("Grid Service Disconnected");
    }
  }

  async selectCell(cellId) {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.invoke("SelectCell", cellId);
      } catch (err) {
        console.error("Error selecting cell:", err);
      }
    }
  }

  async deselectCell() {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.invoke("DeselectCell");
      } catch (err) {
        console.error("Error deselecting cell:", err);
      }
    }
  }

  // Event system
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  trigger(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getConnectionState() {
    return this.connection?.state || "Disconnected";
  }
}

export const gridService = new GridService();