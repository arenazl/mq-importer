/**
 * Functions for parsing structure from Excel files
 */

/**
 * Parsea la estructura de la cabecera desde un archivo Excel
 * @param {ArrayBuffer} fileBuffer - Buffer del archivo Excel
 * @returns {Object} Estructura de la cabecera
 */
function parseHeaderStructure(fileBuffer) {
  // Leer el libro de Excel
  const workbook = XLSX.read(fileBuffer, { 
    type: 'buffer',
    cellStyles: true,
    cellFormulas: true,
    cellDates: true,
    cellNF: true,
    sheetStubs: true
  });
  
  // Buscar la hoja de "Cabecera Servicios"
  let headerSheetName = null;
  
  // Buscar por nombre exacto primero
  const exactMatch = workbook.SheetNames.find(name => 
    name.toLowerCase().includes('cabecera') && name.toLowerCase().includes('servicio'));
  
  if (exactMatch) {
    headerSheetName = exactMatch;
    console.log(`Hoja de cabecera encontrada por nombre: ${headerSheetName}`);
  } else {
    // Si no hay coincidencia exacta, buscar la hoja que contenga 'CABECERA DE SERVICIOS'
    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const tempSheet = workbook.Sheets[workbook.SheetNames[i]];
      const tempData = XLSX.utils.sheet_to_json(tempSheet, { header: 1, defval: '', raw: false });
      
      for (let row = 0; row < Math.min(20, tempData.length); row++) {
        if (!tempData[row]) continue;
        
        // Buscar 'CABECERA DE SERVICIOS' en cualquier celda de la fila
        for (let col = 0; col < tempData[row].length; col++) {
          if (tempData[row][col] && 
              typeof tempData[row][col] === 'string' && 
              tempData[row][col].includes('CABECERA DE SERVICIOS')) {
            headerSheetName = workbook.SheetNames[i];
            console.log(`Hoja de cabecera encontrada por contenido: ${headerSheetName}`);
            break;
          }
        }
        if (headerSheetName) break;
      }
      if (headerSheetName) break;
    }
  }
  
  // Si aún no encontramos, usar la primera hoja
  if (!headerSheetName) {
    headerSheetName = workbook.SheetNames[0];
    console.log(`No se encontró hoja específica de cabecera, usando la primera hoja: ${headerSheetName}`);
  }
  
  const worksheet = workbook.Sheets[headerSheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: '',
    raw: false
  });
  
  // Mostrar las primeras filas para depuración
  console.log("Primeras 5 filas de datos de cabecera:");
  data.slice(0, 5).forEach((row, index) => {
      console.log(`Fila ${index}:`, JSON.stringify(row));
  });
  
  // Estructura para almacenar los campos de la cabecera
  const headerStructure = {
    totalLength: 0,
    fields: []
  };
  
  // Función para encontrar la primera celda no vacía en una fila
  function findFirstNonEmptyCell(row) {
    if (!row || !Array.isArray(row)) return -1;
    
    for (let i = 0; i < row.length; i++) {
      if (row[i] && String(row[i]).trim() !== '') {
        return i;
      }
    }
    return -1;
  }
  
  // Función para encontrar texto específico en una fila
  function findTextIndexInRow(row, searchText) {
    if (!row || !Array.isArray(row)) return -1;
    
    for (let i = 0; i < row.length; i++) {
      if (row[i] && typeof row[i] === 'string' && row[i].includes(searchText)) {
        return i;
      }
    }
    return -1;
  }
  
  // Procesar filas
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    
    // Saltar filas vacías
    if (!row || row.length === 0) continue;
    
    // Buscar la fila que contiene "CABECERA DE SERVICIOS" para obtener la longitud total
    const cabeceraIndex = findTextIndexInRow(row, 'CABECERA DE SERVICIOS');
    if (cabeceraIndex >= 0) {
      // Buscar la longitud en las celdas siguientes
      for (let i = cabeceraIndex + 1; i < row.length; i++) {
        if (row[i] && String(row[i]).trim() !== '') {
          const length = parseInt(String(row[i]).trim(), 10);
          if (!isNaN(length)) {
            headerStructure.totalLength = length;
            console.log(`Longitud total de cabecera: ${headerStructure.totalLength}`);
            break;
          }
        }
      }
      continue;
    }
    
    // Procesar campos (buscando un patrón de nombre seguido por longitud numérica)
    const firstNonEmptyIndex = findFirstNonEmptyCell(row);
    if (firstNonEmptyIndex === -1) continue;
    
    const fieldName = String(row[firstNonEmptyIndex]).trim();
    
    // Filtrar filas de título o secciones
    if (fieldName.includes('AREA GENERAL') || 
        fieldName.includes('DATOS ENVIADOS') || 
        fieldName.includes('MAXIMA LONGITUD') ||
        fieldName.includes('CABECERA DE SERVICIOS')) {
      continue;
    }
    
    // Buscar la longitud (debería ser un número en alguna celda siguiente)
    let fieldLength = 0;
    let fieldLengthIndex = -1;
    
    for (let i = firstNonEmptyIndex + 1; i < row.length; i++) {
      if (row[i] && String(row[i]).trim() !== '') {
        const length = parseInt(String(row[i]).trim(), 10);
        if (!isNaN(length)) {
          fieldLength = length;
          fieldLengthIndex = i;
          break;
        }
      }
    }
    
    // Solo procesar si encontramos una longitud válida
    if (fieldLengthIndex >= 0) {
      // Buscar los valores restantes en las posiciones siguientes
      let fieldTypeIndex = -1;
      let fieldRequiredIndex = -1;
      let fieldValuesIndex = -1;
      let fieldDescriptionIndex = -1;
      
      // Tipo (siguiente celda no vacía después de la longitud)
      for (let i = fieldLengthIndex + 1; i < row.length; i++) {
        if (row[i] && String(row[i]).trim() !== '') {
          fieldTypeIndex = i;
          break;
        }
      }
      
      // Requerido (siguiente celda no vacía después del tipo)
      if (fieldTypeIndex >= 0) {
        for (let i = fieldTypeIndex + 1; i < row.length; i++) {
          if (row[i] && String(row[i]).trim() !== '') {
            fieldRequiredIndex = i;
            break;
          }
        }
      }
      
      // Valores (siguiente celda no vacía después de requerido)
      if (fieldRequiredIndex >= 0) {
        for (let i = fieldRequiredIndex + 1; i < row.length; i++) {
          if (row[i] && String(row[i]).trim() !== '') {
            fieldValuesIndex = i;
            break;
          }
        }
      }
      
      // Descripción (siguiente celda no vacía después de valores)
      if (fieldValuesIndex >= 0) {
        for (let i = fieldValuesIndex + 1; i < row.length; i++) {
          if (row[i] && String(row[i]).trim() !== '') {
            fieldDescriptionIndex = i;
            break;
          }
        }
      }
      
      // Crear objeto de campo
      const field = {
        name: fieldName,
        length: fieldLength,
        type: (fieldTypeIndex >= 0) ? String(row[fieldTypeIndex] || '').trim() : '',
        required: (fieldRequiredIndex >= 0) ? String(row[fieldRequiredIndex] || '').trim() : '',
        values: (fieldValuesIndex >= 0) ? String(row[fieldValuesIndex] || '').trim() : '',
        description: (fieldDescriptionIndex >= 0) ? String(row[fieldDescriptionIndex] || '').trim() : ''
      };
      
      headerStructure.fields.push(field);
      console.log(`Campo agregado a cabecera: ${fieldName} (longitud: ${fieldLength})`);
    }
  }
  
  // Validar la longitud total
  const calculatedLength = headerStructure.fields.reduce((sum, field) => sum + field.length, 0);
  console.log(`Longitud calculada: ${calculatedLength}, Longitud declarada: ${headerStructure.totalLength}`);
  
  if (headerStructure.totalLength > 0 && calculatedLength !== headerStructure.totalLength) {
    console.warn(`ADVERTENCIA: La longitud calculada de la cabecera (${calculatedLength}) no coincide con la longitud declarada (${headerStructure.totalLength})`);
  }
  
  // Imprimir resumen
  console.log("\nResumen de la cabecera:");
  console.log(`- Total de campos: ${headerStructure.fields.length}`);
  console.log(`- Longitud total: ${headerStructure.totalLength}`);
  
  return headerStructure;
}

