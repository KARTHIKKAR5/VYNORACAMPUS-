const student = {
    name: "Deepu",
    department: "CSE",
    year: 3,
    skills: ["JavaScript", "Git"],
    interests: ["Web Development", "Problem Solving"]
};
console.log(student.name);
console.log(student.department);
console.log(student.skills);

student.year = 4;

console.log(student.year);

student.githubUsername = "manideepika-30";

console.log(student.githubUsername);

const message = {
    sender: "Karthik",
    receiver: "SR",
    text: "Hey, are you working on the chat module?",
    time: "9:30 PM"
};

console.log(message.sender);
console.log(message.receiver);
console.log(message.text);
console.log(message.time);

const messages = [
    {
        sender: "Karthik",
        text: "Hey, are you working on the communication module?"
    },
    {
        sender: "SR",
        text: "Yes, I am working on it."
    },
    {
        sender: "Karthik",
        text: "Great! Let's finish the basic version today."
    }
];

messages.forEach(function(message) {
    console.log(message.sender + ": " + message.text);
});