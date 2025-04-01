const express = require("express")
const router = express.Router()
const Room = require("../models/Room")
const { authenticateToken } = require("../middleware/auth")

// Get all public rooms
router.get("/public", authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate("creator", "username avatar")
      .select("name description creator members createdAt")

    res.json({ rooms })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get user's rooms (both public and private)
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [{ creator: req.user._id }, { members: req.user._id }],
    })
      .populate("creator", "username avatar")
      .select("name description isPrivate creator members createdAt")

    res.json({ rooms })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create a new room
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, description, isPrivate, members } = req.body

    // Create new room
    const room = new Room({
      name,
      description,
      isPrivate: isPrivate || false,
      creator: req.user._id,
      members: [req.user._id, ...(members || [])],
      admins: [req.user._id],
    })

    await room.save()

    const populatedRoom = await Room.findById(room._id)
      .populate("creator", "username avatar")
      .select("name description isPrivate creator members createdAt")

    res.status(201).json({
      message: "Room created successfully",
      room: populatedRoom,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get room by ID
router.get("/:roomId", authenticateToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate("creator", "username avatar")
      .populate("members", "username avatar status")
      .populate("admins", "username avatar")

    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    // Check if user has access to the room
    if (
      room.isPrivate &&
      !room.members.some((member) => member._id.equals(req.user._id)) &&
      !room.creator._id.equals(req.user._id)
    ) {
      return res.status(403).json({ message: "Access denied to this room." })
    }

    res.json({ room })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Add member to room
router.post("/:roomId/members", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body
    const room = await Room.findById(req.params.roomId)

    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    // Check if user is admin or creator
    if (!room.creator.equals(req.user._id) && !room.admins.some((admin) => admin.equals(req.user._id))) {
      return res.status(403).json({ message: "Only admins can add members." })
    }

    // Check if user is already a member
    if (room.members.some((member) => member.equals(userId))) {
      return res.status(400).json({ message: "User is already a member of this room." })
    }

    // Add user to members
    room.members.push(userId)
    await room.save()

    const updatedRoom = await Room.findById(req.params.roomId).populate("members", "username avatar status")

    res.json({
      message: "Member added successfully",
      members: updatedRoom.members,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Remove member from room
router.delete("/:roomId/members/:userId", authenticateToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)

    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    // Check if user is admin, creator, or removing themselves
    if (
      !room.creator.equals(req.user._id) &&
      !room.admins.some((admin) => admin.equals(req.user._id)) &&
      !req.user._id.equals(req.params.userId)
    ) {
      return res.status(403).json({ message: "Not authorized to remove this member." })
    }

    // Cannot remove the creator
    if (room.creator.equals(req.params.userId)) {
      return res.status(400).json({ message: "Cannot remove the room creator." })
    }

    // Remove user from members
    room.members = room.members.filter((member) => !member.equals(req.params.userId))

    // If user is an admin, remove from admins too
    room.admins = room.admins.filter((admin) => !admin.equals(req.params.userId))

    await room.save()

    const updatedRoom = await Room.findById(req.params.roomId).populate("members", "username avatar status")

    res.json({
      message: "Member removed successfully",
      members: updatedRoom.members,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router

