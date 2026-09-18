# 📦 Guía de Componentes React Implementados

Esta guía te ayudará a usar los nuevos componentes, hooks y servicios que hemos implementado en tu proyecto.

---

## 📁 Estructura Creada

```
src/
├── hooks/                    # ✅ NUEVO
│   ├── index.js
│   ├── useApi.js            # Hook para operaciones CRUD
│   └── useAuth.js           # Hook para autenticación Firebase
├── services/
│   └── api.js               # ✅ NUEVO - Servicio base Axios con interceptores
└── components/
    ├── LoginModerno.jsx     # ✅ NUEVO - Componente de login mejorado
    ├── LoginModerno.css
    ├── Estudiantes.jsx      # ✅ NUEVO - CRUD de estudiantes
    ├── Estudiantes.css
    ├── Avances.jsx          # ✅ NUEVO - Tabla de calificaciones
    └── Avances.css
```

---

## 🎣 Hooks Disponibles

### `useApi(endpoint, initialData)`

Hook para manejar operaciones CRUD simplificadas.

**Uso:**
```javascript
import { useApi } from '../hooks/useApi';

function MyComponent() {
  const { data, loading, error, fetchData, create, update, remove } = 
    useApi('/api/estudiantes', []);

  // Obtener datos
  useEffect(() => {
    fetchData();
  }, []);

  // Crear
  const handleCreate = async () => {
    await create({ nombre: 'Juan', email: 'juan@mail.com' });
  };

  // Actualizar
  const handleUpdate = async (id) => {
    await update(id, { nombre: 'Pedro' });
  };

  // Eliminar
  const handleDelete = async (id) => {
    await remove(id);
  };
}
```

### `useAuth()`

Hook para manejar autenticación con Firebase.

**Uso:**
```javascript
import { useAuth } from '../hooks/useAuth';

function Dashboard() {
  const { user, userData, loading, error } = useAuth();

  if (loading) return <p>Cargando usuario...</p>;
  
  if (!user) return <p>No autenticado</p>;

  return (
    <div>
      <p>Bienvenido, {user.email}</p>
      <p>Rol: {userData?.rol}</p>
    </div>
  );
}
```

---

## 🔧 Servicio API

El servicio `api.js` configura axios con:
- ✅ Base URL desde `REACT_APP_API_URL`
- ✅ Interceptor de autenticación (Bearer token)
- ✅ Manejo automático de errores 401
- ✅ Logging de errores

**Configuración en `.env`:**
```env
REACT_APP_API_URL=http://localhost:5000
```

---

## 📝 Componentes Ready-to-Use

### `<LoginModerno />`

Componente de autenticación con opciones de login y registro.

```javascript
import { LoginModerno } from './components/LoginModerno';

function App() {
  return <LoginModerno />;
}
```

**Características:**
- Login con email/contraseña
- Registro con selección de rol
- Manejo de errores Firebase
- Redirección automática al dashboard

---

### `<Estudiantes />`

CRUD completo de estudiantes.

```javascript
import { Estudiantes } from './components/Estudiantes';

function App() {
  return <Estudiantes />;
}
```

**Funcionalidades:**
- ✅ Listar estudiantes
- ✅ Crear nuevo estudiante
- ✅ Eliminar estudiante
- ✅ Validación de formulario

---

### `<Avances />`

Tabla de desempeño académico con promedio.

```javascript
import { Avances } from './components/Avances';

function App() {
  // Para ver avances de un estudiante específico
  return <Avances estudianteId={123} esProfesor={false} />;
  
  // Para ver todos los avances (si eres profesor)
  // return <Avances esProfesor={true} />;
}
```

**Props:**
- `estudianteId` (number): ID del estudiante
- `esProfesor` (boolean): Si es true, muestra todos los avances

**Características:**
- 📊 Calificaciones por materia
- 📈 Promedio general
- 🎯 Indicador visual de aprobado/reprobado
- 📅 Fechas de registro

---

## ⚙️ Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# API
REACT_APP_API_URL=http://localhost:5000

# Firebase (si usas)
REACT_APP_FIREBASE_API_KEY=tu_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_domain
```

### 2. Asegúrate que tengas Firebase configurado

En `src/config/firebase.js` debe estar configurado:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  // ... resto de config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### 3. Instala dependencias (si no las tienes)

```bash
npm install axios firebase
# o si usas pnpm
pnpm add axios firebase
```

---

## 📡 Ejemplos de Uso en Componentes

### Ejemplo 1: Componente con useApi

```javascript
import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

function MisCalificaciones() {
  const { data: calificaciones, loading, fetchData } = 
    useApi('/api/calificaciones/mi-estudiante', []);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table>
          <tbody>
            {calificaciones.map(cal => (
              <tr key={cal.id}>
                <td>{cal.materia}</td>
                <td>{cal.nota}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

### Ejemplo 2: Proteger rutas con useAuth

```javascript
import { useAuth } from '../hooks/useAuth';

function Dashboard() {
  const { user, userData, loading } = useAuth();

  if (loading) return <p>Cargando...</p>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (userData?.rol === 'RECTOR') {
    return <RectorDashboard />;
  }

  if (userData?.rol === 'PROFESOR') {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
}
```

### Ejemplo 3: Formulario con useApi

```javascript
import { useState } from 'react';
import { useApi } from '../hooks/useApi';

function CrearCurso() {
  const [nombre, setNombre] = useState('');
  const { create, loading, error } = useApi('/api/cursos');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await create({ nombre });
      alert('Curso creado exitosamente');
      setNombre('');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre del curso"
      />
      <button disabled={loading}>{loading ? 'Creando...' : 'Crear'}</button>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </form>
  );
}
```

---

## 🚀 Próximos Pasos

1. ✅ Integra `useAuth` en tu App.js para proteger rutas
2. ✅ Usa `useApi` en tus componentes principales
3. ✅ Personaliza los estilos CSS según tu diseño
4. ✅ Configura tu backend para los endpoints esperados
5. ✅ Prueba los componentes en desarrollo

---

## 📚 Endpoints Esperados

Tu backend debe tener estos endpoints:

```
GET    /api/usuarios/by-firebase/:uid     # Obtener usuario por Firebase UID
POST   /api/usuarios                       # Crear usuario
GET    /api/estudiantes                    # Listar estudiantes
POST   /api/estudiantes                    # Crear estudiante
DELETE /api/estudiantes/:id                # Eliminar estudiante
GET    /api/avances                        # Listar avances
GET    /api/avances/estudiante/:id         # Avances de un estudiante
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'axios'"
```bash
npm install axios
```

### Error: "api.js not found"
- Verifica que `src/services/api.js` existe
- Importa correctamente: `import api from '../services/api'`

### Error 401 en todas las requests
- Verifica que `firebaseUID` está guardado en localStorage
- Comprueba que el token es válido
- Revisa que el servidor acepta `Bearer token`

### Los componentes no se muestran
- Verifica que los imports en `App.jsx` son correctos
- Asegúrate que las rutas en App.jsx están configuradas

---

## 💡 Tips y Buenas Prácticas

1. **Siempre usa `useApi` para CRUD**: Es más simple y maneja errores automáticamente
2. **Protege tus rutas con `useAuth`**: Verifica rol antes de mostrar componentes
3. **Maneja estados de carga**: Muestra loading spinner mientras esperas datos
4. **Valida datos antes de enviar**: El backend también debe validar
5. **Usa localStorage con cuidado**: No guardes datos sensibles sin encriptar

---

¡Listo para empezar! 🚀

Si tienes preguntas, revisa los ejemplos de código en cada componente.
