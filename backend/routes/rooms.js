const express = require('express');
const Room = require('../models/Room');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate unique 6-digit room code
const generateRoomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create a new room
router.post('/create', auth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    // Generate unique room code
    let code = generateRoomCode();
    let existingRoom = await Room.findOne({ code });

    while (existingRoom) {
      code = generateRoomCode();
      existingRoom = await Room.findOne({ code });
    }

    const room = new Room({
      name,
      code,
      host: req.user.userId,
      participants: [req.user.userId]
    });

    await room.save();

    res.status(201).json({
      message: 'Room created successfully',
      room: {
        id: room._id,
        name: room.name,
        code: room.code,
        host: room.host,
        participants: room.participants,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error creating room' });
  }
});

// Get all active rooms
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('host', 'username')
      .populate('participants', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error fetching rooms' });
  }
});

// Get specific room by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('host', 'username')
      .populate('participants', 'username');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error fetching room' });
  }
});

// Get room by code
router.get('/code/:code', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code })
      .populate('host', 'username')
      .populate('participants', 'username');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ room });
  } catch (error) {
    console.error('Get room by code error:', error);
    res.status(500).json({ message: 'Server error fetching room' });
  }
});

// Get messages for a room
router.get('/messages/:roomId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId })
      .populate('user', 'username')
      .sort({ timestamp: 1 })
      .limit(100);

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

// Delete a room
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is host
    if (room.host.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this room' });
    }

    await Room.findByIdAndDelete(req.params.id);
    // Optionally delete messages associated with the room
    await Message.deleteMany({ room: req.params.id });

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error deleting room' });
  }
});

module.exports = router;
