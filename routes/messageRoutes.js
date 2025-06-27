const express = require('express');
const router = express.Router();
const Message = require('../models/messageModel');
const userRegister = require('../models/signupModel');
const verifyToken = require('../middleware');

// Get conversation between two users
router.get('/conversation/:id', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

// // get faculty users
// router.get('/user/faculty', async (req, res) => {
//     try {
//       const faculty = await userRegister.find({ role: 'faculty' });
//       const count = await userRegister.countDocuments({ role: 'faculty' });
//       res.json({ faculty, count });
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   });
  
// // get student users
// router.get('/user/student', async (req, res) => {
//     try {
//       const student = await userRegister.find({ role: 'student' });
//       const count = await userRegister.countDocuments({ role: 'student' });
//       res.json({ student, count });
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   });

// // Get all users regardless of role
// router.get('/users', async (req, res) => {
//   try {
//     const users = await userRegister.find({});
//     res.json({ users, count: users.length });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to get users', error: error.message });
//   }
// });

module.exports = router;