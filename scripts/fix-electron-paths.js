#!/usr/bin/env node

/**
 * Script post-build para corregir rutas en index.html para Electron
 * Convierte rutas absolutas /static/... a relativas ./static/...
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../build/index.html');

console.log('🔧 Fixing paths in index.html for Electron...');
console.log('File:', indexPath);

try {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Contar cambios
  const beforeCount = (content.match(/src="\//g) || []).length + 
                      (content.match(/href="\//g) || []).length;
  
  // Reemplazar rutas absolutas con relativas
  content = content.replace(/src="\/static\//g, 'src="./static/');
  content = content.replace(/href="\/static\//g, 'href="./static/');
  content = content.replace(/href="\/favicon/g, 'href="./favicon');
  content = content.replace(/href="\/manifest/g, 'href="./manifest');
  content = content.replace(/href="\/logo/g, 'href="./logo');
  
  // Escribir el archivo modificado
  fs.writeFileSync(indexPath, content, 'utf8');
  
  console.log('✓ Paths fixed successfully');
  console.log(`✓ Changed ${beforeCount} path references`);
  
} catch (error) {
  console.error('❌ Error fixing paths:', error.message);
  process.exit(1);
}
