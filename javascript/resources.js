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

const resourceCards = resources.map(function(resource) {
    return `
        <div class="resource-card">
            <h3>${resource.title}</h3>
            <p>Subject: ${resource.subject}</p>
            <p>Type: ${resource.type}</p>
            <p>Uploaded by: ${resource.uploadedBy}</p>
        </div>
    `;
});

console.log(resourceCards);

const selectedSubject = "DBMS";

const filteredResources = resources.filter(function(resource) {
    return resource.subject === selectedSubject;
});

console.log(filteredResources);