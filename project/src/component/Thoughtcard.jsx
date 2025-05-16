import { Link } from "react-router-dom";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { useState, useEffect } from "react";

function ThoughtCard({ thought, userId }) {
  if (!thought || !thought.title) {
    console.error("ThoughtCard received an undefined or incomplete thought:", thought);
    return null;
  }

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(thought.likes?.length || 0);

  useEffect(() => {
    setLiked(thought.likes?.includes(userId));
    setLikeCount(thought.likes?.length || 0);
  }, [thought.likes, userId]);

  const handleLikeToggle = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/thoughts/${thought._id}/toggle-like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikeCount(data.likeCount);
      } else {
        console.error("Failed to toggle like");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(`${window.location.origin}/thought/${thought._id}`);
    alert("Link copied to clipboard!");
  };

  return (
    <Link
      to={`/thought/${thought._id}`}
      className="block bg-white border rounded-lg p-4 hover:shadow-md transition-shadow h-full"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {thought.title?.slice(0, 50) || "Untitled"}...
      </h3>

      {Array.isArray(thought.book) && thought.book.length > 0 ? (
        <ul className="list-disc ml-5 text-sm text-gray-700 mb-4">
          {thought.book.map((b, index) => (
            <li key={index}>
              <strong>{b.title}</strong> by {b.author} {b.tags?.length > 0 && `(${b.tags.join(', ')})`}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 mb-4">No books mentioned.</p>
      )}

      <div className="mt-auto flex justify-between items-center text-sm text-gray-600">
        <button 
          onClick={handleLikeToggle} 
          className="flex items-center space-x-1 hover:text-red-500"
        >
          <Heart 
            className={`h-4 w-4 transition-colors ${liked ? "text-red-500 fill-current" : ""}`} 
          />
          <span>{likeCount}</span>
        </button>

        <button className="flex items-center space-x-1 hover:text-blue-500">
          <MessageSquare className="h-4 w-4" />
          <span>{thought.comments?.length || 0}</span>
        </button>

        <button onClick={handleShare} className="flex items-center space-x-1 hover:text-green-500">
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
      </div>
    </Link>
  );
}

export default ThoughtCard;