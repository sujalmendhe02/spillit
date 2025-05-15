import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
    const userId = user?._id?.toString();

    const fetchThought = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/thoughts/${id}`);
            setThought(res.data);
            const isLiked = res.data.likes?.some(like => like._id === user?._id);
            setLiked(isLiked);
            setLikeCount(res.data.likes?.length || 0);
        } catch (err) {
            setError("Failed to load thought");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchThought();
        }
    }, [id, user]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'ArrowLeft') {
                navigateToPreviousBlog();
            } else if (event.key === 'ArrowRight') {
                navigateToNextBlog();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [thought]);

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
            await fetchThought();
        } catch (error) {
            console.error("Error toggling like:", error);
            toast.error("Failed to update like");
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
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

            setCommentText("");
            await fetchThought();
            toast.success("Comment added successfully!");
        } catch (error) {
            console.error("Error adding comment:", error);
            toast.error("Failed to add comment");
        }
    };

    const handleReply = async (commentId, e) => {
        e.preventDefault();
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

            setReplyText({ ...replyText, [commentId]: "" });
            await fetchThought();
            toast.success("Reply added successfully!");
        } catch (error) {
            console.error("Error adding reply:", error);
            toast.error("Failed to add reply");
        }
    };

    const handleLikeComment = async (commentId) => {
        if (!user) {
            navigate("/login");
            return;
        }

        try {
            await axios.post(
                `http://localhost:5000/api/thoughts/${id}/comment/${commentId}/like`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            await fetchThought();
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

            await fetchThought();
            toast.success("Comment deleted successfully!");
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast.error("Failed to delete comment");
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

            await fetchThought();
            toast.success("Reply deleted successfully!");
        } catch (error) {
            console.error("Error deleting reply:", error);
            toast.error("Failed to delete reply");
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
    if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
    if (!thought) return <div className="text-center p-4">Thought not found</div>;

    return (
        <div className="max-w-2xl mx-auto p-4 pt-20">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-2">{thought.title}</h1>
                <Link to={`/user/${thought.author?._id}`} className="text-blue-600 hover:text-blue-800 mb-4 block">
                    {thought.author?.username || "Unknown"}
                </Link>
                <p className="mb-4">{thought.content}</p>

                <div className="flex items-center space-x-4 mb-6">
                    <button
                        onClick={handleLikeToggle}
                        className={`flex items-center space-x-2 ${liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors`}
                    >
                        <FaHeart className={`${liked ? 'fill-current' : ''}`} />
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

                    <form onSubmit={handleComment} className="flex space-x-2 mb-6">
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 p-2 border rounded-lg"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            <FaPaperPlane />
                        </button>
                    </form>

                    <div className="space-y-4">
                        {thought.comments?.map((comment) => (
                            <div key={comment._id} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Link to={`/user/${comment.user?._id}`} className="font-semibold text-blue-600 hover:text-blue-800">
                                            {comment.username}
                                        </Link>
                                        <p className="mt-1">{comment.text}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleLikeComment(comment._id)}
                                            className={`p-1 ${comment.likes?.some(like => like._id === user?._id) ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors`}
                                        >
                                            <FaHeart className={comment.likes?.some(like => like._id === user?._id) ? 'fill-current' : ''} />
                                            <span className="ml-1">{comment.likes?.length || 0}</span>
                                        </button>

                                        {userId && comment.user?.toString() === userId && (
                                            <button
                                                onClick={() => handleDeleteComment(comment._id)}
                                                className="p-1 text-red-500 hover:text-red-700 transition-colors"
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
                                                    <Link to={`/user/${reply.user?._id}`} className="font-semibold text-sm text-blue-600 hover:text-blue-800">
                                                        {reply.user?.username}
                                                    </Link>
                                                    <p className="text-sm">{reply.text}</p>
                                                </div>
                                                {userId && reply.user?.toString() === userId && (
                                                    <button
                                                        onClick={() => handleDeleteReply(comment._id, reply._id)}
                                                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Reply */}
                                <form onSubmit={(e) => handleReply(comment._id, e)} className="mt-2 ml-8 flex space-x-2">
                                    <input
                                        type="text"
                                        value={replyText[comment._id] || ''}
                                        onChange={(e) => setReplyText({ ...replyText, [comment._id]: e.target.value })}
                                        placeholder="Reply to this comment..."
                                        className="flex-1 p-1 text-sm border rounded"
                                    />
                                    <button
                                        type="submit"
                                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        <FaPaperPlane />
                                    </button>
                                </form>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThoughtDetail;