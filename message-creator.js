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
    let message = '';
    for (const field of headerStructure.fields) {
        // Obtener el valor del campo de los datos proporcionados o usar un valor por defecto
        let value = '';
        if (messageData.header && messageData.header[field.name] !== undefined) {
            value = messageData.header[field.name];
        } else {
            // Usar valor por defecto según el tipo de campo
            value = getDefaultValueForField(field);
        }
        
        // Formatear el valor según el tipo y longitud del campo
        value = formatValue(value, field);
        
        // Agregar el valor al mensaje
        message += value;
    }
    
    // Generar los datos del servicio
    let serviceData = '';
    
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
    
    // Función recursiva para generar datos de ocurrencias
    const generateOccurrenceData = (occurrenceStructure, occurrenceData, count) => {
        let result = '';
        
        // Generar datos para cada ocurrencia
        for (let i = 0; i < count; i++) {
            const currentOccurrenceData = occurrenceData && occurrenceData[i] ? occurrenceData[i] : {};
            
            // Generar datos para cada campo de la ocurrencia
            for (const field of occurrenceStructure.fields) {
                let value = '';
                if (currentOccurrenceData[field.name] !== undefined) {
                    value = currentOccurrenceData[field.name];
                } else {
                    // Usar valor por defecto
                    value = getDefaultValueForField(field);
                }
                
                // Formatear el valor
                value = formatValue(value, field);
                
                // Agregar el valor al resultado
                result += value;
            }
        }
        
        // Si hay menos ocurrencias que el máximo, rellenar con valores por defecto
        for (let i = count; i < occurrenceStructure.count; i++) {
            for (const field of occurrenceStructure.fields) {
                // Usar valor por defecto
                const value = getDefaultValueForField(field);
                
                // Formatear el valor
                const formattedValue = formatValue(value, field);
                
                // Agregar el valor al resultado
                result += formattedValue;
            }
        }
        
        return result;
    };
    
    // Procesar campos y ocurrencias
    for (const field of sectionStructure.fields) {
        // Obtener el valor del campo
        let value = '';
        if (messageData.data && messageData.data[field.name] !== undefined) {
            value = messageData.data[field.name];
        } else {
            // Usar valor por defecto
            value = getDefaultValueForField(field);
        }
        
        // Formatear el valor
        value = formatValue(value, field);
        
        // Agregar el valor al mensaje
        serviceData += value;
        
        // Verificar si este campo precede a una sección de ocurrencias
        const occurrenceSection = sectionStructure.occurrenceSections
            .find(os => os.previousField === field.name);
        
        if (occurrenceSection) {
            // Obtener el número de ocurrencias (del valor del campo que acabamos de procesar)
            const count = parseInt(value) || 0;
            
            // Obtener los datos de las ocurrencias
            const occurrenceArrayName = field.name.toLowerCase() + '_occurrences';
            const occurrenceData = messageData.data[occurrenceArrayName];
            
            // Generar datos para las ocurrencias
            serviceData += generateOccurrenceData(occurrenceSection, occurrenceData, count);
        }
    }
    
    // Calcular la longitud total del mensaje
    const headerLength = message.length;
    const serviceLength = serviceData.length;
    const totalLength = headerLength + serviceLength;
    
    // Actualizar la longitud del mensaje en la cabecera
    const lengthField = headerStructure.fields.find(f => f.name === 'LONGITUD DEL MENSAJE');
    
    if (lengthField) {
        const lengthValue = formatValue(totalLength.toString(), lengthField);
        message = lengthValue + message.substring(lengthField.length);
    }
    
    // Mostrar información de longitud en la consola
    console.log(`Longitud de la cabecera: ${headerLength} caracteres`);
    console.log(`Longitud del servicio (${section}): ${serviceLength} caracteres`);
    console.log(`Longitud total del mensaje: ${totalLength} caracteres`);
    
    // Verificar si la longitud calculada coincide con la esperada
    const expectedLength = calculateSectionLength(sectionStructure);
    if (serviceLength !== expectedLength) {
        console.warn(`ADVERTENCIA: La longitud calculada del servicio (${serviceLength}) no coincide con la longitud esperada (${expectedLength})`);
    }
    
    // Devolver el mensaje completo
    return message + serviceData;
}

  // --- PROCESAMIENTO DE ESTRUCTURAS ---
  
  // Procesar campos de la cabecera
  function processHeaderFields() {
    if (!headerStructure || !headerStructure.fields || !Array.isArray(headerStructure.fields)) {
      console.warn("Estructura de cabecera no válida");
      return;
    }
    
    for (const field of headerStructure.fields) {
      let value;
      
      // 1. Intentar usar un valor de la lista de valores permitidos
      if (field.values) {
        value = selectFromAllowedValues(field.values, field);
      }
      
      // 2. Si no hay valor permitido o no se pudo seleccionar, generar según nombre/tipo
      if (!value) {
        // Generar valores especiales para campos conocidos de la cabecera
        const fieldName = field.name.toUpperCase();
        
        switch (fieldName) {
          case 'LONGITUD DEL MENSAJE':
            // Se calculará automáticamente en createMessage
            value = 0;
            break;
            
          case 'CANAL':
            value = '01'; // Canal por defecto
            break;
            
          case 'SERVICIO':
            // Usar el número del servicio si está disponible
            value = serviceStructure.serviceNumber || '0000';
            break;
            
          case 'CÓDIGO DE RETORNO':
          case 'CODIGO DE RETORNO':
            value = section === 'request' ? '0000' : '0001';
            break;
            
          case 'ID DEL MENSAJE':
          case 'ID DEL MENS':
            value = generateRandomNumber(field.length || 9);
            break;
            
          case 'FECHA':
            value = generateRandomDate();
            break;
            
          case 'HORA':
            value = generateTime();
            break;
            
          case 'USUARIO':
          case 'CLAVE':
            value = 'USR' + generateRandomAlphanumeric(field.length - 3);
            break;
            
          case 'UBICACIÓN':
          case 'UBICACION':
            value = generateRandomNumber(field.length || 4);
            break;
            
          case 'TEXTO DEL CÓDIGO DE RETORNO':
          case 'TEXTO CODIGO RETORNO':
            value = section === 'request' ? '' : 'OPERACION PROCESADA';
            break;
            
          case 'ESTADO ENVIADO':
            value = section === 'request' ? '00' : '01';
            break;
            
          default:
            // Para otros campos, generar según el tipo
            value = generateValueByType(field, isFieldRequired(field));
        }
      }
      
      // Asignar el valor generado
      messageData.header[field.name] = value;
    }
  }
  
  // Procesar estructura de servicio
  function processServiceStructure() {

    const sectionStructure = serviceStructure[section];
    
    if (!sectionStructure || !sectionStructure.elements || !Array.isArray(sectionStructure.elements)) {
      console.warn(`Estructura de sección '${section}' no válida`);
      return;
    }
    
    // Preparar un registro de los campos contadores y sus ocurrencias asociadas
    const counterFields = new Map();
    
    // Primera pasada: identificar campos contadores y sus ocurrencias
    for (let i = 0; i < sectionStructure.elements.length - 1; i++) {
      const element = sectionStructure.elements[i];
      const nextElement = sectionStructure.elements[i + 1];
      
      if (element.type === 'field' && 
          nextElement.type === 'occurrence' && 
          element.name.toLowerCase().includes('cant')) {
        counterFields.set(element.name, nextElement);
      }
    }
    
    // Procesar elementos (recursivo)
    processElements(sectionStructure.elements, messageData.data, counterFields);
  }

