# Guía: Convertir SERMA a Aplicación Electron

## ✅ Configuración Completada

Se han realizado los siguientes cambios:

### 1. Nuevos Archivos Creados:
- `public/electron.js` - Proceso principal de Electron
- `public/preload.js` - Script de preload seguro para comunicación entre procesos
- `ELECTRON_SETUP.md` - Esta guía

### 2. Cambios en `package.json`:
- Agregado campo `main: "public/electron.js"`
- Agregado campo `homepage: "./"`
- Nuevas dependencias: `electron`, `electron-builder`, `concurrently`, `wait-on`, `electron-is-dev`
- Nuevos scripts: `electron-dev`, `electron-build`, `electron-build:win`
- Configuración de `electron-builder` para crear instaladores Windows

---

## 🚀 Instalación de Dependencias

```bash
pnpm install
```

O si quieres instalar solo las nuevas dependencias de Electron:

```bash
pnpm add -D electron electron-builder concurrently wait-on
pnpm add electron-is-dev
```

---

## 💻 Ejecutar en Modo Desarrollo

```bash
pnpm run electron-dev
```

Esto hará lo siguiente:
1. Inicia el servidor de React en `http://localhost:3000`
2. Espera a que el servidor esté listo
3. Abre la aplicación en una ventana Electron

---

## 📦 Crear Instalador para Windows

### Opción 1: Instalador NSIS + Versión Portable

```bash
pnpm run electron-build:win
```

Esto generará en la carpeta `dist/`:
- `SERMA Setup 1.0.0.exe` - Instalador tradicional
- `SERMA 1.0.0.exe` - Versión portable (standalone)

### Opción 2: Solo Build (sin instalador)

```bash
pnpm run electron-build
```

---

## 🔧 Configuración Adicional

### Cambiar Icono de la Aplicación

1. Crea un icono en formato `.ico` (512x512 píxeles)
2. Guárdalo en `public/logo.ico`
3. El archivo ya está referenciado en `public/electron.js`

Puedes usar herramientas online como: https://icoconvert.com/

### Variables de Entorno

Las variables de Firebase ya se configuran en `src/config/firebase.js`. Para desarrollo en Electron:

1. Asegúrate de tener `firebase-key.json` en la raíz del proyecto
2. Las credenciales de Firebase se cargarán correctamente

---

## 📋 Estructura del Proyecto con Electron

```
apk-col/
├── public/
│   ├── electron.js        ← Proceso principal de Electron
│   ├── preload.js         ← Script de preload seguro
│   ├── index.html
│   └── logo.ico           ← (opcional) Icono de la app
├── src/
│   ├── App.js
│   ├── index.js
│   └── ...
├── build/                 ← Se crea al ejecutar `npm run build`
│   └── ...
├── dist/                  ← Se crea al ejecutar `electron-build`
│   ├── SERMA Setup 1.0.0.exe
│   └── SERMA 1.0.0.exe
└── package.json
```

---

## 🎯 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm run dev` | Ejecuta app React en navegador (desarrollo web) |
| `pnpm run start` | Alias de `dev` |
| `pnpm run build` | Build de producción de React |
| `pnpm run electron-dev` | Ejecuta la app en Electron (desarrollo) |
| `pnpm run electron-build:win` | Crea instalador Windows |
| `pnpm run test` | Ejecuta tests |

---

## 🐛 Troubleshooting

### "Cannot find module 'electron'"
```bash
pnpm install -D electron
```

### El puerto 3000 ya está en uso
Cambia el puerto en el archivo `public/electron.js`:
```javascript
? 'http://localhost:3001'  // Cambia 3000 por 3001
```

### Electron no se abre
1. Verifica que la compilación de React fue exitosa: `pnpm run build`
2. Asegúrate de que `public/electron.js` existe
3. Intenta ejecutar nuevamente: `pnpm run electron-dev`

### El icono no aparece
Asegúrate de que `logo.ico` existe en la carpeta `public/`

---

## 🔐 Seguridad

La configuración incluye:
- ✅ `nodeIntegration: false` - Deshabilitado por seguridad
- ✅ `contextIsolation: true` - Aislamiento de contexto
- ✅ `preload.js` - Script de preload para comunicación segura
- ✅ `sandbox: true` - Sandbox habilitado

---

## 📝 Próximos Pasos (Opcional)

1. **Agregar Icono:** Coloca `logo.ico` en `public/`
2. **Firmar la Aplicación:** Para distribución profesional
3. **Configurar Auto-actualización:** Usando `electron-updater`
4. **Crear Instalador Mac:** Agregando configuración `build.mac`

---

## 📞 Soporte

Para más información sobre Electron: https://www.electronjs.org/docs
Para electron-builder: https://www.electron.build/
