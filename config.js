// Configuración de Google API
// IMPORTANTE: Reemplaza estos valores con tus credenciales de Google Cloud Console

const GOOGLE_CONFIG = {
    // Tu Client ID de Google OAuth 2.0
    // Obtén uno en: https://console.cloud.google.com/apis/credentials
    CLIENT_ID: 'TU_CLIENT_ID_AQUI.apps.googleusercontent.com',
    
    // Scopes necesarios para Google Calendar
    SCOPES: 'https://www.googleapis.com/auth/calendar.events',
    
    // ID de tu calendario (opcional, si quieres usar un calendario específico)
    // Deja vacío para usar el calendario principal
    CALENDAR_ID: 'primary'
};

// Función para verificar si la configuración está completa
function checkGoogleConfig() {
    if (!GOOGLE_CONFIG.CLIENT_ID || GOOGLE_CONFIG.CLIENT_ID.includes('TU_CLIENT_ID')) {
        console.warn('⚠️ Por favor configura tu CLIENT_ID de Google en config.js');
        return false;
    }
    return true;
}

