import React, { useEffect, useState, useContext } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import AuthContext from "../AuthContext";

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
      auth: {
        token: token
      }
    });

    const fetchNotifications = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setNotifications(response.data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    socket.on("connect", () => {
      console.log("Connected to socket server");
    });

    socket.on("newNotification", (notification) => {
      console.log("Received new notification:", notification);
      setNotifications(prev => [notification, ...prev]);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError("Failed to connect to notification service");
    });

    return () => {
      socket.off("newNotification");
      socket.off("connect");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100 pt-20 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <div
                key={notification._id || index}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <p className="text-gray-800">{notification.message}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;