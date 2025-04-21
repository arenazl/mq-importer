/**
 * Functions for analyzing messages
 */

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
        result.header[field.name] = value;
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

    // Parsear datos del servicio
    const serviceDataString = message.substring(position);
    let servicePosition = 0;

    // Keep track of processed occurrence sections during parsing
    const parsedOccurrenceSections = new Set();

    for (const field of sectionStructure.fields) {
        // Check if field length exceeds remaining message data
        if (servicePosition + field.length > serviceDataString.length) {
            console.warn(`Parsing warning: Field ${field.name} definition exceeds remaining message data. Truncating.`);
            result.data[field.name] = serviceDataString.substring(servicePosition).trim();
            servicePosition = serviceDataString.length; // Move position to end
            break; // Stop parsing this section
        }

        const value = serviceDataString.substring(servicePosition, servicePosition + field.length);
        result.data[field.name] = value.trim(); // Trim the value when storing
        servicePosition += field.length;

        // Check if this field precedes an occurrence section
        const occurrenceSection = sectionStructure.occurrenceSections
            .find(os => os.previousField === field.name);

        if (occurrenceSection) {
            const count = parseInt(result.data[field.name]) || 0; // Get count from the field we just parsed
            const occurrenceArrayName = field.name.toLowerCase() + '_occurrences';
            result.data[occurrenceArrayName] = [];

            // Parse each occurrence
            for (let i = 0; i < count; i++) {
                const occurrenceData = {};
                let currentOccurrenceLength = 0;

                for (const occField of occurrenceSection.fields) {
                    if (servicePosition + occField.length > serviceDataString.length) {
                        console.warn(`Parsing warning: Occurrence field ${occField.name} (in ${field.name}) definition exceeds remaining message data. Truncating.`);
                        occurrenceData[occField.name] = serviceDataString.substring(servicePosition).trim();
                        servicePosition = serviceDataString.length; 
                        currentOccurrenceLength = serviceDataString.length - (servicePosition - occField.length); // Adjust length
                        break; // Stop parsing this occurrence
                    }

                    const occValue = serviceDataString.substring(servicePosition, servicePosition + occField.length);
                    occurrenceData[occField.name] = occValue.trim();
                    servicePosition += occField.length;
                    currentOccurrenceLength += occField.length;
                }
                result.data[occurrenceArrayName].push(occurrenceData);

                // Check if the parsed length matches the definition per occurrence
                if (occurrenceSection.lengthPerOccurrence && currentOccurrenceLength !== occurrenceSection.lengthPerOccurrence) {
                    console.warn(`Parsing warning: Occurrence #${i+1} for ${field.name} parsed length (${currentOccurrenceLength}) doesn't match definition (${occurrenceSection.lengthPerOccurrence}).`);
                }
                if (servicePosition > serviceDataString.length) break; // Break outer loop if truncated
            }

            // Skip padding for remaining occurrences
            const remainingOccurrences = occurrenceSection.count - count;
            if (remainingOccurrences > 0 && occurrenceSection.lengthPerOccurrence) {
                const skipLength = remainingOccurrences * occurrenceSection.lengthPerOccurrence;
                if (servicePosition + skipLength > serviceDataString.length) {
                    console.warn(`Parsing warning: Skipping remaining occurrences for ${field.name} exceeds message length.`);
                    servicePosition = serviceDataString.length;
                } else {
                    servicePosition += skipLength;
                }
            }
            parsedOccurrenceSections.add(occurrenceSection.previousField);
        }
        if (servicePosition >= serviceDataString.length) break; // Stop if we've parsed the whole service data part
    }

    return result;
}

/**
 * Muestra la estructura de un mensaje en formato legible, incluyendo todas las ocurrencias
 * con un diseño optimizado para mostrar cada campo en una sola línea
 * @param {string} message - Mensaje a analizar
 * @param {Object} serviceStructure - Estructura del servicio
 * @returns {string} Descripción legible de la estructura del mensaje
 */
// Función para obtener un valor por defecto para un campo
function getDefaultValueForField(field) {
  // Si el campo tiene un valor por defecto definido, usarlo
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }
  
  const today = new Date();
  const fieldName = field.name.toUpperCase();
  
  // Valores por defecto según el tipo de campo
  switch (fieldName) {
    case 'LONGITUD DEL MENSAJE':
      return '000643'; // Valor proporcionado por el usuario
    case 'CANAL':
      return 'OT'; // Valor proporcionado por el usuario
    case 'SERVICIO':
      return '3050'; // Valor proporcionado por el usuario
    case 'CÓDIGO DE RETORNO':
      return '0000'; // Valor proporcionado por el usuario
    case 'ID DEL MENSAJE':
      return '000000761'; // Valor proporcionado por el usuario
    case 'FECHA':
      return '18092012'; // Valor proporcionado por el usuario
    case 'HORA':
      return '114044'; // Valor proporcionado por el usuario
    case 'USUARIO':
      return 'PASCUAL'; // Valor proporcionado por el usuario
    case 'UBICACIÓN':
      return '1047'; // Valor proporcionado por el usuario
    case 'TEXTO DEL CÓDIGO DE RETORNO':
      return '                                             '; // Valor proporcionado por el usuario
    case 'ESTADO ENVIADO':
      return '00'; // Valor proporcionado por el usuario
    case 'CAMPO COMPLEMENTARIO':
      return '     '; // Campo complementario con 5 espacios en blanco
    default:
      // Si es un campo numérico, rellenar con ceros
      if ((field.type || '').toLowerCase().includes('numerico')) {
        return '0'.repeat(field.length);
      }
      // Si es un campo alfanumérico, rellenar con espacios
      return ' '.repeat(field.length);
  }
}

// Función para reorganizar la estructura JSON para que las ocurrencias anidadas estén dentro de sus padres
function reorganizeJsonStructure(structure) {
  // Si no es un objeto o es null, devolver tal cual
  if (typeof structure !== 'object' || structure === null) {
    return structure;
  }
  
  // Si es un array, procesar cada elemento
  if (Array.isArray(structure)) {
    return structure.map(item => reorganizeJsonStructure(item));
  }
  
  // Crear una copia del objeto para no modificar el original
  const result = { ...structure };
  
  // Verificar si es la estructura de ocurrencias
  if (result.elements && Array.isArray(result.elements)) {
    // Crear un mapa de elementos por ID para facilitar la búsqueda
    const elementsById = {};
    result.elements.forEach(el => {
      if (el.id) {
        elementsById[el.id] = el;
      } else if (el.index) {
        elementsById[el.index] = el;
      }
    });
    
    // Crear una estructura jerárquica basada en parentId
    const hierarchicalElements = [];
    const processedElements = new Set();
    
    // Primero, procesar los elementos de nivel 0 (sin parentId)
    result.elements.forEach(el => {
      if (!el.parentId) {
        // Este es un elemento raíz
        hierarchicalElements.push(el);
        processedElements.add(el);
      }
    });
    
    // Luego, procesar los elementos con parentId
    result.elements.forEach(el => {
      if (el.parentId && !processedElements.has(el)) {
        const parentId = el.parentId;
        const parent = elementsById[parentId];
        
        if (parent) {
          // Inicializar el array de children si no existe
          if (!parent.children) {
            parent.children = [];
          }
          
          // Agregar el elemento al array de hijos del padre
          parent.children.push(el);
          processedElements.add(el);
        }
      }
    });
    
    // Actualizar los elementos con la estructura jerárquica
    result.elements = hierarchicalElements;
  }
  
  // Procesar recursivamente cada propiedad del objeto
  for (const key in result) {
    if (result[key] && typeof result[key] === 'object') {
      result[key] = reorganizeJsonStructure(result[key]);
    }
  }
  
  return result;
}

