/**
 * SERMA - QUICK START GUIDE
 * Guía rápida de inicio
 */

# 🚀 SERMA - QUICK START

## 1️⃣ Instalación Rápida (5 minutos)

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo .env
cp .env.example .env

# 3. Editar .env con credenciales de Firebase
# (Ver paso 3 en SERMA_README.md)

# 4. Ejecutar aplicación
npm start
```

La app abrirá en `http://localhost:3000`

---

## 2️⃣ Primeros Pasos

### Crear un Curso
1. Ir a pestaña **Cursos**
2. Click en **Nuevo Curso**
3. Llenar:
   - Nombre: "6-A"
   - Grado: 6
   - Año académico: 2025
   - Descripción: (opcional)
4. Click **Crear Curso**

### Crear Estudiantes
1. Ir a pestaña **Estudiantes**
2. Click en **Nuevo Estudiante**
3. Llenar todos los campos (requeridos marcados con *)
4. Click **Crear Estudiante**

### Crear Materias
1. Ir a pestaña **Materias**
2. Click en **Nueva Materia**
3. Seleccionar curso y docente
4. Click **Crear Materia**

---

## 3️⃣ Configuración de Firebase

### Paso A: Crear Proyecto
1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Click **Crear Proyecto**
3. Nombre: "serma" (o similar)
4. Desabilitar Google Analytics (opcional)

### Paso B: Habilitar Firestore
1. En proyecto → **Firestore Database**
2. Click **Crear base de datos**
3. Iniciar en modo **test** (cambiar en producción)
4. Región: `nam5` (North America)

### Paso C: Habilitar Authentication
1. En proyecto → **Authentication**
2. Click **Comenzar**
3. Habilitar **Email/Contraseña**

### Paso D: Copiar Credenciales
1. Ir a **Project Settings** (⚙️)
2. Tab **General**
3. Desplazarse a **Tu aplicación**
4. Copiar configuración
5. Pegar en `.env`

---

## 4️⃣ Estructura Rápida

```
Componentes reutilizables   → src/components/
Módulos (UI)                → src/modules/
Lógica de negocio          → src/services/
Validaciones y helpers     → src/utils/
Configuración Firebase     → src/config/
```

---

## 5️⃣ Operaciones Comunes

### Buscar estudiantes
- En tab **Estudiantes**
- Usar buscador: escribe nombre, apellido o documento

### Filtrar por grado
- En tab **Cursos** o **Materias**
- Usar selector de grado a la derecha

### Editar datos
- Click en icono ✏️ (lápiz) en tabla
- Modificar en modal
- Click **Actualizar**

### Eliminar datos
- Click en icono 🗑️ (basura) en tabla
- Confirmar en ventana emergente
- ⚠️ Acción irreversible

---

## 6️⃣ Troubleshooting Básico

| Problema | Solución |
|----------|----------|
| "Firebase not initialized" | Verificar .env tiene valores correctos |
| "Documento duplicado" | Verificar que no existe otro con ese número |
| No se ven datos | Verificar conexión a internet |
| Modal se abre pero está en blanco | Recargar página (F5) |

---

## 7️⃣ Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `.env` | Variables de entorno (NUNCA hacer commit) |
| `src/App.js` | Componente principal |
| `src/services/` | Lógica CRUD |
| `src/components/` | UI reutilizable |
| `SERMA_README.md` | Documentación completa |
| `ARCHITECTURE.md` | Arquitectura técnica |

---

## 8️⃣ Próximos Pasos

- [ ] Leer `SERMA_README.md` (documentación completa)
- [ ] Explorar `ARCHITECTURE.md` (cómo funciona)
- [ ] Revisar `DEPLOYMENT_GUIDE.md` (llevar a producción)
- [ ] Probar todas las operaciones CRUD
- [ ] Crear datos de prueba (usar `src/data/exampleData.js`)

---

## 9️⃣ Contacto y Soporte

Para problemas técnicos:
1. Revisar `SERMA_README.md` sección Troubleshooting
2. Verificar Firebase Console
3. Consultar documentación oficial:
   - React: https://react.dev
   - Firebase: https://firebase.google.com/docs
   - Tailwind: https://tailwindcss.com/docs

---

## 🔟 Comandos Útiles

```bash
# Ejecutar en desarrollo
npm start

# Build para producción
npm run build

# Tests
npm test

# Actualizar dependencias
npm update

# Instalar dependencia específica
npm install nombre-paquete

# Ver vulnerabilidades de seguridad
npm audit

# Reparar vulnerabilidades
npm audit fix
```

---

**¡Listo! SERMA está operativo.** 🎉

Siguiente: Crear datos de prueba y explorar la interfaz.
