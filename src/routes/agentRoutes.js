import { Router } from 'express';
import agentController from '../controllers/agentController.js';
import taskController from '../controllers/taskController.js';

import { protect, tenantIsolation, allowRoles } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validateMiddleware.js';
import * as agentValidator from '../validators/agentValidator.js';
import upload from '../middlewares/uploadMiddleware.js';
import chatUpload from '../middlewares/chatUploadMiddleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.post('/auth/login', validate(agentValidator.agentLogin), agentController.login);

router.use(protect, tenantIsolation, allowRoles(ROLES.AGENT, ROLES.TEAM_LEADER, ROLES.COMPANY_MANAGER, ROLES.COMPANY_OWNER));

router.get('/profile', agentController.getProfile);
router.patch('/profile', upload.single('profileImage'), validate(agentValidator.updateProfile), agentController.updateProfile);

router.get('/dashboard/overview', validate(agentValidator.dashboardOverview), agentController.getDashboard);

router.get('/tickets', validate(agentValidator.listAgentTickets), agentController.listTickets);
router.get('/tickets/:ticketId', validate(agentValidator.ticketIdParam), agentController.getTicket);
router.get('/tickets/:ticketId/messages', validate(agentValidator.ticketIdParam), agentController.getTicketMessages);
router.post('/tickets/:ticketId/claim', validate(agentValidator.ticketIdParam), agentController.claimTicket);
router.post('/tickets/:ticketId/reply', validate(agentValidator.agentReply), agentController.replyToTicket);
router.post('/tickets/:ticketId/media-reply', chatUpload.single('media'), agentController.replyMediaToTicket);
router.post('/tickets/:ticketId/resolve', validate(agentValidator.ticketIdParam), agentController.resolveTicket);
router.post('/tickets/:ticketId/close', validate(agentValidator.ticketIdParam), agentController.closeTicket);

router.get('/chat-history/:sessionId', validate(agentValidator.sessionIdParam), agentController.getChatHistory);

// Notification Routes
router.get('/notifications', agentController.getNotifications);
router.patch('/notifications/:notificationId/read', agentController.markNotificationAsRead);
router.patch('/notifications/read-all', agentController.markAllNotificationsAsRead);

// Task Routes
router.get('/tasks', validate(agentValidator.getTasks), taskController.getTasks);
router.post('/tasks', validate(agentValidator.createTask), taskController.createTask);
router.patch('/tasks/:taskId', validate(agentValidator.updateTask), taskController.updateTask);
router.delete('/tasks/:taskId', validate(agentValidator.deleteTask), taskController.deleteTask);


export default router;
