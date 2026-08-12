// MedTrack Application Logic (Frontend)

const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : '';

document.addEventListener('DOMContentLoaded', () => {
    setDynamicGreeting();
    checkAuthStatus();
    loadDoseState();
    setupNavigation();
    setupDateSelector();
    requestNotificationPermission().then(() => {
        checkNotifications(true);
        setInterval(() => checkNotifications(false), 60000);
    });
});

// --- AUTH CHECK ---
async function checkAuthStatus() {
    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
        const data = await res.json();
        const navBtns = document.getElementById('authNavBtns');
        if (data.authenticated && data.user) {
            if (navBtns) {
                navBtns.innerHTML = `
                    <span style="font-weight:600;color:var(--text-dark);margin-right:10px;">👋 ${data.user.username}</span>
                    <button onclick="handleLogout()" class="btn btn-login" style="cursor:pointer;">Logout</button>
                `;
            }
            const greetEl = document.getElementById('dashGreeting');
            if (greetEl) {
                greetEl.innerHTML = greetEl.innerHTML.replace('John Doe', data.user.username);
            }
        } else {
            if (navBtns) {
                navBtns.innerHTML = `
                    <a href="login.html" class="btn btn-login" style="text-decoration: none;">Log In</a>
                    <a href="signup.html" class="btn btn-primary" style="text-decoration: none;">Get Started</a>
                `;
            }
        }
    } catch (e) {
        console.log('[AUTH NOTICE] Running in standalone or guest mode');
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {}
    window.location.href = 'login.html';
}

// --- GREETING ---
function setDynamicGreeting() {
    const greetEl = document.getElementById('dashGreeting');
    if (!greetEl) return;
    const hour = new Date().getHours();
    let greeting = 'Good Evening';
    if (hour < 12) greeting = 'Good Morning';
    else if (hour < 17) greeting = 'Good Afternoon';
    greetEl.innerHTML = greetEl.innerHTML.replace('Good Day', greeting);
}

// --- NOTIFICATIONS ---
async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("Desktop notifications not supported");
    } else if (Notification.permission !== "denied" && Notification.permission !== "granted") {
        try { await Notification.requestPermission(); } catch(e) {}
    }
}

async function checkNotifications(isLogin = false) {
    try {
        if (isLogin) {
            const schedResp = await fetch(`${API_BASE}/api/schedule`, { credentials: 'include' });
            if (schedResp.ok) {
                const schedData = await schedResp.json();
                const total = schedData.length;
                const taken = schedData.filter(d => d.completed).length;
                const remaining = total - taken;
                if (total > 0) {
                    const msg = `You have ${remaining} medication${remaining !== 1 ? 's' : ''} left today (${taken}/${total} taken).`;
                    showNotificationBanner('💊 MedTrack — Today\'s Schedule', msg, 8000);
                    if (Notification.permission === 'granted') {
                        new Notification('MedTrack: Today\'s Schedule', { body: msg });
                    }
                }
            }
        }

        const response = await fetch(`${API_BASE}/api/notifications`, { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            if (data.notifications && data.notifications.length > 0) {
                data.notifications.forEach(notif => {
                    const msg = `${notif.desc} — Scheduled at ${notif.time}`;
                    showNotificationBanner(`⏰ Time for ${notif.title}!`, msg, 8000);
                    if (Notification.permission === 'granted') {
                        new Notification(`⏰ Time for ${notif.title}!`, { body: msg });
                    }
                });
                loadDoseState();
            }
        }
    } catch (error) {
        console.log('Notification check skipped:', error);
    }
}

function showNotificationBanner(title, body, duration = 6000) {
    const existing = document.querySelectorAll('.notif-banner').length;
    const banner = document.createElement('div');
    banner.className = 'notif-banner';
    banner.style.cssText = `position:fixed;top:${90 + existing * 90}px;right:20px;background:linear-gradient(135deg,#10b981,#059669);color:white;padding:16px 20px;border-radius:12px;z-index:9999;box-shadow:0 8px 30px rgba(16,185,129,0.4);max-width:320px;animation:slideIn 0.3s ease;cursor:pointer;`;
    banner.innerHTML = `<strong>${title}</strong><br><small style="opacity:0.9">${body}</small>`;
    banner.onclick = () => banner.remove();
    document.body.appendChild(banner);
    setTimeout(() => { if (banner.parentNode) banner.remove(); }, duration);
}

// --- NAVIGATION ---
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const selectedPage = document.getElementById(pageName);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick')?.includes(pageName)) {
            link.classList.add('active');
        }
    });

    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(pageName)) {
            item.classList.add('active');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupNavigation() {
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });
}

