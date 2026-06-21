# Time Microservice

Este es el microservicio de tiempo para el sistema de consulta de hora y temperatura. Se encarga de obtener la hora local y zona horaria de un país o ciudad seleccionado. Funciona de manera independiente y delegará cualquier cálculo comparativo de diferencia horaria al frontend del sistema.

El proyecto está construido usando **Node.js**, **Express.js** y **CORS**.

---

## Características

- **Sin Variables de Entorno (.env)**: La clave de API se coloca directamente en el código para coincidir con la arquitectura del microservicio de clima.
- **API Externa de Confianza**: Utiliza la API de zonas horarias de **WeatherAPI.com** para obtener la hora local oficial de cualquier ciudad o país de forma directa.
- **Fallback de datos simulados**: Si la clave de API está vacía o es inválida, el microservicio generará automáticamente horas y zonas horarias realistas para pruebas comunes (España, Argentina, Japón, Colombia, USA, Nicaragua, etc.) utilizando un algoritmo de fallback determinista.
- **Middleware de registro básico**: Registra por consola las solicitudes entrantes con su marca de tiempo correspondiente.
- **Manejo de errores global**: Estructura de respuesta de errores limpia en formato JSON.

---

## Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).

---

## Configuración y Arranque

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **API Key integrada**:
   La clave de API de WeatherAPI.com está definida directamente en [server.js](file:///c:/Users/98272/time-microservice/server.js):
   ```javascript
   const WEATHER_API_KEY = "918194e388c44b24ac5192041262106";
   ```

3. **Iniciar el servidor**:
   - En desarrollo (modo watch):
     ```bash
     npm run dev
     ```
   - En producción:
     ```bash
     npm start
     ```

---

## Endpoints de la API

### 1. Estado del Microservicio (`GET /health`)
Verifica el estado del servicio y el origen de los datos de tiempo (API Real o Simulador).

* **URL**: `http://localhost:3002/health`
* **Respuesta de ejemplo**:
  ```json
  {
    "status": "UP",
    "service": "time-microservice",
    "timestamp": "2026-06-21T20:32:26.123Z",
    "timeSource": "WeatherAPI Timezone"
  }
  ```

### 2. Obtener Hora Local (`GET /api/time`)
Obtiene los detalles de la hora local y la zona horaria del lugar especificado.

* **URL**: `http://localhost:3002/api/time?country=Spain`
* **Parámetros**:
  - `country` (Requerido): Nombre del país o ciudad a consultar.
* **Respuesta de ejemplo**:
  ```json
  {
    "name": "Madrid",
    "country": "Spain",
    "timezone": "Europe/Madrid",
    "localtime": "2026-06-21 22:28",
    "isMock": false
  }
  ```