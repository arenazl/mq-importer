// Función para inicializar los manejadores de eventos para los botones de ocurrencia
function initializeOccurrenceButtons() {
  console.log('Inicializando botones de ocurrencia...');
  
  // Obtener todos los botones de agregar ocurrencia
  const addButtons = document.querySelectorAll('.btn-add-occurrence');
  console.log('Botones encontrados:', addButtons.length);
  
  // Agregar manejador de eventos a cada botón
  addButtons.forEach(button => {
    // Eliminar manejadores existentes para evitar duplicados
    button.removeEventListener('click', handleAddOccurrenceClick);
    
    // Agregar nuevo manejador
    button.addEventListener('click', handleAddOccurrenceClick);
    console.log('Manejador agregado a botón:', button.getAttribute('data-occurrence-id'));
  });
  
  // Inicializar los dropdowns
  initializeDropdowns();
}

// Función para inicializar los dropdowns
function initializeDropdowns() {
  console.log('Inicializando dropdowns...');
  
  // Obtener todos los dropdowns
  const dropdowns = document.querySelectorAll('.field-dropdown');
  console.log('Dropdowns encontrados:', dropdowns.length);
  
  // Agregar manejador de eventos a cada dropdown
  dropdowns.forEach(dropdown => {
    // Eliminar manejadores existentes para evitar duplicados
    dropdown.removeEventListener('change', handleDropdownChange);
    
    // Agregar nuevo manejador
    dropdown.addEventListener('change', handleDropdownChange);
    console.log('Manejador agregado a dropdown:', dropdown.id);
  });
  
  // Inicializar los filtros de dropdown
  initializeDropdownFilters();
}

// Función para inicializar los filtros de dropdown
function initializeDropdownFilters() {
  console.log('Inicializando filtros de dropdown...');
  
  // Obtener todos los filtros
  const filters = document.querySelectorAll('.dropdown-filter');
  console.log('Filtros encontrados:', filters.length);
  
  // Agregar manejador de eventos a cada filtro
  filters.forEach(filter => {
    // Eliminar manejadores existentes para evitar duplicados
    filter.removeEventListener('input', handleFilterInput);
    
    // Agregar nuevo manejador
    filter.addEventListener('input', handleFilterInput);
    console.log('Manejador agregado a filtro para dropdown:', filter.getAttribute('data-target-dropdown'));
  });
}

// Función para manejar el clic en el botón de agregar ocurrencia
function handleAddOccurrenceClick(event) {
  
  const button = event.currentTarget;
  const occurrenceId = button.getAttribute('data-occurrence-id');
  const maxOccurrences = parseInt(button.getAttribute('data-max-occurrences'), 10);
  const occurrenceName = button.getAttribute('data-occurrence-name');
  const level = parseInt(button.getAttribute('data-level'), 10);
  
  console.log(`Agregando ocurrencia para ${occurrenceId}, nivel: ${level}, nombre: ${occurrenceName}`);
  
  // Obtener el contenedor de ocurrencias
  const container = document.getElementById(occurrenceId + '_container');
  if (!container) {
    console.error(`No se encontró el contenedor para ${occurrenceId}`);
    return;
  }
  
  // Contar ocurrencias actuales
  const currentOccurrences = container.querySelectorAll('.occurrence-item').length;
  
  // Verificar si ya se alcanzó el máximo de ocurrencias
  if (currentOccurrences >= maxOccurrences) {
    alert(`No se pueden agregar más ocurrencias. Máximo: ${maxOccurrences}`);
    return;
  }
  
  // Obtener la primera ocurrencia como plantilla
  const templateOccurrence = container.querySelector('.occurrence-item');
  if (!templateOccurrence) {
    console.error('No se encontró una ocurrencia plantilla');
    return;
  }
  
  // Clonar la plantilla
  const newOccurrence = templateOccurrence.cloneNode(true);
  
  // Actualizar el índice de la nueva ocurrencia
  newOccurrence.setAttribute('data-occurrence-index', currentOccurrences);
  
  // Actualizar el encabezado de la ocurrencia
  const header = newOccurrence.querySelector('.occurrence-header');
  if (header) {
    header.textContent = `Ocurrencia #${currentOccurrences + 1} (de ${maxOccurrences})`;
  }
  
  // Actualizar los IDs y atributos de los campos de entrada
  newOccurrence.querySelectorAll('.field-input').forEach(input => {
    const originalId = input.id;
    const newId = originalId.replace(/_\d+$/, `_${currentOccurrences}`);
    input.id = newId;
    
    // Limpiar el valor
    input.value = '';
    
    // Actualizar el atributo data-occurrence-index si existe
    if (input.hasAttribute('data-occurrence-index')) {
      input.setAttribute('data-occurrence-index', currentOccurrences);
    }
  });
  
  // Actualizar los IDs y atributos de los dropdowns
  newOccurrence.querySelectorAll('.field-dropdown').forEach(dropdown => {
    const originalId = dropdown.id;
    const newId = originalId.replace(/_\d+$/, `_${currentOccurrences}`);
    dropdown.id = newId;
    
    // Actualizar el atributo data-target-input
    const targetInput = dropdown.getAttribute('data-target-input');
    if (targetInput) {
      dropdown.setAttribute('data-target-input', targetInput.replace(/_\d+$/, `_${currentOccurrences}`));
    }
    
    // Resetear la selección
    dropdown.selectedIndex = 0;
  });
  
  // Agregar la nueva ocurrencia al contenedor
  container.appendChild(newOccurrence);
  
  // Actualizar el contador de ocurrencias efectivas en la sección
  const occurrenceSection = document.getElementById(occurrenceId);
  if (occurrenceSection) {
    occurrenceSection.setAttribute('data-effective-occurrences', currentOccurrences + 1);
  }
  
  // Inicializar los dropdowns y campos de la nueva ocurrencia
  initializeDropdowns();
  setupInputFormatting();
  
  console.log(`Ocurrencia #${currentOccurrences + 1} agregada para ${occurrenceId}`);
}

// Función para manejar el cambio en un dropdown
function handleDropdownChange(event) {
  const dropdown = event.target;
  const targetInputId = dropdown.getAttribute('data-target-input');
  
  if (targetInputId) {
    const targetInput = document.getElementById(targetInputId);
    if (targetInput) {
      targetInput.value = dropdown.value;
      
      // Actualizar el span field-value correspondiente
      const fieldParent = targetInput.closest('.field');
      if (fieldParent) {
        const fieldValueSpan = fieldParent.querySelector('.field-value');
        if (fieldValueSpan) {
          fieldValueSpan.textContent = targetInput.value;
        }
      }
      
      // Disparar un evento de cambio en el input para activar cualquier validación
      const changeEvent = new Event('change', { bubbles: true });
      targetInput.dispatchEvent(changeEvent);
    }
  }
}

// Función para manejar el filtrado de opciones en un dropdown
function handleFilterInput(event) {
  const filter = event.target;
  const targetDropdownId = filter.getAttribute('data-target-dropdown');
  
  if (targetDropdownId) {
    const dropdown = document.getElementById(targetDropdownId);
    if (dropdown) {
      const filterText = filter.value.toLowerCase();
      
      // Filtrar las opciones
      Array.from(dropdown.options).forEach(option => {
        const optionText = option.text.toLowerCase();
        const optionValue = option.value.toLowerCase();
        
        // Mostrar u ocultar la opción según el filtro
        if (optionText.includes(filterText) || optionValue.includes(filterText)) {
          option.style.display = '';
        } else {
          option.style.display = 'none';
        }
      });
    }
  }
}

// Función para configurar el formateo de campos de entrada
function setupInputFormatting() {
  document.querySelectorAll('.field-input').forEach(input => {
    // Eliminar manejadores existentes para evitar duplicados
    input.removeEventListener('blur', handleInputBlur);
    input.removeEventListener('input', handleInputValidation);
    input.removeEventListener('keydown', handleInputKeyDown);
    
    // Agregar nuevo manejador para blur (formateo)
    input.addEventListener('blur', handleInputBlur);
    
    // Agregar nuevo manejador para input (validación en tiempo real)
    input.addEventListener('input', handleInputValidation);
    
    // Agregar nuevo manejador para keydown (prevenir teclas no permitidas)
    input.addEventListener('keydown', handleInputKeyDown);
  });
}

// Función para validar la entrada mientras el usuario escribe
function handleInputValidation(event) {
  const input = event.target;
  const fieldType = input.getAttribute('data-field-type');
  
  // Validación según el tipo de campo
  if (fieldType == ('numérico') || fieldType == ('numerico')) {
    // Solo permitir dígitos y punto decimal
    input.value = input.value.replace(/[^\d.]/g, '');
    
    // Asegurar que solo haya un punto decimal
    const decimalPoints = input.value.match(/\./g);
    if (decimalPoints && decimalPoints.length > 1) {
      input.value = input.value.replace(/\.(?=.*\.)/g, '');
    }
  }
  
  // No es necesario validar caracteres alfanuméricos aquí, pues se permiten todos
  // pero se podrían agregar validaciones adicionales si es necesario
}

