require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
console.log('Testing connection to:', uri.replace(/:[^:@]+@/, ':****@'));

const client = new MongoClient(uri);

async function test() {
  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    await client.close();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

test();