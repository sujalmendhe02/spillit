import express from 'express';
import passport from 'passport';
import User from '../models/User.js'; // User model where user info is stored
import jwt from 'jsonwebtoken';
import { auth, getProfile, createThought } from '../middleware/Auth.js';

const router = express.Router();

// Register a new user (Email/Password)
router.post("/register", async (req, res) => {
    const { email, username, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // Create and save new user
        const user = new User({ email, username, password });
        await user.save();

        // Generate token
        const token = await user.generateAuthToken();

        // Return user info with token
        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                _id: user._id,
                email: user.email,
                username: user.username,
            },
        });
    } catch (err) {
        res.status(400).json({ message: "Error registering user", error: err.message });
    }
});

// Login a user (Email/Password)
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user || !(await user.isPasswordCorrect(password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate token
        const token = await user.generateAuthToken();

        // Return user info with token
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                email: user.email,
                username: user.username,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Google OAuth: Route to initiate Google login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback route
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), async (req, res) => {
    // Successfully authenticated with Google
    try {
        let user = await User.findOne({ email: req.user.email });
        if (!user) {
            // If the user does not exist, create a new one
            user = new User({
                email: req.user.email,
                username: req.user.displayName, // You can customize this
            });
            await user.save();
        }

        const token = await user.generateAuthToken();
        res.status(200).json({ message: 'Google sign-in successful', token });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.get("/me", auth, async (req, res) => {
    try {
        console.log("Authenticated User ID:", req.userId); // Debugging

        // Fetch user without the password field
        const user = await User.findById(req.userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get('/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId)
      .select('-password -tokens') // exclude sensitive data
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/profile', auth, async (req, res) => {
    try {
        console.log("User ID from auth middleware:", req.userId);

        if (!req.userId) {
            return res.status(401).json({ message: 'Unauthorized: No user ID found' });
        }

        const user = await User.findById(req.userId)
            .select('-password -tokens')
            .populate({
                path: 'thoughts',
                select: 'title content createdAt likes book comments',  // Select only content, createdAt, likes, book, and comments
                populate: [
                    {
                        path: 'book',  // Select fields inside the book array
                        select: 'title author tags'
                    },
                    {
                        path: 'comments.user',  // Select only the user field in comments
                        select: 'username'
                    },
                    {
                        path: 'comments.likes',  // Select likes for comments
                        select: 'username'
                    },
                    {
                        path: 'comments.replies.user',  // Select user in replies
                        select: 'username'
                    }
                ],
                options: { sort: { createdAt: -1 } }
            });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Ensure thoughts are always included
        const responseUser = {
            ...user.toObject(),
            thoughts: user.thoughts.length > 0 ? user.thoughts : [],
        };

        res.json(responseUser);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.put('/profile', auth, async (req, res) => {
    try {
        const { username, bio, avatar } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser && existingUser._id.toString() !== req.userId) {
            return res.status(400).json({ message: "Username already taken." });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            { username, bio, avatar },
            { new: true, select: '-password -tokens' } // Exclude sensitive fields
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



// 4️⃣ **Get Another User Profile by Username**
router.get('/profile/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password -tokens');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('User profile fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 5️⃣ **Update User Profile**
router.put('/profile', auth, async (req, res) => {
    try {
        const { username, avatar, bio } = req.body;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already taken' });
            }
            user.username = username;
        }

        if (avatar) user.avatar = avatar;
        if (bio) user.bio = bio;

        await user.save();

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/follow/:id', auth, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.userId);

        if (!userToFollow || !currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!currentUser.following.includes(userToFollow._id)) {
            currentUser.following.push(userToFollow._id);
            userToFollow.followers.push(currentUser._id);
            await currentUser.save();
            await userToFollow.save();
        }

        res.json({ message: 'User followed successfully' });
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 7️⃣ **Unfollow Another User**
router.post('/unfollow/:id', auth, async (req, res) => {
    try {
        const userToUnfollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.userId);

        if (!userToUnfollow || !currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        currentUser.following = currentUser.following.filter(id => id.toString() !== userToUnfollow._id.toString());
        userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUser._id.toString());

        await currentUser.save();
        await userToUnfollow.save();

        res.json({ message: 'User unfollowed successfully' });
    } catch (error) {
        console.error('Unfollow error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
