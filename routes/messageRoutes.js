const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // added this line
const Message = require('../models/messageModel');
const userRegister = require('../models/signupModel');
const verifyToken = require('../middleware');

// Get conversation between two users
router.get('/conversation/:userId', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    }).sort({ timestamp: 1 }).lean();

    const normalizedMessages = messages.map(msg => ({
      _id: msg._id.toString(),
      senderId: msg.sender.toString(),
      receiverId: msg.receiver.toString(),
      message: msg.message,
      isRead: msg.isRead || false,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : new Date(msg.timestamp).toISOString()
    }));

    res.json(normalizedMessages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;


// Get all conversations for current user
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    // Get all unique user IDs that the current user has chatted with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: mongoose.Types.ObjectId(currentUserId) },
            { receiver: mongoose.Types.ObjectId(currentUserId) }
          ]
        }
      },
      {
        $project: {
          participant: {
            $cond: [
              { $eq: ["$sender", mongoose.Types.ObjectId(currentUserId)] },
              "$receiver",
              "$sender"
            ]
          },
          message: 1,
          timestamp: 1
        }
      },
      {
        $group: {
          _id: "$participant",
          lastMessage: { $last: { message: "$message", timestamp: "$timestamp" } }
        }
      },
      {
        $lookup: {
          from: "registers",
          localField: "_id",
          foreignField: "_id",
          as: "participant"
        }
      },
      {
        $unwind: "$participant"
      },
      {
        $project: {
          participant: {
            _id: "$participant._id",
            name: "$participant.name",
            photo: "$participant.photo",
            role: "$participant.role"
          },
          lastMessage: 1
        }
      },
      {
        $sort: { "lastMessage.timestamp": -1 }
      }
    ]);

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
