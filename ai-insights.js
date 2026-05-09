(function () {
  const aiRows = [];
  let filteredRows = [];
  let performanceChart;
  let attendanceChart;
  let rewardsChart;

  function employeesData() {
    try {
      const raw = localStorage.getItem("employee-dashboard-employees");
      return raw ? JSON.parse(raw) : window.employees || [];
    } catch (_error) {
      return window.employees || [];
    }
  }

  function feedbackData() {
    try {
      const raw = localStorage.getItem("employee-dashboard-feedback");
      return raw ? JSON.parse(raw) : window.feedbackEntries || [];
    } catch (_error) {
      return window.feedbackEntries || [];
    }
  }

  function attendanceData() {
    try {
      const raw = localStorage.getItem("employee-dashboard-attendance-logs");
      return raw ? JSON.parse(raw) : window.dailyAttendance || [];
    } catch (_error) {
      return window.dailyAttendance || [];
    }
  }

  function rewardData() {
    try {
      const raw = localStorage.getItem("employee-dashboard-reward-history");
      return raw ? JSON.parse(raw) : window.rewardHistory || [];
    } catch (_error) {
      return window.rewardHistory || [];
    }
  }

  function riskLabel(score) {
    if (score >= 85) return "Low";
    if (score >= 70) return "Medium";
    return "High";
  }

  function recommendationLabel(score) {
    if (score >= 90) return "Excellent - Promote visibility";
    if (score >= 80) return "Strong - Reward and retain";
    if (score >= 70) return "Good - Coaching + reward";
    return "Needs support plan";
  }

  function rewardSuggestion(score) {
    if (score >= 90) return "Performance Bonus + Top Performer Badge";
    if (score >= 80) return "Gift Card + Team Star Badge";
    if (score >= 70) return "Learning Voucher + Growth Badge";
    return "Mentorship Plan + Improvement Badge";
  }

  function aiScore(emp, feedback, attendanceLogs) {
    const employeeFeedback = feedback.filter((f) => f.toEmployeeId === emp.id);
    const avgFeedback = employeeFeedback.length
      ? employeeFeedback.reduce((acc, item) => acc + Number(item.rating || 0), 0) / employeeFeedback.length
      : 3.5;

    const empAttendance = attendanceLogs.filter((a) => a.employeeId === emp.id);
    const presentCount = empAttendance.filter((a) => a.status === "Present").length;
    const attendancePct = empAttendance.length ? (presentCount / empAttendance.length) * 100 : emp.attendancePercent || 0;

    const score =
      0.3 * attendancePct +
      0.35 * Number(emp.performanceScore || 0) +
      0.25 * Number(emp.productivity || 0) +
      0.1 * avgFeedback * 20;

    return Math.round(score);
  }

  function buildAiRows() {
    const emps = employeesData();
    const feedback = feedbackData();
    const attendanceLogs = attendanceData();
    aiRows.length = 0;

    emps.forEach((emp) => {
      const score = aiScore(emp, feedback, attendanceLogs);
      aiRows.push({
        id: emp.id,
        name: emp.name,
        department: emp.department,
        aiScore: score,
        recommendation: recommendationLabel(score),
        risk: riskLabel(score),
        rewardSuggestion: rewardSuggestion(score),
        approval: score >= 80 ? "Approved" : "Pending Review"
      });
    });
    filteredRows = [...aiRows];
  }

  function setWidgetValues() {
    const emps = employeesData();
    const rewards = rewardData();
    const attendanceLogs = attendanceData();
    const present = attendanceLogs.filter((x) => x.status === "Present").length;
    const attendancePct = attendanceLogs.length ? Math.round((present / attendanceLogs.length) * 100) : 0;
    const avgPerformance = emps.length
      ? Math.round(emps.reduce((acc, item) => acc + Number(item.performanceScore || 0), 0) / emps.length)
      : 0;
    const pending = filteredRows.filter((row) => row.approval !== "Approved").length;
    const totalRewardPoints = rewards.reduce((acc, item) => acc + Number(item.points || 0), 0);

    document.getElementById("w-total").textContent = emps.length;
    document.getElementById("w-performance").textContent = `${avgPerformance}%`;
    document.getElementById("w-attendance").textContent = `${attendancePct}%`;
    document.getElementById("w-rewards").textContent = totalRewardPoints;
    document.getElementById("w-pending").textContent = pending;

    const avgAi = filteredRows.length
      ? Math.round(filteredRows.reduce((acc, item) => acc + item.aiScore, 0) / filteredRows.length)
      : 0;
    const burnoutRisk = filteredRows.some((r) => r.risk === "High") ? "Medium" : "Low";
    const fairness = filteredRows.filter((r) => r.risk === "High").length <= 1 ? "Balanced" : "Review Needed";
    const engagement = Math.min(99, Math.max(30, avgAi + 5));

    document.getElementById("ai-performance-score").textContent = avgAi;
    document.getElementById("ai-productivity").textContent = `${Math.round(avgPerformance * 0.97)}%`;
    document.getElementById("ai-trend").textContent = attendancePct > 85 ? "Positive" : "Needs Improvement";
    document.getElementById("ai-burnout").textContent = burnoutRisk;
    document.getElementById("ai-fairness").textContent = fairness;
    document.getElementById("ai-engagement").textContent = `${engagement}%`;
    document.getElementById("ai-recommendations-summary").textContent =
      `${filteredRows.filter((r) => r.approval === "Approved").length} recommendations ready for approval.`;

    const top = [...filteredRows].sort((a, b) => b.aiScore - a.aiScore).slice(0, 3);
    document.getElementById("top-performers").innerHTML = top
      .map((item) => `<div class="rank-card"><strong>${item.name}</strong><span>${item.aiScore}</span></div>`)
      .join("");
  }

  function riskClass(risk) {
    if (risk === "Low") return "present";
    if (risk === "Medium") return "late";
    return "absent";
  }

  function renderTable() {
    const body = document.getElementById("ai-recommendation-body");
    body.innerHTML = filteredRows
      .map(
        (row) => `<tr>
      <td>${row.name}</td>
      <td>${row.aiScore}</td>
      <td>${row.recommendation}</td>
      <td><span class="status ${riskClass(row.risk)}">${row.risk}</span></td>
      <td>${row.rewardSuggestion}</td>
      <td>${row.approval}</td>
      <td>
        <button class="btn-secondary action-btn" data-id="${row.id}" data-action="approve">Approve</button>
        <button class="btn-danger action-btn" data-id="${row.id}" data-action="review">Review</button>
      </td>
    </tr>`
      )
      .join("");
  }

  function fillDepartmentFilter() {
    const select = document.getElementById("department-filter-ai");
    const depts = [...new Set(aiRows.map((r) => r.department))];
    depts.forEach((dept) => {
      const option = document.createElement("option");
      option.value = dept;
      option.textContent = dept;
      select.appendChild(option);
    });
  }

  function applyFiltersAndSort() {
    const q = (document.getElementById("employee-search-ai").value || "").trim().toLowerCase();
    const dept = document.getElementById("department-filter-ai").value || "All";
    const sort = document.getElementById("sort-ai-table").value;

    filteredRows = aiRows.filter((row) => {
      const passSearch = row.name.toLowerCase().includes(q);
      const passDept = dept === "All" || row.department === dept;
      return passSearch && passDept;
    });

    if (sort === "score-desc") filteredRows.sort((a, b) => b.aiScore - a.aiScore);
    if (sort === "score-asc") filteredRows.sort((a, b) => a.aiScore - b.aiScore);
    if (sort === "name-asc") filteredRows.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "risk-desc") {
      const rank = { High: 3, Medium: 2, Low: 1 };
      filteredRows.sort((a, b) => rank[b.risk] - rank[a.risk]);
    }
    renderTable();
    setWidgetValues();
    renderCharts();
  }

  function destroyCharts() {
    if (performanceChart) performanceChart.destroy();
    if (attendanceChart) attendanceChart.destroy();
    if (rewardsChart) rewardsChart.destroy();
  }

  function renderCharts() {
    destroyCharts();
    const top8 = [...filteredRows].sort((a, b) => b.aiScore - a.aiScore).slice(0, 8);

    performanceChart = new Chart(document.getElementById("performance-bar-chart"), {
      type: "bar",
      data: {
        labels: top8.map((x) => x.name.split(" ")[0]),
        datasets: [{ label: "AI Score", data: top8.map((x) => x.aiScore), backgroundColor: "#5d3fd3" }]
      },
      options: { scales: { y: { beginAtZero: true, max: 100 } } }
    });

    attendanceChart = new Chart(document.getElementById("attendance-line-chart"), {
      type: "line",
      data: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        datasets: [
          {
            label: "Attendance %",
            data: [82, 86, 88, 90],
            borderColor: "#3e63ff",
            backgroundColor: "rgba(62, 99, 255, 0.15)",
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: { scales: { y: { beginAtZero: true, max: 100 } } }
    });

    const low = filteredRows.filter((x) => x.risk === "Low").length;
    const medium = filteredRows.filter((x) => x.risk === "Medium").length;
    const high = filteredRows.filter((x) => x.risk === "High").length;
    rewardsChart = new Chart(document.getElementById("rewards-pie-chart"), {
      type: "pie",
      data: {
        labels: ["Low Risk Reward", "Medium Risk Reward", "High Risk Review"],
        datasets: [{ data: [low, medium, high], backgroundColor: ["#16a34a", "#f59e0b", "#ef4444"] }]
      }
    });
  }

  function bindTableActions() {
    const body = document.getElementById("ai-recommendation-body");
    body.addEventListener("click", (event) => {
      const btn = event.target.closest(".action-btn");
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const row = aiRows.find((r) => r.id === id);
      if (!row) return;
      if (action === "approve") row.approval = "Approved";
      if (action === "review") row.approval = "Pending Review";
      applyFiltersAndSort();
    });
  }

  function bindThemeToggle() {
    const btn = document.getElementById("theme-toggle");
    btn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const dark = document.body.classList.contains("dark-mode");
      btn.textContent = dark ? "☀️ Light" : "🌙 Dark";
    });
  }

  function bindProfileDropdown() {
    const btn = document.getElementById("profile-btn");
    const menu = document.getElementById("profile-menu");
    btn.addEventListener("click", () => menu.classList.toggle("hidden"));
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".profile-dropdown")) menu.classList.add("hidden");
    });
  }

  function bindNotifications() {
    const btn = document.getElementById("notification-btn");
    btn.addEventListener("click", () => {
      alert("3 new AI alerts: 1 burnout risk, 1 fairness review, 1 reward approval.");
    });
  }

  function bindRunSimulation() {
    const runBtn = document.getElementById("run-ai-recommendation");
    const loading = document.getElementById("ai-loading");
    const status = document.getElementById("ai-run-status");
    runBtn.addEventListener("click", () => {
      loading.classList.remove("hidden");
      status.textContent = "AI simulation running...";
      setTimeout(() => {
        aiRows.forEach((row) => {
          const delta = Math.floor(Math.random() * 7) - 3;
          row.aiScore = Math.max(45, Math.min(99, row.aiScore + delta));
          row.risk = riskLabel(row.aiScore);
          row.recommendation = recommendationLabel(row.aiScore);
          row.rewardSuggestion = rewardSuggestion(row.aiScore);
          row.approval = row.aiScore >= 80 ? "Approved" : "Pending Review";
        });
        loading.classList.add("hidden");
        status.textContent = "AI recommendation logic completed. Results refreshed.";
        applyFiltersAndSort();
      }, 1300);
    });
  }

  function bindExport() {
    document.getElementById("export-ai-data").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(filteredRows, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-employee-recommendations.json";
      a.click();
      URL.revokeObjectURL(url);
      document.getElementById("ai-run-status").textContent =
        "Export complete. Use this in Python/ML, Power BI, or Copilot analysis workflows.";
    });
  }

  function init() {
    if (!document.getElementById("employee-search-ai")) return;
    buildAiRows();
    fillDepartmentFilter();
    bindThemeToggle();
    bindProfileDropdown();
    bindNotifications();
    bindRunSimulation();
    bindExport();
    bindTableActions();

    document.getElementById("employee-search-ai").addEventListener("input", applyFiltersAndSort);
    document.getElementById("department-filter-ai").addEventListener("change", applyFiltersAndSort);
    document.getElementById("sort-ai-table").addEventListener("change", applyFiltersAndSort);
    applyFiltersAndSort();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
