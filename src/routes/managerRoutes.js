import { Router } from 'express';
import managerController from '../controllers/managerController.js';
import { protect, tenantIsolation, requirePermission, allowRoles } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validateMiddleware.js';
import * as managerValidator from '../validators/managerValidator.js';
import { RESOURCES, ACTIONS, ROLES } from '../constants/index.js';

const router = Router();

router.use(protect, tenantIsolation);

router.get(
  '/audit-logs',
  requirePermission(RESOURCES.AUDIT_LOG, ACTIONS.READ),
  validate(managerValidator.listAuditLogs),
  managerController.listAuditLogs
);

router.get(
  '/rbac-matrix',
  allowRoles(
    ROLES.PLATFORM_SUPER_ADMIN,
    ROLES.COMPANY_MANAGER,
    ROLES.TEAM_LEADER
  ),
  managerController.getRbacMatrix
);

const managerExportRoles = allowRoles(ROLES.COMPANY_MANAGER, ROLES.PLATFORM_SUPER_ADMIN);

router.get(
  '/exports/calls',
  managerExportRoles,
  validate(managerValidator.exportQuery),
  managerController.exportCalls
);

router.get(
  '/exports/tickets',
  managerExportRoles,
  validate(managerValidator.exportQuery),
  managerController.exportTickets
);

router.get(
  '/exports/analytics-summary',
  managerExportRoles,
  validate(managerValidator.exportQuery),
  managerController.exportAnalyticsSummary
);

export default router;