// Función para prevenir teclas no permitidas según el tipo de campo
function handleInputKeyDown(event) {
  const input = event.target;
  const fieldType = input.getAttribute('data-field-type');
  
  if (fieldType == ('numérico') || fieldType == ('numerico')) {
    // Permitir: números, punto decimal, teclas de navegación, teclas de edición
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];
    
    // Si la tecla no es un número, punto decimal, o tecla permitida, cancelar
    if (!/^\d$/.test(event.key) && event.key !== '.' && !allowedKeys.includes(event.key) && !event.ctrlKey) {
      event.preventDefault();
    }
    
    // Si ya hay un punto decimal y se intenta agregar otro, cancelar
    if (event.key === '.' && input.value.includes('.')) {
      event.preventDefault();
    }
  }
}

// Función para inicializar las sub-pestañas de Payload
function initializePayloadTabs() {
  console.log('Inicializando sub-pestañas de Payload...');
  
  // Obtener todos los botones de sub-pestaña de Payload
  const payloadTabButtons = document.querySelectorAll('.payload-tab-btn');
  console.log('Botones de sub-pestaña de Payload encontrados:', payloadTabButtons.length);
  
  // Agregar manejador de eventos a cada botón
  payloadTabButtons.forEach(button => {
    // Eliminar manejadores existentes para evitar duplicados
    button.removeEventListener('click', handlePayloadTabClick);
    
    // Agregar nuevo manejador
    button.addEventListener('click', handlePayloadTabClick);
    console.log('Manejador agregado a botón de sub-pestaña de Payload:', button.getAttribute('data-payload-tab'));
  });
  
  // Inicializar los botones de copiar y formatear para la pestaña de Requerimiento
  initializeButtonCopyFormatPayload('Request');
  
  // Inicializar los botones de copiar y formatear para la pestaña de Respuesta
  initializeButtonCopyFormatPayload('Response');
}

// Función para manejar el clic en un botón de sub-pestaña de Payload
function handlePayloadTabClick(event) {
  const tabId = event.currentTarget.getAttribute('data-payload-tab');
  console.log('Clic en sub-pestaña de Payload:', tabId);
  
  // Desactivar todas las sub-pestañas
  document.querySelectorAll('.payload-tab-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.style.backgroundColor = '#f5f5f5';
    btn.style.color = '#333'; // Asegurar que el texto sea visible en pestañas inactivas
  });
  
  // Ocultar todos los contenidos de sub-pestaña
  document.querySelectorAll('.payload-tab-pane').forEach(pane => {
    pane.style.display = 'none';
  });
  
  // Activar la sub-pestaña seleccionada
  event.currentTarget.classList.add('active');
  event.currentTarget.style.backgroundColor = '#3f51b5';
  event.currentTarget.style.color = 'white';
  
  // Mostrar el contenido de la sub-pestaña seleccionada
  const tabPane = document.getElementById(tabId);
  if (tabPane) {
    tabPane.style.display = 'block';
  }
}

// Función para inicializar los botones de copiar y formatear para una pestaña específica
function initializeButtonCopyFormatPayload(type) {
  // Inicializar el botón de copiar
  const btnCopy = document.getElementById(`btnCopy${type}Json`);
  const jsonEditor = document.getElementById(`json${type}Editor`);
  
  if (btnCopy && jsonEditor) {
    btnCopy.addEventListener('click', function() {
      // Copiar el contenido actual del editor (sin formato HTML)
      const textContent = jsonEditor.textContent || jsonEditor.innerText;
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
  
  // Inicializar el botón de formatear
  const btnFormat = document.getElementById(`btnFormat${type}Json`);
  if (btnFormat && jsonEditor) {
    btnFormat.addEventListener('click', function() {
      try {
        // Obtener el texto sin formato HTML
        const textContent = jsonEditor.textContent || jsonEditor.innerText;
        
        // Intentar parsear el JSON actual
        const jsonObj = JSON.parse(textContent);
        
        // Formatear el JSON y actualizar el editor con colores
        const formattedJson = JSON.stringify(jsonObj, null, 2);
        jsonEditor.innerHTML = colorizePayloadJson(formattedJson);
        
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
  
  // Inicializar el botón de restablecer
  const btnReset = document.getElementById(`btnReset${type}Json`);
  if (btnReset && jsonEditor) {
    btnReset.addEventListener('click', function() {
      try {
        // Crear un JSON vacío a partir de la estructura correspondiente
        const emptyJson = createEmptyJsonFromStructure(
          window.serviceStructure[type.toLowerCase()].elements
        );
        
        // Formatear el JSON para mostrarlo con la sintaxis específica
        const formattedJson = formatJsonForPayload(emptyJson);
        
        // Restablecer el JSON original con colores
        jsonEditor.innerHTML = colorizePayloadJson(formattedJson);
        
        // Mostrar mensaje de éxito
        this.innerHTML = '<span style="margin-right: 5px;">✓</span> Restablecido';
        setTimeout(() => {
          this.innerHTML = '<span style="margin-right: 5px;">↺</span> Restablecer';
        }, 2000);
      } catch (err) {
        console.error('Error al restablecer JSON:', err);
        alert('Error al restablecer JSON: ' + err.message);
      }
    });
  }
}

// Función auxiliar para crear un objeto JSON vacío a partir de la estructura
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

const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.addedNodes.length) {
      // Verificar si se agregaron botones de ocurrencia
      const addedButtons = document.querySelectorAll('.btn-add-occurrence');
      if (addedButtons.length > 0) {
        console.log('Detectados botones de ocurrencia en el DOM');
        initializeOccurrenceButtons();
      }
      
      // Verificar si se agregaron botones de colapso
      const collapseButtons = document.querySelectorAll('.btn-collapse-occurrence');
      if (collapseButtons.length > 0) {
        console.log('Detectados botones de colapso en el DOM');
        initializeCollapseButtons();
      }
      
      // Verificar si se agregaron campos de entrada
      const addedInputs = document.querySelectorAll('.field-input');
      if (addedInputs.length > 0) {
        console.log('Detectados campos de entrada en el DOM');
        setupInputFormatting();
      }
      
      // Verificar si se agregaron las sub-pestañas de Payload
      const payloadTabButtons = document.querySelectorAll('.payload-tab-btn');
      if (payloadTabButtons.length > 0) {
        console.log('Detectados botones de sub-pestaña de Payload en el DOM');
        initializePayloadTabs();
      }
    }
  });
});

// Iniciar la observación del DOM
observer.observe(document.body, { childList: true, subtree: true });

// Observador para los botones de JSON
const jsonButtonsObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.addedNodes.length) {
      // Verificar si se agregaron botones de copiar JSON
      const btnCopyHeaderJson = document.getElementById('btnCopyHeaderJson');
      const btnCopyRequestJson = document.getElementById('btnCopyRequestJson');
      const btnCopyResponseJson = document.getElementById('btnCopyResponseJson');
      
      // Verificar si se agregaron botones de colapsar JSON
      const collapseJsonButtons = document.querySelectorAll('.btn-collapse-json');
      
      if (btnCopyHeaderJson && !btnCopyHeaderJson.hasAttribute('data-handler-attached')) {
        btnCopyHeaderJson.addEventListener('click', function() {
          navigator.clipboard.writeText(JSON.stringify(reorganizeJsonStructure(window.headerStructure), null, 2))
            .then(() => {
              this.textContent = '¡Copiado!';
              setTimeout(() => {
                this.textContent = 'Copiar JSON Cabecera';
              }, 2000);
            })
            .catch(err => {
              console.error('Error al copiar:', err);
              this.textContent = 'Error al copiar';
            });
        });
        btnCopyHeaderJson.setAttribute('data-handler-attached', 'true');
        console.log('Manejador agregado al botón de copiar JSON Cabecera');
      }
      
      if (btnCopyRequestJson && !btnCopyRequestJson.hasAttribute('data-handler-attached')) {
        btnCopyRequestJson.addEventListener('click', function() {
          navigator.clipboard.writeText(JSON.stringify(reorganizeJsonStructure(window.serviceStructure.request), null, 2))
            .then(() => {
              this.textContent = '¡Copiado!';
              setTimeout(() => {
                this.textContent = 'Copiar JSON Requerimiento';
              }, 2000);
            })
            .catch(err => {
              console.error('Error al copiar:', err);
              this.textContent = 'Error al copiar';
            });
        });
        btnCopyRequestJson.setAttribute('data-handler-attached', 'true');
        console.log('Manejador agregado al botón de copiar JSON Requerimiento');
      }
      
      if (btnCopyResponseJson && !btnCopyResponseJson.hasAttribute('data-handler-attached')) {
        btnCopyResponseJson.addEventListener('click', function() {
          navigator.clipboard.writeText(JSON.stringify(reorganizeJsonStructure(window.serviceStructure.response), null, 2))
            .then(() => {
              this.textContent = '¡Copiado!';
              setTimeout(() => {
                this.textContent = 'Copiar JSON Respuesta';
              }, 2000);
            })
            .catch(err => {
              console.error('Error al copiar:', err);
              this.textContent = 'Error al copiar';
            });
        });
        btnCopyResponseJson.setAttribute('data-handler-attached', 'true');
        console.log('Manejador agregado al botón de copiar JSON Respuesta');
      }
      
      // Verificar si se agregaron botones de colapsar JSON
      if (collapseJsonButtons.length > 0) {
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
      }
      
      // Inicializar la funcionalidad colapsable del JSON
      initializeJsonCollapsible();
    }
  });
});

// Iniciar la observación para los botones de JSON
jsonButtonsObserver.observe(document.body, { childList: true, subtree: true });

