import express from "express";
import Message from "../models/Message.js";
import { auth, getProfile, createThought } from '../middleware/Auth.js';

const router = express.Router();

// Fetch all messages between two users
router.get("/:user1/:user2", auth, async (req, res) => {
    try {
        const { user1, user2 } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: user1, receiver: user2 },
                { sender: user2, receiver: user1 },
            ],
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: "Server error", message: err.message });
    }
});

export default router;
