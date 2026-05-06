import { Router } from 'express';
import adminUserController from '../controllers/adminUserController.js';
import { protect, tenantIsolation, requirePermission } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validateMiddleware.js';
import * as userValidator from '../validators/userValidator.js';
import { RESOURCES, ACTIONS } from '../constants/index.js';

const router = Router();

router.use(protect, tenantIsolation);

router.post(
  '/',
  requirePermission(RESOURCES.USERS, ACTIONS.CREATE),
  validate(userValidator.createUser),
  adminUserController.createUser
);

router.get(
  '/',
  requirePermission(RESOURCES.USERS, ACTIONS.READ),
  validate(userValidator.listUsers),
  adminUserController.listUsers
);

router.get(
  '/:id',
  requirePermission(RESOURCES.USERS, ACTIONS.READ),
  adminUserController.getUser
);

router.patch(
  '/:id',
  requirePermission(RESOURCES.USERS, ACTIONS.UPDATE),
  validate(userValidator.updateUser),
  adminUserController.updateUser
);

router.delete(
  '/:id',
  requirePermission(RESOURCES.USERS, ACTIONS.DELETE),
  adminUserController.deleteUser
);

router.post(
  '/assign-team-leader',
  requirePermission(RESOURCES.USERS, ACTIONS.UPDATE),
  validate(userValidator.assignTeamLeader),
  adminUserController.assignTeamLeader
);

export default router;
