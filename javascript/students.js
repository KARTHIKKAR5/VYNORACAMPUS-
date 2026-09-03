const students = [
  {
    name: "Varshitha",
    email: "varshitha@gmail.com",
    department: "CSE",
    year: 3,
    skills: ["JavaScript", "React", "Python"],
    interests: ["Web Development", "AI", "Hackathons"]
  },
  {
    name: "Karthik",
    email: "karthik@gmail.com",
    department: "CSE",
    year: 3,
    skills: ["Java", "Node.js", "MongoDB"],
    interests: ["Backend Development", "Cloud", "Hackathons"]
  },
  {
    name: "Ram",
    email: "ram@gmail.com",
    department: "CSE",
    year: 3,
    skills: ["Python", "Django", "SQL"],
    interests: ["Machine Learning", "Data Science"]
  },
  {
    name: "Deep",
    email: "deep@gmail.com",
    department: "ECE",
    year: 3,
    skills: ["C", "Embedded Systems", "Python"],
    interests: ["IoT", "Robotics", "AI"]
  },
  {
    name: "SR",
    email: "sr@gmail.com",
    department: "AIML",
    year: 3,
    skills: ["Python", "Machine Learning", "TensorFlow"],
    interests: ["AI", "Deep Learning", "Research"]
  }
];

// Accessing properties
console.log(students[0].name);
console.log(students[1].department);
console.log(students[2].skills);

// Changing a property
students[0].year = 4;
console.log(students[0].year);

// Adding a new property
students[0].githubUsername = "varshitha123";
console.log(students[0].githubUsername);

// Accessing an item inside an array
console.log(students[0].skills[0]);

// Printing every student's department
students.forEach((student) => {
  console.log(student.name, "-", student.department);
});