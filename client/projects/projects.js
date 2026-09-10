// ==========================================
// VYNORA CAMPUS+
// PROJECTS & TEAMS
// ==========================================


// ------------------------------------------
// CURRENT STUDENT
// ------------------------------------------

const currentStudent = "Varshitha";


// ------------------------------------------
// DEFAULT PROJECT DATA
// ------------------------------------------

const defaultProjects = [

  {
    id: 1,

    title: "AI Study Assistant",

    description:
      "An AI-powered assistant that helps students understand study materials.",

    owner: "Varshitha",

    department: "AIML",

    requiredSkills: [
      "Python",
      "Machine Learning",
      "React"
    ],

    teamSize: 4,

    members: [
      "Varshitha"
    ],

    joinRequests: []
  },


  {
    id: 2,

    title: "Campus Event Manager",

    description:
      "A platform where students can discover and manage college events.",

    owner: "Karthik",

    department: "CSE",

    requiredSkills: [
      "JavaScript",
      "Node.js",
      "MongoDB"
    ],

    teamSize: 4,

    members: [
      "Karthik",
      "Ram"
    ],

    joinRequests: []
  },


  {
    id: 3,

    title: "Smart Attendance System",

    description:
      "A smart attendance system using AI to automate attendance records.",

    owner: "Deep",

    department: "ECE",

    requiredSkills: [
      "Python",
      "OpenCV",
      "AI"
    ],

    teamSize: 4,

    members: [
      "Deep"
    ],

    joinRequests: []
  },


  {
    id: 4,

    title: "Student Resource Hub",

    description:
      "A platform where students can share notes and useful learning resources.",

    owner: "SR",

    department: "CSE",

    requiredSkills: [
      "React",
      "Node.js",
      "MongoDB"
    ],

    teamSize: 3,

    members: [
      "SR"
    ],

    joinRequests: []
  },


  {
    id: 5,

    title: "College Lost & Found",

    description:
      "A platform that helps students report and find lost items around campus.",

    owner: "Deep",

    department: "ECE",

    requiredSkills: [
      "React",
      "JavaScript",
      "Node.js"
    ],

    teamSize: 4,

    members: [
      "Deep"
    ],

    joinRequests: []
  },


  {
    id: 6,

    title: "Student Skill Exchange",

    description:
      "A platform where students can teach and learn technical skills from each other.",

    owner: "Karthik",

    department: "CSE",

    requiredSkills: [
      "React",
      "Node.js",
      "MongoDB"
    ],

    teamSize: 5,

    members: [
      "Karthik"
    ],

    joinRequests: []
  },


  {
    id: 7,

    title: "Campus Navigation App",

    description:
      "An application that helps students find classrooms, labs and important campus locations.",

    owner: "SR",

    department: "CSE",

    requiredSkills: [
      "JavaScript",
      "React",
      "Maps API"
    ],

    teamSize: 4,

    members: [
      "SR"
    ],

    joinRequests: []
  },


  {
    id: 8,

    title: "Hackathon Team Finder",

    description:
      "A platform that helps students find teammates based on skills and interests.",

    owner: "Varshitha",

    department: "AIML",

    requiredSkills: [
      "React",
      "Node.js",
      "MongoDB"
    ],

    teamSize: 5,

    members: [
      "Varshitha",
      "Karthik"
    ],

    joinRequests: []
  }

];


// ------------------------------------------
// LOCAL STORAGE
// ------------------------------------------

// NEW storage key.
// This prevents old broken data from interfering.

const storageKey =
  "vynoraProjects_v3";


// ------------------------------------------
// LOAD PROJECTS
// ------------------------------------------

let projects;


try {

  const savedProjects =
    localStorage.getItem(
      storageKey
    );


  if (savedProjects) {

    projects =
      JSON.parse(
        savedProjects
      );

  } else {

    projects =
      defaultProjects;

  }

} catch (error) {

  console.log(
    "Could not load saved projects. Using default projects."
  );

  projects =
    defaultProjects;

}


// ------------------------------------------
// MAKE SURE DATA IS CORRECT
// ------------------------------------------

projects.forEach(
  (project) => {

    if (
      !project.members
    ) {

      project.members = [];

    }


    if (
      !project.joinRequests
    ) {

      project.joinRequests = [];

    }


    if (
      !project.requiredSkills
    ) {

      project.requiredSkills = [];

    }

  }
);


// ------------------------------------------
// SAVE PROJECTS
// ------------------------------------------

function saveProjects() {

  localStorage.setItem(

    storageKey,

    JSON.stringify(
      projects
    )

  );

}


// ------------------------------------------
// GET HTML ELEMENTS
// ------------------------------------------

const projectContainer =
  document.getElementById(
    "project-container"
  );


const searchInput =
  document.getElementById(
    "project-search"
  );


