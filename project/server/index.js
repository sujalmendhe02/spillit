import express from 'express';
import mongoose from 'mongoose';
import http from "http";
import { Server } from "socket.io";
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from "./routes/Chats.js";
import Message from "./models/Message.js";
import { v2 as cloudinary } from 'cloudinary';
import authRoutes from './routes/User.js';
import thoughtRoutes from './routes/Thought.js';
import NotificationRoutes from './routes/Notification.js'; 

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Function to check Cloudinary connection
const checkCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('Connected to Cloudinary:', result); 
  } catch (error) {
    console.error('Failed to connect to Cloudinary:', error);
    console.error('Error details:', error.response ? error.response.data : error.message);
  }
};

// Call the Cloudinary connection check
checkCloudinaryConnection();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL, adjust accordingly
    methods: ["GET", "POST"],
  },
});

app.use(express.json()); 
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Set up routes
app.use('/api/auth', authRoutes); 
app.use('/api/thoughts', thoughtRoutes); 
app.use("/api/chats", chatRoutes);
app.use("/api/notifications", NotificationRoutes);

const users = new Map();

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle user joining
  socket.on("join", (userId) => {
    users.set(userId, socket.id);
    console.log(`User ${userId} joined`);
  });

  // Handle sending messages
  socket.on("sendMessage", async ({ sender, receiver, text }) => {
    try {
      const newMessage = new Message({ sender, receiver, text });
      await newMessage.save();

      // Send to the receiver if online
      if (users.has(receiver)) {
        io.to(users.get(receiver)).emit("receiveMessage", newMessage);
      }
    } catch (error) {
      console.error("Error handling sendMessage event:", error);
    }
  });

  // Test notification on connection
  socket.emit('newNotification', { message: 'This is a test notification!' });

  // Handle disconnect
  socket.on("disconnect", () => {
    for (let [key, value] of users.entries()) {
      if (value === socket.id) {
        users.delete(key);
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

// Export the io object for use in routes (e.g., for real-time updates)
export { io };

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
