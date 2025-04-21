/**
 * Utility functions
 */

/**
 * Lee un archivo como texto
 * @param {File} file - Archivo a leer
 * @returns {Promise<string>} Contenido del archivo
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

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
    
    console.log(`formatValue - valor: "${value}", longitud: ${length}, tipo: "${typeStr}", es numérico: ${isNumericType}`);
    
    // Campos numéricos: rellenar con ceros a la izquierda
    if (isNumericType) {
        return padLeft(value, length, '0');
    } 
    // Campos alfanuméricos o cualquier otro tipo: rellenar con espacios a la derecha
    else {
        return padRight(value, length, ' ');
    }
}
