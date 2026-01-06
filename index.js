require('dotenv').config();
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const API = express();
API.use(express.json());

// MongoDB setup
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;
let teachersCollection;
let coursesCollection;
let studentsCollection;
let testsCollection;

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    
    db = client.db("schoolDB");
    teachersCollection = db.collection("teachers");
    coursesCollection = db.collection("courses");
    studentsCollection = db.collection("students");
    testsCollection = db.collection("tests");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

// TEACHERS
// Get all teachers
API.get("/teachers", async (req, res) => {
  try {
    const teachers = await teachersCollection.find({}).toArray();
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one teacher by ID
API.get("/teachers/:id", async (req, res) => {
  try {
    const teacher = await teachersCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new teacher
API.post("/teachers", async (req, res) => {
  try {
    const { firstName, lastName, email, department, room } = req.body;
    
    if (!firstName || !lastName || !email || !department || !room) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newTeacher = { firstName, lastName, email, department, room };
    const result = await teachersCollection.insertOne(newTeacher);
    
    res.status(201).json({ _id: result.insertedId, ...newTeacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a teacher
API.put("/teachers/:id", async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const result = await teachersCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );

    if (!result.value) return res.status(404).json({ error: "Teacher not found" });
    res.json(result.value);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a teacher
API.delete("/teachers/:id", async (req, res) => {
  try {
    const teacherId = req.params.id;
    
    const assigned = await coursesCollection.findOne({ teacherId });
    if (assigned) {
      return res.status(400).json({ error: "Teacher still teaches a course" });
    }

    const result = await teachersCollection.deleteOne({ _id: new ObjectId(teacherId) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    
    res.json({ message: "Teacher deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// COURSES
// Get all courses
API.get("/courses", async (req, res) => {
  try {
    const courses = await coursesCollection.find({}).toArray();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one course by ID
API.get("/courses/:id", async (req, res) => {
  try {
    const course = await coursesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new course
API.post("/courses", async (req, res) => {
  try {
    const { code, name, teacherId, semester, room } = req.body;

    if (!code || !name || !teacherId || !semester || !room) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const teacher = await teachersCollection.findOne({ _id: new ObjectId(teacherId) });
    if (!teacher) {
      return res.status(400).json({ error: "Invalid teacherId" });
    }

    const newCourse = { code, name, teacherId, semester, room };
    const result = await coursesCollection.insertOne(newCourse);
    
    res.status(201).json({ _id: result.insertedId, ...newCourse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a course
API.put("/courses/:id", async (req, res) => {
  try {
    if (req.body.teacherId) {
      const teacher = await teachersCollection.findOne({ _id: new ObjectId(req.body.teacherId) });
      if (!teacher) {
        return res.status(400).json({ error: "Invalid teacherId" });
      }
    }

    const result = await coursesCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );

    if (!result.value) return res.status(404).json({ error: "Course not found" });
    res.json(result.value);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a course
API.delete("/courses/:id", async (req, res) => {
  try {
    const courseId = req.params.id;
    
    const hasTests = await testsCollection.findOne({ courseId });
    if (hasTests) {
      return res.status(400).json({ error: "Tests exist for this course" });
    }

    const result = await coursesCollection.deleteOne({ _id: new ObjectId(courseId) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Course not found" });
    }
    
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STUDENTS
// Get all students
API.get("/students", async (req, res) => {
  try {
    const students = await studentsCollection.find({}).toArray();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one student by ID
API.get("/students/:id", async (req, res) => {
  try {
    const student = await studentsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new student
API.post("/students", async (req, res) => {
  try {
    const { firstName, lastName, grade, studentNumber } = req.body;

    if (!firstName || !lastName || !grade || !studentNumber) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newStudent = { firstName, lastName, grade, studentNumber };
    const result = await studentsCollection.insertOne(newStudent);
    
    res.status(201).json({ _id: result.insertedId, ...newStudent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a student
API.put("/students/:id", async (req, res) => {
  try {
    const result = await studentsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );

    if (!result.value) return res.status(404).json({ error: "Student not found" });
    res.json(result.value);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a student
API.delete("/students/:id", async (req, res) => {
  try {
    const studentId = req.params.id;
    
    const hasTests = await testsCollection.findOne({ studentId });
    if (hasTests) {
      return res.status(400).json({ error: "Tests exist for this student" });
    }

    const result = await studentsCollection.deleteOne({ _id: new ObjectId(studentId) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    
    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TESTS
// Get all tests
API.get("/tests", async (req, res) => {
  try {
    const tests = await testsCollection.find({}).toArray();
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one test by ID
API.get("/tests/:id", async (req, res) => {
  try {
    const test = await testsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!test) return res.status(404).json({ error: "Test not found" });
    res.json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new test
API.post("/tests", async (req, res) => {
  try {
    const { studentId, courseId, testName, date, mark, outOf } = req.body;

    if (!studentId || !courseId || !testName || !date || mark == null || outOf == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
    if (!student) return res.status(400).json({ error: "Invalid studentId" });

    const course = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
    if (!course) return res.status(400).json({ error: "Invalid courseId" });

    const newTest = { studentId, courseId, testName, date, mark, outOf };
    const result = await testsCollection.insertOne(newTest);
    
    res.status(201).json({ _id: result.insertedId, ...newTest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a test
API.put("/tests/:id", async (req, res) => {
  try {
    if (req.body.studentId) {
      const student = await studentsCollection.findOne({ _id: new ObjectId(req.body.studentId) });
      if (!student) {
        return res.status(400).json({ error: "Invalid studentId" });
      }
    }

    if (req.body.courseId) {
      const course = await coursesCollection.findOne({ _id: new ObjectId(req.body.courseId) });
      if (!course) {
        return res.status(400).json({ error: "Invalid courseId" });
      }
    }

    const result = await testsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );

    if (!result.value) return res.status(404).json({ error: "Test not found" });
    res.json(result.value);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a test
API.delete("/tests/:id", async (req, res) => {
  try {
    const result = await testsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Test not found" });
    }
    
    res.json({ message: "Test deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BONUS ENDPOINTS
// List tests for student
API.get("/students/:id/tests", async (req, res) => {
  try {
    const studentId = req.params.id;
    
    const student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
    if (!student) return res.status(404).json({ error: "Student not found" });
    
    const studentTests = await testsCollection.find({ studentId }).toArray();
    res.json(studentTests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List tests for course
API.get("/courses/:id/tests", async (req, res) => {
  try {
    const courseId = req.params.id;
    
    const course = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
    if (!course) return res.status(404).json({ error: "Course not found" });
    
    const courseTests = await testsCollection.find({ courseId }).toArray();
    res.json(courseTests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student average
API.get("/students/:id/average", async (req, res) => {
  try {
    const studentId = req.params.id;
    
    const student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
    if (!student) return res.status(404).json({ error: "Student not found" });
    
    const studentTests = await testsCollection.find({ studentId }).toArray();
    
    if (studentTests.length === 0) {
      return res.json({
        studentId,
        testCount: 0,
        averagePercent: 0
      });
    }
    
    const percentages = studentTests.map(t => (t.mark / t.outOf) * 100);
    const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    
    res.json({
      studentId,
      testCount: studentTests.length,
      averagePercent: Math.round(average * 10) / 10
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Course average
API.get("/courses/:id/average", async (req, res) => {
  try {
    const courseId = req.params.id;
    
    const course = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
    if (!course) return res.status(404).json({ error: "Course not found" });
    
    const courseTests = await testsCollection.find({ courseId }).toArray();
    
    if (courseTests.length === 0) {
      return res.json({
        courseId,
        testCount: 0,
        averagePercent: 0
      });
    }
    
    const percentages = courseTests.map(t => (t.mark / t.outOf) * 100);
    const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    
    res.json({
      courseId,
      testCount: courseTests.length,
      averagePercent: Math.round(average * 10) / 10
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Summarize teacher
API.get("/teachers/:id/summary", async (req, res) => {
  try {
    const teacherId = req.params.id;
    
    const teacher = await teachersCollection.findOne({ _id: new ObjectId(teacherId) });
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });
    
    const teacherCourses = await coursesCollection.find({ teacherId }).toArray();
    
    const coursesWithTestCount = await Promise.all(
      teacherCourses.map(async (course) => {
        const testCount = await testsCollection.countDocuments({ courseId: course._id.toString() });
        return {
          courseId: course._id,
          code: course.code,
          testCount
        };
      })
    );
    
    res.json({
      teacherId,
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      courses: coursesWithTestCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
async function startServer() {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3000;
    API.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();