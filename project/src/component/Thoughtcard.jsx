import { Link } from "react-router-dom";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { useState } from "react";

function ThoughtCard({ thought, userId }) {
  if (!thought || !thought.title) {
    console.error("ThoughtCard received an undefined or incomplete thought:", thought);
    return null; // Prevents the component from rendering
  }

  const [liked, setLiked] = useState(thought.likes?.includes(userId)); // Check if user liked the thought
  const [likeCount, setLikeCount] = useState(thought.likes?.length || 0);

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
        setLiked(data.liked); // Set state based on response
        setLikeCount(data.likeCount); // Update like count dynamically
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
      className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow"
    >
      {/* Thought Title */}
      <h3 className="text-lg font-semibold text-gray-900">{thought.title?.slice(0, 50) || "Untitled"}...</h3>

      {/* Book List (if available) */}
      {Array.isArray(thought.book) && thought.book.length > 0 ? (
        <ul className="list-disc ml-5 text-sm text-gray-700">
          {thought.book.map((b, index) => (
            <li key={index}>
              <strong>{b.title}</strong> by {b.author} {b.tags?.length > 0 && `(${b.tags.join(', ')})`}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No books mentioned.</p>
      )}

      {/* Actions: Like, Comment, Share */}
      <div className="mt-3 flex justify-between items-center text-sm text-gray-600">
        <button onClick={handleLikeToggle} className="flex items-center space-x-1 hover:text-red-500">
          <Heart className={`h-4 w-4 transition-colors ${liked ? "text-red-500 fill-red-500" : "text-gray-500"}`} />
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
