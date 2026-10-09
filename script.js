// --- 1. USER AUTHENTICATION & PAGE NAVIGATION ---

function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

function showPage(pageId) {
    const pages = document.querySelectorAll('.page-section');
    pages.forEach(p => p.classList.remove('active-page'));

    const links = document.querySelectorAll('.nav-link');
    links.forEach(l => l.classList.remove('active'));

    const target = document.getElementById(pageId);
    if (target) target.classList.add('active-page');

    const activeLink = document.getElementById('nav-' + pageId);
    if (activeLink) activeLink.classList.add('active');

    // Page Specific Refresh
    if (pageId === 'planner') renderPlanner();
    if (pageId === 'dashboard') renderDashboard();
}

function updateNavbar() {
    const user = getCurrentUser();
    const navLinks = document.getElementById('nav-links');

    if (user) {
        navLinks.innerHTML = `
            <li><a id="nav-home" class="nav-link active" onclick="showPage('home')">Home</a></li>
            <li><a id="nav-planner" class="nav-link" onclick="showPage('planner')">Planner</a></li>
            <li><a id="nav-dashboard" class="nav-link" onclick="showPage('dashboard')">Dashboard</a></li>
            <li><a id="nav-about" class="nav-link" onclick="showPage('about')">About</a></li>
            <li><span style="color:#00d2d3; font-weight:bold;">Hi, ${user}</span></li>
            <li><button onclick="logout()" class="btn btn-danger" style="padding: 5px 10px; margin: 0;">Logout</button></li>
        `;
    } else {
        navLinks.innerHTML = `
            <li><a id="nav-home" class="nav-link active" onclick="showPage('home')">Home</a></li>
            <li><a id="nav-about" class="nav-link" onclick="showPage('about')">About</a></li>
            <li><a id="nav-auth" class="nav-link" onclick="showPage('auth')">Login / Register</a></li>
        `;
    }
}

function registerUser() {
    const user = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value;

    if (!user || !pass) {
        alert("Please enter username and password!");
        return;
    }

    let users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[user]) {
        alert("User already exists!");
        return;
    }

    users[user] = pass;
    localStorage.setItem('users', JSON.stringify(users));
    alert("Registration successful! Please login.");
    toggleAuthForm();
}

function loginUser() {
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value;
    let users = JSON.parse(localStorage.getItem('users')) || {};

    if (users[user] && users[user] === pass) {
        localStorage.setItem('currentUser', user);
        alert(`Welcome, ${user}!`);
        updateNavbar();
        showPage('planner');
    } else {
        alert("Invalid Username or Password!");
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    alert("Logged out successfully!");
    updateNavbar();
    showPage('auth');
}

function toggleAuthForm() {
    const loginBox = document.getElementById('login-box');
    const regBox = document.getElementById('register-box');
    if (loginBox.style.display === 'none') {
        loginBox.style.display = 'block';
        regBox.style.display = 'none';
    } else {
        loginBox.style.display = 'none';
        regBox.style.display = 'block';
    }
}

// --- 2. STORAGE KEYS FOR USER ISOLATION ---
function getUserKeys() {
    const user = getCurrentUser() || 'guest';
    return {
        planned: `planned_sessions_${user}`,
        active: `active_session_${user}`,
        archive: `archived_sessions_${user}`
    };
}

// --- 3. PLANNER PAGE LOGIC ---
function addPlannedSession() {
    const user = getCurrentUser();
    if (!user) {
        alert("Please login first!");
        showPage('auth');
        return;
    }

    const subject = document.getElementById('subject').value.trim();
    const topic = document.getElementById('topic').value.trim();
    const date = document.getElementById('sessionDate').value;

    if (!subject || !topic || !date) {
        alert("Please fill in Subject, Topic, and Scheduled Date!");
        return;
    }

    const newSession = {
        id: Date.now(),
        subject: subject,
        topic: topic,
        date: date
    };

    const keys = getUserKeys();
    let plannedList = JSON.parse(localStorage.getItem(keys.planned)) || [];
    plannedList.push(newSession);
    localStorage.setItem(keys.planned, JSON.stringify(plannedList));

    // Reset inputs
    document.getElementById('subject').value = '';
    document.getElementById('topic').value = '';
    document.getElementById('sessionDate').value = '';

    renderPlanner();
}

function renderPlanner() {
    const keys = getUserKeys();
    const plannedList = JSON.parse(localStorage.getItem(keys.planned)) || [];
    const archiveList = JSON.parse(localStorage.getItem(keys.archive)) || [];

    // Render Active Planned Sessions
    const container = document.getElementById('plannedSessionsList');
    if (container) {
        container.innerHTML = '';
        if (plannedList.length === 0) {
            container.innerHTML = '<p>No sessions planned yet.</p>';
        } else {
            plannedList.forEach(session => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>${session.subject}</h3>
                    <p><strong>Topic:</strong> ${session.topic}</p>
                    <p><strong>Scheduled Date:</strong> ${session.date}</p>
                    <button class="btn btn-success" onclick="startSessionFromPlanner(${session.id})">Start Session</button>
                    <button class="btn btn-danger" onclick="deletePlannedSession(${session.id})">Delete</button>
                `;
                container.appendChild(card);
            });
        }
    }

    // Render Archive Table
    const archiveContainer = document.getElementById('archiveList');
    if (archiveContainer) {
        archiveContainer.innerHTML = '';
        if (archiveList.length === 0) {
            archiveContainer.innerHTML = '<p>No completed sessions in archive yet.</p>';
        } else {
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Topic</th>
                            <th>Date</th>
                            <th>Total Duration Spent</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            archiveList.forEach(item => {
                html += `
                    <tr>
                        <td>${item.subject}</td>
                        <td>${item.topic}</td>
                        <td>${item.date}</td>
                        <td><strong style="color:#1dd1a1;">${item.duration}</strong></td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            archiveContainer.innerHTML = html;
        }
    }
}

function deletePlannedSession(id) {
    const keys = getUserKeys();
    let plannedList = JSON.parse(localStorage.getItem(keys.planned)) || [];
    plannedList = plannedList.filter(s => s.id !== id);
    localStorage.setItem(keys.planned, JSON.stringify(plannedList));
    renderPlanner();
}

function startSessionFromPlanner(id) {
    const keys = getUserKeys();
    let plannedList = JSON.parse(localStorage.getItem(keys.planned)) || [];
    const sessionToStart = plannedList.find(s => s.id === id);

    if (!sessionToStart) return;

    // Check if a session is already running
    const active = JSON.parse(localStorage.getItem(keys.active));
    if (active) {
        alert("You already have a running session on the Dashboard! Finish or stop it first.");
        showPage('dashboard');
        return;
    }

    // Move to Active Session
    const activeSession = {
        ...sessionToStart,
        elapsedSeconds: 0,
        isRunning: true,
        startTime: Date.now()
    };

    localStorage.setItem(keys.active, JSON.stringify(activeSession));

    // Remove from planned list
    plannedList = plannedList.filter(s => s.id !== id);
    localStorage.setItem(keys.planned, JSON.stringify(plannedList));

    // Redirect to Dashboard
    showPage('dashboard');
}

// --- 4. DASHBOARD & STOPWATCH TIMER LOGIC ---
let timerInterval = null;

function renderDashboard() {
    const keys = getUserKeys();
    const active = JSON.parse(localStorage.getItem(keys.active));
    const activeInfo = document.getElementById('activeSessionInfo');
    const timerControls = document.getElementById('timerControls');

    if (active) {
        activeInfo.innerHTML = `
            <div class="card active-session-banner">
                <h3>Currently Studying: ${active.subject}</h3>
                <p><strong>Topic:</strong> ${active.topic}</p>
                <p><strong>Created Date:</strong> ${active.date}</p>
            </div>
        `;
        timerControls.style.display = 'block';

        if (active.isRunning) {
            startStopwatchInterval();
        } else {
            stopStopwatchInterval();
        }
        updateTimerDisplay(active.elapsedSeconds);
    } else {
        activeInfo.innerHTML = `
            <div class="card">
                <p>No active study session running. Go to <strong>Planner</strong> and click "Start Session".</p>
            </div>
        `;
        timerControls.style.display = 'none';
        updateTimerDisplay(0);
        stopStopwatchInterval();
    }

    updateDashboardStats();
}

function startStopwatchInterval() {
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const keys = getUserKeys();
        let active = JSON.parse(localStorage.getItem(keys.active));

        if (active && active.isRunning) {
            active.elapsedSeconds += 1;
            localStorage.setItem(keys.active, JSON.stringify(active));
            updateTimerDisplay(active.elapsedSeconds);
        }
    }, 1000);
}

