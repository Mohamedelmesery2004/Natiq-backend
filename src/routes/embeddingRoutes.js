import { Router } from 'express';
import embeddingController from '../controllers/embeddingController.js';
import { protect, tenantIsolation, requirePermission } from '../middlewares/authMiddleware.js';
import { RESOURCES, ACTIONS } from '../constants/index.js';

const router = Router();

router.use(protect, tenantIsolation);

router.get(
  '/status',
  requirePermission(RESOURCES.KNOWLEDGE_BASE, ACTIONS.READ),
  embeddingController.getStatus
);

router.post(
  '/sync',
  requirePermission(RESOURCES.KNOWLEDGE_BASE, ACTIONS.UPDATE),
  embeddingController.syncEmbeddings
);

router.post(
  '/items/:id',
  requirePermission(RESOURCES.KNOWLEDGE_BASE, ACTIONS.UPDATE),
  embeddingController.embedSingleItem
);

export default router;
