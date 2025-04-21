// Función para manejar el filtrado de opciones en un dropdown
function handleFilterInput(event) {
  const filter = event.target;
  const targetDropdownId = filter.getAttribute('data-target-dropdown');
  const dropdown = document.getElementById(targetDropdownId);
  
  if (!dropdown) {
    console.error(`No se encontró el dropdown objetivo: ${targetDropdownId}`);
    return;
  }
  
  const filterText = filter.value.toLowerCase();
  console.log(`Filtrando dropdown ${targetDropdownId} con texto: "${filterText}"`);
  
  // Recorrer todas las opciones y mostrar/ocultar según el filtro
  Array.from(dropdown.options).forEach(option => {
    // Saltar la primera opción (placeholder)
    if (option.value === '' || option.disabled) return;
    
    const optionText = option.text.toLowerCase();
    const optionValue = option.value.toLowerCase();
    
    // Mostrar la opción si el texto o valor contiene el filtro
    const shouldShow = optionText.includes(filterText) || optionValue.includes(filterText);
    
    // En HTML no se pueden ocultar opciones individuales, así que usamos una clase CSS
    if (shouldShow) {
      option.style.display = '';
    } else {
      option.style.display = 'none';
    }
  });
}

// Función para formatear automáticamente los valores de entrada según el tipo de campo
function setupInputFormatting() {
  console.log('Configurando formateo automático de campos...');
  
  // Obtener todos los campos de entrada
  const inputs = document.querySelectorAll('.field-input');
  console.log('Campos de entrada encontrados:', inputs.length);
  
  // Agregar manejador de eventos a cada campo
  inputs.forEach(input => {
    // Eliminar manejadores existentes para evitar duplicados
    input.removeEventListener('blur', handleInputBlur);
    input.removeEventListener('input', handleInputValidation);
    
    // Agregar nuevo manejador para cuando el campo pierde el foco
    input.addEventListener('blur', handleInputBlur);
    
    // Agregar manejador para validar la entrada en tiempo real
    input.addEventListener('input', handleInputValidation);
    
    console.log('Manejadores agregados a campo:', input.id);
  });
}

// Función para validar la entrada en tiempo real
function handleInputValidation(event) {
  const input = event.target;
  const fieldType = input.getAttribute('data-field-type')?.toLowerCase() || '';
  const fieldName = input.getAttribute('data-field-name') || '';
  const fieldDescription = input.getAttribute('data-field-description') || '';
  const fieldValues = input.getAttribute('data-field-values') || '';
  
  // Determinar si es un campo numérico
  const isNumericType = fieldType && 
                       (fieldType.includes('numerico') || fieldType.includes('numeric') || 
                        fieldType.includes('numérico')) &&
                       !(fieldType.includes('alfanumerico') || fieldType.includes('alphanumeric'));
  
  // Verificar si el campo tiene decimales basándose en su descripción o valores
  const hasDecimals = fieldDescription.toLowerCase().includes('decimal') || 
                      fieldValues.toLowerCase().includes('decimal') ||
                      fieldDescription.toLowerCase().includes('posiciones enteras') ||
                      fieldValues.toLowerCase().includes('posiciones enteras') ||
                      fieldName === 'SVC3088-IMPORTE'; // Mantener compatibilidad con el ejemplo
  
  // Si es un campo numérico, validar la entrada
  if (isNumericType) {
    const value = input.value;
    let validatedValue;
    
    // Caso especial para campos con decimales: permitir punto decimal y coma
    if (hasDecimals) {
      // Permitir dígitos y un solo punto decimal o coma
      validatedValue = value.replace(/[^0-9.,]/g, '');
      
      // Asegurar que solo haya un punto decimal
      const pointIndex = validatedValue.indexOf('.');
      if (pointIndex !== -1) {
        const beforePoint = validatedValue.substring(0, pointIndex + 1);
        const afterPoint = validatedValue.substring(pointIndex + 1).replace(/\./g, '');
        validatedValue = beforePoint + afterPoint;
      }
      
      // Hacer lo mismo para la coma
      const commaIndex = validatedValue.indexOf(',');
      if (commaIndex !== -1) {
        const beforeComma = validatedValue.substring(0, commaIndex + 1);
        const afterComma = validatedValue.substring(commaIndex + 1).replace(/,/g, '');
        validatedValue = beforeComma + afterComma;
      }
    } else {
      // Otros campos numéricos: solo permitir dígitos
      validatedValue = value.replace(/[^0-9]/g, '');
    }
    
    // Si el valor ha cambiado, actualizar el campo
    if (value !== validatedValue) {
      console.log(`Campo numérico ${input.id}: Validando entrada "${value}" -> "${validatedValue}"`);
      input.value = validatedValue;
    }
  }
}

