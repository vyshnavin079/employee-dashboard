const sourceEmployees = typeof employees !== "undefined" ? employees : [];
const sourceRewardHistory = typeof rewardHistory !== "undefined" ? rewardHistory : [];
const sourceAdminAccount = typeof adminAccount !== "undefined" ? adminAccount : null;
const sourceDailyAttendance = typeof dailyAttendance !== "undefined" ? dailyAttendance : [];
const sourceLeaveRequests = typeof leaveRequests !== "undefined" ? leaveRequests : [];
const sourceFeedbackEntries = typeof feedbackEntries !== "undefined" ? feedbackEntries : [];
const sourceAiRecommendations = typeof aiRecommendations !== "undefined" ? aiRecommendations : [];

const STORAGE_KEY = "employee-dashboard-employees";
const REWARD_HISTORY_KEY = "employee-dashboard-reward-history";
const ATTENDANCE_KEY = "employee-dashboard-attendance-logs";
const LEAVE_KEY = "employee-dashboard-leave-requests";
const FEEDBACK_KEY = "employee-dashboard-feedback";
const AI_KEY = "employee-dashboard-ai-recommendations";
const SESSION_KEY = "employee-dashboard-session";
const ADMIN_STORAGE_KEY = "employee-dashboard-admin-account";

const state = {
  employees: loadEmployees(),
  admin: loadAdminAccount(),
  rewardHistory: loadArray(REWARD_HISTORY_KEY, sourceRewardHistory),
  attendanceLogs: loadArray(ATTENDANCE_KEY, sourceDailyAttendance),
  leaveRequests: loadArray(LEAVE_KEY, sourceLeaveRequests),
  feedbackEntries: loadArray(FEEDBACK_KEY, sourceFeedbackEntries),
  aiRecommendations: loadArray(AI_KEY, sourceAiRecommendations)
};

function loadArray(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [...fallback];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...fallback];
  } catch (_error) {
    return [...fallback];
  }
}

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
}

function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function currentUser() {
  const session = getSession();
  if (!session?.id) return null;
  if (session.id === "ADMIN") return state.admin || sourceAdminAccount || session;
  return state.employees.find((e) => e.id === session.id) || null;
}

function isPrivileged(user) {
  const role = user?.accessRole || user?.role || "";
  return role === "admin" || role === "manager";
}

function visibleEmployees() {
  const user = currentUser();
  if (!user) return [];
  if (isPrivileged(user)) return state.employees;
  return state.employees.filter((e) => e.id === user.id);
}

function employeeNameById(id) {
  return state.employees.find((e) => e.id === id)?.name || id;
}

function requireAuthOnProtectedPages() {
  const path = (window.location.pathname || "").toLowerCase();
  if (path.endsWith("/") || path.endsWith("/index.html") || path.endsWith("index.html")) return;
  const user = currentUser();
  if (!user) window.location.href = "index.html";
}

function initTopbarUserUI() {
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;
  const user = currentUser();
  if (!user) return;
  let actions = document.getElementById("topbar-actions");
  if (!actions) {
    actions = document.createElement("div");
    actions.id = "topbar-actions";
    actions.className = "topbar-actions";
    topbar.appendChild(actions);
  }
  const initials = (user.name || "User")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  actions.innerHTML = `
    <div class="user-chip">
      <div class="avatar">${initials}</div>
      <div>
        <div class="user-name">${user.name || user.id}</div>
        <div class="muted user-role">${user.accessRole || "employee"}</div>
      </div>
    </div>
    <button id="logout-btn" class="btn-secondary" type="button">Logout</button>
  `;
  actions.querySelector("#logout-btn")?.addEventListener("click", () => {
    clearSession();
    window.location.href = "index.html";
  });
}

function loadEmployees() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...sourceEmployees];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [...sourceEmployees];
  } catch (_error) {
    return [...sourceEmployees];
  }
}

function loadAdminAccount() {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return sourceAdminAccount;
    return JSON.parse(raw);
  } catch (_error) {
    return sourceAdminAccount;
  }
}

function saveAdminAccount() {
  if (!state.admin) return;
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(state.admin));
}

function saveEmployees() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.employees));
}

function clampPercent(value, fallback = 0) {
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.max(0, Math.min(100, n));
}

