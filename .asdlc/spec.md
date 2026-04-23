# Overview

A web-based todo management application that enables users to create, organize, and track personal tasks with authentication, categorization, and deadline management capabilities.

# Personas

- **Sarah** — Busy professional who needs to organize work tasks across multiple projects with clear deadlines.
- **Marcus** — Student managing assignments, personal errands, and study schedules with category-based organization.
- **Lisa** — Freelancer tracking client deliverables and personal tasks with flexible categorization.

# Capabilities

## User Authentication

- The system SHALL provide user registration with email and password.
- WHEN a user registers, the system SHALL validate email format and require password minimum length of 8 characters.
- The system SHALL authenticate users via email and password credentials.
- WHEN authentication succeeds, the system SHALL create a session valid for 24 hours.
- IF authentication fails, THEN the system SHALL display an error message without revealing whether email or password was incorrect.
- WHILE a user session is active, the system SHALL maintain authentication state across page refreshes.
- The system SHALL provide a logout function that terminates the active session.
- The system SHALL store passwords using cryptographic hashing with salt.

## Task Management

- WHILE authenticated, a user SHALL be able to create new tasks with title, description, category, and due date.
- WHEN creating a task, the system SHALL require a non-empty title of maximum 200 characters.
- The system SHALL allow task descriptions up to 2000 characters.
- WHILE authenticated, a user SHALL be able to view all their own tasks.
- The system SHALL display tasks with their title, description, category, due date, and completion status.
- WHILE authenticated, a user SHALL be able to edit any field of their existing tasks.
- WHILE authenticated, a user SHALL be able to delete their own tasks.
- WHEN a user deletes a task, the system SHALL prompt for confirmation before permanent removal.
- The system SHALL isolate each user's tasks so they cannot view or modify other users' tasks.

## Task Status and Completion

- The system SHALL mark tasks as either complete or incomplete.
- WHILE authenticated, a user SHALL be able to toggle task completion status.
- WHEN a task is marked complete, the system SHALL record the completion timestamp.
- The system SHALL allow filtering tasks by completion status (all, complete, incomplete).

## Categories

- WHILE authenticated, a user SHALL be able to create custom categories with unique names.
- The system SHALL enforce category name uniqueness within a user's account.
- WHILE authenticated, a user SHALL be able to assign a category to any task.
- The system SHALL allow filtering tasks by selected category.
- WHILE authenticated, a user SHALL be able to rename their existing categories.
- WHILE authenticated, a user SHALL be able to delete their categories.
- WHEN a category is deleted, the system SHALL remove the category assignment from all associated tasks without deleting the tasks.
- The system SHALL display a list of all categories belonging to the authenticated user.

## Due Dates

- WHEN creating or editing a task, the system SHALL allow setting a due date in YYYY-MM-DD format.
- The system SHALL accept due dates in the past, present, or future.
- The system SHALL allow removing due dates from existing tasks.
- The system SHALL display tasks sorted by due date with nearest deadlines first.
- WHILE viewing tasks, the system SHALL visually distinguish overdue tasks where due date is earlier than current date and task is incomplete.
- The system SHALL allow filtering tasks by due date range.

## Data Persistence

- The system SHALL persist all user data including accounts, tasks, categories, and associations.
- WHEN a user creates, updates, or deletes data, the system SHALL commit changes within 500 milliseconds.
- IF a data operation fails, THEN the system SHALL display an error message and retain the previous state.
- The system SHALL maintain data integrity across concurrent operations from the same user.

## User Interface

- The system SHALL provide a responsive web interface accessible via modern browsers (Chrome, Firefox, Safari, Edge).
- WHILE unauthenticated, the system SHALL display only login and registration pages.
- WHILE authenticated, the system SHALL display the user's task list as the default view.
- The system SHALL provide navigation between task list, category management, and user settings.
- WHEN a user performs an action, the system SHALL provide visual feedback within 200 milliseconds.
- IF a required field is missing during form submission, THEN the system SHALL highlight the field and display validation error messages.

## Performance and Availability

- The system SHALL support up to 100 concurrent authenticated users.
- WHEN loading the task list, the system SHALL display results within 1 second for up to 1000 tasks per user.
- The system SHALL maintain 99% uptime during business hours (9 AM - 5 PM local time).

## Security

- The system SHALL enforce HTTPS for all client-server communication.
- WHILE unauthenticated, the system SHALL deny access to all task and category management endpoints.
- The system SHALL validate and sanitize all user inputs to prevent injection attacks.
- IF a session expires, THEN the system SHALL redirect the user to the login page and display a session timeout message.