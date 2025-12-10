# 🚀 Virtual Study Room Platform

A full-stack collaborative study platform with **video conferencing**, **real-time chat**, **screen sharing**, and **collaborative document editing**.

## 🌟 Features

✅ **User Authentication** - JWT-based secure login/signup  
✅ **Study Rooms** - Create and join study rooms with unique codes  
✅ **Video Conferencing** - WebRTC-based video calls with multiple participants  
✅ **Screen Sharing** - Share your screen with other participants  
✅ **Real-time Chat** - Instant messaging within study rooms  
✅ **Collaborative Notes** - Shared document editor with auto-save  
✅ **Responsive Design** - Works on desktop and mobile devices  

## 🛠️ Tech Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose
- Socket.io (real-time communication)
- JWT Authentication
- bcrypt (password hashing)

### Frontend
- React.js (JavaScript, NO TypeScript)
- React Router
- Socket.io-client
- WebRTC API
- Tailwind CSS + Custom CSS
- Axios

## 📁 Project Structure

```
virtual-study-room/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB configuration
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Room.js               # Room schema
│   │   └── Message.js            # Message schema
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   └── rooms.js              # Room management routes
│   ├── middleware/
│   │   └── auth.js               # JWT middleware
│   ├── socket/
│   │   └── socketHandler.js      # Socket.io handlers
│   ├── server.js                 # Main server file
│   ├── .env                      # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Signup.jsx
│   │   │   ├── Dashboard/
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── Room/
│   │   │   │   ├── CreateRoom.jsx
│   │   │   │   ├── StudyRoom.jsx
│   │   │   │   ├── VideoCall.jsx
│   │   │   │   ├── Chat.jsx
│   │   │   │   └── DocumentEditor.jsx
│   │   │   └── common/
│   │   │       └── PrivateRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── index.css
│   │   └── App.css
│   ├── .env                      # Environment variables
│   └── package.json
│
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - Either install locally or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** (optional)

### Step 1: Clone or Download the Project

```bash
cd d:/Project/virtual-study-room
```

### Step 2: Backend Setup

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   The `.env` file is already created. Update it if needed:
   ```
   MONGODB_URI=mongodb://localhost:27017/virtual-study-room
   JWT_SECRET=your-super-secret-key-change-this-in-production
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

   **For MongoDB Atlas (Cloud):**
   Replace `MONGODB_URI` with your connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/virtual-study-room
   ```

4. **Start MongoDB (if using local):**
   ```bash
   # Windows
   mongod

   # Mac/Linux
   sudo systemctl start mongod
   ```

5. **Start the backend server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   🚀 Server is running on port 5000
   📡 Socket.io server ready
   ✅ MongoDB Connected Successfully
   ```

### Step 3: Frontend Setup

