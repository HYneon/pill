const CONFIG = {
  doseWindows: {
    morning: { label: "午药", start: "11:00", end: "14:00" },
    evening: { label: "晚药", start: "22:00", end: "01:00" },
  },
  daysPerBox: 5,
  storageKey: "pill:v1",
  boxesUrl: "boxes.json",
  timelineBeforeDays: 18,
  timelineAfterDays: 5,
};

const fallbackBoxes = [
  {
    src: "assets/boxes/box-001.svg",
    title: "今天也完成了",
  },
  {
    src: "assets/boxes/box-002.svg",
    title: "稳稳前进",
  },
];

const statusColors = {
  morningDone: "rgba(185, 221, 255, 0.62)",
  eveningDone: "rgba(200, 204, 210, 0.62)",
  empty: "rgba(229, 229, 225, 0.54)",
};

const state = loadState();
let boxPool = fallbackBoxes;
let timelineCentered = false;

const els = {
  todayLabel: document.querySelector("#todayLabel"),
  doseButton: document.querySelector("#doseButton"),
  statusText: document.querySelector("#statusText"),
  openBoxButton: document.querySelector("#openBoxButton"),
  boxLabel: document.querySelector("#boxLabel"),
  timelineScroll: document.querySelector("#timelineScroll"),
  timeline: document.querySelector("#timeline"),
  boxDialog: document.querySelector("#boxDialog"),
  boxImage: document.querySelector("#boxImage"),
  boxCaption: document.querySelector("#boxCaption"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
};

init();

async function init() {
  bindViewportHeight();
  registerServiceWorker();
  wireEvents();
  await loadBoxes();
  render();
  setInterval(render, 30000);
}

function bindViewportHeight() {
  const setHeight = () => {
    document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
  };

  setHeight();
  window.addEventListener("resize", setHeight);
  window.addEventListener("orientationchange", () => {
    setTimeout(setHeight, 250);
  });
}

function wireEvents() {
  els.doseButton.addEventListener("click", recordCurrentDose);
  els.openBoxButton.addEventListener("click", openBox);
  els.closeDialogButton.addEventListener("click", () => els.boxDialog.close());
}

async function loadBoxes() {
  try {
    const response = await fetch(CONFIG.boxesUrl, { cache: "no-cache" });
    if (!response.ok) return;
    const boxes = await response.json();
    if (Array.isArray(boxes) && boxes.length > 0) {
      boxPool = boxes
        .filter((box) => box && typeof box.src === "string")
        .map((box) => ({
          src: box.src,
          title: box.title || "一张盲盒图片",
        }));
    }
  } catch {
    boxPool = fallbackBoxes;
  }
}

function recordCurrentDose() {
  const now = new Date();
  const action = getCurrentAction(now);

  if (!action.type) {
    showMessage(action.message);
    return;
  }

  const day = getDay(action.date);
  day[action.type] = now.toISOString();
  state.days[action.date] = day;

  if (isCompleteDay(day) && !day.rewarded) {
    day.rewarded = true;
    state.completedDays += 1;
    state.progress += 1;
    if (state.progress >= CONFIG.daysPerBox) {
      state.boxCredits += 1;
      state.progress -= CONFIG.daysPerBox;
    }
  }

  saveState();
  render();
}

function openBox() {
  if (state.boxCredits <= 0 || boxPool.length === 0) return;

  const box = boxPool[Math.floor(Math.random() * boxPool.length)];
  const opened = {
    ...box,
    openedAt: new Date().toISOString(),
  };

  state.boxCredits -= 1;
  state.openedBoxes.unshift(opened);
  saveState();

  els.boxImage.src = opened.src;
  els.boxCaption.textContent = opened.title;

  if (typeof els.boxDialog.showModal === "function") {
    els.boxDialog.showModal();
  } else {
    els.boxDialog.setAttribute("open", "");
  }

  render();
}

function render() {
  const now = new Date();
  const today = dateKey(now);
  const action = getCurrentAction(now);
  const day = getDay(action.date || today);

  els.todayLabel.textContent = formatDate(now);
  els.todayLabel.dateTime = today;

  renderMainButton(day, action);
  renderBoxChip();
  renderTimeline(now);
}

function renderMainButton(day, action) {
  els.doseButton.disabled = !action.type;
  els.doseButton.classList.toggle("ready", Boolean(action.type));
  els.doseButton.classList.toggle("done", isCompleteDay(day));
  els.doseButton.setAttribute("aria-label", action.type ? `记录${CONFIG.doseWindows[action.type].label}` : action.message);
  els.statusText.textContent = action.message;
}

function renderBoxChip() {
  if (state.boxCredits > 0) {
    els.boxLabel.textContent = "开盒";
    els.openBoxButton.disabled = false;
    els.openBoxButton.classList.add("ready");
    return;
  }

  els.boxLabel.textContent = `${state.progress}/${CONFIG.daysPerBox}`;
  els.openBoxButton.disabled = true;
  els.openBoxButton.classList.remove("ready");
}

function renderTimeline(now) {
  const dates = buildTimelineDates(now);
  const today = dateKey(now);

  els.timeline.innerHTML = dates
    .map((date) => {
      const day = getDay(date);
      const morningStatus = getDoseStatus(date, "morning", day, now);
      const eveningStatus = getDoseStatus(date, "evening", day, now);
      const innerColor = morningStatus === "done" ? statusColors.morningDone : statusColors.empty;
      const outerColor = eveningStatus === "done" ? statusColors.eveningDone : statusColors.empty;
      const label = date === today ? "今" : String(Number(date.slice(-2)));
      const aria = `${date}，午药${statusText(morningStatus)}，晚药${statusText(eveningStatus)}`;

      return `
        <li>
          <button class="day-node ${date === today ? "today" : ""}" type="button" aria-label="${aria}" data-date="${date}">
            <span
              class="dual-dot"
              style="--outer: ${outerColor}; --inner: ${innerColor}"
              aria-hidden="true"
            ></span>
            <span class="day-label">${label}</span>
          </button>
        </li>
      `;
    })
    .join("");

  if (!timelineCentered) {
    requestAnimationFrame(centerToday);
    timelineCentered = true;
  }
}

function centerToday() {
  const todayNode = els.timeline.querySelector(".day-node.today");
  if (!todayNode) return;

  const left = todayNode.offsetLeft - els.timelineScroll.clientWidth / 2 + todayNode.clientWidth / 2;
  els.timelineScroll.scrollTo({ left, behavior: "smooth" });
}

function buildTimelineDates(now) {
  const dates = [];
  for (let offset = -CONFIG.timelineBeforeDays; offset <= CONFIG.timelineAfterDays; offset += 1) {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    dates.push(dateKey(date));
  }
  return dates;
}

function getCurrentAction(now) {
  const today = dateKey(now);
  const day = getDay(today);
  const morning = CONFIG.doseWindows.morning;
  const evening = CONFIG.doseWindows.evening;

  if (isWithinWindow(now, morning)) {
    return day.morning
      ? { type: null, date: today, message: `午药已记录，${evening.start} 后记录晚药` }
      : { type: "morning", date: today, message: formatWindow(morning) };
  }

  if (isWithinWindow(now, evening)) {
    const eveningDate = windowOwnerDate(now, evening);
    const eveningDay = getDay(eveningDate);
    return eveningDay.evening
      ? { type: null, date: eveningDate, message: isCompleteDay(eveningDay) ? "这一天已完成" : "晚药已记录" }
      : { type: "evening", date: eveningDate, message: formatWindow(evening) };
  }

  if (isCompleteDay(day)) {
    return { type: null, date: today, message: "今天完成" };
  }

  if (isBeforeWindow(now, morning)) {
    return { type: null, date: today, message: `${morning.start} 后记录午药` };
  }

  if (!day.morning && isBeforeWindow(now, evening)) {
    return { type: null, date: today, message: `午药已错过，${evening.start} 后记录晚药` };
  }

  if (day.morning && isBeforeWindow(now, evening)) {
    return { type: null, date: today, message: `${evening.start} 后记录晚药` };
  }

  return { type: null, date: today, message: "今天的记录时间已结束" };
}

function getDoseStatus(date, type, day, now) {
  if (day[type]) return "done";
  if (date < state.startedAt) return "future";

  const today = dateKey(now);
  const window = CONFIG.doseWindows[type];
  const range = windowRangeForDate(date, window);
  const nowTime = now.getTime();

  if (nowTime > range.end.getTime()) return "missed";
  if (nowTime >= range.start.getTime()) return "active";
  return date === today ? "pending" : "future";
}

function getDay(date) {
  return (
    state.days[date] || {
      morning: null,
      evening: null,
      rewarded: false,
    }
  );
}

function isCompleteDay(day) {
  return Boolean(day.morning && day.evening);
}

function isWithinWindow(date, window) {
  const minutes = minutesSinceMidnight(date);
  const start = parseTime(window.start);
  const end = parseTime(window.end);
  return start <= end ? minutes >= start && minutes <= end : minutes >= start || minutes <= end;
}

function isBeforeWindow(date, window) {
  return minutesSinceMidnight(date) < parseTime(window.start);
}

function parseTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function windowOwnerDate(date, window) {
  if (!windowWraps(window)) return dateKey(date);
  return minutesSinceMidnight(date) <= parseTime(window.end) ? dateKey(addDays(date, -1)) : dateKey(date);
}

function windowRangeForDate(date, window) {
  const start = dateAtTime(date, window.start);
  const end = dateAtTime(date, window.end);
  if (windowWraps(window)) {
    end.setDate(end.getDate() + 1);
  }
  return { start, end };
}

function windowWraps(window) {
  return parseTime(window.start) > parseTime(window.end);
}

function dateAtTime(date, time) {
  const result = dateFromKey(date);
  const [hours, minutes] = time.split(":").map(Number);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function dateFromKey(value) {
  const [year, month, day] = value.split("-").map(Number);
  const result = new Date();
  result.setFullYear(year, month - 1, day);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatWindow(window) {
  return windowWraps(window) ? `${window.start} - 次日 ${window.end}` : `${window.start} - ${window.end}`;
}

function statusText(status) {
  return (
    {
      done: "已记录",
      active: "可记录",
      missed: "已错过",
      pending: "待记录",
      future: "未开始",
    }[status] || "未开始"
  );
}

function showMessage(message) {
  els.statusText.textContent = message;
}

function loadState() {
  const defaults = {
    days: {},
    progress: 0,
    completedDays: 0,
    boxCredits: 0,
    openedBoxes: [],
    startedAt: dateKey(new Date()),
  };

  try {
    const stored = JSON.parse(localStorage.getItem(CONFIG.storageKey));
    const state = { ...defaults, ...stored };
    if (!state.startedAt) {
      state.startedAt = Object.keys(state.days).sort()[0] || defaults.startedAt;
    }
    return state;
  } catch {
    return defaults;
  }
}

function saveState() {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
}
