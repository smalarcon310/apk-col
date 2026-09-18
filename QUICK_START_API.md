# 🚀 Quick Start - API REST Remota

## 5 Pasos para Empezar

### 1. **Configurar Variables de Entorno**

Crea o edita `.env` en la raíz del proyecto:

```env
REACT_APP_API_BASE_URL=http://TU_IP_PUBLICA:3001
```

**Ejemplo:**
```env
# Para desarrollo local
REACT_APP_API_BASE_URL=http://localhost:3001

# Para producción
REACT_APP_API_BASE_URL=http://192.168.1.100:3001
```

### 2. **Iniciar la Aplicación**

```bash
npm start
```

### 3. **Iniciar Sesión**

1. Ve a http://localhost:3000/login
2. Inicia sesión con Firebase (igual que antes)

### 4. **Acceder al Módulo de API**

1. Navega a: http://localhost:3000/api-remote
2. Verás dos secciones:
   - **Izquierda:** Lista de estudiantes
   - **Derecha:** Formulario para crear avances

### 5. **Configurar tu Servidor**

Tu servidor debe tener estos 3 endpoints:

#### **GET `/api/estudiantes`**
```javascript
// Retorna
[
  {
    id: "1",
    firstName: "Juan",
    lastName: "Pérez",
    email: "juan@example.com"
  },
  // ... más estudiantes
]
```

#### **GET `/api/avances/estudiante/:studentId`**
```javascript
// Retorna
[
  {
    id: "advance1",
    studentId: "1",
    subjectId: "math101",
    percentage: 85,
    description: "Avance en algebra",
    date: "2026-05-18T00:00:00.000Z"
  },
  // ... más avances
]
```

#### **POST `/api/avances`**
```javascript
// Recibe
{
  studentId: "1",
  subjectId: "math101",
  percentage: 85,
  description: "Avance en algebra",
  date: "2026-05-18T00:00:00.000Z",
  userId: "firebase-uid",
  userEmail: "user@example.com"
}

// Retorna
{
  id: "new-advance-id",
  studentId: "1",
  // ... mismo objeto
}
```

**⚠️ Todos requieren header:** `Authorization: Bearer {firebaseToken}`

---

## 📝 Ejemplo de Servidor - Node.js + Express

```javascript
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Inicializa Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json'))
});

// Middleware de autenticación
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Sin token' });

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Endpoints
app.get('/api/estudiantes', authenticate, (req, res) => {
  // Obtener de tu base de datos
  const estudiantes = [
    { id: '1', firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com' },
    { id: '2', firstName: 'María', lastName: 'García', email: 'maria@example.com' }
  ];
  res.json(estudiantes);
});

app.get('/api/avances/estudiante/:studentId', authenticate, (req, res) => {
  // Obtener de tu base de datos
  const avances = [
    {
      id: 'adv1',
      studentId: req.params.studentId,
      subjectId: 'math101',
      percentage: 85,
      description: 'Buen progreso',
      date: new Date().toISOString()
    }
  ];
  res.json(avances);
});

app.post('/api/avances', authenticate, (req, res) => {
  const { studentId, subjectId, percentage, description, date } = req.body;
  
  // Guardar en tu base de datos
  const newAdvance = {
    id: Date.now().toString(),
    studentId,
    subjectId,
    percentage,
    description,
    date,
    createdAt: new Date().toISOString(),
    createdBy: req.user.uid // Usuario de Firebase
  };

  res.json(newAdvance);
});

app.listen(3001, () => {
  console.log('API listening on port 3001');
});
```

---

## 🎯 Flujo Completo

```
1. Usuario inicia sesión en Firebase
   ↓
2. Usuario navega a /api-remote
   ↓
3. Sistema obtiene token de Firebase
   ↓
4. Sistema carga lista de estudiantes
   - Hace: GET /api/estudiantes
   - Con header: Authorization: Bearer {token}
   ↓
5. Usuario selecciona un estudiante
   ↓
6. Usuario completa formulario y crea avance
   - Hace: POST /api/avances
   - Con header: Authorization: Bearer {token}
   - Con body: { studentId, subjectId, ... }
   ↓
7. Servidor valida token y crea avance
   ↓
8. Sistema muestra confirmación
```

---

## ✅ Checklist

- [ ] Variables de entorno configuradas
- [ ] Aplicación React iniciada
- [ ] Usuario autenticado en Firebase
- [ ] Servidor API ejecutándose
- [ ] Endpoints GET /api/estudiantes probados
- [ ] Endpoints POST /api/avances probados
- [ ] Headers Authorization siendo enviados
- [ ] Tokens siendo validados en servidor
- [ ] Navegación a /api-remote funciona
- [ ] Lista de estudiantes se carga correctamente
- [ ] Formulario de avances funciona

---

## 🔍 Debugging

### Ver Peticiones en DevTools

1. Abre F12 → Pestaña "Network"
2. Haz clic en un request
3. Ve a "Headers" para ver `Authorization: Bearer ...`
4. Ve a "Response" para ver la respuesta del servidor

### Ver Errores en Consola

```javascript
// En DevTools Console:
console.log(auth.currentUser); // Debe mostrar el usuario
```

---

## 📞 ¿Problemas?

| Problema | Solución |
|----------|----------|
| "Usuario no autenticado" | Inicia sesión primero en /login |
| Error 401 | Token expirado o inválido, recarga la página |
| CORS error | Agrega CORS en el servidor |
| Conexión rechazada | Verifica que el servidor esté corriendo |
| URL incorrecta | Usa 127.0.0.1 o localhost, no 0.0.0.0 |

---

## 📚 Documentación Completa

Ver [`API_INTEGRATION_GUIDE.md`](./API_INTEGRATION_GUIDE.md) para más detalles.

---

**Tiempo estimado:** 15 minutos ⏱️

¡Listo! Ya tienes la integración con API REST funcionando. 🎉
