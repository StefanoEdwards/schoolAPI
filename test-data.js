require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function testData() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('schoolDB');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections found:', collections.map(c => c.name));
    
    // Count documents in each collection
    const teacherCount = await db.collection('teachers').countDocuments();
    const courseCount = await db.collection('courses').countDocuments();
    const studentCount = await db.collection('students').countDocuments();
    const testCount = await db.collection('tests').countDocuments();
    
    console.log('\n📊 Document counts:');
    console.log('- Teachers:', teacherCount);
    console.log('- Courses:', courseCount);
    console.log('- Students:', studentCount);
    console.log('- Tests:', testCount);
    
    // Get first teacher
    const firstTeacher = await db.collection('teachers').findOne({});
    console.log('\n👨‍🏫 First teacher:', firstTeacher);
    
    await client.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testData();