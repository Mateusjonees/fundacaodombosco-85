// financial.js - Gerenciamento Financeiro
// FUNDAÇÃO DOM BOSCO

function initializeFinancial() {
    console.log('Financial module initialized');
    loadFinancialData();
}

function loadFinancialData() {
    const financial = readRecords('financial');
    console.log('Financial data loaded:', financial.length, 'records');
}