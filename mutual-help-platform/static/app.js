const tokenKey = "mutual_help_token";

const el = {
  username: document.getElementById("username"),
  password: document.getElementById("password"),
  registerBtn: document.getElementById("registerBtn"),
  loginBtn: document.getElementById("loginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  sessionInfo: document.getElementById("sessionInfo"),
  pointsText: document.getElementById("pointsText"),
  refreshPointsBtn: document.getElementById("refreshPointsBtn"),
  taskTitle: document.getElementById("taskTitle"),
  taskDesc: document.getElementById("taskDesc"),
  taskCriteria: document.getElementById("taskCriteria"),
  taskReward: document.getElementById("taskReward"),
  taskDeadline: document.getElementById("taskDeadline"),
  publishTaskBtn: document.getElementById("publishTaskBtn"),
  refreshTasksBtn: document.getElementById("refreshTasksBtn"),
  taskSearchQ: document.getElementById("taskSearchQ"),
  taskStatusFilter: document.getElementById("taskStatusFilter"),
  taskMinReward: document.getElementById("taskMinReward"),
  taskMaxReward: document.getElementById("taskMaxReward"),
  taskSort: document.getElementById("taskSort"),
  taskPrevPageBtn: document.getElementById("taskPrevPageBtn"),
  taskNextPageBtn: document.getElementById("taskNextPageBtn"),
  taskPaginationText: document.getElementById("taskPaginationText"),
  tasksList: document.getElementById("tasksList"),
  detailTaskId: document.getElementById("detailTaskId"),
  loadTaskBtn: document.getElementById("loadTaskBtn"),
  taskDetail: document.getElementById("taskDetail"),
  answerContent: document.getElementById("answerContent"),
  answerLinks: document.getElementById("answerLinks"),
  submitAnswerBtn: document.getElementById("submitAnswerBtn"),
  bestAnswerId: document.getElementById("bestAnswerId"),
  selectBestBtn: document.getElementById("selectBestBtn"),
  logBox: document.getElementById("logBox"),
  reportTargetType: document.getElementById("reportTargetType"),
  reportTargetId: document.getElementById("reportTargetId"),
  reportReason: document.getElementById("reportReason"),
  reportEvidence: document.getElementById("reportEvidence"),
  submitReportBtn: document.getElementById("submitReportBtn"),
  loadPendingReportsBtn: document.getElementById("loadPendingReportsBtn"),
  reportStatusFilter: document.getElementById("reportStatusFilter"),
  reportTargetTypeFilter: document.getElementById("reportTargetTypeFilter"),
  reportPrevPageBtn: document.getElementById("reportPrevPageBtn"),
  reportNextPageBtn: document.getElementById("reportNextPageBtn"),
  reportPaginationText: document.getElementById("reportPaginationText"),
  pendingReports: document.getElementById("pendingReports"),
  resolveReportId: document.getElementById("resolveReportId"),
  resolveDecision: document.getElementById("resolveDecision"),
  resolveNote: document.getElementById("resolveNote"),
  resolveReportBtn: document.getElementById("resolveReportBtn"),
};

const taskState = { page: 1, pageSize: 10, hasNext: false, total: 0 };
const reportState = { page: 1, pageSize: 10, hasNext: false, total: 0 };

function log(message, data) {
  const line = `[${new Date().toLocaleTimeString()}] ${message}`;
  const extra = data ? `\n${JSON.stringify(data, null, 2)}` : "";
  el.logBox.textContent = `${line}${extra}\n${el.logBox.textContent}`;
}

function getToken() {
  return localStorage.getItem(tokenKey) || "";
}

function setToken(token) {
  if (token) localStorage.setItem(tokenKey, token);
  else localStorage.removeItem(tokenKey);
}

async function api(path, method = "GET", body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || `HTTP ${res.status}`);
  }
  return payload;
}

async function refreshSession() {
  const token = getToken();
  if (!token) {
    el.sessionInfo.textContent = "未登录";
    return;
  }
  try {
    const me = await api("/api/me");
    const role = me.user.is_admin ? "管理员" : "普通用户";
    el.sessionInfo.textContent = `已登录: ${me.user.username} (ID ${me.user.id}, ${role})`;
  } catch {
    setToken("");
    el.sessionInfo.textContent = "会话已过期，请重新登录";
  }
}

