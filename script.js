// ============================================
// AI TOOLS HUB - SECURE SYSTEM
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
    // Theme toggle
    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
    
    // Search
    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            renderPublicTools(e.target.value.toLowerCase());
        });
    }
    
    // Category filters
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
    if (activeBtn) {
        activeFilter = activeBtn.dataset.filter;
    }
    
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
    
    var icons = {
        chatbot: '🤖', 
        image: '🎨', 
        video: '🎬',
        audio: '🎵', 
        productivity: '⚡', 
        coding: '💻'
    };
    
    filtered.forEach(function(tool) {
        var card = document.createElement('div');
        card.className = 'tool-card';
        card.innerHTML = 
            '<div class="tool-header">' +
                '<div class="tool-icon">' + (icons[tool.category] || '🔧') + '</div>' +
                '<div class="tool-info">' +
                    '<h3>' + escapeHtml(tool.name) + '</h3>' +
                    '<span class="tool-category ' + tool.category + '">' + tool.category + '</span>' +
                '</div>' +
            '</div>' +
            '<p class="tool-desc">' + escapeHtml(tool.desc) + '</p>' +
            '<div class="tool-footer">' +
                '<span class="tool-stats">' +
                    '<i class="fa-solid fa-chart-simple"></i> ' +
                    (tool.clicks || 0) + ' uses' +
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
    // Login button
    var loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    // Enter key on password field
    var passField = document.getElementById('adminPassword');
    if (passField) {
        passField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    // Logout button
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Add tool form
    var addForm = document.getElementById('addToolForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddTool);
    }
    
    // Edit tool form
    var editForm = document.getElementById('editToolForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditTool);
    }
    
    // Delete confirm button
    var deleteBtn = document.getElementById('confirmDeleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', executeDelete);
    }
    
    // Modal overlays
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
            showToast('Account locked. Try again in ' + mins + ' minutes.', 'error');
            var loginBtn = document.getElementById('loginBtn');
            if (loginBtn) loginBtn.disabled = true;
            
            setTimeout(function() {
                localStorage.removeItem('aihub_lockout');
                loginAttempts = 0;
                if (loginBtn) loginBtn.disabled = false;
                showToast('You can try again now', 'info');
            }, remaining);
        } else {
            localStorage.removeItem('aihub_lockout');
        }
    }
}

function checkAdminSession() {
    var session = sessionStorage.getItem('aihub_admin_session');
    var sessionTime = sessionStorage.getItem('aihub_session_time');
    
    if (session === 'active' && sessionTime) {
        var elapsed = Date.now() - parseInt(sessionTime);
        if (elapsed < SESSION_TIMEOUT) {
            showAdminDashboard();
            
            // Auto logout timer
            setTimeout(function() {
                handleLogout();
                showToast('Session expired. Please login again.', 'info');
            }, SESSION_TIMEOUT - elapsed);
        } else {
            sessionStorage.removeItem('aihub_admin_session');
            sessionStorage.removeItem('aihub_session_time');
        }
    }
}

