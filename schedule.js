// schedule.js - Gerenciamento de Agenda
// FUNDAÇÃO DOM BOSCO

function initializeSchedule() {
    console.log('Schedule module initialized');
    setupDateSelector();
    loadAgenda();
}

function setupDateSelector() {
    const dateSelector = document.getElementById('date-selector');
    if (dateSelector) {
        dateSelector.value = getCurrentDate();
        dateSelector.addEventListener('change', loadAgenda);
    }
}

function loadAgenda() {
    const container = document.getElementById('agenda-list');
    if (!container) return;
    
    const appointments = readRecords('appointments');
    container.innerHTML = appointments.length ? 
        '<p>Agendamentos carregados...</p>' : 
        '<p>Nenhum agendamento para este dia.</p>';
}