function appSummary() {
  const list = visibleEmployees();
  const total = list.length;
  const present = list.filter((e) => e.attendanceStatus === "Present").length;
  const absent = list.filter((e) => e.attendanceStatus === "Absent").length;
  const onLeave = list.filter((e) => e.attendanceStatus === "Leave").length;
  const topPerformer = [...list].sort((a, b) => b.performanceScore - a.performanceScore)[0] || { name: "N/A" };
  const rewards = list.reduce((acc, item) => acc + (Number(item.rewardPoints) || 0), 0);
  return { total, present, absent, onLeave, topPerformer, rewards };
}

function statusClass(status) {
  return (status || "").toLowerCase();
}

function ensureSelectEmployees(selectId, includeAllOption = false) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const list = visibleEmployees();
  select.innerHTML = "";
  if (includeAllOption) {
    select.innerHTML += `<option value="All">All Employees</option>`;
  }
  list.forEach((emp) => {
    select.innerHTML += `<option value="${emp.id}">${emp.name} (${emp.id})</option>`;
  });
}

function renderDashboard() {
  const root = document.getElementById("dashboard-cards");
  if (!root) return;
  const summary = appSummary();
  const cards = [
    { icon: "👥", label: "Total Employees", value: summary.total, color: "#5d3fd3" },
    { icon: "✅", label: "Present Employees", value: summary.present, color: "#16a34a" },
    { icon: "❌", label: "Absent Employees", value: summary.absent, color: "#ef4444" },
    { icon: "🛫", label: "Employees on Leave", value: summary.onLeave, color: "#f59e0b" },
    { icon: "🏆", label: "Top Performer", value: summary.topPerformer.name, color: "#3e63ff" },
    { icon: "🎁", label: "Total Rewards Given", value: summary.rewards, color: "#8b5cf6" }
  ];
  root.innerHTML = cards
    .map(
      (card) => `
    <article class="card">
      <div class="icon" style="background:${card.color}">${card.icon}</div>
      <div class="value">${card.value}</div>
      <div class="muted">${card.label}</div>
    </article>
  `
    )
    .join("");

  const attendanceCtx = document.getElementById("attendanceChart");
  const perfCtx = document.getElementById("performanceChart");
  if (attendanceCtx && typeof Chart !== "undefined") {
    const list = visibleEmployees();
    new Chart(attendanceCtx, {
      type: "doughnut",
      data: {
        labels: ["Present", "Absent", "Leave", "Late"],
        datasets: [
          {
            data: [
              list.filter((e) => e.attendanceStatus === "Present").length,
              list.filter((e) => e.attendanceStatus === "Absent").length,
              list.filter((e) => e.attendanceStatus === "Leave").length,
              list.filter((e) => e.attendanceStatus === "Late").length
            ],
            backgroundColor: ["#16a34a", "#ef4444", "#f59e0b", "#fb923c"]
          }
        ]
      }
    });
  }
  if (perfCtx && typeof Chart !== "undefined") {
    const list = visibleEmployees();
    new Chart(perfCtx, {
      type: "bar",
      data: {
        labels: list.map((e) => e.name.split(" ")[0]),
        datasets: [
          {
            label: "Performance Score",
            data: list.map((e) => e.performanceScore),
            backgroundColor: "#5d3fd3"
          }
        ]
      },
      options: { scales: { y: { beginAtZero: true, max: 100 } } }
    });
  }
}

