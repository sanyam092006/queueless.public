import { Router } from 'express';
import { body } from 'express-validator';
import { createToken, myTokens, cancelToken } from '../controllers/tokenController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();
router.use(protect);

router.post('/', [body('queueId').isMongoId().withMessage('A valid queueId is required')], validate, createToken);
router.get('/my', myTokens);
router.patch('/:id/cancel', cancelToken);

export default router;
