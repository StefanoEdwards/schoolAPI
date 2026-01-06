require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

console.log('Testing connection to:', uri.replace(/:[^:@]+@/, ':****@')); // Hide password

async function testConnection() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // List databases to confirm it's working
    const dbs = await client.db().admin().listDatabases();
    console.log('Available databases:');
    dbs.databases.forEach(db => console.log(` - ${db.name}`));
    
    await client.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();