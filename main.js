/**
 * Main initialization and processing functions
 */

// Elementos del DOM
const serviceInput = document.getElementById('serviceInput');
const output = document.getElementById('output');
const fileName = document.getElementById('fileName');

// Evento para mostrar el nombre del archivo seleccionado
serviceInput.addEventListener('change', function() {
  if (serviceInput.files && serviceInput.files.length > 0) {
    fileName.textContent = serviceInput.files[0].name;
  } else {
    fileName.textContent = 'Ningún archivo seleccionado';
  }
  
  // Procesar el archivo
  procesarArchivos();
});

/**
 * Procesa el archivo Excel subido para extraer su estructura y generar el mensaje
 */
async function procesarArchivos() {
    try {
      // Verificar que se haya seleccionado un archivo
      if (!serviceInput.files || serviceInput.files.length === 0) {
        output.textContent = 'Error: Por favor seleccione un archivo Excel';
        return;
      }
      const file = serviceInput.files[0]; // Get the file object
      const fileBuffer = await file.arrayBuffer(); // Keep for local parsing

      // --- Upload file to server ---
      const formData = new FormData();
      formData.append('file', file); // 'file' must match the key expected by the server route

      try {
        const response = await fetch('/excel/upload', { // Assuming the API is served from the same origin or proxied
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Server error: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }

        const result = await response.json();
        console.log('File uploaded successfully:', result);
        // You could potentially use the returned filenames (result.header_structure_file, etc.) if needed

      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        output.textContent = `Error uploading file: ${uploadError.message}`;
        // Decide if you want to stop processing or continue with local display
        // return; // Uncomment to stop if upload fails
      }
      // --- End Upload ---
      
      // Obtener estructura de cabecera desde el Excel (local parsing for immediate display)
      const headerStructure = parseHeaderStructure(fileBuffer);
      
      // Hacer la estructura de cabecera disponible globalmente para displayMessageStructure
      window.headerStructure = headerStructure;
      
      console.log('Estructura de cabecera cargada dinámicamente desde Excel:', headerStructure);
      
      // Obtener estructura del servicio
      const serviceStructure = parseServiceStructure(fileBuffer);
 
      // Validar que la estructura de servicio sea correcta
      if (!serviceStructure || !serviceStructure.request || !serviceStructure.response) {
        output.textContent = 'Error: No se pudo obtener una estructura de servicio válida';
        console.error('Estructura de servicio inválida:', serviceStructure);
        return;
      }
      
      // Hacer la estructura de servicio disponible globalmente
      window.serviceStructure = serviceStructure;
      
      console.log('Estructura de servicio obtenida correctamente y disponible globalmente como window.serviceStructure:', serviceStructure);
      
      // Calcular conteo de campos totales 
      const calculateTotalFields = (section) => {
        let totalFields = section.fieldCount || 0;
        
        // Función recursiva para contar campos en ocurrencias
        const countOccurrenceFields = (elements) => {
          let count = 0;
          for (const element of elements) {
            if (element.type === 'occurrence') {
              // Contar campos de la ocurrencia
              count += element.fields.length * element.count;
              
              // Contar campos en ocurrencias anidadas (ahora usando children)
              if (element.children && Array.isArray(element.children)) {
                const childOccurrences = element.children.filter(child => child.type === 'occurrence');
                if (childOccurrences.length > 0) {
                  childOccurrences.forEach(childOcc => {
                    count += countOccurrenceFields([childOcc]);
                  });
                }
              }
            }
          }
          return count;
        };
        
        // Sumar campos de ocurrencias
        totalFields += countOccurrenceFields(section.elements);
        
        return totalFields;
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
      
      // Mostrar información completa en consola
      console.log(`Servicio: ${serviceStructure.serviceNumber}`);
      console.log(`Request: ${calculateTotalFields(serviceStructure.request)} campos totales`);
      console.log(`Response: ${calculateTotalFields(serviceStructure.response)} campos totales`);
      
      // Cargar datos del mensaje desde el archivo JSON
      try {
        // Crear un mensaje con los datos proporcionados
        const messageData = {
          "header": {
            "LONGITUD DEL MENSAJE": "000643",
            "CANAL": "OT",
            "SERVICIO": "3050",
            "CÓDIGO DE RETORNO": "0000",
            "ID DEL MENSAJE": "000000761",
            "FECHA": "18092012",
            "HORA": "114044",
            "USUARIO": "PASCUAL",
            "Ubicación": "1047",
          "TEXTO DEL CÓDIGO DE RETORNO": "                                             ",
          "ESTADO ENVIADO": "00",
          "CAMPO COMPLEMENTARIO": "     "
          },
          "data": {},
          "section": "request"
        };
        
        console.log("Datos del mensaje cargados:", messageData);
        
        // Crear un mensaje con los datos cargados
        //const message = createMessage(headerStructure, serviceStructure, messageData, "request");
        
      // Mostrar la estructura del mensaje utilizando el nuevo método
      displayMessageStructure(null, serviceStructure);
      
      // Inicializar las pestañas
      initializeTabs();
        
        console.log("Mensaje mostrado correctamente con los datos proporcionados");
      } catch (error) {
        console.error("Error al cargar los datos del mensaje:", error);
        
        // Si hay un error, mostrar la estructura vacía
        console.log("Mostrando estructura vacía sin datos iniciales");
        
        // Crear un mensaje vacío (solo la estructura)
        const emptyMessage = " ".repeat(headerStructure.fields.reduce((sum, field) => sum + field.length, 0) + serviceStructure.request.totalLength);
        
        // Mostrar la estructura del mensaje utilizando el nuevo método
        const detalle = displayMessageStructure(emptyMessage, serviceStructure);
        output.innerHTML = detalle;
      }
      
      console.log('Estructura mostrada correctamente');
    } catch (err) {
      console.error('Error al procesar el archivo:', err);
      output.textContent = 'Error: ' + err.message;
    }
  }

/**
 * Interfaz para uso en aplicaciones web
 * Expone las funciones principales como una API fácil de usar
 */
const MessageProcessor = {
  // Funciones principales
  createMessage,
  parseMessage,
  // validateMessage, // Esta función no está definida, la comentamos
  displayMessageStructure,
  
  // Funciones de exportación
  exportServiceDefinitionToJSON,
  exportServiceDefinitionToText,
  
  // Funciones de ayuda (útiles para debugging o uso avanzado)
  utils: {
    parseHeaderStructure,
    parseServiceStructure,
    createHeader,
    createServiceData,
    formatValue,
    padLeft,
    padRight
  }
};
