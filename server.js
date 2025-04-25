const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Cargar las estructuras necesarias
const headerStructure = require('./header-structure.json');

// Importar funciones de utilidad
const utils = require('./api/utils');
const messageCreator = require('./api/message-creator');
const messageAnalyzer = require('./api/message-analyzer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'API de procesamiento de mensajes MQ',
    endpoints: {
      '/api/process': 'POST - Procesa un payload y devuelve un mensaje formateado',
      '/api/parse': 'POST - Analiza un mensaje y devuelve su estructura',
      '/api/header': 'GET - Devuelve la estructura de la cabecera'
    }
  });
});

// Endpoint para obtener la estructura de la cabecera
app.get('/api/header', (req, res) => {
  res.json(headerStructure);
});

// Endpoint principal para procesar un payload y generar un mensaje
app.post('/api/process', (req, res) => {
  try {
    const payload = req.body;
    
    if (!payload) {
      return res.status(400).json({ error: 'Se requiere un payload en el cuerpo de la solicitud' });
    }

    // Verificar si se proporcionó una estructura de servicio
    let serviceStructure = payload.serviceStructure;
    
    if (!serviceStructure) {
      // Si no se proporcionó una estructura, intentar cargar una por defecto
      try {
        serviceStructure = require('./service-structure.json');
      } catch (err) {
        return res.status(400).json({ 
          error: 'No se proporcionó una estructura de servicio y no se pudo cargar una por defecto',
          details: 'Incluya la estructura del servicio en el payload o asegúrese de que exista un archivo service-structure.json'
        });
      }
    }

    // Preparar los datos del mensaje
    const messageData = {
      header: payload.header || {},
      data: payload.data || {},
      section: payload.section || 'request'
    };

    // Crear el mensaje
    const message = messageCreator.createMessage(headerStructure, serviceStructure, messageData, messageData.section);
    
    // Devolver el resultado
    res.json({
      message: message,
      length: message.length,
      status: 'success'
    });
  } catch (error) {
    console.error('Error al procesar el payload:', error);
    res.status(500).json({
      error: 'Error al procesar el payload',
      details: error.message
    });
  }
});

// Endpoint para analizar un mensaje y devolver su estructura
app.post('/api/parse', (req, res) => {
  try {
    const { message, serviceStructure } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Se requiere un mensaje para analizar' });
    }
    
    if (!serviceStructure) {
      return res.status(400).json({ error: 'Se requiere la estructura del servicio para analizar el mensaje' });
    }
    
    // Analizar el mensaje
    const parsedMessage = messageAnalyzer.parseMessage(message, headerStructure, serviceStructure);
    
    // Devolver el resultado
    res.json({
      parsed: parsedMessage,
      status: 'success'
    });
  } catch (error) {
    console.error('Error al analizar el mensaje:', error);
    res.status(500).json({
      error: 'Error al analizar el mensaje',
      details: error.message
    });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor API MQ iniciado en el puerto ${PORT}`);
  console.log(`Accede a la API en http://localhost:${PORT}`);
});
