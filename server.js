const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active rooms and users
const activeRooms = new Map();
const userRooms = new Map(); // Track which room each user is in

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename to avoid conflicts
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// API endpoint to generate room
app.get('/api/create-room', (req, res) => {
  const roomId = uuidv4().substring(0, 8); // Short room ID
  activeRooms.set(roomId, {
    users: [],
    createdAt: new Date(),
    messages: []
  });
  
  res.json({ 
    roomId, 
    joinLink: `${req.protocol}://${req.get('host')}/room/${roomId}` 
  });
});

// File upload endpoint
app.post('/api/upload/:roomId', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const roomId = req.params.roomId;
  if (!activeRooms.has(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const fileInfo = {
    originalName: req.file.originalname,
    filename: req.file.filename,
    size: req.file.size,
    downloadUrl: `/uploads/${req.file.filename}`
  };

  // Broadcast file to room
  io.to(roomId).emit('file-shared', {
    type: 'file',
    fileName: fileInfo.originalName,
    fileSize: fileInfo.size,
    downloadUrl: fileInfo.downloadUrl,
    timestamp: new Date(),
    sender: 'anonymous'
  });

  res.json(fileInfo);
});

// Serve the room page
app.get('/room/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  if (!activeRooms.has(roomId)) {
    return res.status(404).send('Room not found or expired');
  }
  res.sendFile(path.join(__dirname, 'public', 'room.html'));
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  // If it's an API route, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Otherwise serve the homepage
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', (roomId) => {
    if (!activeRooms.has(roomId)) {
      socket.emit('error', 'Room not found');
      return;
    }

    const room = activeRooms.get(roomId);
    
    // Check if room is full (max 2 users)
    if (room.users.length >= 2) {
      socket.emit('error', 'Room is full');
      return;
    }

    // Join the room
    socket.join(roomId);
    room.users.push(socket.id);
    userRooms.set(socket.id, roomId);

    // Send previous messages to new user
    socket.emit('previous-messages', room.messages);

    // Notify room about new user
    socket.to(roomId).emit('user-joined', {
      message: 'Someone joined the chat',
      userCount: room.users.length
    });

    socket.emit('joined-successfully', {
      roomId,
      userCount: room.users.length
    });

    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Handle messages
  socket.on('send-message', (data) => {
    const roomId = userRooms.get(socket.id);
    if (!roomId || !activeRooms.has(roomId)) {
      return;
    }

    const messageData = {
      message: data.message,
      timestamp: new Date(),
      sender: socket.id,
      type: 'text'
    };

    // Store message in room
    const room = activeRooms.get(roomId);
    room.messages.push(messageData);

    // Broadcast to room
    io.to(roomId).emit('new-message', messageData);
  });

  // Handle typing indicators
  socket.on('typing', () => {
    const roomId = userRooms.get(socket.id);
    if (roomId) {
      socket.to(roomId).emit('user-typing');
    }
  });

  socket.on('stop-typing', () => {
    const roomId = userRooms.get(socket.id);
    if (roomId) {
      socket.to(roomId).emit('user-stop-typing');
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const roomId = userRooms.get(socket.id);
    if (roomId && activeRooms.has(roomId)) {
      const room = activeRooms.get(roomId);
      room.users = room.users.filter(userId => userId !== socket.id);
      
      // Notify remaining users
      socket.to(roomId).emit('user-left', {
        message: 'Someone left the chat',
        userCount: room.users.length
      });

      // If room is empty, delete it
      if (room.users.length === 0) {
        activeRooms.delete(roomId);
        console.log(`Room ${roomId} deleted - empty`);
      }
    }
    
    userRooms.delete(socket.id);
    console.log('User disconnected:', socket.id);
  });
});

// Clean up old files periodically (every hour)
setInterval(() => {
  const uploadDir = './uploads';
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtime.getTime();
      
      // Delete files older than 1 hour
      if (fileAge > 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old file: ${file}`);
      }
    });
  }
}, 60 * 60 * 1000); // Run every hour

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Anonichat server running on port ${PORT}`);
});
