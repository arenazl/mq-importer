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
      const fileBuffer = await serviceInput.files[0].arrayBuffer();
      
      // Definir la estructura de cabecera directamente en el código
      const headerStructure = {
        "totalLength": 102,
        "fields": [
          {
            "name": "LONGITUD DEL MENSAJE",
            "length": 6,
            "type": "NUMERICO",
            "required": "OBLIGATORIO",
            "values": "",
            "description": "Longitud total del mensaje"
          },
          {
            "name": "CANAL",
            "length": 2,
            "type": "ALFANUMERICO",
            "required": "OBLIGATORIO",
            "values": "",
            "description": "Canal por el que se realiza la transacción"
          },
          {
            "name": "SERVICIO",
            "length": 4,
            "type": "NUMERICO",
            "required": "OBLIGATORIO",
            "values": "0000 Transaccion exitosa\n8001 Error validacion de datos\n8992 CANAL/SERVICIO NO HABILITADO\n8991 ERROR Validacion Header mensaje\n8993 SERVICIO NO HABILITADO POR CANAL\n8001 ERROR PARRAFO DE VALIDACION GENERAL\n9099+ COD RET <> 0 DEL MODULO KYOSC3090\n0000 COSRTE <> 0 DEL MODULO KYOSC3090\n9001 POSICION DEUDORA NO PERMITIDA\n9002 CUENTA INEXISTENTE MODULO 6000\n9003 IMPUTACION RECHAZADA POR CUENTA BLOQUEA\n9004 IMPUTACION RECHAZADA POR MOVIMIENTO ORIG APLICADO\n9005 MODULO EDO4009 NUMERADOR TERMINA CON ERI\n9006 ERROR EN ACCESO A TABLA DB2 Y4Y9CT01\n9007 ERROR EN ACCESO A TABLA DB2 Y8S30PA0\n9000 COD RET <> 0 DEL MODULO KYOSC3090\n9099 (6001)- SUCURSAL NO OPERATIVA - FDO6001Y\n9099 (6001)- CUENTA CONTABLE NO VIGENTE - FDO6001Y\n9099 (6072)- CUENTA NO DISPONIBLE - FECHA DE FIN DE VIGENCIA MENOR O IGUAL A FECHA DE MOVIMIENTO - F\n9099 (6073)- SALDO CONTRANATURALEZA - FDO6001Y\n9099 (6074)- SALDO INSUFICIENTE - FDO6001Y\n9099 (6075)- FALTA TIT PARA IMPUTAR - FDO6001Y\n9099 (6076)- NRO MVTO NO ACORDE CON CTA - FDO6001Y\n9099 (6077)- FALTA CONCEPTO DEL APUNTE - FDO6001Y\n9099 (6079)- FALTAN INTERVINIENTES - FDO6001Y\n9099 (6080)- BANCO-SUCURSAL INEXISTENTE - FDO6001Y\n9099 (6097)- MONEDA NO COINCIDE CON CUENTA - FDO6\n9099 (6161)- FECHA CONTAB NO VALIDA - FDO6001Y\n9099 (6998)- OPERACION NO VALIDO - FDO6001Y",
            "description": "Código que identifica el servicio"
          },
          {
            "name": "CÓDIGO DE RETORNO",
            "length": 4,
            "type": "NUMERICO",
            "required": "OBLIGATORIO",
            "values": "",
            "description": "Código que indica el resultado del procesamiento"
          },
          {
            "name": "ID DEL MENSAJE",
            "length": 9,
            "type": "NUMERICO",
            "required": "OBLIGATORIO",
            "values": "",
            "description": "Identificador único del mensaje"
          },
          {
            "name": "FECHA",
            "length": 8,
            "type": "NUMERICO",
            "required": "OBLIGATORIO",
            "values": "",
            "description": "Fecha en formato AAAAMMDD"
          },
          {
            "name": "HORA",
            "length": 6,
            "type": "NUMERICO",
            "required": "OBLIGATORIO",
            "values": "",
            "description": "Hora en formato HHMMSS"
          },
          {
            "name": "USUARIO",
            "length": 7,
            "type": "ALFANUMERICO",
            "required": "OBLIGATORIO",
            "values": "",
            "description": "Código que identifica al usuario"
          },
          {
            "name": "Ubicación",
            "length": 4,
            "type": "NUMERICO",
            "required": "OBLIGATORIO",
            "values": "",
            "description": "Código de ubicación"
          },
          {
            "name": "TEXTO DEL CÓDIGO DE RETORNO",
            "length": 45,
            "type": "ALFANUMERICO",
            "required": "OBLIGATORIO",
            "values": "CÓDIGO DE RETORNO <> 0 texto del mensaje ESTADO ENVIADO <> 0 texto del mensaje",
            "description": "Texto descriptivo del código de retorno"
          },
          {
            "name": "ESTADO ENVIADO",
            "length": 2,
            "type": "NUMERICO",
            "required": "OBLIGATORIO",
            "values": "",
            "description": "Estado del mensaje enviado"
          },
          {
            "name": "CAMPO COMPLEMENTARIO",
            "length": 5,
            "type": "ALFANUMERICO",
            "required": "OBLIGATORIO",
            "values": "",
            "description": "Campo complementario"
          }
        ]
      };
      
      // Hacer la estructura de cabecera disponible globalmente para displayMessageStructure
      window.headerStructure = headerStructure;
      
      console.log('Estructura de cabecera cargada correctamente:', headerStructure);
      
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