// Función auxiliar para formatear valores
function formatValue(value, field) {
  if (!field) {
    console.error('Error: Campo no definido en formatValue');
    return '';
  }
  
  // Convertir el valor a string
  let strValue = String(value || '');
  
  // Determinar el tipo de campo
  const fieldType = field.fieldType || field.type || 'alfanumerico';
  
  // Formatear según el tipo
  if (fieldType.toLowerCase().includes('numerico') || fieldType.toLowerCase().includes('numeric')) {
    // Para campos numéricos, rellenar con ceros a la izquierda
    return strValue.padStart(field.length, '0').substring(0, field.length);
  } else {
    // Para campos alfanuméricos, rellenar con espacios a la derecha
    return strValue.padEnd(field.length, ' ').substring(0, field.length);
  }
}

// Función para obtener un valor por defecto para un campo
function getDefaultValueForField(field) {
  if (!field) {
    console.error('Error: Campo no definido en getDefaultValueForField');
    return '';
  }
  
  // Determinar el tipo de campo
  const fieldType = field.fieldType || field.type || 'alfanumerico';
  
  // Generar valor por defecto según el tipo
  if (fieldType.toLowerCase().includes('numerico') || fieldType.toLowerCase().includes('numeric')) {
    // Para campos numéricos, rellenar con ceros
    return '0'.repeat(field.length);
  } else {
    // Para campos alfanuméricos, rellenar con espacios
    return ' '.repeat(field.length);
  }
}

// Función auxiliar para rellenar con ceros a la izquierda
function padLeft(value, length, char = '0') {
  return String(value).padStart(length, char);
}

// Función auxiliar para rellenar con espacios a la derecha
function padRight(value, length, char = ' ') {
  return String(value).padEnd(length, char);
}

/**
 * Genera datos aleatorios para un mensaje
 * @param {Object} headerStructure - Estructura de la cabecera
 * @param {Object} serviceStructure - Estructura del servicio
 * @param {string} section - Sección a generar ('request' o 'response')
 * @returns {Object} Datos generados para el mensaje
 */
function generateDynamicMessageData(headerStructure, serviceStructure, section = 'request') {
  // Crear un objeto de datos vacío
  const messageData = {
    header: {},
    data: {},
    section: section
  };
  
  return messageData;
}

