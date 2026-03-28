/* =========================================================
   TalentFlow — Page Rendering
   Each function returns an HTML string.
   Event handling via data-action attributes in app.js
   ========================================================= */

/* BUG-087: Oversized decorative SVG (~80KB) generated on every load */
var HERO_DECORATION = (function() {
  var paths = '';
  for (var i = 0; i < 300; i++) {
    var x = Math.random() * 800; var y = Math.random() * 400;
    var r = Math.random() * 20 + 2;
    paths += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="rgba(99,102,241,0.06)"/>';
  }
  return '<svg class="hero-decoration" viewBox="0 0 800 400">' + paths + '</svg>';
})();

/* BUG-088: References Chart library that doesn't exist */
try { Chart.defaults.responsive = true; } catch(e) { console.error('Chart library not loaded:', e); }

/* BUG-090: Unnecessary setTimeout(0) wrapper */
var _renderQueue = [];
function queueRender(fn) { setTimeout(fn, 0); }


var Render = {

  /* =============== DASHBOARD =============== */
  dashboard: function() {
    var employees = Store.employees.getList();
    var jobs = Store.jobs.getList();
    var timeoff = Store.timeoff.getList();
    var departments = Store.departments.getList();
    var notifications = Store.notifications.getList();
    var user = Store.auth.user;

    var html = '';
    html += '<div class="hero">';
    html += HERO_DECORATION;
    html += '<h1>Welcome back' + (user ? ', ' + user.name.split(' ')[0] : '') + '!</h1>';
    html += '<p>Here\'s your HR overview for today</p>';
    html += '</div>';

    /* Stats bar */
    /* BUG-100: stats use DATA counts not Store counts — stale after modifications */
    var totalEmployees = DATA.employees.length;
    var openJobs = DATA.jobs.filter(function(j) { return j.status === 'open'; }).length;
    var pendingTimeOff = DATA.timeoff.filter(function(t) { return t.status === 'pending'; }).length;
    var totalDepts = DATA.departments.length;

    html += '<div class="stats-bar">';
    html += '<div class="stat-card"><div class="stat-number">' + totalEmployees + '</div><div class="stat-label">Total Employees</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + openJobs + '</div><div class="stat-label">Open Jobs</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + pendingTimeOff + '</div><div class="stat-label">Pending Time Off</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + totalDepts + '</div><div class="stat-label">Departments</div></div>';
    html += '</div>';

    /* BUG-044: Chart tooltip shows [object Object] instead of label/value */
    /* BUG-063: Chart has no text alternative, just colored bars */
    html += '<div class="section-header"><h2>Hiring Overview</h2></div>';
    html += '<div class="chart-container">';
    var chartData = [
      { label: 'Q1', value: 45 },
      { label: 'Q2', value: 62 },
      { label: 'Q3', value: 38 },
      { label: 'Q4', value: 51 }
    ];
    chartData.forEach(function(d) {
      /* BUG-044: title gets [object Object] because the object is concatenated directly */
      html += '<div class="chart-bar" style="height:' + d.value + '%" title="' + d + '"></div>';
    });
    html += '</div>';

    /* Recent activity */
    html += '<div class="section-header" style="margin-top:2rem;"><h2>Recent Activity</h2></div>';
    html += '<div class="activity-list">';
    var recentNotifs = notifications.slice(0, 5);
    recentNotifs.forEach(function(n) {
      html += '<div class="notif-item' + (n.read ? '' : ' unread') + '">';
      html += '<span class="notif-dot"></span>';
      html += '<div class="notif-content">';
      html += '<p>' + n.message + '</p>';
      html += '<span class="notif-date">' + n.date + '</span>';
      html += '</div>';
      html += '</div>';
    });
    if (recentNotifs.length === 0) {
      html += '<div class="empty-state"><p>No recent activity</p></div>';
    }
    html += '</div>';

    /* Quick actions */
    html += '<div class="section-header" style="margin-top:2rem;"><h2>Quick Actions</h2></div>';
    html += '<div class="quick-actions">';
    html += '<a href="#/employees/new" class="btn btn-primary">Add Employee</a>';
    html += '<a href="#/jobs/new" class="btn btn-primary">Post Job</a>';
    html += '<a href="#/reports" class="btn btn-secondary">View Reports</a>';
    html += '</div>';

    /* Upcoming time-off */
    html += '<div class="section-header" style="margin-top:2rem;"><h2>Upcoming Time Off</h2></div>';
    html += '<div class="card">';
    var approvedTimeOff = timeoff.filter(function(t) { return t.status === 'approved'; }).slice(0, 5);
    if (approvedTimeOff.length === 0) {
      html += '<p class="empty-state">No upcoming time off</p>';
    } else {
      html += '<table class="data-table">';
      html += '<thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th></tr></thead>';
      html += '<tbody>';
      approvedTimeOff.forEach(function(req) {
        var emp = Store.employees.getById(req.employeeId);
        html += '<tr>';
        html += '<td>' + (emp ? emp.name : 'Unknown') + '</td>';
        html += '<td>' + req.type + '</td>';
        html += '<td>' + req.startDate + ' - ' + req.endDate + '</td>';
        html += '<td>' + req.days + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';

    /* Open positions overview */
    html += '<div class="section-header" style="margin-top:2rem;"><h2>Open Positions</h2></div>';
    html += '<div class="card">';
    var openPositions = jobs.filter(function(j) { return j.status === 'open'; }).slice(0, 5);
    if (openPositions.length === 0) {
      html += '<p class="empty-state">No open positions</p>';
    } else {
      openPositions.forEach(function(job) {
        var dept = Store.departments.getById(job.departmentId);
        var applicants = Store.candidates.getList().filter(function(c) { return c.jobId === job.id; });
        html += '<div class="list-row" data-action="nav-to" data-href="#/jobs/' + job.id + '" style="cursor:pointer;">';
        html += '<div class="list-row-main">';
        html += '<strong>' + job.title + '</strong>';
        html += '<span class="text-muted"> &mdash; ' + (dept ? dept.name : '') + '</span>';
        html += '</div>';
        html += '<div class="list-row-meta">';
        html += '<span class="badge badge-blue">' + applicants.length + ' applicants</span>';
        html += '<span class="text-muted">' + job.location + '</span>';
        html += '</div>';
        html += '</div>';
      });
    }
    html += '</div>';

    /* Department headcount breakdown */
    html += '<div class="section-header" style="margin-top:2rem;"><h2>Department Headcount</h2></div>';
    html += '<div class="department-summary-grid">';
    departments.forEach(function(dept) {
      var members = employees.filter(function(e) { return e.departmentId === dept.id; });
      html += '<div class="stat-card mini">';
      html += '<span class="color-dot" style="background:' + dept.color + '"></span>';
      html += '<div class="stat-number">' + members.length + '</div>';
      html += '<div class="stat-label">' + dept.name + '</div>';
      html += '</div>';
    });
    html += '</div>';

    return html;
  },


  /* =============== JOBS LIST =============== */
  jobs: function() {
    var jobs = Store.jobs.getList();
    var departments = Store.departments.getList();
    var filterDept = App.filterDepartment || 'all';
    var filterStatus = App.filterStatus || 'all';
    var searchQuery = App.currentSearch || '';

    /* Apply filters */
    var filtered = jobs;
    if (filterDept !== 'all') {
      filtered = filtered.filter(function(j) { return j.departmentId === filterDept; });
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(function(j) { return j.status === filterStatus; });
    }
    if (searchQuery) {
      filtered = filtered.filter(function(j) {
        return j.title.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1;
      });
    }

    var html = '';
    html += '<div class="page-header"><h1>Job Listings</h1>';
    html += '<a href="#/jobs/new" class="btn btn-primary">+ Post Job</a></div>';

    /* BUG-051: Filter inputs use placeholder only, no <label> elements */
    html += '<div class="filter-bar">';
    html += '<div class="search-box">';
    html += '<input type="text" id="job-search" placeholder="Search jobs..." value="' + searchQuery + '">';
    html += '</div>';

    html += '<select id="filter-department" class="filter-select">';
    html += '<option value="all"' + (filterDept === 'all' ? ' selected' : '') + '>All Departments</option>';
    departments.forEach(function(d) {
      html += '<option value="' + d.id + '"' + (filterDept === d.id ? ' selected' : '') + '>' + d.name + '</option>';
    });
    html += '</select>';

    html += '<select id="filter-status" class="filter-select">';
    html += '<option value="all"' + (filterStatus === 'all' ? ' selected' : '') + '>All Statuses</option>';
    html += '<option value="open"' + (filterStatus === 'open' ? ' selected' : '') + '>Open</option>';
    html += '<option value="closed"' + (filterStatus === 'closed' ? ' selected' : '') + '>Closed</option>';
    html += '<option value="draft"' + (filterStatus === 'draft' ? ' selected' : '') + '>Draft</option>';
    html += '</select>';

    html += '<button class="btn btn-primary btn-sm" data-action="filter-jobs">Filter</button>';
    html += '</div>';

    /* BUG-058: Table <th> elements have no scope="col" attribute */
    html += '<div class="card">';
    html += '<table class="data-table">';
    html += '<thead><tr>';
    html += '<th>Title</th><th>Department</th><th>Location</th><th>Type</th><th>Status</th><th>Posted</th><th>Actions</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    if (filtered.length === 0) {
      html += '<tr><td colspan="7" class="empty-state">No jobs found</td></tr>';
    }

    filtered.forEach(function(job) {
      var dept = Store.departments.getById(job.departmentId);
      html += '<tr>';
      /* BUG-036: Long job title overflows without ellipsis */
      html += '<td><a href="#/jobs/' + job.id + '" class="link">' + job.title + '</a></td>';
      html += '<td>' + (dept ? dept.name : 'Unknown') + '</td>';
      html += '<td>' + job.location + '</td>';
      html += '<td>' + job.type + '</td>';
      /* BUG-053: Status shown only with colored badge (no icon or text-only alternative) */
      html += '<td><span class="badge badge-' + (job.status === 'open' ? 'green' : job.status === 'closed' ? 'red' : 'yellow') + '">' + job.status + '</span></td>';
      html += '<td>' + job.postedDate + '</td>';
      html += '<td>';
      html += '<button class="btn btn-sm btn-secondary" data-action="nav-to" data-href="#/jobs/' + job.id + '">View</button> ';
      html += '<button class="btn btn-sm btn-secondary" data-action="nav-to" data-href="#/jobs/' + job.id + '/edit">Edit</button>';
      html += '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';

    return html;
  },


  /* =============== JOB DETAIL =============== */
  jobDetail: function(id) {
    var job = Store.jobs.getById(id);
    if (!job) {
      return '<div class="empty-state"><h3>Job not found</h3><a href="#/jobs" class="back-link">&larr; Back to Jobs</a></div>';
    }

    var dept = Store.departments.getById(job.departmentId);
    var candidates = Store.candidates.getList().filter(function(c) {
      return c.jobId === job.id;
    });

    var html = '';
    html += '<a href="#/jobs" class="back-link">&larr; Back to Jobs</a>';

    html += '<div class="page-header"><h1>' + job.title + '</h1>';
    html += '<div class="page-actions">';
    html += '<button class="btn btn-secondary" data-action="nav-to" data-href="#/jobs/' + job.id + '/edit">Edit Job</button>';
    html += '</div></div>';

    html += '<div class="detail-grid">';
    html += '<div class="detail-main">';

    /* BUG-078: Job description rendered with innerHTML (XSS) */
    html += '<div class="card">';
    html += '<h3>Description</h3>';
    html += '<div class="job-description">' + job.description + '</div>';
    html += '</div>';

    html += '<div class="card">';
    html += '<h3>Requirements</h3>';
    html += '<ul class="requirements-list">';
    if (job.requirements && job.requirements.length) {
      job.requirements.forEach(function(req) {
        html += '<li>' + req + '</li>';
      });
    } else {
      html += '<li>No requirements specified</li>';
    }
    html += '</ul>';
    html += '</div>';

    /* Candidates who applied */
    html += '<div class="card">';
    html += '<h3>Applicants (' + candidates.length + ')</h3>';
    if (candidates.length === 0) {
      html += '<p class="empty-state">No applicants yet</p>';
    } else {
      html += '<table class="data-table">';
      html += '<thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Applied</th><th></th></tr></thead>';
      html += '<tbody>';
      candidates.forEach(function(c) {
        html += '<tr>';
        html += '<td><a href="#/candidates/' + c.id + '" class="link">' + c.name + '</a></td>';
        html += '<td>' + c.email + '</td>';
        html += '<td><span class="badge badge-' + Render._candidateStatusColor(c.status) + '">' + c.status + '</span></td>';
        html += '<td>' + c.appliedDate + '</td>';
        html += '<td><button class="btn btn-sm btn-secondary" data-action="nav-to" data-href="#/candidates/' + c.id + '">View</button></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';
    html += '</div>'; /* end detail-main */

    /* Sidebar info */
    html += '<div class="detail-sidebar">';
    html += '<div class="card">';
    html += '<h3>Job Details</h3>';
    html += '<div class="detail-row"><span class="detail-label">Department</span><span>' + (dept ? dept.name : 'Unknown') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Location</span><span>' + job.location + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Type</span><span>' + job.type + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Salary Range</span><span>$' + (job.salaryMin || 0).toLocaleString() + ' - $' + (job.salaryMax || 0).toLocaleString() + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Status</span><span class="badge badge-' + (job.status === 'open' ? 'green' : 'red') + '">' + job.status + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Posted</span><span>' + job.postedDate + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Closing Date</span><span>' + (job.closingDate || 'Not set') + '</span></div>';
    /* BUG-052: No alt on decorative icons */
    html += '<img src="data:image/svg+xml," class="detail-decoration">';
    html += '</div>';

    /* Application pipeline summary */
    html += '<div class="card">';
    html += '<h3>Pipeline Summary</h3>';
    var statusCounts = { applied: 0, screening: 0, interview: 0, offered: 0, hired: 0, rejected: 0 };
    candidates.forEach(function(c) {
      if (statusCounts.hasOwnProperty(c.status)) statusCounts[c.status]++;
    });
    html += '<div class="pipeline-summary">';
    html += '<div class="pipeline-step"><span class="pipeline-count">' + statusCounts.applied + '</span><span class="pipeline-label">Applied</span></div>';
    html += '<div class="pipeline-step"><span class="pipeline-count">' + statusCounts.screening + '</span><span class="pipeline-label">Screening</span></div>';
    html += '<div class="pipeline-step"><span class="pipeline-count">' + statusCounts.interview + '</span><span class="pipeline-label">Interview</span></div>';
    html += '<div class="pipeline-step"><span class="pipeline-count">' + statusCounts.offered + '</span><span class="pipeline-label">Offered</span></div>';
    html += '<div class="pipeline-step"><span class="pipeline-count">' + statusCounts.hired + '</span><span class="pipeline-label">Hired</span></div>';
    html += '<div class="pipeline-step"><span class="pipeline-count">' + statusCounts.rejected + '</span><span class="pipeline-label">Rejected</span></div>';
    html += '</div>';
    html += '</div>';

    /* Actions */
    html += '<div class="card">';
    html += '<h3>Actions</h3>';
    if (job.status === 'open') {
      html += '<button class="btn btn-danger btn-sm" data-action="close-job" data-id="' + job.id + '" style="width:100%;margin-bottom:0.5rem;">Close Position</button>';
    } else {
      html += '<button class="btn btn-primary btn-sm" data-action="reopen-job" data-id="' + job.id + '" style="width:100%;margin-bottom:0.5rem;">Reopen Position</button>';
    }
    html += '<button class="btn btn-secondary btn-sm" data-action="nav-to" data-href="#/jobs/' + job.id + '/edit" style="width:100%;margin-bottom:0.5rem;">Edit Job</button>';
    html += '<button class="btn btn-secondary btn-sm" data-action="nav-to" data-href="#/jobs" style="width:100%;">Back to Jobs</button>';
    html += '</div>';

    html += '</div>'; /* end detail-sidebar */

    html += '</div>'; /* end detail-grid */

    return html;
  },


  /* =============== JOB FORM =============== */
  /* BUG-031: Draft job data not auto-saved — navigating away loses all entered data */
  jobForm: function(id) {
    var job = id ? Store.jobs.getById(id) : null;
    var departments = Store.departments.getList();
    var isEdit = !!job;

    var html = '';
    html += '<a href="' + (isEdit ? '#/jobs/' + id : '#/jobs') + '" class="back-link">&larr; Back</a>';
    /* BUG-031: No beforeunload warning or draft persistence — form data lost on nav */
    html += '<div class="page-header"><h1>' + (isEdit ? 'Edit Job' : 'Post New Job') + '</h1></div>';

    /* BUG-051: All inputs use placeholder, no <label> elements */
    /* BUG-079: No CSRF token hidden input */
    html += '<div class="form-card">';

    html += '<div class="form-group">';
    html += '<input type="text" id="job-title" placeholder="Job Title *" value="' + (job ? job.title : '') + '">';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<select id="job-department">';
    html += '<option value="">Select Department *</option>';
    departments.forEach(function(d) {
      var sel = (job && job.departmentId === d.id) ? ' selected' : '';
      html += '<option value="' + d.id + '"' + sel + '>' + d.name + '</option>';
    });
    html += '</select>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<select id="job-location">';
    html += '<option value="">Select Location *</option>';
    var locations = ['New York, NY', 'San Francisco, CA', 'Austin, TX', 'Chicago, IL', 'Remote', 'London, UK'];
    locations.forEach(function(loc) {
      var sel = (job && job.location === loc) ? ' selected' : '';
      html += '<option value="' + loc + '"' + sel + '>' + loc + '</option>';
    });
    html += '</select>';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<select id="job-type">';
    html += '<option value="">Select Type *</option>';
    var types = ['Full-time', 'Part-time', 'Contract', 'Internship'];
    types.forEach(function(t) {
      var sel = (job && job.type === t) ? ' selected' : '';
      html += '<option value="' + t + '"' + sel + '>' + t + '</option>';
    });
    html += '</select>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<input type="number" id="job-salary-min" placeholder="Min Salary" value="' + (job ? job.salaryMin || '' : '') + '">';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<input type="number" id="job-salary-max" placeholder="Max Salary" value="' + (job ? job.salaryMax || '' : '') + '">';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<textarea id="job-description" placeholder="Job Description *" rows="6">' + (job ? job.description : '') + '</textarea>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<textarea id="job-requirements" placeholder="Requirements (one per line)" rows="4">' + (job && job.requirements ? job.requirements.join('\n') : '') + '</textarea>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<input type="date" id="job-closing-date" placeholder="Closing Date" value="' + (job ? job.closingDate || '' : '') + '">';
    html += '</div>';

    html += '<div class="form-actions">';
    html += '<button class="btn btn-primary" data-action="' + (isEdit ? 'update-job' : 'create-job') + '"' + (isEdit ? ' data-id="' + id + '"' : '') + '>' + (isEdit ? 'Update Job' : 'Post Job') + '</button>';
    html += '<button class="btn btn-secondary" data-action="nav-to" data-href="' + (isEdit ? '#/jobs/' + id : '#/jobs') + '">Cancel</button>';
    html += '</div>';

    html += '</div>';

    return html;
  },


  /* =============== CANDIDATES LIST =============== */
  candidates: function() {
    var candidates = Store.candidates.getList();
    var searchQuery = App.currentSearch || '';

    if (searchQuery) {
      candidates = candidates.filter(function(c) {
        return c.name.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
               c.email.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1;
      });
    }

    var html = '';
    html += '<div class="page-header"><h1>Candidates</h1></div>';

    html += '<div class="filter-bar">';
    html += '<div class="search-box">';
    html += '<input type="text" id="candidate-search" placeholder="Search candidates..." value="' + searchQuery + '">';
    html += '</div>';
    html += '<button class="btn btn-primary btn-sm" data-action="filter-candidates">Search</button>';
    html += '</div>';

    /* BUG-058: No scope on th */
    html += '<div class="card">';
    html += '<table class="data-table">';
    html += '<thead><tr>';
    html += '<th>Name</th><th>Email</th><th>Job</th><th>Status</th><th>Rating</th><th>Applied</th><th>Actions</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    if (candidates.length === 0) {
      html += '<tr><td colspan="7" class="empty-state">No candidates found</td></tr>';
    }

    candidates.forEach(function(c) {
      var job = Store.jobs.getById(c.jobId);
      html += '<tr>';
      html += '<td><a href="#/candidates/' + c.id + '" class="link">' + c.name + '</a></td>';
      html += '<td>' + c.email + '</td>';
      html += '<td>' + (job ? job.title : 'Unknown') + '</td>';
      /* BUG-042: Status badge for 'screening' and 'interview' use the same green color class */
      html += '<td><span class="badge badge-' + Render._candidateStatusColor(c.status) + '">' + c.status + '</span></td>';
      html += '<td>';
      /* BUG-060: Star icons lack aria-hidden="true" */
      for (var s = 1; s <= 5; s++) {
        html += '<span class="star' + (s <= c.rating ? ' star-filled' : '') + '">&#9733;</span>';
      }
      html += '</td>';
      html += '<td>' + c.appliedDate + '</td>';
      html += '<td>';
      html += '<button class="btn btn-sm btn-secondary" data-action="nav-to" data-href="#/candidates/' + c.id + '">View</button>';
      html += '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';

    return html;
  },

  /* Helper: candidate status color */
  _candidateStatusColor: function(status) {
    /* BUG-042: screening and interview both return 'green' */
    switch (status) {
      case 'applied': return 'blue';
      case 'screening': return 'green';
      case 'interview': return 'green';
      case 'offered': return 'yellow';
      case 'hired': return 'green';
      case 'rejected': return 'red';
      default: return 'blue';
    }
  },


  /* =============== CANDIDATE DETAIL =============== */
  candidateDetail: function(id) {
    var candidate = Store.candidates.getById(id);
    if (!candidate) {
      return '<div class="empty-state"><h3>Candidate not found</h3><a href="#/candidates" class="back-link">&larr; Back</a></div>';
    }

    var job = Store.jobs.getById(candidate.jobId);

    var html = '';
    html += '<a href="#/candidates" class="back-link">&larr; Back to Candidates</a>';

    html += '<div class="page-header"><h1>' + candidate.name + '</h1></div>';

    html += '<div class="detail-grid">';
    html += '<div class="detail-main">';

    /* Profile card */
    html += '<div class="card profile-card">';
    /* BUG-052: Profile image missing alt */
    html += '<img src="' + (candidate.avatarUrl || 'https://via.placeholder.com/100') + '" class="avatar-lg">';
    html += '<div class="profile-info">';
    html += '<h2>' + candidate.name + '</h2>';
    html += '<p class="profile-subtitle">' + candidate.email + '</p>';
    html += '<p>Applied for: <strong>' + (job ? job.title : 'Unknown') + '</strong></p>';
    html += '<div class="rating-display">';
    for (var s = 1; s <= 5; s++) {
      html += '<span class="star' + (s <= candidate.rating ? ' star-filled' : '') + '">&#9733;</span>';
    }
    html += '</div>';
    html += '</div>';
    html += '</div>';

    /* Application details */
    html += '<div class="card">';
    html += '<h3>Application Details</h3>';
    html += '<div class="detail-row"><span class="detail-label">Status</span><span class="badge badge-' + Render._candidateStatusColor(candidate.status) + '">' + candidate.status + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Applied Date</span><span>' + candidate.appliedDate + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Phone</span><span>' + (candidate.phone || 'Not provided') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Experience</span><span>' + (candidate.experience || 'N/A') + ' years</span></div>';
    html += '</div>';

    /* Skills */
    html += '<div class="card">';
    html += '<h3>Skills</h3>';
    if (candidate.skills && candidate.skills.length) {
      html += '<div class="skills-list">';
      candidate.skills.forEach(function(skill) {
        html += '<span class="badge badge-blue">' + skill + '</span> ';
      });
      html += '</div>';
    } else {
      html += '<p class="text-muted">No skills listed</p>';
    }
    html += '</div>';

    /* Education */
    html += '<div class="card">';
    html += '<h3>Education</h3>';
    if (candidate.education) {
      html += '<p>' + candidate.education + '</p>';
    } else {
      html += '<p class="text-muted">No education details provided</p>';
    }
    html += '</div>';

    /* Notes */
    html += '<div class="card">';
    html += '<h3>Notes</h3>';
    html += '<p>' + (candidate.notes || 'No notes recorded.') + '</p>';
    html += '</div>';

    /* Interview History */
    html += '<div class="card">';
    html += '<h3>Interview History</h3>';
    if (candidate.interviews && candidate.interviews.length) {
      candidate.interviews.forEach(function(interview) {
        html += '<div class="list-row">';
        html += '<div class="list-row-main">';
        html += '<strong>' + interview.type + '</strong>';
        html += '<span class="text-muted"> with ' + (interview.interviewer || 'TBD') + '</span>';
        html += '</div>';
        html += '<div class="list-row-meta">';
        html += '<span>' + interview.date + '</span>';
        html += '<span class="badge badge-' + (interview.result === 'pass' ? 'green' : interview.result === 'fail' ? 'red' : 'yellow') + '">' + (interview.result || 'Pending') + '</span>';
        html += '</div>';
        html += '</div>';
      });
    } else {
      html += '<p class="empty-state">No interviews scheduled</p>';
    }
    html += '</div>';

    html += '</div>'; /* end detail-main */

    /* Sidebar: interview scheduling */
    html += '<div class="detail-sidebar">';
    html += '<div class="card">';
    html += '<h3>Schedule Interview</h3>';
    html += '<div class="form-group">';
    html += '<input type="date" id="interview-date" placeholder="Select date">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="time" id="interview-time" placeholder="Select time">';
    html += '</div>';
    html += '<button class="btn btn-primary" data-action="schedule-interview" data-id="' + candidate.id + '">Schedule</button>';
    html += '</div>';

    /* Status actions */
    html += '<div class="card">';
    html += '<h3>Actions</h3>';
    html += '<button class="btn btn-primary btn-sm" data-action="update-candidate-status" data-id="' + candidate.id + '" data-status="interview" style="margin-bottom:0.5rem;width:100%;">Move to Interview</button>';
    html += '<button class="btn btn-secondary btn-sm" data-action="update-candidate-status" data-id="' + candidate.id + '" data-status="offered" style="margin-bottom:0.5rem;width:100%;">Make Offer</button>';
    html += '<button class="btn btn-danger btn-sm" data-action="update-candidate-status" data-id="' + candidate.id + '" data-status="rejected" style="width:100%;">Reject</button>';
    html += '</div>';
    html += '</div>'; /* end detail-sidebar */

    html += '</div>'; /* end detail-grid */

    return html;
  },


  /* =============== EMPLOYEES LIST =============== */
  employees: function() {
    var employees = Store.employees.getList();
    var departments = Store.departments.getList();
    var searchQuery = App.currentSearch || '';
    var filterDept = App.filterDepartment || 'all';
    var filterStatus = App.filterStatus || 'all';
    var page = App.currentPage || 1;
    var perPage = 10;

    /* Apply filters */
    var filtered = employees;
    if (filterDept !== 'all') {
      filtered = filtered.filter(function(e) { return e.departmentId === filterDept; });
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(function(e) { return e.status === filterStatus; });
    }
    if (searchQuery) {
      filtered = filtered.filter(function(e) {
        return e.name.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
               e.email.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
               e.role.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1;
      });
    }

    var html = '';
    html += '<div class="page-header"><h1>Employees</h1>';
    html += '<a href="#/employees/new" class="btn btn-primary">+ Add Employee</a></div>';

    /* BUG-076: Search query rendered into innerHTML (XSS) */
    if (searchQuery) {
      html += '<h3>Results for "' + searchQuery + '"</h3>';
    }

    /* BUG-051: Search input no label */
    html += '<div class="filter-bar">';
    html += '<div class="search-box">';
    html += '<input type="text" id="employee-search" placeholder="Search employees..." value="' + searchQuery + '">';
    html += '</div>';

    html += '<select id="filter-emp-department" class="filter-select">';
    html += '<option value="all"' + (filterDept === 'all' ? ' selected' : '') + '>All Departments</option>';
    departments.forEach(function(d) {
      html += '<option value="' + d.id + '"' + (filterDept === d.id ? ' selected' : '') + '>' + d.name + '</option>';
    });
    html += '</select>';

    html += '<select id="filter-emp-status" class="filter-select">';
    html += '<option value="all"' + (filterStatus === 'all' ? ' selected' : '') + '>All Statuses</option>';
    html += '<option value="active"' + (filterStatus === 'active' ? ' selected' : '') + '>Active</option>';
    html += '<option value="inactive"' + (filterStatus === 'inactive' ? ' selected' : '') + '>Inactive</option>';
    html += '<option value="on-leave"' + (filterStatus === 'on-leave' ? ' selected' : '') + '>On Leave</option>';
    html += '</select>';

    html += '<button class="btn btn-primary btn-sm" data-action="filter-employees">Filter</button>';
    html += '</div>';

    /* BUG-039: When filter returns no results, show nothing (no "No employees found" message) */

    /* BUG-093: document.querySelectorAll called inside the render function (unnecessary DOM query) */
    var existingCards = document.querySelectorAll('.employee-card');

    /* Pagination */
    var totalPages = Math.ceil(filtered.length / perPage);
    var startIdx = (page - 1) * perPage;
    var pageItems = filtered.slice(startIdx, startIdx + perPage);

    /* Employee cards */
    html += '<div class="employee-grid">';
    pageItems.forEach(function(emp) {
      var dept = Store.departments.getById(emp.departmentId);
      html += '<div class="employee-card card">';
      html += '<div class="employee-card-header">';
      html += '<input type="checkbox" class="employee-select" data-id="' + emp.id + '">';
      html += '<img src="' + (emp.avatarUrl || 'https://via.placeholder.com/48') + '" class="avatar">';
      html += '</div>';
      html += '<div class="employee-card-body">';
      html += '<h3><a href="#/employees/' + emp.id + '" class="link">' + emp.name + '</a></h3>';
      html += '<p class="employee-role">' + emp.role + '</p>';
      html += '<p class="employee-dept">' + (dept ? dept.name : 'Unassigned') + '</p>';
      /* BUG-053: Status indicator is color-only */
      html += '<span class="badge badge-' + (emp.status === 'active' ? 'green' : emp.status === 'on-leave' ? 'yellow' : 'red') + '">' + emp.status + '</span>';
      html += '</div>';
      html += '<div class="employee-card-actions">';
      html += '<button class="btn btn-sm btn-secondary" data-action="nav-to" data-href="#/employees/' + emp.id + '">View</button>';
      html += '<button class="btn btn-sm btn-secondary" data-action="nav-to" data-href="#/employees/' + emp.id + '/edit">Edit</button>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';

    /* Pagination controls */
    if (totalPages > 1) {
      html += '<div class="pagination">';
      html += '<button class="btn btn-sm btn-secondary" data-action="page-prev"' + (page <= 1 ? ' disabled' : '') + '>&laquo; Prev</button>';
      html += '<span class="pagination-info">Page ' + page + ' of ' + totalPages + '</span>';
      html += '<button class="btn btn-sm btn-secondary" data-action="page-next"' + (page >= totalPages ? ' disabled' : '') + '>Next &raquo;</button>';
      html += '</div>';
    }

    return html;
  },


  /* =============== EMPLOYEE DETAIL =============== */
  employeeDetail: function(id) {
    var emp = Store.employees.getById(id);
    /* BUG-040: If id not found, return loading spinner (infinite spinner, no error) */
    if (!emp) {
      return '<div class="loading-spinner"></div>';
    }

    var dept = Store.departments.getById(emp.departmentId);

    var html = '';
    html += '<a href="#/employees" class="back-link">&larr; Back to Employees</a>';

    html += '<div class="page-header"><h1>' + emp.name + '</h1>';
    html += '<div class="page-actions">';
    html += '<button class="btn btn-secondary" data-action="nav-to" data-href="#/employees/' + emp.id + '/edit">Edit</button>';
    html += '<button class="btn btn-danger" data-action="delete-employee" data-id="' + emp.id + '">Delete</button>';
    html += '</div></div>';

    html += '<div class="detail-grid">';
    html += '<div class="detail-main">';

    /* Profile card */
    html += '<div class="card profile-card">';
    /* BUG-037: Avatar shows "undefined" when avatarUrl is null */
    html += '<img src="' + emp.avatarUrl + '" class="avatar-img">';
    html += '<div class="profile-info">';
    html += '<h2>' + emp.name + '</h2>';
    html += '<p class="profile-subtitle">' + emp.role + '</p>';
    html += '<span class="badge badge-' + (emp.status === 'active' ? 'green' : emp.status === 'on-leave' ? 'yellow' : 'red') + '">' + emp.status + '</span>';
    html += '</div>';
    html += '</div>';

    /* Bio */
    html += '<div class="card">';
    html += '<h3>Biography</h3>';
    /* BUG-077: Bio rendered with innerHTML (XSS) */
    html += '<div class="bio">' + emp.bio + '</div>';
    html += '</div>';

    /* Contact info */
    html += '<div class="card">';
    html += '<h3>Contact Information</h3>';
    html += '<div class="detail-row"><span class="detail-label">Email</span><span>' + emp.email + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Phone</span><span>' + (emp.phone || 'Not provided') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Address</span><span>' + (emp.address || 'Not provided') + '</span></div>';
    html += '</div>';

    /* Time off history for this employee */
    var empTimeOff = Store.timeoff.getList().filter(function(t) { return t.employeeId === emp.id; });
    html += '<div class="card">';
    html += '<h3>Time Off History</h3>';
    if (empTimeOff.length === 0) {
      html += '<p class="empty-state">No time off requests</p>';
    } else {
      html += '<table class="data-table">';
      html += '<thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th></tr></thead>';
      html += '<tbody>';
      empTimeOff.forEach(function(req) {
        html += '<tr>';
        html += '<td>' + req.type + '</td>';
        html += '<td>' + req.startDate + ' - ' + req.endDate + '</td>';
        html += '<td>' + req.days + '</td>';
        html += '<td><span class="badge badge-' + (req.status === 'approved' ? 'green' : req.status === 'pending' ? 'yellow' : 'red') + '">' + req.status + '</span></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';

    /* Performance reviews for this employee */
    var empReviews = Store.reviews.getList().filter(function(r) { return r.employeeId === emp.id; });
    html += '<div class="card">';
    html += '<h3>Performance Reviews</h3>';
    if (empReviews.length === 0) {
      html += '<p class="empty-state">No reviews on file</p>';
    } else {
      html += '<table class="data-table">';
      html += '<thead><tr><th>Cycle</th><th>Rating</th><th>Reviewer</th><th>Status</th><th></th></tr></thead>';
      html += '<tbody>';
      empReviews.forEach(function(rev) {
        var reviewer = Store.employees.getById(rev.reviewerId);
        html += '<tr>';
        html += '<td>' + rev.cycle + '</td>';
        html += '<td>';
        var starCount = Math.floor(rev.rating);
        for (var s = 1; s <= 5; s++) {
          html += '<span class="star' + (s <= starCount ? ' star-filled' : '') + '">&#9733;</span>';
        }
        html += '</td>';
        html += '<td>' + (reviewer ? reviewer.name : 'Unknown') + '</td>';
        html += '<td><span class="badge badge-' + (rev.status === 'completed' ? 'green' : 'yellow') + '">' + rev.status + '</span></td>';
        html += '<td><button class="btn btn-sm btn-secondary" data-action="nav-to" data-href="#/reviews/' + rev.id + '">View</button></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';

    html += '</div>'; /* end detail-main */

    /* Sidebar */
    html += '<div class="detail-sidebar">';
    html += '<div class="card">';
    html += '<h3>Employment Details</h3>';
    html += '<div class="detail-row"><span class="detail-label">Department</span><span>' + (dept ? dept.name : 'Unassigned') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Start Date</span><span>' + (emp.startDate || 'N/A') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Birth Date</span><span>' + (emp.birthDate || 'N/A') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Salary</span><span>$' + (emp.salary || 0).toLocaleString() + '</span></div>';
    /* BUG-085: SSN displayed in plain text (no masking like XXX-XX-6789) */
    html += '<p>SSN: ' + emp.ssn + '</p>';
    html += '</div>';

    /* Emergency contact */
    html += '<div class="card">';
    html += '<h3>Emergency Contact</h3>';
    html += '<div class="detail-row"><span class="detail-label">Name</span><span>' + (emp.emergencyContactName || 'Not provided') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Phone</span><span>' + (emp.emergencyContactPhone || 'Not provided') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Relationship</span><span>' + (emp.emergencyContactRelation || 'Not provided') + '</span></div>';
    html += '</div>';

    /* Quick actions */
    html += '<div class="card">';
    html += '<h3>Quick Actions</h3>';
    html += '<button class="btn btn-secondary btn-sm" data-action="nav-to" data-href="#/reviews/new?employee=' + emp.id + '" style="width:100%;margin-bottom:0.5rem;">New Review</button>';
    html += '<button class="btn btn-secondary btn-sm" data-action="nav-to" data-href="#/timeoff/new?employee=' + emp.id + '" style="width:100%;margin-bottom:0.5rem;">Request Time Off</button>';
    html += '<button class="btn btn-secondary btn-sm" data-action="nav-to" data-href="#/employees/' + emp.id + '/edit" style="width:100%;">Edit Profile</button>';
    html += '</div>';

    html += '</div>'; /* end detail-sidebar */

    html += '</div>'; /* end detail-grid */

    return html;
  },


  /* =============== EMPLOYEE FORM =============== */
  employeeForm: function(id) {
    var emp = id ? Store.employees.getById(id) : null;
    var departments = Store.departments.getList();
    var isEdit = !!emp;

    var html = '';
    html += '<a href="' + (isEdit ? '#/employees/' + id : '#/employees') + '" class="back-link">&larr; Back</a>';
    html += '<div class="page-header"><h1>' + (isEdit ? 'Edit Employee' : 'Add Employee') + '</h1></div>';

    /* BUG-051: No labels */
    /* BUG-056: Form area has no role="form" or aria attributes */
    html += '<div class="form-card">';

    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<input type="text" id="emp-name" placeholder="Full Name *" value="' + (emp ? emp.name : '') + '">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="email" id="emp-email" placeholder="Email Address *" value="' + (emp ? emp.email : '') + '">';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<input type="tel" id="emp-phone" placeholder="Phone Number" value="' + (emp ? emp.phone || '' : '') + '">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="text" id="emp-role" placeholder="Job Title / Role *" value="' + (emp ? emp.role : '') + '">';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<select id="emp-department">';
    html += '<option value="">Select Department *</option>';
    departments.forEach(function(d) {
      var sel = (emp && emp.departmentId === d.id) ? ' selected' : '';
      html += '<option value="' + d.id + '"' + sel + '>' + d.name + '</option>';
    });
    html += '</select>';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="number" id="emp-salary" placeholder="Annual Salary" value="' + (emp ? emp.salary || '' : '') + '">';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<input type="date" id="emp-start-date" placeholder="Start Date" value="' + (emp ? emp.startDate || '' : '') + '">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="date" id="emp-birth-date" placeholder="Birth Date" value="' + (emp ? emp.birthDate || '' : '') + '">';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<textarea id="emp-bio" placeholder="Short biography..." rows="4">' + (emp ? emp.bio || '' : '') + '</textarea>';
    html += '</div>';

    html += '<div class="form-actions">';
    html += '<button class="btn btn-primary" data-action="' + (isEdit ? 'update-employee' : 'create-employee') + '"' + (isEdit ? ' data-id="' + id + '"' : '') + '>' + (isEdit ? 'Update Employee' : 'Add Employee') + '</button>';
    html += '<button class="btn btn-secondary" data-action="nav-to" data-href="' + (isEdit ? '#/employees/' + id : '#/employees') + '">Cancel</button>';
    html += '</div>';

    html += '</div>';

    return html;
  },


  /* =============== TIME OFF =============== */
  timeoff: function() {
    var requests = Store.timeoff.getList();
    var employees = Store.employees.getList();

    var html = '';
    html += '<div class="page-header"><h1>Time Off Requests</h1>';
    html += '<a href="#/timeoff/new" class="btn btn-primary">+ New Request</a></div>';

    /* Summary stats */
    var approvedCount = requests.filter(function(r) { return r.status === 'approved'; }).length;
    var pendingCount = requests.filter(function(r) { return r.status === 'pending'; }).length;
    var rejectedCount = requests.filter(function(r) { return r.status === 'rejected'; }).length;
    var totalDaysApproved = requests.filter(function(r) { return r.status === 'approved'; }).reduce(function(s, r) { return s + r.days; }, 0);

    html += '<div class="stats-bar">';
    html += '<div class="stat-card"><div class="stat-number">' + requests.length + '</div><div class="stat-label">Total Requests</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + approvedCount + '</div><div class="stat-label">Approved</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + pendingCount + '</div><div class="stat-label">Pending</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + totalDaysApproved + '</div><div class="stat-label">Days Approved</div></div>';
    html += '</div>';

    /* BUG-058: No scope on th */
    html += '<div class="card">';
    html += '<table class="data-table">';
    html += '<thead><tr>';
    html += '<th>Employee</th><th>Type</th><th>Start Date</th><th>End Date</th><th>Days</th><th>Status</th><th>Actions</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    if (requests.length === 0) {
      html += '<tr><td colspan="7" class="empty-state">No time off requests</td></tr>';
    }

    requests.forEach(function(req) {
      var emp = Store.employees.getById(req.employeeId);
      html += '<tr>';
      html += '<td>' + (emp ? emp.name : 'Unknown') + '</td>';
      html += '<td>' + req.type + '</td>';
      html += '<td>' + req.startDate + '</td>';
      html += '<td>' + req.endDate + '</td>';
      html += '<td>' + req.days + '</td>';
      /* BUG-042: 'approved' status badge uses same green as 'active' employee status */
      html += '<td><span class="badge badge-' + (req.status === 'approved' ? 'green' : req.status === 'pending' ? 'yellow' : 'red') + '">' + req.status + '</span></td>';
      html += '<td>';
      if (req.status === 'pending') {
        html += '<button class="btn btn-sm btn-primary" data-action="approve-timeoff" data-id="' + req.id + '">Approve</button> ';
        html += '<button class="btn btn-sm btn-danger" data-action="reject-timeoff" data-id="' + req.id + '">Reject</button>';
      } else {
        html += '<span class="text-muted">-</span>';
      }
      html += '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';

    return html;
  },


  /* =============== TIME OFF FORM =============== */
  timeoffForm: function() {
    var html = '';
    html += '<a href="#/timeoff" class="back-link">&larr; Back to Time Off</a>';
    html += '<div class="page-header"><h1>New Time Off Request</h1></div>';

    /* BUG-051: No labels */
    html += '<div class="form-card">';

    html += '<div class="form-group">';
    html += '<select id="timeoff-type">';
    html += '<option value="">Select Type *</option>';
    html += '<option value="vacation">Vacation</option>';
    html += '<option value="sick">Sick Leave</option>';
    html += '<option value="personal">Personal Day</option>';
    html += '<option value="bereavement">Bereavement</option>';
    html += '<option value="parental">Parental Leave</option>';
    html += '</select>';
    html += '</div>';

    html += '<div class="form-row">';
    html += '<div class="form-group">';
    html += '<input type="date" id="timeoff-start" placeholder="Start Date *">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="date" id="timeoff-end" placeholder="End Date *">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="number" id="timeoff-days" placeholder="Number of Days" readonly>';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<textarea id="timeoff-reason" placeholder="Reason (optional)" rows="3"></textarea>';
    html += '</div>';

    html += '<div class="form-actions">';
    html += '<button class="btn btn-primary" data-action="submit-timeoff">Submit Request</button>';
    html += '<button class="btn btn-secondary" data-action="nav-to" data-href="#/timeoff">Cancel</button>';
    html += '</div>';

    html += '</div>';

    return html;
  },


  /* =============== REVIEWS LIST =============== */
  reviews: function() {
    var reviews = Store.reviews.getList();

    var html = '';
    html += '<div class="page-header"><h1>Performance Reviews</h1>';
    html += '<a href="#/reviews/new" class="btn btn-primary">+ New Review</a></div>';

    /* Summary stats */
    var completedReviews = reviews.filter(function(r) { return r.status === 'completed'; }).length;
    var inProgressReviews = reviews.filter(function(r) { return r.status === 'in-progress'; }).length;
    var pendingReviews = reviews.filter(function(r) { return r.status === 'pending'; }).length;
    var avgRating = reviews.length > 0 ? (reviews.reduce(function(sum, r) { return sum + r.rating; }, 0) / reviews.length).toFixed(1) : '0.0';

    html += '<div class="stats-bar">';
    html += '<div class="stat-card"><div class="stat-number">' + reviews.length + '</div><div class="stat-label">Total Reviews</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + completedReviews + '</div><div class="stat-label">Completed</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + inProgressReviews + '</div><div class="stat-label">In Progress</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + avgRating + '</div><div class="stat-label">Avg Rating</div></div>';
    html += '</div>';

    /* BUG-058: No th scope */
    html += '<div class="card">';
    html += '<table class="data-table">';
    html += '<thead><tr>';
    html += '<th>Employee</th><th>Reviewer</th><th>Cycle</th><th>Rating</th><th>Status</th><th>Date</th><th>Actions</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    if (reviews.length === 0) {
      html += '<tr><td colspan="7" class="empty-state">No reviews found</td></tr>';
    }

    reviews.forEach(function(rev) {
      var emp = Store.employees.getById(rev.employeeId);
      var reviewer = Store.employees.getById(rev.reviewerId);
      html += '<tr>';
      html += '<td>' + (emp ? emp.name : 'Unknown') + '</td>';
      html += '<td>' + (reviewer ? reviewer.name : 'Unknown') + '</td>';
      html += '<td>' + rev.cycle + '</td>';
      html += '<td>';
      /* BUG-047: Rating stars: Math.floor truncates — shows 3 stars for 3.5 rating */
      var fullStars = Math.floor(rev.rating);
      for (var s = 1; s <= 5; s++) {
        html += '<span class="star' + (s <= fullStars ? ' star-filled' : '') + '">&#9733;</span>';
      }
      html += ' (' + rev.rating + ')';
      html += '</td>';
      html += '<td><span class="badge badge-' + (rev.status === 'completed' ? 'green' : rev.status === 'in-progress' ? 'yellow' : 'blue') + '">' + rev.status + '</span></td>';
      html += '<td>' + rev.date + '</td>';
      html += '<td><button class="btn btn-sm btn-secondary" data-action="nav-to" data-href="#/reviews/' + rev.id + '">View</button></td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';

    return html;
  },


  /* =============== REVIEW FORM =============== */
  reviewForm: function() {
    var employees = Store.employees.getList();

    var html = '';
    html += '<a href="#/reviews" class="back-link">&larr; Back to Reviews</a>';
    html += '<div class="page-header"><h1>New Performance Review</h1></div>';

    /* BUG-051: No labels */
    html += '<div class="form-card">';

    html += '<div class="form-group">';
    html += '<select id="review-employee">';
    html += '<option value="">Select Employee *</option>';
    employees.forEach(function(e) {
      html += '<option value="' + e.id + '">' + e.name + '</option>';
    });
    html += '</select>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<input type="text" id="review-cycle" placeholder="Review Cycle (e.g. Q1 2024) *">';
    html += '</div>';

    /* BUG-062: Rating input is a custom star widget without ARIA (not keyboard accessible) */
    html += '<div class="form-group">';
    html += '<div class="star-rating-input">';
    for (var s = 1; s <= 5; s++) {
      html += '<span class="star star-input" data-action="set-rating" data-value="' + s + '">&#9733;</span>';
    }
    html += '</div>';
    html += '<input type="hidden" id="review-rating" value="">';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<textarea id="review-goals" placeholder="Goals and objectives..." rows="4"></textarea>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<textarea id="review-comments" placeholder="Comments and feedback..." rows="4"></textarea>';
    html += '</div>';

    html += '<div class="form-actions">';
    html += '<button class="btn btn-primary" data-action="create-review">Submit Review</button>';
    html += '<button class="btn btn-secondary" data-action="nav-to" data-href="#/reviews">Cancel</button>';
    html += '</div>';

    html += '</div>';

    return html;
  },


  /* =============== REVIEW DETAIL =============== */
  reviewDetail: function(id) {
    var review = Store.reviews.getById(id);
    if (!review) {
      return '<div class="empty-state"><h3>Review not found</h3><a href="#/reviews" class="back-link">&larr; Back</a></div>';
    }

    var emp = Store.employees.getById(review.employeeId);
    var reviewer = Store.employees.getById(review.reviewerId);

    var html = '';
    html += '<a href="#/reviews" class="back-link">&larr; Back to Reviews</a>';
    html += '<div class="page-header"><h1>Performance Review</h1></div>';

    html += '<div class="detail-grid">';
    html += '<div class="detail-main">';

    html += '<div class="card">';
    html += '<h3>Review Summary</h3>';
    html += '<div class="detail-row"><span class="detail-label">Employee</span><span>' + (emp ? emp.name : 'Unknown') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Reviewer</span><span>' + (reviewer ? reviewer.name : 'Unknown') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Cycle</span><span>' + review.cycle + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Date</span><span>' + review.date + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Status</span><span class="badge badge-' + (review.status === 'completed' ? 'green' : 'yellow') + '">' + review.status + '</span></div>';
    html += '</div>';

    /* Rating display */
    html += '<div class="card">';
    html += '<h3>Rating</h3>';
    html += '<div class="rating-display large">';
    /* BUG-047: Rating display truncates decimals */
    var fullStars = Math.floor(review.rating);
    for (var s = 1; s <= 5; s++) {
      html += '<span class="star' + (s <= fullStars ? ' star-filled' : '') + '">&#9733;</span>';
    }
    html += '<span class="rating-number">' + review.rating + ' / 5</span>';
    html += '</div>';
    html += '</div>';

    /* Goals */
    html += '<div class="card">';
    html += '<h3>Goals & Objectives</h3>';
    html += '<p>' + (review.goals || 'No goals recorded.') + '</p>';
    html += '</div>';

    /* Comments */
    html += '<div class="card">';
    html += '<h3>Comments & Feedback</h3>';
    html += '<p>' + (review.comments || 'No comments.') + '</p>';
    html += '</div>';

    html += '</div>'; /* end detail-main */

    html += '<div class="detail-sidebar">';
    html += '<div class="card">';
    html += '<h3>Actions</h3>';
    if (review.status !== 'completed') {
      html += '<button class="btn btn-primary" data-action="complete-review" data-id="' + review.id + '" style="width:100%;margin-bottom:0.5rem;">Mark Complete</button>';
    }
    html += '<button class="btn btn-secondary" data-action="nav-to" data-href="#/reviews" style="width:100%;">Back to List</button>';
    html += '</div>';
    html += '</div>'; /* end detail-sidebar */

    html += '</div>'; /* end detail-grid */

    return html;
  },


  /* =============== DEPARTMENTS =============== */
  departments: function() {
    var departments = Store.departments.getList();

    var html = '';
    html += '<div class="page-header"><h1>Departments</h1>';
    html += '<button class="btn btn-primary" data-action="nav-to" data-href="#/departments/new">+ Add Department</button></div>';

    html += '<div class="department-grid">';
    departments.forEach(function(dept) {
      var members = Store.employees.getList().filter(function(e) { return e.departmentId === dept.id; });
      var head = Store.employees.getById(dept.headId);

      html += '<div class="card department-card" data-action="nav-to" data-href="#/departments/' + dept.id + '" style="cursor:pointer;">';
      html += '<div class="department-card-header">';
      /* BUG-048: Color dot rendered (CSS makes it disappear on hover) */
      html += '<span class="color-dot" style="background:' + dept.color + '"></span>';
      html += '<h3>' + dept.name + '</h3>';
      html += '</div>';
      html += '<div class="department-card-body">';
      html += '<div class="detail-row"><span class="detail-label">Head</span><span>' + (head ? head.name : 'Unassigned') + '</span></div>';
      html += '<div class="detail-row"><span class="detail-label">Members</span><span>' + members.length + '</span></div>';
      html += '<div class="detail-row"><span class="detail-label">Budget</span><span>$' + (dept.budget || 0).toLocaleString() + '</span></div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';

    if (departments.length === 0) {
      html += '<div class="empty-state"><p>No departments created yet</p></div>';
    }

    return html;
  },


  /* =============== DEPARTMENT DETAIL =============== */
  departmentDetail: function(id) {
    var dept = Store.departments.getById(id);
    /* BUG-040: Invalid id shows infinite spinner */
    if (!dept) {
      return '<div class="loading-spinner"></div>';
    }

    var members = Store.employees.getList().filter(function(e) { return e.departmentId === dept.id; });
    var head = Store.employees.getById(dept.headId);

    var html = '';
    html += '<a href="#/departments" class="back-link">&larr; Back to Departments</a>';

    html += '<div class="page-header">';
    html += '<h1><span class="color-dot" style="background:' + dept.color + '"></span> ' + dept.name + '</h1>';
    html += '</div>';

    html += '<div class="detail-grid">';
    html += '<div class="detail-main">';

    html += '<div class="card">';
    html += '<h3>Department Overview</h3>';
    html += '<div class="detail-row"><span class="detail-label">Department Head</span><span>' + (head ? head.name : 'Unassigned') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Total Members</span><span>' + members.length + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Annual Budget</span><span>$' + (dept.budget || 0).toLocaleString() + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Description</span><span>' + (dept.description || 'No description') + '</span></div>';
    html += '</div>';

    /* Members table */
    html += '<div class="card">';
    html += '<h3>Team Members (' + members.length + ')</h3>';
    if (members.length === 0) {
      html += '<p class="empty-state">No members in this department</p>';
    } else {
      html += '<table class="data-table">';
      html += '<thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Status</th><th></th></tr></thead>';
      html += '<tbody>';
      members.forEach(function(m) {
        html += '<tr>';
        html += '<td><a href="#/employees/' + m.id + '" class="link">' + m.name + '</a></td>';
        html += '<td>' + m.role + '</td>';
        html += '<td>' + m.email + '</td>';
        html += '<td><span class="badge badge-' + (m.status === 'active' ? 'green' : 'red') + '">' + m.status + '</span></td>';
        html += '<td><button class="btn btn-sm btn-secondary" data-action="nav-to" data-href="#/employees/' + m.id + '">View</button></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';

    html += '</div>'; /* end detail-main */

    html += '<div class="detail-sidebar">';
    html += '<div class="card">';
    html += '<h3>Budget Breakdown</h3>';
    var totalSalary = members.reduce(function(sum, m) { return sum + (m.salary || 0); }, 0);
    var budgetUsed = dept.budget > 0 ? Math.round((totalSalary / dept.budget) * 100) : 0;
    html += '<div class="detail-row"><span class="detail-label">Total Salaries</span><span>$' + totalSalary.toLocaleString() + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Budget</span><span>$' + (dept.budget || 0).toLocaleString() + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Utilization</span><span>' + budgetUsed + '%</span></div>';
    html += '<div class="progress-bar"><div class="progress-fill" style="width:' + Math.min(budgetUsed, 100) + '%;background:' + (budgetUsed > 90 ? '#ef4444' : budgetUsed > 70 ? '#f59e0b' : '#10b981') + '"></div></div>';
    html += '</div>';

    html += '<div class="card">';
    html += '<h3>Open Positions</h3>';
    var deptJobs = Store.jobs.getList().filter(function(j) { return j.departmentId === dept.id && j.status === 'open'; });
    if (deptJobs.length === 0) {
      html += '<p class="empty-state">No open positions</p>';
    } else {
      deptJobs.forEach(function(j) {
        html += '<div class="list-row" data-action="nav-to" data-href="#/jobs/' + j.id + '" style="cursor:pointer;">';
        html += '<strong>' + j.title + '</strong>';
        html += '<span class="text-muted">' + j.location + ' &middot; ' + j.type + '</span>';
        html += '</div>';
      });
    }
    html += '</div>';

    html += '<div class="card">';
    html += '<h3>Actions</h3>';
    html += '<button class="btn btn-secondary" data-action="nav-to" data-href="#/departments" style="width:100%;">Back to Departments</button>';
    html += '</div>';
    html += '</div>'; /* end detail-sidebar */

    html += '</div>'; /* end detail-grid */

    return html;
  },


  /* =============== ONBOARDING =============== */
  onboarding: function() {
    var checklists = Store.onboarding.getList();

    var html = '';
    html += '<div class="page-header"><h1>Onboarding Checklists</h1></div>';

    if (checklists.length === 0) {
      html += '<div class="empty-state"><p>No onboarding checklists</p></div>';
      return html;
    }

    /* Summary stats */
    var totalChecklists = checklists.length;
    var completedChecklists = checklists.filter(function(cl) {
      return cl.items.every(function(item) { return item.completed; });
    }).length;
    var inProgressChecklists = totalChecklists - completedChecklists;

    html += '<div class="stats-bar">';
    html += '<div class="stat-card"><div class="stat-number">' + totalChecklists + '</div><div class="stat-label">Total Checklists</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + completedChecklists + '</div><div class="stat-label">Completed</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + inProgressChecklists + '</div><div class="stat-label">In Progress</div></div>';
    html += '</div>';

    html += '<div class="onboarding-grid">';
    checklists.forEach(function(checklist) {
      var emp = Store.employees.getById(checklist.employeeId);
      var totalItems = checklist.items.length;
      var completedItems = checklist.items.filter(function(item) { return item.completed; }).length;
      var progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      html += '<div class="card onboarding-card">';
      html += '<div class="onboarding-card-header">';
      html += '<h3>' + (emp ? emp.name : 'Unknown Employee') + '</h3>';
      html += '<span class="badge badge-' + (progress === 100 ? 'green' : progress > 50 ? 'yellow' : 'blue') + '">' + progress + '%</span>';
      html += '</div>';
      if (emp) {
        html += '<p class="text-muted">' + emp.role + ' &middot; Started ' + (emp.startDate || 'N/A') + '</p>';
      }

      /* Progress bar */
      html += '<div class="progress-bar"><div class="progress-fill" style="width:' + progress + '%"></div></div>';
      html += '<p class="progress-text">' + completedItems + ' of ' + totalItems + ' tasks complete</p>';

      /* Checklist items */
      html += '<div class="checklist">';
      checklist.items.forEach(function(item, idx) {
        html += '<div class="checklist-item">';
        /* BUG-060: Checkbox icons not aria-hidden */
        html += '<span class="check-icon" data-action="toggle-onboarding-item" data-checklist="' + checklist.id + '" data-item="' + idx + '">';
        html += item.completed ? '&#9745;' : '&#9744;';
        html += '</span>';
        html += '<span class="checklist-label' + (item.completed ? ' completed' : '') + '">' + item.title + '</span>';
        html += '</div>';
      });
      html += '</div>';

      html += '</div>';
    });
    html += '</div>';

    return html;
  },


  /* =============== TRAINING =============== */
  training: function() {
    var courses = Store.training.getList();

    var html = '';
    html += '<div class="page-header"><h1>Training Courses</h1></div>';

    /* Summary stats */
    var totalCourses = courses.length;
    var openCourses = courses.filter(function(c) { return c.status === 'open'; }).length;
    var fullCourses = courses.filter(function(c) { return c.status === 'full'; }).length;
    var totalEnrolled = courses.reduce(function(sum, c) { return sum + c.enrolled; }, 0);

    html += '<div class="stats-bar">';
    html += '<div class="stat-card"><div class="stat-number">' + totalCourses + '</div><div class="stat-label">Total Courses</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + openCourses + '</div><div class="stat-label">Open</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + fullCourses + '</div><div class="stat-label">Full</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + totalEnrolled + '</div><div class="stat-label">Total Enrolled</div></div>';
    html += '</div>';

    if (courses.length === 0) {
      html += '<div class="empty-state"><p>No training courses available</p></div>';
      return html;
    }

    html += '<div class="training-grid">';
    courses.forEach(function(course) {
      var spotsLeft = course.capacity - course.enrolled;

      html += '<div class="card training-card">';
      /* BUG-052: Course images missing alt */
      html += '<img src="' + (course.imageUrl || 'https://via.placeholder.com/300x150') + '" class="training-card-img">';
      html += '<div class="training-card-body">';
      html += '<h3><a href="#/training/' + course.id + '" class="link">' + course.title + '</a></h3>';
      html += '<p class="training-category">' + course.category + '</p>';
      html += '<div class="detail-row"><span class="detail-label">Instructor</span><span>' + course.instructor + '</span></div>';
      html += '<div class="detail-row"><span class="detail-label">Capacity</span><span>' + course.enrolled + '/' + course.capacity + '</span></div>';
      html += '<div class="detail-row"><span class="detail-label">Status</span><span class="badge badge-' + (course.status === 'open' ? 'green' : course.status === 'full' ? 'red' : 'yellow') + '">' + course.status + '</span></div>';
      html += '<div class="training-card-actions">';
      if (course.status === 'open' && spotsLeft > 0) {
        html += '<button class="btn btn-primary btn-sm" data-action="enroll-course" data-id="' + course.id + '">Enroll</button>';
      } else if (course.status === 'full' || spotsLeft <= 0) {
        html += '<button class="btn btn-secondary btn-sm" data-action="unenroll-course" data-id="' + course.id + '">Unenroll</button>';
      }
      html += '<button class="btn btn-sm btn-secondary" data-action="nav-to" data-href="#/training/' + course.id + '">Details</button>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';

    return html;
  },


  /* =============== TRAINING DETAIL =============== */
  trainingDetail: function(id) {
    var course = Store.training.getById(id);
    if (!course) {
      return '<div class="empty-state"><h3>Course not found</h3><a href="#/training" class="back-link">&larr; Back</a></div>';
    }

    var enrolledEmployees = [];
    if (course.enrolledIds) {
      course.enrolledIds.forEach(function(empId) {
        var emp = Store.employees.getById(empId);
        if (emp) enrolledEmployees.push(emp);
      });
    }

    var html = '';
    html += '<a href="#/training" class="back-link">&larr; Back to Training</a>';

    html += '<div class="page-header"><h1>' + course.title + '</h1></div>';

    html += '<div class="detail-grid">';
    html += '<div class="detail-main">';

    html += '<div class="card">';
    html += '<h3>Course Information</h3>';
    html += '<p>' + (course.description || 'No description available.') + '</p>';
    html += '</div>';

    html += '<div class="card">';
    html += '<h3>Details</h3>';
    html += '<div class="detail-row"><span class="detail-label">Category</span><span>' + course.category + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Instructor</span><span>' + course.instructor + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Duration</span><span>' + (course.duration || 'TBD') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Start Date</span><span>' + (course.startDate || 'TBD') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Capacity</span><span>' + course.enrolled + ' / ' + course.capacity + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Status</span><span class="badge badge-' + (course.status === 'open' ? 'green' : 'red') + '">' + course.status + '</span></div>';
    html += '</div>';

    /* Enrolled employees */
    html += '<div class="card">';
    html += '<h3>Enrolled Employees (' + enrolledEmployees.length + ')</h3>';
    if (enrolledEmployees.length === 0) {
      html += '<p class="empty-state">No employees enrolled yet</p>';
    } else {
      html += '<table class="data-table">';
      html += '<thead><tr><th>Name</th><th>Role</th><th>Department</th></tr></thead>';
      html += '<tbody>';
      enrolledEmployees.forEach(function(emp) {
        var dept = Store.departments.getById(emp.departmentId);
        html += '<tr>';
        html += '<td><a href="#/employees/' + emp.id + '" class="link">' + emp.name + '</a></td>';
        html += '<td>' + emp.role + '</td>';
        html += '<td>' + (dept ? dept.name : 'Unknown') + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';

    html += '</div>'; /* end detail-main */

    html += '<div class="detail-sidebar">';
    html += '<div class="card">';
    html += '<h3>Actions</h3>';
    var spotsLeft = course.capacity - course.enrolled;
    if (course.status === 'open' && spotsLeft > 0) {
      html += '<button class="btn btn-primary" data-action="enroll-course" data-id="' + course.id + '" style="width:100%;margin-bottom:0.5rem;">Enroll</button>';
    }
    html += '<button class="btn btn-secondary" data-action="nav-to" data-href="#/training" style="width:100%;">Back to Courses</button>';
    html += '</div>';
    html += '</div>'; /* end detail-sidebar */

    html += '</div>'; /* end detail-grid */

    return html;
  },


  /* =============== PAYROLL =============== */
  payroll: function() {
    var payrollRecords = Store.payroll.getList();

    var html = '';
    html += '<div class="page-header"><h1>Payroll</h1></div>';

    /* Payroll summary stats */
    var totalBase = payrollRecords.reduce(function(sum, r) { return sum + r.baseSalary; }, 0);
    var totalBonuses = payrollRecords.reduce(function(sum, r) { return sum + r.bonus; }, 0);
    var totalDeductions = payrollRecords.reduce(function(sum, r) { return sum + r.deductions; }, 0);
    var totalNet = totalBase + totalBonuses - totalDeductions;

    html += '<div class="stats-bar">';
    html += '<div class="stat-card"><div class="stat-number">$' + totalBase.toLocaleString() + '</div><div class="stat-label">Total Base</div></div>';
    html += '<div class="stat-card"><div class="stat-number">$' + totalBonuses.toLocaleString() + '</div><div class="stat-label">Total Bonuses</div></div>';
    html += '<div class="stat-card"><div class="stat-number">$' + totalDeductions.toLocaleString() + '</div><div class="stat-label">Total Deductions</div></div>';
    html += '<div class="stat-card"><div class="stat-number">$' + totalNet.toLocaleString() + '</div><div class="stat-label">Total Net Pay</div></div>';
    html += '</div>';

    /* BUG-058: No th scope */
    /* BUG-046: Table header class for sticky header (CSS misaligns columns) */
    html += '<div class="card">';
    html += '<h3>Payroll Records</h3>';
    html += '<table class="data-table sticky-header">';
    html += '<thead><tr>';
    html += '<th>Employee</th><th>Base Salary</th><th>Bonus</th><th>Deductions</th><th>Net Pay</th><th>Period</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    if (payrollRecords.length === 0) {
      html += '<tr><td colspan="6" class="empty-state">No payroll records</td></tr>';
    }

    payrollRecords.forEach(function(record) {
      var emp = Store.employees.getById(record.employeeId);
      var netPay = record.baseSalary + record.bonus - record.deductions;

      html += '<tr>';
      html += '<td>' + (emp ? emp.name : 'Unknown') + '</td>';
      html += '<td>$' + record.baseSalary.toLocaleString() + '</td>';
      html += '<td>$' + record.bonus.toLocaleString() + '</td>';
      html += '<td>$' + record.deductions.toLocaleString() + '</td>';
      html += '<td><strong>$' + netPay.toLocaleString() + '</strong></td>';
      html += '<td>' + record.period + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';

    /* Department payroll breakdown */
    html += '<div class="card">';
    html += '<h3>Department Breakdown</h3>';
    var departments = Store.departments.getList();
    html += '<table class="data-table">';
    html += '<thead><tr><th>Department</th><th>Employees</th><th>Total Base</th><th>Total Bonuses</th><th>Total Net</th></tr></thead>';
    html += '<tbody>';
    departments.forEach(function(dept) {
      var deptRecords = payrollRecords.filter(function(r) {
        var emp = Store.employees.getById(r.employeeId);
        return emp && emp.departmentId === dept.id;
      });
      var deptBase = deptRecords.reduce(function(s, r) { return s + r.baseSalary; }, 0);
      var deptBonus = deptRecords.reduce(function(s, r) { return s + r.bonus; }, 0);
      var deptDeduct = deptRecords.reduce(function(s, r) { return s + r.deductions; }, 0);
      var deptNet = deptBase + deptBonus - deptDeduct;
      html += '<tr>';
      html += '<td>' + dept.name + '</td>';
      html += '<td>' + deptRecords.length + '</td>';
      html += '<td>$' + deptBase.toLocaleString() + '</td>';
      html += '<td>$' + deptBonus.toLocaleString() + '</td>';
      html += '<td><strong>$' + deptNet.toLocaleString() + '</strong></td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    html += '</div>';

    return html;
  },


  /* =============== DOCUMENTS =============== */
  documents: function() {
    var docs = Store.documents.getList();
    var filterCategory = App.filterDocCategory || 'all';

    /* Apply category filter */
    var filtered = docs;
    if (filterCategory !== 'all') {
      filtered = docs.filter(function(d) { return d.category === filterCategory; });
    }

    /* Get unique categories */
    var categories = [];
    docs.forEach(function(d) {
      if (categories.indexOf(d.category) === -1) categories.push(d.category);
    });

    var html = '';
    html += '<div class="page-header"><h1>Documents</h1></div>';

    /* Stats */
    html += '<div class="stats-bar">';
    html += '<div class="stat-card"><div class="stat-number">' + docs.length + '</div><div class="stat-label">Total Documents</div></div>';
    categories.forEach(function(cat) {
      var count = docs.filter(function(d) { return d.category === cat; }).length;
      html += '<div class="stat-card mini"><div class="stat-number">' + count + '</div><div class="stat-label">' + cat + '</div></div>';
    });
    html += '</div>';

    /* Category filter */
    html += '<div class="filter-bar">';
    html += '<select id="filter-doc-category" class="filter-select">';
    html += '<option value="all"' + (filterCategory === 'all' ? ' selected' : '') + '>All Categories</option>';
    categories.forEach(function(cat) {
      html += '<option value="' + cat + '"' + (filterCategory === cat ? ' selected' : '') + '>' + cat + '</option>';
    });
    html += '</select>';
    html += '<button class="btn btn-primary btn-sm" data-action="filter-documents">Filter</button>';
    html += '</div>';

    /* BUG-089: Adds event listener inline (listener added each render) */
    html += '<div class="upload-zone" ondrop="handleDrop(event)" ondragover="event.preventDefault()">';
    html += '<div class="upload-icon">&#128193;</div>';
    html += '<p>Drag & drop files here or <button class="btn btn-primary btn-sm" data-action="upload-document">Browse Files</button></p>';
    html += '</div>';

    html += '<div class="card">';
    html += '<table class="data-table">';
    html += '<thead><tr>';
    html += '<th>Name</th><th>Type</th><th>Size</th><th>Uploaded By</th><th>Date</th><th>Category</th><th>Actions</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    if (filtered.length === 0) {
      html += '<tr><td colspan="7" class="empty-state">No documents found</td></tr>';
    }

    filtered.forEach(function(doc) {
      html += '<tr>';
      html += '<td>' + doc.name + '</td>';
      html += '<td>' + doc.type + '</td>';
      html += '<td>' + doc.size + '</td>';
      html += '<td>' + doc.uploadedBy + '</td>';
      html += '<td>' + doc.date + '</td>';
      html += '<td><span class="badge badge-blue">' + doc.category + '</span></td>';
      html += '<td>';
      html += '<button class="btn btn-sm btn-secondary" data-action="download-doc" data-id="' + doc.id + '">Download</button> ';
      html += '<button class="btn btn-sm btn-danger" data-action="delete-doc" data-id="' + doc.id + '">Delete</button>';
      html += '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';

    return html;
  },


  /* =============== REPORTS =============== */
  reports: function() {
    var departments = Store.departments.getList();

    var html = '';
    html += '<div class="page-header"><h1>Reports</h1></div>';

    /* BUG-049: Breadcrumb shows raw hash */
    html += '<div class="breadcrumb">' + window.location.hash + '</div>';

    /* Filters */
    html += '<div class="filter-bar">';
    html += '<div class="form-group">';
    html += '<input type="date" id="report-date-from" placeholder="From Date">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="date" id="report-date-to" placeholder="To Date">';
    html += '</div>';
    html += '<select id="report-department" class="filter-select">';
    html += '<option value="all">All Departments</option>';
    departments.forEach(function(d) {
      html += '<option value="' + d.id + '">' + d.name + '</option>';
    });
    html += '</select>';
    html += '<button class="btn btn-primary btn-sm" data-action="generate-report">Generate</button>';
    html += '<button class="btn btn-secondary btn-sm" data-action="export-report">Export CSV</button>';
    html += '</div>';

    /* BUG-063: Chart data only visual (colored divs), no text alternative or aria description */
    html += '<div class="card">';
    html += '<h3>Headcount by Department</h3>';
    html += '<div class="chart-container">';
    var chartColors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
    departments.forEach(function(dept, idx) {
      var members = Store.employees.getList().filter(function(e) { return e.departmentId === dept.id; });
      var count = members.length;
      var maxCount = 20;
      var heightPct = Math.min(count / maxCount * 100, 100);
      /* BUG-044: Chart tooltip with [object Object] */
      html += '<div class="chart-bar" style="height:' + heightPct + '%;background:' + chartColors[idx % chartColors.length] + '" title="' + ({ label: dept.name, value: count }) + '"></div>';
    });
    html += '</div>';
    html += '</div>';

    /* Summary cards */
    html += '<div class="stats-bar">';
    var employees = Store.employees.getList();
    var activeCount = employees.filter(function(e) { return e.status === 'active'; }).length;
    var onLeaveCount = employees.filter(function(e) { return e.status === 'on-leave'; }).length;
    html += '<div class="stat-card"><div class="stat-number">' + employees.length + '</div><div class="stat-label">Total Employees</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + activeCount + '</div><div class="stat-label">Active</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + onLeaveCount + '</div><div class="stat-label">On Leave</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + departments.length + '</div><div class="stat-label">Departments</div></div>';
    html += '</div>';

    /* Turnover table */
    html += '<div class="card">';
    html += '<h3>Department Summary</h3>';
    html += '<table class="data-table">';
    html += '<thead><tr><th>Department</th><th>Headcount</th><th>Budget</th><th>Avg Salary</th></tr></thead>';
    html += '<tbody>';
    departments.forEach(function(dept) {
      var members = Store.employees.getList().filter(function(e) { return e.departmentId === dept.id; });
      var totalSalary = members.reduce(function(sum, e) { return sum + (e.salary || 0); }, 0);
      var avgSalary = members.length > 0 ? Math.round(totalSalary / members.length) : 0;
      html += '<tr>';
      html += '<td>' + dept.name + '</td>';
      html += '<td>' + members.length + '</td>';
      html += '<td>$' + (dept.budget || 0).toLocaleString() + '</td>';
      html += '<td>$' + avgSalary.toLocaleString() + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    html += '</div>';

    /* Hiring report */
    html += '<div class="card">';
    html += '<h3>Hiring Pipeline Report</h3>';
    var jobs = Store.jobs.getList();
    var candidates = Store.candidates.getList();
    var openCount = jobs.filter(function(j) { return j.status === 'open'; }).length;
    var closedCount = jobs.filter(function(j) { return j.status === 'closed'; }).length;
    var totalApplicants = candidates.length;
    var hiredCount = candidates.filter(function(c) { return c.status === 'hired'; }).length;
    var rejectedCount = candidates.filter(function(c) { return c.status === 'rejected'; }).length;
    var interviewCount = candidates.filter(function(c) { return c.status === 'interview'; }).length;

    html += '<div class="stats-bar">';
    html += '<div class="stat-card mini"><div class="stat-number">' + openCount + '</div><div class="stat-label">Open Positions</div></div>';
    html += '<div class="stat-card mini"><div class="stat-number">' + closedCount + '</div><div class="stat-label">Closed Positions</div></div>';
    html += '<div class="stat-card mini"><div class="stat-number">' + totalApplicants + '</div><div class="stat-label">Total Applicants</div></div>';
    html += '<div class="stat-card mini"><div class="stat-number">' + interviewCount + '</div><div class="stat-label">In Interview</div></div>';
    html += '<div class="stat-card mini"><div class="stat-number">' + hiredCount + '</div><div class="stat-label">Hired</div></div>';
    html += '<div class="stat-card mini"><div class="stat-number">' + rejectedCount + '</div><div class="stat-label">Rejected</div></div>';
    html += '</div>';
    html += '</div>';

    /* Time off report */
    html += '<div class="card">';
    html += '<h3>Time Off Summary</h3>';
    var timeoffRequests = Store.timeoff.getList();
    var approvedCount = timeoffRequests.filter(function(t) { return t.status === 'approved'; }).length;
    var pendingCount = timeoffRequests.filter(function(t) { return t.status === 'pending'; }).length;
    var deniedCount = timeoffRequests.filter(function(t) { return t.status === 'rejected'; }).length;
    var totalDays = timeoffRequests.filter(function(t) { return t.status === 'approved'; }).reduce(function(sum, t) { return sum + t.days; }, 0);

    html += '<table class="data-table">';
    html += '<thead><tr><th>Metric</th><th>Value</th></tr></thead>';
    html += '<tbody>';
    html += '<tr><td>Total Requests</td><td>' + timeoffRequests.length + '</td></tr>';
    html += '<tr><td>Approved</td><td><span class="badge badge-green">' + approvedCount + '</span></td></tr>';
    html += '<tr><td>Pending</td><td><span class="badge badge-yellow">' + pendingCount + '</span></td></tr>';
    html += '<tr><td>Denied</td><td><span class="badge badge-red">' + deniedCount + '</span></td></tr>';
    html += '<tr><td>Total Days Approved</td><td>' + totalDays + ' days</td></tr>';
    html += '</tbody></table>';
    html += '</div>';

    /* Payroll summary */
    html += '<div class="card">';
    html += '<h3>Payroll Overview</h3>';
    var payroll = Store.payroll.getList();
    var totalBaseSalary = payroll.reduce(function(sum, p) { return sum + p.baseSalary; }, 0);
    var totalBonuses = payroll.reduce(function(sum, p) { return sum + p.bonus; }, 0);
    var totalDeductions = payroll.reduce(function(sum, p) { return sum + p.deductions; }, 0);
    var totalNetPay = totalBaseSalary + totalBonuses - totalDeductions;

    html += '<div class="stats-bar">';
    html += '<div class="stat-card mini"><div class="stat-number">$' + totalBaseSalary.toLocaleString() + '</div><div class="stat-label">Total Base Salary</div></div>';
    html += '<div class="stat-card mini"><div class="stat-number">$' + totalBonuses.toLocaleString() + '</div><div class="stat-label">Total Bonuses</div></div>';
    html += '<div class="stat-card mini"><div class="stat-number">$' + totalDeductions.toLocaleString() + '</div><div class="stat-label">Total Deductions</div></div>';
    html += '<div class="stat-card mini"><div class="stat-number">$' + totalNetPay.toLocaleString() + '</div><div class="stat-label">Total Net Pay</div></div>';
    html += '</div>';
    html += '</div>';

    return html;
  },


  /* =============== CALENDAR =============== */
  calendar: function() {
    var now = new Date();
    var year = App.calendarYear || now.getFullYear();
    var month = App.calendarMonth || now.getMonth();
    var events = Store.calendar.getList();

    /* BUG-049: Breadcrumb shows raw hash */
    var html = '';
    html += '<div class="breadcrumb">' + window.location.hash + '</div>';

    html += '<div class="page-header"><h1>Calendar</h1></div>';

    /* BUG-061: Focus order wrong — navigation buttons placed after the grid in DOM but visually appear above it */
    /* Calendar grid first, then nav buttons (visual order reversed via CSS) */
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    html += '<div class="calendar-wrapper">';

    /* Calendar grid */
    html += '<div class="calendar-grid">';

    /* Header */
    html += '<div class="calendar-header">';
    html += '<h2>' + monthNames[month] + ' ' + year + '</h2>';
    html += '</div>';

    /* Day headers */
    html += '<div class="calendar-days-header">';
    dayNames.forEach(function(day) {
      html += '<div class="calendar-day-name">' + day + '</div>';
    });
    html += '</div>';

    /* Days */
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    html += '<div class="calendar-days">';

    /* Empty cells for days before the 1st */
    for (var i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    /* Day cells */
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var dayEvents = events.filter(function(ev) { return ev.date === dateStr; });
      var isToday = (d === now.getDate() && month === now.getMonth() && year === now.getFullYear());

      html += '<div class="calendar-day' + (isToday ? ' today' : '') + '">';
      html += '<span class="day-number">' + d + '</span>';
      dayEvents.forEach(function(ev) {
        html += '<div class="calendar-event badge badge-' + (ev.type === 'meeting' ? 'blue' : ev.type === 'timeoff' ? 'yellow' : 'green') + '">' + ev.title + '</div>';
      });
      html += '</div>';
    }

    html += '</div>'; /* end calendar-days */
    html += '</div>'; /* end calendar-grid */

    /* Navigation buttons — placed after grid in DOM (BUG-061) */
    html += '<div class="calendar-nav">';
    html += '<button class="btn btn-secondary" data-action="calendar-prev">&larr; Previous</button>';
    html += '<button class="btn btn-secondary" data-action="calendar-next">Next &rarr;</button>';
    html += '</div>';

    html += '</div>'; /* end calendar-wrapper */

    /* Upcoming events list */
    html += '<div class="card" style="margin-top:2rem;">';
    html += '<h3>Upcoming Events This Month</h3>';
    var monthEvents = events.filter(function(ev) {
      var evDate = new Date(ev.date);
      return evDate.getMonth() === month && evDate.getFullYear() === year;
    });
    monthEvents.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });

    if (monthEvents.length === 0) {
      html += '<p class="empty-state">No events this month</p>';
    } else {
      html += '<table class="data-table">';
      html += '<thead><tr><th>Date</th><th>Event</th><th>Type</th></tr></thead>';
      html += '<tbody>';
      monthEvents.forEach(function(ev) {
        html += '<tr>';
        html += '<td>' + ev.date + '</td>';
        html += '<td>' + ev.title + '</td>';
        html += '<td><span class="badge badge-' + (ev.type === 'meeting' ? 'blue' : ev.type === 'timeoff' ? 'yellow' : 'green') + '">' + ev.type + '</span></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';

    /* Time off events for this month */
    html += '<div class="card" style="margin-top:1rem;">';
    html += '<h3>Time Off This Month</h3>';
    var timeoffThisMonth = Store.timeoff.getList().filter(function(t) {
      if (t.status !== 'approved') return false;
      var start = new Date(t.startDate);
      var end = new Date(t.endDate);
      var monthStart = new Date(year, month, 1);
      var monthEnd = new Date(year, month + 1, 0);
      return start <= monthEnd && end >= monthStart;
    });

    if (timeoffThisMonth.length === 0) {
      html += '<p class="empty-state">No time off scheduled</p>';
    } else {
      timeoffThisMonth.forEach(function(t) {
        var emp = Store.employees.getById(t.employeeId);
        html += '<div class="list-row">';
        html += '<div class="list-row-main">';
        html += '<strong>' + (emp ? emp.name : 'Unknown') + '</strong>';
        html += '<span class="text-muted"> &mdash; ' + t.type + '</span>';
        html += '</div>';
        html += '<div class="list-row-meta">';
        html += '<span>' + t.startDate + ' to ' + t.endDate + '</span>';
        html += '<span class="badge badge-yellow">' + t.days + ' days</span>';
        html += '</div>';
        html += '</div>';
      });
    }
    html += '</div>';

    return html;
  },


  /* =============== SETTINGS =============== */
  settings: function() {
    var activeTab = App.settingsTab || 'general';

    var html = '';
    html += '<div class="page-header"><h1>Settings</h1></div>';

    /* BUG-061: Tab order illogical — Security tab gets focus before General */
    /* BUG-055: Custom tab widget not keyboard navigable (no arrow key support in HTML) */
    html += '<div class="tabs">';
    html += '<button class="tab' + (activeTab === 'security' ? ' active' : '') + '" data-action="switch-settings-tab" data-tab="security">Security</button>';
    html += '<button class="tab' + (activeTab === 'general' ? ' active' : '') + '" data-action="switch-settings-tab" data-tab="general">General</button>';
    html += '<button class="tab' + (activeTab === 'notifications' ? ' active' : '') + '" data-action="switch-settings-tab" data-tab="notifications">Notifications</button>';
    html += '<button class="tab' + (activeTab === 'integrations' ? ' active' : '') + '" data-action="switch-settings-tab" data-tab="integrations">Integrations</button>';
    html += '</div>';

    html += '<div class="tab-content">';

    if (activeTab === 'general') {
      html += '<div class="card">';
      html += '<h3>Company Information</h3>';
      html += '<div class="form-group">';
      html += '<input type="text" id="setting-company-name" placeholder="Company Name" value="TalentFlow Inc.">';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<input type="text" id="setting-company-website" placeholder="Company Website" value="https://talentflow.example.com">';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<input type="text" id="setting-company-address" placeholder="Company Address" value="123 HR Street, San Francisco, CA 94105">';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<input type="tel" id="setting-company-phone" placeholder="Company Phone" value="+1 (555) 123-4567">';
      html += '</div>';
      html += '<button class="btn btn-primary" data-action="save-company-info">Save Company Info</button>';
      html += '</div>';

      html += '<div class="card" style="margin-top:1rem;">';
      html += '<h3>Regional Settings</h3>';
      html += '<div class="form-group">';
      html += '<select id="setting-timezone">';
      html += '<option value="utc">UTC</option>';
      html += '<option value="est" selected>Eastern Time (EST)</option>';
      html += '<option value="pst">Pacific Time (PST)</option>';
      html += '<option value="cet">Central European (CET)</option>';
      html += '<option value="gmt">Greenwich Mean Time (GMT)</option>';
      html += '<option value="jst">Japan Standard Time (JST)</option>';
      html += '</select>';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<select id="setting-date-format">';
      html += '<option value="mm/dd/yyyy" selected>MM/DD/YYYY</option>';
      html += '<option value="dd/mm/yyyy">DD/MM/YYYY</option>';
      html += '<option value="yyyy-mm-dd">YYYY-MM-DD</option>';
      html += '</select>';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<select id="setting-language">';
      html += '<option value="en" selected>English</option>';
      html += '<option value="es">Spanish</option>';
      html += '<option value="fr">French</option>';
      html += '<option value="de">German</option>';
      html += '<option value="nl">Dutch</option>';
      html += '</select>';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<select id="setting-currency">';
      html += '<option value="usd" selected>USD ($)</option>';
      html += '<option value="eur">EUR (&euro;)</option>';
      html += '<option value="gbp">GBP (&pound;)</option>';
      html += '</select>';
      html += '</div>';
      html += '<button class="btn btn-primary" data-action="save-general-settings">Save Regional Settings</button>';
      html += '</div>';

      html += '<div class="card" style="margin-top:1rem;">';
      html += '<h3>Time Off Policy</h3>';
      html += '<div class="form-row">';
      html += '<div class="form-group">';
      html += '<input type="number" id="setting-vacation-days" placeholder="Annual Vacation Days" value="20">';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<input type="number" id="setting-sick-days" placeholder="Annual Sick Days" value="10">';
      html += '</div>';
      html += '</div>';
      html += '<div class="form-row">';
      html += '<div class="form-group">';
      html += '<input type="number" id="setting-personal-days" placeholder="Personal Days" value="5">';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<select id="setting-fiscal-year-start">';
      html += '<option value="january" selected>January</option>';
      html += '<option value="april">April</option>';
      html += '<option value="july">July</option>';
      html += '<option value="october">October</option>';
      html += '</select>';
      html += '</div>';
      html += '</div>';
      html += '<button class="btn btn-primary" data-action="save-timeoff-policy">Save Policy</button>';
      html += '</div>';
    }

    if (activeTab === 'notifications') {
      html += '<div class="card">';
      html += '<h3>Notification Preferences</h3>';
      html += '<div class="form-group">';
      html += '<label class="checkbox-label"><input type="checkbox" id="notif-email" checked> Email notifications</label>';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<label class="checkbox-label"><input type="checkbox" id="notif-push"> Push notifications</label>';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<label class="checkbox-label"><input type="checkbox" id="notif-timeoff" checked> Time off request updates</label>';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<label class="checkbox-label"><input type="checkbox" id="notif-reviews" checked> Performance review reminders</label>';
      html += '</div>';
      html += '<button class="btn btn-primary" data-action="save-notification-settings">Save Preferences</button>';
      html += '</div>';
    }

    if (activeTab === 'security') {
      html += '<div class="card">';
      html += '<h3>Security Settings</h3>';
      /* BUG-059: Error messages have no aria-live region */
      html += '<div id="security-error" class="error-message"></div>';
      html += '<div class="form-group">';
      html += '<input type="password" id="current-password" placeholder="Current Password">';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<input type="password" id="new-password" placeholder="New Password">';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<input type="password" id="confirm-password" placeholder="Confirm New Password">';
      html += '</div>';
      html += '<button class="btn btn-primary" data-action="change-password">Update Password</button>';
      html += '</div>';

      html += '<div class="card" style="margin-top:1rem;">';
      html += '<h3>Two-Factor Authentication</h3>';
      html += '<p>Add an extra layer of security to your account.</p>';
      html += '<button class="btn btn-secondary" data-action="enable-2fa">Enable 2FA</button>';
      html += '</div>';

      html += '<div class="card" style="margin-top:1rem;">';
      html += '<h3>Session Management</h3>';
      html += '<p>You are currently signed in from 1 device.</p>';
      html += '<table class="data-table">';
      html += '<thead><tr><th>Device</th><th>IP Address</th><th>Last Active</th><th></th></tr></thead>';
      html += '<tbody>';
      html += '<tr>';
      html += '<td>Chrome on Windows</td>';
      html += '<td>192.168.1.100</td>';
      html += '<td>Just now</td>';
      html += '<td><span class="badge badge-green">Current</span></td>';
      html += '</tr>';
      html += '</tbody></table>';
      html += '<button class="btn btn-danger btn-sm" data-action="revoke-all-sessions" style="margin-top:0.5rem;">Revoke All Other Sessions</button>';
      html += '</div>';

      html += '<div class="card" style="margin-top:1rem;">';
      html += '<h3>Danger Zone</h3>';
      html += '<p class="text-muted">Permanently delete your account and all associated data. This action cannot be undone.</p>';
      html += '<button class="btn btn-danger" data-action="delete-account">Delete Account</button>';
      html += '</div>';
    }

    if (activeTab === 'integrations') {
      html += '<div class="card">';
      html += '<h3>Integrations</h3>';

      var integrations = [
        { name: 'Slack', description: 'Get HR notifications in Slack', connected: false },
        { name: 'Google Calendar', description: 'Sync time off with calendar', connected: true },
        { name: 'Jira', description: 'Link tasks to onboarding', connected: false },
        { name: 'BambooHR', description: 'Import employee data', connected: false }
      ];

      integrations.forEach(function(integ) {
        html += '<div class="integration-row">';
        html += '<div class="integration-info">';
        html += '<h4>' + integ.name + '</h4>';
        html += '<p>' + integ.description + '</p>';
        html += '</div>';
        html += '<button class="btn btn-sm ' + (integ.connected ? 'btn-danger' : 'btn-primary') + '" data-action="toggle-integration" data-name="' + integ.name + '">' + (integ.connected ? 'Disconnect' : 'Connect') + '</button>';
        html += '</div>';
      });

      html += '</div>';
    }

    html += '</div>'; /* end tab-content */

    return html;
  },


  /* =============== PROFILE =============== */
  profile: function() {
    var user = Store.auth.user;
    if (!user) {
      return '<div class="empty-state"><h3>Please log in to view your profile</h3></div>';
    }

    var html = '';
    html += '<div class="page-header"><h1>My Profile</h1></div>';

    html += '<div class="detail-grid">';
    html += '<div class="detail-main">';

    html += '<div class="card profile-card">';
    html += '<div class="avatar-large" style="background:' + (user.color || '#6366f1') + '">' + (user.avatar || 'U') + '</div>';
    html += '<div class="profile-info">';
    html += '<h2>' + user.name + '</h2>';
    html += '<p class="profile-subtitle">' + user.email + '</p>';
    html += '<p>' + (user.role || 'Employee') + '</p>';
    html += '</div>';
    html += '</div>';

    /* Edit profile form */
    html += '<div class="card">';
    html += '<h3>Edit Profile</h3>';
    /* BUG-051: No labels on form inputs */
    html += '<div class="form-group">';
    html += '<input type="text" id="profile-name" placeholder="Full Name" value="' + user.name + '">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="email" id="profile-email" placeholder="Email" value="' + user.email + '">';
    html += '</div>';
    html += '<div class="form-group">';
    /* BUG-077: Bio rendered as innerHTML */
    html += '<textarea id="profile-bio" placeholder="Bio">' + (user.bio || '') + '</textarea>';
    html += '</div>';
    html += '<button class="btn btn-primary" data-action="save-profile">Save Changes</button>';
    html += '</div>';

    html += '</div>'; /* end detail-main */

    /* Change password */
    html += '<div class="card">';
    html += '<h3>Change Password</h3>';
    html += '<div class="form-group">';
    html += '<input type="password" id="profile-current-password" placeholder="Current Password">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="password" id="profile-new-password" placeholder="New Password">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="password" id="profile-confirm-password" placeholder="Confirm New Password">';
    html += '</div>';
    html += '<button class="btn btn-primary" data-action="change-profile-password">Update Password</button>';
    html += '</div>';

    html += '</div>'; /* end detail-main */

    html += '<div class="detail-sidebar">';
    html += '<div class="card">';
    html += '<h3>Account Info</h3>';
    html += '<div class="detail-row"><span class="detail-label">Member since</span><span>' + (user.joinDate || 'Unknown') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Role</span><span>' + (user.role || 'Employee') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Account ID</span><span>' + (user.id || 'N/A') + '</span></div>';
    html += '</div>';

    /* Quick links */
    html += '<div class="card">';
    html += '<h3>Quick Links</h3>';
    html += '<a href="#/settings" class="btn btn-secondary btn-sm" style="width:100%;margin-bottom:0.5rem;">Settings</a>';
    html += '<a href="#/notifications" class="btn btn-secondary btn-sm" style="width:100%;margin-bottom:0.5rem;">Notifications</a>';
    html += '<button class="btn btn-danger btn-sm" data-action="logout" style="width:100%;">Logout</button>';
    html += '</div>';

    html += '</div>'; /* end detail-sidebar */

    html += '</div>'; /* end detail-grid */

    return html;
  },


  /* =============== NOTIFICATIONS =============== */
  notifications: function() {
    var notifications = Store.notifications.getList();
    var filterType = App.notifFilter || 'all';

    /* Apply filter */
    var filtered = notifications;
    if (filterType !== 'all') {
      if (filterType === 'unread') {
        filtered = notifications.filter(function(n) { return !n.read; });
      } else {
        filtered = notifications.filter(function(n) { return n.type === filterType; });
      }
    }

    var unreadCount = notifications.filter(function(n) { return !n.read; }).length;

    var html = '';
    html += '<div class="page-header"><h1>Notifications</h1>';
    html += '<div class="page-actions">';
    html += '<button class="btn btn-secondary" data-action="mark-all-read">Mark All Read</button>';
    html += '<button class="btn btn-danger btn-sm" data-action="clear-notifications">Clear All</button>';
    html += '</div></div>';

    /* Summary */
    html += '<div class="stats-bar">';
    html += '<div class="stat-card mini"><div class="stat-number">' + notifications.length + '</div><div class="stat-label">Total</div></div>';
    html += '<div class="stat-card mini"><div class="stat-number">' + unreadCount + '</div><div class="stat-label">Unread</div></div>';
    html += '</div>';

    /* Filter bar */
    html += '<div class="filter-bar">';
    html += '<button class="btn btn-sm' + (filterType === 'all' ? ' btn-primary' : ' btn-secondary') + '" data-action="filter-notifications" data-type="all">All</button>';
    html += '<button class="btn btn-sm' + (filterType === 'unread' ? ' btn-primary' : ' btn-secondary') + '" data-action="filter-notifications" data-type="unread">Unread</button>';
    html += '<button class="btn btn-sm' + (filterType === 'employee' ? ' btn-primary' : ' btn-secondary') + '" data-action="filter-notifications" data-type="employee">Employee</button>';
    html += '<button class="btn btn-sm' + (filterType === 'timeoff' ? ' btn-primary' : ' btn-secondary') + '" data-action="filter-notifications" data-type="timeoff">Time Off</button>';
    html += '<button class="btn btn-sm' + (filterType === 'review' ? ' btn-primary' : ' btn-secondary') + '" data-action="filter-notifications" data-type="review">Reviews</button>';
    html += '</div>';

    html += '<div class="notification-list">';

    if (filtered.length === 0) {
      html += '<div class="empty-state"><p>No notifications</p></div>';
    }

    filtered.forEach(function(n) {
      html += '<div class="notif-item' + (n.read ? ' read' : ' unread') + '" data-action="read-notification" data-id="' + n.id + '">';
      html += '<span class="notif-dot' + (n.read ? '' : ' active') + '"></span>';
      html += '<div class="notif-content">';
      html += '<p>' + n.message + '</p>';
      /* BUG-038: Dates shown in raw inconsistent formats from data */
      html += '<span class="notif-date">' + n.date + '</span>';
      html += '<span class="notif-type badge badge-blue">' + (n.type || 'general') + '</span>';
      html += '</div>';
      html += '</div>';
    });

    html += '</div>';

    return html;
  },


  /* =============== LOGIN MODAL =============== */
  loginModal: function() {
    var html = '';
    /* BUG-054: Modal HTML has no focus trap (no tabindex management) */
    html += '<div class="modal-content">';
    html += '<div class="modal-header"><h2>Log In</h2>';
    html += '<button class="modal-close" data-action="close-modal">&times;</button></div>';

    html += '<div class="modal-body">';
    html += '<div id="login-error" class="error-message"></div>';

    /* BUG-051: No labels, placeholder only */
    html += '<div class="form-group">';
    html += '<input type="email" id="login-email" placeholder="Email address">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="password" id="login-password" placeholder="Password">';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label class="checkbox-label"><input type="checkbox" id="login-remember"> Remember me</label>';
    html += '</div>';

    html += '<button class="btn btn-primary" data-action="login" style="width:100%;">Log In</button>';
    html += '<p class="form-footer">Don\'t have an account? <a href="#" data-action="show-register">Sign Up</a></p>';
    html += '<p class="form-footer"><small>Demo: test@example.com / password123</small></p>';
    html += '</div>';
    html += '</div>';

    return html;
  },


  /* =============== REGISTER MODAL =============== */
  registerModal: function() {
    var html = '';
    html += '<div class="modal-content">';
    html += '<div class="modal-header"><h2>Create Account</h2>';
    html += '<button class="modal-close" data-action="close-modal">&times;</button></div>';

    html += '<div class="modal-body">';
    html += '<div id="register-error" class="error-message"></div>';

    /* BUG-051: No labels */
    html += '<div class="form-group">';
    html += '<input type="text" id="register-name" placeholder="Full Name">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="email" id="register-email" placeholder="Email address">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="password" id="register-password" placeholder="Password">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="password" id="register-confirm-password" placeholder="Confirm Password">';
    html += '</div>';

    html += '<button class="btn btn-primary" data-action="register" style="width:100%;">Create Account</button>';
    html += '<p class="form-footer">Already have an account? <a href="#" data-action="show-login">Log In</a></p>';
    html += '</div>';
    html += '</div>';

    return html;
  },


  /* =============== USER MENU =============== */
  userMenu: function() {
    var user = Store.auth.user;

    var html = '';
    if (user) {
      html += '<div class="user-menu">';
      html += '<div class="user-avatar" style="background:' + (user.color || '#6366f1') + '">' + (user.avatar || 'U') + '</div>';
      html += '<span class="user-name">' + user.name + '</span>';
      html += '<div class="user-dropdown">';
      html += '<a href="#/profile" class="dropdown-item">Profile</a>';
      html += '<a href="#/notifications" class="dropdown-item">Notifications</a>';
      html += '<button class="dropdown-item" data-action="logout">Logout</button>';
      html += '</div>';
      html += '</div>';
    } else {
      html += '<button class="btn btn-sm btn-secondary" data-action="show-login">Login</button> ';
      html += '<button class="btn btn-sm btn-primary" data-action="show-register">Sign Up</button>';
    }

    return html;
  },


  /* =============== 404 NOT FOUND =============== */
  notFound: function() {
    var html = '';
    html += '<div class="not-found-page">';
    html += '<h1>404</h1>';
    html += '<h2>Page Not Found</h2>';
    html += '<p>The page you\'re looking for doesn\'t exist or has been moved.</p>';
    html += '<a href="#/" class="btn btn-primary">Go to Dashboard</a>';
    html += '</div>';

    return html;
  }

};
