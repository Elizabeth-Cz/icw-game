import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './controllers/socketController';

// Load environment variables
dotenv.config();

// Debug environment variables
console.log('Environment variables:', {
  PORT: process.env.PORT,
  CLIENT_URL: process.env.CLIENT_URL
});

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure CORS
const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    'http://localhost:3000',
  ].filter(Boolean) as string[],
);

const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

// Parse JSON bodies
app.use(express.json());

// Create Socket.io server
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Setup Socket.io event handlers
setupSocketHandlers(io);

// Basic route for health check
app.get('/', (req, res) => {
  res.send('Guess Who ICW Backend is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
