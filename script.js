// Configuración de límites
const PLAN_LIMITS = {
    FREE_TURNS: 60, // Turnos gratis únicos (bono de bienvenida)
    STORAGE_KEY: 'turnero_usage',
    PLAN_KEY: 'turnero_plan', // 'free' o 'paid'
    BOOKINGS_KEY: 'turnero_bookings' // Almacenar turnos reservados
};

// Estado de la aplicación
const state = {
    currentDate: new Date(),
    selectedDate: null,
    selectedTime: null,
    selectedService: null,
    bookingData: {},
    isGoogleAuthenticated: false,
    googleToken: null,
    currentUser: null,
    currentPlan: 'free', // 'free' o 'paid'
    turnsUsed: 0,
    turnsLimit: PLAN_LIMITS.FREE_TURNS
};

// Días de la semana
const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Horarios disponibles (puedes personalizar estos)
const availableHours = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initUsageTracking();
    initCalendar();
    initEventListeners();
    updatePlanUI();
    loadMyBookings(); // Cargar turnos reservados
    
    // Inicializar Google Auth cuando las APIs estén listas
    if (typeof google !== 'undefined' && google.accounts) {
        initGoogleAuth();
    } else {
        // Esperar a que Google API se cargue
        window.addEventListener('load', () => {
            if (typeof google !== 'undefined' && google.accounts) {
                initGoogleAuth();
            } else {
                console.warn('Google API no disponible. Verifica que los scripts estén cargados.');
            }
        });
    }
});

// Inicializar calendario
function initCalendar() {
    renderCalendar();
    updateMonthDisplay();
}

// Renderizar calendario
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Agregar encabezados de días
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Días del mes anterior
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day disabled';
        day.textContent = daysInPrevMonth - i;
        calendarGrid.appendChild(day);
    }

    // Días del mes actual
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const date = new Date(year, month, day);
        
        // Marcar hoy
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Deshabilitar fechas pasadas
        if (date < today) {
            dayElement.classList.add('disabled');
        } else {
            dayElement.addEventListener('click', () => selectDate(date));
        }
        
        // Marcar fecha seleccionada
        if (state.selectedDate && date.toDateString() === state.selectedDate.toDateString()) {
            dayElement.classList.add('selected');
        }
        
        calendarGrid.appendChild(dayElement);
    }

    // Días del mes siguiente para completar la grilla
    const totalCells = calendarGrid.children.length;
    const remainingCells = 42 - totalCells; // 6 semanas * 7 días
    
    for (let day = 1; day <= remainingCells && day <= 14; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day disabled';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    }
}

// Actualizar display del mes
function updateMonthDisplay() {
    const monthYear = `${months[state.currentDate.getMonth()]} ${state.currentDate.getFullYear()}`;
    document.getElementById('currentMonth').textContent = monthYear;
}

// Seleccionar fecha
function selectDate(date) {
    state.selectedDate = date;
    renderCalendar();
    updateSummary();
    setTimeout(() => {
        showStep(2);
        renderTimeSlots();
    }, 300);
}

// Renderizar horarios disponibles
function renderTimeSlots() {
    const timeSlotsContainer = document.getElementById('timeSlots');
    timeSlotsContainer.innerHTML = '';

    // Simular algunos horarios ocupados (en producción vendría del servidor)
    const bookedSlots = getBookedSlots(state.selectedDate);

    availableHours.forEach(hour => {
        const slot = document.createElement('div');
        slot.className = 'time-slot';
        slot.textContent = hour;
        
        if (bookedSlots.includes(hour)) {
            slot.classList.add('disabled');
            slot.textContent += ' (Ocupado)';
        } else {
            slot.addEventListener('click', () => selectTime(hour));
        }
        
        if (state.selectedTime === hour) {
            slot.classList.add('selected');
        }
        
        timeSlotsContainer.appendChild(slot);
    });
}

// Obtener horarios ocupados (simulado)
function getBookedSlots(date) {
    // En producción, esto haría una llamada al servidor
    // Por ahora, simulamos algunos horarios ocupados
    const dateStr = date.toDateString();
    const booked = {
        // Ejemplo: algunos horarios ocupados para hoy
    };
    return booked[dateStr] || [];
}

// Seleccionar horario
function selectTime(time) {
    state.selectedTime = time;
    renderTimeSlots();
    updateSummary();
    setTimeout(() => {
        showStep(3);
    }, 300);
}

