// ==========================================
// DATA
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
    },

    {
        day: "Wednesday",
        subject: "Artificial Intelligence",
        time: "9:00 AM - 10:00 AM",
        room: "Room 101"
    }

];


const campusServices = [

    {
        name: "Library",
        type: "Academic",
        location: "Main Block",
        timing: "8:00 AM - 8:00 PM"
    },

    {
        name: "Canteen",
        type: "Food",
        location: "Student Block",
        timing: "8:00 AM - 6:00 PM"
    },

    {
        name: "Medical Center",
        type: "Health",
        location: "Main Block",
        timing: "9:00 AM - 5:00 PM"
    },

    {
        name: "Computer Lab",
        type: "Facilities",
        location: "CSE Block",
        timing: "9:00 AM - 6:00 PM"
    }

];


// ==========================================
// DOM ELEMENTS
// ==========================================

const roomsContainer =
    document.getElementById("rooms-container");

const timetableContainer =
    document.getElementById("timetable-container");

const servicesContainer =
    document.getElementById("services-container");


const roomSearch =
    document.getElementById("roomSearch");

const timeSearch =
    document.getElementById("timeSearch");

const serviceSearch =
    document.getElementById("serviceSearch");


// ==========================================
// DISPLAY ROOMS
// ==========================================

function displayRooms(roomList) {

    roomsContainer.innerHTML = "";

    // Check if there are no results

    if (roomList.length === 0) {

        roomsContainer.innerHTML =
            `<p class="no-results">
                No rooms found.
            </p>`;

        return;
    }


    // Display every room

    roomList.forEach(function (room) {

        const card =
            document.createElement("div");

        card.className = "card";


        // Check room availability

        const status = room.available

            ? `<p class="available">
                    ✅ Available
               </p>`

            : `<p class="unavailable">
                    ❌ Not Available
               </p>`;


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

}


// ==========================================
// DISPLAY TIMETABLE
// ==========================================

function displayTimetable(classList) {

    timetableContainer.innerHTML = "";


    if (classList.length === 0) {

        timetableContainer.innerHTML =
            `<p class="no-results">
                No classes found.
            </p>`;

        return;
    }


    classList.forEach(function (classItem) {

        const card =
            document.createElement("div");

        card.className = "card";


        card.innerHTML = `

            <h3>
                ${classItem.subject}
            </h3>

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

}


// ==========================================
// DISPLAY CAMPUS SERVICES
// ==========================================

function displayServices(serviceList) {

    servicesContainer.innerHTML = "";


    if (serviceList.length === 0) {

        servicesContainer.innerHTML =
            `<p class="no-results">
                No services found.
            </p>`;

        return;
    }


    serviceList.forEach(function (service) {

        const card =
            document.createElement("div");

        card.className = "card";


        card.innerHTML = `

            <h3>
                ${service.name}
            </h3>

            <p>
                Type: ${service.type}
            </p>

            <p>
                📍 Location: ${service.location}
            </p>

            <p>
                🕐 Timing: ${service.timing}
            </p>

            <button onclick="viewService('${service.name}')">
                View Service
            </button>

        `;


        servicesContainer.appendChild(card);

    });

}


// ==========================================
// ROOM FILTER
// ==========================================

const roomFilterButtons =
    document.querySelectorAll("[data-building]");


roomFilterButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const selectedBuilding =
            button.dataset.building;


        if (selectedBuilding === "All") {

            displayRooms(freeRooms);

        }

        else {

            const filteredRooms =
                freeRooms.filter(function (room) {

                    return room.building === selectedBuilding;

                });


            displayRooms(filteredRooms);

        }

    });

});


// ==========================================
// TIMETABLE FILTER
// ==========================================

const timetableFilterButtons =
    document.querySelectorAll("[data-day]");


timetableFilterButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const selectedDay =
            button.dataset.day;


        if (selectedDay === "All") {

            displayTimetable(timetable);

        }

        else {

            const filteredClasses =
                timetable.filter(function (classItem) {

                    return classItem.day === selectedDay;

                });


            displayTimetable(filteredClasses);

        }

    });

});


// ==========================================
// SERVICE FILTER
// ==========================================

const serviceFilterButtons =
    document.querySelectorAll("[data-service]");


serviceFilterButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const selectedService =
            button.dataset.service;


        if (selectedService === "All") {

            displayServices(campusServices);

        }

        else {

            const filteredServices =
                campusServices.filter(function (service) {

                    return service.type === selectedService;

                });


            displayServices(filteredServices);

        }

    });

});


// ==========================================
// ROOM SEARCH
// ==========================================

roomSearch.addEventListener("input", function () {

    const searchText =
        roomSearch.value.toLowerCase().trim();


    // If search is empty, show all rooms

    if (searchText === "") {

        displayRooms(freeRooms);

        return;
    }


    const filteredRooms =
        freeRooms.filter(function (room) {

            return (

                room.room
                    .toLowerCase()
                    .includes(searchText)

                ||

                room.building
                    .toLowerCase()
                    .includes(searchText)

            );

        });


    displayRooms(filteredRooms);

});


// ==========================================
// TIMETABLE SEARCH
// ==========================================

timeSearch.addEventListener("input", function () {

    const searchText =
        timeSearch.value.toLowerCase().trim();


    if (searchText === "") {

        displayTimetable(timetable);

        return;
    }


    const filteredClasses =
        timetable.filter(function (classItem) {

            return (

                classItem.subject
                    .toLowerCase()
                    .includes(searchText)

                ||

                classItem.day
                    .toLowerCase()
                    .includes(searchText)

                ||

                classItem.time
                    .toLowerCase()
                    .includes(searchText)

            );

        });


    displayTimetable(filteredClasses);

});


// ==========================================
// SERVICE SEARCH
// ==========================================

serviceSearch.addEventListener("input", function () {

    const searchText =
        serviceSearch.value.toLowerCase().trim();


    if (searchText === "") {

        displayServices(campusServices);

        return;
    }


    const filteredServices =
        campusServices.filter(function (service) {

            return (

                service.name
                    .toLowerCase()
                    .includes(searchText)

                ||

                service.type
                    .toLowerCase()
                    .includes(searchText)

                ||

                service.location
                    .toLowerCase()
                    .includes(searchText)

            );

        });


    displayServices(filteredServices);

});


// ==========================================
// ROOM INTERACTION
// ==========================================

function viewRoom(roomName) {

    alert(`You selected ${roomName}`);

}


// ==========================================
// SERVICE INTERACTION
// ==========================================

function viewService(serviceName) {

    alert(`You selected ${serviceName}`);

}


// ==========================================
// JSON
// ==========================================

// Convert JavaScript data into JSON

const roomsJSON =
    JSON.stringify(freeRooms);

console.log("Rooms as JSON:");
console.log(roomsJSON);


// Convert JSON back into JavaScript data

const roomsObject =
    JSON.parse(roomsJSON);

console.log("JSON converted back:");
console.log(roomsObject);


// ==========================================
// ASYNC / FETCH API DEMO
// ==========================================

async function loadDemoData() {

    try {

        const response =
            await fetch(
                "https://jsonplaceholder.typicode.com/posts"
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load API data"
            );

        }


        const data =
            await response.json();


        console.log("API data:");
        console.log(data);

    }


    catch (error) {

        console.error(
            "API Error:",
            error
        );

    }

}


// Call the asynchronous function

loadDemoData();


// ==========================================
// INITIAL DISPLAY
// ==========================================

displayRooms(freeRooms);

displayTimetable(timetable);

displayServices(campusServices);