function stopStopwatchInterval() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function togglePauseResume() {
    const keys = getUserKeys();
    let active = JSON.parse(localStorage.getItem(keys.active));
    if (!active) return;

    const btn = document.getElementById('pauseBtn');

    if (active.isRunning) {
        // Pause break
        active.isRunning = false;
        stopStopwatchInterval();
        btn.innerText = 'Resume';
        btn.className = 'btn btn-success';
    } else {
        // Resume session
        active.isRunning = true;
        startStopwatchInterval();
        btn.innerText = 'Pause (Take Break)';
        btn.className = 'btn btn-warning';
    }

    localStorage.setItem(keys.active, JSON.stringify(active));
}

function completeSession() {
    const keys = getUserKeys();
    let active = JSON.parse(localStorage.getItem(keys.active));

    if (!active) return;

    stopStopwatchInterval();

    const totalSpentText = formatTime(active.elapsedSeconds);

    // Save to Archive
    let archiveList = JSON.parse(localStorage.getItem(keys.archive)) || [];
    archiveList.push({
        id: Date.now(),
        subject: active.subject,
        topic: active.topic,
        date: active.date,
        duration: totalSpentText
    });
    localStorage.setItem(keys.archive, JSON.stringify(archiveList));

    // Clear Active Session
    localStorage.removeItem(keys.active);

    alert(`Great job! Session completed in ${totalSpentText}. It is now saved in your Archive.`);
    renderDashboard();
}

function updateTimerDisplay(seconds) {
    const display = document.getElementById('timer');
    if (display) {
        display.innerText = formatTime(seconds);
    }
}

function formatTime(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (n) => n < 10 ? '0' + n : n;

    if (hrs > 0) {
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
}

function updateDashboardStats() {
    const keys = getUserKeys();
    const planned = JSON.parse(localStorage.getItem(keys.planned)) || [];
    const archive = JSON.parse(localStorage.getItem(keys.archive)) || [];
    const active = JSON.parse(localStorage.getItem(keys.active));

    const pendingCount = planned.length + (active ? 1 : 0);

    document.getElementById('statTotal').innerText = pendingCount + archive.length;
    document.getElementById('statCompleted').innerText = archive.length;
    document.getElementById('statPending').innerText = pendingCount;
}

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    showPage('home');
});