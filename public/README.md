# 🔒 Anonichat

Anonymous chat rooms with file sharing. Create instant chat rooms with no registration required.

## ✨ Features

- **Anonymous Messaging**: No login or registration needed
- **File Sharing**: Upload and share files up to 10MB
- **Real-time Chat**: Instant messaging with typing indicators
- **Auto-cleanup**: Rooms close when everyone leaves
- **Mobile Friendly**: Responsive design works on all devices
- **Secure**: Files are automatically deleted after 1 hour

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone or create the project**
```bash
mkdir anonichat
cd anonichat
```

2. **Create the files**
   - Copy the `server.js` file
   - Copy the `package.json` file  
   - Create a `public` folder
   - Copy `index.html` and `room.html` into the `public` folder

3. **Install dependencies**
```bash
npm install
```

4. **Start the server**
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

5. **Open your browser**
   - Go to `http://localhost:3000`
   - Create a chat room
   - Share the link with someone else
   - Start chatting!

## 📁 Project Structure
```
anonichat/
├── server.js          # Main server file
├── package.json       # Dependencies
├── public/            # Static files
│   ├── index.html     # Homepage
│   └── room.html      # Chat room interface
└── uploads/           # Temporary file storage (created automatically)
```

## 🌐 Deployment

### Deploy to Railway
1. Push your code to GitHub
2. Connect your GitHub repo to Railway
3. Railway will automatically detect it's a Node.js app
4. Set environment variables if needed
5. Deploy!

### Deploy to Render
1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repo
4. Use these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Deploy!

### Deploy to Heroku
```bash
# Install Heroku CLI first
heroku create your-app-name
git push heroku main
```

## ⚙️ Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)

### File Upload Settings
- Maximum file size: 10MB (configurable in server.js)
- Files are automatically deleted after 1 hour
- Supported: All file types

### Room Settings
- Maximum users per room: 2
- Rooms automatically close when empty
- No room time limits

## 🔧 Customization

### Change file size limit
Edit `server.js`:
```javascript
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Change to 50MB
});
```

### Change file cleanup time
Edit `server.js`:
```javascript
// Change from 1 hour to 24 hours
if (fileAge > 24 * 60 * 60 * 1000) {
```

### Change maximum users per room
Edit `server.js`:
```javascript
// Change from 2 to 5 users
if (room.users.length >= 5) {
```

## 🛠️ API Endpoints

- `GET /` - Homepage
- `GET /api/create-room` - Create new chat room
- `POST /api/upload/:roomId` - Upload file to room
- `GET /room/:roomId` - Join chat room
- `GET /uploads/:filename` - Download shared files

## 🔒 Security Features

- No user data stored permanently
- Files auto-deleted after 1 hour  
- Room IDs are randomly generated UUIDs
- No chat history persistence
- CORS protection enabled

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process using port 3000
npx kill-port 3000
# Or use different port
PORT=3001 npm start
```

### Files not uploading
- Check file size is under 10MB
- Ensure `uploads` folder has write permissions
- Check browser console for errors

### Socket.io connection issues
- Ensure server is running
- Check firewall settings
- Verify WebSocket support in browser

## 📝 License

MIT License - feel free to use this project however you like!

## 🤝 Contributing

1. Fork the project
2. Create your feature branch
3. Commit your changes  
4. Push to the branch
5. Open a pull request

---

**Made with ❤️ for anonymous communication**