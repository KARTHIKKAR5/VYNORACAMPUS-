// Conversation message data

const conversations = {

    Karthik: [
        {
            sender: "Karthik",
            text: "Hey, are you working on the communication module?"
        },
        {
            sender: "Siri",
            text: "Yes, I am working on it."
        },
        {
            sender: "Karthik",
            text: "Great! Let's finish the basic version today."
        }
    ],

    Ram: [
        {
            sender: "Ram",
            text: "Hey! Did you check the networking module?"
        },
        {
            sender: "Siri",
            text: "Not yet. I will check it today."
        }
    ],

    Manideepika: [
        {
            sender: "Manideepika",
            text: "I have uploaded the resources."
        },
        {
            sender: "Siri",
            text: "Great! I will check them."
        }
    ],

    Varshitha: [
        {
            sender: "Varshitha",
            text: "Are you joining the project team?"
        }
    ],

    Samuel: [
        {
            sender: "Samuel",
            text: "I am working on the campus services section."
        }
    ]

};


// Currently selected conversation

let selectedConversation = "Karthik";


// Get HTML elements

const messageContainer = document.getElementById("message-container");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const chatName = document.getElementById("chat-name");


// Display messages

function displayMessages() {

    messageContainer.innerHTML = "";

    const currentMessages = conversations[selectedConversation];

    currentMessages.forEach(function(message) {

        const messageElement = document.createElement("div");

        messageElement.classList.add("message");

        if (message.sender === "Siri") {
            messageElement.classList.add("my-message");
        }

        messageElement.innerHTML = `
            <strong>${message.sender}</strong>
            <p>${message.text}</p>
        `;

        messageContainer.appendChild(messageElement);

    });

}


// Select students

const students = document.querySelectorAll(".student");

students.forEach(function(student) {

    student.addEventListener("click", function() {

        // Get selected student's name

        selectedConversation = student.dataset.name;

        // Change chat header

        chatName.textContent = selectedConversation;

        // Display selected conversation

        displayMessages();

    });

});


// Send a new message

function sendMessage() {

    const text = messageInput.value.trim();

    if (text === "") {
        return;
    }

    const newMessage = {
        sender: "Siri",
        text: text
    };

    conversations[selectedConversation].push(newMessage);

    messageInput.value = "";

    displayMessages();

}


// Send button

sendButton.addEventListener("click", sendMessage);


// Press Enter to send message

messageInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        sendMessage();
    }

});


// Display Karthik conversation when page loads

displayMessages();