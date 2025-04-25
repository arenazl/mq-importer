/**
 * Funciones para analizar mensajes en formato MQ
 */

const utils = require('./utils');

/**
 * Analiza un mensaje según las definiciones de estructura
 * @param {string} message - Mensaje a analizar
 * @param {Object} headerStructure - Definición de campos de cabecera
 * @param {Object} serviceStructure - Estructura del servicio
 * @returns {Object} Mensaje analizado en formato estructurado { header: { ... }, data: { ... }, section: 'request'|'response' }
 */
function parseMessage(message, headerStructure, serviceStructure) {
    const result = {
        header: {},
        data: {},
        section: 'request' // Default to request
    };
    
    // Verificar que las estructuras sean válidas
    if (!headerStructure || !headerStructure.fields || !Array.isArray(headerStructure.fields)) {
        console.error('Error: La estructura de cabecera no es válida en parseMessage');
        return result;
    }
    
    // Parsear cabecera
    let position = 0;
    const headerLength = headerStructure.fields.reduce((sum, field) => sum + field.length, 0);

    if (message.length < headerLength) {
        console.error(`Error parsing message: Message length (${message.length}) is less than header definition length (${headerLength}).`);
        return result; 
    }

    for (const field of headerStructure.fields) {
        const value = message.substring(position, position + field.length);
        result.header[field.name] = value.trim();
        position += field.length;
    }
    
    // Determinar si es una solicitud o respuesta basado en campos de cabecera
    let returnCode = '0000';
    let sentState = '00';
    for (const key in result.header) {
        const keyLower = key.toLowerCase();
        const keyNormalized = keyLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (keyNormalized === 'codigo de retorno') {
            returnCode = result.header[key].trim();
        } else if (keyNormalized === 'estado enviado') {
            sentState = result.header[key].trim();
        }
    }

    const isResponse = sentState !== '00' || returnCode !== '0000';
    result.section = isResponse ? 'response' : 'request';
    const sectionStructure = serviceStructure[result.section];

    // Si no hay estructura de sección, devolver solo la cabecera
    if (!sectionStructure || !sectionStructure.elements) {
        console.warn(`No se encontró estructura para la sección ${result.section}`);
        return result;
    }

    // Parsear datos del servicio
    const serviceDataString = message.substring(position);
    parseServiceData(serviceDataString, sectionStructure, result.data);
    
    return result;
}

/**
 * Parsea los datos del servicio según la estructura proporcionada
 * @param {string} serviceDataString - String con los datos del servicio
 * @param {Object} sectionStructure - Estructura de la sección (request o response)
 * @param {Object} resultData - Objeto donde se almacenarán los datos parseados
 */
function parseServiceData(serviceDataString, sectionStructure, resultData) {
    let position = 0;
    
    // Función recursiva para procesar elementos
    const processElements = (elements, dataContext, remainingData) => {
        let currentPosition = 0;
        
        for (const element of elements) {
            // Si ya no hay más datos para procesar, salir
            if (currentPosition >= remainingData.length) {
                break;
            }
            
            if (element.type === 'field') {
                // Verificar si hay suficientes datos para este campo
                if (currentPosition + element.length > remainingData.length) {
                    console.warn(`Campo ${element.name} excede la longitud de datos restantes`);
                    break;
                }
                
                // Extraer el valor del campo
                const value = remainingData.substring(currentPosition, currentPosition + element.length);
                dataContext[element.name] = value.trim();
                currentPosition += element.length;
                
            } else if (element.type === 'occurrence') {
                // Obtener el contador de ocurrencias (asumimos que está en los primeros 2 caracteres)
                const countFieldLength = element.countFieldLength || 2;
                
                // Verificar si hay suficientes datos para el contador
                if (currentPosition + countFieldLength > remainingData.length) {
                    console.warn(`Contador de ocurrencias para ${element.name || 'ocurrencia'} excede la longitud de datos restantes`);
                    break;
                }
                
                // Extraer el contador
                const countStr = remainingData.substring(currentPosition, currentPosition + countFieldLength);
                const count = parseInt(countStr, 10) || 0;
                currentPosition += countFieldLength;
                
                // Crear array para las ocurrencias
                const occurrenceName = `occurrence_${element.index}`;
                dataContext[occurrenceName] = [];
                
                // Calcular la longitud de una ocurrencia
                const occurrenceLength = element.fields.reduce((sum, field) => sum + field.length, 0);
                
                // Procesar cada ocurrencia
                for (let i = 0; i < count; i++) {
                    // Verificar si hay suficientes datos para esta ocurrencia
                    if (currentPosition + occurrenceLength > remainingData.length) {
                        console.warn(`Ocurrencia ${i+1} excede la longitud de datos restantes`);
                        break;
                    }
                    
                    // Crear objeto para esta ocurrencia
                    const occurrenceData = {};
                    
                    // Extraer los campos de la ocurrencia
                    for (const field of element.fields) {
                        // Verificar si hay suficientes datos para este campo
                        if (currentPosition + field.length > remainingData.length) {
                            console.warn(`Campo ${field.name} en ocurrencia ${i+1} excede la longitud de datos restantes`);
                            break;
                        }
                        
                        // Extraer el valor del campo
                        const value = remainingData.substring(currentPosition, currentPosition + field.length);
                        occurrenceData[field.name] = value.trim();
                        currentPosition += field.length;
                    }
                    
                    // Agregar la ocurrencia al array
                    dataContext[occurrenceName].push(occurrenceData);
                }
                
                // Saltar las ocurrencias restantes (si las hay)
                const remainingOccurrences = (element.count || 0) - count;
                if (remainingOccurrences > 0) {
                    const skipLength = remainingOccurrences * occurrenceLength;
                    
                    // Verificar si hay suficientes datos para saltar
                    if (currentPosition + skipLength <= remainingData.length) {
                        currentPosition += skipLength;
                    } else {
                        console.warn(`No hay suficientes datos para saltar las ocurrencias restantes`);
                        currentPosition = remainingData.length; // Avanzar hasta el final
                    }
                }
            }
        }
        
        return currentPosition;
    };
    
    // Procesar los elementos de la sección
    processElements(sectionStructure.elements, resultData, serviceDataString);
}

module.exports = {
    parseMessage
};
