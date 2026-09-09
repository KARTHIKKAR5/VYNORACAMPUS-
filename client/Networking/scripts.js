// const container = document.getElementById("student-container");

// students.forEach(function(student) {
//     const card = document.createElement("div");

//     card.innerHTML = `
//         <h2>${student.name}</h2>
//         <p>Department: ${student.department}</p>
//         <p>Year: ${student.year}</p>
//         <p>Skills: ${student.skills.join(", ")}</p>
//         <p>Interests: ${student.interests.join(", ")}</p>
//     `;

//     container.appendChild(card);
// });

// const container = document.getElementById("student-container");
// const departmentFilter = document.getElementById("department-filter");

// function displayStudents(studentList) {
//     container.innerHTML = "";

//     studentList.forEach(function(student) {
//         const card = document.createElement("div");

//         card.innerHTML = `
//             <h2>${student.name}</h2>
//             <p>Department: ${student.department}</p>
//             <p>Year: ${student.year}</p>
//             <p>Skills: ${student.skills.join(", ")}</p>
//             <p>Interests: ${student.interests.join(", ")}</p>
//         `;

//         container.appendChild(card);
//     });
// }

// displayStudents(students);

// departmentFilter.addEventListener("change", function() {

//     const selectedDepartment = departmentFilter.value;

//     if (selectedDepartment === "all") {
//         displayStudents(students);
//     } else {
//         const filteredStudents = students.filter(function(student) {
//             return student.department === selectedDepartment;
//         });

//         displayStudents(filteredStudents);
//     }
// });


// const container = document.getElementById("student-container");
// const departmentFilter = document.getElementById("department-filter");
// const yearFilter = document.getElementById("year-filter");

// function displayStudents(studentList) {
//     container.innerHTML = "";

//     studentList.forEach(function(student) {
//         const card = document.createElement("div");

//         card.innerHTML = `
//             <h2>${student.name}</h2>
//             <p>Department: ${student.department}</p>
//             <p>Year: ${student.year}</p>
//             <p>Skills: ${student.skills.join(", ")}</p>
//             <p>Interests: ${student.interests.join(", ")}</p>
//         `;

//         container.appendChild(card);
//     });
// }

// function applyFilters() {

//     const selectedDepartment = departmentFilter.value;
//     const selectedYear = yearFilter.value;

//     const filteredStudents = students.filter(function(student) {

//         const departmentMatch =
//             selectedDepartment === "all" ||
//             student.department === selectedDepartment;

//         const yearMatch =
//             selectedYear === "all" ||
//             student.year === Number(selectedYear);

//         return departmentMatch && yearMatch;
//     });

//     displayStudents(filteredStudents);
// }

// displayStudents(students);

// departmentFilter.addEventListener("change", applyFilters);
// yearFilter.addEventListener("change", applyFilters);


const container = document.getElementById("student-container");

const searchInput = document.getElementById("search-input");
const departmentFilter = document.getElementById("department-filter");
const yearFilter = document.getElementById("year-filter");
const skillFilter = document.getElementById("skill-filter");
const interestFilter = document.getElementById("interest-filter");


function displayStudents(studentList) {

    container.innerHTML = "";

    if (studentList.length === 0) {
        container.innerHTML = "<p>No students found.</p>";
        return;
    }

    studentList.forEach(function(student) {

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
}


function applyFilters() {

    const searchText = searchInput.value.toLowerCase();

    const selectedDepartment = departmentFilter.value;
    const selectedYear = yearFilter.value;
    const selectedSkill = skillFilter.value;
    const selectedInterest = interestFilter.value;


    const filteredStudents = students.filter(function(student) {

        const nameMatch =
            student.name.toLowerCase().includes(searchText);


        const departmentMatch =
            selectedDepartment === "all" ||
            student.department === selectedDepartment;


        const yearMatch =
            selectedYear === "all" ||
            student.year === Number(selectedYear);


        const skillMatch =
            selectedSkill === "all" ||
            student.skills.includes(selectedSkill);


        const interestMatch =
            selectedInterest === "all" ||
            student.interests.includes(selectedInterest);


        return (
            nameMatch &&
            departmentMatch &&
            yearMatch &&
            skillMatch &&
            interestMatch
        );
    });


    displayStudents(filteredStudents);
}


displayStudents(students);


searchInput.addEventListener("input", applyFilters);

departmentFilter.addEventListener("change", applyFilters);

yearFilter.addEventListener("change", applyFilters);

skillFilter.addEventListener("change", applyFilters);

interestFilter.addEventListener("change", applyFilters);