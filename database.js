// database.js - Sistema de Banco de Dados Local
// FUNDAÇÃO DOM BOSCO

// Database structure
const DB_STRUCTURE = {
    clients: [],
    appointments: [],
    financial: [],
    stock: [],
    employees: [],
    settings: {},
    notifications: []
};

// Initialize database
function initDatabase() {
    // Check if database exists in localStorage
    if (!localStorage.getItem('fundacao_db')) {
        // Create initial database
        saveDatabase(DB_STRUCTURE);
        console.log('Database initialized');
    } else {
        console.log('Database loaded from localStorage');
    }
    
    // Ensure all tables exist
    const db = loadDatabase();
    let updated = false;
    
    Object.keys(DB_STRUCTURE).forEach(table => {
        if (!db[table]) {
            db[table] = DB_STRUCTURE[table];
            updated = true;
        }
    });
    
    if (updated) {
        saveDatabase(db);
    }
}

// Load database from localStorage
function loadDatabase() {
    try {
        const data = localStorage.getItem('fundacao_db');
        return data ? JSON.parse(data) : DB_STRUCTURE;
    } catch (error) {
        console.error('Error loading database:', error);
        return DB_STRUCTURE;
    }
}

// Save database to localStorage
function saveDatabase(data) {
    try {
        localStorage.setItem('fundacao_db', JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving database:', error);
        return false;
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// CRUD Operations

// Create record
function createRecord(table, data) {
    const db = loadDatabase();
    if (!db[table]) {
        console.error(`Table ${table} does not exist`);
        return null;
    }
    
    const record = {
        id: generateId(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    db[table].push(record);
    
    if (saveDatabase(db)) {
        console.log(`Record created in ${table}:`, record.id);
        return record;
    }
    
    return null;
}

// Read records
function readRecords(table, filter = null) {
    const db = loadDatabase();
    if (!db[table]) {
        console.error(`Table ${table} does not exist`);
        return [];
    }
    
    let records = db[table];
    
    if (filter && typeof filter === 'function') {
        records = records.filter(filter);
    }
    
    return records;
}

// Read single record by ID
function readRecord(table, id) {
    const db = loadDatabase();
    if (!db[table]) {
        console.error(`Table ${table} does not exist`);
        return null;
    }
    
    return db[table].find(record => record.id === id) || null;
}

// Update record
function updateRecord(table, id, data) {
    const db = loadDatabase();
    if (!db[table]) {
        console.error(`Table ${table} does not exist`);
        return null;
    }
    
    const index = db[table].findIndex(record => record.id === id);
    if (index === -1) {
        console.error(`Record ${id} not found in ${table}`);
        return null;
    }
    
    db[table][index] = {
        ...db[table][index],
        ...data,
        updatedAt: new Date().toISOString()
    };
    
    if (saveDatabase(db)) {
        console.log(`Record updated in ${table}:`, id);
        return db[table][index];
    }
    
    return null;
}

// Delete record
function deleteRecord(table, id) {
    const db = loadDatabase();
    if (!db[table]) {
        console.error(`Table ${table} does not exist`);
        return false;
    }
    
    const index = db[table].findIndex(record => record.id === id);
    if (index === -1) {
        console.error(`Record ${id} not found in ${table}`);
        return false;
    }
    
    db[table].splice(index, 1);
    
    if (saveDatabase(db)) {
        console.log(`Record deleted from ${table}:`, id);
        return true;
    }
    
    return false;
}

// Search records
function searchRecords(table, searchTerm, fields = []) {
    const records = readRecords(table);
    if (!searchTerm) return records;
    
    const term = searchTerm.toLowerCase();
    
    return records.filter(record => {
        if (fields.length === 0) {
            // Search all string fields
            return Object.values(record).some(value => 
                typeof value === 'string' && value.toLowerCase().includes(term)
            );
        } else {
            // Search specific fields
            return fields.some(field => 
                record[field] && 
                typeof record[field] === 'string' && 
                record[field].toLowerCase().includes(term)
            );
        }
    });
}

// Get database statistics
function getDatabaseStats() {
    const db = loadDatabase();
    const stats = {};
    
    Object.keys(db).forEach(table => {
        if (Array.isArray(db[table])) {
            stats[table] = db[table].length;
        }
    });
    
    return stats;
}

// Export database for backup
function exportDatabase() {
    const db = loadDatabase();
    const dataStr = JSON.stringify(db, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `fundacao_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import database from backup
function importDatabase(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (saveDatabase(data)) {
                    resolve(true);
                } else {
                    reject(new Error('Failed to save imported data'));
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

// Clear all data (use with caution)
function clearDatabase() {
    if (confirm('ATENÇÃO: Esta ação irá apagar todos os dados do sistema. Tem certeza?')) {
        if (confirm('Esta ação é IRREVERSÍVEL. Confirma a exclusão de todos os dados?')) {
            saveDatabase(DB_STRUCTURE);
            showNotification('Banco de dados limpo com sucesso.', 'success');
            return true;
        }
    }
    return false;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initDatabase,
        createRecord,
        readRecords,
        readRecord,
        updateRecord,
        deleteRecord,
        searchRecords,
        getDatabaseStats,
        exportDatabase,
        importDatabase,
        clearDatabase
    };
}