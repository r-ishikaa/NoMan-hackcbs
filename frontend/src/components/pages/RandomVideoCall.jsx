import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Video, VideoOff, Mic, MicOff, PhoneOff, SkipForward, Search } from 'lucide-react';
import API_CONFIG from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function RandomVideoCall() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Refs
  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  
  // State
  const [status, setStatus] = useState('idle'); // idle, searching, waiting, connected
  const [partnerUsername, setPartnerUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [error, setError] = useState('');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(false);

  // ICE servers configuration (STUN servers for NAT traversal)
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated() || !token) {
      navigate('/login');
      return;
    }

    const baseUrl = API_CONFIG.getCurrentBackendUrl();
    const socket = io(`${baseUrl}/random-video`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Video Call] Connected to server');
    });

    socket.on('waiting', () => {
      console.log('[Video Call] Waiting for match...');
      setStatus('waiting');
      setPartnerUsername('');
    });

    socket.on('matched', async ({ roomId: newRoomId, partnerUsername: partner, isInitiator }) => {
      console.log(`[Video Call] Matched with ${partner}, initiator: ${isInitiator}`);
      setStatus('connected');
      setRoomId(newRoomId);
      setPartnerUsername(partner);

      // If initiator, create and send offer
      if (isInitiator) {
        await createOffer(newRoomId);
      }
    });

    socket.on('offer', async ({ offer, fromUsername }) => {
      console.log(`[Video Call] Received offer from ${fromUsername}`);
      await handleOffer(offer);
    });

    socket.on('answer', async ({ answer }) => {
      console.log('[Video Call] Received answer');
      await handleAnswer(answer);
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      console.log('[Video Call] Received ICE candidate');
      await handleIceCandidate(candidate);
    });

    socket.on('partnerSkipped', () => {
      console.log('[Video Call] Partner skipped');
      setStatus('idle');
      setPartnerUsername('');
      cleanupCall();
      setError('Partner skipped to next match');
      setTimeout(() => setError(''), 3000);
    });

    socket.on('partnerDisconnected', () => {
      console.log('[Video Call] Partner disconnected');
      setStatus('idle');
      setPartnerUsername('');
      cleanupCall();
      setError('Partner disconnected');
      setTimeout(() => setError(''), 3000);
    });

    socket.on('searchStopped', () => {
      setStatus('idle');
      cleanupCall();
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
      completeCleanup();
    };
  }, [token, isAuthenticated, navigate]);

  // Check and request permissions
  const requestPermissions = async () => {
    setCheckingPermissions(true);
    setError('');
    
    try {
      console.log('[Video Call] Requesting camera and microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('[Video Call] Media stream obtained:', stream.getTracks().map(t => t.kind));
      
      localStreamRef.current = stream;
      
      // Wait for video element to be ready
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Force video to play
        try {
          await localVideoRef.current.play();
          console.log('[Video Call] Local video playing');
        } catch (playErr) {
          console.warn('[Video Call] Video play warning:', playErr);
        }
      }
      
      setPermissionsGranted(true);
      setCheckingPermissions(false);
      console.log('[Video Call] Permissions granted successfully');
      return stream;
    } catch (err) {
      console.error('[Video Call] Error accessing media devices:', err);
      setCheckingPermissions(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera and microphone access denied. Please allow permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found. Please connect a device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application. Please close other apps using the camera.');
      } else {
        setError(`Could not access camera/microphone: ${err.message}`);
      }
      throw err;
    }
  };

  // Get local media stream (reuse if already granted)
  const getLocalStream = async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }
    return await requestPermissions();
  };

  // Create peer connection
  const createPeerConnection = (newRoomId) => {
    const pc = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log('[Video Call] Received remote track');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log('[Video Call] Sending ICE candidate');
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          roomId: newRoomId,
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('[Video Call] Connection state:', pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setError('Connection lost');
      }
    };

    return pc;
  };

  // Create and send offer
  const createOffer = async (newRoomId) => {
    try {
      await getLocalStream();
      const pc = createPeerConnection(newRoomId);
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socketRef.current.emit('offer', {
        offer,
        roomId: newRoomId,
      });
      
      console.log('[Video Call] Offer sent');
    } catch (err) {
      console.error('[Video Call] Error creating offer:', err);
      setError('Failed to start call');
    }
  };

  // Handle incoming offer
  const handleOffer = async (offer) => {
    try {
      await getLocalStream();
      const pc = createPeerConnection(roomId);
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socketRef.current.emit('answer', {
        answer,
        roomId,
      });
      
      console.log('[Video Call] Answer sent');
    } catch (err) {
      console.error('[Video Call] Error handling offer:', err);
      setError('Failed to answer call');
    }
  };

  // Handle incoming answer
  const handleAnswer = async (answer) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        console.log('[Video Call] Answer processed');
      }
    } catch (err) {
      console.error('[Video Call] Error handling answer:', err);
    }
  };

  // Handle incoming ICE candidate
  const handleIceCandidate = async (candidate) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    } catch (err) {
      console.error('[Video Call] Error adding ICE candidate:', err);
    }
  };

  // Cleanup call (but keep local stream for preview)
  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Don't stop local stream - keep it for preview
    // Just clear remote video
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    setRoomId('');
  };

  // Complete cleanup (stops all streams)
  const completeCleanup = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log('[Video Call] Stopped track:', track.kind);
      });
      localStreamRef.current = null;
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    setRoomId('');
    setPermissionsGranted(false);
  };

  // Start searching for match
  const startSearch = () => {
    setError('');
    setStatus('searching');
    if (socketRef.current) {
      socketRef.current.emit('findMatch');
    }
  };

  // Stop searching
  const stopSearch = () => {
    if (socketRef.current) {
      socketRef.current.emit('stopSearching');
    }
    cleanupCall();
    setStatus('idle');
    // Restart local stream preview
    if (!localStreamRef.current && permissionsGranted) {
      requestPermissions().catch(console.error);
    }
  };

  // Skip current match
  const skipMatch = () => {
    if (socketRef.current) {
      socketRef.current.emit('skip');
    }
    cleanupCall();
    setStatus('searching');
    // Auto find next match
    setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('findMatch');
      }
    }, 500);
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">Random Video Chat</h1>
          <p className="text-gray-200 text-lg">Connect with random people around the world</p>
        </div>

        {/* Permission Request */}
        {!permissionsGranted && status === 'idle' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-6 border border-white/20 shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Camera & Microphone Access</h2>
              <p className="text-gray-300 mb-6">
                We need access to your camera and microphone to start video calls
              </p>
              <button
                onClick={requestPermissions}
                disabled={checkingPermissions}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {checkingPermissions ? 'Requesting Access...' : 'Grant Permissions'}
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-2xl text-white text-center shadow-lg">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Video Container */}
        {permissionsGranted && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Remote Video */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {status === 'connected' && partnerUsername && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg">
                  🎭 {partnerUsername}
                </div>
              )}
              {status !== 'connected' && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm">
                  <div className="text-center">
                    {status === 'idle' && (
                      <>
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <Video className="w-12 h-12 text-white" />
                        </div>
                        <p className="text-white text-lg font-medium">Ready to connect</p>
                        <p className="text-gray-300 text-sm mt-1">Click "Start" to find someone</p>
                      </>
                    )}
                    {status === 'searching' && (
                      <>
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                          <Search className="w-12 h-12 text-white" />
                        </div>
                        <p className="text-white text-lg font-medium">Searching...</p>
                        <p className="text-gray-300 text-sm mt-1">Looking for someone to connect with</p>
                      </>
                    )}
                    {status === 'waiting' && (
                      <>
                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <Search className="w-12 h-12 text-white animate-spin" />
                        </div>
                        <p className="text-white text-lg font-medium">Waiting...</p>
                        <p className="text-gray-300 text-sm mt-1">You're next in line!</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Local Video */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                onLoadedMetadata={() => console.log('[Video Call] Local video metadata loaded')}
                onPlay={() => console.log('[Video Call] Local video playing')}
              />
              <div className="absolute top-4 left-4 bg-gradient-to-r from-green-600/90 to-emerald-600/90 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg">
                👤 You {!videoEnabled && '(Camera Off)'}
              </div>
              {!videoEnabled && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <VideoOff className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-sm">Camera Off</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        {permissionsGranted && (
          <div className="flex justify-center gap-3 flex-wrap">
            {status === 'idle' && (
              <button
                onClick={startSearch}
                className="px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-full font-semibold transition-all transform hover:scale-105 flex items-center gap-3 shadow-lg text-lg"
              >
                <Search className="w-6 h-6" />
                Start Searching
              </button>
            )}

            {(status === 'searching' || status === 'waiting') && (
              <button
                onClick={stopSearch}
                className="px-10 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-full font-semibold transition-all transform hover:scale-105 flex items-center gap-3 shadow-lg text-lg"
              >
                <PhoneOff className="w-6 h-6" />
                Stop Searching
              </button>
            )}

            {status === 'connected' && (
              <>
                <button
                  onClick={toggleVideo}
                  className={`p-5 rounded-full font-medium transition-all transform hover:scale-110 shadow-lg ${
                    videoEnabled
                      ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                      : 'bg-gradient-to-br from-red-600 to-rose-600 text-white'
                  }`}
                  title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  {videoEnabled ? <Video className="w-7 h-7" /> : <VideoOff className="w-7 h-7" />}
                </button>

                <button
                  onClick={toggleAudio}
                  className={`p-5 rounded-full font-medium transition-all transform hover:scale-110 shadow-lg ${
                    audioEnabled
                      ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                      : 'bg-gradient-to-br from-red-600 to-rose-600 text-white'
                  }`}
                  title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {audioEnabled ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
                </button>

                <button
                  onClick={skipMatch}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full font-semibold transition-all transform hover:scale-105 flex items-center gap-3 shadow-lg text-lg"
                >
                  <SkipForward className="w-6 h-6" />
                  Next Person
                </button>

                <button
                  onClick={stopSearch}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-full font-semibold transition-all transform hover:scale-105 flex items-center gap-3 shadow-lg text-lg"
                >
                  <PhoneOff className="w-6 h-6" />
                  End Call
                </button>
              </>
            )}
          </div>
        )}

        {/* Instructions */}
        {permissionsGranted && (
          <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white border border-white/20 shadow-lg">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <span className="text-2xl">ℹ️</span>
              How it works
            </h3>
            <ul className="space-y-2 text-sm text-gray-200">
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">1.</span>
                <span>Click <strong>"Start Searching"</strong> to find a random person to video chat with</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                <span>Once matched, you can talk via video and audio in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">3.</span>
                <span>Click <strong>"Next Person"</strong> to skip and match with someone new</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 font-bold">4.</span>
                <span>Use camera/mic buttons to toggle video and audio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">5.</span>
                <span>Click <strong>"End Call"</strong> when you're done</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}

