# SurveyApp — Frontend

Aplicación web para crear, publicar y analizar encuestas. Construida con **React + Vite**, tema brutalist terminal con tipografías VT323 y Share Tech Mono.

---

## Requisitos

- Node.js 18+
- npm 9+
- Backend corriendo en `http://localhost:3001` (configurable vía `.env`)

---

## Instalación

```bash
# 1. Clonar o descomprimir el proyecto
unzip frontend-survey.zip
cd frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL de tu backend

# 4. Levantar servidor de desarrollo
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Build de producción en `/dist` |
| `npm run preview` | Preview del build de producción |

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `http://localhost:3001` |

---

## Estructura del proyecto

```
frontend/
├── index.html
├── vite.config.js
├── package.json
├── .env.example
└── src/
    ├── main.jsx              # Entry point
    ├── App.jsx               # Router principal y rutas privadas
    ├── theme.css             # Sistema de diseño global (variables, clases utilitarias)
    ├── context/
    │   └── AuthContext.jsx   # Estado de autenticación global
    ├── services/
    │   └── api.js            # Instancia axios + interceptores + todos los endpoints
    └── pages/
        ├── LoginPage.jsx         # Login y registro
        ├── DashboardPage.jsx     # Lista de encuestas, stats y filtros
        ├── SurveyBuilderPage.jsx # Constructor de encuestas
        ├── PublicSurveyPage.jsx  # Formulario público (sin auth)
        └── ReportPage.jsx        # Reportes y análisis por encuesta
```

---

## Rutas

| Ruta | Componente | Auth requerida |
|---|---|---|
| `/login` | LoginPage | No |
| `/s/:token` | PublicSurveyPage | No |
| `/dashboard` | DashboardPage | Sí |
| `/surveys/new` | SurveyBuilderPage | Sí |
| `/surveys/:surveyId/edit` | SurveyBuilderPage | Sí |
| `/surveys/:surveyId/report` | ReportPage | Sí |
| `/*` | — | Redirige a `/dashboard` |

---

## Endpoints que consume

### Auth

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Registro de nuevo usuario. Body: `{ name, email, password }` |
| `POST` | `/auth/login` | Login. Body: `{ email, password }`. Retorna `{ token, refresh_token, user }` |
| `POST` | `/auth/logout` | Cierra sesión (invalida token en servidor) |
| `POST` | `/auth/refresh` | Refresca el access token. Body: `{ refresh_token }`. Retorna `{ token, refresh_token }` |

### Surveys (requieren Bearer token)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/surveys` | Lista de encuestas. Query params: `limit`, `status` |
| `POST` | `/surveys` | Crear encuesta. Body: `{ title, description, type, settings }` |
| `GET` | `/surveys/:id` | Obtener encuesta por ID (incluye `questions`) |
| `PUT` | `/surveys/:id` | Actualizar encuesta |
| `DELETE` | `/surveys/:id` | Eliminar encuesta |
| `POST` | `/surveys/:id/publish` | Publicar encuesta. Retorna `{ public_token, public_url }` |
| `POST` | `/surveys/:id/close` | Cerrar encuesta |
| `POST` | `/surveys/:id/duplicate` | Duplicar encuesta |

### Preguntas (requieren Bearer token)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/surveys/:id/questions` | Listar preguntas de una encuesta |
| `POST` | `/surveys/:id/questions` | Agregar pregunta. Body: `{ text, type, required, order, options, scale_config }` |
| `PUT` | `/surveys/:sid/questions/:qid` | Actualizar pregunta |
| `DELETE` | `/surveys/:sid/questions/:qid` | Eliminar pregunta |
| `PATCH` | `/surveys/:id/questions/reorder` | Reordenar preguntas. Body: `{ order: [id1, id2, ...] }` |

### Respuestas y reportes (requieren Bearer token)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/surveys/:id/responses` | Listar respuestas de una encuesta |
| `GET` | `/surveys/:id/reports` | Reporte completo con KPIs, stats por pregunta y respuestas en el tiempo |

### Público (sin auth)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/public/surveys/:token` | Obtener datos de encuesta pública por token |
| `POST` | `/public/surveys/:token/respond` | Enviar respuesta. Body: `{ respondent_name, respondent_email, started_at, answers: [{ question_id, value }] }` |

---

### Estructura esperada de respuestas del backend

