/**
 * Funciones para crear mensajes en formato MQ
 */

const utils = require('./utils');

/**
 * Crea un mensaje a partir de las estructuras y datos proporcionados
 * @param {Object} headerStructure - Estructura de la cabecera
 * @param {Object} serviceStructure - Estructura del servicio
 * @param {Object} messageData - Datos del mensaje
 * @param {string} section - Sección a generar ('request' o 'response')
 * @returns {string} Mensaje generado
 */
function createMessage(headerStructure, serviceStructure, messageData, section = 'request') {
    // Validar parámetros
    if (!headerStructure || !serviceStructure || !messageData) {
        console.error('Error: Faltan parámetros requeridos en createMessage');
        return '';
    }
    
    // Obtener la estructura de la sección solicitada
    const sectionStructure = serviceStructure[section];
    if (!sectionStructure) {
        console.error(`Error: No se encontró la sección "${section}" en la estructura del servicio`);
        return '';
    }
    
    // Generar la cabecera
    let message = createHeader(headerStructure, messageData.header || {});
    
    // Generar los datos del servicio
    let serviceData = createServiceData(serviceStructure, messageData.data || {}, section);
    
    // Calcular la longitud total del mensaje
    const headerLength = message.length;
    const serviceLength = serviceData.length;
    const totalLength = headerLength + serviceLength;
    
    // Actualizar la longitud del mensaje en la cabecera
    const lengthField = headerStructure.fields.find(f => f.name === 'LONGITUD DEL MENSAJE');
    
    if (lengthField) {
        const lengthValue = utils.formatValue(totalLength.toString(), lengthField.length, lengthField.type);
        message = lengthValue + message.substring(lengthField.length);
    }
    
    // Devolver el mensaje completo
    return message + serviceData;
}

/**
 * Crea la sección de cabecera de un mensaje
 * @param {Object} headerStructure - Estructura de cabecera con properties totalLength y fields[]
 * @param {Object} values - Valores para los campos de la cabecera
 * @returns {string} Cabecera formateada
 */
function createHeader(headerStructure, values = {}) {
    // Verificar que headerStructure tenga la estructura adecuada
    if (!headerStructure || !headerStructure.fields || !Array.isArray(headerStructure.fields)) {
        console.error("Error: headerStructure no tiene el formato correcto en createHeader");
        throw new Error("La estructura de cabecera no es válida");
    }

    let header = '';
    const today = new Date();
    
    // Valores por defecto basados en la estructura de cabecera definida en header-structure.json
    const defaultValues = {
        'LONGITUD DEL MENSAJE': values.longitudMensaje || values.messageLength || '000000',
        'CANAL': values.canal || values.channel || '01',
        'SERVICIO': values.servicio || values.service || '0000',
        'CÓDIGO DE RETORNO': values.codigoRetorno || values.returnCode || '0000',
        'ID DEL MENSAJE': values.idMensaje || values.messageId || Math.floor(Math.random() * 900000000) + 100000000,
        'FECHA': values.fecha || values.date || `${today.getFullYear()}${utils.padLeft((today.getMonth() + 1), 2, '0')}${utils.padLeft(today.getDate(), 2, '0')}`,
        'HORA': values.hora || values.time || `${utils.padLeft(today.getHours(), 2, '0')}${utils.padLeft(today.getMinutes(), 2, '0')}${utils.padLeft(today.getSeconds(), 2, '0')}`,
        'USUARIO': values.usuario || values.user || 'USER001',
        'Ubicación': values.ubicacion || values.location || '0001',
        'TEXTO DEL CÓDIGO DE RETORNO': values.textoCodigoRetorno || values.returnText || '',
        'ESTADO ENVIADO': values.estadoEnviado || values.sentState || '00',
        'CAMPO COMPLEMENTARIO': values.campoComplementario || values.complementaryField || ''
    };
    
    // Formatear cada campo según su tipo
    for (const field of headerStructure.fields) {
        // Buscar el valor en diferentes formatos posibles (case-insensitive, accent-insensitive)
        let value = undefined;
        const fieldNameLower = field.name.toLowerCase();
        const fieldNameNormalized = fieldNameLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Direct match first
        if (values[field.name] !== undefined) {
            value = values[field.name];
        } else {
            // Try matching provided keys (case-insensitive, accent-insensitive)
            for (const key in values) {
                const keyLower = key.toLowerCase();
                const keyNormalized = keyLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (keyNormalized === fieldNameNormalized) {
                    value = values[key];
                    break;
                }
            }
        }
        
        // If no value found in provided 'values', try default values
        if (value === undefined) {
            // Match default keys (case-insensitive, accent-insensitive)
            for (const defaultKey in defaultValues) {
                const defaultKeyLower = defaultKey.toLowerCase();
                const defaultKeyNormalized = defaultKeyLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (defaultKeyNormalized === fieldNameNormalized) {
                    value = defaultValues[defaultKey];
                    break;
                }
            }
        }

        // If still no value, use default value for field
        if (value === undefined) {
            value = utils.getDefaultValueForField(field);
        }
        
        // Formatear el valor según el tipo de campo
        header += utils.formatValue(value, field.length, field.type);
    }
    
    return header;
}