// --- DATE SELECTOR ---
function setupDateSelector() {
    const container = document.getElementById('dateSelector');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let offset = -2; offset <= 4; offset++) {
        const d = new Date(today);
        d.setDate(today.getDate() + offset);

        let label;
        if (offset === 0) label = 'Today';
        else if (offset === -1) label = 'Yesterday';
        else if (offset === 1) label = 'Tomorrow';
        else label = `${dayNames[d.getDay()]} ${d.getDate()}`;

        const btn = document.createElement('button');
        btn.className = 'date-pill' + (offset === 0 ? ' active' : '');
        btn.title = d.toLocaleDateString();
        btn.textContent = label;
        btn.addEventListener('click', function () {
            document.querySelectorAll('.date-pill').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
        });
        container.appendChild(btn);
    }
}

// --- DOSE MANAGEMENT ---
async function takeDose(dbId, elementId, btn) {
    try {
        const response = await fetch(`${API_BASE}/api/take/${dbId}`, {
            method: 'POST',
            credentials: 'include'
        });
        const result = await response.json();

        if (result.success) {
            const doseItem = document.getElementById(elementId);
            btn.innerHTML = '<i class="fas fa-check"></i> Taken';
            btn.classList.add('taken');

            setTimeout(() => {
                if (doseItem) {
                    doseItem.classList.add('completed');
                    doseItem.style.transform = 'scale(0.98)';
                    setTimeout(() => {
                        doseItem.style.transform = 'scale(1)';
                    }, 200);
                }
            }, 300);

            updateProgress();
        }
    } catch (error) {
        console.error('Error taking dose:', error);
        alert('Failed to update dose status. Please try again.');
    }
}

async function loadDoseState() {
    const timeline = document.querySelector('.timeline');
    try {
        const response = await fetch(`${API_BASE}/api/schedule`, { credentials: 'include' });
        
        if (response.status === 401 || !response.ok) {
            if (timeline) {
                timeline.innerHTML = `
                    <div style="text-align:center;padding:40px;color:var(--text-gray)">
                        <i class="fas fa-pills" style="font-size:2.5rem;margin-bottom:12px;display:block;color:var(--primary-mint)"></i>
                        <p style="font-size:1.1rem;font-weight:600;margin-bottom:8px;color:var(--text-dark)">Sign in to view your schedule</p>
                        <p style="font-size:0.9rem;margin-bottom:16px;">Log in or create an account to start tracking prescriptions.</p>
                        <a href="login.html" class="btn btn-mint" style="display:inline-block;text-decoration:none;padding:8px 22px;">Log In</a>
                    </div>
                `;
            }
            updateStats(0, 0);
            return;
        }

        const scheduleData = await response.json();
        if (!timeline) return;
        timeline.innerHTML = '';

        let takenCount = 0;
        let totalCount = scheduleData.length;

        if (totalCount === 0) {
            timeline.innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--text-gray)">
                    <i class="fas fa-pills" style="font-size:2rem;margin-bottom:12px;display:block;"></i>
                    No medications scheduled for today. Scan a prescription to get started!
                </div>
            `;
            updateStats(0, 0);
            return;
        }

        scheduleData.forEach(item => {
            if (item.completed) takenCount++;

            const [hh, mm] = (item.time || '08:00').split(':').map(Number);
            const ampm = hh >= 12 ? 'PM' : 'AM';
            const displayHour = hh % 12 || 12;
            const displayTime = `${displayHour}:${(mm || 0).toString().padStart(2, '0')} ${ampm}`;

            let timeIcon = 'fa-sun';
            if (hh >= 12 && hh < 17) timeIcon = 'fa-cloud-sun';
            else if (hh >= 17 && hh < 21) timeIcon = 'fa-moon';
            else if (hh >= 21 || hh < 6) timeIcon = 'fa-star';

            const doseHtml = `
                <div class="dose-item ${item.completed ? 'completed' : ''}" id="${item.id}">
                    <div class="dose-dot"></div>
                    <div class="dose-time" style="display:flex; justify-content:space-between; align-items:center;">
                        <span><i class="fas ${timeIcon}"></i> ${displayTime}</span>
                        ${!item.completed ? `<button onclick="editDoseTime('${item.db_id}', '${item.time}')" style="background:none;border:none;color:var(--primary-mint);cursor:pointer;opacity:0.6;transition:0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6" title="Customize Time">
                            <i class="fas fa-pencil-alt"></i>
                        </button>` : ''}
                    </div>
                    <div class="dose-title">${item.title}</div>
                    <div class="dose-desc">${item.desc}</div>
                    <div class="dose-actions">
                        <button class="btn-take ${item.completed ? 'taken' : ''}" 
                                onclick="takeDose(${item.db_id}, '${item.id}', this)">
                            ${item.completed ? '<i class="fas fa-check"></i> Taken' : '<i class="fas fa-check"></i> Take Dose'}
                        </button>
                    </div>
                </div>
            `;
            timeline.insertAdjacentHTML('beforeend', doseHtml);
        });

        updateStats(takenCount, totalCount);

    } catch (error) {
        console.log('Error loading schedule:', error);
        if (timeline) {
            timeline.innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--text-gray)">
                    <i class="fas fa-heartbeat" style="font-size:2.5rem;margin-bottom:12px;display:block;color:var(--primary-mint)"></i>
                    <p style="font-size:1rem;font-weight:600;margin-bottom:8px;">Ready to organize your medications</p>
                    <a href="login.html" class="btn btn-mint" style="display:inline-block;text-decoration:none;padding:8px 20px;">Sign In</a>
                </div>
            `;
        }
    }
}

