// ui.js - Interface do Usuário
// FUNDAÇÃO DOM BOSCO

// Initialize UI components
function initUI() {
    setupTabNavigation();
    setupGlobalSearch();
    setupNotifications();
    setupMobileResponsive();
    updateCurrentDate();
}

// Setup tab navigation
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const targetTab = document.getElementById(`tab-${tabId}`);
            if (targetTab) {
                targetTab.classList.add('active');
                
                // Trigger tab-specific initialization
                onTabActivated(tabId);
            }
        });
    });
    
    // Activate first available tab
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }
}

// Handle tab activation
function onTabActivated(tabId) {
    switch (tabId) {
        case 'cadastro':
            initializeClientForm();
            break;
        case 'agenda':
            initializeSchedule();
            break;
        case 'historico':
            loadClientsList();
            break;
        case 'meus-pacientes':
            loadMyPatients();
            break;
        case 'financeiro':
            initializeFinancial();
            break;
        case 'relatorios':
            initializeReports();
            break;
        case 'estoque':
            initializeStock();
            break;
        case 'funcionarios':
            initializeEmployees();
            break;
        case 'documentos':
            initializeDocuments();
            break;
    }
}

// Setup global search
function setupGlobalSearch() {
    const searchInput = document.getElementById('global-search-input');
    const searchButton = document.getElementById('btn-global-search');
    
    if (searchInput) {
        // Setup autocomplete
        searchInput.addEventListener('input', debounce(() => {
            updateGlobalSearchSuggestions(searchInput.value);
        }, 300));
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performGlobalSearch(searchInput.value);
            }
        });
    }
    
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            performGlobalSearch(searchInput.value);
        });
    }
}

// Update global search suggestions
function updateGlobalSearchSuggestions(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) return;
    
    const datalist = document.getElementById('global-search-datalist');
    if (!datalist) return;
    
    datalist.innerHTML = '';
    
    // Search clients
    const clients = searchRecords('clients', searchTerm, ['name', 'cpf', 'email']);
    clients.slice(0, 5).forEach(client => {
        const option = document.createElement('option');
        option.value = `${client.name} - ${formatCPF(client.cpf)}`;
        option.dataset.type = 'client';
        option.dataset.id = client.id;
        datalist.appendChild(option);
    });
    
    // Search employees
    const employees = searchRecords('employees', searchTerm, ['name', 'email']);
    employees.slice(0, 3).forEach(employee => {
        const option = document.createElement('option');
        option.value = `${employee.name} (Funcionário)`;
        option.dataset.type = 'employee';
        option.dataset.id = employee.id;
        datalist.appendChild(option);
    });
}

// Perform global search
function performGlobalSearch(searchTerm) {
    if (!searchTerm) {
        showNotification('Digite algo para buscar.', 'warning');
        return;
    }
    
    // Search for exact matches first
    const clients = searchRecords('clients', searchTerm, ['name', 'cpf', 'email']);
    
    if (clients.length === 1) {
        // Open client detail
        openClientDetail(clients[0].id);
        return;
    }
    
    if (clients.length > 1) {
        // Show list of matches
        showGlobalSearchResults(clients, 'clients');
        return;
    }
    
    // No matches found
    showNotification(`Nenhum resultado encontrado para "${searchTerm}".`, 'info');
}

// Show global search results
function showGlobalSearchResults(results, type) {
    // Implementation depends on the specific tab/modal system
    console.log('Search results:', results, type);
    showNotification(`${results.length} resultado(s) encontrado(s).`, 'info');
}

// Setup notifications
function setupNotifications() {
    const bellButton = document.getElementById('notification-bell');
    const dropdown = document.getElementById('notification-dropdown');
    
    if (bellButton && dropdown) {
        bellButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
        });
        
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Load notifications
    loadNotifications();
}

// Load notifications
function loadNotifications() {
    const notifications = readRecords('notifications');
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Update notification count
    const countElement = document.getElementById('notification-count');
    if (countElement) {
        if (unreadCount > 0) {
            countElement.textContent = unreadCount > 99 ? '99+' : unreadCount;
            countElement.style.display = 'block';
        } else {
            countElement.style.display = 'none';
        }
    }
    
    // Update notification list
    const listElement = document.getElementById('notification-list');
    if (listElement) {
        listElement.innerHTML = '';
        
        if (notifications.length === 0) {
            listElement.innerHTML = '<p>Nenhuma nova notificação.</p>';
            return;
        }
        
        notifications.slice(0, 10).forEach(notification => {
            const div = document.createElement('div');
            div.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
            div.innerHTML = `
                <div class="notification-content">
                    <strong>${notification.title}</strong>
                    <p>${notification.message}</p>
                    <small>${formatDate(notification.createdAt, 'dd/mm/yyyy hh:mm')}</small>
                </div>
            `;
            
            div.addEventListener('click', () => {
                markNotificationAsRead(notification.id);
                if (notification.action) {
                    // Handle notification action
                    console.log('Notification action:', notification.action);
                }
            });
            
            listElement.appendChild(div);
        });
    }
}

// Mark notification as read
function markNotificationAsRead(notificationId) {
    updateRecord('notifications', notificationId, { read: true });
    loadNotifications();
}

// Add new notification
function addNotification(title, message, type = 'info', action = null) {
    const notification = {
        title,
        message,
        type,
        action,
        read: false
    };
    
    createRecord('notifications', notification);
    loadNotifications();
}

// Setup mobile responsive features
function setupMobileResponsive() {
    // Handle window resize
    window.addEventListener('resize', () => {
        adjustMobileLayout();
    });
    
    // Initial adjustment
    adjustMobileLayout();
}

// Adjust layout for mobile
function adjustMobileLayout() {
    const isMobile = window.innerWidth <= 768;
    const nav = document.querySelector('nav');
    
    if (nav && isMobile) {
        // Enable horizontal scroll for navigation
        nav.style.overflowX = 'auto';
        nav.style.whiteSpace = 'nowrap';
    }
}

// Update current date display
function updateCurrentDate() {
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        const today = new Date();
        const dateStr = today.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        currentDateElement.textContent = dateStr;
    }
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Form validation helpers
function validateForm(formElement) {
    const requiredFields = formElement.querySelectorAll('[required]');
    let isValid = true;
    let firstInvalidField = null;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
            if (!firstInvalidField) {
                firstInvalidField = field;
            }
        } else {
            field.classList.remove('error');
        }
    });
    
    if (!isValid && firstInvalidField) {
        firstInvalidField.focus();
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
    }
    
    return isValid;
}

// Clear form
function clearForm(formElement) {
    const inputs = formElement.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
        } else {
            input.value = '';
        }
        input.classList.remove('error');
    });
}

// Loading state helpers
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading">Carregando...</div>';
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const loading = element.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initUI,
        onTabActivated,
        addNotification,
        openModal,
        closeModal,
        validateForm,
        clearForm,
        showLoading,
        hideLoading
    };
}