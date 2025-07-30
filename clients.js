// clients.js - Gerenciamento de Clientes
// FUNDAÇÃO DOM BOSCO

// Initialize client management
function initializeClientForm() {
    setupAgeSelection();
    setupClientForms();
    setupCEPAutocomplete();
}

// Setup age selection (adult/minor)
function setupAgeSelection() {
    const ageRadios = document.querySelectorAll('input[name="age-type"]');
    const adultForm = document.getElementById('form-novo-cliente-adulto');
    const minorForm = document.getElementById('form-novo-cliente-menor');
    
    ageRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'adult') {
                adultForm.style.display = 'block';
                minorForm.style.display = 'none';
            } else {
                adultForm.style.display = 'none';
                minorForm.style.display = 'block';
            }
        });
    });
}

// Setup client forms
function setupClientForms() {
    // Adult form
    const adultForm = document.getElementById('form-novo-cliente-adulto');
    if (adultForm) {
        adultForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleClientSubmit('adult');
        });
    }
    
    // Minor form
    const minorForm = document.getElementById('form-novo-cliente-menor');
    if (minorForm) {
        minorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleClientSubmit('minor');
        });
    }
    
    // Setup input formatting
    setupInputFormatting();
}

// Setup input formatting
function setupInputFormatting() {
    // CPF formatting
    const cpfInputs = document.querySelectorAll('input[id*="cpf"]');
    cpfInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = formatCPF(e.target.value);
        });
    });
    
    // Phone formatting
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = formatPhone(e.target.value);
        });
    });
    
    // CEP formatting
    const cepInputs = document.querySelectorAll('input[id*="cep"]');
    cepInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = formatCEP(e.target.value);
        });
    });
}

// Setup CEP autocomplete
function setupCEPAutocomplete() {
    const cepInputs = document.querySelectorAll('input[id*="cep"]');
    
    cepInputs.forEach(input => {
        input.addEventListener('blur', () => {
            const cep = input.value.replace(/\D/g, '');
            if (cep.length === 8) {
                fetchAddressByCEP(cep, input);
            }
        });
    });
}

// Fetch address by CEP
async function fetchAddressByCEP(cep, cepInput) {
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
            // Determine form type (adult or minor)
            const isMinor = cepInput.id.includes('menor');
            const suffix = isMinor ? '-menor' : '-adulto';
            
            // Fill address fields
            const logradouroInput = document.getElementById(`logradouro-cliente${suffix}`);
            const bairroInput = document.getElementById(`bairro-cliente${suffix}`);
            const cidadeInput = document.getElementById(`cidade-cliente${suffix}`);
            const estadoInput = document.getElementById(isMinor ? 'estado-cliente-menor' : 'estado-cidade-adulto');
            
            if (logradouroInput) logradouroInput.value = data.logradouro || '';
            if (bairroInput) bairroInput.value = data.bairro || '';
            if (cidadeInput) cidadeInput.value = data.localidade || '';
            if (estadoInput) estadoInput.value = data.uf || '';
            
            showNotification('Endereço preenchido automaticamente.', 'success');
        } else {
            showNotification('CEP não encontrado.', 'warning');
        }
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        showNotification('Erro ao buscar CEP. Verifique sua conexão.', 'error');
    }
}

// Handle client form submission
function handleClientSubmit(type) {
    const form = document.getElementById(`form-novo-cliente-${type === 'adult' ? 'adulto' : 'menor'}`);
    
    if (!validateForm(form)) {
        return;
    }
    
    const clientData = extractClientData(form, type);
    
    // Validate specific fields
    if (type === 'adult' && !validateCPF(clientData.cpf)) {
        showNotification('CPF inválido. Verifique o número digitado.', 'error');
        return;
    }
    
    if (clientData.email && !validateEmail(clientData.email)) {
        showNotification('Email inválido. Verifique o endereço digitado.', 'error');
        return;
    }
    
    // Check for duplicate CPF (adults only)
    if (type === 'adult' && checkDuplicateCPF(clientData.cpf)) {
        showNotification('Já existe um cliente cadastrado com este CPF.', 'error');
        return;
    }
    
    // Save client
    const savedClient = createRecord('clients', clientData);
    
    if (savedClient) {
        showNotification(`Cliente ${clientData.name} cadastrado com sucesso!`, 'success');
        clearForm(form);
        
        // Add notification
        addNotification(
            'Novo Cliente Cadastrado',
            `${clientData.name} foi cadastrado no sistema.`,
            'success'
        );
        
        // Reset to adult form
        document.querySelector('input[name="age-type"][value="adult"]').checked = true;
        document.getElementById('form-novo-cliente-adulto').style.display = 'block';
        document.getElementById('form-novo-cliente-menor').style.display = 'none';
    } else {
        showNotification('Erro ao salvar cliente. Tente novamente.', 'error');
    }
}

