import express from "express";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
 
dotenv.config();
 
const app = express();
app.use(express.json());
 
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
 
if (!MONGODB_URI) {
  console.log("Render sees MONGODB_URI?", Boolean(process.env.MONGODB_URI));
  console.log("Keys include MONGODB_URI?", Object.keys(process.env).includes("MONGODB_URI"));
  throw new Error("Missing MONGODB_URI in environment variables");
}
 
const client = new MongoClient(MONGODB_URI);
 
let db;
let teachersCol;
let coursesCol;
let studentsCol;
let testsCol;
 
async function connectDB() {
  await client.connect();
  db = client.db(); // uses db name from URI, or default
  teachersCol = db.collection("teachers");
  coursesCol = db.collection("courses");
  studentsCol = db.collection("students");
  testsCol = db.collection("tests");
  console.log("Connected to MongoDB Atlas");
}
 
async function getNextLegacyId(col) {
  const doc = await col.find().sort({ id: -1 }).limit(1).toArray();
  if (doc.length === 0) return 1;
  return Number(doc[0].id) + 1;
}
 
function mustBeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
 
/* -------------------- Teachers Routes -------------------- */
 
app.get("/teachers", async (req, res) => {
  const teachers = await teachersCol.find().toArray();
  res.json(teachers);
});
 
app.get("/teachers/:id", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const teacher = await teachersCol.findOne({ id });
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });
 
  res.json(teacher);
});
 
app.post("/teachers", async (req, res) => {
  const { firstName, lastName, email, department, room } = req.body;
  if (!firstName || !lastName || !email || !department) {
    return res.status(400).json({ error: "Missing required fields" });
  }
 
  const id = await getNextLegacyId(teachersCol);
 
  const newTeacher = {
    id,
    firstName,
    lastName,
    email,
    department,
    room: room || ""
  };
 
  await teachersCol.insertOne(newTeacher);
  res.status(201).json(newTeacher);
});
 
app.put("/teachers/:id", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const { firstName, lastName, email, department, room } = req.body;
 
  if (
    firstName === undefined &&
    lastName === undefined &&
    email === undefined &&
    department === undefined &&
    room === undefined
  ) {
    return res.status(400).json({ error: "No fields provided to update" });
  }
 
  const update = {};
  if (firstName !== undefined) update.firstName = firstName;
  if (lastName !== undefined) update.lastName = lastName;
  if (email !== undefined) update.email = email;
  if (department !== undefined) update.department = department;
  if (room !== undefined) update.room = room;
 
  const result = await teachersCol.findOneAndUpdate(
    { id },
    { $set: update },
    { returnDocument: "after" }
  );
 
  if (!result) return res.status(404).json({ error: "Teacher not found" });
  res.json(result);
});
 
app.delete("/teachers/:id", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const usedInCourse = await coursesCol.findOne({ teacherId: id });
  if (usedInCourse) {
    return res.status(400).json({
      error: "Cannot delete teacher that is used in course. Delete or update those courses first."
    });
  }
 
  const result = await teachersCol.findOneAndDelete({ id });
  if (!result) return res.status(404).json({ error: "Teacher not found" });
 
  res.json(result);
});
 
/* -------------------- Courses Routes -------------------- */
 
app.get("/courses", async (req, res) => {
  const courses = await coursesCol.find().toArray();
  res.json(courses);
});
 
app.get("/courses/:id", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const course = await coursesCol.findOne({ id });
  if (!course) return res.status(404).json({ error: "Course not found" });
 
  res.json(course);
});
 
app.post("/courses", async (req, res) => {
  const { code, name, teacherId, semester, room, schedule } = req.body;
 
  const tId = mustBeNumber(teacherId);
  if (!code || !name || tId === null || !semester || !room) {
    return res.status(400).json({ error: "Missing required fields" });
  }
 
  const teacher = await teachersCol.findOne({ id: tId });
  if (!teacher) {
    return res.status(400).json({ error: "teacherId must be a valid teacher id" });
  }
 
  const id = await getNextLegacyId(coursesCol);
 
  const newCourse = {
    id,
    code,
    name,
    teacherId: tId, // legacy
    teacher_id: teacher._id, // real reference
    semester,
    room,
    schedule: schedule || ""
  };
 
  await coursesCol.insertOne(newCourse);
  res.status(201).json(newCourse);
});
 
