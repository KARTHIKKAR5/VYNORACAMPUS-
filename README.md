# 🚀 Vynora Campus+

> **One campus. One community. One platform.**

Vynora Campus+ is a student-focused full-stack platform designed to connect students within a university and make everyday campus life easier.

The project is being developed **first for our own university**, with the long-term vision of creating a configurable platform that can be adapted for different colleges and universities according to their students, departments, academic structure, facilities, and requirements.

---

## 🎯 Vision

Students use many different platforms for different parts of college life:

* Finding classmates and people with similar interests
* Sharing notes and learning resources
* Finding teammates for hackathons and projects
* Communicating with other students
* Tracking coding progress
* Managing class schedules
* Finding available rooms
* Collaborating on activities and projects

**Vynora Campus+ aims to bring these experiences together in one student-only platform.**

---

## 💡 Problem

Students often struggle to:

* Find students with similar technical interests
* Find teammates from other departments for hackathons
* Access useful notes and resources
* Discover students with specific skills
* Communicate and collaborate efficiently
* Keep track of their academic schedule
* Find available campus rooms
* Coordinate small campus activities

Most of these activities are scattered across different applications, messaging groups, and physical campus networks.

Vynora Campus+ aims to create a **central digital campus community** for students.

---

## ✨ Planned Features

### 🔐 Student Authentication

* Google-based authentication
* University student verification
* Secure student profiles
* College-specific access

### 👤 Student Profiles

Students can showcase:

* Name
* Department
* Year
* Skills
* Interests
* GitHub profile
* LeetCode profile
* Profile picture
* Projects and achievements

### 📊 Student Dashboard

A personalized dashboard containing:

* Coding streak
* GitHub statistics
* LeetCode statistics
* Upcoming classes
* Important activities
* Quick access to campus features

### 🤝 Student Networking

Students can:

* Discover other students
* Search by skills
* Search by department
* Search by interests
* View profiles
* Connect with other students

### 💬 Real-Time Chat

Students can communicate through:

* One-to-one conversations
* Project conversations
* Hackathon team conversations
* Real-time messaging
* Notifications

### 📝 Notes & Resource Sharing

Students can:

* Upload notes
* Share study resources
* Search resources
* Filter resources by subject
* Download shared materials

### 🏆 Hackathon & Project Team Formation

Students can create projects and specify the skills they need.

Example:

```text
Project: Campus Security System

Looking for:

✓ ML Engineer
✓ Backend Developer
✓ Frontend Developer
✓ UI/UX Designer
```

Students from different departments can discover projects and request to join teams.

### 📅 Timetable

Students can view:

* Daily classes
* Weekly timetable
* Subjects
* Faculty information
* Classrooms
* Free periods

### 🏫 Free Room Finder

Students can check which campus rooms are available during a particular time period.

### 🍱 Campus Order Assistance

A future feature where students can request help with collecting food/orders when they are unable to reach the campus canteen because of classes.

Students nearby can accept the request and receive a small reward.

> This feature is planned for a later version because it requires additional considerations such as payments, verification, safety, transactions, and dispute handling.

### 🎵 Collaborative Playlists

Students can create and collaborate on playlists for:

* Study sessions
* Events
* Clubs
* Projects
* Campus activities

---

# 🏗️ Technology Stack

Vynora Campus+ is being developed using the MERN stack.

### Frontend

* React
* TypeScript
* Tailwind CSS

### Backend

* Node.js
* Express.js
* TypeScript

### Database

* MongoDB
* Mongoose

### Real-Time Communication

* Socket.IO

### Authentication

* Google OAuth

### Development & Collaboration

* Git
* GitHub
* Pull Requests
* Code Reviews

### Deployment

Planned deployment technologies include:

* Vercel
* MongoDB Atlas
* Cloud hosting for the backend

---

# 🧩 High-Level Architecture

