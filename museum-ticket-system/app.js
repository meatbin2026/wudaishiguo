const STORAGE_ORDERS = "museum_ticket_orders";
const STORAGE_SOLD = "museum_ticket_sold";

const exhibitions = [
  {
    id: "e01",
    name: "千年丝路：古代文明特展",
    prices: { adult: 120, student: 70, child: 40 },
    defaultCapacity: 180,
  },
  {
    id: "e02",
    name: "未来文物：AI 与数字艺术展",
    prices: { adult: 98, student: 60, child: 30 },
    defaultCapacity: 150,
  },
  {
    id: "e03",
    name: "海上秘境：沉船与宝藏特展",
    prices: { adult: 108, student: 68, child: 35 },
    defaultCapacity: 160,
  },
];

const slots = [
  { id: "09:30-11:00", label: "09:30 - 11:00" },
  { id: "11:30-13:00", label: "11:30 - 13:00" },
  { id: "14:00-15:30", label: "14:00 - 15:30" },
  { id: "16:00-17:30", label: "16:00 - 17:30" },
];

const el = {
  exhibition: document.getElementById("exhibition"),
  visitDate: document.getElementById("visitDate"),
  timeSlot: document.getElementById("timeSlot"),
  remaining: document.getElementById("remaining"),
  adultPrice: document.getElementById("adultPrice"),
  studentPrice: document.getElementById("studentPrice"),
  childPrice: document.getElementById("childPrice"),
  adultQty: document.getElementById("adultQty"),
  studentQty: document.getElementById("studentQty"),
  childQty: document.getElementById("childQty"),
  buyerName: document.getElementById("buyerName"),
  buyerPhone: document.getElementById("buyerPhone"),
  buyerEmail: document.getElementById("buyerEmail"),
  totalCount: document.getElementById("totalCount"),
  totalPrice: document.getElementById("totalPrice"),
  message: document.getElementById("message"),
  ticketForm: document.getElementById("ticketForm"),
  ordersList: document.getElementById("ordersList"),
  clearOrders: document.getElementById("clearOrders"),
};