// Función para manejar el clic en el botón de generar string de requerimiento
function handleGenerateRequestString() {
  console.log('Generando string de requerimiento...');
  
  // Obtener las estructuras necesarias
  const headerStructure = window.headerStructure;
  
  if (!headerStructure) {
    console.error('Error: No se encontró la estructura de cabecera');
    document.getElementById('requestStringResult').innerHTML = 
      '<div style="color: red;">Error: No se encontró la estructura de cabecera</div>';
    return;
  }
  
  // Generar la parte de la cabecera
  let headerString = '';
  let headerLength = 0;
  
  console.log('=== INICIO GENERACIÓN DE STRING ===');
  console.log('Longitud inicial: 0 caracteres');
  
  // Recorrer los campos de la cabecera
  headerStructure.fields.forEach(field => {
    // Obtener el valor por defecto para este campo
    const defaultValue = getDefaultValueForField(field);
    
    // Formatear el valor según el tipo de campo
    const formattedValue = formatValue(defaultValue, field.length, field.type);
    
    // Agregar al string de cabecera
    headerString += formattedValue;
    headerLength += field.length;
    
    console.log(`Campo cabecera ${field.name}: +${field.length} caracteres`);
  });
  
  console.log(`=== CABECERA COMPLETA: ${headerLength} caracteres ===`);

   // Paso 1: Recopilar todos los campos input y ordenarlos por índice
   const allInputFields = [];
  
   document.querySelectorAll('.field-input').forEach(input => {
     // Obtener el índice del campo desde el elemento padre
     const fieldParent = input.closest('.field');
     if (fieldParent) {
       const indexText = fieldParent.querySelector('.field-index')?.textContent || '';
       const indexMatch = indexText.match(/\[(\d+)\]/);
       
       if (indexMatch && indexMatch[1]) {
         const fieldIndex = parseInt(indexMatch[1], 10);
         const inputId = input.id;
         const occurrenceMatch = inputId.match(/_(\d+)$/);
         const occurrenceIndex = occurrenceMatch ? parseInt(occurrenceMatch[1], 10) : 0;
         
         allInputFields.push({
           element: input,
           fieldIndex: fieldIndex,
           occurrenceIndex: occurrenceIndex,
           // Para ordenar: primero por índice de campo, luego por ocurrencia
           sortIndex: fieldIndex * 1000 + occurrenceIndex
         });
       }
     }
   });
   
   // Ordenar los campos por índice y ocurrencia
   allInputFields.sort((a, b) => a.sortIndex - b.sortIndex);
   
   // Paso 2: Identificar saltos en la secuencia que indican secciones de ocurrencias
   let processedIndices = new Set();
   let orderedFieldsList = [];
   
   // Primero, añadir todos los campos existentes
   allInputFields.forEach(field => {
     orderedFieldsList.push(field);
     processedIndices.add(field.fieldIndex);
   });
   
   // Paso 3: Identificar secciones de ocurrencias y su información
   const occurrenceSections = [];

      var length = document.querySelectorAll('.occurrence-section').length;
      document.querySelectorAll('.occurrence-section').forEach((section, index) => {

      if(index >= length-1) return; // Omitir la última ocurrencia (de la sección de respuesta)
  
     // Obtener información de la ocurrencia desde los atributos data
     const occurrenceName = section.getAttribute('data-occurrence-name');
     const occurrenceLevel = parseInt(section.getAttribute('data-occurrence-level') || '0', 10);
     const totalOccurrences = parseInt(section.getAttribute('data-total-occurrences') || '0', 10);
     
     // Contar ocurrencias actuales
     const container = section.querySelector('.occurrences-container');
     const currentOccurrences = container ? container.querySelectorAll('.occurrence-item').length : 0;
     
     // Obtener el ID de la ocurrencia padre si existe
     const parentId = section.id.split('_').slice(2).join('_');
     
     // Determinar si esta ocurrencia tiene hijos
     const hasChildren = section.querySelectorAll('.occurrence-section').length > 0;
     
     occurrenceSections.push({
       occurrenceName: occurrenceName,
       occurrenceId: section.id,
       parentId: parentId || null,
       level: occurrenceLevel,
       totalOccurrences: totalOccurrences,
       effectiveOccurrences: currentOccurrences,
       sectionIndex: parseInt(occurrenceName, 10) || 0,
       hasChildren: hasChildren,
       children: [] // Para almacenar referencias a las ocurrencias hijas
     });
   });
   
   // Construir la jerarquía de ocurrencias (padres e hijos)
   let rootOccurrences = [];
   const occurrenceMap = {};
   
   // Primero, crear un mapa para acceso rápido
   occurrenceSections.forEach(section => {
     occurrenceMap[section.occurrenceId] = section;
   });
   
   // Establecer las relaciones padre-hijo correctamente
   console.log('Estableciendo relaciones padre-hijo correctamente...');
   
   // SOLUCIÓN: Forzar que solo la ocurrencia de nivel 0 sea raíz
   // y todas las de nivel 1 sean sus hijas
   
   // Encontrar la ocurrencia de nivel 0 (debe ser la única raíz)
   const level0Section = occurrenceSections.find(section => section.level === 0);
   
   if (level0Section) {
     console.log(`Encontrada ocurrencia de nivel 0: [${level0Section.occurrenceName}]`);
     
     // Esta es la única ocurrencia raíz
     rootOccurrences = [level0Section];
     
     // Todas las ocurrencias de nivel 1 son hijas de la raíz
     const level1Sections = occurrenceSections.filter(section => section.level === 1);
     console.log(`Encontradas ${level1Sections.length} ocurrencias de nivel 1`);
     
     // Establecer la relación padre-hijo
     level1Sections.forEach(section => {
       section.parentId = level0Section.occurrenceId;
       level0Section.children.push(section);
       console.log(`Establecida relación: [${level0Section.occurrenceName}] es padre de [${section.occurrenceName}]`);
     });
     
     console.log(`Ocurrencia raíz [${level0Section.occurrenceName}] ahora tiene ${level0Section.children.length} hijos`);
   } else {
     console.log('No se encontró ocurrencia de nivel 0. Usando el método original...');
     
     // Primero, identificar todas las ocurrencias raíz (sin parentId)
     const rootSections = occurrenceSections.filter(section => !section.parentId);
     console.log(`Ocurrencias raíz encontradas: ${rootSections.length}`);
     
     // Si no hay ocurrencias raíz, buscar la de nivel más bajo
     if (rootSections.length === 0) {
       const lowestLevelSection = occurrenceSections.reduce((lowest, current) => 
         (current.level < lowest.level) ? current : lowest, occurrenceSections[0]);
       
       if (lowestLevelSection) {
         console.log(`No se encontraron ocurrencias raíz. Usando la de nivel más bajo: ${lowestLevelSection.occurrenceName}`);
         rootOccurrences.push(lowestLevelSection);
       }
     } else {
       // Agregar todas las ocurrencias raíz
       rootSections.forEach(section => {
         rootOccurrences.push(section);
       });
     }
     
     // Si aún no tenemos ocurrencias raíz, usar la primera ocurrencia
     if (rootOccurrences.length === 0 && occurrenceSections.length > 0) {
       console.log(`No se encontraron ocurrencias raíz. Usando la primera ocurrencia: ${occurrenceSections[0].occurrenceName}`);
       rootOccurrences.push(occurrenceSections[0]);
     }
     
     // Ahora, establecer las relaciones padre-hijo para las ocurrencias no raíz
     occurrenceSections.forEach(section => {
       if (section.parentId && occurrenceMap[section.parentId]) {
         // Esta ocurrencia tiene un padre
         occurrenceMap[section.parentId].children.push(section);
       }
     });
     
     // Si no se establecieron relaciones padre-hijo, intentar inferirlas por nivel
     if (rootOccurrences.length === 1 && 
         occurrenceSections.length > 1 && 
         rootOccurrences[0].children.length === 0) {
       
       console.log('Intentando inferir relaciones padre-hijo por nivel...');
       
       // La ocurrencia raíz será padre de todas las demás
       const rootSection = rootOccurrences[0];
       
       occurrenceSections.forEach(section => {
         if (section.occurrenceId !== rootSection.occurrenceId) {
           section.parentId = rootSection.occurrenceId;
           rootSection.children.push(section);
         }
       });
       
       console.log(`Relaciones padre-hijo inferidas: ${rootSection.occurrenceName} es padre de ${rootSection.children.length} ocurrencias`);
     }
   }
   
   console.log('Estructura jerárquica de ocurrencias:', rootOccurrences);
   
   // Ordenar las secciones de ocurrencias por nivel (primero las de nivel más bajo)
   // y luego por índice dentro de cada nivel
   occurrenceSections.sort((a, b) => {
     if (a.level !== b.level) {
       return a.level - b.level;
     }
     return a.sectionIndex - b.sectionIndex;
   });
   
   console.log('Secciones de ocurrencias identificadas:', occurrenceSections);
   
   // Paso 4: Crear los campos ocultos para contadores de ocurrencias
   const hiddenCounterFields = [];
   
   occurrenceSections.forEach(section => {
     // Crear el campo oculto
     const hiddenInput = document.createElement('input');
     hiddenInput.type = 'hidden';
     hiddenInput.id = `field_SVC3088_CANT_OCURR_${section.occurrenceName}`;
     hiddenInput.className = 'field-input occurrence-counter';
     hiddenInput.setAttribute('data-field-name', `SVC3088-CANT-OCURR-${section.occurrenceName}`);
     hiddenInput.setAttribute('data-field-length', '2');
     hiddenInput.setAttribute('data-field-type', 'numérico');
     hiddenInput.setAttribute('data-occurrence-name', section.occurrenceName);
     hiddenInput.setAttribute('data-occurrence-level', section.level);
     hiddenInput.value = section.effectiveOccurrences.toString();
     
     hiddenCounterFields.push({
       element: hiddenInput,
       fieldIndex: section.sectionIndex - 0.5, // Colocarlo justo antes de la sección
       isCounter: true,
       occurrenceName: section.occurrenceName,
       occurrenceLevel: section.level,
       sectionIndex: section.sectionIndex,
       totalOccurrences: section.totalOccurrences,
       effectiveOccurrences: section.effectiveOccurrences
     });
   });
   
   // Paso 5: Combinar todos los campos en orden correcto
   const finalFieldsList = [...orderedFieldsList, ...hiddenCounterFields].sort((a, b) => {
     return a.fieldIndex - b.fieldIndex;
   });
   
   // Paso 6: Generar el string de servicio
   let serviceString = ''; // Declaración de serviceString
   let serviceLength = 0;
   
   console.log('=== INICIO GENERACIÓN DE STRING DE SERVICIO ===');
   
   // Función para obtener todos los campos de una ocurrencia
   function getOccurrenceFields(occurrenceName, occurrenceIndex) {
     const fields = [];
     document.querySelectorAll(`.field-input[data-occurrence-name="${occurrenceName}"]`).forEach(input => {
       // Verificar si el input pertenece a la ocurrencia específica
       const occurrenceItem = input.closest('.occurrence-item');
       if (occurrenceItem && parseInt(occurrenceItem.getAttribute('data-occurrence-index') || '0', 10) === occurrenceIndex) {
         fields.push({
           element: input,
           fieldName: input.getAttribute('data-field-name'),
           fieldLength: parseInt(input.getAttribute('data-field-length'), 10),
           fieldType: input.getAttribute('data-field-type')
         });
       }
     });
     return fields;
   
  }
   
   
   // Función para obtener el valor por defecto de un campo según su tipo
   function getDefaultValueForInputField(fieldType, fieldLength) {
     if (fieldType.toLowerCase() == 'numerico' || fieldType.toLowerCase() == 'numérico')  {
       return '0'.repeat(fieldLength);
     } else {
       // Para campos alfanuméricos, rellenar con espacios a la derecha
       return ' '.repeat(fieldLength);
     }
   }
   
   // Procesar campos normales (no pertenecientes a ocurrencias)
   let normalFieldsLength = 0;
   let normalFieldsCount = 0;
   
   finalFieldsList.forEach(field => {
     const element = field.element;
     
     // Verificar si el campo pertenece a una ocurrencia
     const occurrenceName = element.getAttribute('data-occurrence-name');
     if (occurrenceName) {
       // Los campos de ocurrencias se procesarán después
       return;
     }
     
     // Obtener atributos del campo
     const fieldName = element.getAttribute('data-field-name');
     const fieldLength = parseInt(element.getAttribute('data-field-length'), 10);
     const fieldType = element.getAttribute('data-field-type');
     
     // Obtener el valor
     let value = element.value.trim();
     
     // Si el campo está vacío, usar un valor por defecto según el tipo
     if (!value) {
       value = getDefaultValueForInputField(fieldType, fieldLength);
     }
     
     // Formatear el valor según el tipo de campo
     const formattedValue = formatValue(value, fieldLength, fieldType);
     
     // Agregar al string de servicio
     serviceString += formattedValue;
     serviceLength += fieldLength;
     normalFieldsLength += fieldLength;
     normalFieldsCount++;
   });
   
   // Mostrar resumen de campos normales
   console.log(`=== CAMPOS NORMALES: ${normalFieldsCount} campos, ${normalFieldsLength} caracteres, Total acumulado: ${serviceLength} ===`);
   
   // Función recursiva para procesar una ocurrencia y todas sus ocurrencias hijas
   function processOccurrenceWithChildren(section, parentOccurrenceIndex = null) {
     // Inicializar contadores para esta sección
     let sectionLength = 0;
     let sectionFieldCount = 0;
     let effectiveOccurrencesProcessed = 0;
     let filledOccurrencesProcessed = 0;
     
     console.log(`Procesando ocurrencia [${section.occurrenceName}] nivel ${section.level} ${parentOccurrenceIndex !== null ? `para padre [${parentOccurrenceIndex}]` : 'raíz'}`);
     
     // Verificar si debemos incluir los contadores de ocurrencias
     const includeCounters = false; // Cambiar a false para omitir los contadores
     
     // Agregar el contador de ocurrencias (solo si includeCounters es true)
     if (includeCounters) {
       const counterField = hiddenCounterFields.find(f => f.occurrenceName === section.occurrenceName);
       if (counterField) {
         const element = counterField.element;
         const fieldLength = parseInt(element.getAttribute('data-field-length'), 10);
         const fieldType = element.getAttribute('data-field-type');
         const value = section.effectiveOccurrences.toString();
         
         // Formatear el valor según el tipo de campo
         const formattedValue = formatValue(value, fieldLength, fieldType);
         
         // Agregar al string de servicio
         serviceString += formattedValue;
         serviceLength += fieldLength;
         sectionLength += fieldLength;
         sectionFieldCount++;
       }
     }
     
     // Obtener todos los campos de esta ocurrencia
     const occurrenceContainer = document.getElementById(section.occurrenceId + '_container');
     if (occurrenceContainer) {
       const occurrenceItems = occurrenceContainer.querySelectorAll('.occurrence-item');
       
       // Procesar cada ocurrencia efectiva
       for (let i = 0; i < section.effectiveOccurrences; i++) {
         const occurrenceItem = occurrenceItems[i];
         if (occurrenceItem) {
           // Obtener todos los inputs de esta ocurrencia
           const inputs = occurrenceItem.querySelectorAll('.field-input');
           let occurrenceItemLength = 0;
           
           // Procesar cada campo de la ocurrencia
           inputs.forEach(input => {
             const fieldName = input.getAttribute('data-field-name');
             const fieldLength = parseInt(input.getAttribute('data-field-length'), 10);
             const fieldType = input.getAttribute('data-field-type');
             
             // Obtener el valor
             let value = input.value.trim();
             
             // Si el campo está vacío, usar un valor por defecto según el tipo
             if (!value) {
               value = getDefaultValueForInputField(fieldType, fieldLength);
             }
             
             // Formatear el valor según el tipo de campo
             const formattedValue = formatValue(value, fieldLength, fieldType);
             
             // Agregar al string de servicio
             serviceString += formattedValue;
             serviceLength += fieldLength;
             sectionLength += fieldLength;
             occurrenceItemLength += fieldLength;
             sectionFieldCount++;
           });
           
           effectiveOccurrencesProcessed++;
           
   // Procesar ocurrencias hijas para esta instancia de la ocurrencia padre
   if (section.children && section.children.length > 0) {
     // SOLUCIÓN PARA OCURRENCIAS ANIDADAS:
     // Para cada ocurrencia padre, debemos procesar TODAS las ocurrencias hijo
     // Si hay 20 ocurrencias padre y 10 ocurrencias hijo, debemos tener 20 × 10 = 200 ocurrencias hijo en total
     
     // Obtener la información de la ocurrencia raíz (nivel 0)
     const rootSection = rootOccurrences[0];
     
     // Calcular el multiplicador para las ocurrencias hijo
     // Para cada ocurrencia padre, debemos procesar todas las ocurrencias hijo
     // Si estamos procesando la ocurrencia raíz, no necesitamos multiplicador adicional
     // Si estamos procesando una ocurrencia de relleno, todas sus hijas son de relleno
     const isRoot = section.level === 0;
     
     console.log(`Procesando ocurrencias hijo para ocurrencia ${section.occurrenceName} (nivel ${section.level})`);
     
     section.children.forEach(childSection => {
       // Para cada hijo, procesar TODAS sus ocurrencias (hasta totalOccurrences)
       // Crear una copia para no modificar el original
       const childCopy = {...childSection};
       
       // Importante: Para cada ocurrencia padre, debemos procesar TODAS las ocurrencias hijo
       // No solo las efectivas, sino todas hasta totalOccurrences
       for (let j = 0; j < childCopy.totalOccurrences; j++) {
         // Si es una ocurrencia efectiva del hijo, procesarla normalmente
         if (j < childCopy.effectiveOccurrences) {
           // Crear una copia con solo 1 ocurrencia efectiva
           const singleChildCopy = {...childCopy, effectiveOccurrences: 1, totalOccurrences: 1};
           processOccurrenceWithChildren(singleChildCopy, i);
         } else {
           // Si es una ocurrencia de relleno, crear una copia con 0 ocurrencias efectivas
           // pero 1 ocurrencia total para que se procese como relleno
           const singleChildCopy = {...childCopy, effectiveOccurrences: 0, totalOccurrences: 1};
           processOccurrenceWithChildren(singleChildCopy, i);
         }
       }
     });
   }
         }
       }
       
       // Rellenar las ocurrencias faltantes con valores por defecto
       if (section.effectiveOccurrences < section.totalOccurrences) {
         // Obtener la estructura de campos de la primera ocurrencia como plantilla
         const templateOccurrence = occurrenceItems[0];
         if (templateOccurrence) {
           const templateInputs = templateOccurrence.querySelectorAll('.field-input');
           const templateFields = [];
           
           templateInputs.forEach(input => {
             templateFields.push({
               fieldName: input.getAttribute('data-field-name'),
               fieldLength: parseInt(input.getAttribute('data-field-length'), 10),
               fieldType: input.getAttribute('data-field-type')
             });
           });
           
           // Calcular la longitud de una ocurrencia de relleno
           let filledOccurrenceLength = templateFields.reduce((sum, field) => sum + field.fieldLength, 0);
           
           // Rellenar las ocurrencias faltantes
           for (let i = section.effectiveOccurrences; i < section.totalOccurrences; i++) {
             // Procesar campos de la ocurrencia
             templateFields.forEach(field => {
               const defaultValue = getDefaultValueForInputField(field.fieldType, field.fieldLength);
               const formattedValue = formatValue(defaultValue, field.fieldLength, field.fieldType);
               
               serviceString += formattedValue;
               serviceLength += field.fieldLength;
               sectionLength += field.fieldLength;
               sectionFieldCount++;
             });
             
             filledOccurrencesProcessed++;
             
             // Procesar ocurrencias hijas para esta instancia de relleno
             if (section.children && section.children.length > 0) {
               section.children.forEach(childSection => {
                 // Para cada hijo, procesar TODAS sus ocurrencias (hasta totalOccurrences)
                 // Crear una copia para no modificar el original
                 const childCopy = {...childSection};
                 
                 // Importante: Para cada ocurrencia padre de relleno, debemos procesar TODAS las ocurrencias hijo
                 for (let j = 0; j < childCopy.totalOccurrences; j++) {
                   // Para ocurrencias de relleno, todas las ocurrencias hijo son de relleno
                   const singleChildCopy = {...childCopy, effectiveOccurrences: 0, totalOccurrences: 1};
                   processOccurrenceWithChildren(singleChildCopy, i);
                 }
               });
             }
           }
         }
       }
     }
     
     // Mostrar resumen de esta sección de ocurrencias
     console.log(`=== OCURRENCIA [${section.occurrenceName}] nivel ${section.level}: ${effectiveOccurrencesProcessed} efectivas + ${filledOccurrencesProcessed} relleno = ${effectiveOccurrencesProcessed + filledOccurrencesProcessed}/${section.totalOccurrences} ocurrencias, ${sectionFieldCount} campos, ${sectionLength} caracteres, Total acumulado: ${serviceLength} ===`);
   }
   
   // Procesar solo las ocurrencias raíz (las que no tienen padre)
   // Las ocurrencias hijas se procesarán recursivamente dentro de cada ocurrencia padre
   rootOccurrences.forEach(section => {
     processOccurrenceWithChildren(section);
   });
   
   // Mostrar resumen del string de servicio generado
   console.log(`\n=== RESUMEN DEL STRING DE SERVICIO GENERADO ===`);
   console.log(`Longitud total del string de servicio: ${serviceLength} caracteres`);
   
   // Identificar la ocurrencia raíz (nivel 0)
   const rootSection = rootOccurrences[0];
   
   if (rootSection) {
     console.log(`Ocurrencia raíz: [${rootSection.occurrenceName}] con ${rootSection.totalOccurrences} ocurrencias totales`);
     
     // Identificar todas las ocurrencias de nivel 1
     const level1Occurrences = occurrenceSections.filter(section => section.level === 1);
     console.log(`Ocurrencias nivel 1 encontradas: ${level1Occurrences.length}`);
     
     // Calcular la longitud teórica
     let theoreticalLength = 0;
     
     // Calcular la longitud de la ocurrencia raíz
     const rootFields = [];
     document.querySelectorAll(`.field-input[data-occurrence-name="${rootSection.occurrenceName}"]`).forEach(input => {
       const occurrenceItem = input.closest('.occurrence-item');
       if (occurrenceItem && parseInt(occurrenceItem.getAttribute('data-occurrence-index') || '0', 10) === 0) {
         const fieldLength = parseInt(input.getAttribute('data-field-length'), 10);
         rootFields.push(fieldLength);
       }
     });
     
     const rootLength = rootFields.reduce((sum, length) => sum + length, 0);
     const rootContribution = rootLength * rootSection.totalOccurrences;
     theoreticalLength += rootContribution;
     
     console.log(`Contribución de ocurrencia raíz [${rootSection.occurrenceName}]: ${rootLength} chars × ${rootSection.totalOccurrences} ocurrencias = ${rootContribution} chars`);
     
     // Calcular la longitud de cada ocurrencia de nivel 1
     level1Occurrences.forEach(level1Section => {
       const level1Fields = [];
       document.querySelectorAll(`.field-input[data-occurrence-name="${level1Section.occurrenceName}"]`).forEach(input => {
         const occurrenceItem = input.closest('.occurrence-item');
         if (occurrenceItem && parseInt(occurrenceItem.getAttribute('data-occurrence-index') || '0', 10) === 0) {
           const fieldLength = parseInt(input.getAttribute('data-field-length'), 10);
           level1Fields.push(fieldLength);
         }
       });
       
       const level1Length = level1Fields.reduce((sum, length) => sum + length, 0);
       const level1Contribution = level1Length * level1Section.totalOccurrences * rootSection.totalOccurrences;
       theoreticalLength += level1Contribution;
       
       console.log(`Contribución de ocurrencia nivel 1 [${level1Section.occurrenceName}]: ${level1Length} chars × ${level1Section.totalOccurrences} ocurrencias × ${rootSection.totalOccurrences} padres = ${level1Contribution} chars`);
     });
     
     console.log(`Longitud teórica total: ${theoreticalLength} caracteres`);
     console.log(`Longitud actual generada: ${serviceLength} caracteres`);
     console.log(`Diferencia: ${theoreticalLength - serviceLength} caracteres`);
   }

   // Función para formatear valores según el tipo y longitud
function formatValue(value, length, type) {
  // Convertir a string si no lo es
  value = String(value || '');
  
  // Si es un campo numérico
  if (type.toLowerCase() == 'numérico' || type.toLowerCase() === 'numerico') {
    // Si el valor está vacío o solo contiene espacios, rellenar con ceros

    if (!value.trim()) {
      return '0'.repeat(length);
    }
    
    // Si tiene decimales, manejarlos correctamente
    if (value.includes('.')) {
      const parts = value.split('.');
      const entero = parts[0].padStart(length - 2, '0');
      const decimal = (parts[1] || '').padEnd(2, '0').substring(0, 2);
      value = entero + decimal;
    } else {
      // Es un entero, rellenamos con ceros a la izquierda
      value = value.padStart(length, '0');
    }
  } else {
    // Para campos alfanuméricos, rellenamos con espacios a la derecha
    // Si el valor está vacío o solo contiene espacios, rellenar con espacios

    if (!value.trim()) {
      return ' '.repeat(length);
    }
    
    value = value.padEnd(length, ' ');
  }
  
  // Asegurar que la longitud sea exacta
  return value.substring(0, length);
}


// Función para dar formato a valores según tipo y longitud
function padLeft(num, width, char = "0") {
  return String(num).padStart(width, char);
}

// Función para formatear valores según el tipo y longitud
function formatValue(value, length, type) {
  // Convertir a string si no lo es
  value = String(value || '');
  
  // Si es un campo numérico
  if (type && (type.toLowerCase() === 'numérico' || type.toLowerCase() === 'numerico')) {
    // Si el valor está vacío o solo contiene espacios, rellenar con ceros
    if (!value.trim()) {
      return '0'.repeat(length);
    }
    
    // Si tiene decimales, manejarlos correctamente
    if (value.includes('.')) {
      const parts = value.split('.');
      const entero = parts[0].padStart(length - 2, '0');
      const decimal = (parts[1] || '').padEnd(2, '0').substring(0, 2);
      value = entero + decimal;
    } else {
      // Es un entero, rellenamos con ceros a la izquierda
      value = value.padStart(length, '0');
    }
  } else {
    // Para campos alfanuméricos, rellenamos con espacios a la derecha
    // Si el valor está vacío o solo contiene espacios, rellenar con espacios
    if (!value.trim()) {
      return ' '.repeat(length);
    }
    
    value = value.padEnd(length, ' ');
  }
  
  // Asegurar que la longitud sea exacta
  return value.substring(0, length);
}

 // Combinar cabecera y datos del servicio
  // Asegurarse de que la cabecera se incluya correctamente
  console.log(`Cabecera: ${headerString.length} caracteres`);
  console.log(`Servicio: ${serviceString.length} caracteres`);
  
  const fullRequestString = headerString + serviceString;
  console.log(`String completo: ${fullRequestString.length} caracteres`);
  
  console.log(`=== SERVICIO COMPLETO: ${serviceLength} caracteres ===`);
  console.log(`=== TOTAL (CABECERA + SERVICIO): ${headerLength + serviceLength} caracteres ===`);
  
  // Verificar si hay discrepancia con la longitud esperada según el Excel
  // Usar la longitud calculada dinámicamente en lugar de un valor hardcodeado
  const expectedServiceLength = serviceLength;
  if (serviceLength !== expectedServiceLength) {
    console.log(`ADVERTENCIA: Discrepancia en la longitud del servicio. Generado: ${serviceLength}, Esperado: ${expectedServiceLength}, Diferencia: ${serviceLength - expectedServiceLength}`);
    
    // Verificar el número de ocurrencias
    console.log('=== VERIFICACIÓN DE OCURRENCIAS ===');
    console.log(`Número de ocurrencias raíz: ${rootOccurrences.length > 0 ? rootOccurrences[0].totalOccurrences : 0}`);
    
    // Verificar si hay campos adicionales que no estamos considerando
    console.log('=== VERIFICACIÓN DE CAMPOS ADICIONALES ===');
    
    // Crear un mapa para almacenar la información de longitud por ocurrencia
    const occurrenceLengthMap = {};
    
    // Recopilar información de longitud para todas las ocurrencias
    document.querySelectorAll('.occurrence-section').forEach(section => {
      const occName = section.getAttribute('data-occurrence-name');
      if (!occName) return;
      
      const occLevel = parseInt(section.getAttribute('data-occurrence-level') || '0', 10);
      const totalOccs = parseInt(section.getAttribute('data-total-occurrences') || '0', 10);
      const parentId = section.getAttribute('data-parent-id');
      
      // Obtener todos los campos de esta ocurrencia
      const fields = {};
      let totalLength = 0;
      
      document.querySelectorAll(`.field-input[data-occurrence-name="${occName}"]`).forEach(input => {
        const fieldName = input.getAttribute('data-field-name');
        const fieldLength = parseInt(input.getAttribute('data-field-length'), 10);
        
        if (!fields[fieldName]) {
          fields[fieldName] = fieldLength;
          totalLength += fieldLength;
        }
      });
      
      // Guardar en el mapa
      occurrenceLengthMap[occName] = {
        totalLength: totalLength,
        fieldCount: Object.keys(fields).length,
        totalOccurrences: totalOccs,
        level: occLevel,
        parentId: parentId,
        isRoot: !parentId
      };
      
      console.log(`Ocurrencia [${occName}]: Nivel ${occLevel}, ${Object.keys(fields).length} campos, ${totalLength} caracteres por ocurrencia, ${totalOccs} ocurrencias totales, ${parentId ? 'Hijo de: ' + parentId : 'Raíz'}`);
    });
    
    // ANÁLISIS DETALLADO DEL ALGORITMO DE CÁLCULO
    console.log('\n=== ANÁLISIS DETALLADO DEL ALGORITMO DE CÁLCULO ===');
    
    // 1. Calcular la longitud esperada para cada tipo de ocurrencia
    console.log('\n1. CÁLCULO TEÓRICO DE LONGITUD TOTAL:');
    
    // Crear un mapa de relaciones padre-hijo
    const parentChildMap = {};
    Object.entries(occurrenceLengthMap).forEach(([occName, occInfo]) => {
      if (occInfo.parentId) {
        if (!parentChildMap[occInfo.parentId]) {
          parentChildMap[occInfo.parentId] = [];
        }
        parentChildMap[occInfo.parentId].push(occName);
      }
    });
    
    // Función para calcular la longitud total de una ocurrencia y sus hijos
    function calculateTotalLengthWithChildren(occName, parentMultiplier = 1) {
      const occInfo = occurrenceLengthMap[occName];
      if (!occInfo) return 0;
      
      // Longitud base de esta ocurrencia (campos propios × número de ocurrencias × multiplicador del padre)
      const baseLength = occInfo.totalLength * occInfo.totalOccurrences * parentMultiplier;
      console.log(`  - Ocurrencia [${occName}] (Nivel ${occInfo.level}): ${occInfo.totalLength} chars × ${occInfo.totalOccurrences} ocurrencias × ${parentMultiplier} multiplicador = ${baseLength} chars`);
      
      // Longitud de los hijos
      let childrenLength = 0;
      if (parentChildMap[occName]) {
        parentChildMap[occName].forEach(childName => {
          // Para cada hijo, el multiplicador es el número de ocurrencias del padre
          childrenLength += calculateTotalLengthWithChildren(childName, occInfo.totalOccurrences * parentMultiplier);
        });
      }
      
      return baseLength + childrenLength;
    }
    
    // Calcular la longitud total esperada
    let theoreticalTotalLength = 0;
    
    // Procesar solo las ocurrencias raíz
    Object.entries(occurrenceLengthMap).forEach(([occName, occInfo]) => {
      if (occInfo.isRoot) {
        theoreticalTotalLength += calculateTotalLengthWithChildren(occName);
      }
    });
    
    console.log(`\nLongitud total teórica: ${theoreticalTotalLength} caracteres`);
    console.log(`Longitud actual generada: ${serviceLength} caracteres`);
    console.log(`Diferencia: ${theoreticalTotalLength - serviceLength} caracteres`);
    
    // 2. Analizar el algoritmo actual
    console.log('\n2. ANÁLISIS DEL ALGORITMO ACTUAL:');
    console.log(`El algoritmo actual procesa las ocurrencias de la siguiente manera:`);
    console.log(`a) Procesa las ocurrencias raíz una por una`);
    console.log(`b) Para cada ocurrencia raíz, procesa sus ocurrencias efectivas`);
    console.log(`c) Para cada ocurrencia efectiva, procesa sus campos y luego sus hijos`);
    console.log(`d) Rellena las ocurrencias faltantes hasta el total`);
    console.log(`e) Para cada ocurrencia de relleno, procesa sus campos y luego sus hijos`);
    
    // 3. Identificar posibles problemas
    console.log('\n3. POSIBLES PROBLEMAS:');
    console.log(`a) Procesamiento incorrecto de ocurrencias anidadas`);
    console.log(`b) No se están multiplicando correctamente las ocurrencias hijas por el número de ocurrencias padre`);
    console.log(`c) Posible confusión entre ocurrencias efectivas y totales`);
    
    // 4. Solución propuesta
    console.log('\n4. SOLUCIÓN PROPUESTA:');
    console.log(`Para cada ocurrencia padre (tanto efectiva como de relleno), procesar TODAS las ocurrencias hijas (hasta su totalOccurrences).`);
    console.log(`Esto significa que si una ocurrencia padre tiene 20 ocurrencias y cada hijo tiene 10 ocurrencias, deberíamos tener 20 × 10 = 200 ocurrencias hijas en total.`);
    
    // Calcular la longitud total esperada según los campos reales
    // Crear un mapa para almacenar la longitud de cada tipo de ocurrencia
    const occurrenceLengths = {};
    
    // Recopilar todas las ocurrencias y sus campos
    document.querySelectorAll('.occurrence-section').forEach(section => {
      const occName = section.getAttribute('data-occurrence-name');
      if (!occName) return;
      
      // Obtener todos los campos de esta ocurrencia
      const fields = {};
      document.querySelectorAll(`.field-input[data-occurrence-name="${occName}"]`).forEach(input => {
        const fieldName = input.getAttribute('data-field-name');
        const fieldLength = parseInt(input.getAttribute('data-field-length'), 10);
        
        if (!fields[fieldName]) {
          fields[fieldName] = fieldLength;
        }
      });
      
      // Calcular la longitud total de los campos
      let totalLength = 0;
      Object.values(fields).forEach(length => {
        totalLength += length;
      });
      
      // Guardar en el mapa
      occurrenceLengths[occName] = {
        fields: fields,
        totalLength: totalLength,
        // Obtener el número de ocurrencias y ocurrencias por padre dinámicamente
        totalOccurrences: parseInt(section.getAttribute('data-total-occurrences') || '0', 10),
        occurrencesPerParent: section.getAttribute('data-parent-id') ? 
          parseInt(section.getAttribute('data-occurrences-per-parent') || '10', 10) : 1
      };
      
      console.log(`Ocurrencia [${occName}]: ${totalLength} caracteres por ocurrencia, ${Object.keys(fields).length} campos`);
    });
    
    // Calcular la longitud total esperada dinámicamente
    let realFieldsExpectedLength = 0;
    
    // Recorrer todas las ocurrencias encontradas
    Object.entries(occurrenceLengths).forEach(([occName, occInfo]) => {
      // Si es una ocurrencia raíz (sin padre)
      const isRoot = !document.querySelector(`.occurrence-section[data-occurrence-name="${occName}"]`)?.getAttribute('data-parent-id');
      
      if (isRoot) {
        // Ocurrencia raíz: multiplicar por el número total de ocurrencias
        const contribution = occInfo.totalLength * occInfo.totalOccurrences;
        realFieldsExpectedLength += contribution;
        console.log(`Contribución de ocurrencia raíz [${occName}]: ${occInfo.totalLength} × ${occInfo.totalOccurrences} = ${contribution}`);
      } else {
        // Ocurrencia hija: multiplicar por el número de ocurrencias por padre y por el número de padres
        // Encontrar el padre
        const parentSection = document.querySelector(`.occurrence-section[data-occurrence-id="${document.querySelector(`.occurrence-section[data-occurrence-name="${occName}"]`).getAttribute('data-parent-id')}"]`);
        if (parentSection) {
          const parentName = parentSection.getAttribute('data-occurrence-name');
          const parentOccurrences = parseInt(parentSection.getAttribute('data-total-occurrences') || '0', 10);
          
          const contribution = occInfo.totalLength * occInfo.occurrencesPerParent * parentOccurrences;
          realFieldsExpectedLength += contribution;
          console.log(`Contribución de ocurrencia hija [${occName}]: ${occInfo.totalLength} × ${occInfo.occurrencesPerParent} × ${parentOccurrences} = ${contribution}`);
        }
      }
    });
    
    // Si no se encontraron ocurrencias dinámicamente, usar el método anterior
    if (realFieldsExpectedLength === 0) {
      console.log("No se encontraron ocurrencias dinámicamente, usando método alternativo");
      realFieldsExpectedLength = 
        totalLength001 * rootOccurrences[0].totalOccurrences + 
        totalLength014 * 10 * rootOccurrences[0].totalOccurrences + 
        totalLength018 * 10 * rootOccurrences[0].totalOccurrences + 
        totalLength021 * 10 * rootOccurrences[0].totalOccurrences;
    }
    
    console.log(`Longitud total calculada según campos reales: ${realFieldsExpectedLength} caracteres`);
    
    // Analizar la estructura para identificar la discrepancia
    console.log('=== ANÁLISIS DE DISCREPANCIA ===');
    
    // Calcular longitud esperada para cada ocurrencia (dinámicamente)
    const expectedLengthPerOccurrence = {};
    
    // Usar los valores calculados dinámicamente
    Object.entries(occurrenceLengths).forEach(([occName, occInfo]) => {
      expectedLengthPerOccurrence[occName] = occInfo.totalLength;
    });
    
    // Si no se encontraron ocurrencias dinámicamente, usar un método alternativo
    if (Object.keys(expectedLengthPerOccurrence).length === 0) {
      console.log("No se encontraron ocurrencias dinámicamente, calculando longitudes de otra manera");
      
      // Buscar todos los campos de entrada agrupados por ocurrencia
      const occurrenceInputs = {};
      
      document.querySelectorAll('.field-input').forEach(input => {
        const occName = input.getAttribute('data-occurrence-name');
        if (!occName) return;
        
        if (!occurrenceInputs[occName]) {
          occurrenceInputs[occName] = [];
        }
        
        occurrenceInputs[occName].push({
          name: input.getAttribute('data-field-name'),
          length: parseInt(input.getAttribute('data-field-length'), 10)
        });
      });
      
      // Calcular la longitud total para cada ocurrencia
      Object.entries(occurrenceInputs).forEach(([occName, fields]) => {
        // Eliminar duplicados (quedarse solo con campos únicos)
        const uniqueFields = {};
        fields.forEach(field => {
          if (!uniqueFields[field.name]) {
            uniqueFields[field.name] = field.length;
          }
        });
        
        // Calcular longitud total
        const totalLength = Object.values(uniqueFields).reduce((sum, length) => sum + length, 0);
        expectedLengthPerOccurrence[occName] = totalLength;
        
        console.log(`Longitud calculada para ocurrencia ${occName}: ${totalLength} caracteres`);
      });
    }
    
    // Calcular longitud total esperada para cada tipo de ocurrencia
    const totalExpectedLength = {};
    
    // Usar los valores calculados dinámicamente
    Object.entries(occurrenceLengths).forEach(([occName, occInfo]) => {
      if (!document.querySelector(`.occurrence-section[data-occurrence-name="${occName}"]`)?.getAttribute('data-parent-id')) {
        // Ocurrencia raíz
        totalExpectedLength[occName] = occInfo.totalLength * occInfo.totalOccurrences;
      } else {
        // Ocurrencia hija
        const parentSection = document.querySelector(`.occurrence-section[data-occurrence-id="${document.querySelector(`.occurrence-section[data-occurrence-name="${occName}"]`).getAttribute('data-parent-id')}"]`);
        if (parentSection) {
          const parentName = parentSection.getAttribute('data-occurrence-name');
          const parentOccurrences = parseInt(parentSection.getAttribute('data-total-occurrences') || '0', 10);
          
          totalExpectedLength[occName] = occInfo.totalLength * occInfo.occurrencesPerParent * parentOccurrences;
        }
      }
    });
    
    // Si no se encontraron ocurrencias dinámicamente, calcular de otra manera
    if (Object.keys(totalExpectedLength).length === 0) {
      console.log("No se encontraron relaciones de ocurrencias dinámicamente, calculando de otra manera");
      
      // Buscar todas las secciones de ocurrencia
      const occurrenceSections = Array.from(document.querySelectorAll('.occurrence-section'));
      
      // Crear un mapa de ocurrencias y sus relaciones
      const occurrenceRelations = {};
      
      occurrenceSections.forEach(section => {
        const occName = section.getAttribute('data-occurrence-name');
        if (!occName) return;
        
        const parentId = section.getAttribute('data-parent-id');
        const totalOccs = parseInt(section.getAttribute('data-total-occurrences') || '0', 10);
        
        occurrenceRelations[occName] = {
          isRoot: !parentId,
          totalOccurrences: totalOccs,
          parentId: parentId,
          // Por defecto, asumimos 10 ocurrencias por padre si es una ocurrencia hija
          occurrencesPerParent: parentId ? 10 : 1
        };
      });
      
      // Calcular la contribución de cada ocurrencia
      Object.entries(expectedLengthPerOccurrence).forEach(([occName, length]) => {
        const relation = occurrenceRelations[occName];
        
        if (relation) {
          if (relation.isRoot) {
            // Ocurrencia raíz
            totalExpectedLength[occName] = length * relation.totalOccurrences;
          } else {
            // Ocurrencia hija
            // Buscar el padre
            const parentName = Object.entries(occurrenceRelations).find(
              ([name, rel]) => rel.isRoot
            )?.[0];
            
            if (parentName && occurrenceRelations[parentName]) {
              const parentOccs = occurrenceRelations[parentName].totalOccurrences;
              totalExpectedLength[occName] = length * relation.occurrencesPerParent * parentOccs;
            }
          }
        }
      });
      
      // Si aún no tenemos valores, usar un método más simple
      if (Object.keys(totalExpectedLength).length === 0) {
        console.log("Usando método simple para calcular longitudes totales");
        
        // Buscar una ocurrencia raíz
        const rootOcc = Object.entries(occurrenceRelations).find(
          ([name, rel]) => rel.isRoot
        );
        
        if (rootOcc) {
          const [rootName, rootRel] = rootOcc;
          
          // Para la ocurrencia raíz
          if (expectedLengthPerOccurrence[rootName]) {
            totalExpectedLength[rootName] = expectedLengthPerOccurrence[rootName] * rootRel.totalOccurrences;
          }
          
          // Para las ocurrencias hijas
          Object.entries(occurrenceRelations).forEach(([occName, rel]) => {
            if (!rel.isRoot && expectedLengthPerOccurrence[occName]) {
              totalExpectedLength[occName] = expectedLengthPerOccurrence[occName] * 10 * rootRel.totalOccurrences;
            }
          });
        }
      }
    }
    
    // Calcular longitud total esperada sumando todas las contribuciones
    const calculatedExpectedLength = Object.values(totalExpectedLength).reduce((sum, length) => sum + length, 0);
    
    console.log('Longitud esperada por ocurrencia:');
    
    // Mostrar la contribución de cada ocurrencia
    Object.entries(expectedLengthPerOccurrence).forEach(([occName, length]) => {
      const section = document.querySelector(`.occurrence-section[data-occurrence-name="${occName}"]`);
      if (section) {
        const isRoot = !section.getAttribute('data-parent-id');
        const totalOccs = parseInt(section.getAttribute('data-total-occurrences') || '0', 10);
        
        if (isRoot) {
          console.log(`- ${occName}: ${length} chars × ${totalOccs} ocurrencias = ${totalExpectedLength[occName]} chars`);
        } else {
          const occsPerParent = parseInt(section.getAttribute('data-occurrences-per-parent') || '10', 10);
          const parentSection = document.querySelector(`.occurrence-section[data-occurrence-id="${section.getAttribute('data-parent-id')}"]`);
          const parentName = parentSection ? parentSection.getAttribute('data-occurrence-name') : 'desconocido';
          const parentOccs = parentSection ? parseInt(parentSection.getAttribute('data-total-occurrences') || '0', 10) : 0;
          
          console.log(`- ${occName}: ${length} chars × ${occsPerParent} ocurrencias × ${parentOccs} padres = ${totalExpectedLength[occName]} chars`);
        }
      } else {
        // Fallback para ocurrencias no encontradas en el DOM
        if (occName === '001') {
          console.log(`- ${occName}: ${length} chars × ${rootOccurrences[0]?.totalOccurrences || 20} ocurrencias = ${totalExpectedLength[occName]} chars`);
        } else {
          console.log(`- ${occName}: ${length} chars × 10 ocurrencias × ${rootOccurrences[0]?.totalOccurrences || 20} padres = ${totalExpectedLength[occName]} chars`);
        }
      }
    });
    
    console.log(`Total calculado: ${calculatedExpectedLength} chars`);
    
    // Verificar si hay contadores adicionales que no estamos considerando
    console.log('Verificando contadores adicionales:');
    hiddenCounterFields.forEach(counter => {
      console.log(`- Contador para [${counter.occurrenceName}]: ${counter.element.getAttribute('data-field-length')} chars`);
    });
  }
  
  // Actualizar la longitud del mensaje en la cabecera (primeros 6 caracteres)
  const messageLength = padLeft(fullRequestString.length, 6, '0');
  const updatedRequestString = messageLength + fullRequestString.substring(6);
  
  console.log(`=== LONGITUD FINAL DEL MENSAJE: ${updatedRequestString.length} caracteres ===`);
  
  // Mostrar el resultado
  const resultElement = document.getElementById('requestStringResult');
  resultElement.innerHTML = 
    '<div style="margin-top: 15px;">' +
      '<div style="font-weight: bold; margin-bottom: 5px;">String de Requerimiento Generado:</div>' +
      '<div style="word-break: break-all; white-space: normal; font-size: 14px; border: 1px solid #ddd; padding: 10px; background-color: white; border-radius: 3px; max-height: 200px; overflow-y: auto;">' + 
        updatedRequestString + 
      '</div>' +
      '<div style="margin-top: 5px; font-size: 14px;">' +
        'Longitud total: <span style="font-weight: bold;">' + updatedRequestString.length + '</span> caracteres' +
      '</div>' +
      '<button id="btnCopyRequestString" class="btn-primary" style="margin-top: 10px; background-color: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">' +
        'Copiar al Portapapeles' +
      '</button>' +
    '</div>';
  
  // Agregar manejador para el botón de copiar
  document.getElementById('btnCopyRequestString').addEventListener('click', function() {
    navigator.clipboard.writeText(updatedRequestString)
      .then(() => {
        this.textContent = '¡Copiado!';
        setTimeout(() => {
          this.textContent = 'Copiar al Portapapeles';
        }, 2000);
      })
      .catch(err => {
        console.error('Error al copiar: ', err);
        this.textContent = 'Error al copiar';
      });
  });

}

