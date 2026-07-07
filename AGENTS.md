<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

Zoom Clone

## Project Overview

Build a functional video conferencing web application clone of Zoom web app that replicates Zoom’s design, user experience, and core meeting workflows.
The platform should allow users to create meetings, join meetings, schedule meetings, manage participants, and experience a clean, professional interface as original Zoom.
Your implementation should visually and functionally feel as a modern Zoom Meeting Platform.

## Technical Stack

Frontend: Next.js (Single Page Application) with bun (@backend)
Backend: Python with FastAPI(@frontend)
Database: SQLite (design your own schema)

## Pages to build

1. Landing Dashboard
   this is the landing dashboard(not the landing page)
   Create a Zoom /wc/home.
   Requirements:
   Navbar with profile/settings placeholders
   Buttons for:
   New Meeting
   Join Meeting
   Schedule Meeting
   Upcoming meetings section
   Recent meetings section

2. Instant Meeting Creation
   Requirements:
   Create a new meeting instantly
   Generate unique Meeting ID
   Generate shareable invite link
   Redirect user to meeting room

3. Join Meeting(/wc/join)
   Requirements:
   Join using Meeting ID or invite link
   Enter display name before joining
   Validate meeting existence

4. Schedule Meetings
   Requirements:
   Create scheduled meetings(/meeting/schedule)
   Title / Description
   Date & Time picker
   Duration
   Auto-generate meeting link
   Store in database
   Show in Upcoming Meetings section

5. Meeting room(https://app.zoom.us/wc/81790296924/start)
   Requirements:
   The exact clone of the ui with without video streaming.
   Host controls (mute all / remove participant)

## Important Notes

UI Design: Your application should be responsive and totally resemble Zoom's design in all devices like (mobile, tablet, desktop). Study Zoom's UI carefully before starting each pageusing. make use of playwright browser plugin and chrome plugin to take screenshots and reading html dom to get all the spacing the colors right.
it should contain all the ui interactions for required pages.
This is going to be used for a rl gym so mock the
No Login Required: Assume a default user is logged in. Focus on the functionality rather than authentication.
write a database seed script to seed Sample Data.
README File: Include setup instructions, tech stack used, and any assumptions made.
