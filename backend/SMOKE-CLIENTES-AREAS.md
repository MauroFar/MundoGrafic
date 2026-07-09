# Smoke test de Clientes y Areas

Valida endpoints principales de clientes y areas contra el backend local.

## Requisitos

- Backend ejecutandose (por defecto en `http://localhost:3002`).
- JWT valido en variable `TOKEN`.
- Opcional `ADMIN_TOKEN` para endpoints admin de areas.

## Uso rapido

```bash
cd backend
BASE_URL=http://localhost:3002 TOKEN=<jwt> node scripts/smoke_clientes_areas.js
```

## Modo estricto

En modo estricto, los `401/403` se consideran fallo.

```bash
cd backend
STRICT=true BASE_URL=http://localhost:3002 TOKEN=<jwt> ADMIN_TOKEN=<jwt_admin> node scripts/smoke_clientes_areas.js
```

## Endpoints cubiertos

- `GET /api/clientes`
- `GET /api/clientes/buscar?q=aa`
- `POST /api/clientes`
- `PUT /api/clientes/:id`
- `GET /api/clientes/:id`
- `DELETE /api/clientes/:id`
- `GET /api/areas`
- `GET /api/areas/all`
- `GET /api/areas/:id`