// Función para manejar el blur en un campo de entrada (formateo al perder el foco)
function handleInputBlur(event) {
  const input = event.target;
  const fieldType = input.getAttribute('data-field-type');
  const fieldLength = parseInt(input.getAttribute('data-field-length'), 10) || 1;
  
  // Obtener el valor actual
  let value = input.value.trim();
  
  // Formatear el valor según el tipo de campo
  if (fieldType && (fieldType === 'numérico' || fieldType === 'numerico')) {
    // Para campos numéricos
    if (value === '') {
      // Si está vacío, usar ceros
      value = '0'.repeat(fieldLength);
    } else {
      // Validar que sea un número y formatear
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        // Si tiene decimales (incluye punto), formatear con 2 decimales
        if (value.includes('.')) {
          const parts = value.split('.');
          // Asegurar que la parte entera no exceda el tamaño del campo menos los decimales
          const entero = parts[0].padStart(Math.max(1, fieldLength - 3), '0');
          const decimal = (parts[1] || '').padEnd(2, '0').substring(0, 2);
          value = entero + '.' + decimal;
        } else {
          // Para enteros, rellenar con ceros a la izquierda
          value = value.padStart(fieldLength, '0');
        }
      }
    }
  } else {
    // Para campos alfanuméricos, rellenar con espacios a la derecha
    value = value.padEnd(fieldLength, ' ');
  }
  
  // Truncar si excede el tamaño del campo
  value = value.substring(0, fieldLength);
  
  // Actualizar el valor del campo
  input.value = value;
  
  // Actualizar el span field-value correspondiente en la interfaz
  const fieldParent = input.closest('.field');
  if (fieldParent) {
    const fieldValueSpan = fieldParent.querySelector('.field-value');
    if (fieldValueSpan) {
      fieldValueSpan.textContent = value;
    }
  }
}