function handleLogin() {
    var passwordInput = document.getElementById('adminPassword');
    var errorMsg = document.getElementById('errorMsg');
    var password = passwordInput ? passwordInput.value : '';
    
    if (!password) {
        showToast('Please enter password', 'error');
        return;
    }
    
    // Check lockout
    var lockoutTime = localStorage.getItem('aihub_lockout');
    if (lockoutTime && parseInt(lockoutTime) > Date.now()) {
        var mins = Math.ceil((parseInt(lockoutTime) - Date.now()) / 60000);
        showToast('Account locked. Try again in ' + mins + ' minutes.', 'error');
        return;
    }
    
    // Verify password using secure function
    var isValid = false;
    if (typeof _vp === 'function') {
        isValid = _vp(password);
    }
    
    if (isValid) {
        // Success
        loginAttempts = 0;
        localStorage.removeItem('aihub_lockout');
        
        sessionStorage.setItem('aihub_admin_session', 'active');
        sessionStorage.setItem('aihub_session_time', Date.now().toString());
        
        if (errorMsg) errorMsg.classList.add('hidden');
        
        showAdminDashboard();
        showToast('Welcome! Login successful', 'success');
        
        // Auto logout after timeout
        setTimeout(function() {
            handleLogout();
            showToast('Session expired. Please login again.', 'info');
        }, SESSION_TIMEOUT);
        
    } else {
        // Failed
        loginAttempts++;
        
        if (errorMsg) errorMsg.classList.remove('hidden');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
        
        if (loginAttempts >= MAX_ATTEMPTS) {
            // Lock for 15 minutes
            var lockUntil = Date.now() + (15 * 60 * 1000);
            localStorage.setItem('aihub_lockout', lockUntil.toString());
            showToast('Too many attempts! Locked for 15 minutes.', 'error');
            
            var loginBtn = document.getElementById('loginBtn');
            if (loginBtn) loginBtn.disabled = true;
        } else {
            var remaining = MAX_ATTEMPTS - loginAttempts;
            showToast('Wrong password! ' + remaining + ' attempts left.', 'error');
        }
    }
}

function handleLogout() {
    sessionStorage.removeItem('aihub_admin_session');
    sessionStorage.removeItem('aihub_session_time');
    
    var loginScreen = document.getElementById('loginScreen');
    var dashboard = document.getElementById('adminDashboard');
    var passField = document.getElementById('adminPassword');
    var errorMsg = document.getElementById('errorMsg');
    
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (dashboard) dashboard.classList.add('hidden');
    if (passField) passField.value = '';
    if (errorMsg) errorMsg.classList.add('hidden');
    
    showToast('Logged out successfully', 'info');
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
    var lastUpdated = document.getElementById('adminLastUpdated');
    var toolCount = document.getElementById('toolCount');
    
    if (statTools) statTools.textContent = tools.length;
    
    if (statClicks) {
        var totalClicks = 0;
        tools.forEach(function(t) { totalClicks += (t.clicks || 0); });
        statClicks.textContent = totalClicks;
    }
    
    if (lastUpdated) {
        if (tools.length > 0) {
            var latest = tools[0];
            tools.forEach(function(t) {
                if (t.addedAt > latest.addedAt) latest = t;
            });
            var date = new Date(latest.addedAt);
            lastUpdated.textContent = date.toLocaleDateString();
        } else {
            lastUpdated.textContent = '-';
        }
    }
    
    if (toolCount) toolCount.textContent = tools.length + ' tools';
}

function renderAdminToolsList() {
    var container = document.getElementById('adminToolsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (tools.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No tools yet. Add your first tool above!</p>';
        return;
    }
    
    var icons = {
        chatbot: '🤖', 
        image: '🎨', 
        video: '🎬',
        audio: '🎵', 
        productivity: '⚡', 
        coding: '💻'
    };
    
    tools.forEach(function(tool) {
        var item = document.createElement('div');
        item.className = 'tool-item';
        item.innerHTML = 
            '<div class="tool-item-info">' +
                '<div class="tool-item-icon">' + (icons[tool.category] || '🔧') + '</div>' +
                '<div class="tool-item-details">' +
                    '<h4>' + escapeHtml(tool.name) + '</h4>' +
                    '<span>' + (tool.clicks || 0) + ' clicks • ' + tool.category + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="tool-item-actions">' +
                '<button class="btn-edit" onclick="openEditModal(' + tool.id + ')">' +
                    '<i class="fa-solid fa-pen"></i> Edit' +
                '</button>' +
                '<button class="btn-delete" onclick="openDeleteModal(' + tool.id + ')">' +
                    '<i class="fa-solid fa-trash"></i> Delete' +
                '</button>' +
            '</div>';
        container.appendChild(item);
    });
}

// ============================================
// 🛠️ TOOL MANAGEMENT
// ============================================

