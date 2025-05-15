import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { FaHeart, FaPaperPlane, FaTrash, FaThumbsUp } from "react-icons/fa";
import AuthContext from "../AuthContext";

const ThoughtDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [thought, setThought] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [commentText, setCommentText] = useState("");
    const [replyText, setReplyText] = useState({});
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchThought = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/thoughts/${id}`);
                setThought(res.data);
                setLiked(res.data.likes?.includes(user?._id));
                setLikeCount(res.data.likes?.length || 0);
            } catch (err) {
                setError("Failed to load thought");
            } finally {
                setLoading(false);
            }
        };
        fetchThought();
    }, [id, user]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'ArrowLeft') {
                // Navigate to the previous blog
                navigateToPreviousBlog();
            } else if (event.key === 'ArrowRight') {
                // Navigate to the next blog
                navigateToNextBlog();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [thought]);

    const refreshPage = () => {
        navigate(0);
    };

    const navigateToPreviousBlog = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/thoughts/previous/${id}`);
            if (res.data && res.data._id) {
                navigate(`/thought/${res.data._id}`);
            }
        } catch (err) {
            console.error('Error fetching previous thought:', err);
        }
    };

    const navigateToNextBlog = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/thoughts/next/${id}`);
            if (res.data && res.data._id) {
                navigate(`/thought/${res.data._id}`);
            }
        } catch (err) {
            console.error('Error fetching next thought:', err);
        }
    };

    const handleLikeToggle = async () => {
        if (!user) {
            navigate("/login");
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/api/thoughts/${id}/toggle-like`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const { liked: isLiked, likeCount: newLikeCount } = response.data;
            setLiked(isLiked);
            setLikeCount(newLikeCount);
            refreshPage();
            //toast.success(isLiked ? "Thought liked!" : "Thought unliked");
        } catch (error) {
            console.error("Error toggling like:", error);
            toast.error("Failed to update like");
        }
    };

    const handleComment = async () => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (!commentText.trim()) return;

        try {
            await axios.post(
                `http://localhost:5000/api/thoughts/${id}/comment`,
                { text: commentText },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const res = await axios.get(`http://localhost:5000/api/thoughts/${id}`);
            setThought(res.data);
            setCommentText("");
            refreshPage();
            //toast.success("Comment added successfully!");
        } catch (error) {
            console.error("Error adding comment:", error);
            toast.error("Failed to add comment");
        }
    };


    const handleReply = async (commentId) => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (!replyText[commentId]?.trim()) return;

        try {
            await axios.post(
                `http://localhost:5000/api/thoughts/${id}/comment/${commentId}/reply`,
                { text: replyText[commentId] },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            // Refresh thought data
            const res = await axios.get(`http://localhost:5000/api/thoughts/${id}`);
            setThought(res.data);
            setReplyText({ ...replyText, [commentId]: "" });
            refreshPage();
        } catch (error) {
            console.error("Error adding reply:", error);
        }
    };

    const handleLikeComment = async (commentId) => {
        if (!user) {
            navigate("/login");
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/api/thoughts/${id}/comment/${commentId}/like`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const { liked: isLiked } = response.data;
            const res = await axios.get(`http://localhost:5000/api/thoughts/${id}`);
            setThought(res.data);
            refreshPage();
            toast.success(isLiked ? "Comment liked!" : "Comment unliked");
        } catch (error) {
            console.error("Error liking comment:", error);
            toast.error("Failed to update like");
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!user) return;

        try {
            await axios.delete(
                `http://localhost:5000/api/thoughts/${id}/comment/${commentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            // Refresh thought data
            const res = await axios.get(`http://localhost:5000/api/thoughts/${id}`);
            setThought(res.data);
            refreshPage();
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    const handleDeleteReply = async (commentId, replyId) => {
        if (!user) return;

        try {
            await axios.delete(
                `http://localhost:5000/api/thoughts/${id}/comment/${commentId}/reply/${replyId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            // Refresh thought data
            const res = await axios.get(`http://localhost:5000/api/thoughts/${id}`);
            setThought(res.data);
            refreshPage();
        } catch (error) {
            console.error("Error deleting reply:", error);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
    if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
    if (!thought) return <div className="text-center p-4">Thought not found</div>;

    return (
        <div className="max-w-2xl mx-auto p-4 pt-20">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-2">{thought.title}</h1>
                <p className="text-gray-600 mb-4">By {thought.author?.username || "Unknown"}</p>
                <p className="mb-4">{thought.content}</p>

                <div className="flex items-center space-x-4 mb-6">
                    <button
                        onClick={handleLikeToggle}
                        className={`flex items-center space-x-2 ${liked ? 'text-red-500' : 'text-gray-500'}`}
                    >
                        <FaHeart className={liked ? 'fill-current' : ''} />
                        <span>{likeCount}</span>
                    </button>
                </div>

                <div className="mt-4">
                    <h3 className="text-lg font-semibold">Book Mentioned:</h3>
                    {thought.book && thought.book.length > 0 ? (
                        <ul className="list-disc ml-5">
                            {thought.book.map((b, index) => (
                                <li key={index}>
                                    <strong>{b.title}</strong> by {b.author} {b.tags?.length > 0 && `(${b.tags.join(', ')})`}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No books mentioned.</p>
                    )}
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Comments</h3>

                    <div className="flex space-x-2 mb-6">
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 p-2 border rounded-lg"
                        />
                        <button
                            onClick={handleComment}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            <FaPaperPlane />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {thought.comments?.map((comment) => (
                            <div key={comment._id} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{comment.username}</p>
                                        <p className="mt-1">{comment.text}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleLikeComment(comment._id)}
                                            className={`p-1 ${comment.likes?.includes(user?._id) ? 'text-red-500' : 'text-gray-500'}`}
                                        >
                                            <FaHeart className={comment.likes?.includes(user?._id) ? 'fill-current' : ''} />
                                            <span className="ml-1">{comment.likes?.length || 0}</span>
                                        </button>

                                        {user?._id === comment.user && (
                                            <button
                                                onClick={() => handleDeleteComment(comment._id)}
                                                className="p-1 text-red-500 hover:text-red-700"
                                            >
                                                <FaTrash />
                                            </button>
                                        )}

                                    </div>
                                </div>
                                {/* Replies */}
                                <div className="ml-8 mt-2 space-y-2">
                                    {comment.replies?.map((reply) => (
                                        <div key={reply._id} className="bg-white p-2 rounded">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-sm">{reply.user?.username}</p>
                                                    <p className="text-sm">{reply.text}</p>
                                                </div>
                                                {user?._id === reply.user && (
                                                    <button
                                                        onClick={() => handleDeleteReply(comment._id, reply._id)}
                                                        className="p-1 text-red-500 hover:text-red-700"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Reply */}
                                <div className="mt-2 ml-8 flex space-x-2">
                                    <input
                                        type="text"
                                        value={replyText[comment._id] || ''}
                                        onChange={(e) => setReplyText({ ...replyText, [comment._id]: e.target.value })}
                                        placeholder="Reply to this comment..."
                                        className="flex-1 p-1 text-sm border rounded"
                                    />
                                    <button
                                        onClick={() => handleReply(comment._id)}
                                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        <FaPaperPlane />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThoughtDetail;