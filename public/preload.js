const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al contexto de la aplicación
contextBridge.exposeInMainWorld('electron', {
  // Obtener versión de la app
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  
  // Obtener ruta de la app
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // Función para enviar eventos
  send: (channel, data) => {
    const validChannels = ['to-main'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Función para recibir eventos
  receive: (channel, func) => {
    const validChannels = ['from-main'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },

  // Remover listener
  removeListener: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