function handleAddTool(e) {
    e.preventDefault();
    
    var nameField = document.getElementById('addName');
    var categoryField = document.getElementById('addCategory');
    var linkField = document.getElementById('addLink');
    var descField = document.getElementById('addDesc');
    
    var newTool = {
        id: Date.now(),
        name: nameField ? nameField.value.trim() : '',
        category: categoryField ? categoryField.value : '',
        link: linkField ? linkField.value.trim() : '',
        desc: descField ? descField.value.trim() : '',
        clicks: 0,
        addedAt: Date.now()
    };
    
    tools.unshift(newTool);
    saveTools();
    
    e.target.reset();
    
    updateAdminStats();
    renderAdminToolsList();
    
    showToast('Tool added successfully!', 'success');
}

function openEditModal(id) {
    var tool = null;
    for (var i = 0; i < tools.length; i++) {
        if (tools[i].id === id) {
            tool = tools[i];
            break;
        }
    }
    if (!tool) return;
    
    var editId = document.getElementById('editId');
    var editName = document.getElementById('editName');
    var editCategory = document.getElementById('editCategory');
    var editLink = document.getElementById('editLink');
    var editDesc = document.getElementById('editDesc');
    var modal = document.getElementById('editModal');
    
    if (editId) editId.value = tool.id;
    if (editName) editName.value = tool.name;
    if (editCategory) editCategory.value = tool.category;
    if (editLink) editLink.value = tool.link;
    if (editDesc) editDesc.value = tool.desc;
    if (modal) modal.classList.add('show');
}

function closeEditModal() {
    var modal = document.getElementById('editModal');
    if (modal) modal.classList.remove('show');
}

function handleEditTool(e) {
    e.preventDefault();
    
    var editId = document.getElementById('editId');
    var editName = document.getElementById('editName');
    var editCategory = document.getElementById('editCategory');
    var editLink = document.getElementById('editLink');
    var editDesc = document.getElementById('editDesc');
    
    var id = editId ? parseInt(editId.value) : 0;
    
    for (var i = 0; i < tools.length; i++) {
        if (tools[i].id === id) {
            tools[i].name = editName ? editName.value.trim() : tools[i].name;
            tools[i].category = editCategory ? editCategory.value : tools[i].category;
            tools[i].link = editLink ? editLink.value.trim() : tools[i].link;
            tools[i].desc = editDesc ? editDesc.value.trim() : tools[i].desc;
            break;
        }
    }
    
    saveTools();
    closeEditModal();
    renderAdminToolsList();
    showToast('Tool updated!', 'success');
}

function openDeleteModal(id) {
    var tool = null;
    for (var i = 0; i < tools.length; i++) {
        if (tools[i].id === id) {
            tool = tools[i];
            break;
        }
    }
    if (!tool) return;
    
    deleteTargetId = id;
    
    var nameEl = document.getElementById('deleteToolName');
    var modal = document.getElementById('deleteModal');
    
    if (nameEl) nameEl.textContent = tool.name;
    if (modal) modal.classList.add('show');
}

function closeDeleteModal() {
    var modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('show');
    deleteTargetId = null;
}

function executeDelete() {
    if (!deleteTargetId) return;
    
    var newTools = [];
    for (var i = 0; i < tools.length; i++) {
        if (tools[i].id !== deleteTargetId) {
            newTools.push(tools[i]);
        }
    }
    tools = newTools;
    
    saveTools();
    closeDeleteModal();
    updateAdminStats();
    renderAdminToolsList();
    
    showToast('Tool deleted', 'info');
    deleteTargetId = null;
}

// ============================================
// 💬 CHATBOT
// ============================================

function setupChatbot() {
    var sendBtn = document.getElementById('sendBtn');
    var chatInput = document.getElementById('chatInput');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }
}

function sendMessage() {
    var input = document.getElementById('chatInput');
    if (!input) return;
    
    var text = input.value.trim();
    if (!text) return;
    
    addMessage(text, 'user');
    input.value = '';
    
    setTimeout(function() {
        var reply = generateReply(text);
        addMessage(reply, 'bot');
    }, 600);
}

