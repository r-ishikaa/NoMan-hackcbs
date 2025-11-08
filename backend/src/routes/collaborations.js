import express from 'express';
import Collaboration from '../models/Collaboration.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create a new collaboration request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      creatorId,
      walletAddress,
      walletType,
      network,
      budget,
      duration,
      description,
      deliverables,
    } = req.body;

    // Validate required fields
    if (!creatorId || !walletAddress || !walletType || !network || !budget || !duration || !description || !deliverables) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if creator exists and is a creator/enterprise
    const creator = await User.findById(creatorId);
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    if (creator.role !== 'creator' && creator.role !== 'enterprise') {
      return res.status(400).json({ error: 'User is not a creator or enterprise' });
    }

    // Create collaboration request
    const collaboration = new Collaboration({
      creatorId,
      brandId: req.user._id,
      walletAddress,
      walletType,
      network,
      budget: parseFloat(budget),
      duration,
      description,
      deliverables,
      status: 'pending',
    });

    await collaboration.save();

    // Populate creator and brand info
    await collaboration.populate('creatorId', 'username email profilePicture');
    await collaboration.populate('brandId', 'username email profilePicture');

    res.status(201).json({
      message: 'Collaboration request sent successfully',
      collaboration,
    });
  } catch (error) {
    console.error('Error creating collaboration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get collaboration requests for a creator (received requests)
router.get('/received', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = { creatorId: req.user._id };
    if (status) {
      query.status = status;
    }

    const collaborations = await Collaboration.find(query)
      .populate('brandId', 'username email profilePicture role')
      .sort({ createdAt: -1 });

    res.json({ collaborations });
  } catch (error) {
    console.error('Error fetching received collaborations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get collaboration requests sent by a brand (sent requests)
router.get('/sent', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = { brandId: req.user._id };
    if (status) {
      query.status = status;
    }

    const collaborations = await Collaboration.find(query)
      .populate('creatorId', 'username email profilePicture role')
      .sort({ createdAt: -1 });

    res.json({ collaborations });
  } catch (error) {
    console.error('Error fetching sent collaborations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update collaboration status (accept/reject by creator)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, creatorResponse } = req.body;

    if (!['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
      return res.status(404).json({ error: 'Collaboration not found' });
    }

    // Only creator can accept/reject, only brand can cancel
    if (status === 'accepted' || status === 'rejected' || status === 'completed') {
      if (String(collaboration.creatorId) !== String(req.user._id)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    } else if (status === 'cancelled') {
      if (String(collaboration.brandId) !== String(req.user._id)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    collaboration.status = status;
    if (creatorResponse) {
      collaboration.creatorResponse = creatorResponse;
    }

    await collaboration.save();
    await collaboration.populate('creatorId', 'username email profilePicture');
    await collaboration.populate('brandId', 'username email profilePicture');

    res.json({
      message: 'Collaboration status updated',
      collaboration,
    });
  } catch (error) {
    console.error('Error updating collaboration status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update payment status (after blockchain transaction)
router.patch('/:id/payment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, transactionHash } = req.body;

    if (!['paid', 'refunded'].includes(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
      return res.status(404).json({ error: 'Collaboration not found' });
    }

    // Only brand can update payment
    if (String(collaboration.brandId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    collaboration.paymentStatus = paymentStatus;
    if (transactionHash) {
      collaboration.transactionHash = transactionHash;
    }

    await collaboration.save();

    res.json({
      message: 'Payment status updated',
      collaboration,
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get collaboration statistics for a creator
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.user._id;

    const stats = await Collaboration.aggregate([
      { $match: { creatorId: creatorId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$budget' },
        },
      },
    ]);

    const formattedStats = {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      completed: 0,
      cancelled: 0,
      totalEarnings: 0,
    };

    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
      if (stat._id === 'completed') {
        formattedStats.totalEarnings = stat.totalBudget;
      }
    });

    res.json({ stats: formattedStats });
  } catch (error) {
    console.error('Error fetching collaboration stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

