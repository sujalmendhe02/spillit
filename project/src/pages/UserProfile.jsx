import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from "../AuthContext";
import axios from 'axios';
import ThoughtCard from '../component/Thoughtcard';

function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [userThoughts, setUserThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const [userRes, thoughtsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/auth/user/${id}`),
          axios.get(`http://localhost:5000/api/thoughts/user/${id}`)
        ]);

        setUserData(userRes.data);
        setUserThoughts(thoughtsRes.data);
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
    <div className="max-w-7xl mx-auto px-4 py-6 pt-20">
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-xl font-bold">{userData.username}</h2>
            <p className="text-sm text-gray-600">{userData.email}</p>
            {userData.bio && <p className="mt-1 text-gray-700">{userData.bio}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {userThoughts.length > 0 ? (
          userThoughts.map((thought) => (
            <div key={thought._id} className="relative">
              <ThoughtCard thought={thought} userId={user?._id} />
            </div>
          ))
        ) : (
          <p className="text-gray-600 col-span-full text-center">No thoughts available.</p>
        )}
      </div>
    </div>
  );
}

export default UserProfile;