// Mostrar paso específico
function showStep(stepNumber) {
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.toggle('active', index + 1 === stepNumber);
    });
}

// Inicializar event listeners
function initEventListeners() {
    // Navegación del calendario
    document.getElementById('prevMonth').addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        renderCalendar();
        updateMonthDisplay();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        renderCalendar();
        updateMonthDisplay();
    });

    // Botón atrás en formulario
    document.getElementById('backToTime').addEventListener('click', () => {
        showStep(2);
    });

    // Formulario de reserva
    document.getElementById('bookingForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleBookingSubmit();
    });

    // Nuevo turno
    document.getElementById('newBooking').addEventListener('click', () => {
        resetBooking();
    });

    // Cerrar sesión de Google
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', handleSignOut);
    }

    // Botón de actualizar plan
    const upgradeBtn = document.getElementById('upgrade-plan-btn');
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', upgradeToPaidPlan);
    }
}

// Manejar envío del formulario
async function handleBookingSubmit() {
    // Verificar límite de turnos antes de confirmar
    if (!canCreateTurn()) {
        showLimitReachedModal();
        return;
    }

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        service: document.getElementById('service').value,
        notes: document.getElementById('notes').value,
        date: state.selectedDate,
        time: state.selectedTime
    };

    state.bookingData = formData;
    state.selectedService = formData.service;

    // Incrementar contador de turnos
    incrementTurnCount();

    // Generar ID único para el turno
    const bookingId = generateBookingId();
    let calendarEventId = null;

    // Si está autenticado con Google, crear evento en el calendario
    if (state.isGoogleAuthenticated) {
        try {
            const calendarEvent = await createGoogleCalendarEvent(formData);
            calendarEventId = calendarEvent.id;
            showConfirmation(true, bookingId);
        } catch (error) {
            console.error('Error al crear evento en Google Calendar:', error);
            // Mostrar confirmación aunque falle el calendario
            showConfirmation(false, bookingId);
            alert('El turno se registró, pero hubo un problema al agregarlo al calendario. Por favor, agrégalo manualmente.');
        }
    } else {
        // Sin autenticación, solo mostrar confirmación
        showConfirmation(false, bookingId);
    }

    // Guardar el turno en el almacenamiento
    saveBooking({
        id: bookingId,
        ...formData,
        calendarEventId: calendarEventId,
        createdAt: new Date().toISOString(),
        status: 'active'
    });
    
    updateSummary();
    updatePlanUI();
    loadMyBookings(); // Actualizar lista de turnos
}

// Mostrar confirmación
function showConfirmation(calendarSuccess = false, bookingId = null) {
    showStep(4);
    
    const details = document.getElementById('bookingDetails');
    const serviceNames = {
        'consulta': 'Consulta',
        'tratamiento': 'Tratamiento',
        'seguimiento': 'Seguimiento'
    };

    const dateStr = formatDate(state.selectedDate);
    const serviceName = serviceNames[state.selectedService] || state.selectedService;

    const calendarStatus = calendarSuccess 
        ? '<div style="color: var(--success-color); margin-top: 15px; font-weight: 600;">✓ Evento agregado a Google Calendar</div>'
        : state.isGoogleAuthenticated 
            ? '<div style="color: #f59e0b; margin-top: 15px;">⚠ No se pudo agregar al calendario</div>'
            : '<div style="color: var(--text-light); margin-top: 15px; font-size: 0.9rem;">💡 Inicia sesión con Google para agregar eventos automáticamente</div>';

    const bookingIdInfo = bookingId 
        ? `<div style="margin-top: 15px; padding: 10px; background: var(--bg-light); border-radius: 8px;">
            <strong>ID de Turno:</strong> <code style="font-size: 0.85rem; background: var(--white); padding: 4px 8px; border-radius: 4px;">${bookingId}</code><br>
            <small style="color: var(--text-light);">Guarda este ID para cancelar tu turno si es necesario</small>
           </div>`
        : '';

    details.innerHTML = `
        <div>
            <strong>Nombre:</strong>
            <span>${state.bookingData.name}</span>
        </div>
        <div>
            <strong>Email:</strong>
            <span>${state.bookingData.email}</span>
        </div>
        <div>
            <strong>Teléfono:</strong>
            <span>${state.bookingData.phone}</span>
        </div>
        <div>
            <strong>Fecha:</strong>
            <span>${dateStr}</span>
        </div>
        <div>
            <strong>Hora:</strong>
            <span>${state.selectedTime}</span>
        </div>
        <div>
            <strong>Servicio:</strong>
            <span>${serviceName}</span>
        </div>
        ${state.bookingData.notes ? `
        <div>
            <strong>Notas:</strong>
            <span>${state.bookingData.notes}</span>
        </div>
        ` : ''}
        ${calendarStatus}
        ${bookingIdInfo}
    `;
}

