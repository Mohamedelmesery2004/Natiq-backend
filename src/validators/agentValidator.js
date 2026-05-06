import Joi from 'joi';
import { TICKET_STATUS, TICKET_PRIORITY, TICKET_CATEGORY } from '../constants/index.js';

const agentLogin = {
  body: Joi.object({
    email: Joi.string().required().email().trim().lowercase(),
    password: Joi.string().required(),
    companySlug: Joi.string().required().trim().lowercase(),
  }),
};

const updateProfile = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    phone: Joi.string().trim().allow(null, ''),
    profileImage: Joi.string().trim().allow(null, ''),
    password: Joi.string().min(6).max(128),
    currentPassword: Joi.string().when('password', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),
};

const listAgentTickets = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid(...Object.values(TICKET_STATUS)),
    priority: Joi.string().valid(...Object.values(TICKET_PRIORITY)),
    category: Joi.string().valid(...Object.values(TICKET_CATEGORY)),
    queue: Joi.string().valid('unassigned', 'assigned').allow('', null),
  }),
};

const ticketIdParam = {
  params: Joi.object({
    ticketId: Joi.string().required(),
  }),
};

const agentReply = {
  params: Joi.object({
    ticketId: Joi.string().required(),
  }),
  body: Joi.object({
    content: Joi.string().required().trim().min(1).max(5000),
  }),
};

const dashboardOverview = {
  query: Joi.object({
    from: Joi.date().iso(),
    to: Joi.date().iso(),
  }),
};

const sessionIdParam = {
  params: Joi.object({
    sessionId: Joi.string().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    before: Joi.date().iso(),
    after: Joi.date().iso(),
    messageType: Joi.string().valid('user', 'assistant', 'agent', 'system'),
  }),
};

const createTask = {
  body: Joi.object({
    title: Joi.string().required().trim().min(1).max(500),
    date: Joi.string().required().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: Joi.string().allow(null, '').regex(/^([01]\d|2[0-3]):?([0-5]\d)$/),
  }),
};

const getTasks = {
  query: Joi.object({
    date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
};

const updateTask = {
  params: Joi.object({
    taskId: Joi.string().required(),
  }),
  body: Joi.object({
    title: Joi.string().trim().min(1).max(500),
    date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: Joi.string().allow(null, '').regex(/^([01]\d|2[0-3]):?([0-5]\d)$/),
    done: Joi.boolean(),
  }),
};

const deleteTask = {
  params: Joi.object({
    taskId: Joi.string().required(),
  }),
};

export { 
  agentLogin, 
  updateProfile, 
  listAgentTickets, 
  ticketIdParam, 
  agentReply, 
  dashboardOverview, 
  sessionIdParam,
  createTask,
  getTasks,
  updateTask,
  deleteTask
};
