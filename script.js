// ============================================
// AI TOOLS HUB - FIREBASE + SECURE SYSTEM
// ============================================

// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyDAVY2FKh9YKqviuQz34VNAToxo0SfCJTQ",
  authDomain: "smart-52618.firebaseapp.com",
  projectId: "smart-52618",
  storageBucket: "smart-52618.firebasestorage.app",
  messagingSenderId: "931868149631",
  appId: "1:931868149631:web:48c37395b0df7e55427c4a",
  databaseURL: "https://smart-52618-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// 🗂️ STATE
let tools = []; 
let isAdmin = false;
let deleteTargetId = null;
let loginAttempts = 0;
const MAX_ATTEMPTS = 5;

// Check if admin page (Aapka original logic)
const IS_ADMIN = typeof _ia !== 'undefined' && _ia === true;
const DEFAULT_ICON = 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png';

// ============================================
// 🚀 INITIALIZATION (Firebase Sync)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Firebase se tools khichna aur live update rakhna
    db.ref('tools').on('value', (snapshot) => {
        const data = snapshot.val();
        tools = [];
        if (data) {
            Object.keys(data).forEach(key => {
                tools.push({ firebaseId: key, ...data[key] });
            });
            tools.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
        }

        if (IS_ADMIN) {
            initAdminPage();
        } else {
            initPublicPage();
        }
    });
});

// ============================================
// 📱 PUBLIC PAGE FUNCTIONS (No changes to your design)
// ============================================

function initPublicPage() {
    renderPublicTools();
    updatePublicStats();
    setupPublicEvents();
    setupChatbot();
}

function setupPublicEvents() {
    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    
    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            renderPublicTools(e.target.value.toLowerCase());
        });
    }
    
    var pills = document.querySelectorAll('.pill');
    pills.forEach(function(pill) {
        pill.addEventListener('click', function(e) {
            pills.forEach(function(p) { p.classList.remove('active'); });
            e.target.classList.add('active');
            var search = document.getElementById('searchInput');
            renderPublicTools(search ? search.value.toLowerCase() : '');
        });
    });
}

