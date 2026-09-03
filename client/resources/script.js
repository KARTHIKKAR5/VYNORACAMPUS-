const resources = [
    {
        title: "DSA Unit 1 Notes",
        category: "Algorithms",
        type: "Notes"
    },
    {
        title: "Machine Learning Basics",
        category: "AI/ML",
        type: "Notes"
    },
    {
        title: "React Fundamentals",
        category: "Web Development",
        type: "Notes"
    },
    {
        title: "JavaScript Basics",
        category: "Programming",
        type: "Notes"
    },
    {
        title: "DSA Previous Questions",
        category: "Algorithms",
        type: "Question Paper"
    }
];

const resourceContainer = document.getElementById("resource-container");

function displayResources(resourceList) {
    resourceContainer.innerHTML = "";

    resourceList.forEach(function (resource) {
        const card = document.createElement("div");

        card.className = "resource-card";

        card.innerHTML = `
            <h3>${resource.title}</h3>
            <p>Category: ${resource.category}</p>
            <p>Type: ${resource.type}</p>
            <button>View Resource</button>
        `;

        resourceContainer.appendChild(card);
    });
}

displayResources(resources);

const filterButtons = document.querySelectorAll(".filters button");

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {

        const selectedCategory = button.dataset.category;

        if (selectedCategory === "All") {
            displayResources(resources);
        } else {
            const filteredResources = resources.filter(function (resource) {
                return resource.category === selectedCategory;
            });

            displayResources(filteredResources);
        }
    });
});