import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaHeart, FaPaperPlane } from "react-icons/fa";

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
    const [taggedUser, setTaggedUser] = useState({});
    const userId = "USER_ID"; // Replace with actual user ID from auth context

    const refreshPage = () => {
        navigate(0); // This reloads the current page
    };

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


    useEffect(() => {
        
        const checkIfLiked = (thought, userId) => {
            return thought.likes?.includes(userId);
        };
        
        const fetchThought = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/thoughts/${id}`);
                setThought(res.data);
                setLiked(checkIfLiked(res.data, userId));
                setLikeCount(res.data.likes?.length || 0);
            } catch (err) {
                setError("Failed to load thought");
            } finally {
                setLoading(false);
            }
        };
        fetchThought();
    }, [id]);

    const handleLikeToggle = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                `http://localhost:5000/api/thoughts/${thought._id}/toggle-like`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (response.data) {
                setLiked(response.data.liked);
                setLikeCount(response.data.likeCount);
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    const handleComment = async () => {
        if (!commentText.trim()) return;
        try {
            const res = await axios.post(
                `http://localhost:5000/api/thoughts/${thought._id}/comment`,
                { text: commentText },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            setThought((prev) => ({
                ...prev,
                comments: [...prev.comments, res.data],
            }));
            setCommentText("");
        } catch (error) {
            console.error("Error adding comment:", error);
        }
        refreshPage();
    };

    const handleReply = async (commentId) => {
        if (!replyText[commentId]?.trim()) return;
        try {
            const res = await axios.post(
                `http://localhost:5000/api/thoughts/${id}/comment/${commentId}/reply`,
                {
                    text: replyText[commentId],
                    taggedUsername: taggedUser[commentId] || null,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            setThought((prev) => ({
                ...prev,
                comments: prev.comments.map((comment) =>
                    comment._id === commentId
                        ? { ...comment, replies: [...comment.replies, res.data] }
                        : comment
                ),
            }));
            setReplyText((prev) => ({ ...prev, [commentId]: "" }));
            setTaggedUser((prev) => ({ ...prev, [commentId]: "" }));
        } catch (error) {
            console.error("Error replying to comment:", error);
        }
        refreshPage();
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="max-w-2xl mx-auto p-4 border rounded shadow-lg bg-white">
            <h1 className="text-2xl pt-20 font-bold mb-2">{thought.title}</h1>
            <p className="text-gray-600 mb-4">By {thought.author?.username || "Unknown"}</p>
            <p className="mb-4">{thought.content}</p>

            <div className="mt-6 flex items-center space-x-2">
                <button onClick={handleLikeToggle} className="flex items-center space-x-2">
                    <FaHeart className={liked ? "text-red-600" : "text-gray-400"} />
                    <span>{likeCount}</span>
                </button>
            </div>

            <div className="mt-4">
                <h3 className="text-lg font-semibold">Book Mentioned:</h3>
                {thought.book && thought.book.length > 0 ? (
                    <ul className="list-disc ml-5">
                        {thought.book.map((b, index) => (
                            <li key={index}>
                                <strong>{b.title}</strong> by {b.author} {b.tags.length > 0 && `(${b.tags.join(', ')})`}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No books mentioned.</p>
                )}
            </div>


            {/* Comments Section */}
            <div className="mt-6">
                <h3 className="text-lg font-semibold">Comments:</h3>
                {thought.comments.length > 0 ? (
                    <ul className="mt-2 space-y-4">
                        {thought.comments.map((comment) => (
                            <li key={comment._id} className="p-3 border rounded-lg">
                                <p>
                                    <strong>{comment.user?.username || "Anonymous"}:</strong>{" "}
                                    {comment.text}
                                </p>
                                {/* Replies */}
                                {comment.replies.length > 0 && (
                                    <ul className="mt-2 ml-4 border-l pl-4">
                                        {comment.replies.map((reply) => (
                                            <li key={reply._id} className="text-sm">
                                                <strong>{reply.user?.username || "Anonymous"}:</strong>{" "}
                                                {reply.taggedUsername && (
                                                    <span className="text-blue-500">@{reply.taggedUsername} </span>
                                                )}
                                                {reply.text}
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {/* Reply Box */}
                                <div className="mt-2 flex space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Reply..."
                                        value={replyText[comment._id] || ""}
                                        onChange={(e) =>
                                            setReplyText({ ...replyText, [comment._id]: e.target.value })
                                        }
                                        className="border p-1 rounded w-full text-sm"
                                    />
                                   
                                    <button onClick={() => handleReply(comment._id)} className="ml-2 text-blue-500">
                                        <FaPaperPlane />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No comments yet.</p>
                )}
            </div>

            {/* Comment Box */}
            <div className="mt-4 flex items-center space-x-2">
                <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full border p-1 rounded text-sm"
                />
                <button onClick={handleComment} className="text-blue-500">
                    <FaPaperPlane />
                </button>
            </div>
        </div>
    );
};

export default ThoughtDetail;