// Formatear fecha
function formatDate(date) {
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} de ${month} de ${year}`;
}

// Actualizar resumen
function updateSummary() {
    if (state.selectedDate) {
        document.getElementById('summaryDate').textContent = formatDate(state.selectedDate);
    }
    
    if (state.selectedTime) {
        document.getElementById('summaryTime').textContent = state.selectedTime;
    }
    
    if (state.selectedService) {
        const serviceNames = {
            'consulta': 'Consulta',
            'tratamiento': 'Tratamiento',
            'seguimiento': 'Seguimiento'
        };
        document.getElementById('summaryService').textContent = 
            serviceNames[state.selectedService] || state.selectedService;
    }
}

// Resetear reserva
function resetBooking() {
    state.selectedDate = null;
    state.selectedTime = null;
    state.selectedService = null;
    state.bookingData = {};
    
    document.getElementById('bookingForm').reset();
    document.getElementById('summaryDate').textContent = '-';
    document.getElementById('summaryTime').textContent = '-';
    document.getElementById('summaryService').textContent = '-';
    
    renderCalendar();
    showStep(1);
}

// ==================== GOOGLE AUTHENTICATION ====================

// Inicializar autenticación de Google
function initGoogleAuth() {
    if (!checkGoogleConfig()) {
        console.warn('⚠️ Configuración de Google no completada. Edita config.js con tu CLIENT_ID');
        // Ocultar el botón si no hay configuración
        const container = document.getElementById('google-auth-container');
        if (container) {
            container.style.display = 'none';
        }
        return;
    }

    try {
        // Configurar el botón de Google Sign-In
        google.accounts.id.initialize({
            client_id: GOOGLE_CONFIG.CLIENT_ID,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true
        });

        // Renderizar el botón
        google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            {
                theme: 'outline',
                size: 'large',
                type: 'standard',
                text: 'sign_in_with',
                shape: 'rectangular',
                logo_alignment: 'left'
            }
        );

        // Verificar si ya hay una sesión activa
        checkExistingSession();
    } catch (error) {
        console.error('Error al inicializar Google Auth:', error);
    }
}

// Manejar inicio de sesión con Google
async function handleGoogleSignIn(response) {
    try {
        // Decodificar el token JWT
        const payload = parseJwt(response.credential);
        
        state.currentUser = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture
        };

        // Obtener token de acceso para Google Calendar API
        await getGoogleAccessToken();
        
        // Actualizar UI
        updateAuthUI(true);
        
        console.log('Autenticación exitosa:', state.currentUser);
    } catch (error) {
        console.error('Error en autenticación:', error);
        alert('Error al iniciar sesión con Google. Por favor, intenta nuevamente.');
    }
}

// Obtener token de acceso para Google Calendar
async function getGoogleAccessToken() {
    return new Promise((resolve, reject) => {
        try {
            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CONFIG.CLIENT_ID,
                scope: GOOGLE_CONFIG.SCOPES,
                callback: (response) => {
                    if (response.access_token) {
                        state.googleToken = response.access_token;
                        state.isGoogleAuthenticated = true;
                        resolve(response.access_token);
                    } else {
                        reject(new Error('No se pudo obtener el token de acceso'));
                    }
                },
                error_callback: (error) => {
                    console.error('Error al obtener token:', error);
                    reject(error);
                }
            });
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (error) {
            reject(error);
        }
    });
}

// Verificar sesión existente
function checkExistingSession() {
    // Esto verificaría si hay una sesión guardada
    // Por ahora, dejamos que el usuario inicie sesión manualmente
}

// Actualizar UI de autenticación
function updateAuthUI(isAuthenticated) {
    const signInButton = document.getElementById('google-signin-button');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');

    if (isAuthenticated && state.currentUser) {
        signInButton.style.display = 'none';
        userInfo.style.display = 'flex';
        userName.textContent = `Hola, ${state.currentUser.name}`;
    } else {
        signInButton.style.display = 'block';
        userInfo.style.display = 'none';
    }
}

// Cerrar sesión
function handleSignOut() {
    if (state.googleToken && typeof google !== 'undefined' && google.accounts) {
        google.accounts.oauth2.revoke(state.googleToken, () => {
            console.log('Sesión cerrada');
        });
    }

    state.isGoogleAuthenticated = false;
    state.googleToken = null;
    state.currentUser = null;

    updateAuthUI(false);
    
    // Reiniciar el botón de Google
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }
}

// Decodificar JWT
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// ==================== GOOGLE CALENDAR API ====================

// Crear evento en Google Calendar
async function createGoogleCalendarEvent(bookingData) {
    if (!state.isGoogleAuthenticated || !state.googleToken) {
        throw new Error('No autenticado con Google');
    }

    // Crear fecha de inicio y fin del evento
    const [hours, minutes] = bookingData.time.split(':');
    const startDate = new Date(bookingData.date);
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1); // Duración de 1 hora por defecto

    // Formatear fechas en formato ISO 8601
    const startDateTime = startDate.toISOString();
    const endDateTime = endDate.toISOString();

    const serviceNames = {
        'consulta': 'Consulta',
        'tratamiento': 'Tratamiento',
        'seguimiento': 'Seguimiento'
    };

    const serviceName = serviceNames[bookingData.service] || bookingData.service;

    // Crear el evento
    const event = {
        summary: `${serviceName} - ${bookingData.name}`,
        description: `
