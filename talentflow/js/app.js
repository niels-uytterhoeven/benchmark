/* =========================================================
   TalentFlow — Main Application (Router + Event Handling)
   ========================================================= */

var App = {

  /* ---------- State ---------- */
  currentSearch: '',
  currentPage: 1,
  currentFilters: { department: 'all', status: 'all' },
  itemsPerPage: 10,
  currentSort: { column: null, direction: 'asc' },
  currentCalendarMonth: null,
  currentCalendarYear: null,
  currentSettingsTab: 'general',

  /* ---------- Init ---------- */
  init: function() {
    Store.auth.init();

    /* BUG-092: Synchronous localStorage scan on every init — blocks rendering */
    try { var _legacyData = localStorage.getItem('talentflow_legacy_migration'); JSON.parse(_legacyData); } catch(e) { /* BUG-092 */ }

    this.updateUserMenu();
    this.updateNotifBadge();

    window.addEventListener('hashchange', function() { App.route(); });
    /* BUG-089: Event listeners added here are never cleaned up */
    document.addEventListener('click', function(e) { App.handleClick(e); });
    document.addEventListener('keydown', function(e) { App.handleKeydown(e); });

    this.route();
  },

  /* ---------- Router ---------- */
  route: function() {
    var hash = window.location.hash || '#/';
    var app = document.getElementById('app');
    var html = '';

    /* BUG-024: this.currentSearch is NOT cleared on route change — persists stale search across pages */
    /* BUG-065: document.title is never updated — stays as initial "TalentFlow - HR Management" */

    if (hash === '#/' || hash === '#') {
      html = Render.dashboard();
    } else if (hash === '#/jobs') {
      html = Render.jobs();
    } else if (hash === '#/jobs/new') {
      html = Render.jobForm(null);
    } else if (hash.match(/^#\/jobs\/(\d+)\/edit$/)) {
      var jobEditId = parseInt(hash.match(/^#\/jobs\/(\d+)\/edit$/)[1]);
      html = Render.jobForm(jobEditId);
    } else if (hash.match(/^#\/jobs\/(\d+)$/)) {
      var jobId = parseInt(hash.match(/^#\/jobs\/(\d+)$/)[1]);
      html = Render.jobDetail(jobId);
    } else if (hash === '#/candidates') {
      html = Render.candidates();
    } else if (hash.match(/^#\/candidates\/(\d+)$/)) {
      var candId = parseInt(hash.match(/^#\/candidates\/(\d+)$/)[1]);
      html = Render.candidateDetail(candId);
    } else if (hash === '#/employees') {
      html = Render.employees();
    } else if (hash === '#/employees/new') {
      html = Render.employeeForm(null);
    } else if (hash.match(/^#\/employees\/(\d+)\/edit$/)) {
      var empEditId = parseInt(hash.match(/^#\/employees\/(\d+)\/edit$/)[1]);
      html = Render.employeeForm(empEditId);
    } else if (hash.match(/^#\/employees\/(\d+)$/)) {
      var empId = parseInt(hash.match(/^#\/employees\/(\d+)$/)[1]);
      html = Render.employeeDetail(empId);
    } else if (hash === '#/timeoff') {
      html = Render.timeoff();
    } else if (hash === '#/timeoff/new') {
      html = Render.timeoffForm();
    } else if (hash === '#/reviews') {
      html = Render.reviews();
    } else if (hash === '#/reviews/new') {
      html = Render.reviewForm();
    } else if (hash.match(/^#\/reviews\/(\d+)$/)) {
      var revId = parseInt(hash.match(/^#\/reviews\/(\d+)$/)[1]);
      html = Render.reviewDetail(revId);
    } else if (hash === '#/departments') {
      html = Render.departments();
    } else if (hash.match(/^#\/departments\/(\d+)$/)) {
      var deptId = parseInt(hash.match(/^#\/departments\/(\d+)$/)[1]);
      html = Render.departmentDetail(deptId);
    } else if (hash === '#/onboarding') {
      html = Render.onboarding();
    } else if (hash === '#/training') {
      html = Render.training();
    } else if (hash.match(/^#\/training\/(\d+)$/)) {
      var trainId = parseInt(hash.match(/^#\/training\/(\d+)$/)[1]);
      html = Render.trainingDetail(trainId);
    } else if (hash === '#/payroll') {
      html = Render.payroll();
    } else if (hash === '#/documents') {
      html = Render.documents();
    } else if (hash === '#/reports') {
      html = Render.reports();
    } else if (hash === '#/calendar') {
      html = Render.calendar(this.currentCalendarMonth, this.currentCalendarYear);
    } else if (hash === '#/settings') {
      html = Render.settings(this.currentSettingsTab);
    } else if (hash === '#/profile') {
      html = Render.profile();
    } else if (hash === '#/notifications') {
      html = Render.notifications();
    } else {
      html = Render.notFound();
    }

    app.innerHTML = html;
    this.updateSidebarActive();
    window.scrollTo(0, 0);
  },

  /* ---------- Event Delegation ---------- */
  handleClick: function(e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;

    var action = target.dataset.action;

    switch (action) {

      /* --- Navigation --- */
      case 'nav-to':
        window.location.hash = target.dataset.href;
        break;

      case 'toggle-sidebar':
        var sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('sidebar-collapsed');
        break;

      /* --- Auth --- */
      case 'show-login':
        e.preventDefault();
        this.showModal('login');
        break;

      case 'show-register':
        e.preventDefault();
        this.showModal('register');
        break;

      case 'close-modal':
        this.closeModal();
        break;

      case 'do-login':
        this.doLogin();
        break;

      case 'do-register':
        this.doRegister();
        break;

      case 'logout':
        Store.auth.logout();
        this.updateUserMenu();
        window.location.hash = '#/';
        this.toast('Logged out successfully', 'info');
        break;

      /* --- Jobs --- */
      /* BUG-016: No debounce — double-click creates duplicate */
      /* BUG-011: No required field validation before Store.jobs.create() */
      case 'save-job':
        this.saveJob();
        break;

      case 'delete-job':
        if (confirm('Are you sure you want to delete this job?')) {
          Store.jobs.delete(parseInt(target.dataset.id));
          this.toast('Job deleted', 'success');
          window.location.hash = '#/jobs';
        }
        break;

      /* BUG-012: Candidate email not validated */
      case 'apply-job':
        this.applyForJob(parseInt(target.dataset.id));
        break;

      /* --- Candidates --- */
      case 'update-candidate-status':
        var statusSelect = document.getElementById('candidate-status');
        if (statusSelect) {
          Store.candidates.updateStatus(parseInt(target.dataset.id), statusSelect.value);
          this.toast('Candidate status updated', 'success');
          this.route();
        }
        break;

      case 'schedule-interview':
        var dateEl = document.getElementById('interview-date');
        var timeEl = document.getElementById('interview-time');
        if (dateEl && dateEl.value && timeEl && timeEl.value) {
          Store.candidates.scheduleInterview(parseInt(target.dataset.id), dateEl.value, timeEl.value);
          this.toast('Interview scheduled', 'success');
          this.route();
        } else {
          this.toast('Please select date and time', 'error');
        }
        break;

      /* --- Employees --- */
      /* BUG-003: Phone not validated */
      /* BUG-015: Bio has no max length check */
      case 'save-employee':
        this.saveEmployee();
        break;

      case 'delete-employee':
        if (confirm('Are you sure you want to delete this employee?')) {
          Store.employees.delete(parseInt(target.dataset.id));
          this.toast('Employee deleted', 'success');
          window.location.hash = '#/employees';
        }
        break;

      /* BUG-022: No confirmation dialog, just deletes */
      case 'bulk-delete-employees':
        var selected = Store.employees.getSelected();
        selected.forEach(function(id) { Store.employees.delete(id); });
        this.toast(selected.length + ' employees deleted', 'success');
        this.route();
        break;

      /* BUG-021: selectAll in store has issues */
      case 'select-all-employees':
        Store.employees.selectAll(target.checked);
        this.route();
        break;

      case 'select-employee':
        Store.employees.toggleSelect(parseInt(target.dataset.id));
        break;

      /* --- Time Off --- */
      /* BUG-009: days=0 accepted (in store) */
      case 'save-timeoff':
        this.saveTimeOff();
        break;

      case 'approve-timeoff':
        Store.timeoff.approve(parseInt(target.dataset.id));
        this.toast('Time off request approved', 'success');
        this.route();
        break;

      case 'reject-timeoff':
        Store.timeoff.reject(parseInt(target.dataset.id));
        this.toast('Time off request rejected', 'info');
        this.route();
        break;

      /* --- Reviews --- */
      /* BUG-008: rating > 5 accepted (in store) */
      /* BUG-032: empty comments accepted (in store) */
      case 'save-review':
        this.saveReview();
        break;

      case 'submit-review':
        Store.reviews.submit(parseInt(target.dataset.id));
        this.toast('Review submitted', 'success');
        this.route();
        break;

      /* --- Departments --- */
      /* BUG-007: whitespace-only name accepted (in store) */
      case 'save-department':
        this.saveDepartment();
        break;

      /* BUG-018: delete department in store has issues */
      case 'delete-department':
        if (confirm('Delete this department?')) {
          Store.departments.delete(parseInt(target.dataset.id));
          this.toast('Department deleted', 'success');
          window.location.hash = '#/departments';
        }
        break;

      /* --- Training --- */
      /* BUG-035: Enrollment count not updated in UI after unenroll */
      case 'enroll-training':
        Store.training.enroll(parseInt(target.dataset.id));
        this.toast('Enrolled successfully!', 'success');
        this.route();
        break;

      case 'unenroll-training':
        Store.training.unenroll(parseInt(target.dataset.id));
        this.toast('Unenrolled from course', 'info');
        /* BUG-035: Displayed enrolled count still shows old number */
        this.route();
        break;

      /* --- Documents --- */
      /* BUG-014: No file extension validation (says "PDF only" but accepts anything) */
      /* BUG-083: Filename not sanitized (accepts ../../../etc/passwd) */
      /* BUG-026: Upload progress bar set to 100% but never reset */
      case 'upload-document':
        this.uploadDocument();
        break;

      /* BUG-029: No undo for delete — item permanently removed with no recovery */
      case 'delete-document':
        Store.documents.delete(parseInt(target.dataset.id));
        this.toast('Document deleted', 'success'); /* BUG-029: no undo action */
        this.route();
        break;

      /* --- Notifications --- */
      /* BUG-027: markAllRead in store has issues */
      case 'mark-notification-read':
        Store.notifications.markRead(parseInt(target.dataset.id));
        this.updateNotifBadge();
        this.route();
        break;

      case 'mark-all-read':
        Store.notifications.markAllRead();
        this.updateNotifBadge();
        this.route();
        break;

      /* --- Calendar --- */
      /* BUG-013: end time before start time accepted (in store) */
      /* BUG-034: "Today" button uses hardcoded date '2024-01-15' instead of new Date() */
      case 'save-event':
        this.saveCalendarEvent();
        break;

      case 'calendar-prev':
        if (this.currentCalendarMonth === null) {
          var now = new Date();
          this.currentCalendarMonth = now.getMonth();
          this.currentCalendarYear = now.getFullYear();
        }
        this.currentCalendarMonth--;
        if (this.currentCalendarMonth < 0) {
          this.currentCalendarMonth = 11;
          this.currentCalendarYear--;
        }
        this.route();
        break;

      case 'calendar-next':
        if (this.currentCalendarMonth === null) {
          var now2 = new Date();
          this.currentCalendarMonth = now2.getMonth();
          this.currentCalendarYear = now2.getFullYear();
        }
        this.currentCalendarMonth++;
        if (this.currentCalendarMonth > 11) {
          this.currentCalendarMonth = 0;
          this.currentCalendarYear++;
        }
        this.route();
        break;

      case 'calendar-today':
        /* BUG-034: Uses hardcoded date instead of new Date() */
        var todayDate = new Date('2024-01-15');
        this.currentCalendarMonth = todayDate.getMonth();
        this.currentCalendarYear = todayDate.getFullYear();
        this.route();
        break;

      /* --- Onboarding --- */
      case 'toggle-onboarding-item':
        Store.onboarding.toggleItem(parseInt(target.dataset.checklistId), parseInt(target.dataset.itemId));
        this.route();
        break;

      case 'create-checklist':
        var nameEl = document.getElementById('checklist-name');
        if (nameEl && nameEl.value.trim()) {
          Store.onboarding.create(nameEl.value.trim());
          this.toast('Checklist created', 'success');
          this.route();
        } else {
          this.toast('Please enter a checklist name', 'error');
        }
        break;

      /* --- Settings --- */
      case 'save-settings':
        this.saveSettings();
        break;

      /* --- Profile --- */
      /* BUG-015: no bio max length */
      case 'save-profile':
        this.saveProfile();
        break;

      /* --- Filters & Search --- */
      case 'filter-department':
        var deptFilter = document.getElementById('dept-filter');
        if (deptFilter) {
          this.currentFilters.department = deptFilter.value;
          this.currentPage = 1;
          this.route();
        }
        break;

      case 'filter-status':
        var statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
          this.currentFilters.status = statusFilter.value;
          this.currentPage = 1;
          this.route();
        }
        break;

      case 'search':
        var searchInput = document.getElementById('list-search');
        if (searchInput) {
          this.currentSearch = searchInput.value;
          this.currentPage = 1;
          this.route();
        }
        break;

      case 'reset-filters':
        /* BUG-017: Only resets department, not status or search */
        this.currentFilters.department = 'all';
        /* this.currentFilters.status = 'all'; -- deliberately omitted */
        /* this.currentSearch = ''; -- deliberately omitted */
        this.currentPage = 1;
        this.route();
        break;

      /* --- Sorting --- */
      /* BUG-019: Date columns sorted alphabetically, not chronologically */
      case 'sort-column':
        this.sortData(target.dataset.column);
        break;

      /* --- Pagination --- */
      /* BUG-020: Total count badge shows unfiltered total, not filtered count */
      case 'paginate':
        this.currentPage = parseInt(target.dataset.page);
        this.route();
        break;

      /* --- Export --- */
      /* BUG-028: When filtered data is empty, generates CSV with headers only (empty file) */
      case 'export-csv':
        this.exportCSV(target.dataset.type);
        break;

      /* --- Reports --- */
      case 'generate-report':
        /* BUG-086: Unhandled promise rejection */
        new Promise(function(resolve) { resolve(); }).then(function() {
          throw new Error('Report generation failed');
        });
        this.toast('Generating report...', 'info');
        break;

      /* --- Tabs --- */
      /* BUG-030: Tab container has tabindex=-1 on submit button — Tab key skips it */
      /* BUG-055: Custom tabs don't respond to arrow keys */
      case 'tab-change':
        this.currentSettingsTab = target.dataset.tab;
        this.route();
        break;
    }
  },

  /* ---------- Keyboard Handling ---------- */
  handleKeydown: function(e) {
    /* BUG-055: Custom tabs don't respond to arrow keys — no arrow key handler */
    /* BUG-064: Autocomplete dropdown not keyboard accessible */
    if (e.key === 'Enter' && e.target.id === 'global-search') {
      this.currentSearch = e.target.value;
      this.currentPage = 1;
      this.route();
    }
    if (e.key === 'Enter' && e.target.id === 'list-search') {
      this.currentSearch = e.target.value;
      this.currentPage = 1;
      this.route();
    }
    if (e.key === 'Escape') {
      this.closeModal();
    }
  },

  /* ---------- Save Job ---------- */
  /* BUG-016: No debounce — double-click creates duplicate */
  /* BUG-011: No required field validation before Store.jobs.create() */
  saveJob: function() {
    var titleEl = document.getElementById('job-title');
    var deptEl = document.getElementById('job-department');
    var locationEl = document.getElementById('job-location');
    var typeEl = document.getElementById('job-type');
    var salaryMinEl = document.getElementById('job-salary-min');
    var salaryMaxEl = document.getElementById('job-salary-max');
    var descEl = document.getElementById('job-description');
    var reqsEl = document.getElementById('job-requirements');
    var jobIdEl = document.getElementById('job-id');

    /* BUG-011: No validation — empty title, no department, etc. all pass through */
    var data = {
      title: titleEl ? titleEl.value : '',
      department: deptEl ? deptEl.value : '',
      location: locationEl ? locationEl.value : '',
      type: typeEl ? typeEl.value : 'full-time',
      salaryMin: salaryMinEl ? parseInt(salaryMinEl.value) || 0 : 0,
      salaryMax: salaryMaxEl ? parseInt(salaryMaxEl.value) || 0 : 0,
      description: descEl ? descEl.value : '',
      requirements: reqsEl ? reqsEl.value : ''
    };

    if (jobIdEl && jobIdEl.value) {
      Store.jobs.update(parseInt(jobIdEl.value), data);
      this.toast('Job updated!', 'success');
    } else {
      Store.jobs.create(data);
      this.toast('Job created!', 'success');
    }

    window.location.hash = '#/jobs';
  },

  /* ---------- Apply For Job ---------- */
  /* BUG-012: Candidate email not validated */
  applyForJob: function(jobId) {
    var nameEl = document.getElementById('applicant-name');
    var emailEl = document.getElementById('applicant-email');
    var resumeEl = document.getElementById('applicant-resume');

    var name = nameEl ? nameEl.value.trim() : '';
    var email = emailEl ? emailEl.value.trim() : '';
    var resume = resumeEl ? resumeEl.value.trim() : '';

    if (!name) {
      this.toast('Please enter your name', 'error');
      return;
    }
    /* BUG-012: No email format validation — any string accepted */
    if (!email) {
      this.toast('Please enter your email', 'error');
      return;
    }

    Store.candidates.apply(jobId, { name: name, email: email, resume: resume });
    this.toast('Application submitted!', 'success');
    this.route();
  },

  /* ---------- Save Employee ---------- */
  /* BUG-003: Phone not validated */
  /* BUG-015: Bio no max length */
  saveEmployee: function() {
    var firstNameEl = document.getElementById('emp-first-name');
    var lastNameEl = document.getElementById('emp-last-name');
    var emailEl = document.getElementById('emp-email');
    var phoneEl = document.getElementById('emp-phone');
    var deptEl = document.getElementById('emp-department');
    var roleEl = document.getElementById('emp-role');
    var startDateEl = document.getElementById('emp-start-date');
    var salaryEl = document.getElementById('emp-salary');
    var bioEl = document.getElementById('emp-bio');
    var empIdEl = document.getElementById('emp-id');

    var firstName = firstNameEl ? firstNameEl.value.trim() : '';
    var lastName = lastNameEl ? lastNameEl.value.trim() : '';

    if (!firstName || !lastName) {
      this.toast('First and last name are required', 'error');
      return;
    }

    /* BUG-003: Phone field accepts any string — no numeric validation */
    var data = {
      firstName: firstName,
      lastName: lastName,
      email: emailEl ? emailEl.value.trim() : '',
      phone: phoneEl ? phoneEl.value : '',
      department: deptEl ? deptEl.value : '',
      role: roleEl ? roleEl.value.trim() : '',
      startDate: startDateEl ? startDateEl.value : '',
      salary: salaryEl ? parseInt(salaryEl.value) || 0 : 0,
      /* BUG-015: No max length check on bio */
      bio: bioEl ? bioEl.value : ''
    };

    if (empIdEl && empIdEl.value) {
      Store.employees.update(parseInt(empIdEl.value), data);
      this.toast('Employee updated!', 'success');
    } else {
      Store.employees.create(data);
      this.toast('Employee added!', 'success');
    }

    window.location.hash = '#/employees';
  },

  /* ---------- Save Time Off ---------- */
  saveTimeOff: function() {
    var empEl = document.getElementById('timeoff-employee');
    var typeEl = document.getElementById('timeoff-type');
    var startEl = document.getElementById('timeoff-start');
    var endEl = document.getElementById('timeoff-end');
    var reasonEl = document.getElementById('timeoff-reason');

    if (!empEl || !empEl.value) {
      this.toast('Please select an employee', 'error');
      return;
    }
    if (!startEl || !startEl.value || !endEl || !endEl.value) {
      this.toast('Please select start and end dates', 'error');
      return;
    }

    /* BUG-009: days=0 accepted (handled in store) */
    Store.timeoff.create({
      employeeId: parseInt(empEl.value),
      type: typeEl ? typeEl.value : 'vacation',
      startDate: startEl.value,
      endDate: endEl.value,
      reason: reasonEl ? reasonEl.value : ''
    });

    this.toast('Time off request submitted!', 'success');
    window.location.hash = '#/timeoff';
  },

  /* ---------- Save Review ---------- */
  saveReview: function() {
    var empEl = document.getElementById('review-employee');
    var ratingEl = document.getElementById('review-rating');
    var commentsEl = document.getElementById('review-comments');
    var goalsEl = document.getElementById('review-goals');

    if (!empEl || !empEl.value) {
      this.toast('Please select an employee', 'error');
      return;
    }

    /* BUG-008: rating > 5 accepted (no max check in store) */
    /* BUG-032: empty comments accepted (no content check in store) */
    Store.reviews.create({
      employeeId: parseInt(empEl.value),
      rating: ratingEl ? parseInt(ratingEl.value) || 0 : 0,
      comments: commentsEl ? commentsEl.value : '',
      goals: goalsEl ? goalsEl.value : ''
    });

    this.toast('Review saved!', 'success');
    window.location.hash = '#/reviews';
  },

  /* ---------- Save Department ---------- */
  saveDepartment: function() {
    var nameEl = document.getElementById('dept-name');
    var headEl = document.getElementById('dept-head');
    var budgetEl = document.getElementById('dept-budget');
    var colorEl = document.getElementById('dept-color');
    var descEl = document.getElementById('dept-description');

    /* BUG-007: whitespace name accepted (passes through to store) */
    Store.departments.create({
      name: nameEl ? nameEl.value : '',
      head: headEl ? headEl.value : '',
      budget: budgetEl ? parseInt(budgetEl.value) || 0 : 0,
      color: colorEl ? colorEl.value : '#6366f1',
      description: descEl ? descEl.value : ''
    });

    this.toast('Department created!', 'success');
    window.location.hash = '#/departments';
  },

  /* ---------- Upload Document ---------- */
  /* BUG-014: No file extension validation */
  /* BUG-083: Filename not sanitized */
  /* BUG-026: Progress bar never reset */
  uploadDocument: function() {
    var nameEl = document.getElementById('doc-name');
    var fileEl = document.getElementById('doc-file');
    var categoryEl = document.getElementById('doc-category');

    var name = nameEl ? nameEl.value.trim() : '';
    if (!name) {
      this.toast('Please enter a document name', 'error');
      return;
    }

    /* BUG-014: Says "PDF only" in UI but accepts any file extension */
    var filename = fileEl ? fileEl.value : '';

    /* BUG-083: Filename not sanitized — accepts path traversal like ../../../etc/passwd */
    Store.documents.upload({
      name: name,
      filename: filename,
      category: categoryEl ? categoryEl.value : 'general'
    });

    /* BUG-026: Progress bar set to 100% but never reset for next upload */
    var progressFill = document.querySelector('.upload-progress-fill');
    if (progressFill) {
      progressFill.style.width = '100%';
    }

    this.toast('Document uploaded!', 'success');
    this.route();
  },

  /* ---------- Save Calendar Event ---------- */
  /* BUG-013: end time before start time accepted */
  saveCalendarEvent: function() {
    var titleEl = document.getElementById('event-title');
    var dateEl = document.getElementById('event-date');
    var startTimeEl = document.getElementById('event-start-time');
    var endTimeEl = document.getElementById('event-end-time');
    var typeEl = document.getElementById('event-type');

    if (!titleEl || !titleEl.value.trim()) {
      this.toast('Please enter an event title', 'error');
      return;
    }
    if (!dateEl || !dateEl.value) {
      this.toast('Please select a date', 'error');
      return;
    }

    /* BUG-013: No validation that end time is after start time */
    Store.calendar.addEvent({
      title: titleEl.value.trim(),
      date: dateEl.value,
      startTime: startTimeEl ? startTimeEl.value : '',
      endTime: endTimeEl ? endTimeEl.value : '',
      type: typeEl ? typeEl.value : 'meeting'
    });

    this.toast('Event added!', 'success');
    this.closeModal();
    this.route();
  },

  /* ---------- Save Settings ---------- */
  saveSettings: function() {
    var companyEl = document.getElementById('settings-company');
    var timezoneEl = document.getElementById('settings-timezone');
    var emailNotifEl = document.getElementById('settings-email-notif');
    var slackNotifEl = document.getElementById('settings-slack-notif');

    Store.settings.update({
      company: companyEl ? companyEl.value.trim() : '',
      timezone: timezoneEl ? timezoneEl.value : '',
      emailNotifications: emailNotifEl ? emailNotifEl.checked : false,
      slackNotifications: slackNotifEl ? slackNotifEl.checked : false
    });

    this.toast('Settings saved!', 'success');
  },

  /* ---------- Save Profile ---------- */
  /* BUG-015: No bio max length */
  saveProfile: function() {
    var nameEl = document.getElementById('profile-name');
    var emailEl = document.getElementById('profile-email');
    var phoneEl = document.getElementById('profile-phone');
    var bioEl = document.getElementById('profile-bio');

    Store.auth.updateProfile({
      name: nameEl ? nameEl.value.trim() : '',
      email: emailEl ? emailEl.value.trim() : '',
      phone: phoneEl ? phoneEl.value.trim() : '',
      /* BUG-015: No max length check on bio field */
      bio: bioEl ? bioEl.value : ''
    });

    this.updateUserMenu();
    this.toast('Profile updated!', 'success');
    this.route();
  },

  /* ---------- Sorting ---------- */
  /* BUG-019: Date columns sorted alphabetically, not chronologically */
  sortData: function(column) {
    if (this.currentSort.column === column) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort.column = column;
      this.currentSort.direction = 'asc';
    }
    /* BUG-019: All columns use string comparison — dates like "2024-03-15" sorted as strings */
    this.route();
  },

  /* ---------- Export CSV ---------- */
  /* BUG-028: Exports empty CSV when filtered data is empty */
  exportCSV: function(type) {
    var data = [];
    var headers = [];

    if (type === 'employees') {
      headers = ['Name', 'Email', 'Department', 'Role', 'Start Date', 'Status'];
      data = Store.employees.getFiltered(this.currentSearch, this.currentFilters);
    } else if (type === 'timeoff') {
      headers = ['Employee', 'Type', 'Start', 'End', 'Status'];
      data = Store.timeoff.list;
    } else if (type === 'payroll') {
      headers = ['Employee', 'Department', 'Salary', 'Bonus', 'Net Pay'];
      data = Store.payroll.list;
    }

    /* BUG-028: When data is empty, CSV has headers only — effectively an empty file */
    var csv = headers.join(',') + '\n';
    data.forEach(function(row) {
      var values = headers.map(function(h) {
        var key = h.toLowerCase().replace(/ /g, '');
        return '"' + (row[key] || '') + '"';
      });
      csv += values.join(',') + '\n';
    });

    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = type + '_export.csv';
    a.click();
    URL.revokeObjectURL(url);

    this.toast('CSV exported!', 'success');
  },

  /* ---------- Auth ---------- */
  doLogin: function() {
    var emailEl = document.getElementById('login-email');
    var passEl = document.getElementById('login-password');
    var rememberEl = document.getElementById('login-remember');

    var email = emailEl ? emailEl.value.trim() : '';
    var password = passEl ? passEl.value : '';
    var remember = rememberEl ? rememberEl.checked : false;

    if (!email || !password) {
      this.toast('Please enter email and password', 'error');
      return;
    }

    var result = Store.auth.login(email, password, remember);

    if (result.ok) {
      this.closeModal();
      this.updateUserMenu();
      this.toast('Welcome back, ' + Store.auth.user.name + '!', 'success');
      this.route();
    } else {
      this.toast(result.error, 'error');
    }
  },

  doRegister: function() {
    var nameEl = document.getElementById('register-name');
    var emailEl = document.getElementById('register-email');
    var passEl = document.getElementById('register-password');
    var confirmEl = document.getElementById('register-confirm');

    var name = nameEl ? nameEl.value.trim() : '';
    var email = emailEl ? emailEl.value.trim() : '';
    var password = passEl ? passEl.value : '';
    var confirm = confirmEl ? confirmEl.value : '';

    var result = Store.auth.register(name, email, password, confirm);

    if (result.ok) {
      this.closeModal();
      this.updateUserMenu();
      this.toast('Account created! Welcome to TalentFlow!', 'success');
      this.route();
    } else {
      this.toast(result.error, 'error');
    }
  },

  /* ---------- Modal ---------- */
  /* BUG-054: No focus trap in modal */
  showModal: function(type, data) {
    var overlay = document.getElementById('modal-overlay');
    var container = document.getElementById('modal-container');
    overlay.classList.remove('hidden');
    container.classList.remove('hidden');

    if (type === 'login') {
      container.innerHTML = Render.loginModal();
    } else if (type === 'register') {
      container.innerHTML = Render.registerModal();
    } else if (type === 'event') {
      container.innerHTML = Render.eventModal(data);
    } else if (type === 'apply') {
      container.innerHTML = Render.applyModal(data);
    }

    /* BUG-054: No focus trap — Tab can escape the modal */
    /* BUG-043 (CSS): No body overflow:hidden set */
  },

  closeModal: function() {
    var overlay = document.getElementById('modal-overlay');
    var container = document.getElementById('modal-container');
    overlay.classList.add('hidden');
    container.classList.add('hidden');
    container.innerHTML = '';
  },

  /* ---------- UI Helpers ---------- */
  updateUserMenu: function() {
    var el = document.getElementById('user-menu');
    if (el) el.innerHTML = Render.userMenu();
  },

  updateNotifBadge: function() {
    var badge = document.getElementById('notif-badge');
    if (badge) {
      /* BUG-045: getUnreadCount() may return NaN — badge shows "NaN" */
      var count = Store.notifications.getUnreadCount();
      badge.textContent = count > 0 ? count : '';
    }
  },

  updateSidebarActive: function() {
    var hash = window.location.hash || '#/';
    var section = hash.split('/')[1] || 'dashboard';
    var items = document.querySelectorAll('.nav-item');
    items.forEach(function(item) {
      item.classList.remove('active');
      if (item.dataset.section === section || (section === '' && item.dataset.section === 'dashboard')) {
        item.classList.add('active');
      }
    });
  },

  /* ---------- Toast ---------- */
  toast: function(message, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
    }, 3000);
  }
};

/* BUG-079: No CSRF token on any form submission */

/* ---------- Bootstrap ---------- */
document.addEventListener('DOMContentLoaded', function() {
  App.init();
});

/* Close modal on overlay click */
document.addEventListener('click', function(e) {
  if (e.target.id === 'modal-overlay') {
    App.closeModal();
  }
});
