const student = {
    name: "Karthik",
    department: "Computer Science and Engineering",
    year: "3rd Year",
    skills: ["Java", "JavaScript", "HTML", "CSS"]
};

const modules = [
    {
        name: "Networking",
        icon: "🤝",
        description: "Connect with students."
    },
    {
        name: "Resources",
        icon: "📚",
        description: "Find notes and resources."
    },
    {
        name: "Projects",
        icon: "🚀",
        description: "Find projects and teammates."
    },
    {
        name: "Communication",
        icon: "💬",
        description: "Chat with students and teams."
    },
    {
        name: "Campus Services",
        icon: "🏫",
        description: "Check campus facilities and services."
    }
];

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


const moduleContainer =
    document.getElementById("moduleContainer");


modules.map(function(module) {

    const card = document.createElement("div");

    card.className = "module-card";

    card.innerHTML = `
        <h3>${module.icon} ${module.name}</h3>
        <p>${module.description}</p>
    `;

    card.addEventListener("click", function() {
        openModule(module.name);
    });

    moduleContainer.appendChild(card);
});


function openModule(moduleName) {
    alert(`You selected ${moduleName}`);
}