// Función para manejar el formateo automático cuando un campo pierde el foco
function handleInputBlur(event) {
  const input = event.target;
  const fieldType = input.getAttribute('data-field-type')?.toLowerCase() || '';
  const fieldLength = parseInt(input.getAttribute('data-field-length'), 10) || 0;
  const fieldName = input.getAttribute('data-field-name') || '';
  
  console.log(`Formateando campo: ${input.id}, tipo: ${fieldType}, longitud: ${fieldLength}, nombre: ${fieldName}`);
  
  if (!fieldLength) {
    console.warn(`Campo ${input.id} no tiene longitud definida, no se puede formatear`);
    return;
  }
  
  let value = input.value.trim();
  
  // Si el campo está vacío, no hacer nada
  if (!value) return;
  
  // Determinar el tipo de campo para formateo basado en el tipo exacto de la estructura
  // Verificar si el tipo contiene "numerico" o "numeric" pero NO "alfanumerico" o "alphanumeric"
  const isNumericType = fieldType && 
                       (fieldType.includes('numerico') || fieldType.includes('numeric') || 
                        fieldType.includes('numérico')) &&
                       !(fieldType.includes('alfanumerico') || fieldType.includes('alphanumeric'));
  
  // Detectar si es un campo de fecha por el contenido (no por el nombre)
  // Solo consideramos que es fecha si tiene el formato DD/MM/AAAA o similar
  const isDateField = value.includes('/') && /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value);
  
  console.log(`Campo ${input.id} - Tipo exacto: ${fieldType}, Es numérico: ${isNumericType}, Es fecha: ${isDateField}`);
  
  // Formatear según el tipo de campo
  if (isNumericType) {
    // Obtener la descripción y valores del campo para detectar si tiene decimales
    const fieldDescription = input.getAttribute('data-field-description') || '';
    const fieldValues = input.getAttribute('data-field-values') || '';
    
    // Verificar si el campo tiene decimales basándose en su descripción o valores
    const hasDecimals = fieldDescription.toLowerCase().includes('decimal') || 
                        fieldValues.toLowerCase().includes('decimal') ||
                        fieldDescription.toLowerCase().includes('posiciones enteras') ||
                        fieldValues.toLowerCase().includes('posiciones enteras') ||
                        fieldName === 'SVC3088-IMPORTE'; // Mantener compatibilidad con el ejemplo
    
    // Determinar el número de decimales (por defecto 2)
    let decimalPlaces = 2;
    
    // Intentar extraer el número de decimales de la descripción o valores
    const decimalMatch = (fieldDescription + ' ' + fieldValues).match(/(\d+)\s*(?:posiciones|posición|digitos|dígitos)\s*decimales/i);
    if (decimalMatch && decimalMatch[1]) {
      decimalPlaces = parseInt(decimalMatch[1], 10);
    }
    
    // Caso especial para campos con decimales
    if (hasDecimals) {
      // Eliminar cualquier carácter no numérico
      value = value.replace(/[^0-9.,]/g, '');
      
      // Normalizar: convertir comas a puntos para el procesamiento
      value = value.replace(/,/g, '.');
      
      let integerPart, decimalPart;
      
      // Si el usuario ingresó un punto decimal, usar esa separación
      if (value.includes('.')) {
        const parts = value.split('.');
        integerPart = parts[0];
        decimalPart = (parts[1] || '').padEnd(decimalPlaces, '0').substring(0, decimalPlaces);
      } else {
        // Si no hay punto decimal, tomar los últimos dígitos como decimales según decimalPlaces
        if (value.length > decimalPlaces) {
          integerPart = value.substring(0, value.length - decimalPlaces);
          decimalPart = value.substring(value.length - decimalPlaces);
        } else {
          // Si hay menos dígitos que decimalPlaces, todo es decimal
          integerPart = '0';
          decimalPart = value.padStart(decimalPlaces, '0');
        }
      }
      
      // Convertir a número para formatear con separadores de miles
      const numericValue = parseInt(integerPart, 10) || 0;
      
      // Formatear con separador de miles
      let formattedInteger = numericValue.toString();
      
      // Calcular cuántos dígitos enteros debe tener el campo
      const integerDigits = fieldLength - decimalPlaces;
      
      // Aplicar separadores de miles manualmente
      let formattedWithSeparators = '';
      for (let i = 0; i < formattedInteger.length; i++) {
        if (i > 0 && (formattedInteger.length - i) % 3 === 0) {
          formattedWithSeparators += '.';
        }
        formattedWithSeparators += formattedInteger[i];
      }
      
      // Asegurar que la parte entera tenga el número correcto de dígitos (sin contar separadores)
      const digitCount = formattedInteger.length;
      const paddingNeeded = integerDigits - digitCount;
      
      if (paddingNeeded > 0) {
        // Agregar ceros al principio
        formattedWithSeparators = '0'.repeat(paddingNeeded) + formattedWithSeparators;
        
        // Volver a aplicar separadores de miles
        formattedWithSeparators = '';
        const paddedInteger = '0'.repeat(paddingNeeded) + formattedInteger;
        for (let i = 0; i < paddedInteger.length; i++) {
          if (i > 0 && (paddedInteger.length - i) % 3 === 0) {
            formattedWithSeparators += '.';
          }
          formattedWithSeparators += paddedInteger[i];
        }
      }
      
      // Valor sin separadores
      const rawValue = (numericValue.toString().padStart(integerDigits, '0')) + decimalPart;
      
      console.log(`Campo ${fieldName} formateado con ${decimalPlaces} decimales: "${rawValue}"`);
      
      // Actualizar el valor del campo sin formato visual (sin separadores)
      input.value = rawValue;
      
      // Actualizar el valor mostrado en el campo field-value (texto verde)
      const fieldContainer = input.closest('.field');
      if (fieldContainer) {
        const fieldValueElement = fieldContainer.querySelector('.field-value');
        if (fieldValueElement) {
          fieldValueElement.textContent = `"${rawValue}"`;
          console.log(`Valor mostrado actualizado en field-value: "${rawValue}"`);
        }
      }
      
      // Evitar el procesamiento adicional para este campo
      return;
    } else {
      // Otros campos numéricos: rellenar con ceros a la izquierda
      value = value.toString().padStart(fieldLength, '0');
      console.log(`Campo numérico formateado: "${value}"`);
    }
  } else if (isDateField) {
    // Si ya tiene el formato de fecha con barras, solo asegurar la longitud
    value = value.toString().padEnd(fieldLength, ' ');
    console.log(`Campo de fecha formateado: "${value}"`);
  } else {
    // Campos alfanuméricos: siempre rellenar con espacios a la derecha
    const originalValue = value;
    value = value.toString().padEnd(fieldLength, ' ');
    console.log(`Campo alfanumérico formateado: "${originalValue}" -> "${value}" (longitud ${fieldLength})`);
  }
  
  // Actualizar el valor del campo de entrada
  input.value = value;
  
  // Actualizar también el valor mostrado en el campo field-value (texto verde)
  // Buscar el elemento field-value más cercano (dentro del mismo contenedor de campo)
  const fieldContainer = input.closest('.field');
  if (fieldContainer) {
    const fieldValueElement = fieldContainer.querySelector('.field-value');
    if (fieldValueElement) {
      fieldValueElement.textContent = `"${value}"`;
      console.log(`Valor mostrado actualizado en field-value: "${value}"`);
    } else {
      console.warn(`No se encontró el elemento field-value para el campo ${input.id}`);
    }
  } else {
    console.warn(`No se encontró el contenedor .field para el campo ${input.id}`);
  }
  
  console.log(`Campo ${input.id} formateado: "${value}"`);
}

