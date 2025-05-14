import express from 'express';
import Thought from '../models/Thought.js';
import { auth, getProfile, createThought } from '../middleware/Auth.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { io } from '../index.js';

const router = express.Router();




// Create a new thought
router.post('/', auth, async (req, res) => {
    console.log("Received Data:", req.body);
    const { title, content, book } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required." });
    }

    try {
        const thought = new Thought({
            title,
            content,
            author: req.userId,
            book: book || [],
        });

        await thought.save();
        await User.findByIdAndUpdate(req.userId, { $push: { thoughts: thought._id } });
        res.status(201).json({ message: 'Thought created successfully', thought });
    } catch (err) {
        console.error("Server Error:", err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});




// Get all thoughts
router.get('/', async (req, res) => {
    try {
        const thoughts = await Thought.find().populate('author', 'username avatar').exec();
        res.status(200).json(thoughts);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Search thoughts by title or content
router.get("/search", async (req, res) => {
    try {
        console.log("Query received:", req.query);  // Debugging

        const { q } = req.query; // Change from "query" to "q"
        const searchQuery = q?.trim();

        if (!searchQuery) {
            console.log("Search query is missing or empty");
            return res.status(400).json({ message: "Search query cannot be empty" });
        }

        console.log("Searching for:", searchQuery);

        const thoughts = await Thought.find({
            $or: [
                { title: { $regex: searchQuery, $options: "i" } },
                { content: { $regex: searchQuery, $options: "i" } },
                { "book.title": { $regex: searchQuery, $options: "i" } },
                { "book.author": { $regex: searchQuery, $options: "i" } },
                { "book.tags": { $regex: searchQuery, $options: "i" } }
            ]
        }).populate("author", "username");

        console.log("Search results:", thoughts);
        res.status(200).json(thoughts);
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

//delete a thought
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;

    try {
        const thought = await Thought.findById(id);

        if (!thought) {
            return res.status(404).json({ message: "Thought not found." });
        }

        // Check if the logged-in user is the author
        if (thought.author.toString() !== req.userId) {
            return res.status(403).json({ message: "Unauthorized to delete this thought." });
        }

        // Delete the thought
        await Thought.findByIdAndDelete(id);

        // Remove the thought ID from the user's `thoughts` array
        await User.findByIdAndUpdate(req.userId, { $pull: { thoughts: id } });

        res.status(200).json({ message: "Thought deleted successfully." });
    } catch (err) {
        console.error("Server Error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


router.get('/users', auth, async (req, res) => {
    try {
        const users = await User.find({}, 'username'); // Fetch only usernames
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get a particular thought by ID
router.get('/:id', async (req, res) => {
    try {
        const thought = await Thought.findById(req.params.id)
            .populate('author', 'username')  // Populate author details
            .populate('likes', 'username')   // Populate users who liked
            .populate('comments.user', 'username') // Populate comment authors
            .populate('comments.likes', 'username') // Populate likes in comments
            .populate('comments.replies.user', 'username'); // Populate replies' users

        if (!thought) {
            return res.status(404).json({ message: 'Thought not found' });
        }

        res.status(200).json(thought);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Like a thought
router.post("/:id/toggle-like", auth, async (req, res) => {
    try {
        const thought = await Thought.findById(req.params.id);
        if (!thought) {
            return res.status(404).json({ message: "Thought not found" });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userIndex = thought.likes.indexOf(req.userId);
        const isLiked = userIndex === -1;

        if (isLiked) {
            thought.likes.push(req.userId);

            // Only create notification if it's a new like and not the author liking their own thought
            if (thought.author.toString() !== req.userId.toString()) {
                // Check if a similar notification already exists
                const existingNotification = await Notification.findOne({
                    userId: thought.author,
                    senderId: req.userId,
                    type: "like",
                    thoughtId: thought._id,
                });

                if (!existingNotification) {
                    const notification = new Notification({
                        userId: thought.author,
                        senderId: req.userId,
                        type: "like",
                        thoughtId: thought._id,
                        message: `${user.username} liked your thought "${thought.title}"`,
                    });

                    await notification.save();

                    // Emit notification to the author if they're online
                    const authorSocketId = onlineUsers.get(thought.author.toString());
                    if (authorSocketId) {
                        io.to(authorSocketId).emit("newNotification", notification);
                    }
                }
            }
        } else {
            thought.likes.splice(userIndex, 1);
        }

        await thought.save();
        res.status(200).json({ 
            message: isLiked ? "Thought liked" : "Thought unliked", 
            liked: isLiked,
            likeCount: thought.likes.length 
        });
    } catch (err) {
        console.error("Error in toggle-like route:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Delete notification
router.delete('/notifications/:notificationId', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.notificationId);
        
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        // Check if the user owns this notification
        if (notification.userId.toString() !== req.userId) {
            return res.status(403).json({ message: "Not authorized to delete this notification" });
        }

        await notification.deleteOne();
        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Add comment
router.post("/:id/comment", auth, async (req, res) => {
    try {
        const thought = await Thought.findById(req.params.id);
        if (!thought) {
            return res.status(404).json({ message: "Thought not found" });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const comment = {
            user: req.userId,
            username: user.username,
            text: req.body.text,
            createdAt: new Date(),
        };

        thought.comments.push(comment);
        await thought.save();

        // Only create notification if it's not the author commenting on their own thought
        if (thought.author.toString() !== req.userId.toString()) {
            // Check if a similar notification already exists
            const existingNotification = await Notification.findOne({
                userId: thought.author,
                senderId: req.userId,
                type: "comment",
                thoughtId: thought._id,
            });

            if (!existingNotification) {
                const notification = new Notification({
                    userId: thought.author,
                    senderId: req.userId,
                    type: "comment",
                    thoughtId: thought._id,
                    message: `${user.username} commented on your thought "${thought.title}"`,
                });

                await notification.save();

                const authorSocketId = onlineUsers.get(thought.author.toString());
                if (authorSocketId) {
                    io.to(authorSocketId).emit("newNotification", notification);
                }
            }
        }

        res.status(200).json({ message: "Comment added", comment });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});
// Reply to a comment
router.post("/:id/comment/:commentId/reply", auth, async (req, res) => {
    try {
        const thought = await Thought.findById(req.params.id);
        if (!thought) {
            return res.status(404).json({ message: "Thought not found" });
        }

        const comment = thought.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const reply = {
            user: req.userId,
            text: req.body.text,
            createdAt: new Date(),
        };

        comment.replies.push(reply);
        await thought.save();

        // Notify the comment owner
        if (comment.user.toString() !== req.userId.toString()) {
            const notification = new Notification({
                userId: comment.user,
                senderId: req.userId,
                type: "reply",
                message: `${user.username} replied to your comment on "${thought.title}"`,
            });

            await notification.save();

            if (onlineUsers.has(comment.user.toString())) {
                io.to(onlineUsers.get(comment.user.toString())).emit("newNotification", notification);
            }
        }

        res.status(200).json({ message: "Reply added", reply });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});



// Like a comment
router.post("/:id/comment/:commentId/like", auth, async (req, res) => {
    try {
        const thought = await Thought.findById(req.params.id);
        if (!thought) {
            return res.status(404).json({ message: "Thought not found" });
        }

        const comment = thought.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const userIndex = comment.likes.indexOf(req.userId);
        const isLiked = userIndex === -1;

        if (isLiked) {
            comment.likes.push(req.userId);

            // Only create notification if it's not the author liking their own comment
            if (comment.user.toString() !== req.userId.toString()) {
                // Check if a similar notification already exists
                const existingNotification = await Notification.findOne({
                    userId: comment.user,
                    senderId: req.userId,
                    type: "like",
                    thoughtId: thought._id,
                    commentId: comment._id,
                });

                if (!existingNotification) {
                    const user = await User.findById(req.userId);
                    const notification = new Notification({
                        userId: comment.user,
                        senderId: req.userId,
                        type: "like",
                        thoughtId: thought._id,
                        commentId: comment._id,
                        message: `${user.username} liked your comment on "${thought.title}"`,
                    });

                    await notification.save();

                    const commentAuthorSocketId = onlineUsers.get(comment.user.toString());
                    if (commentAuthorSocketId) {
                        io.to(commentAuthorSocketId).emit("newNotification", notification);
                    }
                }
            }
        } else {
            comment.likes.splice(userIndex, 1);
        }

        await thought.save();
        res.status(200).json({ 
            message: isLiked ? "Comment liked" : "Comment unliked",
            liked: isLiked,
            likeCount: comment.likes.length
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Like a reply
router.post("/:id/comment/:commentId/reply/:replyId/like", auth, async (req, res) => {
    try {
        const thought = await Thought.findById(req.params.id);
        if (!thought) {
            return res.status(404).json({ message: "Thought not found" });
        }

        const comment = thought.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const reply = comment.replies.id(req.params.replyId);
        if (!reply) {
            return res.status(404).json({ message: "Reply not found" });
        }

        if (!reply.likes.includes(req.userId)) {
            reply.likes.push(req.userId);
            await thought.save();

            // Notify the reply owner if it's not the same person liking
            if (reply.user.toString() !== req.userId.toString()) {
                const notification = new Notification({
                    userId: reply.user, // Reply owner
                    senderId: req.userId, // User who liked the reply
                    type: "like",
                    message: "Someone liked your reply!",
                });

                await notification.save();

                if (onlineUsers.has(reply.user.toString())) {
                    io.to(onlineUsers.get(reply.user.toString())).emit("newNotification", notification);
                }
            }

            res.status(200).json({ message: "Reply liked" });
        } else {
            res.status(400).json({ message: "You already liked this reply" });
        }
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


// Get the previous thought
router.get('/previous/:id', async (req, res) => {
    try {
        const currentThought = await Thought.findById(req.params.id);
        if (!currentThought) {
            return res.status(404).json({ message: 'Thought not found' });
        }
        const previousThought = await Thought.findOne({ _id: { $lt: currentThought._id } }).sort({ _id: -1 });
        if (!previousThought) {
            return res.status(404).json({ message: 'No previous thought found' });
        }
        res.status(200).json(previousThought);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get the next thought
router.get('/next/:id', async (req, res) => {
    try {
        const currentThought = await Thought.findById(req.params.id);
        if (!currentThought) {
            return res.status(404).json({ message: 'Thought not found' });
        }
        const nextThought = await Thought.findOne({ _id: { $gt: currentThought._id } }).sort({ _id: 1 });
        if (!nextThought) {
            return res.status(404).json({ message: 'No next thought found' });
        }
        res.status(200).json(nextThought);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.delete("/:id/comment/:commentId", auth, async (req, res) => {
    try {
        const thought = await Thought.findById(req.params.id);
        if (!thought) {
            return res.status(404).json({ message: "Thought not found" });
        }

        const comment = thought.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Check if the user is authorized to delete the comment
        if (comment.user.toString() !== req.userId) {
            return res.status(403).json({ message: "Not authorized to delete this comment" });
        }

        comment.remove();
        await thought.save();

        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Delete a reply
router.delete("/:id/comment/:commentId/reply/:replyId", auth, async (req, res) => {
    try {
        const thought = await Thought.findById(req.params.id);
        if (!thought) {
            return res.status(404).json({ message: "Thought not found" });
        }

        const comment = thought.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const reply = comment.replies.id(req.params.replyId);
        if (!reply) {
            return res.status(404).json({ message: "Reply not found" });
        }

        // Check if the user is authorized to delete the reply
        if (reply.user.toString() !== req.userId) {
            return res.status(403).json({ message: "Not authorized to delete this reply" });
        }

        reply.remove();
        await thought.save();

        res.status(200).json({ message: "Reply deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;
