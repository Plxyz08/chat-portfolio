const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const Message = require("../models/Message")
const Room = require("../models/Room")
const User = require("../models/User")
const Notification = require("../models/Notification")
const { authenticateToken } = require("../middleware/auth")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + "-" + uniqueSuffix + ext)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type. Only images, PDFs, DOC, DOCX, and TXT files are allowed."))
    }
  },
})

// Get messages for a room
router.get("/room/:roomId", authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params
    const { limit = 50, before } = req.query

    // Check if room exists and user has access
    const room = await Room.findById(roomId)

    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    if (
      room.isPrivate &&
      !room.members.some((member) => member.equals(req.user._id)) &&
      !room.creator.equals(req.user._id)
    ) {
      return res.status(403).json({ message: "Access denied to this room." })
    }

    // Build query
    const query = { room: roomId }
    if (before) {
      query.createdAt = { $lt: new Date(before) }
    }

    // Get messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit))
      .populate("sender", "username avatar")
      .populate("readBy.user", "username avatar")

    // Mark messages as read
    const messageIds = messages.map((message) => message._id)
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        "readBy.user": { $ne: req.user._id },
      },
      {
        $push: {
          readBy: {
            user: req.user._id,
            readAt: new Date(),
          },
        },
      },
    )

    res.json({ messages: messages.reverse() })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get private messages between two users
router.get("/private/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    const { limit = 50, before } = req.query

    // Check if user exists
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    // Build query for private messages between the two users
    const query = {
      isPrivate: true,
      $or: [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id },
      ],
    }

    if (before) {
      query.createdAt = { $lt: new Date(before) }
    }

    // Get messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit))
      .populate("sender", "username avatar")
      .populate("readBy.user", "username avatar")

    // Mark messages as read
    const messageIds = messages.filter((msg) => msg.sender.toString() === userId).map((message) => message._id)

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        "readBy.user": { $ne: req.user._id },
      },
      {
        $push: {
          readBy: {
            user: req.user._id,
            readAt: new Date(),
          },
        },
      },
    )

    res.json({ messages: messages.reverse() })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Send a message to a room
router.post("/room/:roomId", authenticateToken, upload.array("attachments", 5), async (req, res) => {
  try {
    const { roomId } = req.params
    const { content } = req.body
    const files = req.files || []

    // Check if room exists and user has access
    const room = await Room.findById(roomId)

    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    if (
      room.isPrivate &&
      !room.members.some((member) => member.equals(req.user._id)) &&
      !room.creator.equals(req.user._id)
    ) {
      return res.status(403).json({ message: "Access denied to this room." })
    }

    // Process file attachments
    const attachments = files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      path: `/uploads/${file.filename}`,
      size: file.size,
    }))

    // Create message
    const message = new Message({
      sender: req.user._id,
      content,
      room: roomId,
      isPrivate: false,
      attachments,
      readBy: [{ user: req.user._id }],
    })

    await message.save()

    // Populate sender info
    const populatedMessage = await Message.findById(message._id).populate("sender", "username avatar")

    // Create notifications for room members
    const notifications = room.members
      .filter((member) => !member.equals(req.user._id))
      .map((member) => ({
        recipient: member,
        sender: req.user._id,
        type: "message",
        content: `New message in ${room.name}`,
        relatedTo: {
          model: "Message",
          id: message._id,
        },
      }))

    if (notifications.length > 0) {
      await Notification.insertMany(notifications)
    }

    res.status(201).json({
      message: "Message sent successfully",
      data: populatedMessage,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Send a private message to a user
router.post("/private/:userId", authenticateToken, upload.array("attachments", 5), async (req, res) => {
  try {
    const { userId } = req.params
    const { content } = req.body
    const files = req.files || []

    // Check if recipient exists
    const recipient = await User.findById(userId)

    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found." })
    }

    // Process file attachments
    const attachments = files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      path: `/uploads/${file.filename}`,
      size: file.size,
    }))

    // Create message
    const message = new Message({
      sender: req.user._id,
      recipient: userId,
      content,
      isPrivate: true,
      attachments,
      readBy: [{ user: req.user._id }],
    })

    await message.save()

    // Populate sender info
    const populatedMessage = await Message.findById(message._id).populate("sender", "username avatar")

    // Create notification for recipient
    const notification = new Notification({
      recipient: userId,
      sender: req.user._id,
      type: "message",
      content: `New message from ${req.user.username}`,
      relatedTo: {
        model: "Message",
        id: message._id,
      },
    })

    await notification.save()

    res.status(201).json({
      message: "Private message sent successfully",
      data: populatedMessage,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router

