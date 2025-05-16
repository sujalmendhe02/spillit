import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { User, Edit, Trash } from "lucide-react";
import ThoughtCard from "../component/Thoughtcard";
import AuthContext from "../AuthContext";

function Profile() {
  const { user, token, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [userThoughts, setUserThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserData(response.data);
        setUsername(response.data.username || "");
        setBio(response.data.bio || "");
        setAvatar(response.data.avatar || "");
        setUserThoughts(response.data.thoughts || []);
      } catch (err) {
        setError("Failed to fetch your profile");
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, token, navigate]);

  const handleUpdateProfile = async () => {
    try {
      const response = await axios.put(
        "http://localhost:5000/api/auth/profile",
        { username, bio, avatar },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUserData(response.data);
      updateUser(response.data);
      setEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.response?.data?.message || "Failed to update profile.");
    }
  };

  const handleDeleteThought = async (thoughtId) => {
    try {
      await axios.delete(`http://localhost:5000/api/thoughts/${thoughtId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserThoughts((prevThoughts) => prevThoughts.filter((thought) => thought._id !== thoughtId));
    } catch (err) {
      console.error("Error deleting thought:", err);
      setError("Failed to delete thought.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!userData) return <p className="text-center text-red-500">{error || "No user data found."}</p>;

  return (
    <div className="max-w-7xl pt-20 mx-auto space-y-8 px-4 md:px-6 lg:px-8">
      {/* Profile Information */}
      <div className="bg-white p-8 rounded-lg shadow-md flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
        <div className="flex items-center space-x-4">
          {userData.avatar ? (
            <img src={userData.avatar} alt="Profile" className="h-16 w-16 rounded-full border" />
          ) : (
            <User className="h-16 w-16 text-gray-400" />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{userData.username}</h1>
            {userData.bio && <p className="text-gray-600 mt-2">{userData.bio}</p>}
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="ml-auto p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2">
          <Edit className="h-5 w-5" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Thoughts Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {userThoughts.length > 0 ? (
          userThoughts.map((thought) => (
            <div key={thought._id} className="relative">
              <ThoughtCard thought={thought} userId={user?._id} />
              <button
                onClick={() => handleDeleteThought(thought._id)}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          !loading && <p className="text-gray-600 col-span-full text-center">No thoughts available.</p>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full sm:w-96">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 p-2 border rounded w-full"
            />

            <label className="block mt-4 text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-2 p-2 border rounded w-full"
              rows="3"
            />

            <div className="flex justify-end mt-4 space-x-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
                Cancel
              </button>
              <button onClick={handleUpdateProfile} className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;