function employeesTemplate(list) {
  return list
    .map(
      (emp) => `
    <tr>
      <td>${emp.name}</td>
      <td>${emp.id}</td>
      <td>${emp.department}</td>
      <td>${emp.role}</td>
      <td>${emp.email}</td>
      <td><span class="status ${statusClass(emp.attendanceStatus)}">${emp.attendanceStatus}</span></td>
      <td>${Number(emp.performanceScore) || 0}</td>
      <td>${Number(emp.rewardPoints) || 0}</td>
      <td>
        <button class="btn-secondary" data-action="edit" data-id="${emp.id}">Edit</button>
        <button class="btn-danger" data-action="delete" data-id="${emp.id}">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

function renderEmployees() {
  const tableBody = document.getElementById("employees-body");
  if (!tableBody) return;
  const search = document.getElementById("employee-search");
  const deptFilter = document.getElementById("department-filter");
  const query = (search?.value || "").trim().toLowerCase();
  const dept = deptFilter?.value || "All";
  const list = visibleEmployees();
  const filtered = list.filter((emp) => {
    const matchesText =
      emp.name.toLowerCase().includes(query) ||
      emp.id.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query);
    const matchesDept = dept === "All" || emp.department === dept;
    return matchesText && matchesDept;
  });
  tableBody.innerHTML = employeesTemplate(filtered);
}

function nextEmployeeId() {
  const max = state.employees.reduce((acc, emp) => {
    const number = Number((emp.id || "").replace("EMP-", ""));
    return Number.isNaN(number) ? acc : Math.max(acc, number);
  }, 1000);
  return `EMP-${max + 1}`;
}

function formToEmployee(form) {
  const id = form.querySelector("#form-id").value || nextEmployeeId();
  const existing = state.employees.find((e) => e.id === id) || null;
  const name = form.querySelector("#form-name").value.trim();
  return {
    id,
    name,
    department: form.querySelector("#form-department").value.trim(),
    role: form.querySelector("#form-role").value.trim(),
    email: form.querySelector("#form-email").value.trim(),
    loginPin: existing?.loginPin || String(id).replace("EMP-", ""),
    accessRole: existing?.accessRole || "employee",
    attendanceStatus: form.querySelector("#form-attendance").value,
    performanceScore: clampPercent(form.querySelector("#form-performance").value, 0),
    rewardPoints: Math.max(0, Number(form.querySelector("#form-rewards").value) || 0),
    taskCompletion: clampPercent(form.querySelector("#form-task").value, 0),
    productivity: clampPercent(form.querySelector("#form-productivity").value, 0),
    attendancePercent: clampPercent(form.querySelector("#form-attendance-percent").value, 0),
    badges: existing?.badges || [],
    bonusEligible: existing?.bonusEligible || false,
    photo: existing?.photo || `https://i.pravatar.cc/80?u=${id}`
  };
}

function fillEmployeeForm(employee) {
  const form = document.getElementById("employee-form");
  if (!form) return;
  const isNewEmployee = !employee;
  form.querySelector("#form-id").value = employee?.id || "";
  form.querySelector("#form-name").value = employee?.name || "";
  form.querySelector("#form-department").value = employee?.department || "";
  form.querySelector("#form-role").value = employee?.role || "";
  form.querySelector("#form-email").value = employee?.email || "";
  form.querySelector("#form-attendance").value = employee?.attendanceStatus || "Present";
  form.querySelector("#form-performance").value = isNewEmployee ? "" : employee?.performanceScore ?? "";
  form.querySelector("#form-rewards").value = isNewEmployee ? "" : employee?.rewardPoints ?? "";
  form.querySelector("#form-task").value = isNewEmployee ? "" : employee?.taskCompletion ?? "";
  form.querySelector("#form-productivity").value = isNewEmployee ? "" : employee?.productivity ?? "";
  form.querySelector("#form-attendance-percent").value = isNewEmployee ? "" : employee?.attendancePercent ?? "";
}

function toggleEmployeeForm(show) {
  const card = document.getElementById("employee-form-card");
  if (!card) return;
  card.classList.toggle("hidden", !show);
}

function upsertEmployee(employee) {
  const index = state.employees.findIndex((e) => e.id === employee.id);
  if (index >= 0) state.employees[index] = employee;
  else state.employees.push(employee);
  saveEmployees();
}

function handleEmployeeActions(event) {
  const button = event.target.closest("button");
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  const user = currentUser();
  if (!isPrivileged(user) && (action === "edit" || action === "delete")) {
    alert("Only admin/manager can edit or delete employees.");
    return;
  }
  if (action === "edit") {
    const emp = state.employees.find((e) => e.id === id);
    if (!emp) return;
    fillEmployeeForm(emp);
    toggleEmployeeForm(true);
    return;
  }
  if (action === "delete") {
    state.employees = state.employees.filter((e) => e.id !== id);
    saveEmployees();
    renderEmployees();
  }
}

