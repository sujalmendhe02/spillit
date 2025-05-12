import express from "express";
import Notification from "../models/Notification.js"
import { auth, getProfile, createThought } from '../middleware/Auth.js';

const router = express.Router();

// Get all notifications for the logged-in user
router.get("/", auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;
