import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const { token } = useAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const [userRes, thoughtsRes] = await Promise.all([
          axios.get(`http://localhost:500/api/auth/user/${id}`),
          axios.get(`http://localhost:500/api/thoughts/user/${id}`)
        ]);

        setUserData(userRes.data);
        setThoughts(thoughtsRes.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load user profile.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserProfile();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-700">Loading user profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-4 bg-red-100 text-red-800 rounded shadow">
        <h2 className="text-lg font-semibold">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-4 bg-yellow-100 text-yellow-800 rounded shadow">
        <h2 className="text-lg font-semibold">User Not Found</h2>
        <p>This user does not exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <img
            src={userData.avatar || '/default-avatar.png'}
            alt="avatar"
            className="w-20 h-20 rounded-full object-cover"
          />
          <div>
            <h2 className="text-xl font-bold">{userData.username}</h2>
            <p className="text-sm text-gray-600">{userData.email}</p>
            {userData.bio && <p className="mt-1 text-gray-700">{userData.bio}</p>}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-2xl font-semibold mb-4">
            {thoughts.length > 0 ? 'Thoughts' : 'No thoughts posted yet'}
          </h3>
          <div className="space-y-4">
            {thoughts.map((thought) => (
              <div key={thought._id} className="bg-gray-50 p-4 rounded shadow">
                <h4 className="text-lg font-bold">{thought.title}</h4>
                <p className="mt-2 text-gray-700">{thought.content}</p>

                {thought.book?.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium text-sm text-blue-800">Books referenced:</p>
                    <ul className="list-disc list-inside text-sm text-blue-700">
                      {thought.book.map((b, idx) => (
                        <li key={idx}>
                          {b.title} by {b.author}
                          {b.tags?.length > 0 && (
                            <span className="text-gray-500"> [Tags: {b.tags.join(', ')}]</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-2 text-sm text-gray-600">
                  ❤️ {thought.likes.length} {thought.likes.length === 1 ? 'Like' : 'Likes'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
