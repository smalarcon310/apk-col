/**
 * SERMA - Guía de Arquitectura y Desarrollo
 */

# 🏗 ARQUITECTURA DE SERMA

## Visión General

SERMA sigue una arquitectura en 3 capas:

```
┌─────────────────────────────────┐
│     UI / Presentación           │
│ (Componentes React + Tailwind)  │
├─────────────────────────────────┤
│     Lógica de Negocio           │
│ (Servicios + Módulos)           │
├─────────────────────────────────┤
│     Persistencia                │
│ (Firestore + window.storage)    │
└─────────────────────────────────┘
```

---

## 📚 Capas

### 1. Capa de Presentación (UI)

**Ubicación**: `src/components/`, `src/modules/`

**Responsabilidades**:
- Renderizar interfaz
- Manejar eventos de usuario
- Mostrar estados visuales
- Validar entrada del usuario

**Componentes Reutilizables**:
- `Alert`: Notificaciones
- `Modal`: Diálogos
- `DataTable`: Tablas con paginación
- `FormInputs`: Campos de formulario
- `Navbar`: Navegación

**Módulos**:
- `StudentsModule`: Gestión de estudiantes
- `CoursesModule`: Gestión de cursos
- `SubjectsModule`: Gestión de materias

### 2. Capa de Lógica de Negocio

**Ubicación**: `src/services/`

**Responsabilidades**:
- Operaciones CRUD
- Validaciones de negocio
- Transformación de datos
- Manejo de errores

**Servicios Principales**:
- `studentService.js`: Lógica de estudiantes
- `courseService.js`: Lógica de cursos
- `subjectService.js`: Lógica de materias
- `storageService.js`: Persistencia local

### 3. Capa de Persistencia

**Ubicación**: `src/config/`, `src/services/storageService.js`

**Responsabilidades**:
- Comunicación con Firestore
- Caché local con window.storage
- Sincronización de datos
- Manejo de conexión

---

## 🔄 Flujo de Datos

### Crear un Estudiante

```
Usuario (UI)
    ↓
[Click en "Nuevo Estudiante"]
    ↓
Modal de Formulario
    ↓
FormInputs (Validación local)
    ↓
onSubmit() en StudentsModule
    ↓
createStudent() en studentService
    ↓
Validar datos (negocio)
    ↓
Firestore (crear documento)
    ↓
Storage local (backup)
    ↓
Alert de éxito
    ↓
Recargar lista
```

### Leer Datos

```
Componente monta
    ↓
useEffect() → loadData()
    ↓
getAllStudents() (intenta Firestore)
    ↓
¿Conexión OK?
├─ Sí → Obtener de Firestore
│        ↓
│        Guardar en storage local
│        ↓
│        Retornar datos
│
└─ No → Obtener de storage local
         ↓
         Retornar datos en caché
```

---

## 🗂 Estructura de Carpetas Detallada

```
src/
│
├── components/           # Componentes reutilizables
│   ├── Alert.js         # Componente de alerta
│   ├── Modal.js         # Componente de modal
│   ├── DataTable.js     # Tabla de datos
│   ├── FormInputs.js    # Inputs del formulario
│   ├── Navbar.js        # Barra de navegación
│   └── index.js         # Exports (para imports limpios)
│
├── modules/             # Módulos de funcionalidad
│   ├── StudentsModule.js   # Interfaz de estudiantes
│   ├── CoursesModule.js    # Interfaz de cursos
│   ├── SubjectsModule.js   # Interfaz de materias
│   └── index.js            # Exports
│
├── services/            # Lógica de negocio
│   ├── studentService.js   # CRUD estudiantes + validaciones
│   ├── courseService.js    # CRUD cursos + validaciones
│   ├── subjectService.js   # CRUD materias + validaciones
│   ├── storageService.js   # Persistencia local
│   └── index.js            # Exports
│
├── config/             # Configuración
│   └── firebase.js     # Inicialización de Firebase
│
├── utils/              # Utilidades
│   ├── validations.js  # Funciones de validación
│   ├── helpers.js      # Funciones auxiliares
│   └── index.js        # Exports
│
├── data/               # Datos estáticos/ejemplos
│   └── exampleData.js  # Datos de ejemplo
│
├── App.js              # Componente raíz
├── App.css             # Estilos globales
├── index.js            # Punto de entrada
└── index.css           # Estilos base + Tailwind

```

---

## 🎯 Patrones de Diseño

### 1. Componente Funcional con Hooks

```javascript
export const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Lógica de setup
  }, [dependencies]);
  
  return <div>{/* JSX */}</div>;
};
```

### 2. Separación de Formulario

```javascript
const MyForm = ({ data, onSubmit }) => {
  const [formData, setFormData] = useState(data);
  const [errors, setErrors] = useState({});
  
  // Formulario lógico separado del módulo
};

export const MyModule = () => {
  // Módulo maneja estado global
  const handleSubmit = async (data) => { /* ... */ };
  
  return <MyForm onSubmit={handleSubmit} />;
};
```

