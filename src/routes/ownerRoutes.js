import { Router } from 'express';
import ownerController from '../controllers/ownerController.js';
import { protect, tenantIsolation, allowRoles } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validateMiddleware.js';
import * as ownerValidator from '../validators/ownerValidator.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Protect all owner routes and ensure tenant isolation
router.use(protect, tenantIsolation, allowRoles(ROLES.COMPANY_OWNER));

// Dashboard
router.get('/dashboard', ownerController.getDashboardSummary);

// Company Settings
router.get('/settings', ownerController.getCompanySettings);
router.put('/settings', validate(ownerValidator.updateCompanySettings), ownerController.updateCompanySettings);

// Telegram webhook management
router.post('/telegram/webhook', ownerController.updateTelegramWebhook);

// Managers
router.get('/managers', ownerController.listManagers);

export default router;
