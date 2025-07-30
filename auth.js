// auth.js - Sistema de Autenticação
// FUNDAÇÃO DOM BOSCO

// Demo credentials for testing
const DEMO_CREDENTIALS = {
    'Admin Master': {
        password: 'admin123',
        role: 'diretor',
        permissions: ['all']
    },
    'Coordenador Geral': {
        password: 'coord123',
        role: 'coordenador',
        permissions: ['cadastro', 'agenda', 'historico', 'relatorios', 'funcionarios', 'documentos']
    },
    'Profissional Senior': {
        password: 'prof123',
        role: 'profissional',
        permissions: ['cadastro', 'agenda', 'meus-pacientes']
    },
    'Estagiário': {
        password: 'est123',
        role: 'estagiario',
        permissions: ['cadastro', 'agenda', 'meus-pacientes']
    },
    'Financeiro': {
        password: 'fin123',
        role: 'financeiro',
        permissions: ['financeiro', 'relatorios']
    }
};

let currentUser = null;

// Initialize authentication
function initAuth() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
    } else {
        showLogin();
    }
    
    // Setup login form
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Load demo credentials
    loadDemoCredentials();
}

// Load demo credentials for testing
function loadDemoCredentials() {
    const credentialsList = document.getElementById('demo-credentials-list');
    if (credentialsList) {
        credentialsList.innerHTML = '';
        Object.entries(DEMO_CREDENTIALS).forEach(([name, data]) => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${name}:</strong> ${data.password} (${data.role})`;
            credentialsList.appendChild(li);
        });
        
        // Show demo credentials in development
        const demoContainer = document.querySelector('.demo-credentials');
        if (demoContainer) {
            demoContainer.style.display = 'block';
        }
    }
}

// Handle login
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        showNotification('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    // Check credentials
    if (DEMO_CREDENTIALS[username] && DEMO_CREDENTIALS[username].password === password) {
        currentUser = {
            name: username,
            role: DEMO_CREDENTIALS[username].role,
            permissions: DEMO_CREDENTIALS[username].permissions,
            loginTime: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showNotification(`Bem-vindo, ${username}!`, 'success');
        showApp();
    } else {
        showNotification('Credenciais inválidas. Verifique seu nome de usuário e senha.', 'error');
    }
}

// Handle logout
function handleLogout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showLogin();
        showNotification('Logout realizado com sucesso.', 'success');
    }
}

// Show login screen
function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    
    // Clear form
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Show main app
function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    
    // Update user info in header
    updateUserInfo();
    
    // Setup permissions
    setupPermissions();
    
    // Initialize app modules
    if (typeof initializeApp === 'function') {
        initializeApp();
    }
}

// Update user info in header
function updateUserInfo() {
    if (currentUser) {
        const nameElement = document.getElementById('current-user-name');
        const roleElement = document.getElementById('current-user-role');
        
        if (nameElement) nameElement.textContent = currentUser.name;
        if (roleElement) roleElement.textContent = getRoleDisplayName(currentUser.role);
    }
}

// Get role display name
function getRoleDisplayName(role) {
    const roleNames = {
        'diretor': 'Diretor',
        'coordenador': 'Coordenador',
        'profissional': 'Profissional',
        'estagiario': 'Estagiário',
        'financeiro': 'Financeiro'
    };
    return roleNames[role] || role;
}

// Setup permissions based on user role
function setupPermissions() {
    if (!currentUser) return;
    
    // Hide/show navigation buttons based on permissions
    const navButtons = document.querySelectorAll('.tab-button');
    navButtons.forEach(button => {
        const tab = button.dataset.tab;
        const hasPermission = checkPermission(tab);
        
        if (hasPermission) {
            button.style.display = 'flex';
        } else {
            button.style.display = 'none';
        }
    });
    
    // Show first available tab
    const availableButtons = document.querySelectorAll('.tab-button[style*="flex"]');
    if (availableButtons.length > 0) {
        availableButtons[0].click();
    }
}

// Check if user has permission for specific action
function checkPermission(action) {
    if (!currentUser) return false;
    
    // Diretor has access to everything
    if (currentUser.role === 'diretor') return true;
    
    // Check specific permissions
    return currentUser.permissions.includes(action) || currentUser.permissions.includes('all');
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Check if user is logged in
function isLoggedIn() {
    return currentUser !== null;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initAuth,
        getCurrentUser,
        isLoggedIn,
        checkPermission,
        handleLogout
    };
}