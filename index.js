const express = require("express");
const fs = require("fs");
const path = require("path");

const API = express();
API.use(express.json());

// Helper functions
function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, filePath), "utf8"));
  } catch (err) {
    return [];
  }
}

function saveJson(filePath, data) {
  fs.writeFileSync(
    path.join(__dirname, filePath),
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

// Load data
let teachers = loadJson("teachers.json");
let courses = loadJson("courses.json");
let students = loadJson("students.json");
let tests = loadJson("tests.json");

// ID generator function
function getNextId(arr) {
  return arr.length ? Math.max(...arr.map(i => i.id)) + 1 : 1;
}

let nextTeacherId = getNextId(teachers);
let nextCourseId = getNextId(courses);
let nextStudentId = getNextId(students);
let nextTestId = getNextId(tests);

//TEACHER
//All teachers
API.get("/teachers", (req, res) => {
  res.json(teachers);
});

//One teacher by ID
API.get("/teachers/:id", (req, res) => {
  const teacher = teachers.find(t => t.id === parseInt(req.params.id));
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });
  res.json(teacher);
});

//Make new teacher
API.post("/teachers", (req, reFs) => {
  const { firstName, lastName, email, department, room } = req.body;
  if (!firstName || !lastName || !email || !department || !room) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newTeacher = {
    id: nextTeacherId++,
    firstName,
    lastName,
    email,
    department,
    room,
  };

  teachers.push(newTeacher);
  saveJson("teachers.json", teachers);
  res.status(201).json(newTeacher);
});

//Update a teacher
API.put("/teachers/:id", (req, res) => {
  const teacher = teachers.find(t => t.id === parseInt(req.params.id));
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });

  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  Object.assign(teacher, req.body);
  saveJson("teachers.json", teachers);
  res.json(teacher);
});

//Delete a teacher
API.delete("/teachers/:id", (req, res) => {
  const id = parseInt(req.params.id);

  const assigned = courses.some(c => c.teacherId === id);
  if (assigned) return res.status(400).json({ error: "Teacher still teaches a course" });

  const index = teachers.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: "Teacher not found" });

  teachers.splice(index, 1);
  saveJson("teachers.json", teachers);
  res.json({ message: "Teacher deleted" });
});

//COURSES
//Get all courses
API.get("/courses", (req, res) => {
  res.json(courses);
});

//Get one course by ID
API.get("/courses/:id", (req, res) => {
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if (!course) return res.status(404).json({ error: "Course not found" });
  res.json(course);
});

//Create a new course
API.post("/courses", (req, res) => {
  const { code, name, teacherId, semester, room } = req.body;

  if (!code || !name || !teacherId || !semester || !room) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!teachers.some(t => t.id === teacherId)) {
    return res.status(400).json({ error: "Invalid teacherId" });
  }

  const newCourse = {
    id: nextCourseId++,
    code,
    name,
    teacherId,
    semester,
    room,
  };

  courses.push(newCourse);
  saveJson("courses.json", courses);
  res.status(201).json(newCourse);
});

//Update a course
API.put("/courses/:id", (req, res) => {
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if (!course) return res.status(404).json({ error: "Course not found" });

  if (req.body.teacherId && !teachers.some(t => t.id === req.body.teacherId)) {
    return res.status(400).json({ error: "Invalid teacherId" });
  }

  Object.assign(course, req.body);
  saveJson("courses.json", courses);
  res.json(course);
});

//Delete a course
API.delete("/courses/:id", (req, res) => {
  const id = parseInt(req.params.id);

  const hasTests = tests.some(t => t.courseId === id);
  if (hasTests) return res.status(400).json({ error: "Tests exist for this course" });

  const index = courses.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: "Course not found" });

  courses.splice(index, 1);
  saveJson("courses.json", courses);
  res.json({ message: "Course deleted" });
});

//STUDENTS
//Get all students
API.get("/students", (req, res) => {
  res.json(students);
});

//Get one student by ID
API.get("/students/:id", (req, res) => {
  const student = students.find(s => s.id === parseInt(req.params.id));
  if (!student) return res.status(404).json({ error: "Student not found" });
  res.json(student);
});

//Create a new student
API.post("/students", (req, res) => {
  const { firstName, lastName, grade, studentNumber } = req.body;

  if (!firstName || !lastName || !grade || !studentNumber) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newStudent = {
    id: nextStudentId++,
    firstName,
    lastName,
    grade,
    studentNumber,
  };

  students.push(newStudent);
  saveJson("students.json", students);
  res.status(201).json(newStudent);
});

//Update a student
API.put("/students/:id", (req, res) => {
  const student = students.find(s => s.id === parseInt(req.params.id));
  if (!student) return res.status(404).json({ error: "Student not found" });

  Object.assign(student, req.body);
  saveJson("students.json", students);
  res.json(student);
});

//Delete a student
API.delete("/students/:id", (req, res) => {
  const id = parseInt(req.params.id);

  const hasTests = tests.some(t => t.studentId === id);
  if (hasTests) return res.status(400).json({ error: "Tests exist for this student" });

  const index = students.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ error: "Student not found" });

  students.splice(index, 1);
  saveJson("students.json", students);
  res.json({ message: "Student deleted" });
});

//TESTS
//Get all tests
API.get("/tests", (req, res) => {
  res.json(tests);
});

//Get one test by ID
API.get("/tests/:id", (req, res) => {
  const test = tests.find(t => t.id === parseInt(req.params.id));
  if (!test) return res.status(404).json({ error: "Test not found" });
  res.json(test);
});

//Create a new test
API.post("/tests", (req, res) => {
  const { studentId, courseId, testName, date, mark, outOf } = req.body;

  if (!studentId || !courseId || !testName || !date || mark == null || outOf == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!students.some(s => s.id === studentId)) return res.status(400).json({ error: "Invalid studentId" });
  if (!courses.some(c => c.id === courseId)) return res.status(400).json({ error: "Invalid courseId" });

  const newTest = {
    id: nextTestId++,
    studentId,
    courseId,
    testName,
    date,
    mark,
    outOf,
  };

  tests.push(newTest);
  saveJson("tests.json", tests);
  res.status(201).json(newTest);
});

//Update a test
API.put("/tests/:id", (req, res) => {
  const test = tests.find(t => t.id === parseInt(req.params.id));
  if (!test) return res.status(404).json({ error: "Test not found" });

  if (req.body.studentId && !students.some(s => s.id === req.body.studentId)) {
    return res.status(400).json({ error: "Invalid studentId" });
  }

  if (req.body.courseId && !courses.some(c => c.id === req.body.courseId)) {
    return res.status(400).json({ error: "Invalid courseId" });
  }

  Object.assign(test, req.body);
  saveJson("tests.json", tests);
  res.json(test);
});

//Delete a test
API.delete("/tests/:id", (req, res) => {
  const index = tests.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Test not found" });

  tests.splice(index, 1);
  saveJson("tests.json", tests);
  res.json({ message: "Test deleted" });
});

//Start server
API.listen(3000, () => console.log("Server running on port 3000"));