import { Router } from 'express';
import { body } from 'express-validator';
import {
  listQueues, getQueue, createQueue, updateQueue, setStatus, deleteQueue, callNext, queueTokens,
} from '../controllers/queueController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();
router.use(protect);

const rules = (optional) => {
  const wrap = (chain) => (optional ? chain.optional() : chain);
  return [
    wrap(body('name').trim().notEmpty().withMessage('Queue name is required')),
    wrap(body('prefix').trim().isLength({ min: 1, max: 3 }).withMessage('Prefix must be 1 to 3 characters')),
    wrap(body('avgServiceTime').isInt({ min: 1, max: 120 }).withMessage('Average service time must be 1 to 120 minutes')),
  ];
};

// Any logged-in user
router.get('/', listQueues);
router.get('/:id', getQueue);

// Admin only
router.post('/', adminOnly, rules(false), validate, createQueue);
router.put('/:id', adminOnly, rules(true), validate, updateQueue);
router.patch('/:id/open', adminOnly, setStatus('open'));
router.patch('/:id/close', adminOnly, setStatus('closed'));
router.post('/:id/next', adminOnly, callNext);
router.get('/:id/tokens', adminOnly, queueTokens);
router.delete('/:id', adminOnly, deleteQueue);

export default router;
