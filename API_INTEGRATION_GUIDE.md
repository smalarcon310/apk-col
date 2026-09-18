# Integración API REST Remota

## Descripción General

Esta integración permite que tu aplicación React se conecte a un servidor API REST remoto mientras mantiene la autenticación con Firebase. El sistema incluye:

- ✅ Cliente HTTP (`apiClient.js`) que maneja todas las peticiones
- ✅ Autenticación con Firebase (obtiene el token automáticamente)
- ✅ Componentes reutilizables para listar estudiantes y crear avances
- ✅ Manejo de errores y estados de carga
- ✅ Manejo automático de tokens expirados

## Configuración

### 1. Variables de Entorno

Crea o edita el archivo `.env` en la raíz del proyecto:

```env
# API REST Remota
REACT_APP_API_BASE_URL=http://TU_IP_PUBLICA:3001

# Autenticación Firebase (ya debe estar configurado)
REACT_APP_FIREBASE_API_KEY=tu_clave_aquí
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_dominio
REACT_APP_FIREBASE_PROJECT_ID=tu_project_id
```

**Nota:** Para cambiar la URL en tiempo de ejecución, usa el panel de configuración en `/api-remote`.

### 2. Endpoints Esperados en el Servidor

El servidor debe tener estos endpoints:

#### Estudiantes
```
GET /api/estudiantes
  - Retorna: Array de estudiantes
  - Headers: Authorization: Bearer {token}

GET /api/estudiantes/:id
  - Retorna: Datos de un estudiante
  - Headers: Authorization: Bearer {token}
```

#### Avances
```
GET /api/avances/estudiante/:studentId
  - Retorna: Array de avances del estudiante
  - Headers: Authorization: Bearer {token}

POST /api/avances
  - Body: {
      studentId: string,
      subjectId: string,
      percentage: number (0-100),
      description: string,
      date: string (ISO),
      userId: string (Firebase UID),
      userEmail: string
    }
  - Retorna: Objeto del avance creado
  - Headers: Authorization: Bearer {token}

PUT /api/avances/:id
  - Actualiza un avance
  - Headers: Authorization: Bearer {token}

DELETE /api/avances/:id
  - Elimina un avance
  - Headers: Authorization: Bearer {token}
```

## Uso

### 1. Acceder al Módulo de API Remota

Después de autenticarse:
1. Navega a la URL: `http://localhost:3000/api-remote`
2. O agrega un botón en el Navbar que lleve a esta ruta

### 2. Usar el apiClient en Componentes

#### Obtener Estudiantes
```javascript
import { getStudents } from '../services/apiClient';

async function loadStudents() {
  try {
    const students = await getStudents();
    console.log(students);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

#### Obtener Avances de un Estudiante
```javascript
import { getStudentAdvances } from '../services/apiClient';

