/**
 * SERMA - Guía de Deployment
 * Pasos para desplegar la aplicación a producción
 */

# 📦 DEPLOYMENT GUIDE - SERMA

## Requisitos Previos

- Node.js 16+
- npm o yarn
- Cuenta de Firebase (Blaze plan mínimo para producción)
- Dominio personalizado (opcional)
- Git

---

## Opción 1: Firebase Hosting (RECOMENDADO)

### Paso 1: Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### Paso 2: Autenticarse con Firebase

```bash
firebase login
```

### Paso 3: Inicializar proyecto

```bash
firebase init hosting
```

Seleccionar:
- Proyecto: `serma-demo` (el que creaste)
- Carpeta pública: `build`
- SPA (Single Page Application): Sí

### Paso 4: Compilar para producción

```bash
npm run build
```

Esto crea la carpeta `build/` optimizada.

### Paso 5: Desplegar

```bash
firebase deploy
```

Tu aplicación estará en: `https://tu-proyecto.web.app`

---

## Opción 2: Vercel

### Paso 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Paso 2: Desplegar

```bash
vercel
```

Sigue las instrucciones interactivas.

### Paso 3: Configurar variables de entorno

En Vercel Dashboard > Settings > Environment Variables:

```
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
...
```

---

## Opción 3: Netlify

### Paso 1: Conectar repositorio

1. Ir a [Netlify](https://netlify.com)
2. Click en "New site from Git"
3. Autorizar GitHub/GitLab/Bitbucket

### Paso 2: Configurar build

Build command: `npm run build`
Publish directory: `build`

### Paso 3: Agregar variables de entorno

Site settings > Build & deploy > Environment:

```
REACT_APP_FIREBASE_API_KEY=...
```

---

## Checklist de Producción

### Seguridad
- [ ] Variables de entorno configuradas (.env con valores reales)
- [ ] Reglas de Firestore implementadas (ver FIRESTORE_RULES.txt)
- [ ] HTTPS habilitado (automático en Firebase, Vercel, Netlify)
- [ ] CORS configurado si necesario
- [ ] Claves de API restringidas a dominio específico

### Optimización
- [ ] `npm run build` completado sin errores
- [ ] Todos los archivos .env.example eliminados del repositorio
- [ ] node_modules no incluido en git (.gitignore)
- [ ] Lazy loading de componentes implementado
- [ ] Imágenes optimizadas

### Firebase
- [ ] Firestore Database activa
- [ ] Authentication habilitada (Email/Contraseña)
- [ ] Reglas de seguridad revisadas
- [ ] Backups automatizados configurados
- [ ] Monitoreo y alertas configuradas

### Monitoring
- [ ] Google Analytics configurado
- [ ] Error tracking (Sentry, Firebase Crashlytics)
- [ ] Performance monitoring habilitado
- [ ] Logs centralizados

### Testing
- [ ] Tests unitarios pasando
- [ ] Tests de integración realizados
- [ ] Validaciones funcionando
- [ ] Búsqueda y filtrado verificados
- [ ] Operaciones CRUD probadas

### Documentación
- [ ] README actualizado
- [ ] API documentation completada
- [ ] Guía de usuario creada
- [ ] Proceso de backup documentado

---

## Variables de Entorno de Producción

```env
# Firebase (usar proyecto de PRODUCCIÓN)
REACT_APP_FIREBASE_API_KEY=production_key
REACT_APP_FIREBASE_AUTH_DOMAIN=serma-prod.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=serma-prod
REACT_APP_FIREBASE_STORAGE_BUCKET=serma-prod.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=prod_sender_id
REACT_APP_FIREBASE_APP_ID=prod_app_id

# Configuración
REACT_APP_USE_EMULATOR=false
REACT_APP_ENVIRONMENT=production
```

---

## Optimizaciones Recomendadas

### 1. Código Splitting

```javascript
const StudentsModule = React.lazy(() => import('./modules/StudentsModule'));

<Suspense fallback={<Loading />}>
  <StudentsModule />
</Suspense>
```

### 2. Caching

Configurar service workers para caché offline:

```bash
npm install workbox-cli --save-dev
npx workbox wizard --injectManifest
```

### 3. Compresión

Los servidores de hosting (Firebase, Vercel, Netlify) comprimen automáticamente.

### 4. CDN

Todos incluyen CDN global automático.

---

## Monitoreo Post-Deployment

### Firebase Console
- Performance > Real-time database
- Realtime database > Usage
- Authentication > Users
- Firestore > Storage

### Métricas Importantes
- ⚠️ Latencia de queries Firestore
- ⚠️ Uso de Storage (10GB gratis)
- ⚠️ Número de usuarios activos
- ⚠️ Errores de autenticación

---

## Rollback

Si hay problemas después del deployment:

### Firebase Hosting
```bash
firebase deploy --only hosting --version previous
```

### Vercel
Dashboard > Deployments > Redeploy

### Netlify
Site settings > Deploys > Select previous > Restore

---

## Actualizaciones y Mantenimiento

### Actualizar dependencias (mensual)

```bash
npm outdated  # Ver versiones disponibles
npm update    # Actualizar
npm audit fix # Parches de seguridad
```

### Hacer backup de Firestore

```bash
gcloud firestore export gs://tu-bucket/backup-$(date +%Y%m%d)
```

### Monitorear seguridad

- Revisar Firebase Security Advisories
- Mantener Node.js actualizado
- Auditar logs de acceso

---

## Preguntas Frecuentes

### ¿Cuánto cuesta Firebase?
- Firestore: $0.06 por 100,000 lecturas (primeras 50,000 gratis/día)
- Authentication: Gratis hasta 50,000 usuarios
- Hosting: Gratis hasta 10GB/mes

### ¿Cómo escalar la aplicación?
- Usar Firestore (escalable automáticamente)
- Implementar paginación (ya incluida)
- Agregar índices de Firestore para queries complejas

### ¿Cómo proteger datos sensibles?
- Usar reglas de Firestore estrictas
- Encripción en tránsito (HTTPS automático)
- Validar en servidor antes de guardar
- Implementar auditoría de cambios

---

## Soporte

Para problemas de deployment, consultar:
- [Firebase Docs](https://firebase.google.com/docs/hosting/deploy)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com/)

---

**Última actualización**: Noviembre 2025