1. **Open a new terminal and navigate to frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment variables:**
   
   The `.env` file is already created with default values:
   ```
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

4. **Start the frontend:**
   ```bash
   npm start
   ```

   The app will open in your browser at: **http://localhost:3000**

## 🎮 How to Use

### 1. Create an Account
- Open http://localhost:3000
- Click "Sign up"
- Enter username, email, and password
- You'll be redirected to the dashboard

### 2. Create a Study Room
- Click "Create Study Room" from dashboard
- Enter a room name (e.g., "Math Study Group")
- Click "Create Room"
- You'll get a **6-digit room code** to share with others

### 3. Join a Room
- From dashboard, enter the 6-digit room code
- Click "Join"
- OR click on any active room card

### 4. Inside the Study Room

**Video Features:**
- 🎥 Toggle camera on/off
- 🎤 Toggle microphone on/off
- 🖥️ Share your screen

**Chat:**
- Send real-time messages to everyone in the room
- See message timestamps

**Shared Notes:**
- Type in the document editor
- Changes sync automatically to all participants
- Auto-saves every 2 seconds

### 5. Leave the Room
- Click "Leave Room" button in the top-right corner

## 🧪 Testing with Multiple Users

To test video calling and collaboration features:

1. **Open the app in multiple browser windows/tabs:**
   - Window 1: http://localhost:3000 (normal mode)
   - Window 2: http://localhost:3000 (incognito/private mode)

2. **Create different accounts in each window**

3. **Have one user create a room and share the code**

4. **Have the other user(s) join using the code**

5. **Test features:**
   - Video calls should connect automatically
   - Chat messages appear for all users
   - Document edits sync in real-time

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Rooms
- `POST /rooms/create` - Create new study room
- `GET /rooms` - Get all active rooms
- `GET /rooms/:id` - Get specific room details
- `GET /rooms/code/:code` - Get room by code
- `GET /rooms/messages/:roomId` - Get room chat history

### Socket.io Events

**Client → Server:**
- `join-room` - Join a study room
- `chat-message` - Send a chat message
- `video-offer` - Send WebRTC offer
- `video-answer` - Send WebRTC answer
- `ice-candidate` - Send ICE candidate
- `document-update` - Update shared document
- `document-save` - Save document to DB
- `leave-room` - Leave the room

**Server → Client:**
- `user-joined` - New user joined room
- `user-left` - User left room
- `existing-participants` - List of current participants
- `chat-message` - Receive chat message
- `video-offer` - Receive WebRTC offer
- `video-answer` - Receive WebRTC answer
- `ice-candidate` - Receive ICE candidate
- `document-update` - Receive document update

## 🔧 Troubleshooting

### Backend won't start
- **MongoDB not running:** Start MongoDB service
- **Port 5000 in use:** Change PORT in backend/.env

### Frontend won't connect to backend
- Check backend is running on port 5000
- Verify `.env` file in frontend has correct URLs
- Make sure CORS is enabled (already configured)

### Video/Audio not working
- **Browser permissions:** Allow camera/microphone access
- **HTTPS required:** For production, you need HTTPS (localhost works)
- **Try Chrome/Edge:** Best WebRTC support

### MongoDB connection failed
- Check MongoDB is running: `mongod --version`
- Verify connection string in backend/.env
- For Atlas: Check IP whitelist and credentials

## 🚀 Deployment

### Backend (Node.js)
Deploy to:
- **Heroku**: [Guide](https://devcenter.heroku.com/articles/deploying-nodejs)
- **Railway**: [Guide](https://docs.railway.app/deploy/deployments)
- **Render**: [Guide](https://render.com/docs/deploy-node-express-app)

**Important:** Update environment variables on your hosting platform

### Frontend (React)
Deploy to:
- **Vercel**: `npm run build` then deploy
- **Netlify**: Connect GitHub repo
- **AWS S3 + CloudFront**

**Important:** 
- Build the app: `npm run build`
- Update `.env` with production backend URL

### MongoDB
Use **MongoDB Atlas** (free tier available): https://www.mongodb.com/cloud/atlas

## 🔐 Security Notes

⚠️ **IMPORTANT for Production:**
- Change `JWT_SECRET` to a strong random string
- Use environment variables (never commit `.env` files)
- Enable HTTPS for video/audio (required by browsers)
- Add rate limiting to prevent abuse
- Validate all user inputs
- Use MongoDB Atlas instead of local MongoDB

## 📝 License

MIT License - Feel free to use this project for learning and development!

## 🙏 Features Summary

| Feature | Status |
|---------|--------|
| User Registration/Login | ✅ Complete |
| JWT Authentication | ✅ Complete |
| Create Study Rooms | ✅ Complete |
| Join Rooms by Code | ✅ Complete |
| Video Calling (WebRTC) | ✅ Complete |
| Camera/Mic Toggle | ✅ Complete |
| Screen Sharing | ✅ Complete |
| Real-time Chat | ✅ Complete |
| Collaborative Document | ✅ Complete |
| Auto-save Documents | ✅ Complete |
| Responsive Design | ✅ Complete |
| MongoDB Integration | ✅ Complete |
| Socket.io Real-time | ✅ Complete |

## 🎨 UI Design

- **Modern glassmorphism effects**
- **Gradient backgrounds and buttons**
- **Smooth animations and transitions**
- **Dark theme optimized for long study sessions**
- **Fully responsive (mobile & desktop)**

---

**Built with ❤️ for collaborative learning**

For issues or questions, check the code comments or console logs for debugging info!