// Función para manejar el cambio en un dropdown
function handleDropdownChange(event) {
  const dropdown = event.target;
  const targetInputId = dropdown.getAttribute('data-target-input');
  const targetInput = document.getElementById(targetInputId);
  
  if (targetInput) {
    // Obtener el valor seleccionado
    let value = dropdown.value;
    
    // Obtener el tipo de campo y la longitud
    const fieldType = targetInput.getAttribute('data-field-type')?.toLowerCase() || '';
    const fieldLength = parseInt(targetInput.getAttribute('data-field-length'), 10) || 0;
    
    // Determinar si es un campo numérico
    const isNumericType = fieldType && 
                         (fieldType.includes('numerico') || fieldType.includes('numeric') || 
                          fieldType.includes('numérico')) &&
                         !(fieldType.includes('alfanumerico') || fieldType.includes('alphanumeric'));
    
    // Si el valor seleccionado tiene formato "código descripción" (como "00 PROCESO FINALIZO CORRECTAMENTE")
    // y el campo es numérico, extraer solo el código
    if (isNumericType && value.includes(' ')) {
      // Extraer solo el código (los primeros caracteres hasta el espacio)
      const codeMatch = value.match(/^(\S+)/);
      if (codeMatch && codeMatch[1]) {
        const code = codeMatch[1];
        console.log(`Campo numérico: extrayendo código "${code}" de "${value}"`);
        value = code;
      }
    }
    
    // Actualizar el valor del input
    targetInput.value = value;
    console.log(`Valor actualizado en input ${targetInputId}: ${value}`);
    
    // Obtener el texto de la opción seleccionada para mostrar como tooltip
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    if (selectedOption && selectedOption.title) {
      targetInput.title = selectedOption.title;
    }
    
    // Actualizar también el valor mostrado en el campo field-value (texto verde)
    // Buscar el elemento field-value más cercano (dentro del mismo contenedor de campo)
    const fieldContainer = targetInput.closest('.field');
    if (fieldContainer) {
      const fieldValueElement = fieldContainer.querySelector('.field-value');
      if (fieldValueElement) {
        fieldValueElement.textContent = `"${value}"`;
        console.log(`Valor mostrado actualizado desde dropdown: "${value}"`);
      }
    }
    
    // Disparar el evento blur para formatear el valor si es necesario
    targetInput.dispatchEvent(new Event('blur'));
  } else {
    console.error(`No se encontró el input objetivo: ${targetInputId}`);
  }
}