function updateStats(taken, total) {
    const percent = total > 0 ? Math.round((taken / total) * 100) : 0;
    const percentEl = document.querySelector('.progress-percent');
    if (percentEl) percentEl.textContent = `${percent}%`;

    const circle = document.querySelector('.progress-ring-fill');
    if (circle) {
        const circumference = 2 * Math.PI * 88; // 552.92
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }

    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 3) {
        statValues[0].textContent = taken;
        statValues[1].textContent = total - taken;
        statValues[2].textContent = `${percent}%`;
    }
}

function updateProgress() {
    const total = document.querySelectorAll('.dose-item').length;
    const taken = document.querySelectorAll('.dose-item.completed').length;
    updateStats(taken, total);
}

// --- CUSTOMIZE DOSE TIME MODAL ---
function editDoseTime(dbId, currentTime) {
    const existing = document.getElementById('editTimeModal');
    if (existing) existing.remove();

    const modalHtml = `
        <div id="editTimeModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(4px);">
            <div style="background:white;padding:24px;border-radius:16px;width:90%;max-width:320px;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.1);">
                <h3 style="margin-top:0;margin-bottom:12px;color:var(--text-dark);">Change Dose Time</h3>
                <p style="font-size:0.85rem;color:var(--text-gray);margin-bottom:16px;">Set the time you take this medication:</p>
                <input type="time" id="newDoseTimeInput" value="${currentTime}" style="font-size:1.2rem;padding:8px;border:2px solid var(--primary-mint);border-radius:8px;outline:none;margin-bottom:20px;width:80%;">
                <div style="display:flex;gap:10px;justify-content:center;">
                    <button onclick="document.getElementById('editTimeModal').remove()" class="btn" style="background:#e2e8f0;color:#475569;padding:8px 16px;border-radius:8px;cursor:pointer;">Cancel</button>
                    <button onclick="saveDoseTime(${dbId})" class="btn btn-mint" style="padding:8px 16px;border-radius:8px;cursor:pointer;">Save</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function saveDoseTime(dbId) {
    const input = document.getElementById('newDoseTimeInput');
    if (!input || !input.value) return;

    try {
        const response = await fetch(`${API_BASE}/api/schedule/${dbId}/time`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ time: input.value })
        });
        const result = await response.json();
        if (result.success) {
            document.getElementById('editTimeModal').remove();
            showNotificationBanner('⏰ Time Updated', `Dose time changed to ${input.value}`, 4000);
            loadDoseState();
        } else {
            alert(result.error || 'Failed to update time');
        }
    } catch (e) {
        console.error('Error updating dose time:', e);
        alert('Server communication error.');
    }
}

// --- SCANNER LOGIC ---
function handleFileSelect(input) {
    const file = input.files[0];
    if (file) {
        uploadFile(file);
    }
}

async function uploadFile(file) {
    const scannerBox = document.getElementById('scannerBox');
    const uploadArea = document.getElementById('uploadArea');
    const uploadTitle = document.getElementById('uploadTitle');
    const uploadDesc = document.getElementById('uploadDesc');

    if (uploadTitle) uploadTitle.textContent = 'Analyzing Prescription...';
    if (uploadDesc) uploadDesc.textContent = 'AI is reading medication details...';
    if (scannerBox) scannerBox.classList.add('scanning');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE}/api/scan`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        if (scannerBox) scannerBox.classList.remove('scanning');

        if (response.status === 401) {
            alert('Please sign in to scan and save prescriptions to your schedule.');
            window.location.href = 'login.html';
            return;
        }

        const data = await response.json();

        if (response.ok && data.success) {
            showDetectedItems(data.detected);
            loadDoseState();
        } else {
            alert(data.error || 'Failed to process prescription.');
            if (uploadTitle) uploadTitle.textContent = 'Tap to Scan Prescription';
            if (uploadDesc) uploadDesc.textContent = 'Supports JPG, PNG up to 10MB';
        }
    } catch (error) {
        console.error('Error scanning file:', error);
        if (scannerBox) scannerBox.classList.remove('scanning');
        alert('Upload failed. Please check your connection.');
        if (uploadTitle) uploadTitle.textContent = 'Tap to Scan Prescription';
        if (uploadDesc) uploadDesc.textContent = 'Supports JPG, PNG up to 10MB';
    }
}

