import mongoose from 'mongoose';
import replySchema from './Reply.js';

const thoughtSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 50 },
    content: { type: String, required: true, maxlength: 280 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    book: [
        {
            title: { type: String, required: true },
            author: { type: String, required: true },
            tags: [{ type: String }]
        }
    ],
    comments: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            username: { type: String, required: true }, // Store username for easy access
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
            likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            taggedUser: { 
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                username: { type: String } // Store tagged user's username
            },
            replies: [replySchema],  
        }
    ],
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Thought', thoughtSchema);
