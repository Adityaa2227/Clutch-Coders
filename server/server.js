const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require("socket.io");
const morgan = require('morgan');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for hackathon convenience
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/service'));
app.use('/api/passes', require('./routes/pass'));
app.use('/api/access', require('./routes/access')(io)); // Pass io to access routes for realtime updates
app.use('/api/wallet', require('./routes/wallet'));

// Basic Route
app.get('/', (req, res) => {
  res.send('FlexPass API Running');
});



// Socket.io Connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
