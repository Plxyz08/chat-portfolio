const User = require("../models/User")
const { handleRoomEvents } = require("./roomHandler")
const { handleMessageEvents } = require("./messageHandler")
const { handleNotificationEvents } = require("./notificationHandler")

const handleConnection = async (io, socket) => {
  try {
    const userId = socket.user._id

    // Update user status to online
    await User.findByIdAndUpdate(userId, {
      status: "online",
      lastSeen: Date.now(),
    })

    // Join user's personal room for private messages
    socket.join(`user:${userId}`)

    // Notify others that user is online
    socket.broadcast.emit("user:status", {
      userId,
      status: "online",
    })

    console.log(`User connected: ${socket.user.username}`)

    // Handle room events
    handleRoomEvents(io, socket)

    // Handle message events
    handleMessageEvents(io, socket)

    // Handle notification events
    handleNotificationEvents(io, socket)

    // Handle disconnect
    socket.on("disconnect", async () => {
      try {
        // Update user status to offline
        await User.findByIdAndUpdate(userId, {
          status: "offline",
          lastSeen: Date.now(),
        })

        // Notify others that user is offline
        io.emit("user:status", {
          userId,
          status: "offline",
        })

        console.log(`User disconnected: ${socket.user.username}`)
      } catch (error) {
        console.error("Error handling disconnect:", error)
      }
    })
  } catch (error) {
    console.error("Error handling connection:", error)
  }
}

module.exports = { handleConnection }

