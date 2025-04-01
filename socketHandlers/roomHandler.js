const Room = require("../models/Room")

const handleRoomEvents = (io, socket) => {
  // Join a room
  socket.on("room:join", async ({ roomId }) => {
    try {
      const room = await Room.findById(roomId)

      if (!room) {
        return socket.emit("error", { message: "Room not found." })
      }

      // Check if user has access to the room
      if (
        room.isPrivate &&
        !room.members.some((member) => member.equals(socket.user._id)) &&
        !room.creator.equals(socket.user._id)
      ) {
        return socket.emit("error", { message: "Access denied to this room." })
      }

      // Join the room's socket channel
      socket.join(`room:${roomId}`)

      // Notify room members that user joined
      socket.to(`room:${roomId}`).emit("room:userJoined", {
        roomId,
        user: {
          id: socket.user._id,
          username: socket.user.username,
          avatar: socket.user.avatar,
        },
      })

      console.log(`User ${socket.user.username} joined room ${roomId}`)
    } catch (error) {
      console.error("Error joining room:", error)
      socket.emit("error", { message: "Failed to join room." })
    }
  })

  // Leave a room
  socket.on("room:leave", async ({ roomId }) => {
    try {
      // Leave the room's socket channel
      socket.leave(`room:${roomId}`)

      // Notify room members that user left
      socket.to(`room:${roomId}`).emit("room:userLeft", {
        roomId,
        userId: socket.user._id,
      })

      console.log(`User ${socket.user.username} left room ${roomId}`)
    } catch (error) {
      console.error("Error leaving room:", error)
      socket.emit("error", { message: "Failed to leave room." })
    }
  })

  // User typing in a room
  socket.on("room:typing", ({ roomId, isTyping }) => {
    socket.to(`room:${roomId}`).emit("room:userTyping", {
      roomId,
      userId: socket.user._id,
      username: socket.user.username,
      isTyping,
    })
  })
}

module.exports = { handleRoomEvents }

