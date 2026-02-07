// ============================================
// AI TOOLS HUB - SECURE SYSTEM (UPDATED WITH LOGO)
// Public Page + Secret Admin Page
// ============================================

// 🗂️ STATE
let tools = JSON.parse(localStorage.getItem('aihub_tools')) || [];
let isAdmin = false;
let deleteTargetId = null;
let loginAttempts = 0;
const MAX_ATTEMPTS = 5;

// Check if admin page
const IS_ADMIN = typeof _ia !== 'undefined' && _ia === true;
const SESSION_TIMEOUT = typeof _st !== 'undefined' ? _st : 30 * 60 * 1000;

// Default Icon (Jab user koi link na daale)
const DEFAULT_ICON = 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png';

// ============================================
// 🚀 INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (IS_ADMIN) {
        initAdminPage();
    } else {
        initPublicPage();
    }
});

// ============================================
// 📱 PUBLIC PAGE FUNCTIONS
// ============================================

function initPublicPage() {
    if (tools.length === 0) {
        addSampleTools();
    }
    
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
    
    var activeFilter = 'all';
    var activeBtn = document.querySelector('.pill.active');
    if (activeBtn) activeFilter = activeBtn.dataset.filter;
    
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
        // Logo logic added here
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
                '<a href="' + escapeHtml(tool.link) + '" target="_blank" rel="noopener" class="btn-visit" onclick="trackClick(' + tool.id + ')">' +
                    'Visit <i class="fa-solid fa-arrow-up-right-from-square"></i>' +
                '</a>' +
            '</div>';
        grid.appendChild(card);
    });
}

function updatePublicStats() {
    var statTools = document.getElementById('statTools');
    var statClicks = document.getElementById('statClicks');
    if (statTools) statTools.textContent = tools.length;
    if (statClicks) {
        var totalClicks = 0;
        tools.forEach(function(t) { totalClicks += (t.clicks || 0); });
        statClicks.textContent = totalClicks;
    }
}

// ============================================
// 🔐 ADMIN PAGE FUNCTIONS
// ============================================

function initAdminPage() {
    checkLockout();
    setupAdminEvents();
    checkAdminSession();
}

function setupAdminEvents() {
    var loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    
    var passField = document.getElementById('adminPassword');
    if (passField) {
        passField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    var addForm = document.getElementById('addToolForm');
    if (addForm) addForm.addEventListener('submit', handleAddTool);
    
    var editForm = document.getElementById('editToolForm');
    if (editForm) editForm.addEventListener('submit', handleEditTool);
    
    var deleteBtn = document.getElementById('confirmDeleteBtn');
    if (deleteBtn) deleteBtn.addEventListener('click', executeDelete);
    
    var overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(function(overlay) {
        overlay.addEventListener('click', function() {
            this.parentElement.classList.remove('show');
        });
    });
}

function checkLockout() {
    var lockoutTime = localStorage.getItem('aihub_lockout');
    if (lockoutTime) {
        var remaining = parseInt(lockoutTime) - Date.now();
        if (remaining > 0) {
            var mins = Math.ceil(remaining / 60000);
            showToast('Locked. Wait ' + mins + 'm', 'error');
            var loginBtn = document.getElementById('loginBtn');
            if (loginBtn) loginBtn.disabled = true;
            setTimeout(function() {
                localStorage.removeItem('aihub_lockout');
                if (loginBtn) loginBtn.disabled = false;
            }, remaining);
        }
    }
}

function checkAdminSession() {
    var session = sessionStorage.getItem('aihub_admin_session');
    if (session === 'active') showAdminDashboard();
}

function handleLogin() {
    var passwordInput = document.getElementById('adminPassword');
    var password = passwordInput ? passwordInput.value : '';
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

function handleLogout() {
    sessionStorage.clear();
    location.reload();
}

function showAdminDashboard() {
    var loginScreen = document.getElementById('loginScreen');
    var dashboard = document.getElementById('adminDashboard');
    if (loginScreen) loginScreen.classList.add('hidden');
    if (dashboard) dashboard.classList.remove('hidden');
    updateAdminStats();
    renderAdminToolsList();
}

function updateAdminStats() {
    var statTools = document.getElementById('adminStatTools');
    var statClicks = document.getElementById('adminStatClicks');
    if (statTools) statTools.textContent = tools.length;
    if (statClicks) {
        var totalClicks = 0;
        tools.forEach(function(t) { totalClicks += (t.clicks || 0); });
        statClicks.textContent = totalClicks;
    }
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
                '<button class="btn-edit" onclick="openEditModal(' + tool.id + ')"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="btn-delete" onclick="openDeleteModal(' + tool.id + ')"><i class="fa-solid fa-trash"></i></button>' +
            '</div>';
        container.appendChild(item);
    });
}

