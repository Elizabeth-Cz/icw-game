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

### Install Dependencies

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

### Local Configuration

Create a top-level `.env` file in the repository root. You can start from `.env.example`:

```bash
cp .env.example .env
```

Default local configuration:

```bash
FRONTEND_HOST=localhost
FRONTEND_PORT=3000
BACKEND_HOST=localhost
BACKEND_PORT=5020
```

The shared startup script derives these automatically:

- `CLIENT_URL=http://localhost:3000`
- `NEXT_PUBLIC_SOCKET_URL=http://localhost:5020`

If you need custom URLs, you can also set `CLIENT_URL` and `NEXT_PUBLIC_SOCKET_URL` directly in the same root `.env`.

### Start Both Apps

From the repository root:

```bash
npm run dev
```

This starts:

- frontend on `http://localhost:3000`
- backend on `http://localhost:5020`

### Start One App

From the repository root:

```bash
npm run dev:frontend
```

or:

```bash
npm run dev:backend
```

### Manual Per-App Startup

If you still want to run the apps separately, use the same values from the root `.env`.

1. Backend:
   ```
   PORT=5020
   CLIENT_URL=http://localhost:3000
   ```

2. Frontend:
   ```bash
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5020
   ```

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
# guess-who
# guess-who
# icw-game
