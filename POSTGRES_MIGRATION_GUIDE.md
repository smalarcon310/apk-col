/**
 * SERMA - Guía de Adaptación de Servicios
 * Cómo actualizar los servicios existentes para usar PostgreSQL
 */

# 🔄 ADAPTACIÓN DE SERVICIOS (Firestore → PostgreSQL)

## 📌 Resumen de cambios

La aplicación puede trabajar con ambas bases de datos. Los cambios principales son:

| Concepto | Firestore | PostgreSQL |
|----------|-----------|-----------|
| Cliente | `firebase/firestore` | `pg` |
| IDs | `auto-generated string` | `UUID` |
| Timestamps | `Timestamp.now()` | `CURRENT_TIMESTAMP` |
| Queries | `collection().where()` | SQL parameterizado |
| Realtime | `onSnapshot()` | Polling o WebSocket |
| Transacciones | `batch()` | `BEGIN/COMMIT` |

---

## 🔀 Patrón de Abstracción (Recomendado)

### Crear una capa de abstracción:

`src/services/dataService.js`
```javascript
/**
 * Capa de abstracción para base de datos
 * Permite alternar entre Firestore y PostgreSQL
 */

const dbMode = process.env.DB_MODE || 'firestore';

import * as firestoreService from './firestoreService';
import * as postgresService from './postgresService';

const getService = () => {
  return dbMode === 'postgres' ? postgresService : firestoreService;
};

// Exportar todas las funciones a través de la abstracción
export const createStudent = (data) => getService().createStudent(data);
export const getAllStudents = () => getService().getAllStudents();
export const getStudentById = (id) => getService().getStudentById(id);
export const updateStudent = (id, data) => getService().updateStudent(id, data);
export const deleteStudent = (id) => getService().deleteStudent(id);

// ... repetir para todas las funciones
```

**Ventaja**: El código de componentes no cambia. Solo cambias la BD modificando `.env`.

---

## 📝 Ejemplos de Migración

### 1. Crear Estudiante

**Antes (Firestore)**:
```javascript
export const createStudent = async (studentData) => {
  const dataToSave = {
    ...studentData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, 'students'), dataToSave);
  
  return {
    id: docRef.id,
    ...dataToSave,
  };
};
```

