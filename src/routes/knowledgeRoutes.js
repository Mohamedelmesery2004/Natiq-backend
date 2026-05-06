import { Router } from 'express';
import knowledgeController from '../controllers/knowledgeController.js';
import { protect, tenantIsolation, requirePermission } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validateMiddleware.js';
import {
  createKnowledge,
  updateKnowledge,
  listKnowledge,
} from '../validators/knowledgeValidator.js';
import { RESOURCES, ACTIONS } from '../constants/index.js';

const router = Router();

router.use(protect, tenantIsolation);

router.post(
  '/',
  requirePermission(RESOURCES.KNOWLEDGE_BASE, ACTIONS.CREATE),
  validate(createKnowledge),
  knowledgeController.createKnowledgeItem
);

router.get(
  '/',
  requirePermission(RESOURCES.KNOWLEDGE_BASE, ACTIONS.READ),
  validate(listKnowledge),
  knowledgeController.listKnowledgeItems
);

router.get(
  '/:id',
  requirePermission(RESOURCES.KNOWLEDGE_BASE, ACTIONS.READ),
  knowledgeController.getKnowledgeItem
);

router.patch(
  '/:id',
  requirePermission(RESOURCES.KNOWLEDGE_BASE, ACTIONS.UPDATE),
  validate(updateKnowledge),
  knowledgeController.updateKnowledgeItem
);

router.delete(
  '/:id',
  requirePermission(RESOURCES.KNOWLEDGE_BASE, ACTIONS.DELETE),
  knowledgeController.deleteKnowledgeItem
);

export default router;
