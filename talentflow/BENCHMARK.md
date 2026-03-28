# TalentFlow Benchmark

## Overview
TalentFlow is a comprehensive HR & Talent Management platform. Users manage job postings, track candidates through hiring pipelines, maintain an employee directory, handle time-off requests, conduct performance reviews, manage departments, onboarding checklists, training courses, payroll summaries, documents, reports, and a calendar — all from a sidebar-navigated SPA.

This is the **large benchmark app** with 100 known issues and 30 end-to-end flows (compared to 35 issues and 10 flows in the standard benchmark apps).

## How to Run
```
cd benchmark/talentflow
python3.11 -m http.server 3013
# Visit http://localhost:3013
```

## Test Credentials
- Email: test@example.com
- Password: password123

## User Flows (30)

| # | Flow | Entry Point | Steps | Expected Result |
|---|------|-------------|-------|-----------------|
| 1 | User Registration | Click "Sign Up" in header | Fill name, email, password, confirm → click "Create Account" | Account created, logged in, redirected to dashboard |
| 2 | User Login | Click "Log In" in header | Enter test@example.com / password123 → click "Log In" | Logged in, welcome toast, dashboard shows user name |
| 3 | Password Reset Request | Login modal → "Forgot password" | Enter email → submit | Reset message displayed |
| 4 | View Dashboard | Click "Dashboard" in sidebar | View stats cards, recent activity, quick actions | Dashboard shows employee count, open jobs, pending time off, departments |
| 5 | Create Job Posting | Jobs → "Post New Job" | Fill title, department, location, type, salary, description → "Create Job" | Job appears in job listings table |
| 6 | Edit Job Posting | Jobs → click job → "Edit" | Modify fields → "Save Changes" | Job details updated, toast shown |
| 7 | Search & Filter Jobs | Jobs page | Type search term, select department/status filters | Jobs table filtered to matching results |
| 8 | Submit Job Application | Job Detail → "Apply" | Fill name, email, phone, resume → "Submit Application" | Candidate record created, appears in candidates list |
| 9 | Review Applications | Candidates page | Browse candidate list, click candidate → view details | Candidate profile, application history, and status shown |
| 10 | Schedule Interview | Candidate Detail → "Schedule Interview" | Pick date, time → confirm | Interview scheduled, candidate status updated |
| 11 | Add New Employee | Employees → "Add Employee" | Fill name, email, phone, role, department, salary, start date → "Save" | Employee added to directory |
| 12 | Edit Employee Profile | Employees → click employee → "Edit" | Modify fields → "Save Changes" | Employee profile updated |
| 13 | Search & Filter Employee Directory | Employees page | Type name in search, select department/status filter | Employee list filtered to matching results |
| 14 | Request Time Off | Time Off → "New Request" | Select type, dates, days, reason → "Submit Request" | Request appears in time-off list with "Pending" status |
| 15 | Approve/Reject Time Off | Time Off → pending request | Click "Approve" or "Reject" | Request status updated, toast confirmation |
| 16 | Create Department | Departments → "New Department" | Fill name, select head, set budget, pick color → "Create" | Department card appears in list |
| 17 | View Department Details | Departments → click department card | View department info and member list | Department detail page with employees listed |
| 18 | Create Performance Review | Reviews → "New Review" | Select employee, enter cycle, set rating, write goals/comments → "Save" | Review created in draft status |
| 19 | Submit Performance Review | Review Detail → "Submit Review" | Click submit button | Review status changes to "Submitted" |
| 20 | View Payroll Summary | Click "Payroll" in sidebar | Browse payroll table with employee compensation data | Table shows base salary, bonus, deductions, net pay per employee |
| 21 | Generate Report | Reports → select filters | Choose date range, department → "Generate" | Visual chart/report displayed |
| 22 | Upload Document | Documents → "Upload" | Select file, confirm upload | Document appears in document list |
| 23 | Create Onboarding Checklist | Onboarding → "New Checklist" | Enter name, select department, add items → "Create" | Checklist appears with checkable items |
| 24 | Manage Notification Settings | Settings → "Notifications" tab | Toggle email, push, slack notifications → "Save" | Settings updated, toast confirmation |
| 25 | Update User Profile | Click avatar → "Profile" | Update name, role, bio → "Save Changes" | Profile updated, user menu reflects changes |
| 26 | Calendar Event Creation | Calendar → "New Event" | Fill title, date, time, end time, type, location → "Create" | Event appears on calendar grid |
| 27 | Browse & Enroll in Training | Training → browse courses | View course details → click "Enroll" | Enrolled count increases, user added to course |
| 28 | Bulk Employee Selection & Action | Employees → select checkboxes | Check multiple employees → "Bulk Delete" | Selected employees removed from directory |
| 29 | Export Data to CSV | Jobs/Employees/Payroll → "Export CSV" | Click export button | CSV file downloaded with current data |
| 30 | Navigate Sidebar & Use App | Any page | Click through all 14 sidebar sections | Each section loads correctly with appropriate content |