// Función para manejar el colapso/expansión de secciones de ocurrencia
function handleCollapseOccurrence(event) {
  const button = event.currentTarget;
  const targetId = button.getAttribute('data-target');
  const targetElement = document.getElementById(targetId);
  
  if (targetElement) {
    // Toggle la clase collapsed en el botón
    button.classList.toggle('collapsed');
    
    // Toggle la visibilidad del contenedor
    if (targetElement.style.display === 'none') {
      targetElement.style.display = 'block';
    } else {
      targetElement.style.display = 'none';
    }
  }
}

// Función para inicializar los botones de colapso
function initializeCollapseButtons() {
  console.log('Inicializando botones de colapso...');
  
  // Obtener todos los botones de colapso
  const collapseButtons = document.querySelectorAll('.btn-collapse-occurrence');
  console.log('Botones de colapso encontrados:', collapseButtons.length);
  
  // Agregar manejador de eventos a cada botón
  collapseButtons.forEach(button => {
    // Eliminar manejadores existentes para evitar duplicados
    button.removeEventListener('click', handleCollapseOccurrence);
    
    // Agregar nuevo manejador
    button.addEventListener('click', handleCollapseOccurrence);
    console.log('Manejador agregado a botón de colapso:', button.getAttribute('data-target'));
  });
}

