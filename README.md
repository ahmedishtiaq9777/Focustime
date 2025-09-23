# FocusTime: Task Management System
Note: This is backend side... the frontend side is another repository **frontendfocustime** 
A full-stack Task Management system with authentication, task scheduling, notifications, and AWS S3 storage.

## Features

1. **Task Management for Individual Users**
   - Create, update, delete, and view tasks.
   - Pagination and search support for tasks.

2. **Database Operations**
   - Built using `Sequelize` ORM with SQL Server.
   - Performed migrations for schema updates.
   - Used raw SQL queries for optimized operations.

3. **Authentication**
   - Implemented using `JWT (JSON Web Token)`.
   - Token is validated with every request to the server.
   - Tokens are blacklisted when expired or on logout.

4. **API Endpoints**
   - `POST /users/register` → Create a new user.
   - `POST /users/login` → Login and receive JWT.
   - `POST /users/logout` → Logout and blacklist JWT.
   - `POST /tasks` → Create a task (with image support).
   - `GET /tasks` → Get all tasks (with pagination & search).
   - Middleware for authentication included.
   - **Middleware for Error Logging**
   - **Error logging save in AWS S3 BUCKET**
  
5. **File Storage**
   - Task images are uploaded to **AWS S3**.
   - Images can be retrieved and displayed in the frontend.

6. **Task Notifications**
   - Scheduled reminders **one day prior** to the task deadline using `node-schedule`.
   - Notifications sent in real-time via `Socket.IO`.
   - The read notification status change in Db.only unread notificaion is send
   - The notifications saved in Db when Task created.
   - when server  shutdown the unread notification will sent to the users/clients

7. **Frontend Integration**
   - Real-time notifications received by the frontend app via WebSockets.
   - Tasks and notifications displayed with dynamic updates.

5. **Admin and Error Logs**
   - Admin Can see the error Logs from the frontend 
---

## Improvements (In Progress)

- UI/UX improvements in the dashboard.


<img width="1891" height="907" alt="dashboardupdated" src="https://github.com/user-attachments/assets/003dbcc4-23aa-4a97-b05e-fd1a17502377" />

<img width="1884" height="906" alt="mytasks2" src="https://github.com/user-attachments/assets/d48ab017-5e81-4671-88fe-20a9109be659" />
<img width="821" height="757" alt="addedittask" src="https://github.com/user-attachments/assets/4242202e-5318-449e-9e1b-4e04114e10a9" />