// Función para generar la documentación de los campos con estilo mejorado
function generateFieldDocumentation(structure) {
  let documentation = '<div class="field-documentation" style="font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif;">';
  
  // Función recursiva para procesar los elementos
  function processElements(elements, level = 0, parentName = '') {
    if (!elements || !Array.isArray(elements)) {
      return;
    }
    
    elements.forEach(element => {
      if (element.type === 'field') {
        // Documentación para un campo simple con estilo mejorado
        documentation += `
          <div class="field-doc-item" style="
            margin-bottom: 15px; 
            padding: 12px 15px 12px ${level * 20 + 15}px;
            background-color: white; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            border-left: 4px solid #2196f3;
            transition: all 0.3s ease;
          ">
            <div style="
              font-weight: 600; 
              color: #2196f3; 
              font-size: 1.05em;
              margin-bottom: 5px;
              display: flex;
              align-items: center;
            ">${element.name}
              <span style="
                font-size: 0.7em;
                background-color: #e3f2fd;
                color: #2196f3;
                padding: 2px 6px;
                border-radius: 4px;
                margin-left: 8px;
              ">Campo</span>
            </div>
            <div style="color: #444; font-size: 0.8em; line-height: 1.4;">
              <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 5px;">
                <span style="
                  background-color: #f8f9fa; 
                  padding: 3px 8px; 
                  border-radius: 4px; 
                  display: inline-flex; 
                  align-items: center;
                ">
                  <span style="color: #e91e63; font-weight: 500; margin-right: 4px;">Tipo:</span> 
                  <span>${element.fieldType || element.type || 'alfanumérico'}</span>
                </span>
                <span style="
                  background-color: #f8f9fa; 
                  padding: 3px 8px; 
                  border-radius: 4px; 
                  display: inline-flex; 
                  align-items: center;
                ">
                  <span style="color: #e91e63; font-weight: 500; margin-right: 4px;">Longitud:</span> 
                  <span>${element.length}</span>
                </span>
                ${element.required ? `
                <span style="
                  background-color: ${element.required.toLowerCase().includes('obligatorio') ? '#fce4ec' : '#f5f5f5'}; 
                  padding: 3px 8px; 
                  border-radius: 4px; 
                  display: inline-flex; 
                  align-items: center;
                ">
                  <span style="color: ${element.required.toLowerCase().includes('obligatorio') ? '#e91e63' : '#757575'}; font-weight: 500; margin-right: 4px;">Requerido:</span> 
                  <span>${element.required}</span>
                </span>` : ''}
              </div>
                  ${element.values.trim().toLowerCase() !== 'valor' ? `
                  <div style="
                    margin-top: 15px; 
                    padding: 8px; 
                    background-color: #f5f5f5; 
                    border-radius: 4px; 
                    font-style: italic;
                  ">
                    <span style="color: #757575;"></span> ${element.values.replace(/\s*\n\s*/g, '<br>')}
                  </div>` : ''}
            </div>
          </div>
        `;
      } else if (element.type === 'occurrence') {
        // Documentación para una ocurrencia con estilo mejorado
        const occurrenceName = element.name || `occurrence_${element.index || 0}`;
        
        documentation += `
          <div class="occurrence-doc-item" style="
            margin: 20px 0; 
            padding: 15px; 
            padding-left: ${level * 20 + 15}px;
            background-color: #f1f8e9; 
            border-radius: 8px; 
            border-left: 5px solid #4caf50;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          ">
            <div style="
              font-weight: 600; 
              color: #2e7d32; 
              font-size: 1.1em;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
            ">${occurrenceName}
              <span style="
                font-size: 0.75em;
                background-color: #c8e6c9;
                color: #2e7d32;
                padding: 2px 6px;
                border-radius: 4px;
                margin-left: 8px;
              ">Ocurrencia</span>
            </div>
            <div style="
              color: #444; 
              font-size: 0.9em; 
              margin-bottom: 12px;
              background-color: white;
              padding: 8px 12px;
              border-radius: 6px;
            ">
              <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                <span style="
                  background-color: #f5f5f5; 
                  padding: 3px 8px; 
                  border-radius: 4px; 
                  display: inline-flex; 
                  align-items: center;
                ">
                  <span style="color: #e91e63; font-weight: 500; margin-right: 4px;">Cantidad:</span> 
                  <span>${element.count || 1}</span>
                </span>
              </div>
              ${element.description ? `
              <div style="
                margin-top: 8px; 
                padding: 8px; 
                background-color: #f5f5f5; 
                border-radius: 4px; 
                font-style: italic;
              ">
                <span style="color: #757575;"></span> ${element.description}
              </div>` : ''}
            </div>
            
            ${element.fields && element.fields.length > 0 ? `
            <div style="
              margin-top: 10px;
              margin-left: 10px;
              padding-left: 10px;
              border-left: 2px dashed #4caf50;
            ">` : ''}
        `;
        
        // Procesar los campos de la ocurrencia
        if (element.fields && element.fields.length > 0) {
          processElements(element.fields, level + 1, occurrenceName);
          documentation += `</div>`;
        }
        
        documentation += `</div>`;
      }
    });
  }
  
  // Manejar el caso para la estructura de cabecera
  if (structure.fields && Array.isArray(structure.fields)) {
    // Crear elementos de campo para procesar
    const fieldsAsElements = structure.fields.map(field => ({
      type: 'field',
      name: field.name,
      fieldType: field.type,
      length: field.length,
      required: field.required,
      description: field.description,
      values: field.values
    }));
    
    processElements(fieldsAsElements);
  }
  // Procesar los elementos de la estructura para requerimiento o respuesta
  else if (structure.elements && structure.elements.length > 0) {
    processElements(structure.elements);
  } else {
    documentation += `
      <div style="
        padding: 20px; 
        text-align: center; 
        color: #757575; 
        background-color: #f5f5f5; 
        border-radius: 8px;
        margin: 20px 0;
      ">
        No hay información de campos disponible.
      </div>
    `;
  }
  
  documentation += '</div>';
  return documentation;
}

// Función para colorear el JSON del Payload con colores simples
function colorizePayloadJson(json) {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2);
  }
  
  // Escapar caracteres HTML
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Colorear las comillas
  json = json.replace(/"/g, '<span style="color: #e91e63;">"</span>');
  
  // Colorear las propiedades (claves)
  json = json.replace(/<span style="color: #e91e63;">"\s*<\/span>([^<]*?)<span style="color: #e91e63;">"\s*<\/span>\s*:/g, 
    function(match, key) {
      return match.replace(key, '<span style="color: #2196f3; font-weight: bold;">' + key + '</span>');
    }
  );
  
  return json;
}

// Función para resaltar la sintaxis JSON con colores
function colorizeJsonSyntax(json) {
    if (typeof json !== 'string') {
        json = JSON.stringify(json, null, 2);
    }
  
    // Escapar caracteres HTML
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
    // Colorear primero las comillas
    json = json.replace(/"/g, '<span style="color: #e91e63;">"</span>');
  
    // Colorear propiedades (claves)
    json = json.replace(/<span style="color: #e91e63;">"\s*<\/span>([^<]*?)<span style="color: #e91e63;">"\s*<\/span>\s*:/g, 
        function(match, key) {
            return match.replace(key, '<span style="color: #2196f3; font-weight: bold;">' + key + '</span>');
        }
    );
  
    // Colorear valores (string, number, boolean, null)
    json = json.replace(/:\s*<span style="color: #e91e63;">"\s*<\/span>([^<]*?)<span style="color: #e91e63;">"\s*<\/span>/g, 
        function(match, value) {
            return match.replace(value, '<span style="color: #4caf50;">' + value + '</span>');
        }
    );
  
    // Colorear números
    json = json.replace(/:\s*(-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
        ': <span style="color: #ff9800;">$1</span>');
  
    // Colorear booleanos
    json = json.replace(/:\s*(true|false)/g, 
        ': <span style="color: #9c27b0;">$1</span>');
  
    // Colorear null
    json = json.replace(/:\s*(null)/g, 
        ': <span style="color: #607d8b;">$1</span>');
  
    return json;
}

// Renamed the old function to avoid conflicts if it was used elsewhere (unlikely based on current code)
function basicSyntaxHighlightJson(json) {
    if (typeof json !== 'string') {
        json = JSON.stringify(json, null, 2);
    }
    // Create a pre element temporary to display the formatted JSON
    const pre = document.createElement('pre');
    pre.textContent = json;
    // Return the JSON without HTML format
    return pre.textContent;
}


function displayMessageStructure(message, serviceStructure) {
  // Funciones auxiliares para rellenar con caracteres
  const padLeft = (num, width, char = "0") => {
    return num.toString().padStart(width, char);
  };
  
  const padRight = (str, width, char = " ") => {
    return str.toString().padEnd(width, char);
  };

  // Función para renderizar un campo - Optimizada para una sola línea con campo de entrada y validación
  const renderField = (field, startPosition, fieldType = 'common') => {
    const endPosition = startPosition + field.length - 1;
    // Manejar el caso cuando message es null
    const value = message ? message.substring(
      startPosition,
      startPosition + field.length
    ) : '';
    
    // Generar el ID único para el campo de entrada
    let fieldId = "field_" + field.name.replace(/[^a-zA-Z0-9]/g, '_') + "_" + (field.index || 0);
    
    // Si el campo pertenece a una ocurrencia, agregar el prefijo de la ocurrencia al ID
    if (field.occurrenceName) {
      fieldId = "occ_" + field.occurrenceName + "_" + fieldId;
    }
    
    // Determinar el tipo de entrada basado en el tipo de campo
    // Siempre usar type="text" para permitir entrada alfanumérica
    // Los campos numéricos se formatearán correctamente en el evento blur
    const inputType = "text";
    
    // Obtener el tipo de campo exacto de la estructura
    const actualFieldType = (field.fieldType || field.type || "").toLowerCase();
    
    // Usar el tipo exacto de la estructura para el formateo
    const formattingType = actualFieldType;
    
    // Solo para logging, determinar si es numérico o alfanumérico
    const isNumericType = (actualFieldType.includes("numerico") || actualFieldType.includes("numeric")) && 
                         !(actualFieldType.includes("alfanumerico") || actualFieldType.includes("alphanumeric"));
    
    console.log("Campo " + field.name + ": tipo=" + actualFieldType + ", formattingType=" + formattingType);
    
    // Detectar si el campo tiene decimales basándose en su descripción o valores
    const hasDecimals = (field.description || '').toLowerCase().includes('decimal') || 
                        (field.values || '').toLowerCase().includes('decimal') ||
                        (field.description || '').toLowerCase().includes('posiciones enteras') ||
                        (field.values || '').toLowerCase().includes('posiciones enteras');
    
    // Determinar el número de decimales (por defecto 2)
    let decimalPlaces = 2;
    
    // Intentar extraer el número de decimales de la descripción o valores
    const decimalMatch = ((field.description || '') + ' ' + (field.values || '')).match(/(\d+)\s*(?:posiciones|posición|digitos|dígitos)\s*decimales/i);
    if (decimalMatch && decimalMatch[1]) {
      decimalPlaces = parseInt(decimalMatch[1], 10);
    }
    
    // Texto de validación que muestra los requisitos del campo
    let validationText = "Longitud: " + field.length + ", Tipo: " + (actualFieldType || "alfanumérico");
    
    // Agregar información sobre decimales si corresponde
    if (hasDecimals) {
      validationText += ", " + decimalPlaces + " posiciones decimales";
    }
    
    // Determinar si el campo es obligatorio
    const isRequired = (field.required || "").toLowerCase().includes("obligatorio");
    
    // Verificar si el campo tiene una lista de valores para mostrar un dropdown
    const hasValuesList = field.values && (field.values.includes('=') || field.values.includes('\n'));
    
    // Contar opciones para determinar si necesitamos un filtro
    let optionCount = 0;
    let dropdownOptions = '';
    
    if (hasValuesList) {
      // Parsear las opciones y contar cuántas hay
      const result = parseValuesForDropdown(field.values, field, true);
      dropdownOptions = result.options;
      optionCount = result.count;
    }
    
    // Crear el HTML para el campo
    let fieldHtml = '<div class="field ' + fieldType + '-field"';
    
    // Agregar atributos de ocurrencia si el campo pertenece a una
    if (field.occurrenceName) {
      fieldHtml += ' data-occurrence-name="' + field.occurrenceName + '"' +
                  ' data-occurrence-id="' + field.occurrenceId + '"' +
                  ' data-occurrence-level="' + field.occurrenceLevel + '"';
    }
    
    fieldHtml += '>' +
      '<span class="field-index">[' + padLeft(field.index || 0, 3) + ']</span>' +
      '<span class="field-position">[' + padLeft(startPosition, 4, "0") + '-' + padLeft(endPosition, 4, "0") + ']</span>' +
      '<span class="field-name">' + field.name + ':</span>' +
      '<span class="field-value">' + getDefaultValueForField(field) + '</span>' +
      '<span class="field-meta">(' + field.length + 'p, ' + (actualFieldType || "alfanumérico") +
      (field.required ? ', Req: ' + field.required : "");
    
    // Agregar información de ocurrencia en los metadatos si existe
    if (field.occurrenceName) {
      fieldHtml += ', Occ: ' + field.occurrenceName + ', Nivel: ' + field.occurrenceLevel;
    }
    
    fieldHtml += ')</span>' +
      '<div class="field-input-container">';
    
    // Solo mostrar campos de entrada para campos que no son de la cabecera
    if (fieldType !== 'header') {
      // Si tiene lista de valores, crear un dropdown y un input
      if (hasValuesList) {
        // Crear un contenedor para el dropdown y el input
        fieldHtml += 
          '<div class="dropdown-input-container">';
        
        // Si hay muchas opciones, agregar un campo de filtro
        if (optionCount > 20) {
          fieldHtml += 
            '<div class="dropdown-filter-container">' +
              '<input type="text" class="dropdown-filter" ' +
                     'placeholder="Filtrar opciones... (' + optionCount + ' valores disponibles)"' +
                     'data-target-dropdown="' + fieldId + '_dropdown">' +
            '</div>';
        }
        
        fieldHtml += 
            '<select id="' + fieldId + '_dropdown" class="field-dropdown" data-target-input="' + fieldId + '"';
        
        // Agregar atributos de ocurrencia al dropdown si el campo pertenece a una
        if (field.occurrenceName) {
          fieldHtml += ' data-occurrence-name="' + field.occurrenceName + '"' +
                      ' data-occurrence-id="' + field.occurrenceId + '"' +
                      ' data-occurrence-level="' + field.occurrenceLevel + '"';
        }
        
        fieldHtml += '>' +
              '<option value="">-- Seleccionar valor --</option>' +
              dropdownOptions +
            '</select>' +
            '<input type="' + inputType + '" id="' + fieldId + '" class="field-input" ' +
                   'data-field-name="' + field.name + '" ' +
                   'data-field-length="' + field.length + '" ' +
                   'data-field-type="' + formattingType + '" ' +
                   'data-field-description="' + (field.description || '') + '" ' +
                   'data-field-values="' + (field.values || '') + '" ' +
                   'maxlength="' + field.length + '" ' +
                   'value="' + value.trim() + '" ';
        
        // Agregar atributos de ocurrencia al input si el campo pertenece a una
        if (field.occurrenceName) {
          fieldHtml += 'data-occurrence-name="' + field.occurrenceName + '" ' +
                      'data-occurrence-id="' + field.occurrenceId + '" ' +
                      'data-occurrence-level="' + field.occurrenceLevel + '" ';
        }
        
        fieldHtml += (formattingType.includes('numerico') || formattingType.includes('numeric') ? 'pattern="[0-9]*"' : '') +
                   (isRequired ? 'required' : '') + '>' +
          '</div>';
      } else {
        // Campo normal sin dropdown
        fieldHtml += 
        '<input type="' + inputType + '" id="' + fieldId + '" class="field-input" ' +
               'data-field-name="' + field.name + '" ' +
               'data-field-length="' + field.length + '" ' +
               'data-field-type="' + formattingType + '" ' +
               'data-field-description="' + (field.description || '') + '" ' +
               'data-field-values="' + (field.values || '') + '" ' +
               'maxlength="' + field.length + '" ';
        
        // Agregar atributos de ocurrencia si el campo pertenece a una
        if (field.occurrenceName) {
          fieldHtml += 'data-occurrence-name="' + field.occurrenceName + '" ' +
                      'data-occurrence-id="' + field.occurrenceId + '" ' +
                      'data-occurrence-level="' + field.occurrenceLevel + '" ';
        }
        
        // Agregar atributo required si es necesario
        fieldHtml += (isRequired ? 'required' : '') + '>';
      }
    }
    
    // Agregar el texto de validación
    fieldHtml += 
        '<span class="field-validation">' + validationText + '</span>' +
      '</div>' +
    '</div>';
    
    return fieldHtml;
  };
  
  // Función para parsear los valores y crear las opciones del dropdown
  function parseValuesForDropdown(valuesString, field, returnCount = false) {
    if (!valuesString) {
      return returnCount ? { options: '', count: 0 } : '';
    }
    
    let options = '';
    let optionCount = 0;
    
    try {
      // Caso 1: Valores en formato "código=descripción" (puede ser multilínea)
      if (valuesString.includes('=')) {
        // Dividir por líneas o por patrones que parezcan separar entradas
        const entries = [];
        
        // Intentar dividir por líneas primero
        const lines = valuesString.split(/\r?\n/);
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          // Verificar si la línea contiene un '='
          if (trimmedLine.includes('=')) {
            const parts = trimmedLine.split('=');
            if (parts.length >= 2) {
              const code = parts[0].trim();
              const description = parts.slice(1).join('=').trim();
              
              entries.push({ code, description });
              optionCount++;
            }
          } else {
            // Si no tiene '=', podría ser una continuación de la descripción anterior
            // o un valor independiente
            if (entries.length > 0) {
              // Asumimos que es continuación de la descripción anterior
              entries[entries.length - 1].description += ' ' + trimmedLine;
            } else {
              // Es un valor independiente
              entries.push({ code: trimmedLine, description: '' });
              optionCount++;
            }
          }
        }
        
        // Generar las opciones HTML
        for (const entry of entries) {
          // Formatear el código según el tipo de campo
          const formattedCode = field.fieldType && field.fieldType.toLowerCase().includes('numeric') 
            ? padLeft(entry.code, field.length, '0') 
            : padRight(entry.code, field.length, ' ');
          
          const displayText = entry.description 
            ? entry.code + " - " + entry.description
            : entry.code;
          
          // Para campos numéricos, guardar solo el código en el valor
          // Para campos alfanuméricos, guardar el código formateado
          const optionValue = field.fieldType && 
                             (field.fieldType.toLowerCase().includes('numeric') || field.fieldType.toLowerCase().includes('numerico')) && 
                             !(field.fieldType.toLowerCase().includes('alfanumerico') || field.fieldType.toLowerCase().includes('alphanumeric'))
                             ? entry.code  // Solo el código para campos numéricos
                             : formattedCode;  // Código formateado para campos alfanuméricos
          
          options += '<option value="' + optionValue + '" title="' + entry.description + '">' + displayText + '</option>';
        }
      } 
      // Caso 2: Lista de valores separados por comas
      else if (valuesString.includes(',')) {
        const values = valuesString.split(',');
        
        for (const val of values) {
          const trimmedVal = val.trim();
          if (!trimmedVal) continue;
          
          // Formatear el valor según el tipo de campo
          const formattedVal = field.fieldType && field.fieldType.toLowerCase().includes('numeric') 
            ? padLeft(trimmedVal, field.length, '0') 
            : padRight(trimmedVal, field.length, ' ');
          
          options += '<option value="' + formattedVal + '">' + trimmedVal + '</option>';
          optionCount++;
        }
      }
      // Caso 3: Texto plano con múltiples líneas (sin separadores específicos)
      else {
        // Dividir por líneas
        const lines = valuesString.split(/\r?\n/);
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          // Formatear el valor según el tipo de campo
          const formattedVal = field.fieldType && field.fieldType.toLowerCase().includes('numeric') 
            ? padLeft(trimmedLine, field.length, '0') 
            : padRight(trimmedLine, field.length, ' ');
          
          options += '<option value="' + formattedVal + '">' + trimmedLine + '</option>';
          optionCount++;
        }
      }
      
      // Si hay muchas opciones, agregar un mensaje al principio
      if (optionCount > 50) {
        options = '<option value="" disabled>-- ' + optionCount + ' valores disponibles, escriba para filtrar --</option>' + options;
      }
    } catch (e) {
      console.warn("Error al parsear valores para dropdown:", e);
    }
    
    return returnCount ? { options, count: optionCount } : options;
  }

  // Función para renderizar estructura jerárquica
  const renderHierarchicalStructure = (elements, level = 0, parentId = '', isRequest = true) => {
    let output = "";
    let currentPosition = 0;

    const indent = "  ".repeat(level);

    elements.forEach((element) => {
      if (element.type === "field") {
        // Agregar información de la ocurrencia padre si existe
        if (parentId) {
          // Clonar el elemento para no modificar el original
          const fieldWithOccurrence = { ...element };
          // Agregar propiedades de la ocurrencia padre
          fieldWithOccurrence.occurrenceId = parentId;
          fieldWithOccurrence.occurrenceLevel = level;
          
          // Si es la sección de respuesta (isRequest = false), mostrar solo información sin campos de entrada
          if (!isRequest) {
            // Renderizar campo sin elementos de entrada para la sección de respuesta
            const fieldHtml = renderFieldReadOnly(fieldWithOccurrence, currentPosition);
            output += indent + fieldHtml + "\n";
          } else {
            // Para la sección de requerimiento, mantener el comportamiento original
            output += indent + renderField(fieldWithOccurrence, currentPosition, 'common') + "\n";
          }
        } else {
          // Campo normal sin ocurrencia padre
          if (!isRequest) {
            // Renderizar campo sin elementos de entrada para la sección de respuesta
            const fieldHtml = renderFieldReadOnly(element, currentPosition);
            output += indent + fieldHtml + "\n";
          } else {
            // Para la sección de requerimiento, mantener el comportamiento original
            output += indent + renderField(element, currentPosition, 'common') + "\n";
          }
        }
        currentPosition += element.length;
      } else if (element.type === "occurrence") {
        // Usar el ID único de la ocurrencia si existe, o generar uno
        const occurrenceId = element.id || ("occurrence_" + (element.index || 0) + "_" + level + "_" + parentId);
        const occurrenceName = padLeft(element.index || 0, 3);
        
        // Agregar propiedades adicionales a la ocurrencia
        element.occurrenceLevel = level;
        element.occurrenceName = occurrenceName;
        element.totalOccurrences = element.count || 0;
        element.effectiveOccurrences = 1; // Inicialmente solo hay una ocurrencia
        
        // Usar clase de color basada en el nivel para uniformidad
        const levelColorClass = "level-color-" + level;
        
        output += indent + '<div class="occurrence-section level-' + level + ' ' + levelColorClass + '" id="' + occurrenceId + '"' +
                 ' data-occurrence-name="' + occurrenceName + '"' +
                 ' data-occurrence-level="' + level + '"' +
                 ' data-occurrence-id="' + occurrenceId + '"' +
                 ' data-total-occurrences="' + element.totalOccurrences + '"' +
                 ' data-effective-occurrences="' + element.effectiveOccurrences + '">\n';
        
        output += indent + '  <div class="occurrence-title">' +
          '<button type="button" class="btn-collapse-occurrence" data-target="' + occurrenceId + '_container">' +
          '<span class="collapse-icon">▼</span></button> ' +
          'SECCIÓN DE OCURRENCIAS [' + occurrenceName + '] - Ocurrencias: ' + element.totalOccurrences +
          ' (Nivel: ' + level + ', ID: ' + occurrenceId + ')' +
          (isRequest ? ' <button type="button" class="btn-add-occurrence" ' + 
                  'data-occurrence-id="' + occurrenceId + '" ' + 
                  'data-max-occurrences="' + element.totalOccurrences + '"' +
                  'data-occurrence-name="' + occurrenceName + '"' +
                  'data-level="' + level + '">Agregar Elemento</button>' : '') +
        '</div>\n';
        
        // Contenedor para las ocurrencias dinámicas
        output += indent + '  <div class="occurrences-container" id="' + occurrenceId + '_container">\n';
        
        // Primera ocurrencia (la que ya existe)
        output += indent + '    <div class="occurrence-item" data-occurrence-index="0" data-occurrence-name="' + occurrenceName + '" data-occurrence-id="' + occurrenceId + '">\n';
        output += indent + '      <div class="occurrence-header">Ocurrencia #1 (de ' + element.totalOccurrences + ')</div>\n';
        
        // Procesar los campos de la ocurrencia
        if (element.fields && element.fields.length > 0) {
          element.fields.forEach((field) => {
            // Verificar si el campo es una ocurrencia anidada
            if (field.type === "occurrence") {
              // Renderizar la ocurrencia anidada recursivamente
              output += renderHierarchicalStructure(
                [field],
                level + 1,
                occurrenceId,
                isRequest
              );
            } else {
              // Clonar el campo para no modificar el original
              const fieldWithOccurrence = { ...field };
              // Agregar propiedades de la ocurrencia
              fieldWithOccurrence.occurrenceId = occurrenceId;
              fieldWithOccurrence.occurrenceName = occurrenceName;
              fieldWithOccurrence.occurrenceLevel = level;
              
              if (!isRequest) {
                // Para la sección de respuesta, mostrar campos de solo lectura
                output += indent + '      ' + renderFieldReadOnly(fieldWithOccurrence, currentPosition) + '\n';
              } else {
                // Para la sección de requerimiento, mantener el comportamiento original
                output += indent + '      ' + renderField(fieldWithOccurrence, currentPosition, 'occurrence') + '\n';
              }
              currentPosition += field.length;
            }
          });
        }
        
        output += indent + '    </div>\n'; // Fin de la primera ocurrencia
        output += indent + '  </div>\n'; // Fin del contenedor de ocurrencias
        
        output += indent + '</div>\n';
      }
    });

    return output;
  };
  
  // Función para renderizar un campo en modo solo lectura (sin elementos de entrada)
  const renderFieldReadOnly = (field, startPosition) => {
    const endPosition = startPosition + field.length - 1;
    const defaultValue = getDefaultValueForField(field);
    
    // Crear el HTML para el campo de solo lectura
    let fieldHtml = '<div class="field readonly-field"';
    
    // Agregar atributos de ocurrencia si el campo pertenece a una
    if (field.occurrenceName) {
      fieldHtml += ' data-occurrence-name="' + field.occurrenceName + '"' +
                  ' data-occurrence-id="' + field.occurrenceId + '"' +
                  ' data-occurrence-level="' + field.occurrenceLevel + '"';
    }
    
    fieldHtml += '>' +
      '<span class="field-index">[' + padLeft(field.index || 0, 3) + ']</span>' +
      '<span class="field-position">[' + padLeft(startPosition, 4, "0") + '-' + padLeft(endPosition, 4, "0") + ']</span>' +
      '<span class="field-name">' + field.name + ':</span>' +
      '<span class="field-value">' + defaultValue + '</span>' +
      '<span class="field-meta">(' + field.length + 'p, ' + ((field.fieldType || field.type) || "alfanumérico") +
      (field.required ? ', Req: ' + field.required : "");
    
    // Agregar información de ocurrencia en los metadatos si existe
    if (field.occurrenceName) {
      fieldHtml += ', Occ: ' + field.occurrenceName + ', Nivel: ' + field.occurrenceLevel;
    }
    
    fieldHtml += ')</span>' +
    '</div>';
    
    return fieldHtml;
  };

  // Renderizar la sección de cabecera
  const renderHeaderSection = () => {
    // Buscar la estructura de cabecera en el contexto global
    const headerStructure = window.headerStructure;
    
    if (!headerStructure || !headerStructure.fields || !Array.isArray(headerStructure.fields)) {
      return '<div class="section header-section">' +
        '<div class="section-title">CABECERA (102 posiciones)</div>' +
        '<div class="field header-field">' +
          '<span class="field-name">No se pudo obtener información de la cabecera</span>' +
        '</div>' +
      '</div>';
    }
    
    let output = '<div class="section header-section">' +
      '<div class="section-title">CABECERA (' + headerStructure.totalLength + ' posiciones)</div>';
    
    // Generar el string completo de la cabecera
    let headerString = '';
    let position = 0;
    
    headerStructure.fields.forEach((field, index) => {
      // Crear un objeto de campo compatible con renderField
      const fieldObj = {
        index: index,
        name: field.name,
        length: field.length,
        type: field.type || field.type,
        required: field.required,
        values: field.values,
        description: field.description
      };
      
      // Obtener el valor por defecto para este campo
      const defaultValue = getDefaultValueForField(field);
      
      // Agregar el valor al string de la cabecera
      headerString += defaultValue;
      
      // Renderizar el campo
      output += renderField(fieldObj, position, 'header');
      position += field.length;
    });
    
    // Agregar el label con el string completo de la cabecera y su longitud
    output += 
    '<div class="header-string-container" style="margin-top: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px; font-family: monospace;">' +
      '<div style="font-weight: bold; margin-bottom: 5px;">String completo de la cabecera:</div>' +
      '<div style="word-break: break-all; white-space: normal; font-size: 14px; border: 1px solid #ddd; padding: 10px; background-color: white; border-radius: 3px;">' + headerString + '</div>' +
      '<div style="margin-top: 5px; font-size: 14px; color: ' + (headerString.length === 102 ? 'green' : 'red') + ';">' +
        'Longitud: ' + headerString.length + ' ' + (headerString.length === 102 ? '✓' : '✗') + ' (debe ser 102)' +
      '</div>' +
    '</div>';
    
    output += '</div>';
    return output;
  };

  // Función para calcular la longitud total de una sección, considerando las ocurrencias
  const calculateSectionLength = (section) => {
    let totalLength = 0;
    
    // Función recursiva para calcular la longitud de los elementos
    const calculateElementsLength = (elements, multiplier = 1) => {
      let length = 0;
      
      elements.forEach(element => {
        if (element.type === 'field') {
          length += element.length;
        } else if (element.type === 'occurrence') {
          // Para ocurrencias, multiplicar la longitud de sus campos por el número de ocurrencias
          let occurrenceLength = 0;
          
          // Calcular la longitud de los campos de la ocurrencia
          element.fields.forEach(field => {
            if (field.type === 'field') {
              occurrenceLength += field.length;
            } else if (field.type === 'occurrence') {
              // Ocurrencia anidada, calcular recursivamente
              occurrenceLength += calculateElementsLength([field], field.count || 1);
            }
          });
          
          // Multiplicar por el número de ocurrencias
          length += occurrenceLength * (element.count || 1);
        }
      });
      
      return length * multiplier;
    };
    
    // Calcular la longitud de los elementos de la sección
    totalLength = calculateElementsLength(section.elements);
    
    return totalLength;
  };
  
  // Calcular las longitudes de las secciones
  const headerLength = window.headerStructure ? window.headerStructure.totalLength : 102;
  const requestLength = calculateSectionLength(serviceStructure.request);
  const responseLength = calculateSectionLength(serviceStructure.response);
  const totalLength = headerLength + requestLength;
  
  // Verificar si la longitud calculada coincide con la esperada
  const expectedRequestLength = serviceStructure.request.totalLength || 0;
  const requestLengthMatch = requestLength === expectedRequestLength;
  
  const expectedResponseLength = serviceStructure.response.totalLength || 0;
  const responseLengthMatch = responseLength === expectedResponseLength;
  
  // Generar contenido para cada pestaña
  const headerContent = renderHeaderSection();
  
  const requestContent = '<div class="section">' +
    '<div class="section-title">REQUERIMIENTO (' + requestLength + ' posiciones' + 
    (requestLengthMatch ? ' ✓' : ' ✗ - Esperado: ' + expectedRequestLength) + ')</div>' +
    renderHierarchicalStructure(serviceStructure.request.elements, 0, '', true) +
    
    '<!-- Botón para generar string de requerimiento -->' +
    '<div class="request-string-generator" style="margin-top: 20px; padding: 15px; background-color: #f0f8ff; border-radius: 5px; border: 1px solid #b8daff;">' +
      '<button id="btnGenerateRequestString" class="btn-primary" style="background-color: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;" onclick="handleGenerateRequestString()">' +
        'Generar String de Requerimiento' +
      '</button>' +
      '<div id="requestStringResult" style="margin-top: 10px; font-size: 14px;"></div>' +
    '</div>' +
    
    '<!-- Resumen de longitudes -->' +
    '<div class="length-summary" style="display:none; margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; border: 1px solid #ddd;">' +
      '<h3 style="margin-top: 0;">Resumen de Longitudes</h3>' +
      '<div><strong>Cabecera:</strong> ' + headerLength + ' posiciones</div>' +
      '<div><strong>Requerimiento:</strong> ' + requestLength + ' posiciones' + 
      (requestLengthMatch ? ' <span style="color: green;">✓</span>' : ' <span style="color: red;">✗</span> - Esperado: ' + expectedRequestLength) + '</div>' +
      '<div><strong>Total (Cabecera + Requerimiento):</strong> ' + totalLength + ' posiciones</div>' +
    '</div>' +
  '</div>';

  
  const responseContent = '<div class="section">' +
    '<div class="section-title">RESPUESTA (' + responseLength + ' posiciones' + 
    (responseLengthMatch ? ' ✓' : ' ✗ - Esperado: ' + expectedResponseLength) + ')</div>' +
    renderHierarchicalStructure(serviceStructure.response.elements, 0, '', false) +
    
    '<!-- Resumen de longitudes -->' +
    '<div class="length-summary" style="display:none; margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; border: 1px solid #ddd;">' +
      '<h3 style="margin-top: 0;">Resumen de Longitudes</h3>' +
      '<div><strong>Cabecera:</strong> ' + headerLength + ' posiciones</div>' +
      '<div><strong>Respuesta:</strong> ' + responseLength + ' posiciones' + 
      (responseLengthMatch ? ' <span style="color: green;">✓</span>' : ' <span style="color: red;">✗</span> - Esperado: ' + expectedResponseLength) + '</div>' +
      '<div><strong>Total (Cabecera + Respuesta):</strong> ' + (headerLength + responseLength) + ' posiciones</div>' +
    '</div>' +
  '</div>';
  
  // Función para extraer y formatear valores posibles de un campo
  function extractAndFormatValues(field) {
    // Si no tiene valores, devolver cadena vacía
    if (!field.values || field.values === '') {
      return '';
    }
    
    // Lista de valores formateados
    let formattedValues = '';
    
    // Verificar si los valores están en formato código=descripción
    if (field.values.includes('=')) {
      // Dividir por líneas para procesar cada valor
      const lines = field.values.split(/\r?\n/);
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Verificar si la línea contiene un '='
        if (trimmedLine.includes('=')) {
          const parts = trimmedLine.split('=');
          if (parts.length >= 2) {
            const code = parts[0].trim();
            const description = parts.slice(1).join('=').trim();
            
            formattedValues += `
              <div class="value-item" style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                <div class="value-code">${code}</div>
                <div class="value-description">${description}</div>
              </div>`;
          }
        } else {
          // Si no tiene '=', es un valor simple
          formattedValues += `
              <div class="value-item" style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                <div class="value-code">${trimmedLine}</div>
              </div>`;
        }
      }
    } else if (field.values.includes(',')) {
      // Valores separados por comas
      const values = field.values.split(',');
      
      for (const val of values) {
        const trimmedVal = val.trim();
        if (!trimmedVal) continue;
        
        formattedValues += `
            <div class="value-item" style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
              <div class="value-code">${trimmedVal}</div>
            </div>`;
      }
    } else {
      // Texto simple, mostrarlo con saltos de línea
      // Reemplazar saltos de línea implícitos con saltos de línea explícitos
      const formattedText = field.values.replace(/\s*\n\s*/g, '<br><br>');
      
      formattedValues = `<div class="value-item full-width" style="margin-bottom: 12px; white-space: pre-wrap;">
            <div class="value-description">${formattedText}</div>
          </div>`;
    }
    
    return formattedValues;
  }
  
  // Función para recorrer la estructura y extraer los campos con valores
  function extractFieldsWithValues(structure) {
    const fieldsWithValues = [];
    
    // Función recursiva para buscar campos con valores
    function processElements(elements, path = '') {
      if (!elements || !Array.isArray(elements)) return;
      
      elements.forEach(element => {
        if (element.type === 'field' && element.values && element.values.trim() !== '') {
          fieldsWithValues.push({
            name: element.name,
            values: element.values,
            path: path + (path ? ' > ' : '') + element.name
          });
        }
        
        // Si es una ocurrencia, procesar sus campos
        if (element.type === 'occurrence' && element.fields) {
          const currentPath = path + (path ? ' > ' : '') + (element.name || `Ocurrencia ${element.index || 0}`);
          processElements(element.fields, currentPath);
        }
        
        // Procesar campos hijos si existen
        if (element.children) {
          const currentPath = path + (path ? ' > ' : '') + (element.name || `Elemento ${element.index || 0}`);
          processElements(element.children, currentPath);
        }
      });
    }
    
    // Función para procesar campos directos (para la estructura de cabecera)
    function processFields(fields, path = '') {
      if (!fields || !Array.isArray(fields)) return;
      
      fields.forEach(field => {
        if (field.values && field.values.trim() !== '') {
          fieldsWithValues.push({
            name: field.name,
            values: field.values,
            path: path + (path ? ' > ' : '') + field.name
          });
        }
      });
    }
    
    // Iniciar el procesamiento con los elementos de la estructura
    if (structure && structure.elements) {
      processElements(structure.elements);
    }
    // O procesar los campos directamente (para la estructura de cabecera)
    else if (structure && structure.fields) {
      processFields(structure.fields, 'Cabecera');
    }
    
    return fieldsWithValues;
  }
  
  // Función para generar el HTML de la documentación de valores
  function generateValuesDocumentation(fieldsWithValues) {
    if (!fieldsWithValues || fieldsWithValues.length === 0) {
      return `
        <div class="no-values-message">
          No hay campos con valores posibles definidos.
        </div>`;
    }
    
    let html = '';
    
    fieldsWithValues.forEach(field => {
      html += `
        <div class="field-values-container">
          <div class="field-values-header">
            <h4>${field.name}</h4>
            <div class="field-path">${field.path}</div>
          </div>
          <div class="field-values-list">
            ${extractAndFormatValues(field)}
          </div>
        </div>`;
    });
    
    return html;
  }

  // Preparar documentación de valores para cada estructura
  const headerFieldsWithValues = extractFieldsWithValues(window.headerStructure);
  const requestFieldsWithValues = extractFieldsWithValues(serviceStructure.request);
  const responseFieldsWithValues = extractFieldsWithValues(serviceStructure.response);
  
  const headerValuesDoc = generateValuesDocumentation(headerFieldsWithValues);
  const requestValuesDoc = generateValuesDocumentation(requestFieldsWithValues);
  const responseValuesDoc = generateValuesDocumentation(responseFieldsWithValues);

  // CSS para la documentación de valores
  const valuesDocStyles = `
    <style>
      .json-structure-container {
        display: flex;
        gap: 20px;
      }
      .json-content-panel {
        width: 70%;
        flex: 0 0 70%;
      }
      .values-doc-panel {
        width: 30%;
        flex: 0 0 30%;
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 15px;
        max-height: 500px;
        overflow: auto;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      .values-doc-title {
        color: #2c3e50;
        border-bottom: 2px solid #3498db;
        padding-bottom: 8px;
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 1.1em;
      }
      .field-values-container {
        margin-bottom: 20px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        border-left: 4px solid #2196f3;
        overflow: hidden;
      }
      .field-values-header {
        background-color: #e3f2fd;
        padding: 10px 15px;
        border-bottom: 1px solid #e0e0e0;
      }
      .field-values-header h4 {
        margin: 0;
        color: #2196f3;
        font-weight: 600;
        font-size: 1.05em;
      }
      .field-path {
        font-size: 0.8em;
        color: #666;
        margin-top: 3px;
      }
      .field-values-list {
        padding: 10px 15px;
      }
      .value-item {
        display: flex;
        margin-bottom: 8px;
        padding: 5px;
        border-bottom: 1px dashed #f0f0f0;
        gap: 10px;
        font-size: 0.9em;
      }
      .value-item.full-width {
        display: block;
      }
      .value-code {
        font-weight: bold;
        color: #e91e63;
        min-width: 30%;
        font-family: monospace;
        background-color: #fafafa;
        padding: 2px 5px;
        border-radius: 3px;
        white-space: pre-wrap;
      }
      .value-description {
        color: #333;
        white-space: pre-wrap;
        flex: 1;
      }
      .no-values-message {
        text-align: center;
        padding: 20px;
        color: #777;
        font-style: italic;
      }
      @media (max-width: 768px) {
        .json-structure-container {
          flex-direction: column;
        }
        .json-content-panel, .values-doc-panel {
          flex: 1;
          width: 100%;
        }
      }
    </style>`;

  // Generar contenido para la pestaña JSON con sub-pestañas
  const jsonContent = valuesDocStyles + 
    '<div class="section">' +
    '<div class="section-title">Estructura</div>' +
    
    // Sub-pestañas para los diferentes JSON
    '<div class="json-tabs-container">' +
      '<div class="json-tabs-nav" style="display: flex; border-bottom: 2px solid #3f51b5; margin-bottom: 15px;">' +
        '<button class="json-tab-btn active" data-json-tab="json-cabecera" style="padding: 8px 15px; background-color: #3f51b5; color: white; border: none; border-radius: 5px 5px 0 0; cursor: pointer; font-weight: 500; margin-right: 5px; transition: all 0.3s ease;">Cabecera</button>' +
        '<button class="json-tab-btn" data-json-tab="json-requerimiento" style="padding: 8px 15px; background-color: #f5f5f5; color: #333; border: none; border-radius: 5px 5px 0 0; cursor: pointer; font-weight: 500; margin-right: 5px; transition: all 0.3s ease;">Requerimiento</button>' +
        '<button class="json-tab-btn" data-json-tab="json-respuesta" style="padding: 8px 15px; background-color: #f5f5f5; color: #333; border: none; border-radius: 5px 5px 0 0; cursor: pointer; font-weight: 500; margin-right: 5px; transition: all 0.3s ease;">Respuesta</button>' +
      '</div>' +
      
      // Contenido de las sub-pestañas
      '<div class="json-tab-content" style="background-color: white; border-radius: 0 0 5px 5px; padding: 15px; border: 1px solid #e0e0e0;">' +
        // Cabecera JSON
        '<div id="json-cabecera" class="json-tab-pane active" style="display: block;">' +
          '<div class="json-structure-container">' +
            '<div class="json-content-panel">' +
              '<div class="json-container" style="background-color: white; padding: 10px; border: 1px solid #ddd; border-radius: 4px; max-height: 500px; overflow: auto; font-family: monospace; position: relative;">' +
                '<pre class="json-content-wrapper" style="margin: 0; color: #333;">' +
                  colorizeJsonSyntax(JSON.stringify(reorganizeJsonStructure(window.headerStructure), null, 2)) +
                '</pre>' +
              '</div>' +
              '<div style="margin-top: 10px;">' +
                '<button id="btnCopyHeaderJson" class="btn-primary" style="background-color: #3f51b5; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;">' +
                  'Copiar JSON Cabecera' +
                '</button>' +
              '</div>' +
            '</div>' +
            
            // Panel de documentación de campos y valores
            '<div class="values-doc-panel">' +
              '<h3 class="values-doc-title">Documentación de Campos</h3>' +
              // Panel para la información de los campos
              generateFieldDocumentation(window.headerStructure) +
              // Sección colapsable para los valores posibles
              (headerValuesDoc !== '<div class="no-values-message">No hay campos con valores posibles definidos.</div>' ? 
              '<div class="values-section" style="margin-top: 15px;display:none">' +
                '<div class="values-section-header" style="cursor: pointer; background-color: #e3f2fd; padding: 8px 12px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;" onclick="this.parentNode.querySelector(\'.values-section-content\').style.display = this.parentNode.querySelector(\'.values-section-content\').style.display === \'none\' ? \'block\' : \'none\'; this.querySelector(\'.collapse-indicator\').textContent = this.querySelector(\'.collapse-indicator\').textContent === \'▼\' ? \'▶\' : \'▼\';">' +
                  '<span style="font-weight: bold; color: #2196f3;">Valores Posibles</span>' +
                  '<span class="collapse-indicator" style="font-size: 12px;">▼</span>' +
                '</div>' +
                '<div class="values-section-content" style="padding: 10px; border: 1px solid #e3f2fd; border-top: none; border-radius: 0 0 4px 4px;">' +
                  headerValuesDoc +
                '</div>' +
              '</div>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
        
        // Requerimiento JSON
        '<div id="json-requerimiento" class="json-tab-pane" style="display: none;">' +
          '<div class="json-structure-container">' +
            '<div class="json-content-panel">' +
              '<div class="json-container" style="background-color: white; padding: 10px; border: 1px solid #ddd; border-radius: 4px; max-height: 500px; overflow: auto; font-family: monospace; position: relative;">' +
                '<pre class="json-content-wrapper" style="margin: 0; color: #333;">' +
                  colorizeJsonSyntax(JSON.stringify(reorganizeJsonStructure(serviceStructure.request), null, 2)) +
                '</pre>' +
              '</div>' +
              '<div style="margin-top: 10px;">' +
                '<button id="btnCopyRequestJson" class="btn-primary" style="background-color: #007bff; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;">' +
                  'Copiar JSON Requerimiento' +
                '</button>' +
              '</div>' +
            '</div>' +
            
            // Panel de documentación de campos y valores
            '<div class="values-doc-panel">' +
              '<h3 class="values-doc-title">Documentación de Campos</h3>' +
              // Panel para la información de los campos
              generateFieldDocumentation(serviceStructure.request) +
              // Sección colapsable para los valores posibles
              (requestValuesDoc !== '<div class="no-values-message">No hay campos con valores posibles definidos.</div>' ? 
              '<div class="values-section" style="margin-top: 15px;display:none">' +
                '<div class="values-section-header" style="cursor: pointer; background-color: #e3f2fd; padding: 8px 12px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;" onclick="this.parentNode.querySelector(\'.values-section-content\').style.display = this.parentNode.querySelector(\'.values-section-content\').style.display === \'none\' ? \'block\' : \'none\'; this.querySelector(\'.collapse-indicator\').textContent = this.querySelector(\'.collapse-indicator\').textContent === \'▼\' ? \'▶\' : \'▼\';">' +
                  '<span style="font-weight: bold; color: #2196f3;">Valores Posibles</span>' +
                  '<span class="collapse-indicator" style="font-size: 12px;">▼</span>' +
                '</div>' +
                '<div class="values-section-content" style="padding: 10px; border: 1px solid #e3f2fd; border-top: none; border-radius: 0 0 4px 4px;">' +
                  requestValuesDoc +
                '</div>' +
              '</div>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
        
        // Respuesta JSON
        '<div id="json-respuesta" class="json-tab-pane" style="display: none;">' +
          '<div class="json-structure-container">' +
            '<div class="json-content-panel">' +
              '<div class="json-container" style="background-color: white; padding: 10px; border: 1px solid #ddd; border-radius: 4px; max-height: 500px; overflow: auto; font-family: monospace; position: relative;">' +
                '<pre class="json-content-wrapper" style="margin: 0; color: #333;">' +
                  colorizeJsonSyntax(JSON.stringify(reorganizeJsonStructure(serviceStructure.response), null, 2)) +
                '</pre>' +
              '</div>' +
              '<div style="margin-top: 10px;">' +
                '<button id="btnCopyResponseJson" class="btn-primary" style="background-color: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;">' +
                  'Copiar JSON Respuesta' +
                '</button>' +
              '</div>' +
            '</div>' +
            
            // Panel de documentación de campos y valores
            '<div class="values-doc-panel">' +
              '<h3 class="values-doc-title">Documentación de Campos</h3>' +
              // Panel para la información de los campos
              generateFieldDocumentation(serviceStructure.response) +
              // Sección colapsable para los valores posibles
              (responseValuesDoc !== '<div class="no-values-message">No hay campos con valores posibles definidos.</div>' ? 
              '<div class="values-section" style="margin-top: 15px;display:none">' +
                '<div class="values-section-header" style="display:none; cursor: pointer; background-color: #e3f2fd; padding: 8px 12px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;" onclick="this.parentNode.querySelector(\'.values-section-content\').style.display = this.parentNode.querySelector(\'.values-section-content\').style.display === \'none\' ? \'block\' : \'none\'; this.querySelector(\'.collapse-indicator\').textContent = this.querySelector(\'.collapse-indicator\').textContent === \'▼\' ? \'▶\' : \'▼\';">' +
                  '<span style="font-weight: bold; color: #2196f3;">Valores Posibles</span>' +
                  '<span class="collapse-indicator" style="font-size: 12px;">▼</span>' +
                '</div>' +
                '<div class="values-section-content" style="padding: 10px; border: 1px solid #e3f2fd; border-top: none; border-radius: 0 0 4px 4px;">' +
                  responseValuesDoc +
                '</div>' +
              '</div>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
  

  // Función para generar un JSON vacío basado en la estructura del requerimiento o respuesta
  function generatePayloadContent(serviceStructure) {
    // Función recursiva para crear un objeto JSON vacío a partir de la estructura
    function createEmptyJsonFromStructure(elements) {
      const result = {};
      
      // Procesar cada elemento
      elements.forEach(element => {
        if (element.type === 'field') {
          // Para campos simples, asignar un valor vacío
          result[element.name] = '';
        } else if (element.type === 'occurrence') {
          // Para ocurrencias, crear un array con un objeto vacío
          const occurrenceName = element.name || `occurrence_${element.index || 0}`;
          
          // Crear un objeto para la primera ocurrencia
          const occurrenceObj = {};
          
          // Si la ocurrencia tiene campos, procesarlos
          if (element.fields && element.fields.length > 0) {
            // Procesar los campos de la ocurrencia
            element.fields.forEach(field => {
              if (field.type === 'field') {
                // Campo simple dentro de la ocurrencia
                occurrenceObj[field.name] = '';
              } else if (field.type === 'occurrence') {
                // Ocurrencia anidada, procesar recursivamente
                const nestedResult = createEmptyJsonFromStructure([field]);
                // Agregar al objeto de ocurrencia
                Object.assign(occurrenceObj, nestedResult);
              }
            });
          }
          
          // Asignar el array con el objeto vacío
          result[occurrenceName] = [occurrenceObj];
        }
      });
      
      return result;
    }
    
    // Función para convertir el JSON a formato de texto con la sintaxis específica
    function formatJsonForPayload(json) {
      // Primero, convertir el objeto JSON a una cadena con indentación estándar
      let result = JSON.stringify(json, null, 2);
      
      // Función para aplicar indentación consistente a un bloque de contenido
      function indentContent(content, baseIndent) {
        return content.split('\n').map(line => {
          if (line.trim() === '') return line;
          // Determinar la indentación actual
          const currentIndent = line.match(/^\s*/)[0].length;
          // Calcular la nueva indentación
          const newIndent = ' '.repeat(baseIndent + (currentIndent > 0 ? 2 : 0));
          return newIndent + line.trim();
        }).join('\n');
      }
      
      // Procesar el JSON en múltiples pasadas para manejar diferentes niveles de anidamiento
      
      // Primera pasada: Formatear las ocurrencias de nivel superior
      let processedResult = result.replace(/"(occurrence_\d+|[\w-]+)": \[\s*{\s*([\s\S]*?)\s*}\s*\]/g, (match, key, content) => {
        // Indentación base para el contenido de nivel superior
        const indentedContent = indentContent(content, 6);
        return `"${key}": [ {\n${indentedContent}\n  }]`;
      });
      
      // Segunda pasada: Formatear las ocurrencias anidadas
      processedResult = processedResult.replace(/"(occurrence_\d+|[\w-]+)": \[ \{\n([\s\S]*?)\n\s*\}\]/g, (match, key, content) => {
        // Buscar ocurrencias anidadas dentro de este bloque
        const nestedContent = content.replace(/"(occurrence_\d+|[\w-]+)": \[\s*{\s*([\s\S]*?)\s*}\s*\]/g, (nestedMatch, nestedKey, nestedContent) => {
          // Indentación para contenido anidado
          const indentedNestedContent = indentContent(nestedContent, 8);
          return `"${nestedKey}": [ {\n${indentedNestedContent}\n      }]`;
        });
        
        return `"${key}": [ {\n${nestedContent}\n  }]`;
      });
      
      return processedResult;
    }
    
    // Crear un JSON vacío a partir de la estructura de requerimiento y respuesta
    const emptyRequestJson = createEmptyJsonFromStructure(serviceStructure.request.elements);
    const emptyResponseJson = createEmptyJsonFromStructure(serviceStructure.response.elements);
    
    // Formatear el JSON para mostrarlo con la sintaxis específica
    const formattedRequestJson = formatJsonForPayload(emptyRequestJson);
    const formattedResponseJson = formatJsonForPayload(emptyResponseJson);
    
    // Generar la documentación de los campos para requerimiento y respuesta
    const requestFieldDocumentation = generateFieldDocumentation(serviceStructure.request);
    const responseFieldDocumentation = generateFieldDocumentation(serviceStructure.response);
    
    // Crear el contenido HTML para la pestaña Payload con las dos sub-pestañas
    const payloadContent = `
      <div class="section">
        <div class="section-title">PAYLOAD (Estructura JSON vacía)</div>

        <!-- Sub-pestañas para Requerimiento y Salida -->
        <div class="payload-tabs-container" style="margin-top: 20px; margin-bottom: 20px;">
          <div class="payload-tabs-nav" style="display: flex; border-bottom: 2px solid #3f51b5; margin-bottom: 15px;">
            <button class="payload-tab-btn active" data-payload-tab="payload-request" 
                    style="padding: 8px 15px; background-color: #3f51b5; color: white; border: none; border-radius: 5px 5px 0 0; cursor: pointer; font-weight: 500; margin-right: 5px; transition: all 0.3s ease;">
              Requerimiento
            </button>
            <button class="payload-tab-btn" data-payload-tab="payload-response" 
                    style="padding: 8px 15px; background-color: #f5f5f5; color: #333; border: none; border-radius: 5px 5px 0 0; cursor: pointer; font-weight: 500; margin-right: 5px; transition: all 0.3s ease;">
              Salida
            </button>
          </div>
          
          <!-- Contenido de las sub-pestañas -->
          <div class="payload-tab-content" style="background-color: white; border-radius: 0 0 5px 5px; padding: 15px;">
            
            <!-- Pestaña de Requerimiento -->
            <div id="payload-request" class="payload-tab-pane active" style="display: block;">
              <div class="payload-description" style="margin-bottom: 15px;">
                Este JSON vacío mantiene la estructura del requerimiento pero con valores vacíos, 
                útil para copiar y pegar en Postman u otras herramientas para generar requests.
              </div>
              
              <div style="display: flex; gap: 20px; margin-top: 20px;">
                <!-- Panel izquierdo: JSON Editable para Requerimiento -->
                <div style="flex: 2;">
                  <div class="json-editor-container" style="background-color: white; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6; box-shadow: 0 2px 4px rgba(0,0,0,0.05); position: relative;">
                    <div style="position: absolute; top: 10px; right: 10px; z-index: 10;">
                      <button id="btnFormatRequestJson" class="btn-secondary" style="background-color: #6c757d; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 5px;">
                        <span style="font-size: 14px;">⟲</span> Formatear
                      </button>
                    </div>
                    <!-- Editor para Requerimiento -->
                    <div id="jsonRequestEditor" contenteditable="true" spellcheck="false" style="width: 100%; height: 500px; background-color: white; color: #333; border: 1px solid #ced4da; padding: 10px; font-family: 'Consolas', 'Courier New', monospace; font-size: 14px; line-height: 1.5; overflow: auto; border-radius: 4px; outline: none; white-space: pre-wrap; word-wrap: break-word;">${colorizePayloadJson(formattedRequestJson)}</div>
                  </div>
                  
                  <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button id="btnCopyRequestJson" class="btn-primary" style="flex: 1; background-color: #3498db; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <span style="margin-right: 5px;">📋</span> Copiar JSON
                    </button>
                    <button id="btnResetRequestJson" class="btn-secondary" style="flex: 1; background-color: #6c757d; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <span style="margin-right: 5px;">↺</span> Restablecer
                    </button>
                  </div>
                </div>
                
                <!-- Panel derecho: Documentación de Requerimiento -->
                <div style="flex: 1; background-color: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6; max-height: 600px; overflow: auto; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-size: small;">
                  <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 1.1em;">Documentación de Campos</h3>
                  ${requestFieldDocumentation}
                </div>
              </div>
            </div>
            
            <!-- Pestaña de Salida (Respuesta) -->
            <div id="payload-response" class="payload-tab-pane" style="display: none;">
              <div class="payload-description" style="margin-bottom: 15px;">
                Este JSON vacío mantiene la estructura de respuesta (salida) pero con valores vacíos, 
                útil para simular respuestas o documentar la estructura esperada del servidor.
              </div>
              
              <div style="display: flex; gap: 20px; margin-top: 20px;">
                <!-- Panel izquierdo: JSON Editable para Respuesta -->
                <div style="flex: 2;">
                  <div class="json-editor-container" style="background-color: white; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6; box-shadow: 0 2px 4px rgba(0,0,0,0.05); position: relative;">
                    <div style="position: absolute; top: 10px; right: 10px; z-index: 10;">
                      <button id="btnFormatResponseJson" class="btn-secondary" style="background-color: #6c757d; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 5px;">
                        <span style="font-size: 14px;">⟲</span> Formatear
                      </button>
                    </div>
                    <!-- Editor para Respuesta -->
                    <div id="jsonResponseEditor" contenteditable="true" spellcheck="false" style="width: 100%; height: 500px; background-color: white; color: #333; border: 1px solid #ced4da; padding: 10px; font-family: 'Consolas', 'Courier New', monospace; font-size: 14px; line-height: 1.5; overflow: auto; border-radius: 4px; outline: none; white-space: pre-wrap; word-wrap: break-word;">${colorizePayloadJson(formattedResponseJson)}</div>
                  </div>
                  
                  <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button id="btnCopyResponseJson" class="btn-primary" style="flex: 1; background-color: #3498db; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <span style="margin-right: 5px;">📋</span> Copiar JSON
                    </button>
                    <button id="btnResetResponseJson" class="btn-secondary" style="flex: 1; background-color: #6c757d; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <span style="margin-right: 5px;">↺</span> Restablecer
                    </button>
                  </div>
                </div>
                
                <!-- Panel derecho: Documentación de Respuesta -->
                <div style="flex: 1; background-color: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6; max-height: 600px; overflow: auto; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-size: small;">
                  <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 1.1em;">Documentación de Campos</h3>
                  ${responseFieldDocumentation}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    `;
    
    // Función para generar la documentación de los campos con estilo mejorado
    function generateFieldDocumentation(structure) {
      let documentation = '<div class="field-documentation" style="font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif;">';
      
      // Función recursiva para procesar los elementos
      function processElements(elements, level = 0, parentName = '') {
        elements.forEach(element => {
          if (element.type === 'field') {
            // Documentación para un campo simple con estilo mejorado
            documentation += `
              <div class="field-doc-item" style="
                margin-bottom: 15px; 
                padding: 12px 15px 12px ${level * 20 + 15}px;
                background-color: white; 
                border-radius: 8px; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                border-left: 4px solid #2196f3;
                transition: all 0.3s ease;
              ">
                <div style="
                  font-weight: 600; 
                  color: #2196f3; 
                  font-size: 1.05em;
                  margin-bottom: 5px;
                  display: flex;
                  align-items: center;
                ">${element.name}
                  <span style="
                    font-size: 0.7em;
                    background-color: #e3f2fd;
                    color: #2196f3;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 8px;
                  ">Campo</span>
                </div>
                <div style="color: #444; font-size: 0.8em; line-height: 1.4;">
                  <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 5px;">
                    <span style="
                      background-color: #f8f9fa; 
                      padding: 3px 8px; 
                      border-radius: 4px; 
                      display: inline-flex; 
                      align-items: center;
                    ">
                      <span style="color: #e91e63; font-weight: 500; margin-right: 4px;">Tipo:</span> 
                      <span>${element.type || 'alfanumérico'}</span>
                    </span>
                    <span style="
                      background-color: #f8f9fa; 
                      padding: 3px 8px; 
                      border-radius: 4px; 
                      display: inline-flex; 
                      align-items: center;
                    ">
                      <span style="color: #e91e63; font-weight: 500; margin-right: 4px;">Longitud:</span> 
                      <span>${element.length}</span>
                    </span>
                    ${element.required ? `
                    <span style="
                      background-color: ${element.required.toLowerCase().includes('obligatorio') ? '#fce4ec' : '#f5f5f5'}; 
                      padding: 3px 8px; 
                      border-radius: 4px; 
                      display: inline-flex; 
                      align-items: center;
                    ">
                      <span style="color: ${element.required.toLowerCase().includes('obligatorio') ? '#e91e63' : '#757575'}; font-weight: 500; margin-right: 4px;">Requerido:</span> 
                      <span>${element.required}</span>
                    </span>` : ''}
                  </div>
                  ${element.description ? `
                  <div style="
                    margin-top: 8px; 
                    padding: 8px; 
                    background-color: #f5f5f5; 
                    border-radius: 4px; 
                    font-style: italic;
                  ">

                    <span style="color: #757575;"></span> ${element.description}
                  </div>` : ''}
                </div>
              </div>
            `;
          } else if (element.type === 'occurrence') {
            // Documentación para una ocurrencia con estilo mejorado
            const occurrenceName = element.name || `occurrence_${element.index || 0}`;
            
            documentation += `
              <div class="occurrence-doc-item" style="
                margin: 20px 0; 
                padding: 15px; 
                padding-left: ${level * 20 + 15}px;
                background-color: #f1f8e9; 
                border-radius: 8px; 
                border-left: 5px solid #4caf50;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
              ">
                <div style="
                  font-weight: 600; 
                  color: #2e7d32; 
                  font-size: 1.1em;
                  margin-bottom: 8px;
                  display: flex;
                  align-items: center;
                ">${occurrenceName}
                  <span style="
                    font-size: 0.75em;
                    background-color: #c8e6c9;
                    color: #2e7d32;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 8px;
                  ">Ocurrencia</span>
                </div>
                <div style="
                  color: #444; 
                  font-size: 0.9em; 
                  margin-bottom: 12px;
                  background-color: white;
                  padding: 8px 12px;
                  border-radius: 6px;
                ">
                  <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                    <span style="
                      background-color: #f5f5f5; 
                      padding: 3px 8px; 
                      border-radius: 4px; 
                      display: inline-flex; 
                      align-items: center;
                    ">
                      <span style="color: #e91e63; font-weight: 500; margin-right: 4px;">Cantidad:</span> 
                      <span>${element.count || 1}</span>
                    </span>
                  </div>

                  ${element.description ? `

                  <div style="
                    margin-top: 8px; 
                    padding: 8px; 
                    background-color: #f5f5f5; 
                    border-radius: 4px; 
                    font-style: italic;
                  ">
                    <span style="color: #757575;"></span> ${element.description}
                  </div>` : ''}
                </div>
                
                ${element.fields && element.fields.length > 0 ? `
                <div style="
                  margin-top: 10px;
                  margin-left: 10px;
                  padding-left: 10px;
                  border-left: 2px dashed #4caf50;
                ">` : ''}
            `;
            
            // Procesar los campos de la ocurrencia
            if (element.fields && element.fields.length > 0) {
              processElements(element.fields, level + 1, occurrenceName);
              documentation += `</div>`;
            }
            
            documentation += `</div>`;
          }
        });
      }
      
      // Procesar los elementos de la estructura
      if (structure.elements && structure.elements.length > 0) {
        processElements(structure.elements);
      } else {
        documentation += `
          <div style="
            padding: 20px; 
            text-align: center; 
            color: #757575; 
            background-color: #f5f5f5; 
            border-radius: 8px;
            margin: 20px 0;
          ">
            No hay información de campos disponible.
          </div>
        `;
      }
      
      documentation += '</div>';
      return documentation;
    }
    
    // Agregar manejadores para los botones después de que se inserte el contenido
    setTimeout(() => {
      // Botón para copiar el JSON editado
      const btnCopyPayloadJson = document.getElementById('btnCopyPayloadJson');
      const jsonPayloadEditor = document.getElementById('jsonPayloadEditor');
      
      if (btnCopyPayloadJson && jsonPayloadEditor) {
        btnCopyPayloadJson.addEventListener('click', function() {
          // Copiar el contenido actual del editor (sin formato HTML)
          const textContent = jsonPayloadEditor.textContent || jsonPayloadEditor.innerText;
          navigator.clipboard.writeText(textContent)
            .then(() => {
              this.innerHTML = '<span style="margin-right: 5px;">✓</span> ¡Copiado!';
              setTimeout(() => {
                this.innerHTML = '<span style="margin-right: 5px;">📋</span> Copiar JSON';
              }, 2000);
            })
            .catch(err => {
              console.error('Error al copiar:', err);
              this.innerHTML = '<span style="margin-right: 5px;">❌</span> Error al copiar';
            });
        });
      }
      
      // Botón para formatear el JSON
      const btnFormatPayloadJson = document.getElementById('btnFormatPayloadJson');
      if (btnFormatPayloadJson && jsonPayloadEditor) {
        btnFormatPayloadJson.addEventListener('click', function() {
          try {
            // Obtener el texto sin formato HTML
            const textContent = jsonPayloadEditor.textContent || jsonPayloadEditor.innerText;
            
            // Intentar parsear el JSON actual
            const jsonObj = JSON.parse(textContent);
            
            // Formatear el JSON y actualizar el editor con colores
            const formattedJson = JSON.stringify(jsonObj, null, 2);
            jsonPayloadEditor.innerHTML = colorizePayloadJson(formattedJson);
            
            // Mostrar mensaje de éxito
            this.innerHTML = '<span style="font-size: 14px;">✓</span> Formateado';
            setTimeout(() => {
              this.innerHTML = '<span style="font-size: 14px;">⟲</span> Formatear';
            }, 2000);
          } catch (err) {
            console.error('Error al formatear JSON:', err);
            alert('Error al formatear JSON: ' + err.message);
          }
        });
      }
      
      // Botón para restablecer el JSON original
      const btnResetPayloadJson = document.getElementById('btnResetPayloadJson');
      if (btnResetPayloadJson && jsonPayloadEditor) {
        btnResetPayloadJson.addEventListener('click', function() {
          // Restablecer el JSON original con colores
          jsonPayloadEditor.innerHTML = colorizePayloadJson(formattedJson);
          
          // Mostrar mensaje de éxito
          this.innerHTML = '<span style="margin-right: 5px;">✓</span> Restablecido';
          setTimeout(() => {
            this.innerHTML = '<span style="margin-right: 5px;">↺</span> Restablecer';
          }, 2000);
        });
      }
    }, 500);
    
    return payloadContent;
  }
  
  // Generar contenido para la pestaña Payload
  const payloadContent = generatePayloadContent(serviceStructure);
  
  // Insertar el contenido en las pestañas correspondientes
  document.getElementById('cabecera').innerHTML = headerContent;
  document.getElementById('requerimiento').innerHTML = requestContent;
  document.getElementById('respuesta').innerHTML = responseContent;
  document.getElementById('json').innerHTML = jsonContent;
  document.getElementById('payload').innerHTML = payloadContent;
  
  // Inicializar la funcionalidad de las pestañas
  initializeTabs();
  
  // Inicializar las sub-pestañas de JSON
  setTimeout(() => {
    initializeJsonTabs();
    
    // Inicializar los botones de colapsar JSON
    const collapseJsonButtons = document.querySelectorAll('.btn-collapse-json');
    collapseJsonButtons.forEach(button => {
      if (!button.hasAttribute('data-handler-attached')) {
        button.addEventListener('click', function() {
          const container = this.closest('.json-container');
          const collapsibles = container.querySelectorAll('.json-collapsible');
          
          if (this.textContent.includes('Colapsar')) {
            // Colapsar todo
            collapsibles.forEach(el => {
              el.classList.add('json-collapsed');
              const content = el.nextElementSibling;
              if (content && content.classList.contains('json-content')) {
                content.style.display = 'none';
              }
            });
            this.textContent = 'Expandir Todo';
          } else {
            // Expandir todo
            collapsibles.forEach(el => {
              el.classList.remove('json-collapsed');
              const content = el.nextElementSibling;
              if (content && content.classList.contains('json-content')) {
                content.style.display = 'block';
              }
            });
            this.textContent = 'Colapsar Todo';
          }
        });
        button.setAttribute('data-handler-attached', 'true');
        console.log('Manejador agregado a botón de colapsar JSON');
      }
    });
  }, 500);
  
  return ""; // No necesitamos devolver contenido ya que lo insertamos directamente en las pestañas
}
