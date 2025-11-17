# Student-Teacher Attendance App Design Guidelines

## Design Approach

**Selected System:** Material Design principles adapted for educational software
**Rationale:** This utility-focused attendance tracking application requires clear data presentation, intuitive forms, and straightforward navigation. Material Design provides excellent patterns for data-dense dashboards and form interactions.

---

## Core Design Elements

### A. Typography

**Font Family:** Inter (via Google Fonts CDN)
- Primary interface font for all UI elements
- Excellent readability for data-heavy screens

**Hierarchy:**
- Page Titles: 2xl, font-bold (Student Dashboard, Teacher Dashboard)
- Section Headers: xl, font-semibold (My Classes, Attendance Records)
- Card Titles: lg, font-medium (class names, student names)
- Body Text: base, font-normal (attendance details, timestamps)
- Labels: sm, font-medium (form fields, table headers)
- Meta Info: sm, font-normal (dates, secondary details)

### B. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Consistent padding: p-4, p-6, p-8
- Section gaps: gap-4, gap-6
- Margins: m-2, m-4, m-6

**Grid Structure:**
- Dashboard: Single column on mobile, two-column layout on desktop (sidebar + main content)
- Class cards: Grid with 1 column mobile, 2 columns tablet, 3 columns desktop
- Tables: Full-width responsive containers with horizontal scroll on mobile

---

## Component Library

### Navigation & Layout

**Role Selection Screen:**
- Centered card layout with two prominent role selection buttons
- Clean, spacious design with clear visual separation between Student and Teacher options
- Include small descriptive text under each role option

**Dashboard Shell:**
- Top navigation bar with app title, role indicator, and logout button
- Clean header with user greeting (e.g., "Welcome, Student")
- Main content area with appropriate padding

### Student Dashboard Components

**Attendance Summary Card:**
- Large stats display showing total classes, attended, and missed counts
- Visual indicators (icons from Heroicons) for each metric
- Percentage display prominently featured
- Elevated card with rounded corners

**Class List:**
- Table or card layout showing each class
- Columns: Class Name, Schedule (days/times), Attendance Status
- Status badges for Present/Absent with clear visual distinction
- Responsive: cards on mobile, table on desktop

### Teacher Dashboard Components

**Class Management:**
- Add Class button prominently placed (top-right of section)
- Class cards displaying: class name, schedule, student count
- Action buttons on each card: Edit, Delete, View Attendance
- Quick action icons (Heroicons: pencil, trash, users)

**Class Form (Create/Edit):**
- Modal or dedicated page with clean form layout
- Fields: Class Name (text), Start Time (time picker), End Time (time picker), Days (multi-select checkboxes)
- Clear submit and cancel buttons
- Form validation feedback

**Attendance Viewer/Editor:**
- Student roster table with columns: Student Name, Login Time, Logout Time, Status
- Editable status toggle or dropdown for manual attendance adjustment
- Save changes button at bottom
- Search/filter functionality for large class rosters

### Core UI Elements

**Buttons:**
- Primary actions: filled background with appropriate padding (px-6 py-3)
- Secondary actions: outlined style
- Destructive actions: distinct styling for delete operations
- Icon buttons for compact actions

**Cards:**
- Consistent elevation with subtle shadow
- Rounded corners (rounded-lg)
- Padding: p-6 for content areas
- Clear visual grouping

**Tables:**
- Clean header row with medium font weight
- Alternating row backgrounds for readability
- Adequate cell padding (px-4 py-3)
- Responsive: stack to cards on mobile

**Forms:**
- Clear labels above inputs
- Consistent input height and padding
- Focus states for accessibility
- Grouped related fields logically

**Status Indicators:**
- Badge components for attendance status
- Clear Present/Absent differentiation through shape/icon
- Consistent sizing and placement

### Icons

**Library:** Heroicons (via CDN)
- User icons for role selection
- Calendar, clock for schedule displays
- Check/X for attendance status
- Pencil, trash for CRUD actions
- Plus for add actions

---

## Responsive Behavior

**Mobile (< 768px):**
- Single column layouts
- Stacked navigation
- Cards replace tables where appropriate
- Full-width buttons

**Tablet (768px - 1024px):**
- Two-column grids for class cards
- Maintain table layouts with appropriate sizing

**Desktop (> 1024px):**
- Dashboard sidebar + main content layout
- Three-column grids for class cards
- Full table displays with all columns visible

---

## Key Interaction Patterns

- Login/Logout clearly visible in top navigation
- Confirmation dialogs for destructive actions (delete class)
- Success feedback after form submissions
- Real-time status updates when attendance changes
- Clear empty states when no data exists ("No classes scheduled yet")

---

## Accessibility

- Proper form labels and ARIA attributes
- Keyboard navigation support for all interactive elements
- Sufficient contrast ratios
- Focus indicators on all interactive elements
- Screen reader friendly status indicators