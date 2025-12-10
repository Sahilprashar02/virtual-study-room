import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data.rooms);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to load rooms');
      setLoading(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    try {
      const response = await api.get(`/rooms/code/${roomCode}`);
      if (response.data.room) {
        navigate(`/room/${response.data.room.id}`);
      }
    } catch (error) {
      setError('Room not found with this code');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 fade-in">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Virtual Study Rooms
            </h1>
            <p className="text-gray-400 mt-2">Welcome back, {user?.username}!</p>
          </div>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="glass-effect rounded-xl p-6 fade-in">
            <h2 className="text-xl font-semibold mb-4">Create New Room</h2>
            <button
              onClick={() => navigate('/create-room')}
              className="btn-primary w-full"
            >
              + Create Study Room
            </button>
          </div>

          <div className="glass-effect rounded-xl p-6 fade-in">
            <h2 className="text-xl font-semibold mb-4">Join with Code</h2>
            <form onSubmit={handleJoinByCode} className="flex gap-2">
              <input
                type="text"
                className="input-field flex-1"
                placeholder="Enter 6-digit code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                maxLength="6"
              />
              <button type="submit" className="btn-primary">
                Join
              </button>
            </form>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
        </div>

        {/* Active Rooms */}
        <div className="fade-in">
          <h2 className="text-2xl font-bold mb-4">Active Study Rooms</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.length === 0 ? (
              <p className="text-gray-400 col-span-full text-center py-8">
                No active rooms. Create one to get started!
              </p>
            ) : (
              rooms.map((room) => (
                <div
                  key={room._id}
                  className="card cursor-pointer"
                  onClick={() => navigate(`/room/${room._id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold">{room.name}</h3>
                    <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm">
                      {room.code}
                    </span>
                  </div>
                  <div className="text-gray-400 text-sm space-y-1">
                    <p>Host: {room.host?.username || 'Unknown'}</p>
                    <p>Participants: {room.participants?.length || 0}</p>
                    <p className="text-xs">
                      Created: {new Date(room.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