**Después (PostgreSQL)**:
```javascript
export const createStudent = async (studentData) => {
  const query = `
    INSERT INTO students 
    (first_name, last_name, document_id, email, phone, grade, course_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const values = [
    studentData.firstName,
    studentData.lastName,
    studentData.documentId,
    studentData.email,
    studentData.phone,
    studentData.grade,
    studentData.courseId,
  ];

  const result = await executeQuery(query, values);
  // PostgreSQL retorna con timestamps automáticamente
  return result.rows[0];
};
```

**Diferencias clave**:
- Firestore: Genera IDs automáticamente como strings
- PostgreSQL: Usa UUID y retorna automáticamente
- Firestore: Necesitas agregar `Timestamp.now()`
- PostgreSQL: Los timestamps se generan en la BD

---

### 2. Obtener todos los registros

**Antes (Firestore)**:
```javascript
export const getAllStudents = async () => {
  const querySnapshot = await getDocs(collection(db, 'students'));
  const students = [];

  querySnapshot.forEach((doc) => {
    students.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return students;
};
```

**Después (PostgreSQL)**:
```javascript
export const getAllStudents = async () => {
  const query = 'SELECT * FROM students_with_courses ORDER BY first_name ASC';
  const result = await executeQuery(query);
  return result.rows;
};
```

**Diferencias**:
- Firestore: Itera sobre documentos
- PostgreSQL: Retorna array directo
- Firestore: Necesita map() manual
- PostgreSQL: Usa vistas para JOINs

---

### 3. Buscar con filtros

**Antes (Firestore)**:
```javascript
export const getStudentsByCourse = async (courseId) => {
  const q = query(
    collection(db, 'students'),
    where('courseId', '==', courseId)
  );
  const querySnapshot = await getDocs(q);
  const students = [];

  querySnapshot.forEach((doc) => {
    students.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return students;
};
```

**Después (PostgreSQL)**:
```javascript
export const getStudentsByCourse = async (courseId) => {
  const query = `
    SELECT * FROM students_with_courses 
    WHERE course_id = $1
    ORDER BY first_name ASC
  `;
  const result = await executeQuery(query, [courseId]);
  return result.rows;
};
```

**Diferencias**:
- Firestore: Usa `where()` con operadores especiales
- PostgreSQL: SQL estándar con placeholders ($1, $2)
- Firestore: Sin control de orden de ejecución
- PostgreSQL: Índices optimizan búsquedas

---

### 4. Actualizar registros

**Antes (Firestore)**:
```javascript
export const updateStudent = async (studentId, studentData) => {
  const docRef = doc(db, 'students', studentId);
  
  const dataToSave = {
    ...studentData,
    updatedAt: Timestamp.now(),
  };

  await updateDoc(docRef, dataToSave);

  return {
    id: studentId,
    ...dataToSave,
  };
};
```

**Después (PostgreSQL)**:
```javascript
export const updateStudent = async (studentId, studentData) => {
  const query = `
    UPDATE students 
    SET first_name = $1, last_name = $2, email = $3, 
        phone = $4, grade = $5, course_id = $6
    WHERE id = $7
    RETURNING *
  `;
  
  const values = [
    studentData.firstName,
    studentData.lastName,
    studentData.email,
    studentData.phone,
    studentData.grade,
    studentData.courseId,
    studentId,
  ];

  const result = await executeQuery(query, values);
  // El trigger automático actualiza updated_at
  return result.rows[0];
};
```

**Diferencias**:
- Firestore: `updateDoc()` parcial
- PostgreSQL: UPDATE completo
- Firestore: Actualizar `updatedAt` manual
- PostgreSQL: Trigger automático

---

### 5. Eliminar registros

**Antes (Firestore)**:
```javascript
export const deleteStudent = async (studentId) => {
  const docRef = doc(db, 'students', studentId);
  await deleteDoc(docRef);
  return true;
};
```

**Después (PostgreSQL)**:
```javascript
export const deleteStudent = async (studentId) => {
  const query = 'DELETE FROM students WHERE id = $1 RETURNING id';
  const result = await executeQuery(query, [studentId]);
  return result.rowCount > 0;
};
```

**Diferencias**:
- Firestore: No retorna confirmación
- PostgreSQL: `rowCount` confirma eliminación
- Firestore: No hay validación de integridad referencial automática
- PostgreSQL: FOREIGN KEY hace validación

---

### 6. Búsqueda por campo único

**Antes (Firestore)**:
```javascript
export const getStudentByDocument = async (documentId) => {
  const q = query(
    collection(db, 'students'),
    where('documentId', '==', documentId)
  );
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) return null;
  
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
};
```

**Después (PostgreSQL)**:
```javascript
export const getStudentByDocument = async (documentId) => {
  const query = 'SELECT * FROM students WHERE document_id = $1';
  const result = await executeQuery(query, [documentId]);
  return result.rows[0] || null;
};
```

**Diferencias**:
- Firestore: Itera array para obtener primero
- PostgreSQL: Retorna directamente o undefined

---

## 🔌 Implementación en Componentes

### Opción 1: Sin cambios (Abstracción)
```javascript
// StudentsModule.js - SIN CAMBIOS
import { createStudent, getAllStudents } from '../services/dataService';

export default function StudentsModule() {
  const handleCreate = async (data) => {
    const newStudent = await createStudent(data);
    // Funciona igual con Firestore o PostgreSQL
  };
  
  useEffect(() => {
    getAllStudents().then(setStudents);
  }, []);
  
  return <>{/* JSX igual */}</>;
}
```

### Opción 2: Con cambios (Directo)
Si quieres usar PostgreSQL directamente:

```javascript
// StudentsModule.js - CON CAMBIOS
import * as db from '../services/postgresService';

export default function StudentsModule() {
  const handleCreate = async (data) => {
    // Sin validaciones locales, confiar en BD
    const newStudent = await db.createStudent({
      firstName: data.firstName,
      lastName: data.lastName,
      documentId: data.documentId,
      email: data.email,
      phone: data.phone,
      grade: data.grade,
      courseId: data.courseId,
    });
    // Nota: retorna con id como UUID
  };
  
  // ... resto igual
}
```

---

## 🔄 Sincronización (Firestore ↔ PostgreSQL)

Si necesitas ambas bases de datos sincronizadas:

```javascript
// src/services/syncService.js
export const syncStudentToBoth = async (studentData) => {
  // 1. Guardar en PostgreSQL
  const pgStudent = await postgresService.createStudent(studentData);
  
  // 2. Guardar en Firestore con ID de PostgreSQL
  const fsStudent = await firestoreService.createStudent({
    ...studentData,
    pgId: pgStudent.id, // Referencia cruzada
  });
  
  return { pgStudent, fsStudent };
};

// Para queries, implementar replicación:
export const replicateFromFirestoreToPostgres = async () => {
  const fsData = await firestoreService.getAllStudents();
  
  for (const student of fsData) {
    try {
      await postgresService.createStudent(student);
    } catch (e) {
      // Si ya existe, actualizar
      if (e.code === '23505') { // unique violation
        await postgresService.updateStudent(student.id, student);
      }
    }
  }
};
```

---

## 🎯 Checklist de Migración

- [ ] Instalar driver PostgreSQL: `npm install pg`
- [ ] Crear base de datos y ejecutar `DATABASE_SCHEMA.sql`
- [ ] Crear `src/services/postgresService.js`
- [ ] Crear capa de abstracción (`dataService.js`)
- [ ] Configurar variables `.env` (DB_HOST, DB_USER, etc.)
- [ ] Ejecutar script de migración: `node scripts/migrate_firestore_to_postgres.js`
- [ ] Probar operaciones CRUD con PostgreSQL
- [ ] Actualizar tests
- [ ] Verificar performance (índices)
- [ ] Configurar backups automáticos

---

## ⚠️ Consideraciones Importantes

### 1. **Realtime Updates**
- **Firestore**: `onSnapshot()` automático
- **PostgreSQL**: Necesitas polling o WebSocket
  
  **Solución**:
  ```javascript
  export const subscribeToStudents = (callback) => {
    // PostgreSQL: Polling cada 5s
    const interval = setInterval(async () => {
      const students = await getAllStudents();
      callback(students);
    }, 5000);
    
    return () => clearInterval(interval);
  };
  ```

### 2. **Transacciones**
- **Firestore**: `batch()` para múltiples operaciones
- **PostgreSQL**: BEGIN/COMMIT

  **Solución**:
  ```javascript
  export const createCourseWithSubjects = async (courseData, subjectsData) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Crear curso
      const courseResult = await client.query(
        'INSERT INTO courses (...) VALUES (...) RETURNING *',
        values
      );
      const courseId = courseResult.rows[0].id;
      
      // Crear materias
      for (const subject of subjectsData) {
        await client.query(
          'INSERT INTO subjects (...) VALUES (...)',
          [...values, courseId]
        );
      }
      
      await client.query('COMMIT');
      return courseResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };
  ```

### 3. **Performance**
- **Firestore**: No necesitas índices explícitos para queries simples
- **PostgreSQL**: Los índices son críticos
  
  **Solución**: Ya incluidos en `DATABASE_SCHEMA.sql`

### 4. **Manejo de Errores**
```javascript
// PostgreSQL con códigos de error específicos
try {
  await createStudent(data);
} catch (error) {
  if (error.code === '23505') {
    // UNIQUE violation
    throw new Error('Documento de identidad ya existe');
  } else if (error.code === '23503') {
    // FOREIGN KEY violation
    throw new Error('Curso no encontrado');
  } else {
    throw error;
  }
}
```

---

## 📚 Referencias

- [PostgreSQL Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html)
- [Node.js pg Library](https://node-postgres.com/)
- [Firebase vs PostgreSQL](https://www.stackshare.io/)

