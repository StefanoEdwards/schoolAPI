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
function getNextID(arr) {
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
API.post("/teachers", (req, res) => {
  const { firstName, lastName, email, department } = req.body;
  if (!firstName || !lastName || !email || !department) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newTeacher = {
    id: nextTeacherId++,
    firstName,
    lastName,
    email,
    department,
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