## Known Issues (100)

| ID | Severity | Category | Issue | Location | How to Trigger |
|----|----------|----------|-------|----------|----------------|
| BUG-001 | High | Form Validation | Email validation accepts "test@" — only checks for "@" symbol, not a valid domain | store.js `register()` | Register with email "test@" — accepted as valid |
| BUG-002 | Medium | Form Validation | No minimum password length check — single space accepted as password | store.js `register()` | Register with password " " (single space) — passes |
| BUG-003 | Medium | Form Validation | Phone number field accepts letters and special characters — no numeric validation | store.js `employees.create()` | Create employee with phone "abc-xyz" — accepted |
| BUG-004 | High | Form Validation | Salary field accepts negative values (e.g., -50000) | store.js `employees.create()` | Create employee with salary -50000 — accepted |
| BUG-005 | Medium | Form Validation | Job closing date can be before posting date — no date range validation | store.js `jobs.create()` | Create job with closingDate before postedDate |
| BUG-006 | Low | Form Validation | Employee birth date accepts future dates (employee #5 has birthDate 2030-11-15) | data.js employee id=5 | View employee #5 Elena Vasquez profile |
| BUG-007 | Medium | Form Validation | Department name allows whitespace-only string ("   ") as valid name | store.js `departments.create()` | Create department with name "   " (spaces only) |
| BUG-008 | High | Form Validation | Review rating accepts values > 5 and < 0 — no bounds checking | store.js `reviews.create()` | Create review with rating 99 or -3 — accepted |
| BUG-009 | Medium | Form Validation | Time-off request allows 0 days — zero-day request can be created | store.js `timeoff.create()` | Submit time-off request with days = 0 |
| BUG-010 | Low | Form Validation | Training course capacity accepts non-integer values (e.g., 2.5 seats) | store.js `training.enroll()` | Enroll when capacity comparison allows float |
| BUG-011 | High | Form Validation | Required fields not validated on job posting form — empty title accepted | app.js `saveJob()` | Click "Create Job" with empty title — job created |
| BUG-012 | Medium | Form Validation | Candidate email not validated in application form | app.js `applyForJob()` | Apply with email "notanemail" — accepted |
| BUG-013 | Medium | Form Validation | Calendar event end time can be before start time | store.js `calendar.create()` | Create event with time 14:00, endTime 10:00 — accepted |
| BUG-014 | Medium | Form Validation | Document upload accepts any file extension despite UI saying "PDF only" | app.js `uploadDocument()` | Upload a .exe file — accepted |
| BUG-015 | Low | Form Validation | Profile bio field has no max length — can crash rendering with huge text | app.js `saveProfile()` | Save bio with 100,000+ characters |
| BUG-016 | Critical | Functional | No debounce on "Create Job" button — double-click creates duplicate jobs | app.js `saveJob()` | Double-click "Create Job" rapidly |
| BUG-017 | Medium | Functional | "Reset Filters" only resets department filter, not status or search text | app.js `resetFilters()` | Apply status + department + search filters, click "Reset" — status and search persist |
| BUG-018 | High | Functional | Deleting a department doesn't reassign employees — records become orphaned | store.js `departments.delete()` | Delete "Marketing" department — employees still reference departmentId 3 |
| BUG-019 | High | Accessibility | `outline: none` applied to all nav links, buttons — no visible keyboard focus ring | style.css multiple selectors | Tab through navigation with keyboard — no focus indicator visible |
| BUG-020 | Medium | Functional | Pagination shows wrong total count after filtering — uses unfiltered total | app.js pagination handler | Filter employees by department, check "Showing X of Y" — Y is total, not filtered count |
| BUG-021 | High | Functional | "Select All" checkbox selects ALL employees, ignoring current filter | store.js `employees.selectAll()` | Filter by department, click "Select All" — hidden employees also selected |
| BUG-022 | Critical | Functional | Bulk delete employees has no confirmation dialog — immediately deletes | app.js `bulk-delete-employees` | Select employees, click "Bulk Delete" — deleted without confirm |
| BUG-023 | High | Functional | "Cancel" button on edit forms saves changes instead of discarding | store.js `employees.update()` | Edit employee, change name, click "Cancel" — name is saved |
| BUG-024 | Medium | Functional | Search query persists across page navigation — stale search on new pages | app.js `route()` | Search on Employees page, navigate to Jobs — search text still active |
| BUG-025 | High | Functional | Interview scheduling allows double-booking the same time slot | store.js `candidates.scheduleInterview()` | Schedule two candidates at same date/time — both accepted |
| BUG-026 | Low | Functional | File upload progress bar stays at 100% after upload — never resets | app.js `uploadDocument()` | Upload a file, then try uploading another — progress bar already at 100% |
| BUG-027 | Medium | Functional | "Mark all as read" marks future/scheduled notifications too | store.js `notifications.markAllRead()` | Click "Mark all read" — even future notifications marked |
| BUG-028 | Low | Functional | Export CSV generates empty file when no data matches current filter | app.js `exportCSV()` | Apply filter with no results, click "Export CSV" — downloads file with only headers |
| BUG-029 | Medium | Functional | Delete actions have no undo — items permanently removed with no recovery | app.js delete handlers | Delete any document/employee — gone forever, no undo |
| BUG-030 | Medium | Accessibility | Tab navigation skips the submit button in settings (tabindex=-1) | app.js settings tab handler | Tab through settings form — submit button is skipped |
| BUG-031 | Low | Functional | Job form draft not auto-saved — navigating away loses all entered data | render.js `jobForm()` | Start filling job form, click sidebar link — all data lost |
| BUG-032 | Medium | Form Validation | Review submission allows empty comments field | store.js `reviews.create()` | Create review with blank comments — accepted |
| BUG-033 | Medium | Functional | Payroll calculation doesn't prorate for mid-month joiners — full salary shown | data.js payroll records | View payroll for employee who started mid-month — full monthly salary displayed |
| BUG-034 | High | Functional | Calendar "Today" button navigates to hardcoded date (2024-01-15) instead of actual today | app.js `today-calendar` handler | Click "Today" on calendar — jumps to January 2024 |
| BUG-035 | Medium | Functional | Training enrollment counter doesn't update after un-enrollment | app.js `unenroll-training` | Enroll then unenroll from course — enrolled count unchanged in UI |
| BUG-036 | Medium | UI/Visual | Long job title overflows card and table row containers — no text truncation/ellipsis | render.js `jobs()`, data.js | View Jobs page — the long title overflows its container |
| BUG-037 | High | UI/Visual | Employee avatar shows "undefined" in img src when avatarUrl is null | render.js `employeeDetail()`, data.js id=8 | View employee #8 Henry Walsh — avatar image shows "undefined" |
| BUG-038 | Low | UI/Visual | Notification dates have inconsistent formats — ISO, long, short mixed | data.js notifications, render.js | View Notifications page — dates show as "2024-03-15", "March 16, 2024", "Mar 18 2024" |
| BUG-039 | Medium | UI/Visual | No empty state message for employee list when filter returns zero results | render.js `employees()` | Filter employees by non-existent department — blank page, no "No results" message |
| BUG-040 | High | UI/Visual | Invalid employee/department ID shows infinite loading spinner — no error message | render.js `employeeDetail()`, `departmentDetail()` | Navigate to #/employees/999 — spinner never stops |
| BUG-041 | Medium | UI/Visual | Toast notifications overlap the sticky top header bar | style.css `.toast-container` | Trigger any toast while scrolled to top — toast overlaps header |
| BUG-042 | Low | UI/Visual | Status badges use same green color for "Active" and "Approved" — visually confusing | render.js candidate/timeoff views | View candidates with "screening"/"interview" status — same color |
| BUG-043 | Medium | UI/Visual | Modal doesn't lock body scroll — background content scrolls behind modal | style.css modal styles | Open login modal on a long page — background still scrollable |
| BUG-044 | Medium | UI/Visual | Chart tooltip shows "[object Object]" instead of formatted data | render.js `dashboard()`, `reports()` | Hover over chart bars on dashboard — tooltip shows [object Object] |
| BUG-045 | Low | UI/Visual | Notification badge count shows NaN when a notification has undefined read status | data.js notification id=15, render.js | Check notification badge — may show NaN |
| BUG-046 | Low | UI/Visual | Table header misaligned with columns when scrolling horizontally | style.css `.data-table thead` | Scroll payroll table horizontally — header columns shift |
| BUG-047 | Medium | UI/Visual | Review star rating truncates decimals — 3.5 shows as 3 stars | render.js `reviews()`, `reviewDetail()` | View reviews — 4.5 rating shows as 4 stars |
| BUG-048 | Low | UI/Visual | Department color dot disappears on card hover | style.css `.card:hover .dept-color-dot` | Hover over department card — color indicator vanishes |
| BUG-049 | Low | UI/Visual | Breadcrumb shows raw hash route instead of page name | render.js `calendar()`, `reports()` | Visit Calendar — breadcrumb shows "#/calendar" |
| BUG-050 | Medium | UI/Visual | No print styles defined — page prints with sidebar, modals, and all UI chrome | style.css (absence) | Print any page — sidebar, header all included in print |
| BUG-051 | High | Accessibility | All form inputs use placeholder text only — no associated `<label>` elements | render.js all form methods | Inspect any form with screen reader or DevTools |
| BUG-052 | Medium | Accessibility | Multiple images and icons missing `alt` attributes | render.js throughout | Inspect employee avatars, course images with screen reader |
| BUG-053 | Medium | Accessibility | Status indicators are color-only — no icon or text shape alternative | render.js badge rendering | View status badges with color blindness — indistinguishable |
| BUG-054 | High | Accessibility | Modal has no focus trap — Tab key cycles through elements behind the modal | index.html modal, app.js `showModal()` | Open login modal, press Tab repeatedly — focus leaves modal |
| BUG-055 | High | Accessibility | Custom tab widget not keyboard navigable — no arrow key support | render.js `settings()`, app.js | Settings page tabs — arrow keys don't switch tabs |
| BUG-056 | Medium | Accessibility | ARIA roles missing on dynamic content areas — no role="form", role="main" | render.js form and content areas | Inspect rendered forms — no ARIA role attributes |
| BUG-057 | High | Accessibility | Skip navigation link missing — keyboard users must tab through entire sidebar | index.html | Press Tab on page load — no "Skip to content" link |
| BUG-058 | Medium | Accessibility | Table headers not properly associated with data cells — no `scope` attribute | render.js all table renders | Inspect data tables — `<th>` elements missing `scope="col"` |
| BUG-059 | Medium | Accessibility | Error messages not announced to screen readers — no `aria-live` region | render.js `settings()` | Trigger validation error — screen reader doesn't announce |
| BUG-060 | Low | Accessibility | Decorative icons and star symbols not hidden from screen readers — missing `aria-hidden` | render.js throughout | Screen reader announces decorative stars and checkmarks |
| BUG-061 | Medium | Accessibility | Focus order illogical on calendar and settings pages — DOM order doesn't match visual | render.js `calendar()`, `settings()` | Tab through calendar — focus hits grid before nav buttons |
| BUG-062 | Medium | Accessibility | Custom time picker widget not accessible — no ARIA attributes or keyboard support | render.js `reviewForm()`, style.css | Try to use rating/time widgets with keyboard only |
| BUG-063 | High | Accessibility | Chart/report data only in visual format — no text alternative or aria description | render.js `dashboard()`, `reports()` | Screen reader can't access any chart data |
| BUG-064 | Medium | Accessibility | Autocomplete suggestions dropdown not keyboard accessible | app.js, style.css | Type in search, suggestions appear but can't be selected with keyboard |
| BUG-065 | Medium | Accessibility | Page title doesn't update on navigation — always shows "TalentFlow - HR Management" | index.html, app.js `route()` | Navigate to Jobs — browser title still shows default |
| BUG-066 | High | Responsive/Layout | Sidebar overlaps main content on tablet (768px-1024px) | style.css `@media 1024px` | View on 1024px wide viewport — sidebar covers content |
| BUG-067 | Medium | Responsive/Layout | Data tables don't scroll horizontally on mobile — content clipped | style.css `@media 768px` | View payroll table on 375px viewport — columns cut off |
| BUG-068 | Medium | Responsive/Layout | Touch targets below 44px on mobile — footer links and nav items too small | style.css footer, nav responsive | Try to tap footer links on mobile — too small |
| BUG-069 | Medium | Responsive/Layout | Calendar grid breaks on small screens — 7-column grid too narrow | style.css `@media 768px` | View calendar on 375px viewport — cells unreadable |
| BUG-070 | Medium | Responsive/Layout | Form inputs overflow container on mobile — fixed width of 400px | style.css `@media 768px` | Open any form on mobile — inputs extend beyond screen |
| BUG-071 | Medium | Responsive/Layout | Dashboard stat cards don't stack on mobile — 4-column grid persists | style.css `@media 768px` | View dashboard on 375px viewport — cards too narrow |
| BUG-072 | Medium | Responsive/Layout | Modal extends beyond viewport on small screens — fixed 500px width | style.css `@media 768px` | Open login modal on 375px viewport — overflows screen |
| BUG-073 | High | Responsive/Layout | Fixed-position sidebar causes horizontal scroll on mobile | style.css `@media 768px` | Load app on 375px viewport — page scrolls horizontally |
| BUG-074 | Medium | Responsive/Layout | Kanban candidate pipeline columns don't stack on mobile | style.css `@media 768px` | View candidates kanban on 375px — columns overflow |
| BUG-075 | Low | Responsive/Layout | Action buttons hidden behind content on tablet — clipped by overflow | style.css `@media 1024px` | View tables on tablet — edit/delete buttons cut off |
| BUG-076 | Critical | Security | Search query rendered directly into innerHTML — XSS vulnerability | render.js `employees()` | Search for `<img src=x onerror=alert(1)>` on employees page |
| BUG-077 | Critical | Security | Employee/user bio rendered with innerHTML — stored XSS vulnerability | render.js `employeeDetail()`, `profile()` | Save bio with `<script>alert(1)</script>`, view profile |
| BUG-078 | Critical | Security | Job description rendered with innerHTML — XSS vulnerability | render.js `jobDetail()` | Create job with description containing `<img src=x onerror=alert(1)>` |
| BUG-079 | Medium | Security | No CSRF tokens on any form submissions | app.js all save functions | Inspect form HTML — no hidden CSRF input |
| BUG-080 | High | Security | User credentials stored alongside user data in sessionStorage | store.js `auth.register()` | Register, inspect sessionStorage — password hash indicator visible |
| BUG-081 | Medium | Security | Internal API endpoint URL exposed in client-side JavaScript comments | data.js top-level comment | View page source — finds `https://internal-api.talentflow.io/v2/employees` |
| BUG-082 | High | Security | User role stored on `window.currentUserRole` — modifiable via browser console | store.js auth methods | Open console, type `window.currentUserRole = 'admin'` — role changed |
| BUG-083 | High | Security | File upload doesn't sanitize filename — path traversal risk | app.js `uploadDocument()` | Upload file named `../../../etc/passwd` — accepted |
| BUG-084 | Medium | Security | Session token never expires — no timeout enforcement | data.js settings, store.js | Log in, wait indefinitely — session never expires |
| BUG-085 | Critical | Security | Employee SSN displayed in plain text without masking | render.js `employeeDetail()` | View any employee detail — full SSN visible (e.g., "123-45-6789") |
| BUG-086 | Low | Console/Performance | Unhandled Promise rejection when generating report | app.js `generate-report` handler | Click "Generate Report" → check DevTools console for unhandled rejection |
| BUG-087 | Low | Console/Performance | Oversized decorative SVG (~80KB) with 300 random circles generated on every page load | render.js `HERO_DECORATION` | Open DevTools → Performance → record page load |
| BUG-088 | Low | Console/Performance | Console.error logged for missing Chart library on every page load | render.js top-level | Open DevTools console — "Chart library not loaded" error |
| BUG-089 | Medium | Console/Performance | Event listeners added on each render without cleanup — memory leak | render.js `documents()`, app.js | Navigate to Documents page multiple times — listeners accumulate |
| BUG-090 | Low | Console/Performance | Unnecessary `setTimeout(0)` wrapper in render queue — clutters profiler | render.js `queueRender()` | Profile page rendering — setTimeout adds noise to task queue |
| BUG-091 | Low | Console/Performance | Large inline base64 SVG data URI (~100KB) in CSS | style.css `.hero-bg` | Inspect stylesheet — massive data-uri in CSS |
| BUG-092 | Low | Console/Performance | Synchronous localStorage scan on every init — blocks initial render | app.js `init()` | Profile app init — synchronous JSON.parse on startup |
| BUG-093 | Low | Console/Performance | Repeated DOM queries inside render functions — no result caching | render.js `employees()` | Profile employee list render — unnecessary querySelectorAll during string building |
| BUG-094 | High | Broken Links | Footer "Privacy Policy" links to `/privacy-policy` — server path that returns 404 | index.html footer | Click "Privacy Policy" in footer |
| BUG-095 | Medium | Broken Links | Footer "Terms of Service" links to `/terms` — returns 404 | index.html footer | Click "Terms of Service" in footer |
| BUG-096 | Medium | Broken Links | "Help Center" link points to `#/help` — non-existent hash route | index.html footer | Click "Help Center" — shows 404 page |
| BUG-097 | Low | Broken Links | Employee profile photo URLs point to non-existent image paths | data.js employees id=3, id=7 | View employee #3 or #7 — avatar image broken |
| BUG-098 | Medium | Broken Links | "Documentation" link in footer points to dead external URL | index.html footer | Click "Documentation" — external page doesn't load |
| BUG-099 | Medium | State Management | Auth state stored in sessionStorage — user is logged out on page refresh | store.js `auth` | Log in, press F5 to refresh — logged out |
| BUG-100 | High | State Management | Dashboard stat counters use initial DATA counts, not current Store state | store.js `getDashboardStats()`, render.js | Add an employee, return to dashboard — total count unchanged |

## Bug Summary by Category

| Category | Count | Severity Breakdown |
|----------|-------|--------------------|
| Form Validation | 15 | 2 High, 7 Medium, 4 Low, 2 Critical (indirect) |
| Functional | 20 | 2 Critical, 4 High, 9 Medium, 5 Low |
| UI/Visual | 15 | 2 High, 6 Medium, 7 Low |
| Accessibility | 16 | 4 High, 8 Medium, 2 Low, 2 (overlap) |
| Responsive/Layout | 10 | 2 High, 7 Medium, 1 Low |
| Security | 10 | 3 Critical, 3 High, 3 Medium, 1 Low |
| Console/Performance | 8 | 1 Medium, 7 Low |
| Broken Links | 5 | 1 High, 2 Medium, 2 Low |
| State Management | 2 | 1 High, 1 Medium |

## Expected Detection by Agent Type

| Agent | Issues Expected to Find | Issue IDs |
|-------|------------------------|-----------|
| HappyPath | Basic UI, broken links, visual issues, dashboard staleness | BUG-036, BUG-037, BUG-038, BUG-040, BUG-044, BUG-045, BUG-047, BUG-094, BUG-095, BUG-096, BUG-097, BUG-098, BUG-100 |
| EdgeCase | Form validation bypasses, double-submit, filter bugs, XSS | BUG-001, BUG-002, BUG-003, BUG-004, BUG-005, BUG-007, BUG-008, BUG-009, BUG-011, BUG-012, BUG-013, BUG-014, BUG-015, BUG-016, BUG-017, BUG-021, BUG-022, BUG-023, BUG-025, BUG-029, BUG-032, BUG-076, BUG-077, BUG-078 |
| Accessibility | Missing labels, focus issues, ARIA, contrast, keyboard | BUG-019, BUG-030, BUG-051, BUG-052, BUG-053, BUG-054, BUG-055, BUG-056, BUG-057, BUG-058, BUG-059, BUG-060, BUG-061, BUG-062, BUG-063, BUG-064, BUG-065 |
| ErrorRecovery | Infinite spinners, stale state, session loss, unhandled errors | BUG-024, BUG-027, BUG-031, BUG-033, BUG-034, BUG-035, BUG-040, BUG-086, BUG-088, BUG-089, BUG-092, BUG-099 |
| Viewport/Responsive | Mobile layout breaks, touch targets, overflow | BUG-041, BUG-043, BUG-046, BUG-066, BUG-067, BUG-068, BUG-069, BUG-070, BUG-071, BUG-072, BUG-073, BUG-074, BUG-075 |
| Security/Automated | XSS, CSRF, exposed secrets, SSN masking, session | BUG-076, BUG-077, BUG-078, BUG-079, BUG-080, BUG-081, BUG-082, BUG-083, BUG-084, BUG-085 |
