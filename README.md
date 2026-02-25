# Guess Who - ICW Edition

A real-time, two-player web application that replaces the physical Guess Who board game. This digital version allows players to join a room, get assigned a random character, and play the classic guessing game online.

## Features

- **Room-based gameplay**: Create or join a game room with a 6-digit code
- **Random character assignment**: Each player gets assigned a unique random character
- **Character grid**: View all 24 characters in a responsive grid layout
- **Elimination system**: Privately mark characters as eliminated
- **Reconnection support**: Rejoin your game if disconnected
- **Play again**: Start a new game with the same opponent

## Tech Stack

### Frontend
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Socket.io client

### Backend
- Node.js
- Express
- TypeScript
- Socket.io
- In-memory data store

## Project Structure

```
guess-who-icw/
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/            # Next.js app router pages
│   │   ├── components/     # React components
│   │   └── context/        # React context providers
│   ├── public/             # Static assets
│   └── ...
└── backend/                # Express backend server
    ├── src/
    │   ├── controllers/    # Socket event handlers
    │   ├── services/       # Business logic
    │   └── utils/          # Helper functions
    └── ...
```

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following content:
   ```
   PORT=5000
   CLIENT_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The backend server will start on http://localhost:5000.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the frontend directory with the following content:
   ```
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend application will start on http://localhost:3000.

## Deployment Instructions

### Backend Deployment (Render)

1. Create a new Web Service on [Render](https://render.com/).

2. Connect your GitHub repository.

3. Configure the following settings:
   - **Name**: `guess-who-icw-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Auto-Deploy**: Enable

4. Add the following environment variables:
   - `PORT`: `10000` (Render's default port)
   - `CLIENT_URL`: Your Vercel frontend URL (e.g., `https://guess-who-icw.vercel.app`)

5. Click "Create Web Service".

6. Once deployed, note the URL of your backend service (e.g., `https://guess-who-icw-backend.onrender.com`).

### Frontend Deployment (Vercel)

1. Create a new project on [Vercel](https://vercel.com/).

2. Connect your GitHub repository.

3. Configure the following settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

4. Add the following environment variable:
   - `NEXT_PUBLIC_SOCKET_URL`: Your Render backend URL (e.g., `https://guess-who-icw-backend.onrender.com`)

5. Click "Deploy".

6. Once deployed, your application will be available at the provided Vercel URL.

## Scaling Considerations

The current implementation uses an in-memory store for room and player data. For production scaling:

1. Replace the in-memory store with Redis:
   - Add Redis client dependency
   - Update the RoomService to use Redis for data persistence
   - Configure connection pooling for high availability

2. Implement horizontal scaling:
   - Use Socket.io with Redis adapter for multi-server support
   - Configure sticky sessions for load balancing

## Game Rules

1. Each player is assigned a unique random character.
2. Players can see all 24 characters on the board.
3. Players can privately eliminate characters by clicking on them.
4. The goal is to guess your opponent's character by asking yes/no questions.
5. No turn enforcement or win detection is implemented - players manage the game flow themselves.

## License

MIT
# icw-game
# guess-who
# guess-who
# guess-who