function safeParse(key, fallback) {
  try {
    const text = localStorage.getItem(key);
    return text ? JSON.parse(text) : fallback;
  } catch (_) {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getOrders() {
  return safeParse(STORAGE_ORDERS, []);
}

function setOrders(orders) {
  saveJson(STORAGE_ORDERS, orders);
}

function getSoldMap() {
  return safeParse(STORAGE_SOLD, {});
}

function setSoldMap(map) {
  saveJson(STORAGE_SOLD, map);
}

function formatDate(input) {
  const [y, m, d] = input.split("-");
  return `${y}年${m}月${d}日`;
}

function orderKey(exhibitionId, date, slotId) {
  return `${exhibitionId}|${date}|${slotId}`;
}

function getExhibition() {
  return exhibitions.find((x) => x.id === el.exhibition.value) || exhibitions[0];
}

function getQtyTotal() {
  const a = Number(el.adultQty.value) || 0;
  const s = Number(el.studentQty.value) || 0;
  const c = Number(el.childQty.value) || 0;
  return { a, s, c, total: a + s + c };
}

function getRemaining() {
  const ex = getExhibition();
  const date = el.visitDate.value;
  const slotId = el.timeSlot.value;
  if (!date || !slotId) return ex.defaultCapacity;

  const soldMap = getSoldMap();
  const sold = soldMap[orderKey(ex.id, date, slotId)] || 0;
  return Math.max(0, ex.defaultCapacity - sold);
}

function updatePrices() {
  const ex = getExhibition();
  el.adultPrice.textContent = ex.prices.adult;
  el.studentPrice.textContent = ex.prices.student;
  el.childPrice.textContent = ex.prices.child;
}

function updateSummary() {
  const ex = getExhibition();
  const { a, s, c, total } = getQtyTotal();
  const sum = a * ex.prices.adult + s * ex.prices.student + c * ex.prices.child;
  el.totalCount.textContent = String(total);
  el.totalPrice.textContent = `¥${sum}`;

  const remaining = getRemaining();
  el.remaining.textContent = String(remaining);
  el.remaining.style.color = remaining <= 20 ? "#b62929" : "#1f6e7a";
}

function setMsg(text, type = "") {
  el.message.textContent = text;
  el.message.className = `message ${type}`.trim();
}

function generateOrderId() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `MT${stamp}${rand}`;
}

function validateForm() {
  const name = el.buyerName.value.trim();
  const phone = el.buyerPhone.value.trim();
  const email = el.buyerEmail.value.trim();
  const { total } = getQtyTotal();

  if (!name) return "请填写购票人姓名";
  if (!/^1\d{10}$/.test(phone)) return "请输入有效的 11 位手机号";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "邮箱格式不正确";
  if (!el.visitDate.value) return "请选择参观日期";
  if (!el.timeSlot.value) return "请选择入场场次";
  if (total <= 0) return "请至少购买 1 张门票";

  const remaining = getRemaining();
  if (total > remaining) return `余票不足，当前仅剩 ${remaining} 张`;

  return "";
}

function createOrder() {
  const ex = getExhibition();
  const { a, s, c, total } = getQtyTotal();
  const totalPrice = a * ex.prices.adult + s * ex.prices.student + c * ex.prices.child;

  return {
    id: generateOrderId(),
    exhibitionId: ex.id,
    exhibitionName: ex.name,
    date: el.visitDate.value,
    slot: el.timeSlot.value,
    qty: { adult: a, student: s, child: c, total },
    totalPrice,
    buyer: {
      name: el.buyerName.value.trim(),
      phone: el.buyerPhone.value.trim(),
      email: el.buyerEmail.value.trim(),
    },
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
  };
}

function updateInventory(order, delta) {
  const soldMap = getSoldMap();
  const key = orderKey(order.exhibitionId, order.date, order.slot);
  const current = soldMap[key] || 0;
  soldMap[key] = Math.max(0, current + delta * order.qty.total);
  setSoldMap(soldMap);
}

function renderOrders() {
  const orders = getOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (!orders.length) {
    el.ordersList.innerHTML = '<div class="empty">暂无订单，提交后会展示在这里。</div>';
    return;
  }

  el.ordersList.innerHTML = orders
    .map((o) => {
      const cancelled = o.status === "CANCELLED";
      return `
        <article class="order-item">
          <div class="order-top">
            <span class="order-id">${o.id}</span>
            <span class="tag ${cancelled ? "cancelled" : ""}">${cancelled ? "已退票" : "已支付"}</span>
          </div>
          <p><strong>${o.exhibitionName}</strong></p>
          <p>日期场次：${formatDate(o.date)} ${o.slot}</p>
          <p>票数：成人 ${o.qty.adult} / 学生 ${o.qty.student} / 儿童 ${o.qty.child}</p>
          <p>金额：¥${o.totalPrice} ｜ 购票人：${o.buyer.name}</p>
          <p>下单时间：${new Date(o.createdAt).toLocaleString()}</p>
          <div class="order-actions">
            ${cancelled ? "" : `<button class="btn-cancel" data-order-id="${o.id}">退票</button>`}
          </div>
        </article>
      `;
    })
    .join("");
}

function submitOrder(event) {
  event.preventDefault();
  const err = validateForm();
  if (err) {
    setMsg(err, "error");
    return;
  }

  const order = createOrder();
  const orders = getOrders();
  orders.push(order);
  setOrders(orders);

  updateInventory(order, 1);
  updateSummary();
  renderOrders();

  setMsg(`下单成功，订单号：${order.id}`, "ok");

  el.adultQty.value = "1";
  el.studentQty.value = "0";
  el.childQty.value = "0";
  updateSummary();
}

function cancelOrder(orderId) {
  const orders = getOrders();
  const idx = orders.findIndex((x) => x.id === orderId);
  if (idx < 0) return;

  const order = orders[idx];
  if (order.status === "CANCELLED") return;

  order.status = "CANCELLED";
  orders[idx] = order;
  setOrders(orders);

  updateInventory(order, -1);
  renderOrders();
  updateSummary();
  setMsg(`订单 ${orderId} 已退票并回补库存`, "ok");
}

function initDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);

  const toDateInput = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  el.visitDate.min = toDateInput(start);
  el.visitDate.max = toDateInput(end);
  el.visitDate.value = toDateInput(start);
}

function initOptions() {
  el.exhibition.innerHTML = exhibitions
    .map((x) => `<option value="${x.id}">${x.name}</option>`)
    .join("");

  el.timeSlot.innerHTML = slots
    .map((s) => `<option value="${s.id}">${s.label}</option>`)
    .join("");
}

function bindEvents() {
  [
    el.exhibition,
    el.visitDate,
    el.timeSlot,
    el.adultQty,
    el.studentQty,
    el.childQty,
  ].forEach((node) => {
    node.addEventListener("input", () => {
      updatePrices();
      updateSummary();
      setMsg("");
    });
    node.addEventListener("change", () => {
      updatePrices();
      updateSummary();
      setMsg("");
    });
  });

  el.ticketForm.addEventListener("submit", submitOrder);

  el.ordersList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const orderId = target.dataset.orderId;
    if (!orderId) return;
    cancelOrder(orderId);
  });

  el.clearOrders.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_ORDERS);
    localStorage.removeItem(STORAGE_SOLD);
    renderOrders();
    updateSummary();
    setMsg("订单与库存记录已清空", "ok");
  });
}

function bootstrap() {
  initOptions();
  initDateRange();
  updatePrices();
  updateSummary();
  renderOrders();
  bindEvents();
}

bootstrap();
