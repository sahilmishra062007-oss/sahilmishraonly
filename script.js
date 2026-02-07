// ============================================
// AI TOOLS HUB - FIREBASE PERMANENT SYSTEM
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
let deleteTargetId = null;

// Check if admin page
const IS_ADMIN = typeof _ia !== 'undefined' && _ia === true;
const DEFAULT_ICON = 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png';

// ============================================
// 🚀 INITIALIZATION (Live Sync from Firebase)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Firebase se data live khichna
    db.ref('tools').on('value', (snapshot) => {
        const data = snapshot.val();
        tools = [];
        if (data) {
            Object.keys(data).forEach(key => {
                tools.push({ firebaseId: key, ...data[key] });
            });
            // Naye tools ko upar dikhane ke liye sort
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
// 📱 PUBLIC PAGE FUNCTIONS
// ============================================

function initPublicPage() {
    renderPublicTools();
    updatePublicStats();
    setupPublicEvents();
    setupChatbot();
}

function setupPublicEvents() {
    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.onclick = toggleTheme;
    
    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.oninput = function(e) {
            renderPublicTools(e.target.value.toLowerCase());
        };
    }
    
    document.querySelectorAll('.pill').forEach(pill => {
        pill.onclick = function(e) {
            document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');
            renderPublicTools(document.getElementById('searchInput')?.value.toLowerCase());
        };
    });
}

function renderPublicTools(search = '') {
    var grid = document.getElementById('toolsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    var activeFilter = document.querySelector('.pill.active')?.dataset.filter || 'all';
    
    var filtered = tools.filter(tool => {
        var matchSearch = !search || tool.name.toLowerCase().includes(search) || tool.desc.toLowerCase().includes(search);
        var matchFilter = activeFilter === 'all' || tool.category === activeFilter;
        return matchSearch && matchFilter;
    });
    
    if (filtered.length === 0) {
        document.getElementById('emptyState')?.classList.remove('hidden');
        return;
    }
    document.getElementById('emptyState')?.classList.add('hidden');
    
    filtered.forEach(tool => {
        var card = document.createElement('div');
        card.className = 'tool-card';
        var logoUrl = tool.image || DEFAULT_ICON;
        
        card.innerHTML = `
            <div class="tool-header">
                <div class="tool-icon-container">
                    <img src="${logoUrl}" class="tool-card-img" onerror="this.src='${DEFAULT_ICON}'">
                </div>
                <div class="tool-info">
                    <h3>${escapeHtml(tool.name)}</h3>
                    <span class="tool-category ${tool.category}">${tool.category}</span>
                </div>
            </div>
            <p class="tool-desc">${escapeHtml(tool.desc)}</p>
            <div class="tool-footer">
                <span class="tool-stats"><i class="fa-solid fa-chart-simple"></i> ${tool.clicks || 0} uses</span>
                <a href="${escapeHtml(tool.link)}" target="_blank" class="btn-visit" onclick="trackClick('${tool.firebaseId}')">
                    Visit <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            </div>`;
        grid.appendChild(card);
    });
}

// ============================================
// 🔐 ADMIN FUNCTIONS
// ============================================

function initAdminPage() {
    setupAdminEvents();
    if (sessionStorage.getItem('aihub_admin_session') === 'active') {
        showAdminDashboard();
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
    
    db.ref('tools').push(newTool).then(() => {
        showToast('Tool Saved to Google Server!', 'success');
        e.target.reset();
    }).catch(err => showToast('Error: ' + err.message, 'error'));
}

function executeDelete() {
    if (deleteTargetId) {
        db.ref('tools/' + deleteTargetId).remove().then(() => {
            document.getElementById('deleteModal').classList.remove('show');
            showToast('Deleted Forever', 'info');
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
// 🔧 HELPERS & UTILS
// ============================================

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAdminDashboard() {
    document.getElementById('loginScreen')?.classList.add('hidden');
    document.getElementById('adminDashboard')?.classList.remove('hidden');
    renderAdminToolsList();
    updateAdminStats();
}

function renderAdminToolsList() {
    var container = document.getElementById('adminToolsList');
    if (!container) return;
    container.innerHTML = '';
    tools.forEach(tool => {
        var item = document.createElement('div');
        item.className = 'tool-item';
        item.innerHTML = `
            <div class="tool-item-info">
                <img src="${tool.image || DEFAULT_ICON}" style="width:30px;height:30px;border-radius:6px;margin-right:10px;object-fit:contain">
                <div class="tool-item-details">
                    <h4>${escapeHtml(tool.name)}</h4>
                    <span>${tool.category}</span>
                </div>
            </div>
            <div class="tool-item-actions">
                <button class="btn-delete" onclick="openDeleteModal('${tool.firebaseId}')"><i class="fa-solid fa-trash"></i></button>
            </div>`;
        container.appendChild(item);
    });
}

function updateAdminStats() {
    var totalClicks = tools.reduce((sum, t) => sum + (t.clicks || 0), 0);
    if(document.getElementById('adminStatTools')) document.getElementById('adminStatTools').textContent = tools.length;
    if(document.getElementById('adminStatClicks')) document.getElementById('adminStatClicks').textContent = totalClicks;
}

function updatePublicStats() {
    var totalClicks = tools.reduce((sum, t) => sum + (t.clicks || 0), 0);
    if(document.getElementById('statTools')) document.getElementById('statTools').textContent = tools.length;
    if(document.getElementById('statClicks')) document.getElementById('statClicks').textContent = totalClicks;
}

function toggleTheme() {
    var isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.getElementById('themeToggle').innerHTML = isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
}

function showToast(msg, type) {
    var container = document.getElementById('toastContainer');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span>' + msg + '</span>';
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Window functions for HTML buttons
window.openDeleteModal = (id) => {
    deleteTargetId = id;
    const tool = tools.find(t => t.firebaseId === id);
    if(tool) {
        document.getElementById('deleteToolName').textContent = tool.name;
        document.getElementById('deleteModal').classList.add('show');
    }
};
window.trackClick = trackClick;