function renderPublicTools(search) {
    search = search || '';
    var grid = document.getElementById('toolsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    var activeFilter = document.querySelector('.pill.active')?.dataset.filter || 'all';
    
    var filtered = tools.filter(function(tool) {
        var matchSearch = !search || 
            tool.name.toLowerCase().indexOf(search) !== -1 ||
            tool.desc.toLowerCase().indexOf(search) !== -1;
        var matchFilter = activeFilter === 'all' || tool.category === activeFilter;
        return matchSearch && matchFilter;
    });
    
    var emptyState = document.getElementById('emptyState');
    if (filtered.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    if (emptyState) emptyState.classList.add('hidden');
    
    filtered.forEach(function(tool) {
        var card = document.createElement('div');
        card.className = 'tool-card';
        var logoUrl = tool.image && tool.image.trim() !== '' ? tool.image : DEFAULT_ICON;
        
        card.innerHTML = 
            '<div class="tool-header">' +
                '<div class="tool-icon-container">' +
                    '<img src="' + logoUrl + '" class="tool-card-img" onerror="this.src=\'' + DEFAULT_ICON + '\'">' +
                '</div>' +
                '<div class="tool-info">' +
                    '<h3>' + escapeHtml(tool.name) + '</h3>' +
                    '<span class="tool-category ' + tool.category + '">' + tool.category + '</span>' +
                '</div>' +
            '</div>' +
            '<p class="tool-desc">' + escapeHtml(tool.desc) + '</p>' +
            '<div class="tool-footer">' +
                '<span class="tool-stats">' +
                    '<i class="fa-solid fa-chart-simple"></i> ' + (tool.clicks || 0) + ' uses' +
                '</span>' +
                '<a href="' + escapeHtml(tool.link) + '" target="_blank" rel="noopener" class="btn-visit" onclick="trackClick(\'' + tool.firebaseId + '\')">' +
                    'Visit <i class="fa-solid fa-arrow-up-right-from-square"></i>' +
                '</a>' +
            '</div>';
        grid.appendChild(card);
    });
}

// ============================================
// 🔐 ADMIN PAGE FUNCTIONS (Your Original Security)
// ============================================

function initAdminPage() {
    checkLockout();
    setupAdminEvents();
    checkAdminSession();
}

function handleLogin() {
    var passwordInput = document.getElementById('adminPassword');
    var password = passwordInput ? passwordInput.value : '';
    
    // Yahan aapka wahi purana validation logic hai (_vp function)
    var isValid = (typeof _vp === 'function') ? _vp(password) : false;

    if (isValid) {
        sessionStorage.setItem('aihub_admin_session', 'active');
        sessionStorage.setItem('aihub_session_time', Date.now().toString());
        showAdminDashboard();
        showToast('Login Success', 'success');
    } else {
        loginAttempts++;
        if (loginAttempts >= MAX_ATTEMPTS) {
            localStorage.setItem('aihub_lockout', (Date.now() + 900000).toString());
        }
        showToast('Invalid Password', 'error');
    }
}

function handleAddTool(e) {
    e.preventDefault();
    
    var newTool = {
        name: document.getElementById('addName').value.trim(),
        category: document.getElementById('addCategory').value,
        link: document.getElementById('addLink').value.trim(),
        desc: document.getElementById('addDesc').value.trim(),
        image: document.getElementById('toolImage').value.trim(),
        clicks: 0,
        addedAt: Date.now()
    };
    
    // LocalStorage ki jagah Firebase mein push
    db.ref('tools').push(newTool).then(() => {
        showToast('Tool added to Cloud!', 'success');
        e.target.reset();
    });
}

function executeDelete() {
    if (deleteTargetId) {
        db.ref('tools/' + deleteTargetId).remove().then(() => {
            document.getElementById('deleteModal').classList.remove('show');
            showToast('Tool Deleted Forever', 'info');
        });
    }
}

function trackClick(firebaseId) {
    const tool = tools.find(t => t.firebaseId === firebaseId);
    if (tool) {
        db.ref('tools/' + firebaseId).update({
            clicks: (tool.clicks || 0) + 1
        });
    }
}

// ============================================
// 🔧 HELPERS (Keeping everything else same)
// ============================================

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAdminDashboard() {
    var loginScreen = document.getElementById('loginScreen');
    var dashboard = document.getElementById('adminDashboard');
    if (loginScreen) loginScreen.classList.add('hidden');
    if (dashboard) dashboard.classList.remove('hidden');
    updateAdminStats();
    renderAdminToolsList();
}

function renderAdminToolsList() {
    var container = document.getElementById('adminToolsList');
    if (!container) return;
    container.innerHTML = '';
    
    tools.forEach(function(tool) {
        var logoUrl = tool.image && tool.image.trim() !== '' ? tool.image : DEFAULT_ICON;
        var item = document.createElement('div');
        item.className = 'tool-item';
        item.innerHTML = 
            '<div class="tool-item-info">' +
                '<img src="' + logoUrl + '" style="width:30px;height:30px;border-radius:4px;margin-right:10px;">' +
                '<div class="tool-item-details">' +
                    '<h4>' + escapeHtml(tool.name) + '</h4>' +
                    '<span>' + tool.category + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="tool-item-actions">' +
                '<button class="btn-delete" onclick="openDeleteModal(\'' + tool.firebaseId + '\')"><i class="fa-solid fa-trash"></i></button>' +
            '</div>';
        container.appendChild(item);
    });
}

// Re-exporting functions for your buttons
window.handleLogin = handleLogin;
window.handleAddTool = handleAddTool;
window.trackClick = trackClick;
window.openDeleteModal = (id) => {
    deleteTargetId = id;
    const tool = tools.find(t => t.firebaseId === id);
    document.getElementById('deleteToolName').textContent = tool.name;
    document.getElementById('deleteModal').classList.add('show');
};

// ... (Baki ke chatbot aur UI functions jo aapke original code mein the)