const skillFilter =
  document.getElementById(
    "skill-filter"
  );


const projectCount =
  document.getElementById(
    "project-count"
  );


const createProjectForm =
  document.getElementById(
    "create-project-form"
  );


// ------------------------------------------
// CREATE SKILL FILTER
// ------------------------------------------

function createSkillFilter() {

  const skills = [];


  projects.forEach(
    (project) => {

      project.requiredSkills.forEach(
        (skill) => {

          if (
            !skills.includes(
              skill
            )
          ) {

            skills.push(
              skill
            );

          }

        }
      );

    }
  );


  skills.sort();


  skillFilter.innerHTML =
    `
      <option value="all">
        All Skills
      </option>
    `;


  skills.forEach(
    (skill) => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        skill;


      option.textContent =
        skill;


      skillFilter.appendChild(
        option
      );

    }
  );

}


// ------------------------------------------
// CREATE PROJECT CARD
// ------------------------------------------

function createProjectCard(
  project
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "project-card";


  const isOwner =
    project.owner ===
    currentStudent;


  const alreadyMember =
    project.members.includes(
      currentStudent
    );


  const requestSent =
    project.joinRequests.includes(
      currentStudent
    );


  let joinButton = "";


  if (
    !isOwner &&
    !alreadyMember &&
    !requestSent &&
    project.members.length <
      project.teamSize
  ) {

    joinButton = `

      <button
        class="join-btn"
        onclick="requestToJoin(${project.id})"
      >
        Request to Join
      </button>

    `;

  }


  if (requestSent) {

    joinButton = `

      <button
        class="join-btn"
        disabled
      >
        Request Sent
      </button>

    `;

  }


  let memberStatus = "";


  if (alreadyMember) {

    memberStatus = `

      <div class="member-status">

        ✓ You are a team member

      </div>

    `;

  }


  let requestsHTML = "";


  if (
    isOwner &&
    project.joinRequests.length > 0
  ) {

    requestsHTML = `

      <div class="requests">

        <h4>
          Join Requests
        </h4>


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

    `;

  }


  card.innerHTML = `

    <h3>
      ${project.title}
    </h3>


    <p class="project-description">
      ${project.description}
    </p>


    <div class="project-info">

      <p>
        <strong>Owner:</strong>
        ${project.owner}
      </p>


      <p>
        <strong>Department:</strong>
        ${project.department}
      </p>


      <p>
        <strong>Required Skills</strong>
      </p>


      <div class="skills">

        ${project.requiredSkills
          .map(
            (skill) => `

              <span class="skill">
                ${skill}
              </span>

            `
          )
          .join("")}

      </div>


      <p>

        <strong>
          Team:
        </strong>

        ${project.members.length}
        /
        ${project.teamSize}

      </p>


      <div class="project-actions">

        <button
          class="view-btn"
          onclick="viewProject(${project.id})"
        >
          View Project
        </button>

        ${joinButton}

      </div>


      ${memberStatus}

      ${requestsHTML}

    </div>

  `;


  return card;

}


// ------------------------------------------
// DISPLAY PROJECTS
// ------------------------------------------

function displayProjects(
  projectList = projects
) {

  projectContainer.innerHTML =
    "";


  projectCount.textContent =
    `${projectList.length} projects`;


  if (
    projectList.length === 0
  ) {

    projectContainer.innerHTML = `

      <div class="no-results">

        <h3>
          No projects found
        </h3>

        <p>
          Try another search or skill.
        </p>

      </div>

    `;

    return;

  }


  projectList.forEach(
    (project) => {

      const card =
        createProjectCard(
          project
        );


      projectContainer.appendChild(
        card
      );

    }
  );

}


// ------------------------------------------
// SEARCH + FILTER
// ------------------------------------------

function searchProjects() {

  const searchText =
    searchInput.value
      .trim()
      .toLowerCase();


  const selectedSkill =
    skillFilter.value;


  const filteredProjects =
    projects.filter(
      (project) => {

        const matchesSearch =

          project.title
            .toLowerCase()
            .includes(
              searchText
            )

          ||

          project.description
            .toLowerCase()
            .includes(
              searchText
            );


        const matchesSkill =

          selectedSkill ===
            "all"

          ||

          project.requiredSkills.includes(
            selectedSkill
          );


        return (
          matchesSearch &&
          matchesSkill
        );

      }
    );


  displayProjects(
    filteredProjects
  );

}


// ------------------------------------------
// CREATE NEW PROJECT
// ------------------------------------------