function addMessage(text, sender) {
    var container = document.getElementById('chatMessages');
    if (!container) return;
    
    var div = document.createElement('div');
    div.className = 'message ' + sender;
    div.innerHTML = 
        '<div class="message-avatar"><i class="fa-solid ' + (sender === 'bot' ? 'fa-robot' : 'fa-user') + '"></i></div>' +
        '<div class="message-content"><p>' + escapeHtml(text) + '</p></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function generateReply(input) {
    var lower = input.toLowerCase();
    
    if (lower.match(/hi|hello|hey|namaste/)) {
        return "Hello! 👋 I can help you find AI tools. What are you looking for?";
    }
    
    if (lower.match(/image|photo|art|draw/)) {
        var imageTools = tools.filter(function(t) { return t.category === 'image'; });
        if (imageTools.length > 0) {
            var names = imageTools.map(function(t) { return t.name; }).join(', ');
            return "For AI images: " + names + ". Check 🎨 Image category!";
        }
        return "Check out Midjourney or DALL-E for AI images!";
    }
    
    if (lower.match(/chat|gpt|claude|text|write/)) {
        var chatTools = tools.filter(function(t) { return t.category === 'chatbot'; });
        if (chatTools.length > 0) {
            var names = chatTools.map(function(t) { return t.name; }).join(', ');
            return "For chat/text: " + names + ". See 💬 Chatbots!";
        }
        return "Try ChatGPT or Claude for conversations!";
    }
    
    if (lower.match(/video|movie/)) return "Check 🎬 Video category!";
    if (lower.match(/code|program/)) return "Check 💻 Coding category!";
    if (lower.match(/music|audio|voice/)) return "Check 🎵 Audio category!";
    
    return "I can help find AI tools! Ask about: images, chatbots, video, audio, or coding.";
}

// ============================================
// 🔧 HELPER FUNCTIONS
// ============================================

function toggleTheme() {
    var body = document.body;
    var isDark = body.getAttribute('data-theme') === 'dark';
    body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    
    var btn = document.getElementById('themeToggle');
    if (btn) {
        btn.innerHTML = isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    }
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveTools() {
    localStorage.setItem('aihub_tools', JSON.stringify(tools));
}

function trackClick(id) {
    for (var i = 0; i < tools.length; i++) {
        if (tools[i].id === id) {
            tools[i].clicks = (tools[i].clicks || 0) + 1;
            break;
        }
    }
    saveTools();
    updatePublicStats();
}

function showToast(message, type) {
    type = type || 'success';
    var container = document.getElementById('toastContainer');
    if (!container) return;
    
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    var icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-xmark';
    if (type === 'info') icon = 'fa-circle-info';
    
    toast.innerHTML = '<i class="fa-solid ' + icon + '"></i><span>' + message + '</span>';
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(function() { toast.remove(); }, 300);
    }, 3500);
}

function addSampleTools() {
    var samples = [
        {
            id: Date.now(),
            name: 'ChatGPT',
            category: 'chatbot',
            link: 'https://chat.openai.com',
            desc: 'OpenAI\'s powerful AI assistant for writing, coding, and more.',
            clicks: 0,
            addedAt: Date.now()
        },
        {
            id: Date.now() + 1,
            name: 'Midjourney',
            category: 'image',
            link: 'https://www.midjourney.com',
            desc: 'Create stunning AI art from text descriptions.',
            clicks: 0,
            addedAt: Date.now()
        },
        {
            id: Date.now() + 2,
            name: 'Claude',
            category: 'chatbot',
            link: 'https://claude.ai',
            desc: 'Anthropic\'s helpful AI assistant.',
            clicks: 0,
            addedAt: Date.now()
        }
    ];
    tools = samples;
    saveTools();
}

// Global functions for onclick
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.trackClick = trackClick;