// Extract client data from form
function extractClientData(form, type) {
    const formData = new FormData(form);
    const data = {};
    
    // Get all form inputs
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.name || input.id) {
            const key = input.name || input.id;
            data[key] = input.value;
        }
    });
    
    // Common fields
    const clientData = {
        type: type,
        name: data[`nome-cliente-${type === 'adult' ? 'adulto' : 'menor'}`],
        birthDate: data[`data-nascimento-${type === 'adult' ? 'adulto' : 'menor'}`],
        gender: data[`genero-${type === 'adult' ? 'adulto' : 'menor'}`],
        unit: data[`unidade-atendimento-${type === 'adult' ? 'adulto' : 'menor'}`],
        observations: data[`observacoes-cliente-${type === 'adult' ? 'adulto' : 'menor'}`],
        
        // Clinical information
        diagnosis: data[`diagnostico-principal-${type === 'adult' ? 'adulto' : 'menor'}`],
        medicalHistory: data[`historico-medico-${type === 'adult' ? 'adulto' : 'menor'}`],
        complaint: data[`queixa-neuropsicologica-${type === 'adult' ? 'adulto' : 'menor'}`],
        expectations: data[`expectativas-tratamento-${type === 'adult' ? 'adulto' : 'menor'}`],
        
        // Address
        address: {
            cep: data[`cep-cliente-${type === 'adult' ? 'adulto' : 'menor'}`],
            street: data[`logradouro-cliente-${type === 'adult' ? 'adulto' : 'menor'}`],
            number: data[`numero-cliente-${type === 'adult' ? 'adulto' : 'menor'}`],
            complement: data[`complemento-cliente-${type === 'adult' ? 'adulto' : 'menor'}`],
            neighborhood: data[`bairro-cliente-${type === 'adult' ? 'adulto' : 'menor'}`],
            city: data[`cidade-cliente-${type === 'adult' ? 'adulto' : 'menor'}`],
            state: data[type === 'adult' ? 'estado-cidade-adulto' : 'estado-cliente-menor']
        }
    };
    
    if (type === 'adult') {
        // Adult-specific fields
        clientData.cpf = data['cpf-cliente-adulto'];
        clientData.rg = data['rg-adulto'];
        clientData.birthPlace = data['naturalidade-adulto'];
        clientData.maritalStatus = data['estado-civil-adulto'];
        clientData.education = data['escolaridade-adulto'];
        clientData.profession = data['profissao-adulto'];
        clientData.email = data['email-cliente-adulto'];
        clientData.phone = data['telefone-cliente-adulto'];
        clientData.emergencyContact = data['contato-emergencia-adulto'];
    } else {
        // Minor-specific fields
        clientData.school = data['escola-menor'];
        clientData.schoolType = data['tipo-escola-menor'];
        clientData.schoolYear = data['ano-escolar-menor'];
        
        clientData.parents = {
            father: {
                name: data['nome-pai'],
                age: data['idade-pai'],
                profession: data['profissao-pai'],
                phone: data['telefone-pai']
            },
            mother: {
                name: data['nome-mae'],
                age: data['idade-mae'],
                profession: data['profissao-mae'],
                phone: data['telefone-mae']
            },
            financialResponsible: data['responsavel-financeiro'],
            otherResponsible: data['outro-responsavel']
        };
    }
    
    // Calculate age
    clientData.age = calculateAge(clientData.birthDate);
    
    return clientData;
}

// Check for duplicate CPF
function checkDuplicateCPF(cpf) {
    if (!cpf) return false;
    
    const clients = readRecords('clients');
    return clients.some(client => client.cpf === cpf);
}

