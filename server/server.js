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
    origin: process.env.CLIENT_URL || "*", 
    methods: ["GET", "POST"]
  }
});

app.set('io', io); // Make io accessible in routes

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || "*"
}));
app.use(morgan('dev'));

mongoose.connect(process.env.MONGO_URI, {
    family: 4, // Force IPv4
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/service'));
app.use('/api/passes', require('./routes/pass'));
app.use('/api/access', require('./routes/access')(io)); 
app.use('/api/wallet', require('./routes/wallet')(io));
app.use('/api/admin', require('./routes/admin')(io));
app.use('/api/rewards', require('./routes/rewards')(io));
app.use('/api/support', require('./routes/support'));

// Basic Route
app.get('/', (req, res) => {
  res.send('FlexPass API Running');
});

// Email Jobs
const initEmailJobs = require('./jobs/emailJobs');
initEmailJobs();
// Socket.io Connection
io.on('connection', (socket) => {
  // console.log('User connected:', socket.id);
  
  socket.on('join_room', (userId) => {
    socket.join(userId);
    // console.log(`User ${userId} joined room`);
  });

  socket.on('join_admin', () => {
    socket.join('admin_room');
    console.log(`Socket ${socket.id} joined ADMIN room`);
  });

  // Support System Events
  socket.on('join_ticket', (ticketId) => {
      socket.join(`ticket_${ticketId}`);
      // console.log(`Socket ${socket.id} joined ticket_${ticketId}`);
  });

  socket.on('join_admin_notifications', () => {
      socket.join('admin_notifications');
  });

  socket.on('disconnect', () => {
    // console.log('User disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