function renderAttendance() {
  const listRoot = document.getElementById("daily-attendance");
  if (listRoot) {
    const list = visibleEmployees();
    listRoot.innerHTML = list
      .map((employee) => {
        const latest = state.attendanceLogs
          .filter((log) => log.employeeId === employee.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        const status = latest?.status || employee.attendanceStatus || "N/A";
        return `<div class="rank-card"><span>${employee.name}</span><span class="status ${statusClass(status)}">${status}</span></div>`;
      })
      .join("");
  }

  const monthCtx = document.getElementById("monthlyAttendanceChart");
  if (monthCtx && typeof Chart !== "undefined") {
    new Chart(monthCtx, {
      type: "line",
      data: {
        labels: ["W1", "W2", "W3", "W4"],
        datasets: [
          {
            label: "Attendance %",
            data: [87, 91, 89, 94],
            borderColor: "#5d3fd3",
            backgroundColor: "rgba(93, 63, 211, 0.12)",
            fill: true,
            tension: 0.35
          }
        ]
      },
      options: { scales: { y: { beginAtZero: true, max: 100 } } }
    });
  }

  const list = visibleEmployees();
  const totalEmployees = list.length || 1;
  const percent = Math.round((list.filter((e) => e.attendanceStatus === "Present").length / totalEmployees) * 100);
  const bar = document.getElementById("attendance-percent-bar");
  const text = document.getElementById("attendance-percent-text");
  if (bar && text) {
    bar.style.width = `${percent}%`;
    text.textContent = `${percent}% Overall Attendance`;
  }

  const leaveBody = document.getElementById("leave-body");
  if (leaveBody) {
    leaveBody.innerHTML = state.leaveRequests
      .filter((req) => isPrivileged(currentUser()) || req.employeeId === currentUser()?.id)
      .map(
        (req) => `<tr>
        <td>${req.id}</td>
        <td>${employeeNameById(req.employeeId)}</td>
        <td>${req.dateFrom}</td>
        <td>${req.dateTo}</td>
        <td>${req.reason}</td>
        <td><span class="status ${statusClass(req.status)}">${req.status}</span></td>
      </tr>`
      )
      .join("");
  }
}

function renderPerformance() {
  const ranking = document.getElementById("ranking-list");
  if (ranking) {
    const top = [...visibleEmployees()].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5);
    ranking.innerHTML = top
      .map(
        (emp, i) => `
      <div class="rank-card">
        <strong>#${i + 1} ${emp.name}</strong>
        <span>${emp.performanceScore}</span>
      </div>
      <div class="progress"><span style="width:${clampPercent(emp.productivity)}%"></span></div>
    `
      )
      .join("");
  }

  const perf = document.getElementById("productivityChart");
  if (perf && typeof Chart !== "undefined") {
    new Chart(perf, {
      type: "radar",
      data: {
        labels: ["Task Completion", "Productivity", "Attendance", "Quality", "Collaboration"],
        datasets: [
          {
            label: "Team Avg",
            data: [84, 83, 92, 86, 88],
            borderColor: "#3e63ff",
            backgroundColor: "rgba(62, 99, 255, 0.18)"
          }
        ]
      },
      options: { scales: { r: { beginAtZero: true, max: 100 } } }
    });
  }
}

function renderRewards() {
  const monthCard = document.getElementById("employee-of-month");
  if (monthCard) {
    const list = visibleEmployees();
    if (!list.length) {
      monthCard.innerHTML = "<h3>Employee of the Month</h3><p class='muted'>No employees available.</p>";
      return;
    }
    const best = [...list].sort((a, b) => b.rewardPoints - a.rewardPoints)[0];
    const badgePills = (best.badges || []).map((badge) => `<span class="badge-pill">🏅 ${badge}</span>`).join("");
    monthCard.innerHTML = `
      <h3>Employee of the Month</h3>
      <div class="employee-cell">
        <div>
          <div class="value">${best.name}</div>
          <div class="muted">${best.role}</div>
        </div>
      </div>
      <p><strong>${best.rewardPoints}</strong> reward points earned</p>
      <p class="muted">Bonus Eligible: ${best.bonusEligible ? "Yes" : "No"}</p>
      <div class="badge-pills">${badgePills || "<span class='muted'>No badges assigned yet.</span>"}</div>
    `;
  }

  const achievements = document.getElementById("achievements");
  if (achievements) {
    const top = [...visibleEmployees()].sort((a, b) => b.rewardPoints - a.rewardPoints).slice(0, 4);
    achievements.innerHTML = top
      .map(
        (emp) => `
      <div class="rank-card">
        <div>
          <span>${emp.name}</span>
          <div class="badge-pills">
            ${(emp.badges || []).slice(0, 2).map((badge) => `<span class="badge-pill">🏅 ${badge}</span>`).join("")}
          </div>
        </div>
        <strong>${emp.rewardPoints} pts</strong>
      </div>
    `
      )
      .join("");
  }

  const historyBody = document.getElementById("reward-history-body");
  if (historyBody) {
    historyBody.innerHTML = state.rewardHistory
      .filter((entry) => isPrivileged(currentUser()) || entry.employeeId === currentUser()?.id)
      .map((entry) => {
        const emp = state.employees.find((e) => e.id === entry.employeeId);
        return `
          <tr>
            <td>${entry.date}</td>
            <td>${emp ? emp.name : entry.employeeId}</td>
            <td>${entry.reason}</td>
            <td>${entry.points}</td>
            <td>${entry.bonusType || "N/A"}</td>
            <td>${entry.bonusValue ?? "-"}</td>
          </tr>
        `;
      })
      .join("");
  }
}

