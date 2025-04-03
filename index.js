const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const path = require("path")
const authRoutes = require("./routes/auth")
const roomRoutes = require("./routes/rooms")
const messageRoutes = require("./routes/messages")
const { authenticateSocket } = require("./middleware/auth")
const { handleConnection } = require("./socketHandlers/connectionHandler")

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()
const server = http.createServer(app)

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/rooms", roomRoutes)
app.use("/api/messages", messageRoutes)

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:8080",
  process.env.CLIENT_URL,
]

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    methods: ["GET", "POST"],
  },
})

// Socket.io middleware for authentication
io.use(authenticateSocket)

// Socket.io connection handler
io.on("connection", (socket) => handleConnection(io, socket))

// Connect to MongoDB
mongoose
    .connect('mongodb+srv://portfolio:Sebastian2803@chat-portfolio.wiosuto.mongodb.net/?retryWrites=true&w=majority&appName=Chat-portfolio')  
    .then(() => {
    console.log("Connected to MongoDB")
    // Start server
    const PORT = process.env.PORT || 5000
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    process.exit(1)
  })

