// Sistema de gestión de turnos para el emprendedor
// Obtener el ID del emprendedor desde la URL o localStorage
const ENTREPRENEUR_ID = getEntrepreneurId();

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadEntrepreneurStats();
    loadAllBookings();
});

// Obtener ID del emprendedor (por ahora desde localStorage, en producción desde autenticación)
function getEntrepreneurId() {
    // En producción, esto vendría de la autenticación
    // Por ahora, usamos un ID por defecto o desde URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id') || localStorage.getItem('entrepreneur_id') || 'default';
    return id;
}

// Cargar estadísticas del emprendedor
function loadEntrepreneurStats() {
    const usageData = getUsageData();
    const plan = localStorage.getItem('turnero_plan') || 'free';
    
    // Actualizar contador de turnos
    const turnsUsed = usageData.count || 0;
    document.getElementById('turns-used').textContent = turnsUsed;
    
    // Actualizar estado del plan
    const planStatus = document.getElementById('plan-status-text');
    if (plan === 'paid') {
        planStatus.textContent = 'Plan Premium';
        planStatus.style.color = 'var(--success-color)';
    } else {
        planStatus.textContent = 'Plan Gratuito';
        planStatus.style.color = 'var(--primary-color)';
        
        // Mostrar advertencia si está cerca del límite
        if (turnsUsed >= 60) {
            planStatus.textContent = '⚠️ Bono Agotado - Requiere Pago';
            planStatus.style.color = '#ef4444';
        } else if (turnsUsed >= 50) {
            planStatus.textContent = '⚠️ Bono Casi Agotado';
            planStatus.style.color = '#f59e0b';
        }
    }
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

// Cargar todos los turnos
function loadAllBookings() {
    const bookings = getAllBookings();
    const now = new Date();
    
    // Separar por estado
    const active = [];
    const cancelled = [];
    const past = [];
    
    bookings.forEach(booking => {
        const bookingDate = new Date(booking.date);
        const [hours, minutes] = booking.time.split(':');
        bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (booking.status === 'cancelled') {
            cancelled.push(booking);
        } else if (bookingDate < now) {
            past.push(booking);
        } else {
            active.push(booking);
        }
    });
    
    // Actualizar contadores
    document.getElementById('active-bookings-count').textContent = active.length;
    document.getElementById('cancelled-bookings-count').textContent = cancelled.length;
    
    // Mostrar turnos
    displayBookings(bookings);
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

// Mostrar turnos
function displayBookings(bookings, filter = 'all') {
    const container = document.getElementById('bookings-list');
    const noBookings = document.getElementById('no-bookings');
    
    if (!container) return;
    
    // Filtrar turnos
    const now = new Date();
    let filtered = bookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        const [hours, minutes] = booking.time.split(':');
        bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (filter === 'active') {
            return booking.status === 'active' && bookingDate >= now;
        } else if (filter === 'cancelled') {
            return booking.status === 'cancelled';
        } else if (filter === 'past') {
            return booking.status === 'active' && bookingDate < now;
        }
        return true;
    });
    
    // Ordenar por fecha
    filtered.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = '';
        noBookings.style.display = 'block';
        return;
    }
    
    noBookings.style.display = 'none';
    
    container.innerHTML = filtered.map(booking => {
        const bookingDate = new Date(booking.date);
        const [hours, minutes] = booking.time.split(':');
        bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const isPast = bookingDate < new Date();
        const isCancelled = booking.status === 'cancelled';
        
        const serviceNames = {
            'consulta': 'Consulta',
            'tratamiento': 'Tratamiento',
            'seguimiento': 'Seguimiento'
        };
        const serviceName = serviceNames[booking.service] || booking.service;
        
        const statusBadge = isCancelled 
            ? '<span class="status-badge cancelled">Cancelado</span>'
            : isPast
                ? '<span class="status-badge past">Completado</span>'
                : '<span class="status-badge active">Activo</span>';
        
        return `
            <div class="booking-card ${isCancelled ? 'cancelled' : ''} ${isPast ? 'past' : ''}">
                <div class="booking-card-header">
                    <div>
                        <strong>${serviceName}</strong>
                        ${statusBadge}
                    </div>
                    <span class="booking-id-small">${booking.id}</span>
                </div>
                <div class="booking-card-body">
                    <div class="booking-info-row">
                        <span class="info-label">👤 Cliente:</span>
                        <span>${booking.name}</span>
                    </div>
                    <div class="booking-info-row">
                        <span class="info-label">📧 Email:</span>
                        <span>${booking.email}</span>
                    </div>
                    <div class="booking-info-row">
                        <span class="info-label">📞 Teléfono:</span>
                        <span>${booking.phone}</span>
                    </div>
                    <div class="booking-info-row">
                        <span class="info-label">📅 Fecha:</span>
                        <span>${formatDate(new Date(booking.date))}</span>
                    </div>
                    <div class="booking-info-row">
                        <span class="info-label">⏰ Hora:</span>
                        <span>${booking.time}</span>
                    </div>
                    ${booking.notes ? `
                    <div class="booking-info-row">
                        <span class="info-label">📝 Notas:</span>
                        <span>${booking.notes}</span>
                    </div>
                    ` : ''}
                    ${booking.cancelledAt ? `
                    <div class="booking-info-row">
                        <span class="info-label">❌ Cancelado:</span>
                        <span>${formatDateTime(new Date(booking.cancelledAt))}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Filtrar turnos
function filterBookings(filter) {
    // Actualizar tabs activos
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.filter === filter) {
            tab.classList.add('active');
        }
    });
    
    const bookings = getAllBookings();
    displayBookings(bookings, filter);
}

// Buscar turnos
function searchBookings() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const bookings = getAllBookings();
    
    if (!searchTerm) {
        const activeFilter = document.querySelector('.filter-tab.active')?.dataset.filter || 'all';
        displayBookings(bookings, activeFilter);
        return;
    }
    
    const filtered = bookings.filter(booking => {
        return booking.name.toLowerCase().includes(searchTerm) ||
               booking.email.toLowerCase().includes(searchTerm) ||
               booking.id.toLowerCase().includes(searchTerm) ||
               booking.phone.includes(searchTerm);
    });
    
    displayBookings(filtered, 'all');
}

// Formatear fecha
function formatDate(date) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

// Formatear fecha y hora
function formatDateTime(date) {
    return formatDate(date) + ' ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// Hacer funciones globales
window.filterBookings = filterBookings;
window.searchBookings = searchBookings;

