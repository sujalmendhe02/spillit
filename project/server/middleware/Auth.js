import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    console.log("Received Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: 'Access Denied: No Token Provided' });
    }

    try {
        // Extract token correctly
        const token = authHeader.split(" ")[1]; 
        console.log("Extracted Token:", token);

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded);

        // Ensure `decoded` contains `_id`
        if (!decoded._id) {
            return res.status(401).json({ message: 'Invalid Token: Missing user ID' });
        }

        // Attach `userId` to request for further use
        req.userId = decoded._id;
        console.log("Extracted User ID:", req.userId);

        next(); // Continue to next middleware or route
    } catch (err) {
        console.error("JWT Verification Error:", err);
        res.status(401).json({ message: 'Invalid Token' });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select('-password')
            .populate({
                path: 'thoughts',
                model: 'Thought',
                select: 'title content createdAt',
            });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createThought = async (req, res) => {
    try {
        const { title, content, book } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required." });
        }

        // Create a new thought and save it
        const newThought = await Thought.create({
            title,
            content,
            author: req.userId,
            book: book || [],
        });

        // Find the user and update their thoughts array during thought creation
        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            { $push: { thoughts: newThought._id } }, // Push new thought's ID into thoughts array
            { new: true, useFindAndModify: false }
        ).populate('thoughts'); // Populate to confirm update

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(201).json({ message: 'Thought created successfully', thought: newThought, user: updatedUser });
    } catch (error) {
        console.error('Error creating thought:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



export { auth, getProfile, createThought };
