const defaultProjects = [
  {
    id: 1,
    title: "AI Study Assistant",
    description:
      "An AI-powered assistant that helps students understand study materials.",
    owner: "Varshitha",
    department: "AIML",
    requiredSkills: ["Python", "Machine Learning", "React"],
    teamSize: 4,
    members: ["Varshitha"],
    joinRequests: []
  },

  {
    id: 2,
    title: "Campus Event Manager",
    description:
      "A platform where students can discover and manage college events.",
    owner: "Karthik",
    department: "CSE",
    requiredSkills: ["JavaScript", "Node.js", "MongoDB"],
    teamSize: 4,
    members: ["Karthik", "Ram"],
    joinRequests: []
  },

  {
    id: 3,
    title: "Smart Attendance System",
    description:
      "A smart attendance system using AI to automate attendance records.",
    owner: "Deep",
    department: "ECE",
    requiredSkills: ["Python", "OpenCV", "AI"],
    teamSize: 4,
    members: ["Deep"],
    joinRequests: []
  },

  {
    id: 4,
    title: "Student Resource Hub",
    description:
      "A platform where students can share notes and useful learning resources.",
    owner: "SR",
    department: "CSE",
    requiredSkills: ["React", "Node.js", "MongoDB"],
    teamSize: 3,
    members: ["SR"],
    joinRequests: []
  }
];


// Simulated logged-in student
const currentStudent = "Deep"; // Change this to test different students


// Storage key
const storageKey = "vynoraProjects_v2";


// Load projects
let projects =
  JSON.parse(localStorage.getItem(storageKey)) ||
  defaultProjects;


// Make sure old data has the new joinRequests property
projects.forEach((project) => {

  if (!project.joinRequests) {
    project.joinRequests = [];
  }

  if (!project.members) {
    project.members = [];
  }

});


// Save projects
function saveProjects() {

  localStorage.setItem(
    storageKey,
    JSON.stringify(projects)
  );

}


// Get project container
const projectContainer =
  document.getElementById("project-container");


// Create one project card
function createProjectCard(project) {

  const card = document.createElement("div");

  card.className = "project-card";


  const isOwner =
    project.owner === currentStudent;


  const alreadyMember =
    project.members.includes(currentStudent);


  const requestSent =
    project.joinRequests.includes(currentStudent);


  card.innerHTML = `

    <h3>${project.title}</h3>

    <p>
      ${project.description}
    </p>

    <p>
      <strong>Created by:</strong>
      ${project.owner}
    </p>

    <p>
      <strong>Department:</strong>
      ${project.department}
    </p>

    <p>
      <strong>Required Skills:</strong>
    </p>

    <div class="skills">

      ${project.requiredSkills
        .map(
          (skill) =>
            `<span class="skill">${skill}</span>`
        )
        .join("")}

    </div>

    <p>
      <strong>Team:</strong>
      ${project.members.length}/${project.teamSize}
    </p>


    <button
      class="view-btn"
      onclick="viewProject(${project.id})"
    >
      View Project
    </button>


    ${
      !isOwner &&
      !alreadyMember &&
      !requestSent &&
      project.members.length < project.teamSize
        ? `
          <button
            class="join-btn"
            onclick="requestToJoin(${project.id})"
          >
            Request to Join
          </button>
        `
        : ""
    }


    ${
      requestSent
        ? `
          <button
            class="join-btn"
            disabled
          >
            Request Sent
          </button>
        `
        : ""
    }


    ${
      alreadyMember
        ? `
          <p class="member-status">
            <strong>You are already a team member.</strong>
          </p>
        `
        : ""
    }


    ${
      isOwner && project.joinRequests.length > 0
        ? `

          <div class="requests">

            <h4>Join Requests</h4>

            ${project.joinRequests
              .map(
                (student) => `

                  <div class="request">

                    <span>
                      ${student}
                    </span>

                    <button
                      onclick="acceptRequest(
                        ${project.id},
                        '${student}'
                      )"
                    >
                      Accept
                    </button>

                    <button
                      onclick="rejectRequest(
                        ${project.id},
                        '${student}'
                      )"
                    >
                      Reject
                    </button>

                  </div>

                `
              )
              .join("")}

          </div>

        `
        : ""
    }


    ${
      isOwner && project.joinRequests.length === 0
        ? `
          <p class="no-requests">
            No pending join requests.
          </p>
        `
        : ""
    }

  `;

  return card;
}


// Display all projects
function displayProjects() {

  projectContainer.innerHTML = "";

  projects.forEach((project) => {

    const card =
      createProjectCard(project);

    projectContainer.appendChild(card);

  });

}


// View project
function viewProject(projectId) {

  const project =
    projects.find(
      (project) =>
        project.id === projectId
    );


  if (!project) {
    return;
  }


  alert(
    "Project: " +
      project.title +

      "\n\nDescription: " +
      project.description +

      "\n\nCreated by: " +
      project.owner +

      "\nDepartment: " +
      project.department +

      "\nRequired Skills: " +
      project.requiredSkills.join(", ") +

      "\nTeam: " +
      project.members.length +
      "/" +
      project.teamSize
  );

}


// Request to join project
function requestToJoin(projectId) {

  const project =
    projects.find(
      (project) =>
        project.id === projectId
    );


  if (!project) {
    return;
  }


  // Check whether already a member
  if (
    project.members.includes(
      currentStudent
    )
  ) {

    alert(
      "You are already a member of this project."
    );

    return;
  }


  // Check whether request already exists
  if (
    project.joinRequests.includes(
      currentStudent
    )
  ) {

    alert(
      "Your request has already been sent."
    );

    return;
  }


  // Check whether team is full
  if (
    project.members.length >=
    project.teamSize
  ) {

    alert(
      "This project team is already full."
    );

    return;
  }


  // Add request
  project.joinRequests.push(
    currentStudent
  );


  // Save
  saveProjects();


  alert(
    `Your request to join "${project.title}" has been sent to the project owner.`
  );


  // Refresh UI
  displayProjects();

}


// Accept request
function acceptRequest(
  projectId,
  studentName
) {

  const project =
    projects.find(
      (project) =>
        project.id === projectId
    );


  if (!project) {
    return;
  }


  // Only project owner can accept
  if (
    project.owner !== currentStudent
  ) {

    alert(
      "Only the project owner can accept requests."
    );

    return;
  }


  // Check team capacity
  if (
    project.members.length >=
    project.teamSize
  ) {

    alert(
      "The team is already full."
    );

    return;
  }


  // Remove request
  project.joinRequests =
    project.joinRequests.filter(
      (student) =>
        student !== studentName
    );


  // Add student to team
  project.members.push(
    studentName
  );


  // Save
  saveProjects();


  alert(
    `${studentName} has been accepted into the project.`
  );


  // Refresh UI
  displayProjects();

}


// Reject request
function rejectRequest(
  projectId,
  studentName
) {

  const project =
    projects.find(
      (project) =>
        project.id === projectId
    );


  if (!project) {
    return;
  }


  // Only owner can reject
  if (
    project.owner !== currentStudent
  ) {

    alert(
      "Only the project owner can reject requests."
    );

    return;
  }


  // Remove request
  project.joinRequests =
    project.joinRequests.filter(
      (student) =>
        student !== studentName
    );


  // Save
  saveProjects();


  alert(
    `${studentName}'s request has been rejected.`
  );


  // Refresh UI
  displayProjects();

}


// Start the page
displayProjects();