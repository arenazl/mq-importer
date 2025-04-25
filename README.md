# MQ Importer API

API para importación y procesamiento de mensajes MQ. Esta API permite procesar payloads JSON y generar mensajes en formato MQ, así como analizar mensajes MQ y convertirlos a formato JSON.

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar el servidor en modo desarrollo
npm run dev

# Iniciar el servidor en modo producción
npm start
```

## Endpoints

### GET /

Devuelve información básica sobre la API y los endpoints disponibles.

### GET /api/header

Devuelve la estructura de la cabecera utilizada para los mensajes MQ.

### POST /api/process

Procesa un payload JSON y genera un mensaje en formato MQ.

#### Ejemplo de payload

```json
{
  "header": {
    "CANAL": "OT",
    "SERVICIO": "3050",
    "USUARIO": "USUARIO1"
  },
  "data": {
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
  "section": "request"
}
```

#### Ejemplo de respuesta

```json
{
  "message": "000643OT3050000000000076118092012114044PASCUAL1047                                             00     VALOR1    12345020CC1 123OCC2 456VALOR FINAL     ",
  "length": 152,
  "status": "success"
}
```

### POST /api/parse

Analiza un mensaje en formato MQ y lo convierte a formato JSON.

#### Ejemplo de payload

```json
{
  "message": "000643OT3050000000000076118092012114044PASCUAL1047                                             00     VALOR1    12345020CC1 123OCC2 456VALOR FINAL     ",
  "serviceStructure": {
    "serviceNumber": "3050",
    "serviceName": "Servicio de Ejemplo",
    "request": {
      "totalLength": 50,
      "elements": [
        {
          "type": "field",
          "index": 0,
          "name": "SVC3050-CAMPO1",
          "length": 10,
          "fieldType": "ALFANUMERICO",
          "required": "OBLIGATORIO",
          "values": "",
          "description": "Campo de ejemplo 1"
        },
        // ... resto de la estructura
      ]
    }
  }
}
```

#### Ejemplo de respuesta

```json
{
  "parsed": {
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
      "TEXTO DEL CÓDIGO DE RETORNO": "",
      "ESTADO ENVIADO": "00",
      "CAMPO COMPLEMENTARIO": ""
    },
    "data": {
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
    "section": "request"
  },
  "status": "success"
}
```

## Estructura de los mensajes

### Cabecera

La cabecera de los mensajes MQ tiene una estructura fija definida en el archivo `header-structure.json`. Esta estructura incluye campos como:

- LONGITUD DEL MENSAJE
- CANAL
- SERVICIO
- CÓDIGO DE RETORNO
- ID DEL MENSAJE
- FECHA
- HORA
- USUARIO
- Ubicación
- TEXTO DEL CÓDIGO DE RETORNO
- ESTADO ENVIADO
- CAMPO COMPLEMENTARIO

### Estructura del servicio

La estructura del servicio define los campos y ocurrencias que componen el mensaje MQ. Esta estructura puede ser proporcionada en el payload o se utilizará la estructura por defecto definida en el archivo `service-structure.json`.

## Uso con herramientas como Postman

Para probar la API con herramientas como Postman, puedes utilizar los siguientes ejemplos:

1. Obtener la estructura de la cabecera:
   - Método: GET
   - URL: http://localhost:3000/api/header

2. Procesar un payload:
   - Método: POST
   - URL: http://localhost:3000/api/process
   - Body (raw, JSON):
   ```json
   {
     "header": {
       "CANAL": "OT",
       "SERVICIO": "3050",
       "USUARIO": "USUARIO1"
     },
     "data": {
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
     "section": "request"
   }
   ```

3. Analizar un mensaje:
   - Método: POST
   - URL: http://localhost:3000/api/parse
   - Body (raw, JSON):
   ```json
   {
     "message": "000643OT3050000000000076118092012114044PASCUAL1047                                             00     VALOR1    12345020CC1 123OCC2 456VALOR FINAL     ",
     "serviceStructure": {
       "serviceNumber": "3050",
       "serviceName": "Servicio de Ejemplo",
       "request": {
         "totalLength": 50,
         "elements": [
           // ... estructura del servicio
         ]
       }
     }
   }
   ```

## Licencia

MIT
