const resources = [
    {
        title: "DSA Unit 1 Notes",
        subject: "DSA",
        type: "Notes",
        uploadedBy: "Deepu"
    },
    {
        title: "DBMS Important Questions",
        subject: "DBMS",
        type: "Question Paper",
        uploadedBy: "Ram"
    },
    {
        title: "JavaScript Basics",
        subject: "JavaScript",
        type: "Notes",
        uploadedBy: "Varshitha"
    },
    {
        title: "React Fundamentals",
        subject: "Web Development",
        type: "Notes",
        uploadedBy: "Karthik"
    },
    {
        title: "Machine Learning Basics",
        subject: "AI/ML",
        type: "Notes",
        uploadedBy: "SR"
    }
];


const resourceContainer =
    document.getElementById("resource-container");


function displayResources(resourceList) {

    const cards = resourceList.map(function (resource) {

        return `
            <div class="resource-card">

                <h3>${resource.title}</h3>

                <p>Subject: ${resource.subject}</p>

                <p>Type: ${resource.type}</p>

                <p>Uploaded by: ${resource.uploadedBy}</p>

                <button>View Resource</button>

            </div>
        `;
    });

    resourceContainer.innerHTML = cards.join("");
}


displayResources(resources);


// -----------------------------
// SUBJECT FILTERING
// -----------------------------

const filterButtons =
    document.querySelectorAll(".filters button");


filterButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const selectedSubject =
            button.dataset.subject;


        if (selectedSubject === "All") {

            displayResources(resources);

        } else {

            const filteredResources =
                resources.filter(function (resource) {

                    return resource.subject === selectedSubject;

                });

            displayResources(filteredResources);
        }

    });

});


// -----------------------------
// ADD RESOURCE FORM
// -----------------------------

const resourceForm =
    document.getElementById("resource-form");


resourceForm.addEventListener("submit", function (event) {

    event.preventDefault();


    const title =
        document.getElementById("resource-title").value.trim();


    const subject =
        document.getElementById("resource-subject").value.trim();


    const description =
        document.getElementById("resource-description").value.trim();


    // Validation

    if (title === "" || subject === "" || description === "") {

        alert("Please fill all fields");

        return;
    }


    // Create new resource

    const newResource = {

        title: title,

        subject: subject,

        type: "Notes",

        uploadedBy: "Deepu",

        description: description
    };


    // Add new resource to array

    resources.push(newResource);


    // Display updated resources

    displayResources(resources);


    // Clear form

    resourceForm.reset();

});