**`GET /surveys` →**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "type": "satisfaction | academic | feedback | poll | quiz",
      "status": "draft | active | closed | archived",
      "public_token": "string | null",
      "created_at": "ISO date",
      "updated_at": "ISO date"
    }
  ]
}
```

**`GET /surveys/:id/reports` →**
```json
{
  "survey_title": "string",
  "total_assigned": 0,
  "total_responses": 0,
  "completion_rate": 0,
  "avg_duration_seconds": 0,
  "responses_by_day": [{ "date": "YYYY-MM-DD", "count": 0 }],
  "questions_summary": [
    {
      "question_id": "uuid",
      "question_text": "string",
      "question_type": "string",
      "response_count": 0,
      "skip_count": 0,
      "option_stats": [{ "option_text": "string", "count": 0, "percentage": 0.0 }],
      "numeric_stats": { "min": 0, "max": 0, "mean": 0.0, "median": 0 },
      "open_answers": ["string"]
    }
  ]
}
```

---

## Tipos de preguntas soportados

| Tipo (value) | Etiqueta | Input en formulario |
|---|---|---|
| `open_text` | Open Text | Textarea libre |
| `single_choice` | Single Choice | Radio buttons invertibles |
| `multiple_choice` | Multiple Choice | Checkboxes múltiples |
| `scale` | Scale (1-10) | Botonera numérica con labels min/max |
| `rating` | Rating | Botonera numérica configurable |
| `date` | Date | Input de fecha |

---

## Dependencias principales

| Paquete | Versión | Uso |
|---|---|---|
| react | ^18.2.0 | Framework UI |
| react-dom | ^18.2.0 | Renderizado DOM |
| react-router-dom | ^6.21.0 | Enrutamiento SPA |
| axios | ^1.6.5 | Cliente HTTP con interceptores |
| recharts | ^2.10.3 | Gráficas en reportes (LineChart, BarChart) |
| @dnd-kit/core | ^6.1.0 | Drag & drop (base) |
| @dnd-kit/sortable | ^8.0.0 | Reordenamiento de preguntas |
| @dnd-kit/utilities | ^3.2.2 | Utilidades DnD |
| vite | ^5.0.10 | Bundler y dev server |
| @vitejs/plugin-react | ^4.2.1 | Plugin React para Vite |

---

## Mejoras planeadas

### Internacionalización (i18n)
- Integrar `react-i18next` para soporte multiidioma (español / inglés como base)
- Extraer todos los textos hardcodeados (`LOADING...`, `ERROR`, `DRAFT`, etc.) a archivos de traducción `.json`
- Detectar idioma del navegador automáticamente con opción de cambio manual desde el dashboard
- Incluir soporte para formato de fechas y números por locale

### Identificación visual de tipos de pregunta
- Agregar íconos representativos a cada tipo en el builder y en el formulario público:
  - `open_text` → ícono de texto / teclado
  - `single_choice` → círculo (radio)
  - `multiple_choice` → cuadrado (checkbox)
  - `scale` / `rating` → barra o estrellas
  - `date` → calendario
- Mostrar descripción corta del tipo al seleccionarlo en el builder para reducir confusión

### Experiencia del builder
- Implementar drag & drop real con `@dnd-kit/sortable` (ya instalado, pendiente de conectar a la UI)
- Vista previa en tiempo real del formulario público mientras se construye la encuesta
- Duplicar preguntas individualmente con un botón
- Plantillas de encuesta predefinidas (satisfacción, NPS, evaluación académica)
- Validación en tiempo real del formulario antes de publicar (campos vacíos, sin opciones, etc.)

### Autenticación y seguridad
- Pantalla de sesión expirada con opción de re-login sin perder el contexto
- Soporte para login con Google / GitHub (OAuth)
- Perfil de usuario editable (nombre, contraseña)

### Dashboard
- Paginación o scroll infinito para listas largas de encuestas
- Búsqueda por título de encuesta
- Ordenamiento por fecha, respuestas o status
- Vista de tarjetas como alternativa a la vista de lista

### Reportes
- Exportar reporte a PDF o CSV
- Filtrar respuestas por rango de fechas
- Ver respuestas individuales completas (detalle por respondente)
- Comparativa entre encuestas del mismo tipo

### Formulario público
- Guardado automático de respuestas en `localStorage` para continuar después si se cierra el navegador
- Soporte para encuestas con límite de tiempo (`time_limit_minutes`)
- Navegación por pasos (una pregunta por pantalla) como alternativa al formulario largo
- Validación visual más clara con animaciones en campos requeridos omitidos

### Accesibilidad (a11y)
- Asegurar navegación completa por teclado en todos los componentes
- Añadir `aria-label` y roles ARIA correctos
- Verificar contraste suficiente en el tema (el negro sobre blanco cumple WCAG AA)
- Soporte para lectores de pantalla en el builder y el formulario público

### Rendimiento
- Lazy loading de páginas con `React.lazy` + `Suspense`
- Caché de respuestas con `React Query` o `SWR` para evitar refetches innecesarios
- Skeleton loaders en lugar de texto `[ LOADING... ]`

### DevEx y calidad de código
- Agregar ESLint + Prettier con configuración compartida
- Tests unitarios con Vitest para utilidades y componentes clave
- Tests E2E con Playwright para flujos críticos (login → crear encuesta → publicar → responder)
- Storybook para documentar y visualizar componentes del sistema de diseño

---

## Notas de autenticación

El token de acceso se almacena en `localStorage` bajo la clave `token`. El sistema incluye **auto-refresh automático**: si una petición retorna `401`, el interceptor de axios intenta renovar el token usando `refresh_token` de forma transparente. Si el refresh falla, limpia el storage y redirige a `/login`.

---

## Licencia

Proyecto privado — todos los derechos reservados.