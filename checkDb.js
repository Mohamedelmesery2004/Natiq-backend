import mongoose from 'mongoose';
import config from './src/config/index.js';
import { Company } from './src/models/index.js';

async function checkDb() {
  await mongoose.connect(config.mongo.uri);
  const dbName = mongoose.connection.db.databaseName;
  console.log('Connected to DB:', dbName);
  
  const companies = await Company.find({});
  console.log('Companies count:', companies.length);
  for (const c of companies) {
    console.log(`- ${c.name} (${c.slug})`);
  }
  
  process.exit(0);
}

checkDb().catch(console.dir);
