# SERMA - Sistema de Gestión Académica

## 📋 Descripción

**SERMA** es un Sistema de Gestión Académica con Análisis de Datos diseñado específicamente para la **Metodología Educativa FRE (Formación Relacional Educativa)** de la Institución Educativa Bruselas.

El sistema permite:
- **Gestión de Estudiantes**: Registro, edición, eliminación y búsqueda
- **Gestión de Cursos**: Administración de grados y años académicos
- **Gestión de Materias**: Asignación de materias a cursos y docentes

### Características Principales (Fase 1 - MVP)

✅ Autenticación con Firebase  
✅ Base de datos en tiempo real con Firestore  
✅ Persistencia local con window.storage  
✅ Interfaz responsive con Tailwind CSS  
✅ Validaciones en tiempo real  
✅ Búsqueda y filtrado avanzado  
✅ Operaciones CRUD completas  

---

## 🛠 Stack Tecnológico

### Obligatorio
- **Frontend**: React 19 con Hooks
- **Estilos**: Tailwind CSS 3.4
- **Base de datos**: Firestore
- **Autenticación**: Firebase Auth
- **Almacenamiento**: window.storage (local)
- **Iconos**: Lucide React

### Futuro (Fase 3+)
- Backend Python con Pandas, NumPy, Scikit-learn
- Análisis ML: Clustering, Árboles de decisión, Regresión lineal

---

## 📦 Instalación

### Requisitos Previos
- Node.js 16+ y npm
- Cuenta de Firebase

### Paso 1: Clonar y preparar

```bash
cd apk-col
npm install
```

### Paso 2: Configurar Firebase

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar Firestore Database y Authentication (Email/Contraseña)
3. Copiar credenciales y crear archivo `.env`:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
REACT_APP_FIREBASE_API_KEY=tu_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=tu_proyecto_id
REACT_APP_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
REACT_APP_FIREBASE_APP_ID=tu_app_id
```

### Paso 3: Ejecutar

```bash
npm start
```

La aplicación abrirá en `http://localhost:3000`

---

## 📂 Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── Alert.js         # Alertas y notificaciones
│   ├── Modal.js         # Modales
│   ├── DataTable.js     # Tabla de datos con paginación
│   ├── FormInputs.js    # Inputs reutilizables
│   └── Navbar.js        # Barra de navegación
│
├── modules/             # Módulos funcionales
│   ├── StudentsModule.js   # Gestión de estudiantes
│   ├── CoursesModule.js    # Gestión de cursos
│   └── SubjectsModule.js   # Gestión de materias
│
├── services/            # Lógica de negocio
│   ├── firebase.js      # Config Firebase
│   ├── studentService.js
│   ├── courseService.js
│   ├── subjectService.js
│   └── storageService.js
│
├── utils/               # Utilidades
│   ├── validations.js   # Validaciones
│   └── helpers.js       # Funciones auxiliares
│
├── config/
│   └── firebase.js      # Configuración de Firebase
│
├── App.js               # Componente principal
├── App.css              # Estilos globales
└── index.js             # Punto de entrada
```

---

## 🗄 Estructura de Datos en Firestore

```javascript
{
  "students": {
    "student_id_1": {
      "firstName": "Juan",
      "lastName": "Pérez",
      "documentId": "1234567890",
      "grade": "6",
      "courseId": "course_1",
      "email": "juan@email.com",
      "phone": "3001234567",
      "createdAt": Timestamp,
      "updatedAt": Timestamp
    }
  },
  
  "courses": {
    "course_1": {
      "name": "6-A",
      "grade": "6",
      "academicYear": 2025,
      "description": "Curso sexto A",
      "createdAt": Timestamp,
      "updatedAt": Timestamp
    }
  },
  
  "subjects": {
    "subject_1": {
      "name": "Matemáticas",
      "courseId": "course_1",
      "description": "Matemáticas básicas",
      "teacher": "María González",
      "createdAt": Timestamp,
      "updatedAt": Timestamp
    }
  }
}
```

---

## 🔐 Validaciones Implementadas

### Estudiantes
- ✅ Documento único (no duplicados)
- ✅ Email válido
- ✅ Teléfono: 10 dígitos (formato colombiano)
- ✅ Grados: 6-11
- ✅ Campos obligatorios

### Cursos
- ✅ Nombre único por año académico
- ✅ Grados válidos (6-11)
- ✅ No eliminar si tiene estudiantes/materias
- ✅ Año académico válido (2020+)

### Materias
- ✅ Nombre único por curso
- ✅ Debe tener curso asociado
- ✅ Docente obligatorio
- ✅ Validaciones de integridad

---

## 🎨 Interfaz de Usuario

### Navbar
- Logo SERMA con gradiente
- Pestañas de navegación: Estudiantes, Cursos, Materias
- Indicador de usuario actual

### Dashboard
- **Búsqueda en tiempo real**: Filtrado mientras escribes
- **Tabla responsiva**: Con paginación y acciones
- **Modales**: Para crear/editar datos
- **Alertas**: Confirmaciones y errores visibles

### Colores Institucionales
- Azul: `#3b82f6` (principal)
- Verde: `#10b981` (secundario)
- Rojo: `#ef4444` (peligro)
- Gris: Escalas para neutralidad

