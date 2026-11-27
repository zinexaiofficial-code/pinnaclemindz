/**
 * PinnacleMindz — Free Online Gantt Chart Maker
 * Pure Vanilla JavaScript • Client-Side Only • Zero Persistence
 */

(function () {
  'use strict';

  // ==========================================================
  // 1. Constants & Date Utilities
  // ==========================================================

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const FULL_MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const ROW_HEIGHT = 40; // Pixels per task row
  const HEADER_HEIGHT = 54;
  const BAR_HEIGHT = 24;
  const BAR_TOP_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2; // 8px

  /**
   * Parse YYYY-MM-DD string into UTC Date object
   */
  function parseDate(dateStr) {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-').map(Number);
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  }

  /**
   * Format UTC Date object to YYYY-MM-DD
   */
  function formatDate(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Format date for readable display (e.g. 05 Dec 2026)
   */
  function formatDisplayDate(dateStr) {
    const d = parseDate(dateStr);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = MONTH_NAMES[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day} ${month} ${year}`;
  }

  /**
   * Calculate inclusive calendar days between two YYYY-MM-DD strings
   */
  function daysBetween(startStr, endStr) {
    const t1 = parseDate(startStr).getTime();
    const t2 = parseDate(endStr).getTime();
    return Math.round((t2 - t1) / 86400000) + 1;
  }

  /**
   * Add calendar days to a YYYY-MM-DD string
   */
  function addDays(dateStr, n) {
    const d = parseDate(dateStr);
    d.setUTCDate(d.getUTCDate() + n);
    return formatDate(d);
  }

  /**
   * Get days count in a given month of a given year (leap year aware)
   */
  function getDaysInMonth(year, monthIndex) {
    return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  }

  /**
   * Return today's date formatted as YYYY-MM-DD in UTC
   */
  function getTodayString() {
    const now = new Date();
    return formatDate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
  }

  // ==========================================================
  // 2. Application State (In-Memory Only, Never Persisted)
  // ==========================================================

  const state = {
    projectTitle: 'Undergraduate Final Year Project Schedule',
    tasks: [],
    viewMode: 'month', // 'day' | 'week' | 'month'
    zoomLevel: 1.0,    // Multiplier (0.4x - 2.5x)
    timelineStart: '',
    timelineEnd: '',
    totalDays: 0,
    editingTaskId: null,
    nextIdCounter: 1
  };

  // Base pixels per calendar day for each view mode at zoom 1.0
  const BASE_PIXELS_PER_DAY = {
    day: 36,
    week: 10,
    month: 4.2
  };

  function getPixelsPerDay() {
    const base = BASE_PIXELS_PER_DAY[state.viewMode] || 4.2;
    return base * state.zoomLevel;
  }

  // ==========================================================
  // 3. Realistic Undergraduate Software Engineering Example
  // ==========================================================

  function generateExampleSchedule() {
    // Generate dates relative to current month so it never gets outdated
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-based

    // Start on the 1st of current month
    const baseDate = new Date(Date.UTC(year, month, 1));
    const baseStr = formatDate(baseDate);

    return [
      {
        id: 'task_' + Date.now() + '_1',
        name: 'Planning & Requirements Gathering',
        startDate: addDays(baseStr, 0),
        endDate: addDays(baseStr, 14) // 15 days
      },
      {
        id: 'task_' + Date.now() + '_2',
        name: 'System Analysis & Architecture Design',
        startDate: addDays(baseStr, 10),
        endDate: addDays(baseStr, 25) // 16 days
      },
      {
        id: 'task_' + Date.now() + '_3',
        name: 'UI/UX Wireframing & Interactive Prototyping',
        startDate: addDays(baseStr, 20),
        endDate: addDays(baseStr, 40) // 21 days
      },
      {
        id: 'task_' + Date.now() + '_4',
        name: 'Database Schema & Data Model Setup',
        startDate: addDays(baseStr, 35),
        endDate: addDays(baseStr, 52) // 18 days
      },
      {
        id: 'task_' + Date.now() + '_5',
        name: 'Authentication & Role-Based Access Control',
        startDate: addDays(baseStr, 48),
        endDate: addDays(baseStr, 65) // 18 days
      },
      {
        id: 'task_' + Date.now() + '_6',
        name: 'Core Functional Modules Development',
        startDate: addDays(baseStr, 60),
        endDate: addDays(baseStr, 98) // 39 days
      },
      {
        id: 'task_' + Date.now() + '_7',
        name: 'API Integration & Service Orchestration',
        startDate: addDays(baseStr, 85),
        endDate: addDays(baseStr, 110) // 26 days
      },
      {
        id: 'task_' + Date.now() + '_8',
        name: 'System Testing, QA & Security Verification',
        startDate: addDays(baseStr, 102),
        endDate: addDays(baseStr, 122) // 21 days
      },
      {
        id: 'task_' + Date.now() + '_9',
        name: 'Dissertation & Technical Documentation',
        startDate: addDays(baseStr, 90),
        endDate: addDays(baseStr, 132) // 43 days
      },
      {
        id: 'task_' + Date.now() + '_10',
        name: 'Viva Defense & Final Project Presentation',
        startDate: addDays(baseStr, 128),
        endDate: addDays(baseStr, 138) // 11 days
      }
    ];
  }

  // ==========================================================
  // 4. Timeline Range Calculation
  // ==========================================================

  function updateTimelineBounds() {
    if (state.tasks.length === 0) {
      const todayStr = getTodayString();
      const d = parseDate(todayStr);
      const startOfMonth = formatDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
      const endOfThreeMonths = formatDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 3, 0)));
      state.timelineStart = startOfMonth;
      state.timelineEnd = endOfThreeMonths;
      state.totalDays = daysBetween(state.timelineStart, state.timelineEnd);
      return;
    }

    let minDateStr = state.tasks[0].startDate;
    let maxDateStr = state.tasks[0].endDate;

    for (const t of state.tasks) {
      if (t.startDate < minDateStr) minDateStr = t.startDate;
      if (t.endDate > maxDateStr) maxDateStr = t.endDate;
    }

    const minD = parseDate(minDateStr);
    const maxD = parseDate(maxDateStr);

    // Provide comfortable month/day padding so bars do not clip the edges
    const startYear = minD.getUTCFullYear();
    const startMonth = minD.getUTCMonth();
    // Start on the 1st of the earliest month (or 7 days prior if day is already 1st)
    let paddedStart = new Date(Date.UTC(startYear, startMonth, 1));
    if (minD.getUTCDate() <= 3) {
      paddedStart = new Date(Date.UTC(startYear, startMonth - 1, 1));
    }

    // End on the last day of the latest month (or extra month if close to end)
    const endYear = maxD.getUTCFullYear();
    const endMonth = maxD.getUTCMonth();
    let paddedEnd = new Date(Date.UTC(endYear, endMonth + 1, 0));
    if (maxD.getUTCDate() >= getDaysInMonth(endYear, endMonth) - 3) {
      paddedEnd = new Date(Date.UTC(endYear, endMonth + 2, 0));
    }

    state.timelineStart = formatDate(paddedStart);
    state.timelineEnd = formatDate(paddedEnd);
    state.totalDays = daysBetween(state.timelineStart, state.timelineEnd);
  }

  // ==========================================================
  // 5. DOM References
  // ==========================================================

  const dom = {
    projectTitle: document.getElementById('projectTitle'),
    timelineSummary: document.getElementById('timelineSummary'),
    btnAddTask: document.getElementById('btnAddTask'),
    btnLoadExample: document.getElementById('btnLoadExample'),
    btnNewChart: document.getElementById('btnNewChart'),
    viewBtns: document.querySelectorAll('.segment-btn'),
    btnZoomOut: document.getElementById('btnZoomOut'),
    btnZoomIn: document.getElementById('btnZoomIn'),
    btnZoomToFit: document.getElementById('btnZoomToFit'),
    zoomLevelDisplay: document.getElementById('zoomLevelDisplay'),
    exportQuality: document.getElementById('exportQuality'),
    btnExportPNG: document.getElementById('btnExportPNG'),
    panelLeft: document.getElementById('panelLeft'),
    panelRight: document.getElementById('panelRight'),
    taskTableBody: document.getElementById('taskTableBody'),
    ganttSplitter: document.getElementById('ganttSplitter'),
    timelineHeaderContainer: document.getElementById('timelineHeaderContainer'),
    timelineHeaderWrap: document.getElementById('timelineHeaderWrap'),
    tierYear: document.getElementById('tierYear'),
    tierSub: document.getElementById('tierSub'),
    timelineBodyContainer: document.getElementById('timelineBodyContainer'),
    timelineContent: document.getElementById('timelineContent'),
    timelineGridLines: document.getElementById('timelineGridLines'),
    timelineBarsLayer: document.getElementById('timelineBarsLayer'),
    emptyState: document.getElementById('emptyState'),
    btnEmptyAddTask: document.getElementById('btnEmptyAddTask'),
    btnEmptyLoadExample: document.getElementById('btnEmptyLoadExample'),
    taskModalOverlay: document.getElementById('taskModalOverlay'),
    modalTitle: document.getElementById('modalTitle'),
    btnModalClose: document.getElementById('btnModalClose'),
    btnModalCancel: document.getElementById('btnModalCancel'),
    taskForm: document.getElementById('taskForm'),
    inputTaskName: document.getElementById('inputTaskName'),
    inputStartDate: document.getElementById('inputStartDate'),
    inputEndDate: document.getElementById('inputEndDate'),
    modalDurationDisplay: document.getElementById('modalDurationDisplay'),
    formError: document.getElementById('formError'),
    ganttTooltip: document.getElementById('ganttTooltip'),
    toastContainer: document.getElementById('toastContainer'),
    menuBtn: document.getElementById('menu'),
    nav: document.getElementById('nav')
  };

  // ==========================================================
  // 6. Rendering Logic: Task Table & Timeline
  // ==========================================================

  function renderChart() {
    updateTimelineBounds();
    updateTimelineSummary();

    const pixelsPerDay = getPixelsPerDay();
    const totalWidth = Math.max(state.totalDays * pixelsPerDay, dom.panelRight.clientWidth || 600);

    // Check empty state
    if (state.tasks.length === 0) {
      dom.emptyState.style.display = 'flex';
      dom.taskTableBody.innerHTML = '';
      dom.tierYear.innerHTML = '';
      dom.tierSub.innerHTML = '';
      dom.timelineGridLines.innerHTML = '';
      dom.timelineBarsLayer.innerHTML = '';
      return;
    } else {
      dom.emptyState.style.display = 'none';
    }

    // Set timeline width
    dom.timelineHeaderWrap.style.width = totalWidth + 'px';
    dom.timelineContent.style.width = totalWidth + 'px';
    const totalHeight = state.tasks.length * ROW_HEIGHT;
    dom.timelineContent.style.height = Math.max(totalHeight, dom.timelineBodyContainer.clientHeight || 400) + 'px';

    renderTaskTable();
    renderTimelineHeader(totalWidth, pixelsPerDay);
    renderTimelineGrid(totalWidth, totalHeight, pixelsPerDay);
    renderTaskBars(pixelsPerDay);
  }

  function updateTimelineSummary() {
    if (state.tasks.length === 0) {
      dom.timelineSummary.innerHTML = `<span>0 Tasks</span>`;
      return;
    }
    let minDate = state.tasks[0].startDate;
    let maxDate = state.tasks[0].endDate;
    for (const t of state.tasks) {
      if (t.startDate < minDate) minDate = t.startDate;
      if (t.endDate > maxDate) maxDate = t.endDate;
    }
    const totalSpan = daysBetween(minDate, maxDate);
    dom.timelineSummary.innerHTML = `
      <span><strong>${state.tasks.length}</strong> Tasks</span>
      <span>•</span>
      <span>${formatDisplayDate(minDate)} – ${formatDisplayDate(maxDate)}</span>
      <span>•</span>
      <span>Total: <strong>${totalSpan}</strong> Days</span>
    `;
  }

  /**
   * Render Left Panel Task Rows
   */
  function renderTaskTable() {
    dom.taskTableBody.innerHTML = '';

    state.tasks.forEach((task, index) => {
      const row = document.createElement('div');
      row.className = 'task-row';
      row.dataset.taskId = task.id;
      row.dataset.index = index;
      row.draggable = true;

      // Sequential display ID (1, 2, 3...)
      const displayId = index + 1;

      row.innerHTML = `
        <div class="task-cell-id" title="Task #${displayId}">${displayId}</div>
        <div class="task-cell-name" title="${escapeHtml(task.name)} (Double click to edit)">
          ${escapeHtml(task.name)}
        </div>
        <div class="task-cell-actions">
          <button type="button" class="row-action-btn move-btn move-up-btn" title="Move Up" ${index === 0 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
            <svg viewBox="0 0 24 24"><path d="M7 14l5-5 5 5z"/></svg>
          </button>
          <button type="button" class="row-action-btn move-btn move-down-btn" title="Move Down" ${index === state.tasks.length - 1 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
            <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
          </button>
          <button type="button" class="row-action-btn edit-btn" title="Edit Task">
            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button type="button" class="row-action-btn delete-btn" title="Delete Task">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      `;

      // Event handlers for row actions
      row.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditTaskModal(task.id);
      });

      row.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
      });

      const moveUpBtn = row.querySelector('.move-up-btn');
      if (moveUpBtn && index > 0) {
        moveUpBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          moveTask(index, index - 1);
        });
      }

      const moveDownBtn = row.querySelector('.move-down-btn');
      if (moveDownBtn && index < state.tasks.length - 1) {
        moveDownBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          moveTask(index, index + 1);
        });
      }

      // Double-click row to edit
      row.addEventListener('dblclick', () => {
        openEditTaskModal(task.id);
      });

      // Hover sync highlighting between table row and timeline row
      row.addEventListener('mouseenter', () => highlightRow(index, true));
      row.addEventListener('mouseleave', () => highlightRow(index, false));

      // Drag and drop reordering
      setupRowDragAndDrop(row, index);

      dom.taskTableBody.appendChild(row);
    });
  }

  /**
   * Render Timeline Headers (Year tier + Month/Week/Day tier)
   */
  function renderTimelineHeader(totalWidth, pixelsPerDay) {
    dom.tierYear.innerHTML = '';
    dom.tierSub.innerHTML = '';

    const startD = parseDate(state.timelineStart);
    const endD = parseDate(state.timelineEnd);
    const todayStr = getTodayString();

    if (state.viewMode === 'month') {
      renderMonthViewHeaders(startD, endD, pixelsPerDay);
    } else if (state.viewMode === 'week') {
      renderWeekViewHeaders(startD, endD, pixelsPerDay);
    } else {
      renderDayViewHeaders(startD, endD, pixelsPerDay, todayStr);
    }
  }

  function renderMonthViewHeaders(startD, endD, pixelsPerDay) {
    let curr = new Date(startD.getTime());
    let currentYear = null;
    let yearCell = null;
    let yearDays = 0;

    while (curr.getTime() <= endD.getTime()) {
      const y = curr.getUTCFullYear();
      const m = curr.getUTCMonth();
      const daysInThisMonth = getDaysInMonth(y, m);

      // Remaining days in this month from curr
      const monthStartDay = curr.getUTCDate();
      const daysCount = (daysInThisMonth - monthStartDay + 1);

      // Width of this month segment
      const width = daysCount * pixelsPerDay;

      // Sub header (Month Name)
      const subCell = document.createElement('div');
      subCell.className = 'header-cell';
      subCell.style.width = width + 'px';
      subCell.textContent = width > 50 ? `${MONTH_NAMES[m]} ${y}` : `${MONTH_NAMES[m]}`;
      dom.tierSub.appendChild(subCell);

      // Year grouping
      if (y !== currentYear) {
        if (yearCell && yearDays > 0) {
          yearCell.style.width = (yearDays * pixelsPerDay) + 'px';
        }
        currentYear = y;
        yearDays = daysCount;
        yearCell = document.createElement('div');
        yearCell.className = 'header-cell';
        yearCell.textContent = String(y);
        dom.tierYear.appendChild(yearCell);
      } else {
        yearDays += daysCount;
      }

      // Move to 1st of next month
      curr = new Date(Date.UTC(y, m + 1, 1));
    }

    if (yearCell && yearDays > 0) {
      yearCell.style.width = (yearDays * pixelsPerDay) + 'px';
    }
  }

  function renderWeekViewHeaders(startD, endD, pixelsPerDay) {
    let curr = new Date(startD.getTime());
    let currentMonthYear = null;
    let monthCell = null;
    let monthDays = 0;

    let weekDayCount = 0;
    let weekStart = new Date(curr.getTime());

    while (curr.getTime() <= endD.getTime()) {
      const y = curr.getUTCFullYear();
      const m = curr.getUTCMonth();
      const myKey = `${y}-${m}`;

      // Group Top Tier by Month & Year
      if (myKey !== currentMonthYear) {
        if (monthCell && monthDays > 0) {
          monthCell.style.width = (monthDays * pixelsPerDay) + 'px';
        }
        currentMonthYear = myKey;
        monthDays = 1;
        monthCell = document.createElement('div');
        monthCell.className = 'header-cell';
        monthCell.textContent = `${FULL_MONTH_NAMES[m]} ${y}`;
        dom.tierYear.appendChild(monthCell);
      } else {
        monthDays++;
      }

      weekDayCount++;
      // A week is 7 days, or when Sunday ends, or end of timeline
      const dayOfWeek = curr.getUTCDay(); // 0 is Sunday
      const isEnd = curr.getTime() === endD.getTime();

      if (dayOfWeek === 0 || isEnd || weekDayCount === 7) {
        const weekWidth = weekDayCount * pixelsPerDay;
        const subCell = document.createElement('div');
        subCell.className = 'header-cell';
        subCell.style.width = weekWidth + 'px';
        const startDay = weekStart.getUTCDate();
        const startM = MONTH_NAMES[weekStart.getUTCMonth()];
        subCell.textContent = weekWidth > 45 ? `${startM} ${startDay}` : `${startDay}`;
        dom.tierSub.appendChild(subCell);

        // Reset next week start
        const nextD = new Date(curr.getTime());
        nextD.setUTCDate(nextD.getUTCDate() + 1);
        weekStart = nextD;
        weekDayCount = 0;
      }

      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    if (monthCell && monthDays > 0) {
      monthCell.style.width = (monthDays * pixelsPerDay) + 'px';
    }
  }

  function renderDayViewHeaders(startD, endD, pixelsPerDay, todayStr) {
    let curr = new Date(startD.getTime());
    let currentMonthYear = null;
    let monthCell = null;
    let monthDays = 0;

    while (curr.getTime() <= endD.getTime()) {
      const y = curr.getUTCFullYear();
      const m = curr.getUTCMonth();
      const d = curr.getUTCDate();
      const dayOfWeek = curr.getUTCDay();
      const dateStr = formatDate(curr);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = dateStr === todayStr;

      // Group Month & Year on Tier 1
      const myKey = `${y}-${m}`;
      if (myKey !== currentMonthYear) {
        if (monthCell && monthDays > 0) {
          monthCell.style.width = (monthDays * pixelsPerDay) + 'px';
        }
        currentMonthYear = myKey;
        monthDays = 1;
        monthCell = document.createElement('div');
        monthCell.className = 'header-cell';
        monthCell.textContent = `${FULL_MONTH_NAMES[m]} ${y}`;
        dom.tierYear.appendChild(monthCell);
      } else {
        monthDays++;
      }

      // Day on Tier 2
      const subCell = document.createElement('div');
      subCell.className = 'header-cell' + (isWeekend ? ' weekend' : '') + (isToday ? ' today' : '');
      subCell.style.width = pixelsPerDay + 'px';
      subCell.textContent = pixelsPerDay > 30 ? `${d} ${DAY_INITIALS[dayOfWeek]}` : `${d}`;
      subCell.title = `${DAY_NAMES[dayOfWeek]}, ${d} ${MONTH_NAMES[m]} ${y}`;
      dom.tierSub.appendChild(subCell);

      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    if (monthCell && monthDays > 0) {
      monthCell.style.width = (monthDays * pixelsPerDay) + 'px';
    }
  }

  /**
   * Render Timeline Grid Lines (Vertical columns & Horizontal rows)
   */
  function renderTimelineGrid(totalWidth, totalHeight, pixelsPerDay) {
    dom.timelineGridLines.innerHTML = '';
    const todayStr = getTodayString();

    // 1. Horizontal row lines
    state.tasks.forEach((task, index) => {
      const rowLine = document.createElement('div');
      rowLine.className = 'grid-row-line';
      rowLine.style.top = (index * ROW_HEIGHT) + 'px';
      rowLine.dataset.index = index;

      rowLine.addEventListener('mouseenter', () => highlightRow(index, true));
      rowLine.addEventListener('mouseleave', () => highlightRow(index, false));

      dom.timelineGridLines.appendChild(rowLine);
    });

    // 2. Vertical day/week column lines
    if (state.viewMode === 'day') {
      let curr = parseDate(state.timelineStart);
      const endD = parseDate(state.timelineEnd);
      let dayIndex = 0;

      while (curr.getTime() <= endD.getTime()) {
        const dayOfWeek = curr.getUTCDay();
        const dateStr = formatDate(curr);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isToday = dateStr === todayStr;

        const col = document.createElement('div');
        col.className = 'grid-col' + (isWeekend ? ' weekend' : '') + (isToday ? ' today-line' : '');
        col.style.left = (dayIndex * pixelsPerDay) + 'px';
        col.style.width = pixelsPerDay + 'px';
        dom.timelineGridLines.appendChild(col);

        curr.setUTCDate(curr.getUTCDate() + 1);
        dayIndex++;
      }
    } else if (state.viewMode === 'week') {
      let curr = parseDate(state.timelineStart);
      const endD = parseDate(state.timelineEnd);
      let dayIndex = 0;

      while (curr.getTime() <= endD.getTime()) {
        const dayOfWeek = curr.getUTCDay();
        if (dayOfWeek === 1 || dayIndex === 0) {
          const col = document.createElement('div');
          col.className = 'grid-col';
          col.style.left = (dayIndex * pixelsPerDay) + 'px';
          col.style.width = (7 * pixelsPerDay) + 'px';
          dom.timelineGridLines.appendChild(col);
        }
        curr.setUTCDate(curr.getUTCDate() + 1);
        dayIndex++;
      }
    } else {
      // Month view: vertical lines at each month boundary
      let curr = parseDate(state.timelineStart);
      const endD = parseDate(state.timelineEnd);

      while (curr.getTime() <= endD.getTime()) {
        const y = curr.getUTCFullYear();
        const m = curr.getUTCMonth();
        const daysInMonth = getDaysInMonth(y, m);
        const startDay = curr.getUTCDate();
        const count = daysInMonth - startDay + 1;

        const leftDays = daysBetween(state.timelineStart, formatDate(curr)) - 1;
        const col = document.createElement('div');
        col.className = 'grid-col';
        col.style.left = (leftDays * pixelsPerDay) + 'px';
        col.style.width = (count * pixelsPerDay) + 'px';
        dom.timelineGridLines.appendChild(col);

        curr = new Date(Date.UTC(y, m + 1, 1));
      }
    }
  }

  /**
   * Render Interactive Blue Task Bars
   */
  function renderTaskBars(pixelsPerDay) {
    dom.timelineBarsLayer.innerHTML = '';

    state.tasks.forEach((task, index) => {
      // Calculate start offset in days from timelineStart
      const offsetDays = daysBetween(state.timelineStart, task.startDate) - 1;
      const durationDays = daysBetween(task.startDate, task.endDate);

      const leftPx = offsetDays * pixelsPerDay;
      const widthPx = Math.max(durationDays * pixelsPerDay, 6); // Minimum 6px width
      const topPx = (index * ROW_HEIGHT) + BAR_TOP_OFFSET;

      const bar = document.createElement('div');
      bar.className = 'task-bar-item';
      bar.id = `bar_${task.id}`;
      bar.dataset.taskId = task.id;
      bar.dataset.index = index;
      bar.style.left = leftPx + 'px';
      bar.style.top = topPx + 'px';
      bar.style.width = widthPx + 'px';

      bar.innerHTML = `
        <div class="bar-resize-handle handle-left" title="Drag to change start date"></div>
        <div class="bar-resize-handle handle-right" title="Drag to change end date"></div>
      `;

      // Tooltip events
      bar.addEventListener('mouseenter', (e) => showTooltip(e, task, durationDays));
      bar.addEventListener('mousemove', (e) => positionTooltip(e));
      bar.addEventListener('mouseleave', () => hideTooltip());

      // Click / double-click to edit
      bar.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        openEditTaskModal(task.id);
      });

      // Synchronized row highlighting
      bar.addEventListener('mouseenter', () => highlightRow(index, true));
      bar.addEventListener('mouseleave', () => highlightRow(index, false));

      // Drag & Resize interactions
      setupBarInteractions(bar, task, index, pixelsPerDay);

      dom.timelineBarsLayer.appendChild(bar);
    });
  }

  function highlightRow(index, isHighlighted) {
    const tableRows = dom.taskTableBody.querySelectorAll('.task-row');
    const gridRows = dom.timelineGridLines.querySelectorAll('.grid-row-line');
    if (tableRows[index]) {
      tableRows[index].classList.toggle('highlighted', isHighlighted);
    }
    if (gridRows[index]) {
      gridRows[index].classList.toggle('highlighted', isHighlighted);
    }
  }

  // ==========================================================
  // 7. Interactive Bar Dragging & Resizing Logic
  // ==========================================================

  function setupBarInteractions(bar, task, index, pixelsPerDay) {
    const handleLeft = bar.querySelector('.handle-left');
    const handleRight = bar.querySelector('.handle-right');

    // Pointer-down on left handle (resize start date)
    handleLeft.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      startBarAction('resize-left', e, task, bar, pixelsPerDay);
    });

    // Pointer-down on right handle (resize end date)
    handleRight.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      startBarAction('resize-right', e, task, bar, pixelsPerDay);
    });

    // Pointer-down on middle bar body (move whole bar)
    bar.addEventListener('pointerdown', (e) => {
      if (e.target === handleLeft || e.target === handleRight) return;
      e.stopPropagation();
      e.preventDefault();
      startBarAction('move', e, task, bar, pixelsPerDay);
    });
  }

  function startBarAction(actionType, startEvent, task, bar, pixelsPerDay) {
    const startX = startEvent.clientX;
    const origStartDate = task.startDate;
    const origEndDate = task.endDate;
    const origDuration = daysBetween(origStartDate, origEndDate);

    bar.classList.add('dragging');
    hideTooltip();

    let currentStart = origStartDate;
    let currentEnd = origEndDate;

    function onPointerMove(e) {
      const deltaX = e.clientX - startX;
      // Convert pixel delta to integer days delta
      const deltaDays = Math.round(deltaX / pixelsPerDay);

      if (actionType === 'move') {
        currentStart = addDays(origStartDate, deltaDays);
        currentEnd = addDays(origEndDate, deltaDays);
      } else if (actionType === 'resize-left') {
        const candidateStart = addDays(origStartDate, deltaDays);
        // Start date cannot exceed end date
        if (candidateStart <= origEndDate) {
          currentStart = candidateStart;
          currentEnd = origEndDate;
        }
      } else if (actionType === 'resize-right') {
        const candidateEnd = addDays(origEndDate, deltaDays);
        // End date cannot be before start date
        if (candidateEnd >= origStartDate) {
          currentEnd = candidateEnd;
          currentStart = origStartDate;
        }
      }

      // Update bar visual position immediately
      const newOffset = daysBetween(state.timelineStart, currentStart) - 1;
      const newDur = daysBetween(currentStart, currentEnd);
      bar.style.left = (newOffset * pixelsPerDay) + 'px';
      bar.style.width = Math.max(newDur * pixelsPerDay, 6) + 'px';

      // Show live tooltip with dates
      showLiveActionTooltip(e, task.name, currentStart, currentEnd, newDur);
    }

    function onPointerUp() {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      bar.classList.remove('dragging');
      hideTooltip();

      // Commit changes if dates moved
      if (currentStart !== origStartDate || currentEnd !== origEndDate) {
        task.startDate = currentStart;
        task.endDate = currentEnd;
        renderChart();
      }
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  function showLiveActionTooltip(e, name, start, end, duration) {
    dom.ganttTooltip.style.display = 'block';
    dom.ganttTooltip.innerHTML = `
      <div class="tooltip-title">${escapeHtml(name)}</div>
      <div class="tooltip-meta"><strong>Start:</strong> ${formatDisplayDate(start)}</div>
      <div class="tooltip-meta"><strong>End:</strong> ${formatDisplayDate(end)}</div>
      <div class="tooltip-meta"><strong>Duration:</strong> ${duration} ${duration === 1 ? 'day' : 'days'}</div>
    `;
    positionTooltip(e);
  }

  function showTooltip(e, task, duration) {
    dom.ganttTooltip.style.display = 'block';
    dom.ganttTooltip.innerHTML = `
      <div class="tooltip-title">${escapeHtml(task.name)}</div>
      <div class="tooltip-meta"><strong>Start Date:</strong> ${formatDisplayDate(task.startDate)}</div>
      <div class="tooltip-meta"><strong>End Date:</strong> ${formatDisplayDate(task.endDate)}</div>
      <div class="tooltip-meta"><strong>Duration:</strong> ${duration} ${duration === 1 ? 'calendar day' : 'calendar days'}</div>
      <div style="font-size: 10.5px; color: #94A3B8; margin-top: 4px;">Double click to edit • Drag to adjust</div>
    `;
    positionTooltip(e);
  }

  function positionTooltip(e) {
    const tip = dom.ganttTooltip;
    const x = e.clientX + 14;
    const y = e.clientY + 14;
    const maxX = window.innerWidth - tip.offsetWidth - 10;
    const maxY = window.innerHeight - tip.offsetHeight - 10;
    tip.style.left = Math.min(x, maxX) + 'px';
    tip.style.top = Math.min(y, maxY) + 'px';
  }

  function hideTooltip() {
    dom.ganttTooltip.style.display = 'none';
  }

  // ==========================================================
  // 8. Drag and Drop Task Reordering
  // ==========================================================

  let draggedIndex = null;

  function setupRowDragAndDrop(row, index) {
    row.addEventListener('dragstart', (e) => {
      draggedIndex = index;
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index);
    });

    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      document.querySelectorAll('.task-row').forEach(r => r.classList.remove('drag-over'));
      draggedIndex = null;
    });

    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      row.classList.add('drag-over');
    });

    row.addEventListener('dragleave', () => {
      row.classList.remove('drag-over');
    });

    row.addEventListener('drop', (e) => {
      e.preventDefault();
      row.classList.remove('drag-over');
      const targetIndex = index;
      if (draggedIndex !== null && draggedIndex !== targetIndex) {
        moveTask(draggedIndex, targetIndex);
      }
    });
  }

  function moveTask(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= state.tasks.length || toIndex < 0 || toIndex >= state.tasks.length) return;
    const [moved] = state.tasks.splice(fromIndex, 1);
    state.tasks.splice(toIndex, 0, moved);
    renderChart();
  }

  // ==========================================================
  // 9. Task CRUD & Modal Editor
  // ==========================================================

  function openAddTaskModal() {
    state.editingTaskId = null;
    dom.modalTitle.textContent = 'Add New Task';

    dom.inputTaskName.value = '';

    // Smart default dates
    let defaultStart = getTodayString();
    if (state.tasks.length > 0) {
      // Default start = day after latest task end date
      let maxEnd = state.tasks[0].endDate;
      for (const t of state.tasks) {
        if (t.endDate > maxEnd) maxEnd = t.endDate;
      }
      defaultStart = addDays(maxEnd, 1);
    }
    const defaultEnd = addDays(defaultStart, 13); // Default 14-day duration

    dom.inputStartDate.value = defaultStart;
    dom.inputEndDate.value = defaultEnd;

    updateModalDuration();
    hideFormError();

    dom.taskModalOverlay.classList.add('open');
    setTimeout(() => dom.inputTaskName.focus(), 50);
  }

  function openEditTaskModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    state.editingTaskId = taskId;
    dom.modalTitle.textContent = 'Edit Task';

    dom.inputTaskName.value = task.name;
    dom.inputStartDate.value = task.startDate;
    dom.inputEndDate.value = task.endDate;

    updateModalDuration();
    hideFormError();

    dom.taskModalOverlay.classList.add('open');
    setTimeout(() => dom.inputTaskName.focus(), 50);
  }

  function closeTaskModal() {
    dom.taskModalOverlay.classList.remove('open');
    state.editingTaskId = null;
  }

  function updateModalDuration() {
    const s = dom.inputStartDate.value;
    const e = dom.inputEndDate.value;
    if (s && e && s <= e) {
      const dur = daysBetween(s, e);
      dom.modalDurationDisplay.innerHTML = `Duration: <strong>${dur}</strong> ${dur === 1 ? 'calendar day' : 'calendar days'} (inclusive)`;
    } else if (s && e && s > e) {
      dom.modalDurationDisplay.innerHTML = `<span style="color:#EF4444;">Invalid: End date must be on or after start date</span>`;
    }
  }

  function saveTask(e) {
    e.preventDefault();
    const name = dom.inputTaskName.value.trim();
    const startDate = dom.inputStartDate.value;
    const endDate = dom.inputEndDate.value;

    // Validation
    if (!name) {
      showFormError('Please enter a task name.');
      dom.inputTaskName.focus();
      return;
    }
    if (!startDate) {
      showFormError('Please select a valid start date.');
      dom.inputStartDate.focus();
      return;
    }
    if (!endDate) {
      showFormError('Please select a valid end date.');
      dom.inputEndDate.focus();
      return;
    }
    if (endDate < startDate) {
      showFormError('End date cannot be earlier than start date.');
      dom.inputEndDate.focus();
      return;
    }

    if (state.editingTaskId) {
      // Edit existing
      const task = state.tasks.find(t => t.id === state.editingTaskId);
      if (task) {
        task.name = name;
        task.startDate = startDate;
        task.endDate = endDate;
        showToast('Task updated successfully', 'success');
      }
    } else {
      // Add new
      const newTask = {
        id: 'task_' + Date.now() + '_' + (state.nextIdCounter++),
        name: name,
        startDate: startDate,
        endDate: endDate
      };
      state.tasks.push(newTask);
      showToast('Task added to schedule', 'success');
    }

    closeTaskModal();
    renderChart();
  }

  function deleteTask(taskId) {
    const idx = state.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;
    const taskName = state.tasks[idx].name;
    state.tasks.splice(idx, 1);
    showToast(`Deleted "${taskName}"`, 'success');
    renderChart();
  }

  function showFormError(msg) {
    dom.formError.textContent = msg;
    dom.formError.style.display = 'block';
  }

  function hideFormError() {
    dom.formError.style.display = 'none';
    dom.formError.textContent = '';
  }

  // ==========================================================
  // 10. Splitter Resizing (Left & Right Panel Split)
  // ==========================================================

  function setupSplitter() {
    const splitter = dom.ganttSplitter;
    const leftPanel = dom.panelLeft;

    splitter.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      splitter.classList.add('active');
      const startX = e.clientX;
      const startWidth = leftPanel.offsetWidth;

      function onPointerMove(moveEvent) {
        const delta = moveEvent.clientX - startX;
        const newWidth = Math.max(180, Math.min(550, startWidth + delta));
        leftPanel.style.width = newWidth + 'px';
      }

      function onPointerUp() {
        splitter.classList.remove('active');
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      }

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    });
  }

  // ==========================================================
  // 11. Synchronized Scrolling
  // ==========================================================

  function setupSynchronizedScrolling() {
    let isSyncing = false;

    // Sync vertical scroll between taskTableBody and timelineBodyContainer
    dom.timelineBodyContainer.addEventListener('scroll', () => {
      if (isSyncing) return;
      isSyncing = true;
      dom.taskTableBody.scrollTop = dom.timelineBodyContainer.scrollTop;
      // Sync horizontal scroll with header
      dom.timelineHeaderContainer.scrollLeft = dom.timelineBodyContainer.scrollLeft;
      isSyncing = false;
    });

    dom.taskTableBody.addEventListener('scroll', () => {
      if (isSyncing) return;
      isSyncing = true;
      dom.timelineBodyContainer.scrollTop = dom.taskTableBody.scrollTop;
      isSyncing = false;
    });
  }

  // ==========================================================
  // 12. Zoom & View Mode Controls
  // ==========================================================

  function setupZoomControls() {
    dom.btnZoomIn.addEventListener('click', () => {
      if (state.zoomLevel < 2.5) {
        state.zoomLevel = Math.min(2.5, +(state.zoomLevel + 0.25).toFixed(2));
        updateZoomDisplay();
        renderChart();
      }
    });

    dom.btnZoomOut.addEventListener('click', () => {
      if (state.zoomLevel > 0.4) {
        state.zoomLevel = Math.max(0.4, +(state.zoomLevel - 0.25).toFixed(2));
        updateZoomDisplay();
        renderChart();
      }
    });

    dom.btnZoomToFit.addEventListener('click', () => {
      zoomToFit();
    });

    dom.viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.viewMode = btn.dataset.view;
        state.zoomLevel = 1.0;
        updateZoomDisplay();
        renderChart();
      });
    });
  }

  function zoomToFit() {
    if (state.totalDays <= 0) return;
    const containerWidth = dom.panelRight.clientWidth - 20; // with margin
    if (containerWidth <= 0) return;

    const basePerDay = BASE_PIXELS_PER_DAY[state.viewMode];
    const optimalPerDay = containerWidth / state.totalDays;
    const calculatedZoom = optimalPerDay / basePerDay;

    state.zoomLevel = Math.max(0.3, Math.min(2.5, +calculatedZoom.toFixed(2)));
    updateZoomDisplay();
    renderChart();
  }

  function updateZoomDisplay() {
    dom.zoomLevelDisplay.textContent = Math.round(state.zoomLevel * 100) + '%';
  }

  // ==========================================================
  // 13. High-Quality PNG Export (Native Canvas 2D API)
  // ==========================================================

  /**
   * Export the complete Gantt chart (all tasks, full timeline) as a crisp PNG
   */
  function exportGanttChartAsPNG() {
    if (state.tasks.length === 0) {
      showToast('No tasks to export! Add tasks or load an example schedule.', 'error');
      return;
    }

    showToast('Generating high-resolution PNG...', 'success');

    // Run in requestAnimationFrame to allow toast to render
    requestAnimationFrame(() => {
      try {
        const qualityScale = Number(dom.exportQuality.value) || 3;
        const projectTitle = dom.projectTitle.value.trim() || 'Gantt Chart';

        // Layout constants for export canvas (in CSS logical pixels)
        const PADDING = 24;
        const TITLE_HEIGHT = projectTitle ? 48 : 20;
        const EXPORT_HEADER_HEIGHT = 50;
        const EXPORT_ROW_HEIGHT = 38;
        const EXPORT_BAR_HEIGHT = 22;
        const EXPORT_BAR_TOP = (EXPORT_ROW_HEIGHT - EXPORT_BAR_HEIGHT) / 2;

        const ID_COL_WIDTH = 46;
        const TASK_NAME_COL_WIDTH = 260;
        const TABLE_WIDTH = ID_COL_WIDTH + TASK_NAME_COL_WIDTH;

        // In export, we use a clean day-based or week-based timeline width so it's always compact and readable
        // Compute optimal pixels per day for export so whole timeline fits comfortably on standard academic paper
        const totalDays = state.totalDays;
        let exportPixelsPerDay = 16;
        if (totalDays > 120) exportPixelsPerDay = 10;
        if (totalDays > 240) exportPixelsPerDay = 6;
        if (totalDays > 500) exportPixelsPerDay = 3.5;

        const timelineWidth = Math.max(totalDays * exportPixelsPerDay, 600);
        const chartContentWidth = TABLE_WIDTH + timelineWidth;
        const totalChartWidth = chartContentWidth + (PADDING * 2);

        const tasksCount = state.tasks.length;
        const chartContentHeight = EXPORT_HEADER_HEIGHT + (tasksCount * EXPORT_ROW_HEIGHT);
        const totalChartHeight = PADDING + TITLE_HEIGHT + chartContentHeight + PADDING + 20; // 20px bottom footer tag

        // Create Offscreen Canvas
        const canvas = document.createElement('canvas');

        // Apply scale factor (e.g. 3x for crisp print quality)
        let scale = qualityScale;
        // Browser safety: ensure canvas dimensions do not exceed 16384px
        if (totalChartWidth * scale > 16000 || totalChartHeight * scale > 16000) {
          scale = Math.min(16000 / totalChartWidth, 16000 / totalChartHeight, 2);
        }

        canvas.width = Math.round(totalChartWidth * scale);
        canvas.height = Math.round(totalChartHeight * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas context could not be initialized');
        }

        // Scale context
        ctx.scale(scale, scale);

        // 1. Draw Clean White Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, totalChartWidth, totalChartHeight);

        let currentY = PADDING;

        // 2. Draw Project Title
        if (projectTitle) {
          ctx.fillStyle = '#0A2349';
          ctx.font = "bold 20px 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(projectTitle, PADDING, currentY);

          // Subtitle / Date range badge
          ctx.fillStyle = '#64748B';
          ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const subtitleText = `Timeline: ${formatDisplayDate(state.timelineStart)} – ${formatDisplayDate(state.timelineEnd)}  |  Total Tasks: ${tasksCount}`;
          ctx.fillText(subtitleText, PADDING, currentY + 26);

          currentY += TITLE_HEIGHT;
        }

        const chartX = PADDING;
        const chartY = currentY;

        // 3. Draw Table & Timeline Headers Background
        ctx.fillStyle = '#F5F7FA';
        ctx.fillRect(chartX, chartY, chartContentWidth, EXPORT_HEADER_HEIGHT);

        // Border around the whole chart
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1;
        ctx.strokeRect(chartX, chartY, chartContentWidth, chartContentHeight);

        // 4. Draw Header Labels & Separators
        // Header Row 1: Left Table Headers
        ctx.fillStyle = '#334155';
        ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // # (ID) Header
        ctx.fillText('#', chartX + (ID_COL_WIDTH / 2), chartY + (EXPORT_HEADER_HEIGHT / 2));

        // Line between ID and Task Name
        ctx.strokeStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.moveTo(chartX + ID_COL_WIDTH, chartY);
        ctx.lineTo(chartX + ID_COL_WIDTH, chartY + chartContentHeight);
        ctx.stroke();

        // Task Name Header
        ctx.textAlign = 'left';
        ctx.fillText('Task Name', chartX + ID_COL_WIDTH + 14, chartY + (EXPORT_HEADER_HEIGHT / 2));

        // Line between Table and Timeline
        ctx.strokeStyle = '#CBD5E1';
        ctx.beginPath();
        ctx.moveTo(chartX + TABLE_WIDTH, chartY);
        ctx.lineTo(chartX + TABLE_WIDTH, chartY + chartContentHeight);
        ctx.stroke();

        // 5. Draw Timeline Header (Year Tier + Month Tier)
        const timelineStartX = chartX + TABLE_WIDTH;
        const tier1Height = 24;
        const tier2Height = EXPORT_HEADER_HEIGHT - tier1Height;

        // Line between Tier 1 & Tier 2
        ctx.strokeStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.moveTo(timelineStartX, chartY + tier1Height);
        ctx.lineTo(timelineStartX + timelineWidth, chartY + tier1Height);
        ctx.stroke();

        // Iterate through months to draw Tier 1 (Year) and Tier 2 (Month)
        let curr = parseDate(state.timelineStart);
        const endD = parseDate(state.timelineEnd);

        let currentYear = null;
        let yearStartX = timelineStartX;
        let yearDays = 0;

        while (curr.getTime() <= endD.getTime()) {
          const y = curr.getUTCFullYear();
          const m = curr.getUTCMonth();
          const daysInMonth = getDaysInMonth(y, m);
          const startDay = curr.getUTCDate();
          const daysCount = daysInMonth - startDay + 1;
          const monthWidth = daysCount * exportPixelsPerDay;

          const monthStartX = timelineStartX + ((daysBetween(state.timelineStart, formatDate(curr)) - 1) * exportPixelsPerDay);

          // Draw vertical month grid line through header and body
          ctx.strokeStyle = '#E2E8F0';
          ctx.beginPath();
          ctx.moveTo(monthStartX, chartY);
          ctx.lineTo(monthStartX, chartY + chartContentHeight);
          ctx.stroke();

          // Tier 2 Month Label
          ctx.fillStyle = '#475569';
          ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const monthLabel = monthWidth > 45 ? `${MONTH_NAMES[m]} ${y}` : `${MONTH_NAMES[m]}`;
          ctx.fillText(monthLabel, monthStartX + (monthWidth / 2), chartY + tier1Height + (tier2Height / 2));

          // Year Tracking
          if (y !== currentYear) {
            if (currentYear !== null && yearDays > 0) {
              const prevYearWidth = yearDays * exportPixelsPerDay;
              ctx.fillStyle = '#1E293B';
              ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
              ctx.textAlign = 'center';
              ctx.fillText(String(currentYear), yearStartX + (prevYearWidth / 2), chartY + (tier1Height / 2));
            }
            currentYear = y;
            yearStartX = monthStartX;
            yearDays = daysCount;
          } else {
            yearDays += daysCount;
          }

          curr = new Date(Date.UTC(y, m + 1, 1));
        }

        // Draw last year label
        if (currentYear !== null && yearDays > 0) {
          const prevYearWidth = yearDays * exportPixelsPerDay;
          ctx.fillStyle = '#1E293B';
          ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText(String(currentYear), yearStartX + (prevYearWidth / 2), chartY + (tier1Height / 2));
        }

        // 6. Draw Horizontal Header Line below headers
        ctx.strokeStyle = '#CBD5E1';
        ctx.beginPath();
        ctx.moveTo(chartX, chartY + EXPORT_HEADER_HEIGHT);
        ctx.lineTo(chartX + chartContentWidth, chartY + EXPORT_HEADER_HEIGHT);
        ctx.stroke();

        // 7. Draw Task Rows, Task Names, and Blue Timeline Bars
        state.tasks.forEach((task, index) => {
          const rowY = chartY + EXPORT_HEADER_HEIGHT + (index * EXPORT_ROW_HEIGHT);

          // Horizontal row separator
          ctx.strokeStyle = '#E2E8F0';
          ctx.beginPath();
          ctx.moveTo(chartX, rowY + EXPORT_ROW_HEIGHT);
          ctx.lineTo(chartX + chartContentWidth, rowY + EXPORT_ROW_HEIGHT);
          ctx.stroke();

          // Task ID
          ctx.fillStyle = '#64748B';
          ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(index + 1), chartX + (ID_COL_WIDTH / 2), rowY + (EXPORT_ROW_HEIGHT / 2));

          // Task Name (clipped if excessively long)
          ctx.fillStyle = '#1E293B';
          ctx.font = "600 12.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';

          // Truncate task name with ellipsis if needed
          const maxNameWidth = TASK_NAME_COL_WIDTH - 24;
          let displayName = task.name;
          if (ctx.measureText(displayName).width > maxNameWidth) {
            while (displayName.length > 3 && ctx.measureText(displayName + '...').width > maxNameWidth) {
              displayName = displayName.slice(0, -1);
            }
            displayName += '...';
          }
          ctx.fillText(displayName, chartX + ID_COL_WIDTH + 12, rowY + (EXPORT_ROW_HEIGHT / 2));

          // Calculate Bar Coordinates
          const offsetDays = daysBetween(state.timelineStart, task.startDate) - 1;
          const durationDays = daysBetween(task.startDate, task.endDate);

          const barX = timelineStartX + (offsetDays * exportPixelsPerDay);
          const barWidth = Math.max(durationDays * exportPixelsPerDay, 6);
          const barY = rowY + EXPORT_BAR_TOP;
          const barRadius = 4;

          // Draw Blue Task Bar (#087CF0)
          ctx.fillStyle = '#087CF0';
          ctx.strokeStyle = '#0069D9';
          ctx.lineWidth = 1;

          drawRoundedRect(ctx, barX, barY, barWidth, EXPORT_BAR_HEIGHT, barRadius);
          ctx.fill();
          ctx.stroke();
        });

        // 8. Footer Notice / Branding in export image (Academic citation style)
        ctx.fillStyle = '#94A3B8';
        ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Generated with PinnacleMindz Free Gantt Chart Maker • pinnaclemindz.tech', totalChartWidth - PADDING, totalChartHeight - 8);

        // Convert Canvas to PNG Blob and Trigger Download
        canvas.toBlob((blob) => {
          if (!blob) {
            showToast('Failed to create PNG blob. Please try Standard Resolution.', 'error');
            return;
          }

          const sanitizedTitle = (projectTitle || 'Gantt_Chart')
            .replace(/[^a-zA-Z0-9_\-]/g, '_')
            .replace(/_+/g, '_');
          const fileName = `${sanitizedTitle}_Gantt_Chart.png`;

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 2000);

          showToast('PNG Downloaded Successfully! 🎓', 'success');
        }, 'image/png');
      } catch (err) {
        console.error('PNG Export failed:', err);
        showToast('Export failed. Please try Standard Resolution.', 'error');
      }
    });
  }

  /**
   * Helper to draw a rounded rectangle on Canvas 2D
   */
  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // ==========================================================
  // 14. Toast & UI Utilities
  // ==========================================================

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${escapeHtml(message)}</span>
    `;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ==========================================================
  // 15. Initial Event Listeners
  // ==========================================================

  function initEventListeners() {
    // Top Bar Action Buttons
    dom.btnAddTask.addEventListener('click', openAddTaskModal);
    dom.btnEmptyAddTask.addEventListener('click', openAddTaskModal);

    dom.btnLoadExample.addEventListener('click', () => {
      state.tasks = generateExampleSchedule();
      renderChart();
      zoomToFit();
      showToast('Loaded undergraduate software engineering schedule (10 tasks)', 'success');
    });

    dom.btnEmptyLoadExample.addEventListener('click', () => {
      state.tasks = generateExampleSchedule();
      renderChart();
      zoomToFit();
      showToast('Loaded undergraduate software engineering schedule (10 tasks)', 'success');
    });

    dom.btnNewChart.addEventListener('click', () => {
      if (state.tasks.length === 0) return;
      if (confirm('Clear all tasks from the Gantt chart and start fresh? This cannot be undone.')) {
        state.tasks = [];
        renderChart();
        showToast('Chart cleared. Ready for new tasks.', 'success');
      }
    });

    dom.btnExportPNG.addEventListener('click', exportGanttChartAsPNG);

    // Modal Events
    dom.btnModalClose.addEventListener('click', closeTaskModal);
    dom.btnModalCancel.addEventListener('click', closeTaskModal);
    dom.taskForm.addEventListener('submit', saveTask);

    dom.inputStartDate.addEventListener('input', updateModalDuration);
    dom.inputEndDate.addEventListener('input', updateModalDuration);

    // Close modal on click outside
    dom.taskModalOverlay.addEventListener('click', (e) => {
      if (e.target === dom.taskModalOverlay) {
        closeTaskModal();
      }
    });

    // Keyboard Escape to close modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dom.taskModalOverlay.classList.contains('open')) {
        closeTaskModal();
      }
    });

    // Mobile nav toggle
    if (dom.menuBtn && dom.nav) {
      dom.menuBtn.addEventListener('click', () => dom.nav.classList.toggle('open'));
    }

    // Window resize handler
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderChart();
      }, 150);
    });
  }

  // ==========================================================
  // 16. Bootstrap
  // ==========================================================

  function init() {
    initEventListeners();
    setupSplitter();
    setupSynchronizedScrolling();
    setupZoomControls();

    // Start with empty chart so student can enter their own tasks immediately,
    // as per project objective: "Start with an empty chart so students can enter their own project information."
    renderChart();
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
