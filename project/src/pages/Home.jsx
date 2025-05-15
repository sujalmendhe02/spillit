import { useEffect, useState, useContext } from "react";
import ThoughtCard from "../component/Thoughtcard";
import CreateThought from "../component/CreateThought";
import ChatModal from "../component/ChatModel";
import { MessageCircle } from "lucide-react";
import AuthContext from "../AuthContext";

function HomePage() {
  const { user } = useContext(AuthContext);
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
      {/* Chat Button and Modal */}
      {user && (
        <>
          <button
            onClick={() => setShowChat(!showChat)}
            className="fixed top-20 left-20 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition z-50"
          >
            <MessageCircle size={24} />
          </button>
          {showChat && <ChatModal />}
        </>
      )}

      {/* Main Content */}
      <div className="w-full max-w-4xl pt-45 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Browse what others think about particular Books</h1>

        {/* Loading Indicator */}
        {loading && <div className="text-center text-gray-500">Loading...</div>}

        {/* Thought Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-20">
          {thoughts.length > 0 ? (
            thoughts.map((thought) => <ThoughtCard key={thought._id} thought={thought} userId={user?._id} />)
          ) : (
            !loading && <p className="text-gray-600">No thoughts available.</p>
          )}
        </div>
      </div>

      {/* Create Thought Button */}
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