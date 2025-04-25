/**
 * Utility functions for Node.js API
 */

/**
 * Rellena un string con caracteres a la izquierda hasta alcanzar cierta longitud
 * @param {string|number} str - String a rellenar
 * @param {number} len - Longitud deseada
 * @param {string} char - Carácter para rellenar (por defecto '0')
 * @returns {string} String rellenado
 */
function padLeft(str, len, char = '0') {
    str = str.toString();
    return (char.repeat(len) + str).slice(-len);
}

/**
 * Rellena un string con caracteres a la derecha hasta alcanzar cierta longitud
 * @param {string|number} str - String a rellenar
 * @param {number} len - Longitud deseada
 * @param {string} char - Carácter para rellenar (por defecto ' ')
 * @returns {string} String rellenado
 */
function padRight(str, len, char = ' ') {
    str = str.toString();
    return (str + char.repeat(len)).slice(0, len);
}

/**
 * Formatea un valor según el tipo de campo
 * @param {string|number} value - Valor a formatear
 * @param {number} length - Longitud del campo
 * @param {string} type - Tipo de campo
 * @returns {string} Valor formateado
 */
function formatValue(value, length, type) {
    if (value === undefined || value === null) {
        value = '';
    }

    // Convertir a string para asegurar que podemos aplicar los métodos de string
    value = value.toString();

    // Verificar si el tipo es numérico
    const typeStr = (type || '').toLowerCase();
    
    // Solo considerar numérico si el tipo contiene "numerico" o "numeric"
    // pero NO si contiene "alfanumerico" o "alphanumeric"
    const isNumericType = (typeStr.includes('numerico') || typeStr.includes('numeric')) && 
                         !(typeStr.includes('alfanumerico') || typeStr.includes('alphanumeric'));
    
    // Campos numéricos: rellenar con ceros a la izquierda
    if (isNumericType) {
        return padLeft(value, length, '0');
    } 
    // Campos alfanuméricos o cualquier otro tipo: rellenar con espacios a la derecha
    else {
        return padRight(value, length, ' ');
    }
}

/**
 * Obtiene un valor por defecto para un campo según su tipo
 * @param {Object} field - Definición del campo
 * @returns {string} Valor por defecto
 */
function getDefaultValueForField(field) {
    if (!field) {
        return '';
    }
    
    // Si el campo tiene un valor por defecto definido, usarlo
    if (field.defaultValue !== undefined) {
        return field.defaultValue;
    }
    
    const fieldName = field.name.toUpperCase();
    
    // Valores por defecto según el tipo de campo
    switch (fieldName) {
        case 'LONGITUD DEL MENSAJE':
            return '000643';
        case 'CANAL':
            return 'OT';
        case 'SERVICIO':
            return '3050';
        case 'CÓDIGO DE RETORNO':
            return '0000';
        case 'ID DEL MENSAJE':
            return '000000761';
        case 'FECHA':
            return '18092012';
        case 'HORA':
            return '114044';
        case 'USUARIO':
            return 'PASCUAL';
        case 'UBICACIÓN':
            return '1047';
        case 'TEXTO DEL CÓDIGO DE RETORNO':
            return '                                             ';
        case 'ESTADO ENVIADO':
            return '00';
        case 'CAMPO COMPLEMENTARIO':
            return '     ';
        default:
            // Si es un campo numérico, rellenar con ceros
            if ((field.type || '').toLowerCase().includes('numerico')) {
                return '0'.repeat(field.length);
            }
            // Si es un campo alfanumérico, rellenar con espacios
            return ' '.repeat(field.length);
    }
}

module.exports = {
    padLeft,
    padRight,
    formatValue,
    getDefaultValueForField
};
