import React, { useState, useEffect, useRef } from 'react';

const Chat = ({ socket, roomId, userId, username }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('chat-message');
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('chat-message', {
      roomId,
      userId,
      username,
      content: newMessage,
    });

    setNewMessage('');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-900/95 backdrop-blur-md border-l border-gray-700/50 shadow-2xl">
      <div className="p-4 border-b border-gray-700/50 bg-gray-800/40">
        <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
          <span>💬</span> Room Chat
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3 opacity-60">
            <span className="text-5xl filter grayscale">💭</span>
            <p className="font-medium">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMyMessage = msg.username === username;
            return (
              <div
                key={index}
                className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'} group`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] ${isMyMessage
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none'
                      : 'bg-gray-800/90 border border-gray-700 text-gray-100 rounded-bl-none'
                    }`}
                >
                  {!isMyMessage && (
                    <p className="text-xs font-bold text-indigo-400 mb-1 flex items-center gap-1">
                      {msg.username}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-light">
                    {msg.content}
                  </p>
                  <p
                    className={`text-[10px] mt-1.5 text-right font-medium tracking-wide ${isMyMessage ? 'text-indigo-200/80' : 'text-gray-500'
                      }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-gray-800/40 border-t border-gray-700/50 backdrop-blur-sm">
        <div className="flex gap-2 items-center relative">
          <input
            type="text"
            className="flex-1 bg-gray-900/60 border border-gray-600 text-white placeholder-gray-500 rounded-full pl-5 pr-12 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 p-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 transition-all disabled:opacity-0 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/25 transform active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
