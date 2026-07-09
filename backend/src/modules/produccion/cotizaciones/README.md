# Modulo Cotizaciones

Estado actual: `transicion`.

Este modulo ya esta desacoplado a nivel de ruteo dentro de `src/modules/cotizaciones`.
Por ahora usa un adaptador legacy para mantener comportamiento estable mientras se migra logica interna por capas.

## Rutas montadas por el modulo

- `/api/cotizaciones`
- `/api/cotizacionesDetalles`
- `/api/cotizacionesEditar`

## Siguientes pasos de migracion

1. Extraer consultas SQL a repositorios del modulo.
2. Crear casos de uso por endpoint critico.
3. Mover validaciones y reglas de negocio fuera de `routes/cotizaciones.ts`.
4. Eliminar adaptador legacy cuando todos los endpoints esten en capas limpias.