Cliente: ${bookingData.name}
Email: ${bookingData.email}
Teléfono: ${bookingData.phone}
Servicio: ${serviceName}
${bookingData.notes ? `Notas: ${bookingData.notes}` : ''}
        `.trim(),
        start: {
            dateTime: startDateTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
            dateTime: endDateTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: [
            { email: bookingData.email }
        ],
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 24 * 60 }, // 1 día antes
                { method: 'popup', minutes: 60 } // 1 hora antes
            ]
        }
    };

    // Hacer la petición a Google Calendar API
    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${GOOGLE_CONFIG.CALENDAR_ID}/events`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.googleToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Error al crear el evento');
    }

    const createdEvent = await response.json();
    console.log('Evento creado en Google Calendar:', createdEvent);
    return createdEvent;
}

// ==================== SISTEMA DE LÍMITES DE TURNOS ====================

// Inicializar tracking de uso
function initUsageTracking() {
    const usageData = getUsageData();
    
    // Cargar contador de turnos usados (sin reset mensual)
    state.turnsUsed = usageData.count || 0;
    
    // Cargar plan actual
    const savedPlan = localStorage.getItem(PLAN_LIMITS.PLAN_KEY);
    if (savedPlan === 'paid') {
        state.currentPlan = 'paid';
        state.turnsLimit = Infinity; // Sin límite para plan de pago
    } else {
        state.currentPlan = 'free';
        state.turnsLimit = PLAN_LIMITS.FREE_TURNS;
    }
}

// Obtener datos de uso desde localStorage
function getUsageData() {
    try {
        const data = localStorage.getItem(PLAN_LIMITS.STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Mantener compatibilidad con formato antiguo, pero ya no usamos month/year
            return {
                count: parsed.count || 0
            };
        }
    } catch (error) {
        console.error('Error al leer datos de uso:', error);
    }
    
    // Datos por defecto
    return {
        count: 0
    };
}

