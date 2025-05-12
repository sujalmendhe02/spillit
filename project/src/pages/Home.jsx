import { useEffect, useState, useContext } from "react";
import ThoughtCard from "../component/Thoughtcard";
import CreateThought from "../component/CreateThought";
import ChatModal from "../component/ChatModel";
import { MessageCircle } from "lucide-react";
import AuthContext from "../AuthContext"; // Import authentication context

function HomePage() {
  const { user } = useContext(AuthContext); // Get user authentication state
  const [thoughts, setThoughts] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThoughts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/thoughts");
        const data = await response.json();
        setThoughts(data);
      } catch (error) {
        console.error("Error fetching thoughts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchThoughts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 relative pt-16">
      {/* Show Message Icon Only if User is Logged In */}
      {user && (
        <button
          onClick={() => setShowChat(!showChat)}
          className="fixed top-20 left-4 bg-gray-800 text-white rounded-full p-3 shadow-lg hover:bg-gray-900 transition"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Sidebar for Messages (Only for Logged-in Users) */}
      {user && showChat && (
        <div className="fixed top-20 left-0 h-full bg-white shadow-lg transform transition-transform w-64 p-4">
          <ChatModal onClose={() => setShowChat(false)} />
        </div>
      )}

      {/* Main Content (Centered) */}
      <div className="w-full max-w-4xl pt-45 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Browse what other think about particular Book</h1>

        {/* Loading Indicator */}
        {loading && <div className="text-center text-gray-500">Loading...</div>}

        {/* Thought Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-20">
          {thoughts.length > 0 ? (
            thoughts.map((thought) => <ThoughtCard key={thought._id} thought={thought} />)
          ) : (
            !loading && <p className="text-gray-600">No thoughts available.</p>
          )}
        </div>
      </div>

      {/* Show Create Thought Button Only if User is Logged In */}
      {user && (
        <button
        onClick={() => setShowCreate(true)}
        className="fixed top-20 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition"
      >
        + Thought
      </button>
      
      )}

      {showCreate && <CreateThought onClose={() => setShowCreate(false)} />}
    </div>
  );
}

export default HomePage;