function renderFeedback() {
  const body = document.getElementById("feedback-body");
  if (!body) return;
  body.innerHTML = state.feedbackEntries
    .filter((entry) => isPrivileged(currentUser()) || entry.toEmployeeId === currentUser()?.id)
    .map(
      (entry) => `<tr>
      <td>${entry.date}</td>
      <td>${employeeNameById(entry.toEmployeeId)}</td>
      <td>${entry.by}</td>
      <td>${entry.category}</td>
      <td>${entry.rating}</td>
      <td>${entry.sentiment}</td>
      <td>${entry.comment}</td>
    </tr>`
    )
    .join("");
}

function renderAiInsights() {
  const body = document.getElementById("ai-recommendation-body");
  if (!body) return;
  body.innerHTML = state.aiRecommendations
    .filter((entry) => isPrivileged(currentUser()) || entry.employeeId === currentUser()?.id)
    .map(
      (entry) => `<tr>
      <td>${employeeNameById(entry.employeeId)}</td>
      <td>${entry.recommendedPoints}</td>
      <td>${entry.recommendedBonusType}</td>
      <td><span class="status ${entry.fairnessFlag === "Fair" ? "present" : "late"}">${entry.fairnessFlag}</span></td>
      <td>${entry.explanation}</td>
      <td>${entry.approved ? "Approved" : "Pending Review"}</td>
    </tr>`
    )
    .join("");
}

function bindEmployeesPage() {
  const search = document.getElementById("employee-search");
  const department = document.getElementById("department-filter");
  const addBtn = document.getElementById("add-employee");
  const deleteAllBtn = document.getElementById("delete-all-employees");
  const cancelBtn = document.getElementById("cancel-employee");
  const form = document.getElementById("employee-form");
  const tableBody = document.getElementById("employees-body");
  if (!tableBody) return;
  const canManage = isPrivileged(currentUser());
  if (!canManage) {
    addBtn?.classList.add("hidden");
    deleteAllBtn?.classList.add("hidden");
    document.getElementById("employee-form-card")?.classList.add("hidden");
  }
  search?.addEventListener("input", renderEmployees);
  department?.addEventListener("change", renderEmployees);
  addBtn?.addEventListener("click", () => {
    fillEmployeeForm(null);
    toggleEmployeeForm(true);
  });
  cancelBtn?.addEventListener("click", () => {
    toggleEmployeeForm(false);
    form?.reset();
  });
  deleteAllBtn?.addEventListener("click", () => {
    if (!confirm("Delete all employees?")) return;
    state.employees = [];
    saveEmployees();
    renderEmployees();
  });
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!canManage) return;
    const employee = formToEmployee(form);
    if (!employee.name || !employee.department || !employee.role || !employee.email) {
      alert("Please fill all required details.");
      return;
    }
    upsertEmployee(employee);
    renderEmployees();
    toggleEmployeeForm(false);
    form.reset();
  });
  tableBody.addEventListener("click", handleEmployeeActions);
  renderEmployees();
}

