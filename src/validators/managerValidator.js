import Joi from 'joi';

const listAuditLogs = {
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    action: Joi.string().trim().max(120),
    resourceType: Joi.string().trim().max(80),
    from: Joi.date().iso(),
    to: Joi.date().iso(),
  }),
};

const exportQuery = {
  query: Joi.object({
    from: Joi.date().iso(),
    to: Joi.date().iso(),
  }),
};

export { listAuditLogs, exportQuery };
