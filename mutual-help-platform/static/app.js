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
  answerSort: document.getElementById("answerSort"),
  answerPrevPageBtn: document.getElementById("answerPrevPageBtn"),
  answerNextPageBtn: document.getElementById("answerNextPageBtn"),
  answerPaginationText: document.getElementById("answerPaginationText"),
  taskDetail: document.getElementById("taskDetail"),
  taskAnswers: document.getElementById("taskAnswers"),
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
  reportResolveTip: document.getElementById("reportResolveTip"),
  loadQualityRulesBtn: document.getElementById("loadQualityRulesBtn"),
  reloadQualityRulesBtn: document.getElementById("reloadQualityRulesBtn"),
  loadSystemStatsBtn: document.getElementById("loadSystemStatsBtn"),
  initDemoDataBtn: document.getElementById("initDemoDataBtn"),
  qualityRulesBox: document.getElementById("qualityRulesBox"),
  systemStatsBox: document.getElementById("systemStatsBox"),
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
  myTaskMode: document.getElementById("myTaskMode"),
  myTaskStatus: document.getElementById("myTaskStatus"),
  loadMyTasksBtn: document.getElementById("loadMyTasksBtn"),
  myTaskPrevBtn: document.getElementById("myTaskPrevBtn"),
  myTaskNextBtn: document.getElementById("myTaskNextBtn"),
  myTaskPaginationText: document.getElementById("myTaskPaginationText"),
  myTasksList: document.getElementById("myTasksList"),
  adminUserSearchQ: document.getElementById("adminUserSearchQ"),
  adminUserStatusFilter: document.getElementById("adminUserStatusFilter"),
  loadAdminUsersBtn: document.getElementById("loadAdminUsersBtn"),
  adminUserPrevBtn: document.getElementById("adminUserPrevBtn"),
  adminUserNextBtn: document.getElementById("adminUserNextBtn"),
  adminUserPaginationText: document.getElementById("adminUserPaginationText"),
  adminUsersList: document.getElementById("adminUsersList"),
  adminTargetUserId: document.getElementById("adminTargetUserId"),
  adminTargetStatus: document.getElementById("adminTargetStatus"),
  adminStatusNote: document.getElementById("adminStatusNote"),
  adminUpdateUserStatusBtn: document.getElementById("adminUpdateUserStatusBtn"),
  auditActionFilter: document.getElementById("auditActionFilter"),
  auditTargetTypeFilter: document.getElementById("auditTargetTypeFilter"),
  loadAuditLogsBtn: document.getElementById("loadAuditLogsBtn"),
  auditPrevBtn: document.getElementById("auditPrevBtn"),
  auditNextBtn: document.getElementById("auditNextBtn"),
  auditPaginationText: document.getElementById("auditPaginationText"),
  auditLogsBox: document.getElementById("auditLogsBox"),
};

const taskState = { page: 1, pageSize: 10, hasNext: false, total: 0 };
const reportState = { page: 1, pageSize: 10, hasNext: false, total: 0 };
const detailAnswerState = { page: 1, pageSize: 5, hasNext: false, total: 0 };
const myTaskState = { page: 1, pageSize: 5, hasNext: false, total: 0 };
const adminUserState = { page: 1, pageSize: 10, hasNext: false, total: 0 };
const auditState = { page: 1, pageSize: 20, hasNext: false, total: 0 };

function log(message, data) {
  const line = `[${new Date().toLocaleTimeString()}] ${message}`;
  const extra = data ? `\n${JSON.stringify(data, null, 2)}` : "";
  el.logBox.textContent = `${line}${extra}\n${el.logBox.textContent}`;
}

function setButtonLoading(button, isLoading, loadingText = "处理中...") {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    if (button.dataset.originalText) button.textContent = button.dataset.originalText;
    button.disabled = false;
  }
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
    const msg = payload.error || `HTTP ${res.status}`;
    const code = payload.error_code ? ` [${payload.error_code}]` : "";
    throw new Error(`${msg}${code}`);
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
  setButtonLoading(el.refreshTasksBtn, true, "刷新中...");
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
        detailAnswerState.page = 1;
        loadTaskDetail();
      });
      el.tasksList.appendChild(div);
    });
    if (data.tasks.length === 0) {
      el.tasksList.innerHTML = '<div class="empty">暂无符合条件的任务</div>';
    }
    taskState.hasNext = Boolean(data.pagination?.has_next);
    taskState.total = Number(data.pagination?.total || 0);
    el.taskPaginationText.textContent = `第 ${taskState.page} 页 / 共 ${taskState.total} 条`;
    log("刷新任务成功", { count: data.tasks.length, page: taskState.page, total: taskState.total });
  } catch (err) {
    log("刷新任务失败", { error: err.message });
  } finally {
    setButtonLoading(el.refreshTasksBtn, false);
  }
}

