// main.js - Arquivo Principal
// FUNDAÇÃO DOM BOSCO

// Application initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('FUNDAÇÃO DOM BOSCO - Sistema Iniciado');
    
    // Initialize core systems
    initDatabase();
    initAuth();
    
    // Initialize UI if user is already logged in
    if (isLoggedIn()) {
        initializeApp();
    }
});

// Initialize main application
function initializeApp() {
    console.log('Initializing main application...');
    
    // Initialize UI components
    initUI();
    
    // Initialize specific modules based on user permissions
    const currentUser = getCurrentUser();
    if (currentUser) {
        console.log(`User logged in: ${currentUser.name} (${currentUser.role})`);
        
        // Initialize modules based on permissions
        if (checkPermission('cadastro')) {
            console.log('Initializing client management...');
        }
        
        if (checkPermission('agenda')) {
            console.log('Initializing schedule management...');
        }
        
        if (checkPermission('financeiro')) {
            console.log('Initializing financial management...');
        }
        
        if (checkPermission('estoque')) {
            console.log('Initializing stock management...');
        }
        
        // Load initial data
        loadInitialData();
    }
}

// Load initial data
function loadInitialData() {
    console.log('Loading initial data...');
    
    // Check for any pending notifications
    checkPendingNotifications();
    
    // Update dashboard if needed
    updateDashboard();
}

// Check for pending notifications
function checkPendingNotifications() {
    const today = new Date();
    const appointments = readRecords('appointments');
    
    // Check for appointments today
    const todayAppointments = appointments.filter(app => {
        const appDate = new Date(app.date);
        return appDate.toDateString() === today.toDateString();
    });
    
    if (todayAppointments.length > 0) {
        addNotification(
            'Agenda do Dia',
            `Você tem ${todayAppointments.length} agendamento(s) para hoje.`,
            'info'
        );
    }
    
    // Check for low stock items (if user has permission)
    if (checkPermission('estoque')) {
        const stockItems = readRecords('stock');
        const lowStockItems = stockItems.filter(item => 
            item.quantity <= (item.minQuantity || 10)
        );
        
        if (lowStockItems.length > 0) {
            addNotification(
                'Estoque Baixo',
                `${lowStockItems.length} item(ns) com estoque baixo.`,
                'warning'
            );
        }
    }
}

// Update dashboard
function updateDashboard() {
    // This function would update any dashboard statistics
    // Implementation depends on specific dashboard requirements
    console.log('Dashboard updated');
}

// Handle global errors
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    showNotification('Ocorreu um erro inesperado. Recarregue a página se o problema persistir.', 'error');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('Erro de conexão. Verifique sua internet.', 'error');
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl+Shift+L = Logout
    if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        if (isLoggedIn()) {
            handleLogout();
        }
    }
    
    // Ctrl+Shift+S = Global Search
    if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Escape = Close modals/dropdowns
    if (event.key === 'Escape') {
        // Close any open modals
        const modals = document.querySelectorAll('.modal[style*="flex"]');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        
        // Close notification dropdown
        const notificationDropdown = document.getElementById('notification-dropdown');
        if (notificationDropdown && notificationDropdown.style.display === 'block') {
            notificationDropdown.style.display = 'none';
        }
    }
});

// Auto-save functionality
let autoSaveTimer;

function enableAutoSave(formId, interval = 30000) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    clearTimeout(autoSaveTimer);
    
    autoSaveTimer = setTimeout(() => {
        saveFormData(form);
    }, interval);
}

function saveFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    formData.forEach((value, key) => {
        data[key] = value;
    });
    
    localStorage.setItem(`autosave_${form.id}`, JSON.stringify({
        data: data,
        timestamp: new Date().toISOString()
    }));
    
    console.log('Form data auto-saved:', form.id);
}

function loadFormData(formId) {
    const saved = localStorage.getItem(`autosave_${formId}`);
    if (!saved) return false;
    
    try {
        const { data, timestamp } = JSON.parse(saved);
        const form = document.getElementById(formId);
        
        if (!form) return false;
        
        // Check if saved data is not too old (1 hour)
        const saveTime = new Date(timestamp);
        const now = new Date();
        const hoursDiff = (now - saveTime) / (1000 * 60 * 60);
        
        if (hoursDiff > 1) {
            localStorage.removeItem(`autosave_${formId}`);
            return false;
        }
        
        // Restore form data
        Object.entries(data).forEach(([key, value]) => {
            const input = form.querySelector(`[name="${key}"], #${key}`);
            if (input && value) {
                input.value = value;
            }
        });
        
        showNotification('Dados do formulário restaurados automaticamente.', 'info');
        return true;
    } catch (error) {
        console.error('Error loading form data:', error);
        return false;
    }
}

// Print functionality
function printContent(contentId) {
    const content = document.getElementById(contentId);
    if (!content) {
        showNotification('Conteúdo não encontrado para impressão.', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>FUNDAÇÃO DOM BOSCO - Impressão</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .print-header { text-align: center; margin-bottom: 20px; }
                .print-content { margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>FUNDAÇÃO DOM BOSCO</h1>
                <p>Data: ${formatDate(new Date().toISOString(), 'dd/mm/yyyy hh:mm')}</p>
            </div>
            <div class="print-content">
                ${content.innerHTML}
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

// Export data functionality
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showNotification('Nenhum dado para exportar.', 'warning');
        return;
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = headers.map(header => {
            let value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma
            if (typeof value === 'string') {
                value = value.replace(/"/g, '""');
                if (value.includes(',') || value.includes('\n')) {
                    value = `"${value}"`;
                }
            }
            return value;
        });
        csvContent += values.join(',') + '\n';
    });
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${getCurrentDate()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Arquivo exportado com sucesso.', 'success');
}

// System health check
function performHealthCheck() {
    const checks = {
        database: false,
        localStorage: false,
        internetConnection: false
    };
    
    // Check database
    try {
        const db = loadDatabase();
        checks.database = db && typeof db === 'object';
    } catch (error) {
        console.error('Database check failed:', error);
    }
    
    // Check localStorage
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        checks.localStorage = true;
    } catch (error) {
        console.error('localStorage check failed:', error);
    }
    
    // Check internet connection
    checks.internetConnection = navigator.onLine;
    
    // Report results
    const failedChecks = Object.entries(checks)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
    
    if (failedChecks.length > 0) {
        console.warn('Health check failed:', failedChecks);
        showNotification(`Problemas detectados: ${failedChecks.join(', ')}`, 'warning');
    } else {
        console.log('Health check passed');
    }
    
    return checks;
}

// Initialize placeholder functions for modules not yet implemented
function initializeSchedule() {
    console.log('Schedule module initialized');
}

function initializeFinancial() {
    console.log('Financial module initialized');
}

function initializeReports() {
    console.log('Reports module initialized');
}

function initializeStock() {
    console.log('Stock module initialized');
}

function initializeEmployees() {
    console.log('Employees module initialized');
}

function initializeDocuments() {
    console.log('Documents module initialized');
}

// Run health check on startup
setTimeout(() => {
    performHealthCheck();
}, 2000);

console.log('FUNDAÇÃO DOM BOSCO - Sistema carregado com sucesso!');