function createProject(
  event
) {

  event.preventDefault();


  const title =
    document
      .getElementById(
        "project-title"
      )
      .value
      .trim();


  const description =
    document
      .getElementById(
        "project-description"
      )
      .value
      .trim();


  const skillsInput =
    document
      .getElementById(
        "project-skills"
      )
      .value
      .trim();


  const teamSize =
    Number(
      document
        .getElementById(
          "project-team-size"
        )
        .value
    );


  // Validation

  if (!title) {

    alert(
      "Please enter a project title."
    );

    return;

  }


  if (!description) {

    alert(
      "Please enter a description."
    );

    return;

  }


  if (!skillsInput) {

    alert(
      "Please enter required skills."
    );

    return;

  }


  if (
    teamSize < 2 ||
    teamSize > 10
  ) {

    alert(
      "Team size must be between 2 and 10."
    );

    return;

  }


  // Convert comma-separated skills
  // into an array

  const skills =
    skillsInput
      .split(",")
      .map(
        (skill) =>
          skill.trim()
      )
      .filter(
        (skill) =>
          skill.length > 0
      );


  // Create project

  const newProject = {

    id:
      Date.now(),

    title:
      title,

    description:
      description,

    owner:
      currentStudent,

    department:
      "CSE",

    requiredSkills:
      skills,

    teamSize:
      teamSize,

    members: [
      currentStudent
    ],

    joinRequests: []

  };


  // Add project

  projects.push(
    newProject
  );


  // Save project

  saveProjects();


  // Update skill filter

  createSkillFilter();


  // Clear form

  createProjectForm.reset();


  // Show projects

  displayProjects();


  alert(
    "Project created successfully!"
  );

}


// ------------------------------------------
// VIEW PROJECT
// ------------------------------------------

function viewProject(
  projectId
) {

  const project =
    projects.find(
      (project) =>
        project.id ===
        projectId
    );


  if (!project) {

    return;

  }


  alert(

    "PROJECT\n\n" +

    project.title +

    "\n\nDESCRIPTION\n" +

    project.description +

    "\n\nOWNER\n" +

    project.owner +

    "\n\nDEPARTMENT\n" +

    project.department +

    "\n\nREQUIRED SKILLS\n" +

    project.requiredSkills.join(
      ", "
    ) +

    "\n\nTEAM\n" +

    project.members.length +

    "/" +

    project.teamSize

  );

}


// ------------------------------------------
// REQUEST TO JOIN
// ------------------------------------------

function requestToJoin(
  projectId
) {

  const project =
    projects.find(
      (project) =>
        project.id ===
        projectId
    );


  if (!project) {

    return;

  }


  if (
    project.members.includes(
      currentStudent
    )
  ) {

    alert(
      "You are already a team member."
    );

    return;

  }


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


  if (
    project.members.length >=
    project.teamSize
  ) {

    alert(
      "This project team is already full."
    );

    return;

  }


  // Send request

  project.joinRequests.push(
    currentStudent
  );


  saveProjects();


  alert(
    `Your request to join "${project.title}" has been sent to the project owner.`
  );


  displayProjects();

}


// ------------------------------------------
// ACCEPT REQUEST
// ------------------------------------------

function acceptRequest(
  projectId,
  studentName
) {

  const project =
    projects.find(
      (project) =>
        project.id ===
        projectId
    );


  if (!project) {

    return;

  }


  if (
    project.owner !==
    currentStudent
  ) {

    alert(
      "Only the project owner can accept requests."
    );

    return;

  }


  if (
    project.members.length >=
    project.teamSize
  ) {

    alert(
      "The team is already full."
    );

    return;

  }


  project.joinRequests =
    project.joinRequests.filter(
      (student) =>
        student !==
        studentName
    );


  project.members.push(
    studentName
  );


  saveProjects();


  alert(
    `${studentName} has been accepted into the team.`
  );


  displayProjects();

}


// ------------------------------------------
// REJECT REQUEST
// ------------------------------------------

function rejectRequest(
  projectId,
  studentName
) {

  const project =
    projects.find(
      (project) =>
        project.id ===
        projectId
    );


  if (!project) {

    return;

  }


  if (
    project.owner !==
    currentStudent
  ) {

    alert(
      "Only the project owner can reject requests."
    );

    return;

  }


  project.joinRequests =
    project.joinRequests.filter(
      (student) =>
        student !==
        studentName
    );


  saveProjects();


  alert(
    `${studentName}'s request has been rejected.`
  );


  displayProjects();

}


// ------------------------------------------
// EVENT LISTENERS
// ------------------------------------------

// SEARCH

searchInput.addEventListener(
  "input",
  searchProjects
);


// SKILL FILTER

skillFilter.addEventListener(
  "change",
  searchProjects
);


// CREATE PROJECT FORM
// THIS WAS MISSING IN YOUR OLD CODE

createProjectForm.addEventListener(
  "submit",
  createProject
);


// ------------------------------------------
// START APPLICATION
// ------------------------------------------

createSkillFilter();

displayProjects();