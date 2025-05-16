import express from "express";
import Message from "../models/Message.js";
import { auth, getProfile, createThought } from '../middleware/Auth.js';

const router = express.Router();

// Get chat list (conversations)
router.get("/conversations", auth, async (req, res) => {
    try {
        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: req.userId }, { receiver: req.userId }]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", req.userId] },
                            "$receiver",
                            "$sender"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: "$userDetails"
            }
        ]);

        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: "Server error", message: err.message });
    }
});

// Get messages between two users
router.get("/:userId", auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.userId, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.userId }
            ]
        })
            .sort({ createdAt: 1 })
            .populate("sender", "username")
            .populate("receiver", "username");
        await Message.updateMany(
            { sender: req.params.userId, receiver: req.userId, read: false },
            { $set: { read: true } }
        );

        [messages] = await Promise.all([fetchMessages, markAsRead]);

        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: "Server error", message: err.message });
    }
});

// Send a message
router.post("/", auth, async (req, res) => {
    try {
        const { receiverId, text } = req.body;

        const newMessage = new Message({
            sender: req.userId,
            receiver: receiverId,
            text
        });

        await newMessage.save();

        // Populate sender and receiver details
        const populatedMessage = await Message.findById(newMessage._id)
            .populate("sender", "username")
            .populate("receiver", "username");

        res.status(201).json(populatedMessage);
    } catch (err) {
        res.status(500).json({ error: "Server error", message: err.message });
    }
});

// One-sided delete
router.delete("/:messageId", auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        if (message.sender.toString() !== req.userId) {
            return res.status(403).json({ message: "Unauthorized to delete this message" });
        }

        await message.deleteOne(); // Or you can add a 'deleted' flag if you want soft delete
        res.status(200).json({ message: "Message deleted from your side" });
    } catch (err) {
        res.status(500).json({ error: "Server error", message: err.message });
    }
});



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