function bindAttendancePage() {
  const attendanceForm = document.getElementById("attendance-form");
  const leaveForm = document.getElementById("leave-form");
  if (!attendanceForm && !leaveForm) return;

  ensureSelectEmployees("attendance-employee");
  ensureSelectEmployees("leave-employee");
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("attendance-date");
  if (dateInput && !dateInput.value) dateInput.value = today;

  attendanceForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const employeeId = document.getElementById("attendance-employee")?.value;
    const date = document.getElementById("attendance-date")?.value;
    const status = document.getElementById("attendance-status")?.value;
    if (!employeeId || !date || !status) return;
    state.attendanceLogs.push({ employeeId, date, status });
    saveArray(ATTENDANCE_KEY, state.attendanceLogs);
    const employee = state.employees.find((e) => e.id === employeeId);
    if (employee) employee.attendanceStatus = status;
    saveEmployees();
    renderAttendance();
    attendanceForm.reset();
    if (dateInput) dateInput.value = today;
  });

  leaveForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const employeeId = document.getElementById("leave-employee")?.value;
    const dateFrom = document.getElementById("leave-from")?.value;
    const dateTo = document.getElementById("leave-to")?.value;
    const reason = document.getElementById("leave-reason")?.value?.trim();
    if (!employeeId || !dateFrom || !dateTo || !reason) return;
    const req = {
      id: `LR-${String(state.leaveRequests.length + 1).padStart(3, "0")}`,
      employeeId,
      dateFrom,
      dateTo,
      reason,
      status: isPrivileged(currentUser()) ? "Approved" : "Pending"
    };
    state.leaveRequests.push(req);
    saveArray(LEAVE_KEY, state.leaveRequests);
    renderAttendance();
    leaveForm.reset();
  });
}