app.put("/courses/:id", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const { code, name, teacherId, semester, room, schedule } = req.body;
 
  if (
    code === undefined &&
    name === undefined &&
    teacherId === undefined &&
    semester === undefined &&
    room === undefined &&
    schedule === undefined
  ) {
    return res.status(400).json({ error: "No fields provided to update" });
  }
 
  const update = {};
  if (code !== undefined) update.code = code;
  if (name !== undefined) update.name = name;
  if (semester !== undefined) update.semester = semester;
  if (room !== undefined) update.room = room;
  if (schedule !== undefined) update.schedule = schedule;
 
  if (teacherId !== undefined) {
    const tId = mustBeNumber(teacherId);
    if (tId === null) return res.status(400).json({ error: "Invalid teacherId" });
 
    const teacher = await teachersCol.findOne({ id: tId });
    if (!teacher) {
      return res.status(400).json({ error: "teacherId must be a valid teacher id" });
    }
 
    update.teacherId = tId; // legacy
    update.teacher_id = teacher._id; // real reference
  }
 
  const result = await coursesCol.findOneAndUpdate(
    { id },
    { $set: update },
    { returnDocument: "after" }
  );
 
  if (!result) return res.status(404).json({ error: "Course not found" });
  res.json(result);
});
 
app.delete("/courses/:id", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const containsTest = await testsCol.findOne({ courseId: id });
  if (containsTest) {
    return res.status(400).json({
      error: "Cannot delete course that contains test. Delete or update your course first."
    });
  }
 
  const result = await coursesCol.findOneAndDelete({ id });
  if (!result) return res.status(404).json({ error: "Course not found" });
 
  res.json(result);
});
 
/* -------------------- Students Routes -------------------- */
 
app.get("/students", async (req, res) => {
  const students = await studentsCol.find().toArray();
  res.json(students);
});
 
app.get("/students/:id", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const student = await studentsCol.findOne({ id });
  if (!student) return res.status(404).json({ error: "Student not found" });
 
  res.json(student);
});
 
app.post("/students", async (req, res) => {
  const { firstName, lastName, grade, studentNumber, homeroom } = req.body;
 
  const g = mustBeNumber(grade);
  if (!firstName || !lastName || g === null || !studentNumber) {
    return res.status(400).json({ error: "Missing required fields" });
  }
 
  const id = await getNextLegacyId(studentsCol);
 
  const newStudent = {
    id,
    firstName,
    lastName,
    grade: g,
    studentNumber,
    homeroom: homeroom || ""
  };
 
  await studentsCol.insertOne(newStudent);
  res.status(201).json(newStudent);
});
 
app.put("/students/:id", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const { firstName, lastName, grade, studentNumber, homeroom } = req.body;
 
  if (
    firstName === undefined &&
    lastName === undefined &&
    grade === undefined &&
    studentNumber === undefined &&
    homeroom === undefined
  ) {
    return res.status(400).json({ error: "No fields provided to update" });
  }
 
  const update = {};
  if (firstName !== undefined) update.firstName = firstName;
  if (lastName !== undefined) update.lastName = lastName;
  if (grade !== undefined) {
    const g = mustBeNumber(grade);
    if (g === null) return res.status(400).json({ error: "Invalid grade" });
    update.grade = g;
  }
  if (studentNumber !== undefined) update.studentNumber = studentNumber;
  if (homeroom !== undefined) update.homeroom = homeroom;
 
  const result = await studentsCol.findOneAndUpdate(
    { id },
    { $set: update },
    { returnDocument: "after" }
  );
 
  if (!result) return res.status(404).json({ error: "Student not found" });
  res.json(result);
});
 
app.delete("/students/:id", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const containsTest = await testsCol.findOne({ studentId: id });
  if (containsTest) {
    return res.status(400).json({
      error: "Cannot delete student has test. Delete or update your student first."
    });
  }
 
  const result = await studentsCol.findOneAndDelete({ id });
  if (!result) return res.status(404).json({ error: "Student not found" });
 
  res.json(result);
});
 
/* -------------------- Tests Routes -------------------- */
 
app.get("/tests", async (req, res) => {
  const tests = await testsCol.find().toArray();
  res.json(tests);
});
 
app.get("/tests/:id", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const test = await testsCol.findOne({ id });
  if (!test) return res.status(404).json({ error: "Test not found" });
 
  res.json(test);
});
 
app.post("/tests", async (req, res) => {
  const { studentId, courseId, testName, date, mark, outOf, weight } = req.body;
 
  const sId = mustBeNumber(studentId);
  const cId = mustBeNumber(courseId);
 
  if (!testName || !date || sId === null || cId === null || mark === undefined || outOf === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }
 
  const student = await studentsCol.findOne({ id: sId });
  if (!student) return res.status(400).json({ error: "studentId must be a valid student id" });
 
  const course = await coursesCol.findOne({ id: cId });
  if (!course) return res.status(400).json({ error: "courseId must be a valid course id" });
 
  const id = await getNextLegacyId(testsCol);
 
  const newTest = {
    id,
    studentId: sId,         // legacy
    courseId: cId,          // legacy
    student_id: student._id, // real reference
    course_id: course._id,   // real reference
    testName,
    date,
    mark: Number(mark),
    outOf: Number(outOf),
    weight: weight !== undefined ? Number(weight) : null
  };
 
  await testsCol.insertOne(newTest);
  res.status(201).json(newTest);
});
 