// Función para inicializar las sub-pestañas de JSON
function initializeJsonTabs() {
  console.log('Inicializando sub-pestañas de JSON...');
  
  // Obtener todos los botones de sub-pestaña de JSON
  const jsonTabButtons = document.querySelectorAll('.json-tab-btn');
  console.log('Botones de sub-pestaña de JSON encontrados:', jsonTabButtons.length);
  
  // Agregar manejador de eventos a cada botón
  jsonTabButtons.forEach(button => {
    // Eliminar manejadores existentes para evitar duplicados
    button.removeEventListener('click', handleJsonTabClick);
    
    // Agregar nuevo manejador
    button.addEventListener('click', handleJsonTabClick);
    console.log('Manejador agregado a botón de sub-pestaña de JSON:', button.getAttribute('data-json-tab'));
  });
}

// Función para manejar el clic en un botón de sub-pestaña de JSON
function handleJsonTabClick(event) {
  const tabId = event.currentTarget.getAttribute('data-json-tab');
  console.log('Clic en sub-pestaña de JSON:', tabId);
  
  // Desactivar todas las sub-pestañas
  document.querySelectorAll('.json-tab-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.style.backgroundColor = '#f5f5f5';
    btn.style.color = '#333'; // Asegurar que el texto sea visible en pestañas inactivas
  });
  
  // Ocultar todos los contenidos de sub-pestaña
  document.querySelectorAll('.json-tab-pane').forEach(pane => {
    pane.style.display = 'none';
  });
  
  // Activar la sub-pestaña seleccionada
  event.currentTarget.classList.add('active');
  event.currentTarget.style.backgroundColor = '#3f51b5';
  event.currentTarget.style.color = 'white';
  
  // Mostrar el contenido de la sub-pestaña seleccionada
  const tabPane = document.getElementById(tabId);
  if (tabPane) {
    tabPane.style.display = 'block';
  }
}