---

## 📝 Ejemplos de Uso

### Crear un estudiante

```javascript
import { createStudent } from './services/studentService';

const newStudent = {
  firstName: 'Carlos',
  lastName: 'García',
  documentId: '9876543210',
  grade: '7',
  email: 'carlos@email.com',
  phone: '3019876543',
  courseId: 'course_2'
};

const result = await createStudent(newStudent);
console.log('Estudiante creado:', result);
```

### Buscar estudiantes por curso

```javascript
import { getStudentsByCourse } from './services/studentService';

const students = await getStudentsByCourse('course_1');
console.log('Estudiantes del curso:', students);
```

### Escuchar cambios en tiempo real

```javascript
import { onStudentsChange } from './services/studentService';

const unsubscribe = onStudentsChange((students) => {
  console.log('Estudiantes actualizados:', students);
});

// Para dejar de escuchar:
// unsubscribe();
```

---

## 🚀 Guía de Desarrollo

### Agregar un nuevo módulo

1. **Crear servicio** en `src/services/`:

```javascript
// newModule.js
export const createNew = async (data) => { /* ... */ };
export const getAll = async () => { /* ... */ };
export const update = async (id, data) => { /* ... */ };
export const delete = async (id) => { /* ... */ };
```

2. **Crear módulo** en `src/modules/`:

```javascript
// NewModule.js
export const NewModule = () => {
  // Implementar lógica
};
```

3. **Agregar a App.js**:

```javascript
{currentTab === 'newmodule' && <NewModule />}
```

### Agregar validación

En `src/utils/validations.js`:

```javascript
export const validateMyField = (value) => {
  // Lógica de validación
  return isValid;
};
```

---

## 🐛 Troubleshooting

### Error: "Firebase is not initialized"
- Verificar que `.env` tenga las credenciales correctas
- Verificar que `src/config/firebase.js` se importe en `index.js`

### Error: "No se pueden cargar los datos"
- Verificar conexión a internet
- Verificar que Firestore esté habilitado en Firebase Console
- Revisar reglas de seguridad de Firestore

### Error: "Documento duplicado"
- El número de documento ya existe en la base de datos
- Verificar con el administrador

### Datos guardados localmente pero no en Firebase
- Revisar conexión a internet
- Los datos se sincronizarán cuando haya conexión
- Revisar logs de Firebase

---

## 📋 Roadmap

### Fase 1 ✅ (MVP Actual)
- Módulo de Estudiantes
- Módulo de Cursos
- Módulo de Materias

### Fase 2 🔲 (Próxima)
- Registro de avances académicos (0-100%)
- 4 etapas de aprendizaje
- Panel de avances por estudiante

### Fase 3 🔲
- Análisis ML con Python
- Clustering de estudiantes
- Predicciones de rendimiento

### Fase 4 🔲
- Módulo de Padres
- App móvil nativa
- Notificaciones en tiempo real

### Fase 5 🔲
- Reportes avanzados
- Gráficos interactivos
- Exportación a PDF/Excel

---

## 📄 Licencia

© 2025 Institución Educativa Bruselas. Todos los derechos reservados.

---

## 👥 Soporte

Para soporte técnico, contactar al administrador del sistema.

---

## 📚 Recursos Útiles

- [Documentación React](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Lucide React Icons](https://lucide.dev)

---

## 🔒 Seguridad y Privacidad

SERMA cumple con:
- ✅ Ley 1581/2012 (Protección de datos personales Colombia)
- ✅ Validación de permisos
- ✅ Encriptación en tránsito (HTTPS)
- ✅ Autenticación segura con Firebase

---

**Última actualización**: Noviembre 2025  
**Versión**: 1.0.0 - MVP
