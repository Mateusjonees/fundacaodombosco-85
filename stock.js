// stock.js - Controle de Estoque
// FUNDAÇÃO DOM BOSCO

function initializeStock() {
    console.log('Stock module initialized');
    loadStockData();
}

function loadStockData() {
    const stock = readRecords('stock');
    console.log('Stock data loaded:', stock.length, 'items');
}