```text
                    VYNORA CAMPUS+
                           │
                           ▼
                  ┌─────────────────┐
                  │ React Frontend  │
                  │ TypeScript      │
                  │ Tailwind CSS    │
                  └────────┬────────┘
                           │
                           │ HTTP / REST
                           ▼
                  ┌─────────────────┐
                  │ Node + Express  │
                  │ Backend API     │
                  └───────┬─┬───────┘
                          │ │
              ┌───────────┘ └───────────┐
              ▼                         ▼
       ┌──────────────┐          ┌──────────────┐
       │   MongoDB    │          │   Socket.IO  │
       │   Database   │          │  Real-Time   │
       └──────────────┘          └──────────────┘
              │
              ▼
       ┌─────────────────┐
       │ External APIs   │
       │ GitHub/others   │
       └─────────────────┘
```

---

# 🌎 Long-Term Vision

Vynora Campus+ is initially being developed for **our university**.

The long-term goal is to make the platform configurable for multiple colleges and universities.

```text
                    Vynora Campus+
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
        University A              University B
             │                         │
      College Configuration      College Configuration
             │                         │
             ▼                         ▼
          Students                  Students
```

Each college should eventually be able to configure:

* Departments
* Courses
* Academic years
* Subjects
* Timetables
* Rooms
* Campus facilities
* Student verification
* Available features
* College-specific requirements

This approach allows Vynora Campus+ to evolve from a university project into a **multi-college campus platform**.

---

# 👨‍💻 Development Philosophy

Vynora Campus+ is being developed by a team of five students.

Our goal is not only to build the application, but also to learn **real-world software engineering practices**.

We are following a learn-and-build approach:

```text
Learn MERN Concept
       ↓
Understand the Concept
       ↓
Apply it to Vynora Campus+
       ↓
Build a Feature
       ↓
Git Commit
       ↓
Pull Request
       ↓
Code Review
       ↓
Merge
```

Every team member will work across different parts of the stack so that the project becomes a **shared learning experience**, rather than separate frontend/backend work.

---

# 🌱 Current Development Stage

The project is currently in the **initial development stage**.

### Current focus

* JavaScript fundamentals
* Git & GitHub
* Team collaboration
* React fundamentals
* MERN architecture
* Project planning
* UI/UX design

### Upcoming milestones

```text
JavaScript
    ↓
React
    ↓
Node.js
    ↓
Express.js
    ↓
MongoDB
    ↓
Authentication
    ↓
Campus+ MVP
    ↓
Testing
    ↓
Deployment
    ↓
University Pilot
    ↓
Multi-College Platform
```

---

# 👥 Team

### Vynora Campus+ Development Team

| Member    | Role                 |
| --------- | -------------------- |
| Karthik   | Full-Stack Developer |
| Ram       | Full-Stack Developer |
| Deep      | Full-Stack Developer |
| Varshitha | Full-Stack Developer |
| SR        | Full-Stack Developer |

> Roles will rotate during development so that every member gains experience across the MERN stack.

---

# 🤝 GitHub Workflow

We use a collaborative Git workflow.

```text
Issue
  ↓
Feature Branch
  ↓
Development
  ↓
Commit
  ↓
Push
  ↓
Pull Request
  ↓
Code Review
  ↓
Testing
  ↓
Merge
```

### Branches

```text
main
development
feature/*
```

Direct pushes to `main` are avoided.

---

# 📚 Learning Approach

We are learning MERN while building Vynora Campus+.

Instead of completing a course first and building a project later, we follow:

> **Learn → Build → Review → Understand → Improve**

The project serves as our practical environment for learning full-stack development.

---

# 🎓 Project Purpose

Vynora Campus+ is being developed as:

* A practical MERN learning project
* A real-world software engineering project
* A university-focused platform
* A collaborative team project
* A portfolio and placement project
* A foundation for a potential multi-college product

---

# 🔮 Future Possibilities

Future versions may include:

* College administration dashboard
* Clubs and communities
* Campus events
* Announcements
* Placement preparation
* Project showcase
* Student achievement profiles
* Advanced team matching
* Campus marketplace
* Food/order assistance
* Collaborative playlists
* Multi-college SaaS architecture

---

## ⭐ Our Goal

**Build something useful enough that students actually want to use it.**

**Learn enough that every team member can explain how it works.**

**Engineer it well enough that it can grow beyond our university.**

---

## 📌 Status

**Vynora Campus+ — 🚧 Under Active Development**

Built with ❤️ by a team of five students.
