const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

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