/**
 * Parsea una estructura de servicio desde un archivo Excel con enfoque unificado
 * Los campos y ocurrencias se almacenan en una única lista secuencial
 * 
 * @param {Buffer} fileBuffer - El buffer del archivo Excel
 * @returns {Object} - Estructura de servicio parseada
 */
function parseServiceStructure(fileBuffer) {
    // Leer el archivo Excel
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Siempre usar la segunda solapa (índice 1), o la primera si solo hay una
    const sheetName = workbook.SheetNames.length > 1 ? workbook.SheetNames[1] : workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
    
    // Obtener número de servicio del nombre de la hoja
    let serviceNumber = null;
    const serviceMatch = sheetName.match(/(\d{4})/) || sheetName.match(/SVC(\d+)/i);
    if (serviceMatch) {
        serviceNumber = serviceMatch[1];
    }

    // --- Mapeo de Columnas (índice base 0) ---
    const COL_FIELD_NAME = 1; // Columna B
    const COL_LENGTH = 2;     // Columna C
    const COL_TYPE = 3;       // Columna D
    const COL_REQUIRED = 4;   // Columna E
    const COL_VALUES = 5;     // Columna F
    const COL_DESC = 6;       // Columna G

    // --- Estructura de salida unificada ---
    const structure = {
        serviceNumber: serviceNumber,
        request: { 
            totalLength: 0, 
            elements: [],   // Lista unificada de elementos (campos y ocurrencias)
            fieldCount: 0,
            occurrenceCount: 0
        },
        response: { 
            totalLength: 0, 
            elements: [],
            fieldCount: 0,
            occurrenceCount: 0
        }
    };

    // --- Funciones para crear elementos ---
    // Crear campo normal
    const createField = (row, index) => {
        const fieldName = String(row[COL_FIELD_NAME] || '').trim();
        const fieldType = String(row[COL_TYPE] || '').trim();
        
        // Log field information for debugging
        console.log(`Parsing field: ${fieldName}, type from Excel: ${fieldType}`);
        
        return {
            type: 'field',
            index: index,
            name: fieldName,
            length: parseInt(row[COL_LENGTH], 10) || 0,
            fieldType: fieldType,
            required: String(row[COL_REQUIRED] || '').trim(),
            values: String(row[COL_VALUES] || '').trim(),
            description: String(row[COL_DESC] || '').trim()
        };
    };
    
    // Crear ocurrencia
    const createOccurrence = (count, index, level, parentId = null) => {
        // Crear un ID único para la ocurrencia
        // Si tiene un parentId, usar el formato "parentId_index"
        const occId = parentId ? `${parentId}_${index}` : `occ_${index}`;
        
        return {
            type: 'occurrence',
            index: index,
            id: occId,        // ID único para la ocurrencia
            count: count,
            fields: [],       // Campos dentro de la ocurrencia
            level: level,
            parentId: parentId // ID de la ocurrencia padre (si existe)
        };
    };

    // --- Variables de estado para el procesamiento ---
    let currentSection = null;    // 'request' o 'response'
    let occurrenceStack = [];     // Pila para rastrear ocurrencias anidadas
    let occurrenceLevel = 0;      // Nivel actual de anidamiento
    let currentIndex = 0;         // Índice actual en la lista unificada

    // --- Procesamiento principal ---
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        if (!row || row.length === 0) continue;

        const fieldName = String(row[COL_FIELD_NAME] || '').trim();
        const lengthValue = String(row[COL_LENGTH] || '').trim();
        const normalizedFieldName = fieldName.toUpperCase();

        // --- Detectar sección principal (REQUERIMIENTO/RESPUESTA) ---
        if (normalizedFieldName === 'REQUERIMIENTO') {
            currentSection = 'request';
            structure.request.totalLength = parseInt(lengthValue, 10) || 0;
            occurrenceStack = [];
            occurrenceLevel = 0;
            currentIndex = 0;
            continue;
        }
        
        if (normalizedFieldName === 'RESPUESTA') {
            currentSection = 'response';
            structure.response.totalLength = parseInt(lengthValue, 10) || 0;
            occurrenceStack = [];
            occurrenceLevel = 0;
            currentIndex = 0;
            continue;
        }

        // Si no hay sección activa, omitir
        if (!currentSection) continue;

        // --- Detectar inicio de ocurrencia ---
        const occurrenceMatch = normalizedFieldName.match(/(\d+)\s+OCURRENCIA(?:S)?\s+INFORMADA(?:S)?/i);
        if (occurrenceMatch) {
            // Incrementar nivel de anidamiento
            occurrenceLevel++;
            
            // Crear nueva ocurrencia
            const count = parseInt(occurrenceMatch[1], 10) || 0;
            const newOccurrence = createOccurrence(count, currentIndex++, occurrenceLevel);
            
            // Obtener el ID del padre si existe
            const parentId = occurrenceStack.length > 0 ? occurrenceStack[occurrenceStack.length - 1].id : null;
            
            // Actualizar el parentId de la ocurrencia
            newOccurrence.parentId = parentId;
            
            // Si es una ocurrencia de nivel 1 o superior, no la agregamos a la lista principal
            // Solo la agregamos a la pila para que sus campos se agreguen a ella
            if (occurrenceLevel === 1) {
                // Ocurrencia de nivel 1, agregar a la lista principal
                structure[currentSection].elements.push(newOccurrence);
                structure[currentSection].occurrenceCount++;
                
                // Nueva ocurrencia principal
                occurrenceStack = [newOccurrence];
            } else if (occurrenceLevel > 1 && occurrenceStack.length > 0) {
                // Ocurrencia anidada, no la agregamos a la lista principal
                // Solo la agregamos a la pila para que sus campos se agreguen a ella
                occurrenceStack.push(newOccurrence);
            }
            continue;
        }

        // --- Detectar fin de ocurrencia ---
        if (normalizedFieldName === 'FIN OCURRENCIA') {
            if (occurrenceLevel > 0) {
                // Reducir nivel de anidamiento
                occurrenceLevel--;
                
                // Si estamos saliendo de una ocurrencia de nivel > 1, agregarla a su padre
                if (occurrenceLevel >= 1 && occurrenceStack.length >= 2) {
                    const childOccurrence = occurrenceStack.pop();
                    const parentOccurrence = occurrenceStack[occurrenceStack.length - 1];
                    
                    // Asegurarse de que el parentId del hijo sea el ID del padre
                    childOccurrence.parentId = parentOccurrence.id;
                    
                    // Inicializar el array de children si no existe
                    if (!parentOccurrence.children) {
                        parentOccurrence.children = [];
                    }
                    
                    // Agregar la ocurrencia hija al padre
                    parentOccurrence.children.push(childOccurrence);
                } else if (occurrenceStack.length > 0) {
                    // Solo desapilar la última ocurrencia
                    occurrenceStack.pop();
                }
            }
            continue;
        }

        // --- Procesar campos ---
        // Sólo procesar filas que comienzan con SVC y tienen un valor numérico en la columna de longitud
        if (fieldName.startsWith('SVC') && /^\d+$/.test(lengthValue)) {
            const field = createField(row, currentIndex++);
            
            // Agregar información de la ocurrencia padre si existe
            if (occurrenceLevel > 0 && occurrenceStack.length > 0) {
                const currentOccurrence = occurrenceStack[occurrenceStack.length - 1];
                
                // Usar el ID de la ocurrencia padre como prefijo para el ID del campo
                field.parentId = currentOccurrence.id || currentOccurrence.index;
                field.id = `${field.parentId}_field_${field.index}`;
                field.level = occurrenceLevel;
                
                // Agregar el campo solo a la ocurrencia padre
                currentOccurrence.fields.push(field);
            } else {
                // Si no tiene ocurrencia padre, agregar a la lista principal
                field.id = `field_${field.index}`;
                structure[currentSection].elements.push(field);
                structure[currentSection].fieldCount++;
            }
        }
    }
    
    // --- Reorganizar la estructura para que las ocurrencias anidadas estén en la posición correcta ---
    for (const section of ['request', 'response']) {
        const sectionData = structure[section];
        
        // Ordenar los elementos por índice
        sectionData.elements.sort((a, b) => {
            return parseInt(a.index) - parseInt(b.index);
        });
        
        // Buscar ocurrencias de nivel 1 y reorganizar sus campos y ocurrencias anidadas
        for (let i = 0; i < sectionData.elements.length; i++) {
            const element = sectionData.elements[i];
            
            if (element.type === 'occurrence' && element.level === 1) {
                // Ordenar los campos de la ocurrencia por índice
                if (element.fields && element.fields.length > 0) {
                    element.fields.sort((a, b) => {
                        return parseInt(a.index) - parseInt(b.index);
                    });
                }
                
                // Si la ocurrencia tiene hijos, reorganizarlos
                if (element.children && element.children.length > 0) {
                    // Ordenar los hijos por índice
                    element.children.sort((a, b) => {
                        return parseInt(a.index) - parseInt(b.index);
                    });
                    
                    // Buscar la posición correcta para insertar cada hijo
                    for (const child of element.children) {
                        // Buscar la posición correcta en los campos de la ocurrencia
                        let insertIndex = element.fields.length;
                        
                        for (let j = 0; j < element.fields.length; j++) {
                            if (parseInt(element.fields[j].index) > parseInt(child.index)) {
                                insertIndex = j;
                                break;
                            }
                        }
                        
                        // Insertar el hijo en la posición correcta
                        element.fields.splice(insertIndex, 0, child);
                    }
                    
                    // Eliminar la propiedad children ya que ahora los hijos están en fields
                    delete element.children;
                }
            }
        }
    }

    // --- Calcular conteos finales ---
    for (const section of ['request', 'response']) {
        const sectionData = structure[section];
        
        // Contar todos los campos
        let totalFieldCount = 0;
        let totalOccurrenceCount = 0;
        
        // Contar campos y ocurrencias
        for (const element of sectionData.elements) {
            if (element.type === 'field') {
                totalFieldCount++;
            } else if (element.type === 'occurrence') {
                totalOccurrenceCount++;
            }
        }
        
        // Actualizar totales
        sectionData.fieldCount = totalFieldCount;
        sectionData.occurrenceCount = totalOccurrenceCount;
        sectionData.totalFieldCount = totalFieldCount;
    }
    
    // Ordenar los elementos por índice para facilitar el procesamiento posterior
    for (const section of ['request', 'response']) {
        structure[section].elements.sort((a, b) => {
            return parseInt(a.index) - parseInt(b.index);
        });
    }

    return structure;
}
