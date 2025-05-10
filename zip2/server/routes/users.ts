// server/routes/users.ts
import express from 'express';
import prisma from '../prisma/client';

const router = express.Router();

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error('[GET /api/users] Error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

export default router;
