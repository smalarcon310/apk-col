# Conexión con MySQL Workbench

## 1. Crear la base de datos

1. Abre MySQL Workbench y conéctate a tu servidor local.
2. Abre `DATABASE_SCHEMA_MYSQL.sql` y ejecútalo completo.
3. Confirma que exista la base `serma_db` y sus tablas.

## 2. Configurar credenciales

Edita `.env` con los datos de tu instalación:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_clave_de_mysql
DB_NAME=serma_db
```

Estas variables solo las lee el backend. No deben escribirse como `REACT_APP_*` porque esas variables se entregan al navegador.

## 3. Ejecutar la API y la aplicación

En una terminal:

```bash
pnpm api
```

En otra terminal:

```bash
pnpm start
```

La API queda en `http://localhost:3002` y la aplicación en `http://localhost:3000`.

## 4. Comprobar la conexión

Abre `http://localhost:3002/health`. Una conexión correcta devuelve:

```json
{"status":"ok","database":"mysql"}
```

La pantalla de integración API usa la misma conexión para consultar estudiantes y guardar avances.
MySQL