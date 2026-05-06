import mongoose from 'mongoose';
import { Ticket, User, TicketFeedback, Call } from '../../models/index.js';

import { TICKET_STATUS, TICKET_PRIORITY } from '../../constants/index.js';

class AgentDashboardService {
  async getAgentDashboard(companyId, agentId, { from, to } = {}) {
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const baseMatch = { companyId: new mongoose.Types.ObjectId(companyId), assignedTo: new mongoose.Types.ObjectId(agentId) };
    if (hasDateFilter) baseMatch.createdAt = dateFilter;

    const [
      flaggedTicketsCount,
      runningTicketsCount,
      pendingTicketsCount,
      resolvedTicketsCount,
      closedTicketsCount,
      totalAssignedCount,
      avgFirstResponseAgg,
      avgResolutionAgg,
      totalCallsCount,
      answeredCallsCount,
      missedCallsCount,
      avgCallDurationAgg,
      channelDistribution,
      profile,
      feedbackAgg,
    ] = await Promise.all([
      Ticket.countDocuments({
        ...baseMatch,
        priority: { $in: [TICKET_PRIORITY.URGENT, TICKET_PRIORITY.HIGH] },
        status: { $nin: [TICKET_STATUS.CLOSED] },
      }),
      Ticket.countDocuments({ ...baseMatch, status: TICKET_STATUS.IN_PROGRESS }),
      Ticket.countDocuments({ ...baseMatch, status: TICKET_STATUS.OPEN }),
      Ticket.countDocuments({ ...baseMatch, status: TICKET_STATUS.RESOLVED }),
      Ticket.countDocuments({ ...baseMatch, status: TICKET_STATUS.CLOSED }),
      Ticket.countDocuments(baseMatch),
      Ticket.aggregate([
        { $match: { ...baseMatch, firstResponseAt: { $ne: null } } },
        { $project: { responseTime: { $subtract: ['$firstResponseAt', '$createdAt'] } } },
        { $group: { _id: null, avgTime: { $avg: '$responseTime' } } },
      ]),
      Ticket.aggregate([
        { $match: { ...baseMatch, resolvedAt: { $ne: null } } },
        { $project: { resolutionTime: { $subtract: ['$resolvedAt', '$createdAt'] } } },
        { $group: { _id: null, avgTime: { $avg: '$resolutionTime' } } },
      ]),
      Call.countDocuments({ companyId: new mongoose.Types.ObjectId(companyId), agentId: new mongoose.Types.ObjectId(agentId) }),
      Call.countDocuments({ companyId: new mongoose.Types.ObjectId(companyId), agentId: new mongoose.Types.ObjectId(agentId), answeredAt: { $ne: null } }),
      Call.countDocuments({ companyId: new mongoose.Types.ObjectId(companyId), agentId: new mongoose.Types.ObjectId(agentId), status: 'missed' }),
      Call.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId), agentId: new mongoose.Types.ObjectId(agentId), answeredAt: { $ne: null } } },
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
      ]),
      Ticket.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$channel', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.findById(agentId).select('name email phone profileImage role lastLogin').lean(),
      TicketFeedback.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId), agentId: new mongoose.Types.ObjectId(agentId) } },
        {
          $group: {
            _id: null,
            totalRatings: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            satisfiedCount: {
              $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] }
            },
            count1Star: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
            count2Star: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            count3Star: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            count4Star: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            count5Star: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } }
          }
        }
      ]),
    ]);

    const totalCalls = totalCallsCount || 0;
    const answeredCalls = answeredCallsCount || 0;
    const missedCalls = missedCallsCount || 0;
    const avgCallDurationSec = avgCallDurationAgg[0] ? Math.round(avgCallDurationAgg[0].avgDuration) : 0;

    const avgFirstResponseTime = avgFirstResponseAgg[0]
      ? Math.round(avgFirstResponseAgg[0].avgTime / 60000)
      : 0;
    const avgResolutionTime = avgResolutionAgg[0]
      ? Math.round(avgResolutionAgg[0].avgTime / 60000)
      : 0;

    const timeSeriesStart = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const timeSeriesMatch = {
      companyId: new mongoose.Types.ObjectId(companyId),
      assignedTo: new mongoose.Types.ObjectId(agentId),
      createdAt: { $gte: timeSeriesStart },
    };
    if (to) timeSeriesMatch.createdAt.$lte = new Date(to);

    const [assignedPerDay, resolvedPerDay] = await Promise.all([
      Ticket.aggregate([
        { $match: timeSeriesMatch },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Ticket.aggregate([
        { $match: { ...timeSeriesMatch, resolvedAt: { $ne: null } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$resolvedAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const channelTotal = channelDistribution.reduce((sum, c) => sum + c.count, 0) || 1;

    const feedbackData = feedbackAgg[0] || {
      totalRatings: 0,
      avgRating: 0,
      satisfiedCount: 0,
      count1Star: 0, count2Star: 0, count3Star: 0, count4Star: 0, count5Star: 0
    };

    const avgFeedbackValue = Math.round(feedbackData.avgRating * 10) / 10;
    const csatPercentage = feedbackData.totalRatings > 0 
      ? Math.round((feedbackData.satisfiedCount / feedbackData.totalRatings) * 100)
      : 0;

    const goalTarget = 500;
    const goalPercentage = Math.round((resolvedTicketsCount / goalTarget) * 100);

    const avgFirstResponseMs = avgFirstResponseAgg[0] ? avgFirstResponseAgg[0].avgTime : 0;
    const avgFirstResponseSec = Math.round(avgFirstResponseMs / 1000);

    const avgResolutionMs = avgResolutionAgg[0] ? avgResolutionAgg[0].avgTime : 0;
    const avgResMinutes = Math.floor(avgResolutionMs / 60000);
    const avgResSeconds = Math.floor((avgResolutionMs % 60000) / 1000);
    const formattedAvgResDuration = `${avgResMinutes}:${avgResSeconds < 10 ? '0' : ''}${avgResSeconds}s`;

    const avgCallMinutes = Math.floor(avgCallDurationSec / 60);
    const avgCallSeconds = avgCallDurationSec % 60;
    const formattedAvgCallDuration = `${avgCallMinutes}:${avgCallSeconds < 10 ? '0' : ''}${avgCallSeconds}s`;


    return {
      kpis: {
        flaggedTicketsCount,
        runningTicketsCount,
        pendingTicketsCount,
        avgFirstResponseTime,
        avgResolutionTime,
      },
      uiKpis: {
        flaggedTickets: flaggedTicketsCount,
        pendingTickets: pendingTicketsCount,
        avgLateReplySec: avgFirstResponseSec,
        avgLateReplyString: `${avgFirstResponseSec}s`,
        avgCallDurationString: formattedAvgCallDuration,
        goalTickets: {
          total: goalTarget,
          current: resolvedTicketsCount,
          percentageCompleted: goalPercentage > 100 ? 100 : goalPercentage
        },
        avgFeedback: avgFeedbackValue,
        csatScore: csatPercentage 
      },
      callStats: {
        totalCalls,
        answeredCalls,
        missedCalls,
        avgDurationSec: avgCallDurationSec,
        avgDurationString: formattedAvgCallDuration
      },

      feedbackStats: {
        totalRatings: feedbackData.totalRatings,
        avgRating: avgFeedbackValue,
        csat: csatPercentage,
        ratingBreakdown: {
          "1": feedbackData.count1Star,
          "2": feedbackData.count2Star,
          "3": feedbackData.count3Star,
          "4": feedbackData.count4Star,
          "5": feedbackData.count5Star
        }
      },
      tasks: {
        assignedTicketsCount: totalAssignedCount || 0,
        openTicketsCount: pendingTicketsCount,
        inProgressTicketsCount: runningTicketsCount,
        resolvedTicketsCount,
        closedTicketsCount,
        lastActivityAt: profile?.lastLogin || null,
      },

      timeSeries: {
        assignedPerDay: assignedPerDay.map((d) => ({ date: d._id, count: d.count })),
        resolvedPerDay: resolvedPerDay.map((d) => ({ date: d._id, count: d.count })),
      },
      channelDistribution: channelDistribution.map((c) => ({
        channel: c._id,
        count: c.count,
        percentage: Math.round((c.count / channelTotal) * 100),
      })),
      profile,
    };
  }

  async getAgentsOverview(companyId, { from, to } = {}) {
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const ticketMatch = { companyId: new mongoose.Types.ObjectId(companyId), assignedTo: { $ne: null } };
    if (hasDateFilter) ticketMatch.createdAt = dateFilter;

    const agentStats = await Ticket.aggregate([
      { $match: ticketMatch },
      {
        $group: {
          _id: '$assignedTo',
          totalAssigned: { $sum: 1 },
          openCount: { $sum: { $cond: [{ $eq: ['$status', TICKET_STATUS.OPEN] }, 1, 0] } },
          inProgressCount: { $sum: { $cond: [{ $eq: ['$status', TICKET_STATUS.IN_PROGRESS] }, 1, 0] } },
          resolvedCount: { $sum: { $cond: [{ $eq: ['$status', TICKET_STATUS.RESOLVED] }, 1, 0] } },
          closedCount: { $sum: { $cond: [{ $eq: ['$status', TICKET_STATUS.CLOSED] }, 1, 0] } },
          avgFirstResponse: {
            $avg: {
              $cond: [
                { $ne: ['$firstResponseAt', null] },
                { $subtract: ['$firstResponseAt', '$createdAt'] },
                null,
              ],
            },
          },
          avgResolution: {
            $avg: {
              $cond: [
                { $ne: ['$resolvedAt', null] },
                { $subtract: ['$resolvedAt', '$createdAt'] },
                null,
              ],
            },
          },
          categories: { $push: '$category' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'agent',
        },
      },
      { $unwind: '$agent' },
      {
        $project: {
          agentId: '$_id',
          name: '$agent.name',
          email: '$agent.email',
          profileImage: '$agent.profileImage',
          tasks: {
            assigned: '$totalAssigned',
            open: '$openCount',
            inProgress: '$inProgressCount',
            resolved: '$resolvedCount',
            closed: '$closedCount',
          },
          performance: {
            avgFirstResponseTime: {
              $cond: [
                { $ne: ['$avgFirstResponse', null] },
                { $round: [{ $divide: ['$avgFirstResponse', 60000] }, 0] },
                0,
              ],
            },
            avgResolutionTime: {
              $cond: [
                { $ne: ['$avgResolution', null] },
                { $round: [{ $divide: ['$avgResolution', 60000] }, 0] },
                0,
              ],
            },
          },
          categories: 1,
        },
      },
      { $sort: { 'tasks.resolved': -1 } },
    ]);

    return agentStats.map((agent) => {
      const catCounts = {};
      (agent.categories || []).forEach((c) => {
        catCounts[c] = (catCounts[c] || 0) + 1;
      });
      const topCategories = Object.entries(catCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        agentId: agent.agentId,
        name: agent.name,
        email: agent.email,
        profileImage: agent.profileImage,
        tasks: agent.tasks,
        performance: agent.performance,
        topCategories,
      };
    });
  }
}

export default new AgentDashboardService();