async function loadAdvances(studentId) {
  try {
    const advances = await getStudentAdvances(studentId);
    console.log(advances);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

#### Crear un Avance
```javascript
import { createAdvance } from '../services/apiClient';
import { auth } from '../config/firebase';

async function createNewAdvance() {
  try {
    const currentUser = auth.currentUser;
    
    const advanceData = {
      studentId: 'student123',
      subjectId: 'math101',
      percentage: 85,
      description: 'El estudiante ha completado las operaciones básicas',
      date: new Date().toISOString(),
      userId: currentUser.uid,
      userEmail: currentUser.email
    };

    const result = await createAdvance(advanceData);
    console.log('Avance creado:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### 3. Componentes Disponibles

#### `<StudentsListRemote />`
Muestra una lista de estudiantes obtenida de la API remota.

```javascript
import StudentsListRemote from '../components/StudentsListRemote';

<StudentsListRemote 
  onSelectStudent={(student) => console.log('Seleccionado:', student)}
  showAdvances={true}
/>
```

Props:
- `onSelectStudent`: Callback cuando se selecciona un estudiante
- `showAdvances`: Boolean para mostrar avances expandibles (default: false)

#### `<AdvancesFormRemote />`
Formulario para crear nuevos avances.

```javascript
import AdvancesFormRemote from '../components/AdvancesFormRemote';

<AdvancesFormRemote 
  studentId="student123"
  subjectId="math101"
  onSuccess={(response) => console.log('Avance creado:', response)}
/>
```

Props:
- `studentId`: ID del estudiante (opcional, puede estar vacío para que el usuario lo ingrese)
- `subjectId`: ID de la materia (opcional)
- `onSuccess`: Callback cuando se crea exitosamente

#### `<RemoteAPIModule />`
Módulo completo que combina estudiantes y formulario de avances.

```javascript
// Ya está integrado en App.js en la ruta /api-remote
import RemoteAPIModule from '../modules/RemoteAPIModule';

<RemoteAPIModule />
```

## Flujo de Autenticación

1. **Usuario inicia sesión en Firebase** → Se obtiene el usuario autenticado
2. **Usuario accede a `/api-remote`** → Se verifica que esté autenticado
3. **Usuario carga lista de estudiantes** → `getStudents()` ejecuta:
   - Obtiene el token de Firebase del usuario actual
   - Agreg a el token en header: `Authorization: Bearer {token}`
   - Envía request a la API remota
   - El servidor valida el token
4. **Usuario crea un avance** → `createAdvance()` ejecuta lo mismo

## Manejo de Errores

Los errores se manejan automáticamente:

```javascript
- 401 Unauthorized → "Token de autenticación inválido o expirado"
- 403 Forbidden → "No tienes permiso para acceder a este recurso"
- Otros errores → Se muestra el mensaje del servidor
```

## Desarrollo

### Modo de Desarrollo Local

Para probar con un servidor en `http://localhost:3001`:

```env
REACT_APP_API_BASE_URL=http://localhost:3001
```

### Debugging

Para ver las peticiones en consola:
1. Abre DevTools → Console
2. Las peticiones se registran con `console.error()` en caso de error
3. Las respuestas exitosas se retornan normalmente

## Estructura de Carpetas

```
src/
├── components/
│   ├── AdvancesFormRemote.js      # Formulario para crear avances
│   ├── StudentsListRemote.js       # Lista de estudiantes
│   └── ...
├── modules/
│   ├── RemoteAPIModule.js          # Módulo principal integrado
│   └── ...
├── services/
│   ├── apiClient.js                # Cliente HTTP con autenticación
│   └── ...
└── App.js                          # Aplicación principal (contiene ruta /api-remote)
```

## Notas Importantes

1. **Firebase debe estar configurado** antes de usar esta integración
2. **El usuario debe estar autenticado** en Firebase para hacer peticiones a la API
3. **Los tokens tienen validez limitada** (1 hora típicamente en Firebase)
4. **El apiClient obtiene automáticamente** un nuevo token cuando es necesario
5. **No guardes tokens en localStorage** - Firebase maneja esto automáticamente

## Troubleshooting

### "Usuario no autenticado"
- Verifica que el usuario haya iniciado sesión en Firebase
- Comprueba que `auth.currentUser` no sea null

### "Error 401 - Token inválido"
- El token puede estar expirado, el apiClient lo renovará automáticamente
- Verifica que el servidor esté validando los tokens correctamente

### "CORS error"
- El servidor debe permitir CORS desde tu dominio
- Agrega headers CORS en el servidor: `Access-Control-Allow-Origin`

### "Conexión rechazada"
- Verifica que la URL en `REACT_APP_API_BASE_URL` sea correcta
- Verifica que el servidor esté ejecutándose
- En desarrollo, usa `http://localhost:3001`, no `http://127.0.0.1:3001`

## Próximos Pasos

1. Configura tu servidor para aceptar los endpoints especificados
2. Valida los tokens de Firebase en el servidor
3. Prueba la integración con el módulo en `/api-remote`
4. Agrega más endpoints según necesites (edit, delete, etc.)
5. Considera agregar paginación para el listado de estudiantes
6. Considera agregar filtros y búsqueda

## Archivo de Ejemplo - Servidor Node.js + Express

```javascript
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Middleware de autenticación Firebase
const authenticateFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Endpoints
app.get('/api/estudiantes', authenticateFirebaseToken, (req, res) => {
  // Retornar lista de estudiantes desde tu BD
  res.json([
    { id: '1', firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com' },
    { id: '2', firstName: 'María', lastName: 'García', email: 'maria@example.com' }
  ]);
});

app.post('/api/avances', authenticateFirebaseToken, (req, res) => {
  const { studentId, subjectId, percentage, description, date, userId, userEmail } = req.body;
  // Guardar en tu BD
  res.json({
    id: 'advance123',
    studentId,
    subjectId,
    percentage,
    description,
    date,
    userId,
    userEmail,
    createdAt: new Date().toISOString()
  });
});

app.listen(3001, () => console.log('API running on port 3001'));
```