// ============================================
// 🛠️ TOOL MANAGEMENT (LOGO LOGIC UPDATED)
// ============================================

function handleAddTool(e) {
    e.preventDefault();
    
    var nameField = document.getElementById('addName');
    var categoryField = document.getElementById('addCategory');
    var linkField = document.getElementById('addLink');
    var descField = document.getElementById('addDesc');
    var imageField = document.getElementById('toolImage'); // Naya field
    
    var newTool = {
        id: Date.now(),
        name: nameField ? nameField.value.trim() : '',
        category: categoryField ? categoryField.value : 'chatbot',
        link: linkField ? linkField.value.trim() : '',
        desc: descField ? descField.value.trim() : '',
        image: imageField ? imageField.value.trim() : '', // Logo URL save ho raha hai
        clicks: 0,
        addedAt: Date.now()
    };
    
    tools.unshift(newTool);
    saveTools();
    e.target.reset();
    updateAdminStats();
    renderAdminToolsList();
    showToast('Tool added with logo!', 'success');
}

function openEditModal(id) {
    var tool = tools.find(t => t.id === id);
    if (!tool) return;
    
    document.getElementById('editId').value = tool.id;
    document.getElementById('editName').value = tool.name;
    document.getElementById('editCategory').value = tool.category;
    document.getElementById('editLink').value = tool.link;
    document.getElementById('editDesc').value = tool.desc;
    
    // Edit modal mein logo input ho toh use bhi bhar dein
    var editImg = document.getElementById('editToolImage');
    if (editImg) editImg.value = tool.image || '';
    
    document.getElementById('editModal').classList.add('show');
}

function handleEditTool(e) {
    e.preventDefault();
    var id = parseInt(document.getElementById('editId').value);
    var toolIndex = tools.findIndex(t => t.id === id);
    
    if (toolIndex !== -1) {
        tools[toolIndex].name = document.getElementById('editName').value;
        tools[toolIndex].category = document.getElementById('editCategory').value;
        tools[toolIndex].link = document.getElementById('editLink').value;
        tools[toolIndex].desc = document.getElementById('editDesc').value;
        
        var editImg = document.getElementById('editToolImage');
        if (editImg) tools[toolIndex].image = editImg.value.trim();
        
        saveTools();
        document.getElementById('editModal').classList.remove('show');
        renderAdminToolsList();
        showToast('Tool Updated!', 'success');
    }
}

function openDeleteModal(id) {
    deleteTargetId = id;
    var tool = tools.find(t => t.id === id);
    document.getElementById('deleteToolName').textContent = tool.name;
    document.getElementById('deleteModal').classList.add('show');
}

function executeDelete() {
    tools = tools.filter(t => t.id !== deleteTargetId);
    saveTools();
    document.getElementById('deleteModal').classList.remove('show');
    updateAdminStats();
    renderAdminToolsList();
    showToast('Tool Deleted', 'info');
}

// ============================================
// 🔧 HELPERS & OTHERS
// ============================================

function saveTools() {
    localStorage.setItem('aihub_tools', JSON.stringify(tools));
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function trackClick(id) {
    var tool = tools.find(t => t.id === id);
    if (tool) {
        tool.clicks = (tool.clicks || 0) + 1;
        saveTools();
    }
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

// Chatbot functions (retained as per your script)
function setupChatbot() {
    var sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
}

function sendMessage() {
    var input = document.getElementById('chatInput');
    var text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';
    setTimeout(() => addMessage(generateReply(text), 'bot'), 600);
}

function addMessage(text, sender) {
    var container = document.getElementById('chatMessages');
    if (!container) return;
    var div = document.createElement('div');
    div.className = 'message ' + sender;
    div.innerHTML = '<div class="message-content">' + escapeHtml(text) + '</div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function generateReply(input) {
    return "I am scanning AI tools for you! Type 'image' or 'chat' to see categories.";
}

function addSampleTools() {
    tools = [
        { id: 1, name: 'ChatGPT', category: 'chatbot', link: 'https://chat.openai.com', desc: 'Powerful AI Assistant', image: '', clicks: 0, addedAt: Date.now() }
    ];
    saveTools();
}

// Global Exports
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.trackClick = trackClick;