async function refreshPoints() {
  try {
    const info = await api("/api/me/points");
    el.pointsText.textContent = `可用: ${info.available_points} | 冻结: ${info.frozen_points} | 信誉: ${info.reputation_score}`;
  } catch (err) {
    el.pointsText.textContent = "未登录或无法获取积分";
    log("刷新积分失败", { error: err.message });
  }
}

async function refreshTasks() {
  try {
    const params = new URLSearchParams({
      status: el.taskStatusFilter.value || "open",
      q: el.taskSearchQ.value.trim(),
      min_reward: el.taskMinReward.value || "0",
      max_reward: el.taskMaxReward.value || "1000000000",
      sort: el.taskSort.value || "created_desc",
      page: String(taskState.page),
      page_size: String(taskState.pageSize),
    });
    const data = await api(`/api/tasks?${params.toString()}`);
    el.tasksList.innerHTML = "";
    data.tasks.forEach((task) => {
      const div = document.createElement("div");
      div.className = "task";
      div.innerHTML = `
        <strong>#${task.id} ${task.title}</strong><br/>
        发布者: ${task.publisher_name} | 悬赏: ${task.reward_points} | 状态: ${task.status}<br/>
        创建: ${task.created_at}
      `;
      div.addEventListener("click", () => {
        el.detailTaskId.value = task.id;
        loadTaskDetail();
      });
      el.tasksList.appendChild(div);
    });
    taskState.hasNext = Boolean(data.pagination?.has_next);
    taskState.total = Number(data.pagination?.total || 0);
    el.taskPaginationText.textContent = `第 ${taskState.page} 页 / 共 ${taskState.total} 条`;
    log("刷新任务成功", { count: data.tasks.length, page: taskState.page, total: taskState.total });
  } catch (err) {
    log("刷新任务失败", { error: err.message });
  }
}

async function loadTaskDetail() {
  const id = Number(el.detailTaskId.value || 0);
  if (!id) return;
  try {
    const data = await api(`/api/tasks/${id}`);
    el.taskDetail.textContent = JSON.stringify(data, null, 2);
    log("加载任务详情成功", { task_id: id, answers: data.answers.length });
  } catch (err) {
    log("加载详情失败", { error: err.message });
  }
}

el.registerBtn.addEventListener("click", async () => {
  try {
    const data = await api("/api/register", "POST", {
      username: el.username.value.trim(),
      password: el.password.value.trim(),
    });
    setToken(data.token);
    log("注册成功", data);
    await refreshSession();
    await refreshPoints();
    await refreshTasks();
  } catch (err) {
    log("注册失败", { error: err.message });
  }
});

el.loginBtn.addEventListener("click", async () => {
  try {
    const data = await api("/api/login", "POST", {
      username: el.username.value.trim(),
      password: el.password.value.trim(),
    });
    setToken(data.token);
    log("登录成功", data);
    await refreshSession();
    await refreshPoints();
    await refreshTasks();
  } catch (err) {
    log("登录失败", { error: err.message });
  }
});

el.logoutBtn.addEventListener("click", async () => {
  setToken("");
  await refreshSession();
  await refreshPoints();
  log("已退出登录");
});

el.refreshPointsBtn.addEventListener("click", refreshPoints);
el.refreshTasksBtn.addEventListener("click", refreshTasks);
el.taskSearchQ.addEventListener("change", async () => {
  taskState.page = 1;
  await refreshTasks();
});
el.taskStatusFilter.addEventListener("change", async () => {
  taskState.page = 1;
  await refreshTasks();
});
el.taskMinReward.addEventListener("change", async () => {
  taskState.page = 1;
  await refreshTasks();
});
el.taskMaxReward.addEventListener("change", async () => {
  taskState.page = 1;
  await refreshTasks();
});
el.taskSort.addEventListener("change", async () => {
  taskState.page = 1;
  await refreshTasks();
});
el.taskPrevPageBtn.addEventListener("click", async () => {
  if (taskState.page <= 1) return;
  taskState.page -= 1;
  await refreshTasks();
});
el.taskNextPageBtn.addEventListener("click", async () => {
  if (!taskState.hasNext) return;
  taskState.page += 1;
  await refreshTasks();
});
el.loadTaskBtn.addEventListener("click", loadTaskDetail);

