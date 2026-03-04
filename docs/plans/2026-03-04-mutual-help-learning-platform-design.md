# 人人为我，我为人人：学习资料互助平台设计文档

- 日期：2026-03-04
- 状态：已确认（MVP）
- 范围：问答悬赏型资料互助平台（不存储资料文件本体）

## 1. 产品目标与边界

### 1.1 产品目标
- 让用户通过积分发布“资料获取线索/学习方法”任务。
- 让其他用户通过提交高质量答案获得积分奖励。
- 在不触碰盗版传播的前提下提升找资料效率。

### 1.2 明确边界
- 平台不上传、不存储电子书/PDF/网课文件本体。
- 平台只允许发布合法渠道、公开资源线索、购买路径、检索方法、学习建议。
- 禁止请求或传播盗版下载链接、破解资源、非法网盘分享。

## 2. 需求确认结果（来自需求澄清）

- 任务类型：主要为电子书、学习资料、视频课程相关线索求助。
- 合规策略：仅提供线索/获取方法/购买渠道，不存文件。
- 领取权限：所有用户都可参与回答。
- 结算时限：发起人 72 小时内处理，超时自动结算。
- 提交机制：多人可提交，发起人选择最佳答案。
- 产品路线：优先采用“问答悬赏型”。

## 3. 方案对比与选型

### 3.1 候选方案
1. 问答悬赏型（选用）
2. 任务协作型（多轮沟通）
3. 资料猎人市场型（服务者主页+报价）

### 3.2 选型理由
- 问答悬赏型开发复杂度最低，适合快速上线验证需求。
- 流程清晰，冷启动成本较低。
- 后续可平滑扩展到协作型和市场型。

## 4. 核心业务流程

### 4.1 发布任务
1. 求助者填写任务标题、需求描述、验收标准、预算积分、截止时间。
2. 系统校验 `available_points` 是否充足。
3. 扣减可用积分并冻结到 `frozen_points`。
4. 创建任务并写积分流水（冻结）。

### 4.2 回答任务
1. 帮助者在任务详情页提交答案（文本 + 外链 + 说明）。
2. 系统执行基础风控（关键词、黑名单域名、重复内容检测）。
3. 合规答案入库并展示。

### 4.3 选择最佳与结算
1. 求助者从多个答案中选择最佳答案。
2. 系统以事务方式完成：任务状态更新 + 积分从冻结账户转入帮助者可用余额 + 记录流水。
3. 一旦结算，任务不可重复结算。

### 4.4 超时自动结算
1. 定时任务扫描超过 72 小时且未结算任务。
2. MVP 简化规则：选择“最早合规答案”执行自动结算。
3. 记录自动结算来源与操作日志。

## 5. 积分与信誉机制

### 5.1 积分钱包
- `available_points`：可立即消费或提现（后续可扩展）。
- `frozen_points`：发布任务后暂存，待结算再流转。

### 5.2 积分流水
- 记录每次变化：冻结、解冻、奖励、处罚、人工调整。
- 保证可审计、可追溯。

### 5.3 信誉分
- 字段：`reputation_score`（0-100，初始 60）。
- 正向行为：被选最佳、获得点赞、稳定输出高质量答案。
- 负向行为：举报成立、灌水、违规线索、恶意刷分。
- 用途：影响排序与后续权限策略。

## 6. 合规与风控设计

### 6.1 发布侧风控
- 拦截高风险词（盗版、破解、直链索取等）。
- 对可疑任务增加审核标记。

### 6.2 回答侧风控
- 外链域名白名单/黑名单。
- 文本相似度检测，降低模板灌水。

### 6.3 举报与处罚
- 任务、答案、用户均可举报。
- 处理结果：驳回/删除内容/扣分/限流/封禁。
- 所有处理写入 `audit_logs`。

## 7. 信息架构与页面清单（MVP）

1. 首页：最新任务、热门任务、搜索入口。
2. 任务广场：按预算/时效/状态筛选。
3. 发布任务页：填写需求并冻结积分。
4. 任务详情页：查看需求、提交答案、选择最佳。
5. 我的任务页：我发布的、我参与的。
6. 积分中心：余额、冻结金额、流水明细。
7. 举报页：提交证据与追踪处理进度。
8. 管理后台：审核、举报处理、处罚、积分调整。

## 8. 数据模型（MVP）

### 8.1 `users`
- `id`
- `nickname`
- `email` / `phone`
- `available_points`
- `frozen_points`
- `reputation_score`
- `status`
- `created_at`
- `updated_at`

### 8.2 `tasks`
- `id`
- `publisher_id`
- `title`
- `description`
- `acceptance_criteria`
- `reward_points`
- `deadline_at`
- `status`（open/closed/auto_settled/cancelled）
- `best_answer_id`
- `created_at`
- `updated_at`

### 8.3 `answers`
- `id`
- `task_id`
- `author_id`
- `content`
- `external_links`（json）
- `quality_score`
- `status`（valid/hidden/reported）
- `created_at`
- `updated_at`

### 8.4 `point_ledger`
- `id`
- `user_id`
- `biz_type`
- `delta`
- `balance_after`
- `ref_type`
- `ref_id`
- `remark`
- `created_at`

### 8.5 `point_transactions`
- `id`
- `task_id`
- `payer_id`
- `payee_id`
- `amount`
- `status`（frozen/paid/refunded）
- `settled_at`
- `created_at`

### 8.6 `reports`
- `id`
- `reporter_id`
- `target_type`（task/answer/user）
- `target_id`
- `reason`
- `evidence`
- `status`（pending/approved/rejected）
- `handler_id`
- `handled_at`
- `created_at`

### 8.7 `audit_logs`
- `id`
- `operator_id`
- `action`
- `target_type`
- `target_id`
- `before_data`
- `after_data`
- `created_at`

### 8.8 推荐索引
1. `tasks(status, created_at desc)`
2. `answers(task_id, created_at)`
3. `point_ledger(user_id, created_at desc)`
4. `reports(status, created_at)`

## 9. 技术架构（MVP）

- 前端：Next.js（或 React + Vite）。
- 后端：NestJS（或 Express）REST API。
- 存储：PostgreSQL + Redis。
- 定时器：cron/queue worker，每 5 分钟扫描超时任务。
- 鉴权：JWT + refresh token。
- 可观测：应用日志 + 异常告警。

## 10. 错误处理与测试

### 10.1 错误处理
- 余额不足发布失败。
- 并发下只允许单次结算（事务 + 行锁）。
- 重复灌水提交限流与降权。
- 失效线索允许复审与举报。

### 10.2 测试策略
1. 单元测试：冻结/结算/信誉计算。
2. 集成测试：发布 -> 多答 -> 选最佳 -> 结算链路。
3. 定时任务测试：72 小时自动结算正确性。
4. 回归测试：权限、状态机、异常场景。

## 11. 开发排期（2-4 周）

1. 第 1 周：账号、发布任务、提交答案、积分冻结和流水。
2. 第 2 周：最佳答案结算、72 小时自动结算、我的任务、积分中心。
3. 第 3 周：举报后台、基础风控、信誉分排序。
4. 第 4 周（可选）：埋点、体验优化、灰度上线。

## 12. 后续迭代方向

1. 协作型任务（多轮沟通）。
2. 供给侧激励（达人等级/任务匹配）。
3. 更细粒度自动结算策略（按质量分而非最早提交）。
