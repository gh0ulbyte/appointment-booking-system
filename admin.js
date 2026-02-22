// Sistema de administración para ver todos los emprendimientos
// En producción, esto se conectaría a una base de datos

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadAllEntrepreneurs();
});

// Cargar todos los emprendimientos
function loadAllEntrepreneurs() {
    // En producción, esto vendría de una API/BD
    // Por ahora, simulamos con los datos de localStorage
    
    const entrepreneurs = getEntrepreneursFromStorage();
    
    // Actualizar estadísticas
    updateAdminStats(entrepreneurs);
    
    // Mostrar emprendimientos
    displayEntrepreneurs(entrepreneurs);
}

// Obtener emprendimientos desde localStorage
// En producción, esto sería una llamada a la API
function getEntrepreneursFromStorage() {
    // Por ahora, creamos un emprendimiento basado en los datos locales
    // En producción, habría múltiples emprendimientos en una BD
    
    const usageData = getUsageData();
    const plan = localStorage.getItem('turnero_plan') || 'free';
    const bookings = getAllBookings();
    
    // Calcular estadísticas
    const activeBookings = bookings.filter(b => b.status === 'active').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    
    const turnsUsed = usageData.count || 0;
    const status = plan === 'paid' 
        ? 'premium' 
        : turnsUsed >= 60 
            ? 'to-pay' 
            : 'with-bonus';
    
    return [{
        id: 'default',
        name: 'Miradas Eternas', // En producción, esto vendría de la BD
        email: 'emprendedor@ejemplo.com',
        plan: plan,
        turnsUsed: turnsUsed,
        turnsLimit: plan === 'paid' ? 'Ilimitados' : 60,
        status: status,
        activeBookings: activeBookings,
        cancelledBookings: cancelledBookings,
        createdAt: new Date().toISOString()
    }];
}

// Obtener datos de uso
function getUsageData() {
    try {
        const data = localStorage.getItem('turnero_usage');
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error al leer datos de uso:', error);
    }
    return { count: 0 };
}

// Obtener todos los turnos
function getAllBookings() {
    try {
        const data = localStorage.getItem('turnero_bookings');
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error al leer turnos:', error);
    }
    return [];
}

// Actualizar estadísticas del admin
function updateAdminStats(entrepreneurs) {
    const total = entrepreneurs.length;
    const toPay = entrepreneurs.filter(e => e.status === 'to-pay').length;
    const withBonus = entrepreneurs.filter(e => e.status === 'with-bonus').length;
    const premium = entrepreneurs.filter(e => e.status === 'premium').length;
    
    document.getElementById('total-active').textContent = total;
    document.getElementById('total-to-pay').textContent = toPay;
    document.getElementById('total-with-bonus').textContent = withBonus;
    document.getElementById('total-premium').textContent = premium;
}

// Mostrar emprendimientos
function displayEntrepreneurs(entrepreneurs, filter = 'all') {
    const container = document.getElementById('entrepreneurs-list');
    const noData = document.getElementById('no-entrepreneurs');
    
    if (!container) return;
    
    // Filtrar
    let filtered = entrepreneurs;
    if (filter === 'to-pay') {
        filtered = entrepreneurs.filter(e => e.status === 'to-pay');
    } else if (filter === 'with-bonus') {
        filtered = entrepreneurs.filter(e => e.status === 'with-bonus');
    } else if (filter === 'premium') {
        filtered = entrepreneurs.filter(e => e.status === 'premium');
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '';
        noData.style.display = 'block';
        return;
    }
    
    noData.style.display = 'none';
    
    container.innerHTML = filtered.map(entrepreneur => {
        const statusConfig = getStatusConfig(entrepreneur.status);
        
        return `
            <div class="entrepreneur-card ${entrepreneur.status}">
                <div class="entrepreneur-header">
                    <div>
                        <h3>${entrepreneur.name}</h3>
                        <span class="status-badge ${statusConfig.class}">${statusConfig.label}</span>
                    </div>
                    <span class="entrepreneur-id">ID: ${entrepreneur.id}</span>
                </div>
                <div class="entrepreneur-body">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">📧 Email:</span>
                            <span>${entrepreneur.email}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">📊 Plan:</span>
                            <span>${entrepreneur.plan === 'paid' ? 'Premium' : 'Gratuito'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">🎁 Turnos Usados:</span>
                            <span><strong>${entrepreneur.turnsUsed}</strong> de ${entrepreneur.turnsLimit}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">✅ Turnos Activos:</span>
                            <span>${entrepreneur.activeBookings}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">❌ Cancelados:</span>
                            <span>${entrepreneur.cancelledBookings}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">📅 Registrado:</span>
                            <span>${formatDate(new Date(entrepreneur.createdAt))}</span>
                        </div>
                    </div>
                    ${entrepreneur.status === 'to-pay' ? `
                    <div class="alert-warning">
                        ⚠️ Este emprendimiento ha agotado su bono y requiere actualizar a plan Premium para continuar.
                    </div>
                    ` : ''}
                    ${entrepreneur.status === 'with-bonus' && entrepreneur.turnsUsed >= 50 ? `
                    <div class="alert-info">
                        💡 Este emprendimiento está cerca de agotar su bono (${60 - entrepreneur.turnsUsed} turnos restantes).
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Obtener configuración de estado
function getStatusConfig(status) {
    const configs = {
        'to-pay': { class: 'warning', label: '⚠️ Por Pagar' },
        'with-bonus': { class: 'info', label: '🎁 Con Bono' },
        'premium': { class: 'success', label: '⭐ Premium' }
    };
    return configs[status] || { class: '', label: status };
}

// Filtrar emprendimientos
function filterEntrepreneurs(filter) {
    // Actualizar tabs
    document.querySelectorAll('.admin-filters .filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.includes(filter === 'to-pay' ? 'Por Pagar' : 
                                     filter === 'with-bonus' ? 'Con Bono' :
                                     filter === 'premium' ? 'Premium' : 'Todos')) {
            tab.classList.add('active');
        }
    });
    
    const entrepreneurs = getEntrepreneursFromStorage();
    displayEntrepreneurs(entrepreneurs, filter);
}

// Buscar emprendimientos
function searchEntrepreneurs() {
    const searchTerm = document.getElementById('admin-search').value.toLowerCase();
    const entrepreneurs = getEntrepreneursFromStorage();
    
    if (!searchTerm) {
        const activeFilter = document.querySelector('.admin-filters .filter-tab.active')?.textContent || 'all';
        const filter = activeFilter.includes('Por Pagar') ? 'to-pay' :
                      activeFilter.includes('Con Bono') ? 'with-bonus' :
                      activeFilter.includes('Premium') ? 'premium' : 'all';
        displayEntrepreneurs(entrepreneurs, filter);
        return;
    }
    
    const filtered = entrepreneurs.filter(entrepreneur => {
        return entrepreneur.name.toLowerCase().includes(searchTerm) ||
               entrepreneur.email.toLowerCase().includes(searchTerm) ||
               entrepreneur.id.toLowerCase().includes(searchTerm);
    });
    
    displayEntrepreneurs(filtered, 'all');
}

// Formatear fecha
function formatDate(date) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

// Hacer funciones globales
window.filterEntrepreneurs = filterEntrepreneurs;
window.searchEntrepreneurs = searchEntrepreneurs;

