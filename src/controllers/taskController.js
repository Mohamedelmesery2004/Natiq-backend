import { Task } from '../models/index.js';
import BaseController from './baseController.js';
import ApiError from '../utils/apiError.js';

class TaskController extends BaseController {
  
  createTask = this.catchAsync(async (req, res) => {
    const { title, date, time } = req.body;
    
    const task = await Task.create({
      userId: req.userId,
      companyId: req.companyId,
      title,
      date,
      time,
      done: false
    });

    this.sendSuccess(res, task, 'Task created successfully', 201);
  });

  getTasks = this.catchAsync(async (req, res) => {
    const { date } = req.query;
    const filter = { 
      userId: req.userId,
      companyId: req.companyId
    };
    
    if (date) {
      filter.date = date;
    }

    const tasks = await Task.find(filter).sort({ date: 1, time: 1 });
    this.sendSuccess(res, tasks, 'Tasks retrieved successfully');
  });

  updateTask = this.catchAsync(async (req, res) => {
    const { taskId } = req.params;
    const { title, date, time, done } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId: req.userId, companyId: req.companyId },
      { title, date, time, done },
      { new: true, runValidators: true }
    );

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    this.sendSuccess(res, task, 'Task updated successfully');
  });

  deleteTask = this.catchAsync(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findOneAndDelete({
      _id: taskId,
      userId: req.userId,
      companyId: req.companyId
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    this.sendSuccess(res, null, 'Task deleted successfully');
  });
}

export default new TaskController();
