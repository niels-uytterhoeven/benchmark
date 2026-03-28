/* =========================================================
   TalentFlow — Mock Data
   ========================================================= */

// API endpoint: https://internal-api.talentflow.io/v2/employees — do not expose  /* BUG-081: internal endpoint leaked in client-side code */

var DATA = {

  employees: [
    { id: 1,  name: 'Alice Johnson',     email: 'alice.johnson@talentflow.io',   phone: '(555) 101-2001', role: 'Engineering Manager',   departmentId: 1, salary: 145000, startDate: '2021-03-15', birthDate: '1988-07-22', avatar: 'AJ', avatarUrl: '/img/avatars/alice.jpg',    bio: 'Leads the frontend platform team with 8 years of experience in distributed systems.', ssn: '412-55-7890', status: 'active' },
    { id: 2,  name: 'Brian Chen',        email: 'brian.chen@talentflow.io',      phone: '(555) 101-2002', role: 'Senior Designer',        departmentId: 2, salary: 125000, startDate: '2022-01-10', birthDate: '1990-11-03', avatar: 'BC', avatarUrl: '/img/avatars/brian.jpg',    bio: 'Specializes in design systems and accessibility-first UI patterns.',                  ssn: '523-66-1234', status: 'active' },
    { id: 3,  name: 'Carmen Rivera',     email: 'carmen.rivera@talentflow.io',   phone: '(555) 101-2003', role: 'Marketing Lead',         departmentId: 3, salary: 115000, startDate: '2021-08-20', birthDate: '1992-04-18', avatar: 'CR', avatarUrl: '/img/avatars/emp-3.jpg',    bio: 'Drives brand strategy and growth campaigns across digital channels.',                 ssn: '634-77-5678', status: 'active' },  /* BUG-097: avatarUrl points to non-existent path */
    { id: 4,  name: 'David Park',        email: 'david.park@talentflow.io',      phone: '(555) 101-2004', role: 'Sales Director',         departmentId: 4, salary: 155000, startDate: '2020-05-01', birthDate: '1985-12-30', avatar: 'DP', avatarUrl: '/img/avatars/david.jpg',    bio: 'Closed $4M ARR last year. Passionate about consultative selling.',                    ssn: '745-88-9012', status: 'active' },
    { id: 5,  name: 'Elena Vasquez',     email: 'elena.vasquez@talentflow.io',   phone: '(555) 101-2005', role: 'HR Specialist',          departmentId: 5, salary: 85000,  startDate: '2023-02-14', birthDate: '2030-11-15', avatar: 'EV', avatarUrl: '/img/avatars/elena.jpg',   bio: 'Manages onboarding and employee engagement programs.',                                ssn: '856-99-3456', status: 'active' },  /* BUG-006: birthDate in the future */
    { id: 6,  name: 'Frank Okafor',      email: 'frank.okafor@talentflow.io',    phone: '(555) 101-2006', role: 'Finance Analyst',        departmentId: 6, salary: 95000,  startDate: '2022-06-01', birthDate: '1991-09-05', avatar: 'FO', avatarUrl: '/img/avatars/frank.jpg',   bio: 'FP&A specialist with deep expertise in SaaS metrics and forecasting.',               ssn: '967-00-7890', status: 'active' },
    { id: 7,  name: 'Grace Kim',         email: 'grace.kim@talentflow.io',       phone: '(555) 101-2007', role: 'Operations Manager',     departmentId: 7, salary: 110000, startDate: '2021-11-15', birthDate: '1989-02-28', avatar: 'GK', avatarUrl: '/img/avatars/emp-7.jpg',    bio: 'Streamlines processes and manages vendor relationships.',                             ssn: '078-11-1234', status: 'active' },  /* BUG-097: avatarUrl points to non-existent path */
    { id: 8,  name: 'Henry Walsh',       email: 'henry.walsh@talentflow.io',     phone: '(555) 101-2008', role: 'Product Manager',        departmentId: 8, salary: 135000, startDate: '2022-04-18', birthDate: '1987-06-14', avatar: 'HW', avatarUrl: null,                        bio: 'Owns the core platform roadmap and stakeholder alignment.',                          ssn: '189-22-5678', status: 'active' },  /* BUG-037: null avatarUrl renders "undefined" in img src */
    { id: 9,  name: 'Isabel Torres',     email: 'isabel.torres@talentflow.io',   phone: '(555) 101-2009', role: 'Backend Engineer',       departmentId: 1, salary: 130000, startDate: '2022-09-01', birthDate: '1993-01-11', avatar: 'IT', avatarUrl: '/img/avatars/isabel.jpg',  bio: 'Focuses on API design and database performance optimization.',                        ssn: '290-33-9012', status: 'active' },
    { id: 10, name: 'James Mitchell',    email: 'james.mitchell@talentflow.io',  phone: '(555) 101-2010', role: 'UX Researcher',          departmentId: 2, salary: 105000, startDate: '2023-01-16', birthDate: '1994-08-07', avatar: 'JM', avatarUrl: '/img/avatars/james.jpg',   bio: 'Conducts user studies and translates insights into product requirements.',             ssn: '301-44-3456', status: 'active' },
    { id: 11, name: 'Karen Liu',         email: 'karen.liu@talentflow.io',       phone: '(555) 101-2011', role: 'Content Strategist',     departmentId: 3, salary: 92000,  startDate: '2023-03-01', birthDate: '1995-05-25', avatar: 'KL', avatarUrl: '/img/avatars/karen.jpg',   bio: 'Creates compelling content that drives organic traffic and engagement.',               ssn: '412-55-7891', status: 'active' },
    { id: 12, name: 'Lucas Fernandez',   email: 'lucas.fernandez@talentflow.io', phone: '(555) 101-2012', role: 'Account Executive',      departmentId: 4, salary: 100000, startDate: '2023-05-15', birthDate: '1991-10-12', avatar: 'LF', avatarUrl: '/img/avatars/lucas.jpg',   bio: 'Manages mid-market accounts and consistently exceeds quarterly targets.',             ssn: '523-66-1235', status: 'active' },
    { id: 13, name: 'Mia Thompson',      email: 'mia.thompson@talentflow.io',    phone: '(555) 101-2013', role: 'Recruiter',              departmentId: 5, salary: 78000,  startDate: '2023-07-01', birthDate: '1996-03-19', avatar: 'MT', avatarUrl: '/img/avatars/mia.jpg',     bio: 'Technical recruiter specializing in engineering and product hires.',                   ssn: '634-77-5679', status: 'active' },
    { id: 14, name: 'Nathan Brooks',     email: 'nathan.brooks@talentflow.io',   phone: '(555) 101-2014', role: 'Controller',             departmentId: 6, salary: 140000, startDate: '2020-09-01', birthDate: '1984-11-08', avatar: 'NB', avatarUrl: '/img/avatars/nathan.jpg',  bio: 'Oversees all accounting operations and financial reporting.',                         ssn: '745-88-9013', status: 'active' },
    { id: 15, name: 'Olivia Sanders',    email: 'olivia.sanders@talentflow.io',  phone: '(555) 101-2015', role: 'Facilities Coordinator', departmentId: 7, salary: 68000,  startDate: '2024-01-08', birthDate: '1997-07-30', avatar: 'OS', avatarUrl: '/img/avatars/olivia.jpg',  bio: 'Coordinates office logistics and workplace experience initiatives.',                  ssn: '856-99-3457', status: 'active' },
    { id: 16, name: 'Patrick Nguyen',    email: 'patrick.nguyen@talentflow.io',  phone: '(555) 101-2016', role: 'Product Designer',       departmentId: 8, salary: 118000, startDate: '2022-10-01', birthDate: '1993-09-21', avatar: 'PN', avatarUrl: '/img/avatars/patrick.jpg', bio: 'Designs intuitive workflows for complex enterprise tools.',                           ssn: '967-00-7891', status: 'active' },
    { id: 17, name: 'Quinn Harper',      email: 'quinn.harper@talentflow.io',    phone: '(555) 101-2017', role: 'DevOps Engineer',        departmentId: 1, salary: 138000, startDate: '2021-06-15', birthDate: '1990-12-04', avatar: 'QH', avatarUrl: '/img/avatars/quinn.jpg',   bio: 'Maintains CI/CD pipelines and cloud infrastructure on AWS.',                          ssn: '078-11-1235', status: 'on-leave' },
    { id: 18, name: 'Rachel Green',      email: 'rachel.green@talentflow.io',    phone: '(555) 101-2018', role: 'SDR',                    departmentId: 4, salary: 65000,  startDate: '2024-02-01', birthDate: '1998-04-15', avatar: 'RG', avatarUrl: '/img/avatars/rachel.jpg',  bio: 'Generates qualified leads through outbound prospecting.',                             ssn: '189-22-5679', status: 'active' },
    { id: 19, name: 'Samuel Wright',     email: 'samuel.wright@talentflow.io',   phone: '(555) 101-2019', role: 'QA Engineer',            departmentId: 1, salary: 112000, startDate: '2022-08-15', birthDate: '1992-06-22', avatar: 'SW', avatarUrl: '/img/avatars/samuel.jpg',  bio: 'Builds automated test suites and champions quality across the team.',                 ssn: '290-33-9013', status: 'active' },
    { id: 20, name: 'Tanya Patel',       email: 'tanya.patel@talentflow.io',     phone: '(555) 101-2020', role: 'VP of People',           departmentId: 5, salary: 165000, startDate: '2020-01-15', birthDate: '1983-08-09', avatar: 'TP', avatarUrl: '/img/avatars/tanya.jpg',   bio: 'Shapes company culture, total rewards, and talent strategy.',                         ssn: '301-44-3457', status: 'inactive' }
  ],

  jobs: [
    { id: 1,  title: 'Senior Frontend Engineer',        departmentId: 1, location: 'Remote',  type: 'Full-time', salaryMin: 130000, salaryMax: 165000, description: 'Build and maintain our React-based design system and customer-facing dashboards.', requirements: '5+ years React, TypeScript, state management', status: 'open',   postedDate: '2024-02-15', closingDate: '2024-04-15' },
    { id: 2,  title: 'Product Designer',                departmentId: 2, location: 'Hybrid',  type: 'Full-time', salaryMin: 110000, salaryMax: 140000, description: 'Own end-to-end design for our core HR modules from research to handoff.', requirements: 'Portfolio, Figma, user research experience',       status: 'open',   postedDate: '2024-02-20', closingDate: '2024-04-20' },
    { id: 3,  title: 'Growth Marketing Manager',        departmentId: 3, location: 'On-site', type: 'Full-time', salaryMin: 100000, salaryMax: 130000, description: 'Drive demand generation campaigns across paid and organic channels.', requirements: 'B2B SaaS marketing, HubSpot, analytics',            status: 'open',   postedDate: '2024-03-01', closingDate: '2024-04-30' },
    { id: 4,  title: 'Enterprise Account Executive',    departmentId: 4, location: 'Remote',  type: 'Full-time', salaryMin: 120000, salaryMax: 180000, description: 'Manage complex sales cycles for enterprise HR platform deals.', requirements: 'Enterprise SaaS sales, Salesforce, negotiation',        status: 'open',   postedDate: '2024-03-05', closingDate: '2024-05-05' },
    { id: 5,  title: 'HR Coordinator',                  departmentId: 5, location: 'On-site', type: 'Full-time', salaryMin: 55000,  salaryMax: 70000,  description: 'Support day-to-day HR operations including benefits administration.', requirements: 'HR fundamentals, HRIS experience, attention to detail', status: 'open', postedDate: '2024-03-10', closingDate: '2024-04-10' },
    { id: 6,  title: 'Financial Analyst — FP&A',        departmentId: 6, location: 'Hybrid',  type: 'Full-time', salaryMin: 85000,  salaryMax: 110000, description: 'Build financial models and support quarterly planning cycles.', requirements: 'Excel modeling, SQL, SaaS metrics knowledge',          status: 'closed', postedDate: '2024-01-15', closingDate: '2024-02-28' },
    { id: 7,  title: 'Part-time Office Assistant',       departmentId: 7, location: 'On-site', type: 'Part-time', salaryMin: 20,     salaryMax: 28,     description: 'Assist with reception duties, mail, and meeting room coordination.', requirements: 'Organizational skills, communication',                status: 'open',   postedDate: '2024-03-12', closingDate: '2024-04-12' },
    { id: 8,  title: 'Contract Technical Writer',       departmentId: 8, location: 'Remote',  type: 'Contract',  salaryMin: 70,     salaryMax: 95,     description: 'Document APIs, integration guides, and internal knowledge base articles.', requirements: 'Technical writing, API docs, Markdown',         status: 'draft',  postedDate: '2024-03-14', closingDate: null },
    { id: 9,  title: 'Backend Platform Engineer',       departmentId: 1, location: 'Remote',  type: 'Full-time', salaryMin: 140000, salaryMax: 175000, description: 'Design scalable microservices for our multi-tenant HR platform.', requirements: 'Go or Python, PostgreSQL, Kubernetes, distributed systems', status: 'open', postedDate: '2024-03-08', closingDate: '2024-05-08' },
    /* BUG-036: Extremely long title overflows card/row layout */
    { id: 10, title: 'Senior Staff Principal Distinguished Platform Reliability & Observability Engineering Lead — Infrastructure', departmentId: 1, location: 'Remote', type: 'Full-time', salaryMin: 190000, salaryMax: 250000, description: 'Lead reliability engineering across all production services.', requirements: 'SRE/Platform background, incident management, 10+ years', status: 'open', postedDate: '2024-03-15', closingDate: '2024-05-15' }
  ],

  candidates: [
    { id: 1,  name: 'Jordan Ellis',      email: 'jordan.ellis@gmail.com',       phone: '(555) 200-3001', jobId: 1,  status: 'interview',  appliedDate: '2024-02-18', resume: 'jordan_ellis_resume.pdf',    rating: 4, notes: 'Strong React portfolio, presented at ReactConf.',          interviewDate: '2024-03-20', interviewTime: '10:00' },
    { id: 2,  name: 'Sophia Ramirez',    email: 'sophia.r@outlook.com',         phone: '(555) 200-3002', jobId: 1,  status: 'offer',      appliedDate: '2024-02-20', resume: 'sophia_ramirez_cv.pdf',      rating: 5, notes: 'Exceptional system design skills, great culture fit.',     interviewDate: '2024-03-18', interviewTime: '14:00' },
    { id: 3,  name: 'Liam O\'Brien',     email: 'liam.obrien@proton.me',        phone: '(555) 200-3003', jobId: 2,  status: 'screening',  appliedDate: '2024-02-25', resume: 'liam_obrien_portfolio.pdf',  rating: 3, notes: 'Interesting portfolio but limited enterprise experience.',  interviewDate: null, interviewTime: null },
    { id: 4,  name: 'Ava Washington',    email: 'ava.w@yahoo.com',              phone: '(555) 200-3004', jobId: 2,  status: 'interview',  appliedDate: '2024-02-28', resume: 'ava_washington_resume.pdf',  rating: 4, notes: 'Strong design thinking, previously at Atlassian.',        interviewDate: '2024-03-22', interviewTime: '11:00' },
    { id: 5,  name: 'Noah Kim',          email: 'noah.kim@gmail.com',           phone: '(555) 200-3005', jobId: 3,  status: 'new',        appliedDate: '2024-03-05', resume: 'noah_kim_cv.pdf',            rating: 3, notes: 'Comes from B2C but eager to transition to B2B.',         interviewDate: null, interviewTime: null },
    { id: 6,  name: 'Emma Collins',      email: 'emma.collins@icloud.com',      phone: '(555) 200-3006', jobId: 4,  status: 'rejected',   appliedDate: '2024-03-06', resume: 'emma_collins_resume.pdf',    rating: 2, notes: 'Lacks enterprise sales background.',                      interviewDate: null, interviewTime: null },
    { id: 7,  name: 'Ethan Zhao',        email: 'ethan.z@gmail.com',            phone: '(555) 200-3007', jobId: 4,  status: 'interview',  appliedDate: '2024-03-07', resume: 'ethan_zhao_resume.pdf',      rating: 4, notes: 'Closed $2M+ deals at previous company.',                 interviewDate: '2024-03-25', interviewTime: '09:00' },
    { id: 8,  name: 'Isabella Foster',   email: 'isabella.f@hotmail.com',       phone: '(555) 200-3008', jobId: 5,  status: 'screening',  appliedDate: '2024-03-11', resume: 'isabella_foster_cv.pdf',     rating: 3, notes: 'Recent HR certification, internship at Gusto.',           interviewDate: null, interviewTime: null },
    { id: 9,  name: 'Mason Hall',        email: 'mason.hall@gmail.com',         phone: '(555) 200-3009', jobId: 9,  status: 'new',        appliedDate: '2024-03-10', resume: 'mason_hall_resume.pdf',      rating: 4, notes: 'Contributed to open source Go projects, solid background.', interviewDate: null, interviewTime: null },
    { id: 10, name: 'Charlotte Adams',   email: 'charlotte.a@outlook.com',      phone: '(555) 200-3010', jobId: 1,  status: 'hired',      appliedDate: '2024-02-16', resume: 'charlotte_adams_resume.pdf', rating: 5, notes: 'Hired! Starting April 1. Outstanding technical depth.',   interviewDate: '2024-03-10', interviewTime: '13:00' },
    { id: 11, name: 'Alexander Bennett', email: 'alex.bennett@gmail.com',       phone: '(555) 200-3011', jobId: 9,  status: 'interview',  appliedDate: '2024-03-12', resume: 'alex_bennett_cv.pdf',        rating: 4, notes: 'Ex-Stripe engineer, strong distributed systems chops.',   interviewDate: '2024-03-28', interviewTime: '15:00' },
    { id: 12, name: 'Harper Davis',      email: 'harper.d@proton.me',           phone: '(555) 200-3012', jobId: 3,  status: 'new',        appliedDate: '2024-03-14', resume: 'harper_davis_resume.pdf',    rating: 3, notes: 'Good content marketing samples, referral from Karen.',    interviewDate: null, interviewTime: null },
    { id: 13, name: 'Daniel Lee',        email: 'daniel.lee@gmail.com',         phone: '(555) 200-3013', jobId: 10, status: 'screening',  appliedDate: '2024-03-16', resume: 'daniel_lee_cv.pdf',          rating: 4, notes: 'SRE background at AWS, impressive operational depth.',    interviewDate: null, interviewTime: null },
    { id: 14, name: 'Zoe Martin',        email: 'zoe.martin@yahoo.com',         phone: '(555) 200-3014', jobId: 5,  status: 'new',        appliedDate: '2024-03-17', resume: 'zoe_martin_resume.pdf',      rating: 2, notes: 'Entry level, no HR experience but enthusiastic.',        interviewDate: null, interviewTime: null },
    { id: 15, name: 'Jack Turner',       email: 'jack.turner@icloud.com',       phone: '(555) 200-3015', jobId: 7,  status: 'interview',  appliedDate: '2024-03-13', resume: 'jack_turner_resume.pdf',     rating: 3, notes: 'Available M/W/F, reliable transportation.',              interviewDate: '2024-03-26', interviewTime: '10:30' }
  ],

  departments: [
    { id: 1, name: 'Engineering',  color: '#6366f1', headId: 1,  budget: 2500000 },
    { id: 2, name: 'Design',       color: '#ec4899', headId: 2,  budget: 800000 },
    { id: 3, name: 'Marketing',    color: '#f59e0b', headId: 3,  budget: 1200000 },
    { id: 4, name: 'Sales',        color: '#10b981', headId: 4,  budget: 1800000 },
    { id: 5, name: 'HR',           color: '#8b5cf6', headId: 20, budget: 600000 },
    { id: 6, name: 'Finance',      color: '#06b6d4', headId: 14, budget: 500000 },
    { id: 7, name: 'Operations',   color: '#f97316', headId: 7,  budget: 900000 },
    { id: 8, name: 'Product',      color: '#ef4444', headId: 8,  budget: 700000 }
  ],

  timeoffRequests: [
    { id: 1,  employeeId: 1,  type: 'vacation',  startDate: '2024-04-01', endDate: '2024-04-05', days: 5,  status: 'approved', reason: 'Family trip to Portugal',               requestDate: '2024-03-10' },
    { id: 2,  employeeId: 3,  type: 'sick',      startDate: '2024-03-18', endDate: '2024-03-19', days: 2,  status: 'approved', reason: 'Flu recovery',                          requestDate: '2024-03-18' },
    { id: 3,  employeeId: 5,  type: 'personal',  startDate: '2024-04-10', endDate: '2024-04-10', days: 1,  status: 'pending',  reason: 'Moving to new apartment',               requestDate: '2024-03-20' },
    { id: 4,  employeeId: 9,  type: 'vacation',  startDate: '2024-05-20', endDate: '2024-05-31', days: 10, status: 'pending',  reason: 'Summer holiday in Japan',               requestDate: '2024-03-15' },
    { id: 5,  employeeId: 17, type: 'parental',  startDate: '2024-04-15', endDate: '2024-07-15', days: 66, status: 'approved', reason: 'Parental leave — new baby',              requestDate: '2024-02-28' },
    { id: 6,  employeeId: 12, type: 'vacation',  startDate: '2024-04-22', endDate: '2024-04-26', days: 5,  status: 'pending',  reason: 'Wedding anniversary trip',              requestDate: '2024-03-22' },
    { id: 7,  employeeId: 2,  type: 'sick',      startDate: '2024-03-25', endDate: '2024-03-25', days: 1,  status: 'approved', reason: 'Dental appointment',                    requestDate: '2024-03-24' },
    { id: 8,  employeeId: 6,  type: 'personal',  startDate: '2024-04-08', endDate: '2024-04-08', days: 1,  status: 'rejected', reason: 'Need to handle personal errands',        requestDate: '2024-03-25' },
    { id: 9,  employeeId: 14, type: 'vacation',  startDate: '2024-06-10', endDate: '2024-06-21', days: 10, status: 'pending',  reason: 'European road trip',                    requestDate: '2024-03-18' },
    { id: 10, employeeId: 4,  type: 'sick',      startDate: '2024-03-20', endDate: '2024-03-21', days: 2,  status: 'approved', reason: 'Back pain, doctor visit',                requestDate: '2024-03-20' },
    { id: 11, employeeId: 16, type: 'vacation',  startDate: '2024-04-29', endDate: '2024-05-03', days: 5,  status: 'pending',  reason: 'Extended weekend trip to Austin',        requestDate: '2024-03-26' },
    { id: 12, employeeId: 11, type: 'personal',  startDate: '2024-04-15', endDate: '2024-04-15', days: 1,  status: 'pending',  reason: 'Volunteering at local school event',     requestDate: '2024-03-27' }
  ],

  reviews: [
    { id: 1,  employeeId: 1,  reviewerId: 8,  cycle: 'Q1 2024', rating: 4.5, goals: 'Ship design system v2, reduce bundle size by 30%',          comments: 'Alice consistently delivers high-quality work and mentors junior engineers effectively.',  status: 'completed', date: '2024-03-15' },
    { id: 2,  employeeId: 2,  reviewerId: 8,  cycle: 'Q1 2024', rating: 4.0, goals: 'Complete accessibility audit, launch new component library',  comments: 'Brian produces excellent design work but could improve on meeting deadlines.',             status: 'completed', date: '2024-03-16' },
    { id: 3,  employeeId: 9,  reviewerId: 1,  cycle: 'Q1 2024', rating: 3.5, goals: 'Migrate authentication service, reduce API latency by 20%',  comments: 'Isabel is a solid contributor who needs to take more ownership of cross-team projects.',   status: 'submitted', date: '2024-03-17' },
    { id: 4,  employeeId: 4,  reviewerId: 20, cycle: 'Q1 2024', rating: 5.0, goals: 'Close 3 enterprise deals, expand APAC pipeline',             comments: 'David exceeded all targets this quarter. Exceptional performance across the board.',       status: 'completed', date: '2024-03-14' },
    { id: 5,  employeeId: 12, reviewerId: 4,  cycle: 'Q1 2024', rating: 3.0, goals: 'Increase outbound meetings by 25%, improve demo conversion',  comments: 'Lucas is ramping well but needs to strengthen discovery calls.',                           status: 'submitted', date: '2024-03-18' },
    { id: 6,  employeeId: 6,  reviewerId: 14, cycle: 'Q1 2024', rating: 4.0, goals: 'Automate monthly reporting, build ARR dashboard',             comments: 'Frank delivers accurate analysis on time. Could take more initiative on process improvements.', status: 'completed', date: '2024-03-13' },
    { id: 7,  employeeId: 17, reviewerId: 1,  cycle: 'Q4 2023', rating: 4.5, goals: 'Achieve 99.9% uptime, migrate to Kubernetes',                 comments: 'Quinn is a cornerstone of our infrastructure. Pipeline reliability is at an all-time high.', status: 'completed', date: '2023-12-20' },
    { id: 8,  employeeId: 13, reviewerId: 20, cycle: 'Q1 2024', rating: 3.5, goals: 'Fill 5 engineering roles, reduce time-to-hire to 30 days',    comments: 'Mia is building strong sourcing channels. Candidate quality is improving.',               status: 'draft',     date: '2024-03-19' },
    { id: 9,  employeeId: 19, reviewerId: 1,  cycle: 'Q1 2024', rating: 4.0, goals: 'Increase test coverage to 85%, set up E2E pipeline',          comments: 'Samuel championed quality improvements that significantly reduced regression bugs.',       status: 'submitted', date: '2024-03-20' },
    { id: 10, employeeId: 7,  reviewerId: 20, cycle: 'Q1 2024', rating: 3.5, goals: 'Renegotiate vendor contracts, streamline procurement process', comments: 'Grace is reliable and organized. Should delegate more to scale her impact.',              status: 'draft',     date: '2024-03-21' }
  ],

  training: [
    { id: 1, title: 'Leadership Essentials',           category: 'Management',         duration: '2 days',  capacity: 20, enrolled: 12, enrolledIds: [1, 4, 7, 8, 14, 20, 3, 2, 6, 17, 9, 11], instructor: 'Dr. Sarah Mitchell',  status: 'active',    description: 'Core leadership skills for new and aspiring managers.',   startDate: '2024-04-01' },
    { id: 2, title: 'Advanced SQL for Analytics',      category: 'Technical',          duration: '4 hours', capacity: 15, enrolled: 8,  enrolledIds: [6, 9, 14, 19, 1, 10, 5, 16],               instructor: 'Prof. Kevin Yang',    status: 'active',    description: 'Complex queries, window functions, and query optimization.', startDate: '2024-04-05' },
    { id: 3, title: 'Inclusive Hiring Practices',      category: 'HR & Compliance',    duration: '3 hours', capacity: 30, enrolled: 18, enrolledIds: [5, 13, 20, 1, 2, 3, 4, 7, 8, 10, 11, 12, 14, 15, 16, 17, 18, 19], instructor: 'Angela Rivera, J.D.', status: 'upcoming', description: 'Building equitable hiring pipelines and reducing bias.',    startDate: '2024-04-15' },
    { id: 4, title: 'OWASP Top 10 Security Training',  category: 'Security',           duration: '1 day',   capacity: 25, enrolled: 6,  enrolledIds: [1, 9, 17, 19, 16, 8],                      instructor: 'Marcus Chen, CISSP',  status: 'upcoming',  description: 'Web application security fundamentals for developers.',    startDate: '2024-04-20' },
    { id: 5, title: 'Effective Sales Presentations',   category: 'Sales',              duration: '2 hours', capacity: 12, enrolled: 5,  enrolledIds: [4, 12, 18, 7, 3],                          instructor: 'Lisa Park',           status: 'completed', description: 'Storytelling techniques and objection handling.',           startDate: '2024-02-15' },
    { id: 6, title: 'Figma for Non-Designers',         category: 'Design',             duration: '90 min',  capacity: 10, enrolled: 10, enrolledIds: [1, 3, 4, 5, 6, 7, 8, 13, 14, 15],         instructor: 'Brian Chen',          status: 'completed', description: 'Basic prototyping and design feedback skills.',             startDate: '2024-01-20' }
  ],

  documents: [
    { id: 1, name: 'Employee Handbook 2024',          type: 'pdf',  size: '4.2 MB',  uploadedBy: 'Tanya Patel',    uploadDate: '2024-01-10', category: 'Policies' },
    { id: 2, name: 'Remote Work Policy',              type: 'pdf',  size: '1.1 MB',  uploadedBy: 'Tanya Patel',    uploadDate: '2024-01-15', category: 'Policies' },
    { id: 3, name: 'Offer Letter Template',           type: 'docx', size: '245 KB',  uploadedBy: 'Elena Vasquez',  uploadDate: '2024-02-01', category: 'Templates' },
    { id: 4, name: 'Q1 2024 Headcount Report',        type: 'xlsx', size: '3.8 MB',  uploadedBy: 'Nathan Brooks',  uploadDate: '2024-03-15', category: 'Reports' },
    { id: 5, name: 'NDA Agreement',                   type: 'pdf',  size: '520 KB',  uploadedBy: 'Tanya Patel',    uploadDate: '2023-11-20', category: 'Contracts' },
    { id: 6, name: 'Benefits Summary 2024',           type: 'pdf',  size: '2.1 MB',  uploadedBy: 'Elena Vasquez',  uploadDate: '2024-01-05', category: 'Policies' },
    { id: 7, name: 'Office Floor Plan',               type: 'png',  size: '8.7 MB',  uploadedBy: 'Olivia Sanders', uploadDate: '2024-02-20', category: 'Other' },
    { id: 8, name: 'Contractor Agreement Template',   type: 'docx', size: '310 KB',  uploadedBy: 'Nathan Brooks',  uploadDate: '2024-03-01', category: 'Templates' }
  ],

  calendar: [
    { id: 1,  title: 'Engineering Standup',       date: '2024-03-25', time: '09:30', endTime: '09:45', type: 'meeting',   attendees: [1, 9, 17, 19],     location: 'Zoom — Engineering Room' },
    { id: 2,  title: 'Interview — Jordan Ellis',  date: '2024-03-20', time: '10:00', endTime: '11:00', type: 'interview', attendees: [1, 13],            location: 'Conference Room B' },
    { id: 3,  title: 'Q1 Review Deadline',        date: '2024-03-22', time: '17:00', endTime: '17:00', type: 'deadline',  attendees: [],                 location: '' },
    { id: 4,  title: 'All-Hands Meeting',         date: '2024-03-27', time: '14:00', endTime: '15:00', type: 'meeting',   attendees: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], location: 'Main Auditorium' },
    { id: 5,  title: 'Benefits Open Enrollment',  date: '2024-04-01', time: '09:00', endTime: '17:00', type: 'event',     attendees: [],                 location: 'HR Portal' },
    { id: 6,  title: 'Interview — Ava Washington', date: '2024-03-22', time: '11:00', endTime: '12:00', type: 'interview', attendees: [2, 10, 13],       location: 'Conference Room A' },
    { id: 7,  title: 'Sales Pipeline Review',     date: '2024-03-26', time: '10:00', endTime: '11:00', type: 'meeting',   attendees: [4, 12, 18],        location: 'Zoom — Sales Channel' },
    { id: 8,  title: 'Leadership Essentials Kickoff', date: '2024-04-01', time: '09:00', endTime: '17:00', type: 'training', attendees: [1, 4, 7, 8, 14, 20], location: 'Training Lab' },
    { id: 9,  title: 'Interview — Ethan Zhao',    date: '2024-03-25', time: '09:00', endTime: '10:00', type: 'interview', attendees: [4, 12],            location: 'Zoom — Sales Channel' },
    { id: 10, title: 'Product Roadmap Planning',   date: '2024-03-28', time: '13:00', endTime: '14:30', type: 'meeting',   attendees: [8, 16, 1, 2],     location: 'Conference Room C' },
    { id: 11, title: 'Payroll Processing Deadline', date: '2024-03-29', time: '12:00', endTime: '12:00', type: 'deadline', attendees: [14, 6],            location: '' },
    { id: 12, title: 'Interview — Alexander Bennett', date: '2024-03-28', time: '15:00', endTime: '16:00', type: 'interview', attendees: [1, 9, 13],     location: 'Conference Room B' },
    { id: 13, title: 'Design Critique Session',    date: '2024-03-29', time: '14:00', endTime: '15:30', type: 'meeting',   attendees: [2, 10, 16],        location: 'Design Studio' },
    { id: 14, title: 'Interview — Jack Turner',    date: '2024-03-26', time: '10:30', endTime: '11:15', type: 'interview', attendees: [7, 15],            location: 'Conference Room A' },
    { id: 15, title: 'OWASP Security Training',    date: '2024-04-20', time: '09:00', endTime: '17:00', type: 'training',  attendees: [1, 9, 17, 19, 16, 8], location: 'Training Lab' }
  ],

  /* BUG-038: Inconsistent date formats across notifications */
  /* BUG-045: Notification id=15 has read: undefined instead of boolean */
  notifications: [
    { id: 1,  type: 'info',    message: 'Q1 performance reviews are now open for submission.',                  date: '2024-03-15',             read: false, link: '#reviews' },
    { id: 2,  type: 'task',    message: 'You have 3 pending time-off requests to review.',                      date: 'March 16, 2024',         read: false, link: '#timeoff' },          /* BUG-038: long date format */
    { id: 3,  type: 'success', message: 'Charlotte Adams has accepted the offer for Senior Frontend Engineer.', date: '2024-03-17T09:00:00Z',   read: true,  link: '#candidates' },       /* BUG-038: ISO with time */
    { id: 4,  type: 'info',    message: 'Benefits open enrollment begins April 1.',                             date: '2024-03-18',             read: true,  link: '#calendar' },
    { id: 5,  type: 'warning', message: 'Payroll processing deadline is March 29.',                             date: 'Mar 19 2024',            read: false, link: '#payroll' },           /* BUG-038: short format */
    { id: 6,  type: 'task',    message: 'Complete your self-assessment for Q1 review cycle.',                   date: '2024-03-19',             read: false, link: '#reviews' },
    { id: 7,  type: 'info',    message: 'New job posting: Backend Platform Engineer is now live.',               date: '2024-03-08',             read: true,  link: '#jobs' },
    { id: 8,  type: 'success', message: 'Leadership Essentials training enrollment is confirmed.',               date: 'March 20, 2024',         read: true,  link: '#training' },         /* BUG-038: long date format */
    { id: 9,  type: 'warning', message: 'Employee Quinn Harper has started parental leave.',                    date: '2024-03-21',             read: true,  link: '#employees/17' },
    { id: 10, type: 'task',    message: 'Review interview feedback for Ethan Zhao before Friday.',              date: '2024-03-22T14:30:00Z',   read: false, link: '#candidates/7' },     /* BUG-038: ISO with time */
    { id: 11, type: 'info',    message: 'Company all-hands meeting scheduled for March 27.',                    date: '2024-03-22',             read: true,  link: '#calendar' },
    { id: 12, type: 'success', message: 'Figma for Non-Designers training completed successfully.',             date: 'Jan 20, 2024',           read: true,  link: '#training' },         /* BUG-038: short format */
    { id: 13, type: 'warning', message: 'Budget utilization for Marketing is at 87% of quarterly allocation.',  date: '2024-03-23',             read: false, link: '#departments/3' },
    { id: 14, type: 'task',    message: 'Approve contractor agreement for Technical Writer position.',          date: 'March 24, 2024',         read: false, link: '#documents' },        /* BUG-038: long date format */
    { id: 15, type: 'info',    message: 'System maintenance scheduled for Sunday 2:00 AM UTC.',                 date: '2024-03-24',             read: undefined, link: '#settings' },      /* BUG-045: read is undefined — causes NaN in badge count */
    { id: 16, type: 'task',    message: 'Schedule onboarding for Charlotte Adams starting April 1.',            date: '2024-03-25',             read: false, link: '#onboarding' },
    { id: 17, type: 'info',    message: 'New document uploaded: Q1 2024 Headcount Report.',                     date: '2024-03-15',             read: true,  link: '#documents' },
    { id: 18, type: 'warning', message: '2 employees have upcoming work anniversaries this month.',             date: 'Mar 26 2024',            read: true,  link: '#employees' },        /* BUG-038: short format */
    { id: 19, type: 'success', message: 'Inclusive Hiring Practices training is fully enrolled.',                date: '2024-03-26T11:00:00Z',   read: true,  link: '#training' },         /* BUG-038: ISO with time */
    { id: 20, type: 'task',    message: 'Finalize job description for Contract Technical Writer.',              date: '2024-03-27',             read: false, link: '#jobs/8' }
  ],

  onboarding: [
    { id: 1, name: 'Charlotte Adams',  departmentId: 1, items: [
      { id: 1, text: 'Complete I-9 verification',      completed: true },
      { id: 2, text: 'Set up workstation and accounts', completed: true },
      { id: 3, text: 'Review employee handbook',       completed: false },
      { id: 4, text: 'Meet with engineering manager',   completed: false },
      { id: 5, text: 'Complete security training',     completed: false }
    ]},
    { id: 2, name: 'Rachel Green',     departmentId: 4, items: [
      { id: 1, text: 'Complete I-9 verification',      completed: true },
      { id: 2, text: 'Set up Salesforce access',       completed: true },
      { id: 3, text: 'Shadow senior AE for one week',  completed: true },
      { id: 4, text: 'Complete product training',      completed: false },
      { id: 5, text: 'Review sales playbook',          completed: false }
    ]},
    { id: 3, name: 'Olivia Sanders',   departmentId: 7, items: [
      { id: 1, text: 'Complete I-9 verification',         completed: true },
      { id: 2, text: 'Office tour and safety walkthrough', completed: true },
      { id: 3, text: 'Meet facilities team',              completed: true },
      { id: 4, text: 'Review vendor contracts',           completed: true },
      { id: 5, text: 'Complete procurement system training', completed: false }
    ]},
    { id: 4, name: 'Mia Thompson',     departmentId: 5, items: [
      { id: 1, text: 'Complete I-9 verification',      completed: true },
      { id: 2, text: 'Set up ATS access',              completed: true },
      { id: 3, text: 'Review hiring policies',         completed: true },
      { id: 4, text: 'Shadow senior recruiter',        completed: true },
      { id: 5, text: 'Complete inclusive hiring training', completed: true }
    ]},
    { id: 5, name: 'Karen Liu',        departmentId: 3, items: [
      { id: 1, text: 'Complete I-9 verification',      completed: true },
      { id: 2, text: 'Set up CMS and analytics access', completed: true },
      { id: 3, text: 'Review brand guidelines',        completed: true },
      { id: 4, text: 'Meet content team lead',         completed: true },
      { id: 5, text: 'Publish first blog post',        completed: false }
    ]}
  ],

  /* BUG-033: Employee id=15 (Olivia Sanders, startDate 2024-01-08) and id=18 (Rachel Green, startDate 2024-02-01)
     started mid-period but receive full baseSalary without proration */
  payroll: [
    { employeeId: 1,  baseSalary: 12083.33, bonus: 2000, deductions: 3200, netPay: 10883.33, period: 'March 2024', startDate: '2021-03-15' },
    { employeeId: 2,  baseSalary: 10416.67, bonus: 0,    deductions: 2600, netPay: 7816.67,  period: 'March 2024', startDate: '2022-01-10' },
    { employeeId: 3,  baseSalary: 9583.33,  bonus: 500,  deductions: 2400, netPay: 7683.33,  period: 'March 2024', startDate: '2021-08-20' },
    { employeeId: 4,  baseSalary: 12916.67, bonus: 5000, deductions: 3800, netPay: 14116.67, period: 'March 2024', startDate: '2020-05-01' },
    { employeeId: 5,  baseSalary: 7083.33,  bonus: 0,    deductions: 1800, netPay: 5283.33,  period: 'March 2024', startDate: '2023-02-14' },
    { employeeId: 6,  baseSalary: 7916.67,  bonus: 0,    deductions: 2000, netPay: 5916.67,  period: 'March 2024', startDate: '2022-06-01' },
    { employeeId: 7,  baseSalary: 9166.67,  bonus: 0,    deductions: 2300, netPay: 6866.67,  period: 'March 2024', startDate: '2021-11-15' },
    { employeeId: 8,  baseSalary: 11250.00, bonus: 1000, deductions: 2800, netPay: 9450.00,  period: 'March 2024', startDate: '2022-04-18' },
    { employeeId: 9,  baseSalary: 10833.33, bonus: 0,    deductions: 2700, netPay: 8133.33,  period: 'March 2024', startDate: '2022-09-01' },
    { employeeId: 10, baseSalary: 8750.00,  bonus: 0,    deductions: 2200, netPay: 6550.00,  period: 'March 2024', startDate: '2023-01-16' },
    { employeeId: 11, baseSalary: 7666.67,  bonus: 0,    deductions: 1900, netPay: 5766.67,  period: 'March 2024', startDate: '2023-03-01' },
    { employeeId: 12, baseSalary: 8333.33,  bonus: 750,  deductions: 2100, netPay: 6983.33,  period: 'March 2024', startDate: '2023-05-15' },
    { employeeId: 13, baseSalary: 6500.00,  bonus: 0,    deductions: 1600, netPay: 4900.00,  period: 'March 2024', startDate: '2023-07-01' },
    { employeeId: 14, baseSalary: 11666.67, bonus: 1500, deductions: 3100, netPay: 10066.67, period: 'March 2024', startDate: '2020-09-01' },
    /* BUG-033: Olivia started 2024-01-08 (mid-month) but baseSalary is full monthly amount, not prorated */
    { employeeId: 15, baseSalary: 5666.67,  bonus: 0,    deductions: 1400, netPay: 4266.67,  period: 'March 2024', startDate: '2024-01-08' },
    { employeeId: 16, baseSalary: 9833.33,  bonus: 0,    deductions: 2500, netPay: 7333.33,  period: 'March 2024', startDate: '2022-10-01' },
    { employeeId: 17, baseSalary: 11500.00, bonus: 0,    deductions: 2900, netPay: 8600.00,  period: 'March 2024', startDate: '2021-06-15' },
    /* BUG-033: Rachel started 2024-02-01 but her March entry uses full baseSalary; first month (Feb) should have been prorated */
    { employeeId: 18, baseSalary: 5416.67,  bonus: 0,    deductions: 1350, netPay: 4066.67,  period: 'March 2024', startDate: '2024-02-01' },
    { employeeId: 19, baseSalary: 9333.33,  bonus: 0,    deductions: 2350, netPay: 6983.33,  period: 'March 2024', startDate: '2022-08-15' },
    { employeeId: 20, baseSalary: 13750.00, bonus: 3000, deductions: 3600, netPay: 13150.00, period: 'March 2024', startDate: '2020-01-15' }
  ],

  settings: {
    companyName: 'TalentFlow Inc.',
    timezone: 'UTC-5',
    dateFormat: 'MM/DD/YYYY',
    language: 'en',
    notifications: { email: true, push: true, slack: false },
    security: { mfa: false, passwordExpiry: 90, sessionTimeout: 0 }  /* BUG-084: sessionTimeout is 0 — never enforced */
  },

  /* ---- Helper functions ---- */
  getEmployee: function(id) {
    return this.employees.find(function(e) { return e.id === id; });
  },

  getJob: function(id) {
    return this.jobs.find(function(j) { return j.id === id; });
  },

  getDepartment: function(id) {
    return this.departments.find(function(d) { return d.id === id; });
  },

  getDepartmentName: function(id) {
    var d = this.getDepartment(id);
    return d ? d.name : 'Unknown';
  },

  getEmployeesByDepartment: function(deptId) {
    return this.employees.filter(function(e) { return e.departmentId === deptId; });
  },

  getStatusColor: function(status) {
    var colors = {
      active: '#10b981', inactive: '#6b7280', 'on-leave': '#f59e0b',
      open: '#10b981', closed: '#6b7280', draft: '#8b5cf6',
      new: '#3b82f6', screening: '#f59e0b', interview: '#8b5cf6', offer: '#10b981', rejected: '#ef4444', hired: '#059669',
      pending: '#f59e0b', approved: '#10b981',
      submitted: '#3b82f6', completed: '#10b981',
      upcoming: '#3b82f6',
      info: '#3b82f6', warning: '#f59e0b', success: '#10b981', task: '#8b5cf6'
    };
    return colors[status] || '#6b7280';
  }
};
