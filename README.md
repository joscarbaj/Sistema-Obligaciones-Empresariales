# Sistema de Obligaciones Empresariales

Proyecto de vinculación para **Grupo Empresarial JD**.

## Módulos incluidos

1. Base Electron + SQL Server
2. Autenticación
3. Gestión de empresas
4. Gestión de obligaciones
5. Dashboard de vencimientos

## Requisitos

- Windows
- Node.js
- SQL Server
- ODBC Driver 18 for SQL Server
- Base de datos `GrupoEmpresarialJD`

## Instalación

```bash
npm install
npm run init-db
npm start
```

El script `npm run init-db` crea, si hacen falta:

- Grupo empresarial JD.
- Tipos básicos de obligación.
- Usuario inicial `admin`.

Credenciales iniciales de desarrollo:

- Usuario: `admin`
- Contraseña: `Admin123*`

Cambie esa contraseña antes de utilizar el sistema fuera de pruebas.

## Arquitectura

El renderer no se conecta directamente a SQL Server.

```text
HTML / JS
   ↓
preload.js
   ↓
IPC Electron
   ↓
services
   ↓
database.js
   ↓
SQL Server
```

La configuración de conexión está en `.env`, el cual está excluido de Git.
