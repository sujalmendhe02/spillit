import express from "express";
import Message from "../models/Message.js";
import { auth, getProfile, createThought } from '../middleware/Auth.js';

const router = express.Router();

// import express from "express";
// import Message from "../models/Message.js";
// import User from "../models/User.js";
// import { auth } from '../middleware/Auth.js';

// const router = express.Router();

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

//export default router;

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
