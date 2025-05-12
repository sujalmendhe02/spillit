import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// import Thought from './Thought';


const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    bio: { type: String },
    thoughts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thought' }],
    createdAt: { type: Date, default: Date.now },
    tokens: [
        {
            token: { type: String, required: true },
        },
    ],
});

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    this.tokens = this.tokens.concat({ token });
    await this.save();
    return token;
};

export default mongoose.model('User', userSchema);

