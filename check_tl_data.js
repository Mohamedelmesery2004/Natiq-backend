const mongoose = require('mongoose');
require('./src/models/index.js');
const { User, Ticket } = require('./src/models/index.js');
const { ROLES, TICKET_STATUS } = require('./src/constants/index.js');

mongoose.connect('mongodb://localhost:27017/natiq_dev').then(async () => {
  console.log('Connected to MongoDB');
  
  const teamLeaders = await User.find({ role: ROLES.TEAM_LEADER }).select('_id name email companyId').limit(3).lean();
  console.log('Team Leaders:', JSON.stringify(teamLeaders, null, 2));
  
  if (teamLeaders.length > 0) {
    const tl = teamLeaders[0];
    console.log('\n--- Checking TL:', tl.name, '---');
    
    const agents = await User.find({ 
      companyId: tl.companyId, 
      role: ROLES.AGENT, 
      teamLeaderId: tl._id 
    }).lean();
    console.log('Agents with this TL:', agents.length);
    
    const allAgents = await User.find({ 
      companyId: tl.companyId, 
      role: ROLES.AGENT 
    }).select('_id name teamLeaderId').lean();
    console.log('All agents in company:', allAgents.length);
    console.log('Sample agents:', JSON.stringify(allAgents.slice(0, 3), null, 2));
    
    const tickets = await Ticket.find({ companyId: tl.companyId }).limit(3).lean();
    console.log('Sample tickets:', JSON.stringify(tickets.map(t => ({ _id: t._id, status: t.status, assignedTo: t.assignedTo })), null, 2));
  }
  
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });