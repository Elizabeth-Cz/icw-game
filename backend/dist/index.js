"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const socketController_1 = require("./controllers/socketController");
// Load environment variables
dotenv_1.default.config();
// Debug environment variables
console.log('Environment variables:', {
    PORT: process.env.PORT,
    CLIENT_URL: process.env.CLIENT_URL
});
// Create Express app
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Configure CORS
const allowedOrigins = new Set([
    process.env.CLIENT_URL,
    'http://localhost:3000',
].filter(Boolean));
const isAllowedOrigin = (origin) => {
    if (!origin)
        return true;
    if (allowedOrigins.has(origin))
        return true;
    try {
        const { hostname } = new URL(origin);
        return hostname.endsWith('.vercel.app');
    }
    catch (_a) {
        return false;
    }
};
const validateCorsOrigin = (origin, callback) => {
    if (isAllowedOrigin(origin)) {
        callback(null, true);
    }
    else {
        callback(new Error('Not allowed by CORS'));
    }
};
app.use((0, cors_1.default)({
    origin: validateCorsOrigin,
    credentials: true,
}));
// Parse JSON bodies
app.use(express_1.default.json());
// Create Socket.io server
const io = new socket_io_1.Server(server, {
    cors: {
        origin: validateCorsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
// Setup Socket.io event handlers
(0, socketController_1.setupSocketHandlers)(io);
// Basic route for health check
app.get('/', (req, res) => {
    res.send('Guess Who ICW Backend is running');
});
// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