/**
 * Crea los datos del servicio a partir de la estructura y los datos proporcionados
 * @param {Object} serviceStructure - Estructura del servicio
 * @param {Object} data - Datos para los campos del servicio
 * @param {string} section - Sección a generar ('request' o 'response')
 * @returns {string} Datos del servicio formateados
 */
function createServiceData(serviceStructure, data = {}, section = 'request') {
    let serviceData = '';
    const sectionStructure = serviceStructure[section];

    if (!sectionStructure || !sectionStructure.elements || !Array.isArray(sectionStructure.elements)) {
        console.error(`Error: La estructura de la sección ${section} no es válida`);
        return '';
    }

    const processElements = (elements, dataContext) => {
        let segmentData = '';

        for (const element of elements) {
            if (element.type === 'field') {
                const fieldNameNormalized = element.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
                let value = '';

                for (const key in dataContext) {
                    const keyNormalized = key.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
                    if (keyNormalized === fieldNameNormalized) {
                        value = dataContext[key];
                        break;
                    }
                }

                if (!value || value.trim() === '') {
                    value = utils.getDefaultValueForField(element);
                }

                // Use the field type as defined in the structure
                const fieldType = element.fieldType || element.type;
                
                segmentData += utils.formatValue(value, element.length, fieldType);

            } else if (element.type === 'occurrence') {
                const occurrenceArrayName = `occurrence_${element.index}`;
                const occurrences = dataContext[occurrenceArrayName] || [];
                const occurrenceCount = Math.min(occurrences.length, element.count);

                segmentData += utils.formatValue(occurrenceCount, element.countFieldLength ?? 2, 'number');

                for (let i = 0; i < occurrenceCount; i++) {
                    const occurrence = occurrences[i];
                    for (const field of element.fields) {
                        const fieldNameNormalized = field.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
                        let value = '';

                        for (const key in occurrence) {
                            const keyNormalized = key.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
                            if (keyNormalized === fieldNameNormalized) {
                                value = occurrence[key];
                                break;
                            }
                        }

                        if (!value || value.trim() === '') {
                            value = utils.getDefaultValueForField(field);
                        }

                        // Use the field type as defined in the structure
                        const fieldType = field.fieldType || field.type;
                        
                        segmentData += utils.formatValue(value, field.length, fieldType);
                    }
                }

                const remainingOccurrences = element.count - occurrenceCount;
                if (remainingOccurrences > 0) {
                    const padding = element.fields.map(f => utils.formatValue(utils.getDefaultValueForField(f), f.length, f.fieldType || f.type)).join('');
                    segmentData += padding.repeat(remainingOccurrences);
                }

                if (element.nestedOccurrences && element.nestedOccurrences.length > 0) {
                    segmentData += processElements(element.nestedOccurrences, dataContext);
                }
            }
        }
        return segmentData;
    };

    serviceData = processElements(sectionStructure.elements, data);

    return serviceData;
}

module.exports = {
    createMessage,
    createHeader,
    createServiceData
};