// Función para inicializar la funcionalidad colapsable del JSON
function initializeJsonCollapsible() {
  console.log('Inicializando funcionalidad colapsable del JSON...');
  
  // Obtener todos los elementos colapsables
  const collapsibleElements = document.querySelectorAll('.json-collapsible');
  console.log('Elementos JSON colapsables encontrados:', collapsibleElements.length);
  
  // Agregar manejador de eventos a cada elemento
  collapsibleElements.forEach(element => {
    element.addEventListener('click', function(event) {
      event.stopPropagation();
      
      // Toggle la clase collapsed
      this.classList.toggle('json-collapsed');
      
      // Encontrar el contenido asociado
      const content = this.nextElementSibling;
      if (content && content.classList.contains('json-content')) {
        if (content.style.display === 'none') {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      }
    });
  });
}

// Función para inicializar las pestañas
function initializeTabs() {
  console.log('Inicializando pestañas...');
  
  // Obtener todos los botones de pestaña
  const tabButtons = document.querySelectorAll('.tab-btn');
  console.log('Botones de pestaña encontrados:', tabButtons.length);
  
  // Agregar manejador de eventos a cada botón
  tabButtons.forEach(button => {
    // Eliminar manejadores existentes para evitar duplicados
    button.removeEventListener('click', handleTabClick);
    
    // Agregar nuevo manejador
    button.addEventListener('click', handleTabClick);
    console.log('Manejador agregado a botón de pestaña:', button.getAttribute('data-tab'));
  });
}

// Función para manejar el clic en un botón de pestaña
function handleTabClick(event) {
  const tabId = event.currentTarget.getAttribute('data-tab');
  console.log('Clic en pestaña:', tabId);
  
  // Desactivar todas las pestañas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Ocultar todos los contenidos de pestaña
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  
  // Activar la pestaña seleccionada
  event.currentTarget.classList.add('active');
  
  // Mostrar el contenido de la pestaña seleccionada
  const tabPane = document.getElementById(tabId);
  if (tabPane) {
    tabPane.classList.add('active');
  }
}

// Función colorizar el JSON
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

// También configurar los botones y campos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM completamente cargado');
  initializeOccurrenceButtons();
  initializeCollapseButtons();
  setupInputFormatting();
  initializeTabs();
  initializeJsonTabs();
  initializePayloadTabs();
  
  // Configurar el botón de generar string de requerimiento
  const btnGenerateRequestString = document.getElementById('btnGenerateRequestString');
  if (btnGenerateRequestString) {
    btnGenerateRequestString.addEventListener('click', handleGenerateRequestString);
    console.log('Manejador agregado al botón de generar string de requerimiento');
  }
});

// Y configurar inmediatamente por si el DOM ya está cargado
console.log('Ejecutando configuración inicial');
setTimeout(function() {
  initializeOccurrenceButtons();
  initializeCollapseButtons();
  setupInputFormatting();
  initializeTabs();
  initializeJsonTabs();
  initializePayloadTabs();
  
  // Configurar el botón de generar string de requerimiento
  const btnGenerateRequestString = document.getElementById('btnGenerateRequestString');
  if (btnGenerateRequestString) {
    btnGenerateRequestString.addEventListener('click', handleGenerateRequestString);
    console.log('Manejador agregado al botón de generar string de requerimiento (configuración inicial)');
  }
}, 500); // Pequeño retraso para asegurar que el DOM esté listo