// Load clients list
function loadClientsList() {
    const container = document.getElementById('client-list-container');
    if (!container) return;
    
    const clients = readRecords('clients');
    
    if (clients.length === 0) {
        container.innerHTML = '<p>Nenhum cliente cadastrado ainda.</p>';
        return;
    }
    
    // Sort clients by name
    clients.sort((a, b) => a.name.localeCompare(b.name));
    
    // Render clients
    container.innerHTML = clients.map(client => `
        <div class="client-card" data-client-id="${client.id}">
            <div class="client-info">
                <h3>${client.name}</h3>
                <p class="client-details">
                    ${client.type === 'adult' ? 'Adulto' : 'Menor'} • 
                    ${client.age} anos • 
                    ${client.unit === 'madre' ? 'Clínica Social (Madre)' : 'Neuro (Floresta)'}
                </p>
                ${client.cpf ? `<p class="client-cpf">CPF: ${formatCPF(client.cpf)}</p>` : ''}
                <p class="client-meta">
                    Cadastrado em ${formatDate(client.createdAt)}
                </p>
            </div>
            <div class="client-actions">
                <button class="btn-primary btn-sm" onclick="openClientDetail('${client.id}')">
                    <i class="fa-solid fa-eye"></i> Ver
                </button>
                <button class="btn-secondary btn-sm" onclick="editClient('${client.id}')">
                    <i class="fa-solid fa-edit"></i> Editar
                </button>
            </div>
        </div>
    `).join('');
    
    // Setup search
    setupClientSearch();
}

// Setup client search
function setupClientSearch() {
    const searchInput = document.getElementById('search-cliente');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            filterClients(searchInput.value);
        }, 300));
    }
}

// Filter clients
function filterClients(searchTerm) {
    const container = document.getElementById('client-list-container');
    const clientCards = container.querySelectorAll('.client-card');
    
    if (!searchTerm) {
        clientCards.forEach(card => card.style.display = 'block');
        return;
    }
    
    const term = searchTerm.toLowerCase();
    
    clientCards.forEach(card => {
        const clientInfo = card.querySelector('.client-info').textContent.toLowerCase();
        if (clientInfo.includes(term)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Open client detail
function openClientDetail(clientId) {
    const client = readRecord('clients', clientId);
    if (!client) {
        showNotification('Cliente não encontrado.', 'error');
        return;
    }
    
    // Implementation depends on modal/detail view system
    console.log('Opening client detail:', client);
    showNotification(`Abrindo detalhes de ${client.name}`, 'info');
}

// Edit client
function editClient(clientId) {
    const client = readRecord('clients', clientId);
    if (!client) {
        showNotification('Cliente não encontrado.', 'error');
        return;
    }
    
    // Implementation depends on edit modal/form system
    console.log('Editing client:', client);
    showNotification(`Editando ${client.name}`, 'info');
}

// Load my patients (for professionals)
function loadMyPatients() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const container = document.getElementById('meus-pacientes-list');
    if (!container) return;
    
    // Get appointments for current user
    const appointments = readRecords('appointments', appointment => 
        appointment.professional === currentUser.name
    );
    
    // Get unique client IDs
    const clientIds = [...new Set(appointments.map(app => app.clientId))];
    
    // Get clients
    const myPatients = clientIds.map(id => readRecord('clients', id)).filter(Boolean);
    
    if (myPatients.length === 0) {
        container.innerHTML = '<p>Você ainda não tem pacientes atribuídos.</p>';
        return;
    }
    
    // Render patients
    container.innerHTML = myPatients.map(patient => `
        <div class="patient-card" data-patient-id="${patient.id}">
            <div class="patient-info">
                <h3>${patient.name}</h3>
                <p class="patient-details">
                    ${patient.type === 'adult' ? 'Adulto' : 'Menor'} • 
                    ${patient.age} anos
                </p>
                <p class="patient-meta">
                    Último atendimento: ${getLastAppointmentDate(patient.id)}
                </p>
            </div>
            <div class="patient-actions">
                <button class="btn-primary btn-sm" onclick="openClientDetail('${patient.id}')">
                    <i class="fa-solid fa-eye"></i> Ver Detalhes
                </button>
                <button class="btn-secondary btn-sm" onclick="scheduleAppointment('${patient.id}')">
                    <i class="fa-solid fa-calendar-plus"></i> Agendar
                </button>
            </div>
        </div>
    `).join('');
}

// Get last appointment date for patient
function getLastAppointmentDate(clientId) {
    const appointments = readRecords('appointments', app => app.clientId === clientId);
    
    if (appointments.length === 0) {
        return 'Nunca';
    }
    
    const lastAppointment = appointments
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    return formatDate(lastAppointment.date);
}

// Schedule appointment for patient
function scheduleAppointment(clientId) {
    // Switch to agenda tab and pre-fill client
    const agendaTab = document.querySelector('.tab-button[data-tab="agenda"]');
    if (agendaTab) {
        agendaTab.click();
        // Implementation depends on schedule system
        console.log('Scheduling appointment for client:', clientId);
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeClientForm,
        loadClientsList,
        loadMyPatients,
        openClientDetail,
        editClient
    };
}