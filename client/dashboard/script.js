const student = {
    name: "Karthik",
    department: "Computer Science and Engineering",
    year: "3rd Year",
    skills: ["Java", "JavaScript", "HTML", "CSS"]
};

document.getElementById("welcomeMessage").textContent =
    `Welcome, ${student.name} 👋`;

document.getElementById("studentName").textContent =
    student.name;

document.getElementById("department").textContent =
    student.department;

document.getElementById("year").textContent =
    student.year;

document.getElementById("skills").textContent =
    student.skills.join(", ");

function openModule(moduleName) {
    alert(`You selected ${moduleName}`);
}