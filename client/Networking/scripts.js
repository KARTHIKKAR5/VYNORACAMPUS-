const container = document.getElementById("student-container");

students.forEach(function(student) {
    const card = document.createElement("div");

    card.innerHTML = `
        <h2>${student.name}</h2>
        <p>Department: ${student.department}</p>
        <p>Year: ${student.year}</p>
        <p>Skills: ${student.skills.join(", ")}</p>
        <p>Interests: ${student.interests.join(", ")}</p>
    `;

    container.appendChild(card);
});