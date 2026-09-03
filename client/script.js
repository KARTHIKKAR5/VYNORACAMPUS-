// ==========================================
// FREE ROOM DATA
// ==========================================

const freeRooms = [
    {
        room: "Room 101",
        building: "Main Block",
        available: true
    },

    {
        room: "Room 202",
        building: "CSE Block",
        available: false
    },

    {
        room: "Room 305",
        building: "ECE Block",
        available: true
    }
];


// ==========================================
// TIMETABLE DATA
// ==========================================

const timetable = [
    {
        day: "Monday",
        subject: "Data Structures",
        time: "9:00 AM - 10:00 AM",
        room: "Room 101"
    },

    {
        day: "Monday",
        subject: "Database Systems",
        time: "11:00 AM - 12:00 PM",
        room: "Room 202"
    },

    {
        day: "Tuesday",
        subject: "Computer Networks",
        time: "10:00 AM - 11:00 AM",
        room: "Room 305"
    }
];


// ==========================================
// GET HTML CONTAINERS
// ==========================================

const roomsContainer =
    document.getElementById("rooms-container");

const timetableContainer =
    document.getElementById("timetable-container");


// ==========================================
// DISPLAY FREE ROOMS DYNAMICALLY
// ==========================================

freeRooms.forEach(function (room) {

    const card = document.createElement("div");

    card.className = "card";

    const status = room.available
        ? `<p class="available">✅ Available</p>`
        : `<p class="unavailable">❌ Not Available</p>`;

    card.innerHTML = `
        <h3>${room.room}</h3>

        <p>
            Building: ${room.building}
        </p>

        ${status}

        <button onclick="viewRoom('${room.room}')">
            View Room
        </button>
    `;

    roomsContainer.appendChild(card);
});


// ==========================================
// DISPLAY TIMETABLE DYNAMICALLY
// ==========================================

timetable.forEach(function (classItem) {

    const card = document.createElement("div");

    card.className = "card";

    card.innerHTML = `
        <h3>${classItem.subject}</h3>

        <p>
            📅 Day: ${classItem.day}
        </p>

        <p>
            🕐 Time: ${classItem.time}
        </p>

        <p>
            🏫 Room: ${classItem.room}
        </p>
    `;

    timetableContainer.appendChild(card);
});


// ==========================================
// ROOM BUTTON
// ==========================================

function viewRoom(roomName) {

    alert(`You selected ${roomName}`);
}