async function loadTaskDetail() {
  const id = Number(el.detailTaskId.value || 0);
  if (!id) return;
  setButtonLoading(el.loadTaskBtn, true, "加载中...");
  try {
    const params = new URLSearchParams({
      answer_page: String(detailAnswerState.page),
      answer_page_size: String(detailAnswerState.pageSize),
      answer_sort: el.answerSort.value || "created_asc",
    });
    const data = await api(`/api/tasks/${id}?${params.toString()}`);
    const task = data.task;
    el.taskDetail.innerHTML = `
      <strong>#${task.id} ${task.title}</strong><br/>
      发布者: ${task.publisher_name} | 悬赏: ${task.reward_points} | 状态: ${task.status}<br/>
      验收: ${task.acceptance_criteria}<br/>
      描述: ${task.description}
    `;
    el.taskAnswers.innerHTML = "";
    data.answers.forEach((answer) => {
      const meta = answer.quality_meta || {};
      const links = Array.isArray(answer.external_links) ? answer.external_links : [];
      const div = document.createElement("div");
      div.className = "answer-card";
      div.innerHTML = `
        <strong>回答 #${answer.id} - ${answer.author_name}</strong>
        <span class="answer-score">质量分 ${answer.quality_score}</span><br/>
        <div>${answer.content}</div>
        <div class="answer-meta">
          长度加分: ${meta.length_bonus ?? 0} | 有效链接加分: ${meta.valid_link_bonus ?? 0} |
          无效链接扣分: ${meta.invalid_link_penalty ?? 0} | 相似度扣分: ${meta.similarity_penalty ?? 0} |
          相似度: ${meta.max_similarity ?? 0}
        </div>
        <div class="answer-meta">链接: ${links.join(", ") || "-"}</div>
      `;
      el.taskAnswers.appendChild(div);
    });
    if (data.answers.length === 0) {
      el.taskAnswers.innerHTML = '<div class="empty">暂无回答，快来提交第一个优质线索</div>';
    }
    detailAnswerState.hasNext = Boolean(data.answers_pagination?.has_next);
    detailAnswerState.total = Number(data.answers_pagination?.total || 0);
    el.answerPaginationText.textContent = `回答第 ${detailAnswerState.page} 页 / 共 ${detailAnswerState.total} 条`;
    log("加载任务详情成功", { task_id: id, answers: data.answers.length, page: detailAnswerState.page });
  } catch (err) {
    log("加载详情失败", { error: err.message });
  } finally {
    setButtonLoading(el.loadTaskBtn, false);
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
el.loadTaskBtn.addEventListener("click", async () => {
  detailAnswerState.page = 1;
  await loadTaskDetail();
});
el.answerSort.addEventListener("change", async () => {
  detailAnswerState.page = 1;
  await loadTaskDetail();
});
el.answerPrevPageBtn.addEventListener("click", async () => {
  if (detailAnswerState.page <= 1) return;
  detailAnswerState.page -= 1;
  await loadTaskDetail();
});
el.answerNextPageBtn.addEventListener("click", async () => {
  if (!detailAnswerState.hasNext) return;
  detailAnswerState.page += 1;
  await loadTaskDetail();
});

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
    log("提交回答成功（含质量分）", {
      answer_id: data.answer_id,
      quality_score: data.quality_score,
      quality_meta: data.quality_meta,
    });
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
  setButtonLoading(el.loadPendingReportsBtn, true, "加载中...");
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
  } finally {
    setButtonLoading(el.loadPendingReportsBtn, false);
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
    el.reportResolveTip.textContent = `已处理举报 #${reportId}: ${data.status}`;
    el.reportResolveTip.className = "tip flash-ok";
    await loadReports();
  } catch (err) {
    log("处理举报失败", { error: err.message });
  }
});