app.put("/tests/:id", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const { studentId, courseId, testName, date, mark, outOf, weight } = req.body;
 
  if (
    studentId === undefined &&
    courseId === undefined &&
    testName === undefined &&
    date === undefined &&
    mark === undefined &&
    outOf === undefined &&
    weight === undefined
  ) {
    return res.status(400).json({ error: "No fields provided to update" });
  }
 
  const update = {};
  if (testName !== undefined) update.testName = testName;
  if (date !== undefined) update.date = date;
  if (mark !== undefined) update.mark = Number(mark);
  if (outOf !== undefined) update.outOf = Number(outOf);
  if (weight !== undefined) update.weight = Number(weight);
 
  if (studentId !== undefined) {
    const sId = mustBeNumber(studentId);
    if (sId === null) return res.status(400).json({ error: "Invalid studentId" });
    const student = await studentsCol.findOne({ id: sId });
    if (!student) return res.status(400).json({ error: "studentId must be a valid student id" });
    update.studentId = sId;
    update.student_id = student._id;
  }
 
  if (courseId !== undefined) {
    const cId = mustBeNumber(courseId);
    if (cId === null) return res.status(400).json({ error: "Invalid courseId" });
    const course = await coursesCol.findOne({ id: cId });
    if (!course) return res.status(400).json({ error: "courseId must be a valid course id" });
    update.courseId = cId;
    update.course_id = course._id;
  }
 
  const result = await testsCol.findOneAndUpdate(
    { id },
    { $set: update },
    { returnDocument: "after" }
  );
 
  if (!result) return res.status(404).json({ error: "Test not found" });
  res.json(result);
});
 
app.delete("/tests/:id", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const result = await testsCol.findOneAndDelete({ id });
  if (!result) return res.status(404).json({ error: "Test not found" });
 
  res.json(result);
});
 
/* -------------------- Extra Routes (fixed) -------------------- */
 
// student tests
app.get("/students/:id/tests", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const student = await studentsCol.findOne({ id });
  if (!student) return res.status(404).json({ error: "Student not found" });
 
  const studentTests = await testsCol.find({ studentId: id }).toArray();
  res.json(studentTests);
});
 
// course tests
app.get("/courses/:id/tests", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const course = await coursesCol.findOne({ id });
  if (!course) return res.status(404).json({ error: "Course not found" });
 
  const courseTests = await testsCol.find({ courseId: id }).toArray();
  res.json(courseTests);
});
 
// student average
app.get("/students/:id/average", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const student = await studentsCol.findOne({ id });
  if (!student) return res.status(404).json({ error: "Student not found" });
 
  const studentTests = await testsCol.find({ studentId: id }).toArray();
  if (studentTests.length === 0) return res.status(404).json({ error: "No tests found for this student" });
 
  const totalPercent = studentTests.reduce((sum, te) => sum + (te.mark / te.outOf) * 100, 0);
  const average = totalPercent / studentTests.length;
 
  res.json({ studentId: id, average: Number(average.toFixed(2)), testCount: studentTests.length });
});
 
// course average
app.get("/courses/:id/average", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const course = await coursesCol.findOne({ id });
  if (!course) return res.status(404).json({ error: "Course not found" });
 
  const courseTests = await testsCol.find({ courseId: id }).toArray();
  if (courseTests.length === 0) return res.status(404).json({ error: "No tests found for this course" });
 
  const totalPercent = courseTests.reduce((sum, te) => sum + (te.mark / te.outOf) * 100, 0);
  const average = totalPercent / courseTests.length;
 
  res.json({ courseId: id, average: Number(average.toFixed(2)), testCount: courseTests.length });
});
 
// teacher summary
app.get("/teachers/:id/summary", async (req, res) => {
  const id = mustBeNumber(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });
 
  const teacher = await teachersCol.findOne({ id });
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });
 
  const rightCourses = await coursesCol.find({ teacherId: id }).toArray();
 
  const courseSummaries = await Promise.all(
    rightCourses.map(async (c) => {
      const testCount = await testsCol.countDocuments({ courseId: c.id });
      return { courseId: c.id, courseName: c.name, testCount };
    })
  );
 
  res.status(200).json({
    teacherId: id,
    teacherName: `${teacher.firstName} ${teacher.lastName}`,
    courses: courseSummaries
  });
});
 
/* -------------------- Start Server -------------------- */
 
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
    process.exit(1);
  });