function showDetectedItems(items) {
    const resultsArea = document.getElementById('detectedResults');
    const itemsList = document.getElementById('detectedList');
    if (!resultsArea || !itemsList) return;

    itemsList.innerHTML = '';
    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'detected-item animate-slide-in';
        el.innerHTML = `
            <div style="font-weight:700;font-size:1.05rem;color:var(--text-dark);">${item.name}</div>
            <div style="font-size:0.9rem;color:var(--text-gray);margin-top:2px;">📋 ${item.dosage} &bull; 🕐 ${item.time || '08:00'}</div>
        `;
        itemsList.appendChild(el);
    });

    resultsArea.style.display = 'block';
}

function addToSchedule(event) {
    const btn = event.currentTarget || event.target;
    btn.innerHTML = '<i class="fas fa-check"></i> Added Successfully!';
    btn.style.background = 'var(--primary-mint)';

    setTimeout(() => {
        showPage('dashboard');
        loadDoseState();
    }, 800);
}

// --- REPORTS ---
async function loadReports() {
    const container = document.getElementById('reportsList');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-gray)"><i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:12px;display:block;"></i>Loading reports...</div>';

    try {
        const response = await fetch(`${API_BASE}/api/reports`, { credentials: 'include' });
        if (response.status === 401 || !response.ok) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--text-gray)">
                    <p style="font-size:1rem;font-weight:600;margin-bottom:8px;">Sign in to view prescription history</p>
                    <a href="login.html" class="btn btn-mint" style="display:inline-block;text-decoration:none;padding:8px 20px;">Log In</a>
                </div>
            `;
            return;
        }

        const reports = await response.json();
        if (reports.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--text-gray)">
                    <i class="fas fa-file-medical" style="font-size:2rem;margin-bottom:12px;display:block;"></i>
                    No scanned prescriptions yet.
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        reports.forEach(r => {
            const el = document.createElement('div');
            el.className = 'report-card animate-slide-in';
            el.style.cssText = 'background:white;border-radius:16px;padding:20px;margin-bottom:16px;box-shadow:var(--shadow-soft);border:1px solid var(--border-light);';
            el.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <span style="font-weight:700;color:var(--primary-mint);">Scanned on ${r.scanned_at}</span>
                    ${r.image_url ? `<a href="${r.image_url}" target="_blank" style="color:#0ea5e9;text-decoration:none;font-weight:600;font-size:0.85rem;"><i class="fas fa-image"></i> View Image</a>` : ''}
                </div>
                <p style="color:var(--text-dark);font-weight:600;margin-bottom:6px;">${r.summary || 'Prescription'}</p>
            `;
            container.appendChild(el);
        });
    } catch (e) {
        console.error('Error loading reports:', e);
        container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-gray)">Failed to load reports.</div>';
    }
}