### 3. Servicio Reutilizable

```javascript
// CRUD básico
export const create = async (data) => { /* ... */ };
export const getAll = async () => { /* ... */ };
export const getById = async (id) => { /* ... */ };
export const update = async (id, updates) => { /* ... */ };
export const delete = async (id) => { /* ... */ };

// Listeners en tiempo real
export const onChange = (callback) => { /* ... */ };
```

---

## ✅ Checklist de Desarrollo

### Antes de crear un componente

- [ ] ¿Es reutilizable o específico del módulo?
- [ ] ¿Necesita estado global o local?
- [ ] ¿Hay validaciones necesarias?
- [ ] ¿Cómo maneja errores?

### Antes de crear un servicio

- [ ] ¿Requiere Firestore?
- [ ] ¿Necesita validación de datos?
- [ ] ¿Hay manejo de errores?
- [ ] ¿Necesita sincronización local?

### Antes de hacer commit

- [ ] Código compilable sin errores
- [ ] Funcionalidad probada manualmente
- [ ] No hay console.error innecesarios
- [ ] Archivos .env no incluidos
- [ ] Comentarios documentan la lógica compleja

---

## 🔍 Debugging

### Activar logs de Firebase

```javascript
// En firebase.js
import { enableLogging } from 'firebase/firestore';
enableLogging(true); // Solo en desarrollo
```

### Verificar storage local

```javascript
// En consola del navegador
window.storage
Object.keys(window.storage)
window.storage['serma_students']
```

### Monitorear Firestore

```javascript
// En Firebase Console
> Firestore > Emulator > Logs
```

---

## 📖 Estándares de Código

### Naming Conventions

- **Componentes**: PascalCase (`StudentForm.js`)
- **Funciones**: camelCase (`createStudent()`)
- **Constantes**: UPPER_SNAKE_CASE (`GRADES = ['6', '7']`)
- **Variables**: camelCase (`studentData`, `isLoading`)

### Comentarios

```javascript
/**
 * Descripción breve
 * @param {type} paramName - Descripción
 * @returns {type} Descripción de retorno
 */
export const myFunction = (paramName) => {
  // Lógica
};
```

### Error Handling

```javascript
try {
  const result = await operation();
  return result;
} catch (error) {
  console.error('Contexto del error:', error);
  throw new Error('Mensaje amigable para usuario');
}
```

---

## 🧪 Testing (Futuro)

Cuando se implemente testing:

```bash
npm test  # Ejecutar tests
npm run test:coverage  # Ver cobertura
```

Archivos de test:
- `src/services/__tests__/studentService.test.js`
- `src/components/__tests__/Alert.test.js`

---

## 🚀 Performance

### Tips de Optimización

1. **Lazy Loading de Módulos**:
```javascript
const StudentsModule = React.lazy(() => import('./modules/StudentsModule'));
```

2. **Memoization**:
```javascript
const MyComponent = React.memo(({ prop }) => {
  return <div>{prop}</div>;
});
```

3. **useCallback para funciones**:
```javascript
const handleClick = useCallback(() => {
  // Función
}, [dependencies]);
```

4. **Paginación en tablas** (ya incluida en DataTable)

---

## 🔐 Seguridad

### Reglas de Oro

1. **Nunca confíes en datos del cliente**
   - Validar en servicio
   - Validar en Firestore (reglas)

2. **Nunca expongas secretos**
   - Use variables de entorno
   - No commit de .env

3. **Sanitiza datos**
   - Usar `sanitizeText()` en inputs
   - Validar URLs

4. **Encriptación**
   - Firebase automáticamente encripta en tránsito
   - Para Fase 2+: implementar encriptación de campo

---

## 🤝 Contribución

Al agregar funcionalidad:

1. Crear rama: `git checkout -b feature/descripcion`
2. Implementar cambios
3. Probar manualmente
4. Commit: `git commit -m "Descripción clara"`
5. Push: `git push origin feature/descripcion`
6. Pull Request con descripción

---

## 📞 Preguntas Frecuentes

### ¿Cómo agregar un nuevo campo a estudiante?

1. Actualizar `createStudent()` en `studentService.js`
2. Agregar input en `StudentForm` en `StudentsModule.js`
3. Actualizar columnas en DataTable
4. Agregar validación en `validations.js`

### ¿Cómo escalar a más módulos?

Seguir el patrón:
- Service (CRUD + validaciones)
- Module (UI + estado)
- Componente en App.js
- Pestaña en Navbar

### ¿Cómo implementar roles de usuario?

Futuro: Agregar campo `role` en tabla de usuarios:
```javascript
{
  uid: 'user_id',
  role: 'teacher' | 'admin' | 'student' | 'parent',
  institutionId: 'institution_id'
}
```

Luego validar en servicios y UI.

---

**Documento de Arquitectura v1.0**  
Última actualización: Noviembre 2025