// Función para manejar el evento de agregar ocurrencia
function handleAddOccurrenceClick(event) {
  console.log('Botón de agregar ocurrencia clickeado');
  
  // Obtener datos del botón
  const button = event.currentTarget;
  const occurrenceId = button.getAttribute('data-occurrence-id');
  const maxOccurrences = parseInt(button.getAttribute('data-max-occurrences'), 10);
  const level = parseInt(button.getAttribute('data-level'), 10);
  
  console.log('Datos del botón:', { occurrenceId, maxOccurrences, level });
  
  // Obtener el contenedor de ocurrencias
  const container = document.getElementById(occurrenceId + '_container');
  if (!container) {
    console.error('No se encontró el contenedor de ocurrencias:', occurrenceId + '_container');
    return;
  }
  
  // Contar cuántas ocurrencias ya existen
  const existingOccurrences = container.querySelectorAll('.occurrence-item').length;
  console.log('Ocurrencias existentes:', existingOccurrences, 'Máximo permitido:', maxOccurrences);
  
  // Verificar si ya se alcanzó el máximo
  if (existingOccurrences >= maxOccurrences) {
    alert('Ya se ha alcanzado el número máximo de ocurrencias permitidas (' + maxOccurrences + ')');
    return;
  }
  
  // Clonar la primera ocurrencia
  const firstOccurrence = container.querySelector('.occurrence-item');
  if (!firstOccurrence) {
    console.error('No se encontró la primera ocurrencia en el contenedor:', occurrenceId + '_container');
    return;
  }
  
  const newOccurrence = firstOccurrence.cloneNode(true);
  console.log('Nueva ocurrencia clonada');
  
  // Actualizar el índice y el número de la nueva ocurrencia
  newOccurrence.setAttribute('data-occurrence-index', existingOccurrences);
  
  const headerElement = newOccurrence.querySelector('.occurrence-header');
  if (headerElement) {
    headerElement.textContent = 'Ocurrencia #' + (existingOccurrences + 1);
  }
  
  // Limpiar los valores de los campos de entrada
  newOccurrence.querySelectorAll('input').forEach(input => {
    input.value = '';
    
    // Actualizar el ID para evitar duplicados
    const originalId = input.id;
    input.id = originalId + '_' + existingOccurrences;
  });
  
  // Agregar botón para eliminar esta ocurrencia (excepto la primera)
  if (existingOccurrences > 0 && headerElement) {
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Eliminar';
    removeButton.className = 'btn-remove-occurrence';
    removeButton.onclick = function() {
      if (confirm('¿Está seguro de que desea eliminar esta ocurrencia?')) {
        newOccurrence.remove();
        // Renumerar las ocurrencias restantes
        renumberOccurrences(container);
      }
    };
    headerElement.appendChild(removeButton);
  }
  
  // Agregar la nueva ocurrencia al contenedor
  container.appendChild(newOccurrence);
  console.log('Nueva ocurrencia agregada al contenedor');
}

// Función para renumerar las ocurrencias después de eliminar una
function renumberOccurrences(container) {
  const occurrences = container.querySelectorAll('.occurrence-item');
  occurrences.forEach((occurrence, index) => {
    occurrence.setAttribute('data-occurrence-index', index);
    const header = occurrence.querySelector('.occurrence-header');
    if (header) {
      header.textContent = 'Ocurrencia #' + (index + 1);
    }
  });
}

// Exportar las funciones para que estén disponibles globalmente
window.handleFilterInput = handleFilterInput;
window.setupInputFormatting = setupInputFormatting;
window.handleInputBlur = handleInputBlur;
window.handleInputValidation = handleInputValidation;
window.handleDropdownChange = handleDropdownChange;
window.handleAddOccurrenceClick = handleAddOccurrenceClick;
window.renumberOccurrences = renumberOccurrences;