el.loadQualityRulesBtn.addEventListener("click", async () => {
  try {
    const data = await api("/api/admin/quality-config");
    el.qualityRulesBox.textContent = JSON.stringify(data, null, 2);
    log("加载评分规则成功", { rules_version: data.rules_version });
  } catch (err) {
    log("加载评分规则失败", { error: err.message });
  }
});

el.reloadQualityRulesBtn.addEventListener("click", async () => {
  try {
    const data = await api("/api/admin/quality-config/reload", "POST", {});
    el.qualityRulesBox.textContent = JSON.stringify(data, null, 2);
    log("重载评分规则成功", { rules_version: data.rules_version });
  } catch (err) {
    log("重载评分规则失败", { error: err.message });
  }
});

el.loadSystemStatsBtn.addEventListener("click", async () => {
  try {
    const data = await api("/api/admin/system/stats");
    el.systemStatsBox.textContent = JSON.stringify(data, null, 2);
    log("加载系统统计成功", data.stats);
  } catch (err) {
    log("加载系统统计失败", { error: err.message });
  }
});

async function loadMyTasks() {
  setButtonLoading(el.loadMyTasksBtn, true, "加载中...");
  try {
    const endpoint =
      el.myTaskMode.value === "answered" ? "/api/me/tasks/answered" : "/api/me/tasks/published";
    const params = new URLSearchParams({
      status: el.myTaskStatus.value || "all",
      page: String(myTaskState.page),
      page_size: String(myTaskState.pageSize),
    });
    const data = await api(`${endpoint}?${params.toString()}`);
    myTaskState.hasNext = Boolean(data.pagination?.has_next);
    myTaskState.total = Number(data.pagination?.total || 0);
    el.myTaskPaginationText.textContent = `第 ${myTaskState.page} 页 / 共 ${myTaskState.total} 条`;
    el.myTasksList.innerHTML = "";
    data.tasks.forEach((task) => {
      const div = document.createElement("div");
      div.className = "task";
      div.innerHTML = `
        <strong>#${task.id} ${task.title}</strong><br/>
        悬赏: ${task.reward_points} | 状态: ${task.status} | 创建: ${task.created_at}
      `;
      div.addEventListener("click", () => {
        el.detailTaskId.value = task.id;
        detailAnswerState.page = 1;
        loadTaskDetail();
      });
      el.myTasksList.appendChild(div);
    });
    if (data.tasks.length === 0) {
      el.myTasksList.innerHTML = '<div class="empty">暂无任务记录</div>';
    }
    log("加载我的任务成功", { mode: el.myTaskMode.value, page: myTaskState.page, count: data.tasks.length });
  } catch (err) {
    log("加载我的任务失败", { error: err.message });
  } finally {
    setButtonLoading(el.loadMyTasksBtn, false);
  }
}

async function loadAdminUsers() {
  setButtonLoading(el.loadAdminUsersBtn, true, "加载中...");
  try {
    const params = new URLSearchParams({
      status: el.adminUserStatusFilter.value || "all",
      q: el.adminUserSearchQ.value.trim(),
      page: String(adminUserState.page),
      page_size: String(adminUserState.pageSize),
    });
    const data = await api(`/api/admin/users?${params.toString()}`);
    adminUserState.hasNext = Boolean(data.pagination?.has_next);
    adminUserState.total = Number(data.pagination?.total || 0);
    el.adminUserPaginationText.textContent = `第 ${adminUserState.page} 页 / 共 ${adminUserState.total} 条`;
    el.adminUsersList.innerHTML = "";
    data.users.forEach((u) => {
      const div = document.createElement("div");
      div.className = "task";
      div.innerHTML = `
        <strong>#${u.id} ${u.username}</strong><br/>
        状态: ${u.status} | 管理员: ${u.is_admin ? "yes" : "no"} |
        积分: ${u.available_points}/${u.frozen_points} | 信誉: ${u.reputation_score}
      `;
      div.addEventListener("click", () => {
        el.adminTargetUserId.value = u.id;
        el.adminTargetStatus.value = u.status;
      });
      el.adminUsersList.appendChild(div);
    });
    if (data.users.length === 0) {
      el.adminUsersList.innerHTML = '<div class="empty">没有匹配用户</div>';
    }
    log("加载用户列表成功", { page: adminUserState.page, count: data.users.length });
  } catch (err) {
    log("加载用户列表失败", { error: err.message });
  } finally {
    setButtonLoading(el.loadAdminUsersBtn, false);
  }
}

