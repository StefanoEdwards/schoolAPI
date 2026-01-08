require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
console.log('Connection URI:', uri);

const client = new MongoClient(uri);

async function testData() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // List ALL databases
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    console.log('\n🗄️  ALL Databases on cluster:');
    dbs.databases.forEach(db => {
      console.log(`  - ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    // Try the database from connection string
    const db = client.db(); // Uses database from URI
    console.log('\n📂 Currently connected to database:', db.databaseName);
    
    // List collections in current database
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections in this database:', collections.map(c => c.name));
    
    // Now try specifically 'schooldb' database
    const schoolDb = client.db('schooldb');
    const schoolCollections = await schoolDb.listCollections().toArray();
    console.log('\n📁 Collections in "schooldb":', schoolCollections.map(c => c.name));
    
    // Count documents
    const teacherCount = await schoolDb.collection('teachers').countDocuments();
    const courseCount = await schoolDb.collection('courses').countDocuments();
    const studentCount = await schoolDb.collection('students').countDocuments();
    const testCount = await schoolDb.collection('tests').countDocuments();
    
    console.log('\n📊 Document counts in schooldb:');
    console.log('- Teachers:', teacherCount);
    console.log('- Courses:', courseCount);
    console.log('- Students:', studentCount);
    console.log('- Tests:', testCount);
    
    // Get first teacher
    if (teacherCount > 0) {
      const firstTeacher = await schoolDb.collection('teachers').findOne({});
      console.log('\n👨‍🏫 First teacher:', firstTeacher);
    }
    
    await client.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testData();