el.publishTaskBtn.addEventListener("click", async () => {
  try {
    const payload = {
      title: el.taskTitle.value.trim(),
      description: el.taskDesc.value.trim(),
      acceptance_criteria: el.taskCriteria.value.trim(),
      reward_points: Number(el.taskReward.value || 0),
      deadline_at: el.taskDeadline.value ? new Date(el.taskDeadline.value).toISOString() : null,
    };
    const data = await api("/api/tasks", "POST", payload);
    log("发布任务成功", data);
    await refreshPoints();
    await refreshTasks();
  } catch (err) {
    log("发布任务失败", { error: err.message });
  }
});

el.submitAnswerBtn.addEventListener("click", async () => {
  const taskId = Number(el.detailTaskId.value || 0);
  if (!taskId) {
    log("请先输入任务ID并加载详情");
    return;
  }
  try {
    const links = el.answerLinks.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const data = await api(`/api/tasks/${taskId}/answers`, "POST", {
      content: el.answerContent.value.trim(),
      external_links: links,
    });
    log("提交回答成功", data);
    await loadTaskDetail();
  } catch (err) {
    log("提交回答失败", { error: err.message });
  }
});

el.selectBestBtn.addEventListener("click", async () => {
  const taskId = Number(el.detailTaskId.value || 0);
  const answerId = Number(el.bestAnswerId.value || 0);
  if (!taskId || !answerId) {
    log("请填写任务ID和最佳答案ID");
    return;
  }
  try {
    const data = await api(`/api/tasks/${taskId}/select-best`, "POST", {
      answer_id: answerId,
    });
    log("结算成功", data);
    await loadTaskDetail();
    await refreshPoints();
    await refreshTasks();
  } catch (err) {
    log("结算失败", { error: err.message });
  }
});

el.submitReportBtn.addEventListener("click", async () => {
  try {
    const data = await api("/api/reports", "POST", {
      target_type: el.reportTargetType.value,
      target_id: Number(el.reportTargetId.value || 0),
      reason: el.reportReason.value.trim(),
      evidence: el.reportEvidence.value.trim(),
    });
    log("举报提交成功", data);
  } catch (err) {
    log("举报提交失败", { error: err.message });
  }
});

async function loadReports() {
  try {
    const params = new URLSearchParams({
      status: el.reportStatusFilter.value || "pending",
      target_type: el.reportTargetTypeFilter.value || "all",
      page: String(reportState.page),
      page_size: String(reportState.pageSize),
    });
    const data = await api(`/api/admin/reports?${params.toString()}`);
    el.pendingReports.textContent = JSON.stringify(data, null, 2);
    reportState.hasNext = Boolean(data.pagination?.has_next);
    reportState.total = Number(data.pagination?.total || 0);
    el.reportPaginationText.textContent = `第 ${reportState.page} 页 / 共 ${reportState.total} 条`;
    log("加载举报列表成功", { count: data.reports.length, page: reportState.page, total: reportState.total });
  } catch (err) {
    log("加载待处理举报失败", { error: err.message });
  }
}

el.loadPendingReportsBtn.addEventListener("click", loadReports);

el.reportStatusFilter.addEventListener("change", async () => {
  reportState.page = 1;
  await loadReports();
});
el.reportTargetTypeFilter.addEventListener("change", async () => {
  reportState.page = 1;
  await loadReports();
});
el.reportPrevPageBtn.addEventListener("click", async () => {
  if (reportState.page <= 1) return;
  reportState.page -= 1;
  await loadReports();
});
el.reportNextPageBtn.addEventListener("click", async () => {
  if (!reportState.hasNext) return;
  reportState.page += 1;
  await loadReports();
});

el.resolveReportBtn.addEventListener("click", async () => {
  const reportId = Number(el.resolveReportId.value || 0);
  if (!reportId) {
    log("请先填写举报ID");
    return;
  }
  try {
    const data = await api(`/api/admin/reports/${reportId}/resolve`, "POST", {
      decision: el.resolveDecision.value,
      note: el.resolveNote.value.trim(),
    });
    log("处理举报成功", data);
  } catch (err) {
    log("处理举报失败", { error: err.message });
  }
});

refreshSession();
refreshPoints();
refreshTasks();
