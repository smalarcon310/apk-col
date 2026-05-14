const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const fs = require('fs');

let mainWindow;

const createWindow = () => {
  console.log('================================');
  console.log('📱 Creating Electron Window');
  console.log('isDev:', isDev);
  console.log('__dirname:', __dirname);
  console.log('app.getAppPath():', app.getAppPath());
  console.log('process.resourcesPath:', process.resourcesPath);
  console.log('================================');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
    },
    icon: path.join(__dirname, 'logo.ico'), // Opcional: agregar icono
  });

  let startUrl;
  let startFile = null;
  
  if (isDev) {
    // Desarrollo: conectar al servidor React en localhost:3000
    startUrl = 'http://localhost:3000';
    console.log('Development mode - Loading from:', startUrl);
  } else {
    // Producción: buscar build/index.html
    // En modo empaquetado, la estructura es: app.asar/build/index.html
    const possiblePaths = [
      path.join(__dirname, '../build/index.html'),
      path.join(app.getAppPath(), 'build/index.html'),
      path.join(process.resourcesPath, 'app/build/index.html'),
      path.join(process.resourcesPath, 'build/index.html'),
    ];
    
    let foundPath = null;
    for (const filePath of possiblePaths) {
      console.log('Checking path:', filePath);
      if (fs.existsSync(filePath)) {
        foundPath = filePath;
        console.log('✓ Found build at:', foundPath);
        break;
      } else {
        console.log('✗ Not found:', filePath);
      }
    }
    
    if (foundPath) {
      startFile = foundPath;
    } else {
      console.error('Build file not found. Checked:', possiblePaths);
      // Fallback al archivo de prueba si no existe build
      const testPath = path.join(__dirname, 'index-test.html');
      if (fs.existsSync(testPath)) {
        startFile = testPath;
        console.log('Using test HTML:', startFile);
      } else {
        startFile = path.join(__dirname, '../build/index.html');
      }
    }
    
    console.log('Production mode - Loading from file:', startFile);
  }

  if (isDev) {
    mainWindow.loadURL(startUrl);
  } else {
    mainWindow.loadFile(startFile);
  }

  // Abrir DevTools SIEMPRE
  mainWindow.webContents.openDevTools();

  // Manejar errores de carga
  mainWindow.webContents.on('crashed', () => {
    console.error('❌ App crashed');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`❌ Failed to load: ${errorCode} - ${errorDescription}`);
    console.error('Tried to load:', isDev ? startUrl : startFile);
    // Si no es el HTML de prueba, intenta cargarlo
    const testPath = path.join(__dirname, 'index-test.html');
    const currentPath = isDev ? startUrl : startFile;
    if (!String(currentPath).includes('index-test.html') && fs.existsSync(testPath)) {
      mainWindow.loadFile(testPath);
      setTimeout(() => mainWindow.webContents.openDevTools(), 1000);
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✓ Content loaded successfully');
  });

  // Logs en la consola del renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[RENDERER] ${message}`);
  });

  // Manejar errores no capturados
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('❌ Render process gone:', details);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Crear menú de aplicación
const createMenu = () => {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Salir',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Edición',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de SERMA',
          click: () => {
            // Aquí puede abrir un diálogo con información de la app
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

app.on('ready', () => {
  createMenu();
});

// Manejar eventos IPC (comunicación entre procesos)
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});
