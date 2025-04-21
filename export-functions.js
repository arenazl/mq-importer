/**
 * Functions for exporting service definitions
 */

/**
 * Exporta las definiciones de estructura a formato JSON
 * @param {Object} headerStructure - Estructura de cabecera
 * @param {Object} serviceStructure - Estructura del servicio
 * @returns {Object} Definiciones en formato JSON
 */
function exportServiceDefinitionToJSON(headerStructure, serviceStructure) {
    return {
        header: headerStructure,
        service: serviceStructure
    };
}

/**
 * Exporta las definiciones de estructura a formato de texto
 * @param {Object} headerStructure - Estructura de cabecera
 * @param {Object} serviceStructure - Estructura del servicio
 * @returns {string} Definiciones en formato de texto legible
 */
function exportServiceDefinitionToText(headerStructure, serviceStructure) {
    let output = '';
    
    // Verificar que las estructuras sean válidas
    if (!headerStructure || !headerStructure.fields || !Array.isArray(headerStructure.fields)) {
        return 'Error: La estructura de cabecera no es válida';
    }
    
    // Sección de cabecera
    output += `=== DEFINICIÓN DE CABECERA ===\n`;
    output += `Longitud total: ${headerStructure.totalLength} posiciones\n\n`;
    
    output += `Campos:\n`;
    for (const field of headerStructure.fields) {
        output += `- ${field.name} (${field.length} posiciones, ${field.type})\n`;
        if (field.required) {
            output += `  Requerido: ${field.required}\n`;
        }
        if (field.values) {
            output += `  Valores permitidos: ${field.values}\n`;
        }
        if (field.description) {
            output += `  Descripción: ${field.description}\n`;
        }
        output += `\n`;
    }
    
    // Sección de servicio
    output += `=== DEFINICIÓN DEL SERVICIO ${serviceStructure.serviceNumber} ===\n`;
    output += `Nombre: ${serviceStructure.serviceName}\n\n`;
    
    // Sección de requerimiento
    output += `== REQUERIMIENTO ==\n`;
    output += `Longitud total: ${serviceStructure.request.totalLength} posiciones\n\n`;
    
    output += `Campos:\n`;
    for (const field of serviceStructure.request.fields) {
        output += `- ${field.name} (${field.length} posiciones, ${field.type})\n`;
        if (field.required) {
            output += `  Requerido: ${field.required}\n`;
        }
        if (field.values) {
            output += `  Valores permitidos: ${field.values}\n`;
        }
        if (field.description) {
            output += `  Descripción: ${field.description}\n`;
        }
        
        // Si este campo precede a una sección de ocurrencias
        const occurrenceSection = serviceStructure.request.occurrenceSections
            .find(os => os.previousField === field.name);
        
        if (occurrenceSection) {
            output += `\n  * SECCIÓN DE OCURRENCIAS (Hasta ${occurrenceSection.count} ocurrencias)\n`;
            output += `    Longitud por ocurrencia: ${occurrenceSection.lengthPerOccurrence} posiciones\n`;
            output += `    Longitud total reservada: ${occurrenceSection.totalLength} posiciones\n\n`;
            
            for (const occField of occurrenceSection.fields) {
                output += `    - ${occField.name} (${occField.length} posiciones, ${occField.type})\n`;
                if (occField.required) {
                    output += `      Requerido: ${occField.required}\n`;
                }
                if (occField.values) {
                    output += `      Valores permitidos: ${occField.values}\n`;
                }
                if (occField.description) {
                    output += `      Descripción: ${occField.description}\n`;
                }
                output += `\n`;
            }
        }
        
        output += `\n`;
    }
    
    // Sección de respuesta
    output += `== RESPUESTA ==\n`;
    output += `Longitud total: ${serviceStructure.response.totalLength} posiciones\n\n`;
    
    output += `Campos:\n`;
    for (const field of serviceStructure.response.fields) {
        output += `- ${field.name} (${field.length} posiciones, ${field.type})\n`;
        if (field.required) {
            output += `  Requerido: ${field.required}\n`;
        }
        if (field.values) {
            output += `  Valores permitidos: ${field.values}\n`;
        }
        if (field.description) {
            output += `  Descripción: ${field.description}\n`;
        }
        
        // Si este campo precede a una sección de ocurrencias
        const occurrenceSection = serviceStructure.response.occurrenceSections
            .find(os => os.previousField === field.name);
        
        if (occurrenceSection) {
            output += `\n  * SECCIÓN DE OCURRENCIAS (Hasta ${occurrenceSection.count} ocurrencias)\n`;
            output += `    Longitud por ocurrencia: ${occurrenceSection.lengthPerOccurrence} posiciones\n`;
            output += `    Longitud total reservada: ${occurrenceSection.totalLength} posiciones\n\n`;
            
            for (const occField of occurrenceSection.fields) {
                output += `    - ${occField.name} (${occField.length} posiciones, ${occField.type})\n`;
                if (occField.required) {
                    output += `      Requerido: ${occField.required}\n`;
                }
                if (occField.values) {
                    output += `      Valores permitidos: ${occField.values}\n`;
                }
                if (occField.description) {
                    output += `      Descripción: ${occField.description}\n`;
                }
                output += `\n`;
            }
        }
        
        output += `\n`;
    }
    
    return output;
}
