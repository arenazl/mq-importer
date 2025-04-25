/**
 * Script de prueba para la API de MQ Importer
 * 
 * Este script muestra cómo utilizar la API programáticamente
 * para procesar un payload y generar un mensaje MQ.
 */

const http = require('http');

// Configuración
const API_HOST = 'localhost';
const API_PORT = 3000;
const API_PATH = '/api/process';

// Payload de ejemplo
const payload = {
  header: {
    "CANAL": "OT",
    "SERVICIO": "3050",
    "USUARIO": "USUARIO1"
  },
  data: {
    "SVC3050-CAMPO1": "VALOR1",
    "SVC3050-CAMPO2": "12345",
    "SVC3050-CANT-OCURR": "02",
    "occurrence_3": [
      {
        "SVC3050-OCC-CAMPO1": "OCC1",
        "SVC3050-OCC-CAMPO2": "123"
      },
      {
        "SVC3050-OCC-CAMPO1": "OCC2",
        "SVC3050-OCC-CAMPO2": "456"
      }
    ],
    "SVC3050-CAMPO3": "VALOR FINAL"
  },
  section: "request"
};

// Opciones para la solicitud HTTP
const options = {
  hostname: API_HOST,
  port: API_PORT,
  path: API_PATH,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Crear la solicitud
const req = http.request(options, (res) => {
  console.log(`Código de estado: ${res.statusCode}`);
  
  let data = '';
  
  // Recibir los datos de la respuesta
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // Procesar la respuesta completa
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Respuesta recibida:');
      console.log('-------------------');
      console.log(`Mensaje: ${response.message}`);
      console.log(`Longitud: ${response.length}`);
      console.log(`Estado: ${response.status}`);
      
      // Mostrar el mensaje formateado para mejor visualización
      console.log('\nMensaje formateado:');
      console.log('-------------------');
      
      // Formatear la cabecera (primeros 102 caracteres)
      const header = response.message.substring(0, 102);
      console.log('Cabecera:');
      console.log(header);
      
      // Formatear los datos del servicio (resto del mensaje)
      const serviceData = response.message.substring(102);
      console.log('\nDatos del servicio:');
      console.log(serviceData);
      
    } catch (error) {
      console.error('Error al procesar la respuesta:', error.message);
    }
  });
});

// Manejar errores de la solicitud
req.on('error', (error) => {
  console.error('Error en la solicitud:', error.message);
});

// Enviar el payload
req.write(JSON.stringify(payload));
req.end();

console.log('Solicitud enviada. Esperando respuesta...');
