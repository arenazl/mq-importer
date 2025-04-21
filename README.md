# MQ Importer

Aplicación web para importar, procesar y analizar mensajes MQ a partir de archivos Excel.

## Características

- Importación de estructuras de mensajes desde archivos Excel
- Visualización de estructuras de mensajes en formato amigable
- Generación de JSON para requerimientos
- Análisis de mensajes y validación de estructuras
- Generación de strings de requerimiento con formato correcto

## Instalación

Este proyecto es una aplicación web estática que no requiere instalación de servidor. Simplemente clona el repositorio y abre el archivo `index.html` en tu navegador.

```bash
git clone <url-del-repositorio>
cd mq-importer
```

Para desarrollo local con un servidor:

```bash
# Instalar dependencias
npm install

# Iniciar servidor local
npm start
```

## Uso

1. Abre la aplicación en tu navegador
2. Selecciona un archivo Excel con la estructura del servicio
3. La aplicación procesará el archivo y mostrará la estructura en diferentes pestañas:
   - **Cabecera**: Muestra los campos de la cabecera del mensaje
   - **Requerimiento**: Muestra la estructura del requerimiento
   - **Respuesta**: Muestra la estructura de la respuesta
   - **Estructura**: Muestra la estructura en formato JSON
   - **Payload**: Genera un JSON vacío con la estructura del requerimiento

## Despliegue en Netlify

Este proyecto está configurado para ser desplegado fácilmente en Netlify:

1. Crea una cuenta en [Netlify](https://www.netlify.com/)
2. Conecta tu repositorio de GitHub/GitLab/Bitbucket
3. Selecciona el repositorio y configura las opciones de despliegue:
   - Build command: (dejar en blanco)
   - Publish directory: /

Netlify detectará automáticamente la configuración en el archivo `netlify.toml`.

También puedes desplegar manualmente arrastrando la carpeta del proyecto a la interfaz de Netlify.

## Estructura del Proyecto

- `index.html`: Punto de entrada de la aplicación
- `styles.css`: Estilos de la aplicación
- `*.js`: Archivos JavaScript con la lógica de la aplicación:
  - `main.js`: Funciones principales
  - `init.js`: Inicialización de la aplicación
  - `structure-parser.js`: Parseo de estructuras
  - `message-creator.js`: Creación de mensajes
  - `message-analyzer.js`: Análisis de mensajes
  - `utils.js`: Funciones de utilidad
  - `date-formatter.js`: Formateo de fechas
  - `export-functions.js`: Funciones de exportación
- `xlsx.full.min.js`: Biblioteca para procesar archivos Excel

## Licencia

MIT