// Guardar datos de uso en localStorage
function saveUsageData(data) {
    try {
        localStorage.setItem(PLAN_LIMITS.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error al guardar datos de uso:', error);
    }
}

// Nota: Ya no hay reset mensual. Los 60 turnos son un bono único.

// Incrementar contador de turnos (bono único, no se resetea)
function incrementTurnCount() {
    const usageData = getUsageData();
    usageData.count = (usageData.count || 0) + 1;
    saveUsageData(usageData);
    state.turnsUsed = usageData.count;
    
    // Si alcanzó el límite de turnos gratis, sugerir actualizar
    if (state.currentPlan === 'free' && state.turnsUsed >= PLAN_LIMITS.FREE_TURNS) {
        console.log('⚠️ Bono de 60 turnos agotado. Se requiere plan de pago para continuar.');
    }
}

// Verificar si se puede crear un turno
function canCreateTurn() {
    if (state.currentPlan === 'paid') {
        return true; // Sin límite para plan de pago
    }
    return state.turnsUsed < state.turnsLimit;
}

// Obtener turnos restantes
function getRemainingTurns() {
    if (state.currentPlan === 'paid') {
        return 'Ilimitados';
    }
    const remaining = Math.max(0, state.turnsLimit - state.turnsUsed);
    return remaining;
}

// Actualizar UI del plan
function updatePlanUI() {
    const planStatus = document.getElementById('plan-status');
    const turnsRemaining = document.getElementById('turns-remaining');
    const upgradeBtn = document.getElementById('upgrade-plan-btn');
    
    if (!planStatus) return;
    
    if (state.currentPlan === 'paid') {
        planStatus.textContent = 'Plan Premium';
        planStatus.className = 'plan-status plan-paid';
        if (turnsRemaining) {
            turnsRemaining.textContent = 'Turnos ilimitados';
        }
        if (upgradeBtn) {
            upgradeBtn.style.display = 'none';
        }
    } else {
        planStatus.textContent = 'Plan Gratuito';
        planStatus.className = 'plan-status plan-free';
        const remaining = getRemainingTurns();
        
        if (turnsRemaining) {
            if (remaining === 0) {
                turnsRemaining.textContent = 'Bono agotado - Actualiza a Premium';
                turnsRemaining.className = 'turns-remaining turns-danger';
            } else {
                turnsRemaining.textContent = `${remaining} de ${state.turnsLimit} turnos del bono restantes`;
                
                // Cambiar color si quedan pocos turnos
                if (remaining <= 10) {
                    turnsRemaining.className = 'turns-remaining turns-warning';
                } else {
                    turnsRemaining.className = 'turns-remaining';
                }
            }
        }
        
        if (upgradeBtn) {
            upgradeBtn.style.display = 'block';
        }
    }
}

// Mostrar modal cuando se alcanza el límite
function showLimitReachedModal() {
    const modal = document.getElementById('limit-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Cerrar modal de límite
function closeLimitModal() {
    const modal = document.getElementById('limit-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Actualizar a plan de pago (placeholder - aquí integrarías con tu sistema de pago)
function upgradeToPaidPlan() {
    // TODO: Integrar con sistema de pago (Stripe, PayPal, etc.)
    // Por ahora, simulamos la actualización
    if (confirm('¿Deseas actualizar a Plan Premium? Esto te dará turnos ilimitados.')) {
        state.currentPlan = 'paid';
        state.turnsLimit = Infinity;
        localStorage.setItem(PLAN_LIMITS.PLAN_KEY, 'paid');
        updatePlanUI();
        closeLimitModal();
        alert('¡Plan Premium activado! Ahora tienes turnos ilimitados.');
    }
}

// ==================== SISTEMA DE GESTIÓN DE TURNOS ====================

// Generar ID único para turno
function generateBookingId() {
    return 'TURN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Guardar turno en localStorage
function saveBooking(booking) {
    try {
        const bookings = getBookings();
        bookings.push(booking);
        localStorage.setItem(PLAN_LIMITS.BOOKINGS_KEY, JSON.stringify(bookings));
    } catch (error) {
        console.error('Error al guardar turno:', error);
    }
}

// Obtener todos los turnos
function getBookings() {
    try {
        const data = localStorage.getItem(PLAN_LIMITS.BOOKINGS_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error al leer turnos:', error);
    }
    return [];
}

// Obtener turnos activos (no cancelados y futuros)
function getActiveBookings() {
    const bookings = getBookings();
    const now = new Date();
    return bookings.filter(booking => {
        if (booking.status !== 'active') return false;
        const bookingDate = new Date(booking.date);
        const [hours, minutes] = booking.time.split(':');
        bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return bookingDate >= now;
    }).sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateA - dateB;
    });
}

// Cargar y mostrar turnos reservados
function loadMyBookings() {
    const bookingsContainer = document.getElementById('my-bookings-list');
    if (!bookingsContainer) return;

    const activeBookings = getActiveBookings();

    if (activeBookings.length === 0) {
        bookingsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">No tienes turnos reservados</p>';
        return;
    }

    bookingsContainer.innerHTML = activeBookings.map(booking => {
        const dateStr = formatDate(new Date(booking.date));
        const serviceNames = {
            'consulta': 'Consulta',
            'tratamiento': 'Tratamiento',
            'seguimiento': 'Seguimiento'
        };
        const serviceName = serviceNames[booking.service] || booking.service;

        return `
            <div class="booking-item" data-booking-id="${booking.id}">
                <div class="booking-info">
                    <div class="booking-header">
                        <strong>${serviceName}</strong>
                        <span class="booking-id">ID: ${booking.id}</span>
                    </div>
                    <div class="booking-details-item">
                        <span class="booking-label">📅 Fecha:</span>
                        <span>${dateStr}</span>
                    </div>
                    <div class="booking-details-item">
                        <span class="booking-label">⏰ Hora:</span>
                        <span>${booking.time}</span>
                    </div>
                    <div class="booking-details-item">
                        <span class="booking-label">👤 Cliente:</span>
                        <span>${booking.name}</span>
                    </div>
                    <div class="booking-details-item">
                        <span class="booking-label">📧 Email:</span>
                        <span>${booking.email}</span>
                    </div>
                    ${booking.notes ? `
                    <div class="booking-details-item">
                        <span class="booking-label">📝 Notas:</span>
                        <span>${booking.notes}</span>
                    </div>
                    ` : ''}
                </div>
                <button class="btn-cancel-booking" onclick="cancelBooking('${booking.id}')">
                    Cancelar Turno
                </button>
            </div>
        `;
    }).join('');
}

// Cancelar turno
async function cancelBooking(bookingId) {
    if (!confirm('¿Estás seguro de que deseas cancelar este turno?')) {
        return;
    }

    const bookings = getBookings();
    const booking = bookings.find(b => b.id === bookingId);

    if (!booking) {
        alert('Turno no encontrado');
        return;
    }

    // Si tiene evento en Google Calendar, eliminarlo
    if (booking.calendarEventId && state.isGoogleAuthenticated && state.googleToken) {
        try {
            await deleteGoogleCalendarEvent(booking.calendarEventId);
            console.log('✅ Evento eliminado de Google Calendar');
        } catch (error) {
            console.error('Error al eliminar evento de Google Calendar:', error);
            // Continuar con la cancelación aunque falle la eliminación del evento
        }
    }

    // Marcar turno como cancelado
    const updatedBookings = bookings.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled', cancelledAt: new Date().toISOString() } : b
    );
    localStorage.setItem(PLAN_LIMITS.BOOKINGS_KEY, JSON.stringify(updatedBookings));

    // Notificar al emprendedor (por ahora en consola, en producción sería email)
    notifyEntrepreneur(booking, 'cancelled');

    // Actualizar UI
    loadMyBookings();
    alert('Turno cancelado exitosamente. El emprendedor ha sido notificado.');

    // Si el turno estaba en Google Calendar, ya fue eliminado automáticamente
    if (booking.calendarEventId) {
        console.log('El evento también fue eliminado del calendario del emprendedor.');
    }
}

// Eliminar evento de Google Calendar
async function deleteGoogleCalendarEvent(eventId) {
    if (!state.isGoogleAuthenticated || !state.googleToken) {
        throw new Error('No autenticado con Google');
    }

    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${GOOGLE_CONFIG.CALENDAR_ID}/events/${eventId}`,
        {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.googleToken}`
            }
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Error desconocido' } }));
        throw new Error(error.error?.message || 'Error al eliminar el evento');
    }

    return true;
}

// Notificar al emprendedor (placeholder - en producción sería email/notificación real)
function notifyEntrepreneur(booking, action) {
    const message = action === 'cancelled' 
        ? `⚠️ TURNO CANCELADO\n\nCliente: ${booking.name}\nEmail: ${booking.email}\nTeléfono: ${booking.phone}\nFecha: ${formatDate(new Date(booking.date))}\nHora: ${booking.time}\nServicio: ${booking.service}\nID: ${booking.id}`
        : `✅ NUEVO TURNO\n\nCliente: ${booking.name}\nEmail: ${booking.email}\nTeléfono: ${booking.phone}\nFecha: ${formatDate(new Date(booking.date))}\nHora: ${booking.time}\nServicio: ${booking.service}\nID: ${booking.id}`;

    console.log('📧 NOTIFICACIÓN AL EMPRENDEDOR:');
    console.log(message);
    
    // TODO: En producción, enviar email o notificación push aquí
    // Ejemplo:
    // await fetch('/api/notify-entrepreneur', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ booking, action, message })
    // });
}

// Hacer funciones globales para el onclick del HTML
window.closeLimitModal = closeLimitModal;
window.upgradeToPaidPlan = upgradeToPaidPlan;
window.cancelBooking = cancelBooking;