function bindFeedbackPage() {
  const form = document.getElementById("feedback-form");
  if (!form) return;
  ensureSelectEmployees("feedback-employee");
  const select = document.getElementById("feedback-employee");
  if (select && !select.firstElementChild) {
    select.innerHTML = "<option value=''>No employees</option>";
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const toEmployeeId = document.getElementById("feedback-employee")?.value;
    const by = document.getElementById("feedback-by")?.value?.trim();
    const category = document.getElementById("feedback-category")?.value;
    const rating = Number(document.getElementById("feedback-rating")?.value || 0);
    const comment = document.getElementById("feedback-comment")?.value?.trim();
    if (!toEmployeeId || !by || !category || !rating || !comment) return;
    const sentiment = rating >= 4 ? "Positive" : rating <= 2 ? "Needs Attention" : "Neutral";
    state.feedbackEntries.unshift({
      id: `FB-${String(state.feedbackEntries.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().split("T")[0],
      toEmployeeId,
      by,
      rating,
      category,
      comment,
      sentiment
    });
    saveArray(FEEDBACK_KEY, state.feedbackEntries);
    renderFeedback();
    form.reset();
  });
  renderFeedback();
}

function runAiModelInBrowser() {
  const recommendations = state.employees.map((emp) => {
    const feedbackForEmp = state.feedbackEntries.filter((f) => f.toEmployeeId === emp.id);
    const avgFeedback =
      feedbackForEmp.length > 0
        ? feedbackForEmp.reduce((acc, item) => acc + Number(item.rating || 0), 0) / feedbackForEmp.length
        : 3.5;
    const score =
      0.3 * Number(emp.attendancePercent || 0) +
      0.35 * Number(emp.performanceScore || 0) +
      0.25 * Number(emp.productivity || 0) +
      0.1 * (avgFeedback * 20);
    const recommendedPoints = Math.round(score);
    const recommendedBonusType =
      score >= 90 ? "Performance Bonus" : score >= 80 ? "Gift Card" : score >= 70 ? "Learning Voucher" : "Coaching Plan";
    const fairnessFlag = Number(emp.attendanceStatus === "Leave") ? "Fair" : score < 55 ? "Needs Review" : "Fair";
    return {
      employeeId: emp.id,
      recommendedPoints,
      recommendedBonusType,
      fairnessFlag,
      explanation: `Attendance ${emp.attendancePercent}%, performance ${emp.performanceScore}, productivity ${emp.productivity}, feedback ${avgFeedback.toFixed(1)}/5.`,
      approved: false
    };
  });
  state.aiRecommendations = recommendations;
  saveArray(AI_KEY, state.aiRecommendations);
}

function bindAiInsightsPage() {
  // New redesigned AI Insights page is handled by ai-insights.js
  if (document.getElementById("employee-search-ai")) return;
  const exportBtn = document.getElementById("export-ai-data");
  const runBtn = document.getElementById("run-ai-recommendation");
  if (!exportBtn && !runBtn) return;
  const status = document.getElementById("ai-run-status");

  exportBtn?.addEventListener("click", () => {
    const payload = {
      employees: state.employees,
      attendanceLogs: state.attendanceLogs,
      feedbackEntries: state.feedbackEntries,
      rewards: state.rewardHistory
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reward-system-export.json";
    a.click();
    URL.revokeObjectURL(url);
    if (status) status.textContent = "Exported dataset for Power BI / Python ML pipeline.";
  });

  runBtn?.addEventListener("click", () => {
    runAiModelInBrowser();
    renderAiInsights();
    if (status) {
      status.textContent =
        "AI recommendations updated. For production use Python/ML model output and review fairness flags before approval.";
    }
  });

  renderAiInsights();
}

function bindAuth() {
  const form = document.getElementById("login-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = (document.getElementById("login-id")?.value || "").trim().toUpperCase();
    const pin = (document.getElementById("login-pin")?.value || "").trim();
    const matchedEmployee = state.employees.find((e) => String(e.id).toUpperCase() === id && String(e.loginPin) === pin);
    const matchedAdmin = state.admin && String(state.admin.id).toUpperCase() === id && String(state.admin.loginPin) === pin;
    if (!matchedEmployee && !matchedAdmin) {
      alert("Invalid Employee ID or PIN.");
      return;
    }
    const sessionUser = matchedAdmin ? state.admin : matchedEmployee;
    setSession({ id: sessionUser.id, accessRole: sessionUser.accessRole, name: sessionUser.name });
    window.location.href = "dashboard.html";
  });
}

function isValidPin(pin) {
  return /^\d{4,}$/.test(pin);
}

function bindSettingsPage() {
  const ownForm = document.getElementById("change-pin-form");
  if (!ownForm) return;
  const user = currentUser();
  if (!user) return;
  const adminCard = document.getElementById("admin-pin-card");
  if (isPrivileged(user)) adminCard?.classList.remove("hidden");

  ownForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const currentPin = document.getElementById("current-pin")?.value?.trim() || "";
    const newPin = document.getElementById("new-pin")?.value?.trim() || "";
    const confirmPin = document.getElementById("confirm-new-pin")?.value?.trim() || "";
    if (newPin !== confirmPin) return alert("New PIN and confirm PIN do not match.");
    if (!isValidPin(newPin)) return alert("PIN must be numeric and at least 4 digits.");
    if (user.id === "ADMIN") {
      if (String(state.admin?.loginPin || "") !== currentPin) return alert("Current PIN is incorrect.");
      state.admin.loginPin = newPin;
      saveAdminAccount();
      ownForm.reset();
      return alert("Admin PIN updated successfully.");
    }
    const employee = state.employees.find((e) => e.id === user.id);
    if (!employee) return;
    if (String(employee.loginPin || "") !== currentPin) return alert("Current PIN is incorrect.");
    employee.loginPin = newPin;
    saveEmployees();
    ownForm.reset();
    alert("Your PIN updated successfully.");
  });

  const resetForm = document.getElementById("reset-pin-form");
  resetForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!isPrivileged(user)) return;
    const targetId = (document.getElementById("target-employee-id")?.value || "").trim().toUpperCase();
    const nextPin = (document.getElementById("target-new-pin")?.value || "").trim();
    if (!isValidPin(nextPin)) return alert("PIN must be numeric and at least 4 digits.");
    if (targetId === "ADMIN") {
      state.admin.loginPin = nextPin;
      saveAdminAccount();
      resetForm.reset();
      return alert("Admin PIN reset successfully.");
    }
    const employee = state.employees.find((e) => String(e.id).toUpperCase() === targetId);
    if (!employee) return alert("Employee ID not found.");
    employee.loginPin = nextPin;
    saveEmployees();
    resetForm.reset();
    alert(`PIN reset for ${employee.name}.`);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  requireAuthOnProtectedPages();
  bindAuth();
  initTopbarUserUI();
  renderDashboard();
  bindEmployeesPage();
  bindAttendancePage();
  bindFeedbackPage();
  bindAiInsightsPage();
  bindSettingsPage();
  renderAttendance();
  renderPerformance();
  renderRewards();
});