function generateDynamicMessage(headerStructure, serviceStructure, section = 'request') {
  // Crear un objeto de datos vacío
  const data = {
    header: {},
    data: {},
    section: section
  };
  
  // Crear el mensaje con los datos generados
  const message = createMessage(headerStructure, serviceStructure, data, section);
  
  return {
    data: data,
    message: message
  };
}

function selectFromAllowedValues(valuesString, field) {
  if (!valuesString || typeof valuesString !== 'string') {
      return null;
  }

  const valuesText = valuesString.toUpperCase();
  const isTodayDatePattern = /DD\/MM\/AAAA.*FECHA DEL D[IÍ]A/.test(valuesText);
  const isAnyDatePattern = /DD\/MM\/AAAA/.test(valuesText);

  if (field.fieldType === 'alfanumerico' && isAnyDatePattern) {
      let date;
      if (isTodayDatePattern) {
          date = new Date();
      } else {
          const start = new Date(2020, 0, 1);
          const end = new Date();
          date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      }
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`.padEnd(field.length, ' ').substring(0, field.length);
  }

  let options = [];

  try {
      if (/\d+=/.test(valuesString)) {
          options = valuesString
              .split(/\r?\n/)
              .map(line => line.trim())
              .filter(Boolean)
              .map(line => line.split('=')[0].trim())
              .filter(key => /^\d+$/.test(key));

          if (options.length > 0) {
              const random = options[Math.floor(Math.random() * options.length)];
              return field.fieldType === 'numerico'
                  ? String(random).padStart(field.length, '0')
                  : String(random).padEnd(field.length, ' ').substring(0, field.length);
          }
      }

      if (/\n\d{2,}\s+/.test(valuesString)) {
          options = valuesString
              .split(/\r?\n/)
              .map(line => line.trim())
              .filter(Boolean)
              .map(line => line.split(/\s+/)[0])
              .filter(key => /^\d+$/.test(key));

          if (options.length > 0) {
              const random = options[Math.floor(Math.random() * options.length)];
              return field.fieldType === 'numerico'
                  ? String(random).padStart(field.length, '0')
                  : String(random).padEnd(field.length, ' ').substring(0, field.length);
          }
      }

      if (valuesString.includes(',')) {
          options = valuesString.split(',').map(v => v.trim()).filter(Boolean);
          const value = options[Math.floor(Math.random() * options.length)];
          return field.fieldType === 'numerico'
              ? String(value).padStart(field.length, '0')
              : String(value).padEnd(field.length, ' ').substring(0, field.length);
      }

      return null;
  } catch (e) {
      console.warn("Error al analizar valores permitidos:", e);
      return null;
  }
}

// Generar fecha aleatoria en formato YYMMDD
function generateRandomDate() {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * 365); // Un año atrás máximo
  const date = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
  
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}${month}${day}`;
}

// Generar hora actual en formato HHMMSS
function generateTime() {
  const date = new Date();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}${minutes}${seconds}`;
}

// Función sugerida para generar valores por defecto basados en tipo y 'values'
const suggestValue = (field) => {
  const valuesHint = field.values || '';
  const suggested = selectFromAllowedValues(valuesHint, field);
  if (suggested) return suggested;

  return field.fieldType === 'numerico'
      ? ''.padStart(field.length, '0')
      : 'X'.repeat(Math.min(5, field.length)).padEnd(field.length, ' ');
};

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
                  value = suggestValue(element);
              }

              // Use the field type as defined in the Excel file
              const fieldType = element.fieldType;
              
              // Log the field name and type for debugging
              console.log(`Processing field: ${element.name}, type: ${fieldType}`);
              
              segmentData += formatValue(value, element.length, fieldType);

          } else if (element.type === 'occurrence') {
              const occurrenceArrayName = `occurrence_${element.index}`;
              const occurrences = dataContext[occurrenceArrayName] || [];
              const occurrenceCount = Math.min(occurrences.length, element.count);

              segmentData += formatValue(occurrenceCount, element.countFieldLength ?? 2, 'number');

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
                          value = suggestValue(field);
                      }

                      // Use the field type as defined in the Excel file
                      const fieldType = field.fieldType;
                      
                      // Log the field name and type for debugging
                      console.log(`Processing occurrence field: ${field.name}, type: ${fieldType}`);
                      
                      segmentData += formatValue(value, field.length, fieldType);
                  }
              }

              const remainingOccurrences = element.count - occurrenceCount;
              if (remainingOccurrences > 0) {
                  const padding = element.fields.map(f => formatValue(suggestValue(f), f.length, f.fieldType)).join('');
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
        'FECHA': values.fecha || values.date || `${today.getFullYear()}${padLeft((today.getMonth() + 1), 2, '0')}${padLeft(today.getDate(), 2, '0')}`,
        'HORA': values.hora || values.time || `${padLeft(today.getHours(), 2, '0')}${padLeft(today.getMinutes(), 2, '0')}${padLeft(today.getSeconds(), 2, '0')}`,
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

        // If still no value, default to empty string
        if (value === undefined) {
            value = '';
        }
        
        // Formatear el valor según el tipo de campo
        header += formatValue(value, field.length, field.type);
    }
    
    return header;
}
