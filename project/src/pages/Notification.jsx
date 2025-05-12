import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

// Improved socket connection handling
const socket = io("http://localhost:5000", {
  transports: ["websocket"], // Force WebSocket as transport to avoid issues with HTTP polling
  reconnectionAttempts: 5,   // Limit reconnection attempts
});

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state for better UX
  const [error, setError] = useState(null); // Add error state for better error handling

  // Fetch initial notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/notifications");
        if (res && res.data) {
          setNotifications(res.data);
          console.log("Fetched notifications:", res.data);
        } else {
          console.error("No data returned from the backend.");
        }
      } catch (err) {
        console.error("Error fetching notifications:", err.message || err);
        setError("Failed to load notifications. Please try again.");
      } finally {
        setLoading(false); // Stop loading after request completes
      }
    };

    fetchNotifications();

    // Listen for real-time notifications from Socket.io
    socket.on("newNotification", (notification) => {
      setNotifications((prevNotifications) => [notification, ...prevNotifications]);
    });

    // Socket connection event handling
    socket.on("connect", () => {
      console.log("Socket connected: " + socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError("Socket connection failed. Please try again later.");
    });

    // Cleanup the listener when the component is unmounted
    return () => {
      socket.off("newNotification");
      socket.off("connect");
      socket.off("connect_error");
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="bg-blue-600 text-white text-center p-4 text-xl font-bold">
        Notifications
      </header>
      
      {/* Display error message if any */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 text-center">
          {error}
        </div>
      )}

      <div className="max-w-lg mx-auto mt-4 bg-white p-4 rounded-lg shadow-md">
        {loading ? (
          <p className="text-gray-500 text-center">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-gray-500 text-center">No notifications yet</p>
        ) : (
          notifications.map((notif, index) => (
            <div key={index} className="p-3 border-b last:border-none">
              <p className="text-sm text-gray-700">{notif.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notification;
