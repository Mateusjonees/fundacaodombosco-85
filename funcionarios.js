// funcionarios.js - Gerenciamento de Funcionários
// FUNDAÇÃO DOM BOSCO

function initializeEmployees() {
    console.log('Employees module initialized');
    loadEmployees();
}

function loadEmployees() {
    const employees = readRecords('employees');
    console.log('Employees loaded:', employees.length, 'records');
}