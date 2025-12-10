import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import VideoCall from './VideoCall';
import Chat from './Chat';
import DocumentEditor from './DocumentEditor';

const StudyRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('video'); // video, chat, document

  const fetchRoomDetails = useCallback(async () => {
    try {
      const response = await api.get(`/rooms/${id}`);
      setRoom(response.data.room);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching room:', error);
      alert('Room not found');
      navigate('/dashboard');
    }
  }, [id, navigate]);

  const initializeSocket = useCallback(() => {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      newSocket.emit('join-room', {
        roomId: id,
        userId: user.id,
        username: user.username,
      });
    });

    setSocket(newSocket);
  }, [id, user.id, user.username]);

  useEffect(() => {
    fetchRoomDetails();
    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fetchRoomDetails, initializeSocket]);

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', { roomId: id });
      socket.disconnect();
    }
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading room...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{room?.name}</h1>
            <p className="text-sm text-gray-400">
              Room Code: <span className="text-indigo-400 font-mono">{room?.code}</span>
            </p>
          </div>
          <button onClick={handleLeaveRoom} className="btn-secondary">
            Leave Room
          </button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="lg:hidden bg-gray-800 border-b border-gray-700 flex">
        <button
          onClick={() => setActiveTab('video')}
          className={`flex-1 py-3 ${activeTab === 'video' ? 'bg-indigo-600' : 'bg-gray-800'
            }`}
        >
          Video
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 ${activeTab === 'chat' ? 'bg-indigo-600' : 'bg-gray-800'
            }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('document')}
          className={`flex-1 py-3 ${activeTab === 'document' ? 'bg-indigo-600' : 'bg-gray-800'
            }`}
        >
          Notes
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Section */}
        <div
          className={`flex-1 ${activeTab === 'video' ? 'block' : 'hidden'
            } lg:block`}
        >
          <VideoCall
            socket={socket}
            roomId={id}
            userId={user.id}
            username={user.username}
          />
        </div>

        {/* Sidebar - Desktop */}
        <div className="hidden lg:flex lg:w-96 border-l border-gray-700">
          <div className="flex-1 flex flex-col">
            {/* Tab Buttons */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 ${activeTab === 'chat' ? 'bg-indigo-600' : 'bg-gray-800'
                  }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('document')}
                className={`flex-1 py-3 ${activeTab === 'document' ? 'bg-indigo-600' : 'bg-gray-800'
                  }`}
              >
                Notes
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'chat' && (
                <Chat
                  socket={socket}
                  roomId={id}
                  userId={user.id}
                  username={user.username}
                />
              )}
              {activeTab === 'document' && (
                <DocumentEditor
                  socket={socket}
                  roomId={id}
                  initialContent={room?.documentContent || ''}
                />
              )}
            </div>
          </div>
        </div>

        {/* Mobile - Chat/Document */}
        <div
          className={`flex-1 ${activeTab === 'chat' || activeTab === 'document' ? 'block' : 'hidden'
            } lg:hidden`}
        >
          {activeTab === 'chat' && (
            <Chat
              socket={socket}
              roomId={id}
              userId={user.id}
              username={user.username}
            />
          )}
          {activeTab === 'document' && (
            <DocumentEditor
              socket={socket}
              roomId={id}
              initialContent={room?.documentContent || ''}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyRoom;
