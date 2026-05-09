const employees = [
  {
    id: "EMP-1001",
    name: "Aarav Sharma",
    department: "Engineering",
    role: "Frontend Developer",
    email: "aarav.sharma@company.com",
    loginPin: "1001",
    accessRole: "employee",
    attendanceStatus: "Present",
    performanceScore: 92,
    rewardPoints: 320,
    taskCompletion: 90,
    productivity: 88,
    attendancePercent: 96,
    badges: ["Consistency Star"],
    bonusEligible: true,
    photo: "https://i.pravatar.cc/80?img=12"
  },
  {
    id: "EMP-1002",
    name: "Diya Patel",
    department: "HR",
    role: "HR Manager",
    email: "diya.patel@company.com",
    loginPin: "1002",
    accessRole: "manager",
    attendanceStatus: "Leave",
    performanceScore: 84,
    rewardPoints: 220,
    taskCompletion: 86,
    productivity: 82,
    attendancePercent: 93,
    badges: ["Team Player"],
    bonusEligible: false,
    photo: "https://i.pravatar.cc/80?img=47"
  },
  {
    id: "EMP-1003",
    name: "Kabir Singh",
    department: "Engineering",
    role: "Backend Developer",
    email: "kabir.singh@company.com",
    loginPin: "1003",
    accessRole: "employee",
    attendanceStatus: "Present",
    performanceScore: 95,
    rewardPoints: 410,
    taskCompletion: 94,
    productivity: 91,
    attendancePercent: 98,
    badges: ["Top Performer", "Quality Hero"],
    bonusEligible: true,
    photo: "https://i.pravatar.cc/80?img=14"
  },
  {
    id: "EMP-1004",
    name: "Meera Iyer",
    department: "Design",
    role: "UI/UX Designer",
    email: "meera.iyer@company.com",
    loginPin: "1004",
    accessRole: "employee",
    attendanceStatus: "Late",
    performanceScore: 79,
    rewardPoints: 180,
    taskCompletion: 75,
    productivity: 80,
    attendancePercent: 88,
    badges: ["Design Thinker"],
    bonusEligible: false,
    photo: "https://i.pravatar.cc/80?img=45"
  },
  {
    id: "EMP-1005",
    name: "Rohan Verma",
    department: "Sales",
    role: "Sales Executive",
    email: "rohan.verma@company.com",
    loginPin: "1005",
    accessRole: "employee",
    attendanceStatus: "Absent",
    performanceScore: 73,
    rewardPoints: 140,
    taskCompletion: 70,
    productivity: 74,
    attendancePercent: 81,
    badges: [],
    bonusEligible: false,
    photo: "https://i.pravatar.cc/80?img=60"
  },
  {
    id: "EMP-1006",
    name: "Ananya Gupta",
    department: "Engineering",
    role: "QA Engineer",
    email: "ananya.gupta@company.com",
    loginPin: "1006",
    accessRole: "employee",
    attendanceStatus: "Present",
    performanceScore: 87,
    rewardPoints: 260,
    taskCompletion: 88,
    productivity: 86,
    attendancePercent: 94,
    badges: ["Bug Bash Pro"],
    bonusEligible: false,
    photo: "https://i.pravatar.cc/80?img=28"
  },
  {
    id: "EMP-1007",
    name: "Vihaan Rao",
    department: "Marketing",
    role: "Content Strategist",
    email: "vihaan.rao@company.com",
    loginPin: "1007",
    accessRole: "employee",
    attendanceStatus: "Present",
    performanceScore: 82,
    rewardPoints: 205,
    taskCompletion: 81,
    productivity: 80,
    attendancePercent: 90,
    badges: ["Campaign Champion"],
    bonusEligible: false,
    photo: "https://i.pravatar.cc/80?img=31"
  },
  {
    id: "EMP-1008",
    name: "Sara Khan",
    department: "Finance",
    role: "Financial Analyst",
    email: "sara.khan@company.com",
    loginPin: "1008",
    accessRole: "employee",
    attendanceStatus: "Present",
    performanceScore: 89,
    rewardPoints: 300,
    taskCompletion: 87,
    productivity: 89,
    attendancePercent: 95,
    badges: ["Accuracy Ace"],
    bonusEligible: true,
    photo: "https://i.pravatar.cc/80?img=5"
  }
];

// Demo admin login (Employee ID + PIN)
// Use: ADMIN / 0000 on the login page
const adminAccount = {
  id: "ADMIN",
  name: "System Admin",
  accessRole: "admin",
  loginPin: "0000"
};

const rewardHistory = [
  { date: "2026-05-02", employeeId: "EMP-1003", reason: "Sprint excellence", points: 80, bonusType: "Gift Card", bonusValue: 4000 },
  { date: "2026-05-03", employeeId: "EMP-1001", reason: "Design improvement", points: 50, bonusType: "Meal Voucher", bonusValue: 1500 },
  { date: "2026-05-04", employeeId: "EMP-1008", reason: "Quarter close support", points: 60, bonusType: "Performance Bonus", bonusValue: 6000 },
  { date: "2026-05-05", employeeId: "EMP-1006", reason: "Bug bash ownership", points: 45, bonusType: "Extra Leave Day", bonusValue: 1 },
  { date: "2026-05-06", employeeId: "EMP-1007", reason: "Campaign launch", points: 35, bonusType: "Spot Bonus", bonusValue: 2500 }
];

const leaveRequests = [
  { id: "LR-001", employeeId: "EMP-1002", dateFrom: "2026-05-09", dateTo: "2026-05-10", reason: "Family event", status: "Approved" },
  { id: "LR-002", employeeId: "EMP-1005", dateFrom: "2026-05-12", dateTo: "2026-05-12", reason: "Medical checkup", status: "Pending" }
];

const feedbackEntries = [
  {
    id: "FB-001",
    date: "2026-05-06",
    toEmployeeId: "EMP-1003",
    by: "Diya Patel",
    rating: 5,
    category: "Collaboration",
    comment: "Excellent mentoring support for new team members.",
    sentiment: "Positive"
  },
  {
    id: "FB-002",
    date: "2026-05-07",
    toEmployeeId: "EMP-1001",
    by: "Sara Khan",
    rating: 4,
    category: "Ownership",
    comment: "Handled sprint blockers quickly and clearly.",
    sentiment: "Positive"
  }
];

const aiRecommendations = [
  {
    employeeId: "EMP-1003",
    recommendedPoints: 110,
    recommendedBonusType: "Performance Bonus",
    fairnessFlag: "Fair",
    explanation: "High performance, high productivity, and positive feedback trend.",
    approved: true
  },
  {
    employeeId: "EMP-1005",
    recommendedPoints: 30,
    recommendedBonusType: "Learning Voucher",
    fairnessFlag: "Needs Review",
    explanation: "Low attendance and task completion. Suggest coaching-linked reward.",
    approved: false
  }
];

const dailyAttendance = [
  { employeeId: "EMP-1001", date: "2026-05-09", status: "Present" },
  { employeeId: "EMP-1002", date: "2026-05-09", status: "Leave" },
  { employeeId: "EMP-1003", date: "2026-05-09", status: "Present" },
  { employeeId: "EMP-1004", date: "2026-05-09", status: "Late" },
  { employeeId: "EMP-1005", date: "2026-05-09", status: "Absent" },
  { employeeId: "EMP-1006", date: "2026-05-09", status: "Present" },
  { employeeId: "EMP-1007", date: "2026-05-09", status: "Present" },
  { employeeId: "EMP-1008", date: "2026-05-09", status: "Present" }
];