async function loadAuditLogs() {
  setButtonLoading(el.loadAuditLogsBtn, true, "加载中...");
  try {
    const params = new URLSearchParams({
      action: el.auditActionFilter.value || "all",
      target_type: el.auditTargetTypeFilter.value || "all",
      page: String(auditState.page),
      page_size: String(auditState.pageSize),
    });
    const data = await api(`/api/admin/audit-logs?${params.toString()}`);
    auditState.hasNext = Boolean(data.pagination?.has_next);
    auditState.total = Number(data.pagination?.total || 0);
    el.auditPaginationText.textContent = `第 ${auditState.page} 页 / 共 ${auditState.total} 条`;
    el.auditLogsBox.textContent = JSON.stringify(data, null, 2);
    log("加载审计日志成功", { page: auditState.page, count: data.logs.length });
  } catch (err) {
    log("加载审计日志失败", { error: err.message });
  } finally {
    setButtonLoading(el.loadAuditLogsBtn, false);
  }
}

el.loadMyTasksBtn.addEventListener("click", async () => {
  myTaskState.page = 1;
  await loadMyTasks();
});
el.myTaskMode.addEventListener("change", async () => {
  myTaskState.page = 1;
  await loadMyTasks();
});
el.myTaskStatus.addEventListener("change", async () => {
  myTaskState.page = 1;
  await loadMyTasks();
});
el.myTaskPrevBtn.addEventListener("click", async () => {
  if (myTaskState.page <= 1) return;
  myTaskState.page -= 1;
  await loadMyTasks();
});
el.myTaskNextBtn.addEventListener("click", async () => {
  if (!myTaskState.hasNext) return;
  myTaskState.page += 1;
  await loadMyTasks();
});

el.loadAdminUsersBtn.addEventListener("click", async () => {
  adminUserState.page = 1;
  await loadAdminUsers();
});
el.adminUserStatusFilter.addEventListener("change", async () => {
  adminUserState.page = 1;
  await loadAdminUsers();
});
el.adminUserSearchQ.addEventListener("change", async () => {
  adminUserState.page = 1;
  await loadAdminUsers();
});
el.adminUserPrevBtn.addEventListener("click", async () => {
  if (adminUserState.page <= 1) return;
  adminUserState.page -= 1;
  await loadAdminUsers();
});
el.adminUserNextBtn.addEventListener("click", async () => {
  if (!adminUserState.hasNext) return;
  adminUserState.page += 1;
  await loadAdminUsers();
});
el.adminUpdateUserStatusBtn.addEventListener("click", async () => {
  const userId = Number(el.adminTargetUserId.value || 0);
  if (!userId) {
    log("请先填写目标用户ID");
    return;
  }
  try {
    const data = await api(`/api/admin/users/${userId}/status`, "POST", {
      status: el.adminTargetStatus.value,
      note: el.adminStatusNote.value.trim(),
    });
    log("更新用户状态成功", data);
    await loadAdminUsers();
  } catch (err) {
    log("更新用户状态失败", { error: err.message });
  }
});

el.initDemoDataBtn.addEventListener("click", async () => {
  setButtonLoading(el.initDemoDataBtn, true, "初始化中...");
  try {
    const data = await api("/api/admin/demo/init", "POST", {});
    log("初始化演示数据成功", data);
    await refreshTasks();
    await loadAdminUsers();
  } catch (err) {
    log("初始化演示数据失败", { error: err.message });
  } finally {
    setButtonLoading(el.initDemoDataBtn, false);
  }
});

el.loadAuditLogsBtn.addEventListener("click", async () => {
  auditState.page = 1;
  await loadAuditLogs();
});
el.auditActionFilter.addEventListener("change", async () => {
  auditState.page = 1;
  await loadAuditLogs();
});
el.auditTargetTypeFilter.addEventListener("change", async () => {
  auditState.page = 1;
  await loadAuditLogs();
});
el.auditPrevBtn.addEventListener("click", async () => {
  if (auditState.page <= 1) return;
  auditState.page -= 1;
  await loadAuditLogs();
});
el.auditNextBtn.addEventListener("click", async () => {
  if (!auditState.hasNext) return;
  auditState.page += 1;
  await loadAuditLogs();
});

refreshSession();
refreshPoints();
refreshTasks();
