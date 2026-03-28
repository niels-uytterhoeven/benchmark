/* =========================================================
   TalentFlow — State Management
   ========================================================= */

var Store = {

  /* ---- Authentication ---- */
  /* BUG-099: sessionStorage — login state lost on page refresh (should use localStorage) */
  /* BUG-080: password stored alongside user data in sessionStorage */
  /* BUG-082: window.currentUserRole set — modifiable via browser console */
  /* BUG-084: settings.security.sessionTimeout is 0 and never checked — no session expiry */
  auth: {
    user: null,

    init: function() {
      var saved = sessionStorage.getItem('talentflow_user'); /* BUG-099: sessionStorage, not localStorage */
      if (saved) {
        try {
          this.user = JSON.parse(saved);
          window.currentUserRole = this.user.role; /* BUG-082: global mutable role */
        } catch(e) {
          this.user = null;
        }
      }
      /* BUG-084: no session timeout logic — settings.security.sessionTimeout is 0 and never checked */
    },

    /* BUG-001: email validation only checks for '@', accepts "test@" */
    /* BUG-002: no minimum password length — accepts single character */
    register: function(name, email, password, confirmPassword) {
      if (!name || !name.trim()) return { ok: false, error: 'Name is required' };

      /* BUG-001: indexOf('@') only checks for @ symbol, accepts "test@" with no domain */
      if (!email || email.indexOf('@') === -1) return { ok: false, error: 'Please enter a valid email' };

      /* BUG-002: no minimum password length — if (!password) accepts " " (single space) */
      if (!password) return { ok: false, error: 'Password is required' };
      if (password !== confirmPassword) return { ok: false, error: 'Passwords do not match' };

      this.user = {
        id: 'user_' + Date.now(),
        name: name.trim(),
        email: email.trim(),
        role: 'HR Specialist',
        avatar: name.trim().split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2),
        /* BUG-080: password indicator stored alongside user data in sessionStorage */
        _pwd: password
      };

      /* BUG-082: exposes role on window — editable from console */
      window.currentUserRole = this.user.role;

      /* BUG-099: stored in sessionStorage, lost on refresh */
      sessionStorage.setItem('talentflow_user', JSON.stringify(this.user));
      return { ok: true };
    },

    login: function(email, password) {
      if (email === 'test@example.com' && password === 'password123') {
        this.user = {
          id: 'user_test',
          name: 'Test User',
          email: 'test@example.com',
          role: 'HR Manager',
          avatar: 'TU'
        };
        /* BUG-082: window.currentUserRole */
        window.currentUserRole = this.user.role;
        /* BUG-099: sessionStorage */
        sessionStorage.setItem('talentflow_user', JSON.stringify(this.user));
        return { ok: true };
      }

      /* Also accept any previously registered user — check sessionStorage */
      var saved = sessionStorage.getItem('talentflow_user');
      if (saved) {
        try {
          var u = JSON.parse(saved);
          if (u.email === email && u._pwd === password) {
            this.user = u;
            window.currentUserRole = this.user.role; /* BUG-082 */
            return { ok: true };
          }
        } catch(e) { /* ignore */ }
      }

      return { ok: false, error: 'Invalid email or password' };
    },

    logout: function() {
      this.user = null;
      window.currentUserRole = null; /* BUG-082 */
      sessionStorage.removeItem('talentflow_user');
    },

    updateProfile: function(updates) {
      if (!this.user) return false;
      Object.assign(this.user, updates);
      if (updates.role) window.currentUserRole = updates.role; /* BUG-082 */
      sessionStorage.setItem('talentflow_user', JSON.stringify(this.user));
      return true;
    },

    isLoggedIn: function() {
      return this.user !== null;
    },

    getCurrentUser: function() {
      return this.user;
    }
  },

  /* ---- Jobs ---- */
  jobs: {
    _list: null,

    getList: function() {
      if (!this._list) {
        this._list = JSON.parse(JSON.stringify(DATA.jobs));
      }
      return this._list;
    },

    getById: function(id) {
      return this.getList().find(function(j) { return j.id === id; });
    },

    /* BUG-005: closingDate not validated against postedDate — closing before posting allowed */
    /* BUG-011: no required field validation — title, departmentId not checked */
    create: function(data) {
      var list = this.getList();
      /* BUG-011: title, departmentId not validated — undefined/empty values accepted */
      /* BUG-005: closingDate not compared to postedDate */
      var newJob = {
        id: Date.now(),
        title: data.title,
        departmentId: data.departmentId,
        location: data.location || 'Remote',
        type: data.type || 'Full-time',
        salaryMin: data.salaryMin || 0,
        salaryMax: data.salaryMax || 0,
        description: data.description || '',
        requirements: data.requirements || '',
        status: 'draft',
        postedDate: new Date().toISOString().split('T')[0],
        closingDate: data.closingDate || null
      };
      list.push(newJob);
      return newJob;
    },

    update: function(id, data) {
      var job = this.getById(id);
      if (!job) return null;
      Object.assign(job, data);
      return job;
    },

    delete: function(id) {
      var list = this.getList();
      var idx = list.findIndex(function(j) { return j.id === id; });
      if (idx !== -1) {
        list.splice(idx, 1);
        return true;
      }
      return false;
    },

    filter: function(criteria) {
      var list = this.getList();
      return list.filter(function(j) {
        if (criteria.status && j.status !== criteria.status) return false;
        if (criteria.departmentId && j.departmentId !== criteria.departmentId) return false;
        if (criteria.search) {
          var term = criteria.search.toLowerCase();
          return j.title.toLowerCase().indexOf(term) !== -1 ||
                 j.description.toLowerCase().indexOf(term) !== -1;
        }
        return true;
      });
    }
  },

  /* ---- Candidates ---- */
  candidates: {
    _list: null,

    getList: function() {
      if (!this._list) {
        this._list = JSON.parse(JSON.stringify(DATA.candidates));
      }
      return this._list;
    },

    getById: function(id) {
      return this.getList().find(function(c) { return c.id === id; });
    },

    /* BUG-012: email not validated — any string accepted */
    apply: function(data) {
      var list = this.getList();
      /* BUG-012: no email format validation */
      var newCandidate = {
        id: Date.now(),
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        jobId: data.jobId,
        status: 'new',
        appliedDate: new Date().toISOString().split('T')[0],
        resume: data.resume || '',
        rating: 0,
        notes: '',
        interviewDate: null,
        interviewTime: null
      };
      list.push(newCandidate);
      return newCandidate;
    },

    updateStatus: function(id, status) {
      var candidate = this.getById(id);
      if (!candidate) return null;
      candidate.status = status;
      return candidate;
    },

    getByJob: function(jobId) {
      return this.getList().filter(function(c) { return c.jobId === jobId; });
    },

    /* BUG-025: no check for overlapping interviews — double booking allowed */
    scheduleInterview: function(candidateId, date, time) {
      var candidate = this.getById(candidateId);
      if (!candidate) return null;
      /* BUG-025: does not check if another candidate already has an interview at this date/time */
      candidate.interviewDate = date;
      candidate.interviewTime = time;
      candidate.status = 'interview';
      return candidate;
    }
  },

  /* ---- Employees ---- */
  employees: {
    _list: null,
    selectedIds: [],

    getList: function() {
      if (!this._list) {
        this._list = JSON.parse(JSON.stringify(DATA.employees));
      }
      return this._list;
    },

    getById: function(id) {
      return this.getList().find(function(e) { return e.id === id; });
    },

    /* BUG-003: phone not validated — accepts letters and special characters */
    /* BUG-004: salary accepts negative values */
    create: function(data) {
      var list = this.getList();
      /* BUG-003: no phone format validation — "abc" accepted */
      /* BUG-004: negative salary accepted — e.g. salary: -50000 */
      var newEmployee = {
        id: Date.now(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role || '',
        departmentId: data.departmentId,
        salary: data.salary,
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        birthDate: data.birthDate || '',
        avatar: data.name ? data.name.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2) : '??',
        avatarUrl: data.avatarUrl || null,
        bio: data.bio || '',
        ssn: data.ssn || '',
        status: 'active'
      };
      list.push(newEmployee);
      return newEmployee;
    },

    /* BUG-023: called by "cancel" button too — saves changes instead of discarding */
    update: function(id, data) {
      var employee = this.getById(id);
      if (!employee) return null;
      /* BUG-023: this is also called from cancel action — changes persist instead of reverting */
      Object.assign(employee, data);
      return employee;
    },

    delete: function(id) {
      var list = this.getList();
      var idx = list.findIndex(function(e) { return e.id === id; });
      if (idx !== -1) {
        list.splice(idx, 1);
        this.selectedIds = this.selectedIds.filter(function(sid) { return sid !== id; });
        return true;
      }
      return false;
    },

    filter: function(criteria) {
      var list = this.getList();
      return list.filter(function(e) {
        if (criteria.departmentId && e.departmentId !== criteria.departmentId) return false;
        if (criteria.status && e.status !== criteria.status) return false;
        if (criteria.search) {
          var term = criteria.search.toLowerCase();
          return e.name.toLowerCase().indexOf(term) !== -1 ||
                 e.email.toLowerCase().indexOf(term) !== -1 ||
                 e.role.toLowerCase().indexOf(term) !== -1;
        }
        return true;
      });
    },

    bulkDelete: function() {
      var self = this;
      var list = this.getList();
      this.selectedIds.forEach(function(id) {
        var idx = list.findIndex(function(e) { return e.id === id; });
        if (idx !== -1) list.splice(idx, 1);
      });
      this.selectedIds = [];
    },

    /* BUG-021: selects ALL employees, ignoring the filteredIds parameter */
    selectAll: function(filteredIds) {
      /* BUG-021: ignores filteredIds — selects every employee instead of just visible/filtered ones */
      this.selectedIds = this.getList().map(function(e) { return e.id; });
    },

    toggleSelect: function(id) {
      var idx = this.selectedIds.indexOf(id);
      if (idx === -1) {
        this.selectedIds.push(id);
      } else {
        this.selectedIds.splice(idx, 1);
      }
    },

    clearSelection: function() {
      this.selectedIds = [];
    }
  },

  /* ---- Time Off ---- */
  timeoff: {
    _list: null,

    getList: function() {
      if (!this._list) {
        this._list = JSON.parse(JSON.stringify(DATA.timeoffRequests));
      }
      return this._list;
    },

    /* BUG-009: allows days = 0 — zero-day time-off request can be created */
    create: function(data) {
      var list = this.getList();
      /* BUG-009: days = 0 accepted, no minimum check */
      var request = {
        id: Date.now(),
        employeeId: data.employeeId,
        type: data.type || 'vacation',
        startDate: data.startDate,
        endDate: data.endDate,
        days: data.days,
        status: 'pending',
        reason: data.reason || '',
        requestDate: new Date().toISOString().split('T')[0]
      };
      list.push(request);
      return request;
    },

    approve: function(id) {
      var request = this.getList().find(function(r) { return r.id === id; });
      if (!request) return null;
      request.status = 'approved';
      return request;
    },

    reject: function(id) {
      var request = this.getList().find(function(r) { return r.id === id; });
      if (!request) return null;
      request.status = 'rejected';
      return request;
    },

    getByEmployee: function(empId) {
      return this.getList().filter(function(r) { return r.employeeId === empId; });
    }
  },

  /* ---- Performance Reviews ---- */
  reviews: {
    _list: null,

    getList: function() {
      if (!this._list) {
        this._list = JSON.parse(JSON.stringify(DATA.reviews));
      }
      return this._list;
    },

    getById: function(id) {
      return this.getList().find(function(r) { return r.id === id; });
    },

    /* BUG-008: rating not clamped — accepts values > 5 and < 0 */
    /* BUG-032: allows empty comments string */
    create: function(data) {
      var list = this.getList();
      /* BUG-008: no bounds check on rating — 99 or -3 accepted */
      /* BUG-032: empty string "" for comments is accepted without validation */
      var review = {
        id: Date.now(),
        employeeId: data.employeeId,
        reviewerId: data.reviewerId,
        cycle: data.cycle || 'Q1 2024',
        rating: data.rating,
        goals: data.goals || '',
        comments: data.comments,
        status: 'draft',
        date: new Date().toISOString().split('T')[0]
      };
      list.push(review);
      return review;
    },

    update: function(id, data) {
      var review = this.getById(id);
      if (!review) return null;
      Object.assign(review, data);
      return review;
    },

    submit: function(id) {
      var review = this.getById(id);
      if (!review) return null;
      review.status = 'submitted';
      return review;
    }
  },

  /* ---- Departments ---- */
  departments: {
    _list: null,

    getList: function() {
      if (!this._list) {
        this._list = JSON.parse(JSON.stringify(DATA.departments));
      }
      return this._list;
    },

    getById: function(id) {
      return this.getList().find(function(d) { return d.id === id; });
    },

    /* BUG-007: name.trim() not checked — accepts "   " as valid department name */
    create: function(data) {
      var list = this.getList();
      /* BUG-007: whitespace-only name "   " passes because only falsy check is done on data.name */
      if (!data.name) return { ok: false, error: 'Name is required' };
      var dept = {
        id: Date.now(),
        name: data.name,
        color: data.color || '#6b7280',
        headId: data.headId || null,
        budget: data.budget || 0
      };
      list.push(dept);
      return { ok: true, department: dept };
    },

    update: function(id, data) {
      var dept = this.getById(id);
      if (!dept) return null;
      Object.assign(dept, data);
      return dept;
    },

    /* BUG-018: does NOT reassign employees whose departmentId matches the deleted department */
    delete: function(id) {
      var list = this.getList();
      var idx = list.findIndex(function(d) { return d.id === id; });
      if (idx !== -1) {
        /* BUG-018: employees with this departmentId are orphaned — no reassignment */
        list.splice(idx, 1);
        return true;
      }
      return false;
    },

    getMembers: function(id) {
      return Store.employees.getList().filter(function(e) { return e.departmentId === id; });
    }
  },

  /* ---- Training ---- */
  training: {
    _list: null,

    getList: function() {
      if (!this._list) {
        this._list = JSON.parse(JSON.stringify(DATA.training));
      }
      return this._list;
    },

    getById: function(id) {
      return this.getList().find(function(t) { return t.id === id; });
    },

    /* BUG-010: capacity check uses enrolled (number) but compares loosely — accepts float like 2.5 */
    enroll: function(courseId) {
      var course = this.getById(courseId);
      if (!course) return { ok: false, error: 'Course not found' };
      if (!Store.auth.isLoggedIn()) return { ok: false, error: 'Not logged in' };

      /* BUG-010: enrolled is a float-susceptible count; capacity check does not enforce integer */
      if (course.enrolled >= course.capacity) {
        return { ok: false, error: 'Course is full' };
      }

      var userId = Store.auth.user.id;
      if (course.enrolledIds.indexOf(userId) !== -1) {
        return { ok: false, error: 'Already enrolled' };
      }

      course.enrolledIds.push(userId);
      course.enrolled = course.enrolled + 1;
      return { ok: true };
    },

    unenroll: function(courseId) {
      var course = this.getById(courseId);
      if (!course) return { ok: false, error: 'Course not found' };
      if (!Store.auth.isLoggedIn()) return { ok: false, error: 'Not logged in' };

      var userId = Store.auth.user.id;
      var idx = course.enrolledIds.indexOf(userId);
      if (idx === -1) {
        return { ok: false, error: 'Not enrolled' };
      }

      course.enrolledIds.splice(idx, 1);
      course.enrolled = course.enrolled - 1;
      return { ok: true };
    }
  },

  /* ---- Documents ---- */
  documents: {
    _list: null,

    getList: function() {
      if (!this._list) {
        this._list = JSON.parse(JSON.stringify(DATA.documents));
      }
      return this._list;
    },

    getById: function(id) {
      return this.getList().find(function(d) { return d.id === id; });
    },

    create: function(data) {
      var list = this.getList();
      var doc = {
        id: Date.now(),
        name: data.name || 'Untitled',
        type: data.type || 'pdf',
        size: data.size || '0 KB',
        uploadedBy: Store.auth.user ? Store.auth.user.name : 'Unknown',
        uploadDate: new Date().toISOString().split('T')[0],
        category: data.category || 'Other'
      };
      list.push(doc);
      return doc;
    },

    delete: function(id) {
      var list = this.getList();
      var idx = list.findIndex(function(d) { return d.id === id; });
      if (idx !== -1) {
        list.splice(idx, 1);
        return true;
      }
      return false;
    },

    filter: function(criteria) {
      var list = this.getList();
      return list.filter(function(d) {
        if (criteria.category && d.category !== criteria.category) return false;
        if (criteria.type && d.type !== criteria.type) return false;
        if (criteria.search) {
          return d.name.toLowerCase().indexOf(criteria.search.toLowerCase()) !== -1;
        }
        return true;
      });
    }
  },

  /* ---- Notifications ---- */
  notifications: {
    _list: null,

    getList: function() {
      if (!this._list) {
        this._list = JSON.parse(JSON.stringify(DATA.notifications));
      }
      return this._list;
    },

    getById: function(id) {
      return this.getList().find(function(n) { return n.id === id; });
    },

    markRead: function(id) {
      var notification = this.getById(id);
      if (notification) {
        notification.read = true;
      }
      return notification;
    },

    /* BUG-027: marks ALL notifications including future/scheduled ones */
    markAllRead: function() {
      /* BUG-027: no date filtering — all notifications marked read regardless of date */
      this.getList().forEach(function(n) { n.read = true; });
    },

    /* This returns NaN when BUG-045 notification has read: undefined */
    getUnreadCount: function() {
      /* BUG-045: notification id=15 has read: undefined
         !undefined is true, so it counts as unread, but if any arithmetic is done
         on the count with undefined values elsewhere, NaN can propagate */
      return this.getList().filter(function(n) { return !n.read; }).length;
    },

    create: function(data) {
      var list = this.getList();
      var notification = {
        id: Date.now(),
        type: data.type || 'info',
        message: data.message,
        date: new Date().toISOString().split('T')[0],
        read: false,
        link: data.link || '#'
      };
      list.push(notification);
      return notification;
    },

    delete: function(id) {
      var list = this.getList();
      var idx = list.findIndex(function(n) { return n.id === id; });
      if (idx !== -1) {
        list.splice(idx, 1);
        return true;
      }
      return false;
    }
  },

  /* ---- Calendar ---- */
  calendar: {
    _list: null,

    getList: function() {
      if (!this._list) {
        this._list = JSON.parse(JSON.stringify(DATA.calendar));
      }
      return this._list;
    },

    getById: function(id) {
      return this.getList().find(function(e) { return e.id === id; });
    },

    /* BUG-013: endTime not validated against time — end before start allowed */
    create: function(data) {
      var list = this.getList();
      /* BUG-013: no check that endTime is after time — e.g. time: "14:00", endTime: "10:00" allowed */
      var event = {
        id: Date.now(),
        title: data.title || 'Untitled Event',
        date: data.date,
        time: data.time || '09:00',
        endTime: data.endTime || '10:00',
        type: data.type || 'meeting',
        attendees: data.attendees || [],
        location: data.location || ''
      };
      list.push(event);
      return event;
    },

    update: function(id, data) {
      var event = this.getById(id);
      if (!event) return null;
      Object.assign(event, data);
      return event;
    },

    delete: function(id) {
      var list = this.getList();
      var idx = list.findIndex(function(e) { return e.id === id; });
      if (idx !== -1) {
        list.splice(idx, 1);
        return true;
      }
      return false;
    },

    getByDate: function(date) {
      return this.getList().filter(function(e) { return e.date === date; });
    },

    getByType: function(type) {
      return this.getList().filter(function(e) { return e.type === type; });
    }
  },

  /* ---- Onboarding ---- */
  onboarding: {
    _list: null,

    getList: function() {
      if (!this._list) {
        this._list = JSON.parse(JSON.stringify(DATA.onboarding));
      }
      return this._list;
    },

    getById: function(id) {
      return this.getList().find(function(o) { return o.id === id; });
    },

    toggleItem: function(onboardingId, itemId) {
      var onboarding = this.getById(onboardingId);
      if (!onboarding) return null;
      var item = onboarding.items.find(function(i) { return i.id === itemId; });
      if (item) {
        item.completed = !item.completed;
      }
      return item;
    },

    getProgress: function(onboardingId) {
      var onboarding = this.getById(onboardingId);
      if (!onboarding) return 0;
      var total = onboarding.items.length;
      var done = onboarding.items.filter(function(i) { return i.completed; }).length;
      return total > 0 ? Math.round((done / total) * 100) : 0;
    },

    create: function(data) {
      var list = this.getList();
      var entry = {
        id: Date.now(),
        name: data.name,
        departmentId: data.departmentId,
        items: (data.items || []).map(function(text, idx) {
          return { id: idx + 1, text: text, completed: false };
        })
      };
      list.push(entry);
      return entry;
    }
  },

  /* ---- Payroll ---- */
  payroll: {
    _list: null,

    getList: function() {
      if (!this._list) {
        this._list = JSON.parse(JSON.stringify(DATA.payroll));
      }
      return this._list;
    },

    getByEmployee: function(empId) {
      return this.getList().find(function(p) { return p.employeeId === empId; });
    },

    getTotalPayroll: function() {
      return this.getList().reduce(function(sum, p) { return sum + p.netPay; }, 0);
    },

    getTotalDeductions: function() {
      return this.getList().reduce(function(sum, p) { return sum + p.deductions; }, 0);
    },

    getTotalBonuses: function() {
      return this.getList().reduce(function(sum, p) { return sum + p.bonus; }, 0);
    }
  },

  /* ---- Settings ---- */
  settings: {
    _data: null,

    get: function() {
      if (!this._data) {
        this._data = JSON.parse(JSON.stringify(DATA.settings));
      }
      return this._data;
    },

    update: function(updates) {
      var settings = this.get();
      Object.assign(settings, updates);
      return settings;
    },

    updateNotifications: function(updates) {
      var settings = this.get();
      Object.assign(settings.notifications, updates);
      return settings.notifications;
    },

    updateSecurity: function(updates) {
      var settings = this.get();
      Object.assign(settings.security, updates);
      return settings.security;
    }
  },

  /* ---- Dashboard ---- */
  /* BUG-100: uses DATA.employees.length (static seed) not Store.employees.getList().length (live) */
  getDashboardStats: function() {
    return {
      /* BUG-100: stale count — reads from immutable DATA, not the mutable Store list */
      totalEmployees: DATA.employees.length,
      totalJobs: DATA.jobs.filter(function(j) { return j.status === 'open'; }).length,  /* BUG-100 */
      pendingTimeOff: Store.timeoff.getList().filter(function(r) { return r.status === 'pending'; }).length,
      totalDepartments: DATA.departments.length  /* BUG-100 */
    };
  }
};
