import React, { useState, useEffect, useRef } from 'react';

const VideoCall = ({ socket, roomId, userId, username }) => {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState(new Map());
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState(new Set()); // socketId set

  const localVideoRef = useRef();
  const peerConnections = useRef(new Map());
  const originalStream = useRef(null);
  const audioContext = useRef(null);
  const analysers = useRef(new Map()); // socketId -> AnalyserNode
  const animationRef = useRef();

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    // Initialize Audio Context
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    startActivityDetection();
    startLocalStream();

    return () => {
      stopLocalStream();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContext.current) audioContext.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!socket) return;

    // When someone joins, send them an offer
    socket.on('user-joined', async ({ socketId }) => {
      console.log('User joined:', socketId);
      await createPeerConnection(socketId, true);
    });

    // Handle existing participants
    socket.on('existing-participants', async (participants) => {
      console.log('Existing participants:', participants);
      for (const socketId of participants) {
        await createPeerConnection(socketId, true);
      }
    });

    // Receive video offer
    socket.on('video-offer', async ({ offer, from }) => {
      await handleReceiveOffer(offer, from);
    });

    // Receive video answer
    socket.on('video-answer', async ({ answer, from }) => {
      await handleReceiveAnswer(answer, from);
    });

    // Receive ICE candidate
    socket.on('ice-candidate', async ({ candidate, from }) => {
      await handleReceiveIceCandidate(candidate, from);
    });

    // User left
    socket.on('user-left', ({ socketId }) => {
      handleUserLeft(socketId);
    });

    return () => {
      socket.off('user-joined');
      socket.off('existing-participants');
      socket.off('video-offer');
      socket.off('video-answer');
      socket.off('ice-candidate');
      socket.off('user-left');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, localStream]);

  const startActivityDetection = () => {
    const checkAudioLevels = () => {
      const speakers = new Set();
      const threshold = 10; // Adjust based on sensitivity needs

      analysers.current.forEach((analyser, id) => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // Calculate average volume
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const average = sum / dataArray.length;

        if (average > threshold) {
          speakers.add(id);
        }
      });

      // Check local volume if mic is on
      if (isMicOn && localStream) {
        // Local analysis logic would go here if we wanted to highlight self
        // But usually we just highlight others. Let's stick to highlighting everyone including self if needed.
        // For now, let's keep it simple and highlight peers.
      }

      setActiveSpeakers(speakers);
      animationRef.current = requestAnimationFrame(checkAudioLevels);
    };

    checkAudioLevels();
  };

  const attachAnalyser = (stream, id) => {
    if (!audioContext.current || !stream.getAudioTracks().length) return;

    try {
      const source = audioContext.current.createMediaStreamSource(stream);
      const analyser = audioContext.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analysers.current.set(id, analyser);
    } catch (err) {
      console.error("Audio Context Error:", err);
    }
  };

  // ... (use previous useEffects for socket events) ...

  // Modified startLocalStream to attach analyser
  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      originalStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      // Attach analyser for local stream (id="local")
      attachAnalyser(stream, 'local');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  const stopLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    peerConnections.current.forEach((pc) => pc.close());
  };

  const createPeerConnection = async (socketId, createOffer) => {
    if (peerConnections.current.has(socketId)) return;

    const pc = new RTCPeerConnection(iceServers);
    peerConnections.current.set(socketId, pc);

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: socketId,
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setPeers((prev) => {
        const newPeers = new Map(prev);
        newPeers.set(socketId, { connection: pc, stream });
        return newPeers;
      });
      // Attach analyser for this peer
      attachAnalyser(stream, socketId);
    };

    // Create and send offer if initiator
    if (createOffer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('video-offer', {
        offer,
        to: socketId,
      });
    }
  };

  const handleReceiveOffer = async (offer, from) => {
    if (!peerConnections.current.has(from)) {
      await createPeerConnection(from, false);
    }

    const pc = peerConnections.current.get(from);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('video-answer', {
      answer,
      to: from,
    });
  };

  const handleReceiveAnswer = async (answer, from) => {
    const pc = peerConnections.current.get(from);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleReceiveIceCandidate = async (candidate, from) => {
    const pc = peerConnections.current.get(from);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const handleUserLeft = (socketId) => {
    const pc = peerConnections.current.get(socketId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(socketId);
    }
    setPeers((prev) => {
      const newPeers = new Map(prev);
      newPeers.delete(socketId);
      return newPeers;
    });
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track in all peer connections
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (error) {
        console.error('Error sharing screen:', error);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (originalStream.current) {
      const videoTrack = originalStream.current.getVideoTracks()[0];

      peerConnections.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = originalStream.current;
      }
    }
    setIsScreenSharing(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-auto">
        {/* Local video */}
        <div className={`relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 ${activeSpeakers.has('local') ? 'ring-4 ring-green-500 shadow-lg shadow-green-500/20' : 'ring-1 ring-gray-700'
          }`}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm text-white flex items-center gap-2">
            <span>{isMicOn ? '🎤' : '🔇'}</span>
            <span className="font-medium">You {isScreenSharing && '(Screen)'}</span>
          </div>
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-500">
              <div className="flex flex-col items-center gap-2">
                <div className="p-4 rounded-full bg-gray-800">
                  <span className="text-4xl">📷</span>
                </div>
                <span>Camera Off</span>
              </div>
            </div>
          )}
        </div>

        {/* Remote videos */}
        {Array.from(peers.entries()).map(([socketId, peer]) => (
          <div key={socketId} className={`relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 ${activeSpeakers.has(socketId) ? 'ring-4 ring-green-500 shadow-lg shadow-green-500/20' : 'ring-1 ring-gray-700'
            }`}>
            <video
              autoPlay
              playsInline
              ref={(el) => {
                if (el && peer.stream) el.srcObject = peer.stream;
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm text-white">
              Participant {socketId.substr(0, 4)}...
            </div>
          </div>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="flex justify-center items-center gap-6 p-6 bg-gray-900/90 backdrop-blur-md border-t border-gray-800">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full transition-all duration-200 transform hover:scale-110 ${isMicOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
            }`}
          title={isMicOn ? 'Mute' : 'Unmute'}
        >
          {isMicOn ? '🎤' : '🔇'}
        </button>

        <button
          onClick={toggleCamera}
          className={`p-4 rounded-full transition-all duration-200 transform hover:scale-110 ${isCameraOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
            }`}
          title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraOn ? '📹' : '🚫'}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-4 rounded-full transition-all duration-200 transform hover:scale-110 ${isScreenSharing ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30' : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          🖥️
        </button>

        <button
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 transform hover:scale-110 shadow-lg shadow-red-600/30"
          onClick={() => window.location.href = '/dashboard'}
          title="Leave Call"
        >
          📞
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
