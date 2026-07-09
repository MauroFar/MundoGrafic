# Módulo: Órdenes de Trabajo

## Arquitectura Limpia - Órdenes Digitales y Offset

### Principio de Diseño
Este módulo maneja **DOS tipos de órdenes de trabajo**: Digital y Offset.  
Cada tipo tiene tablas separadas, lógica de negocio diferente y flujos distintos.

**Separación estricta**: Digital y Offset están en carpetas independientes para mantener cohesión y evitar acoplamiento.

---

## Estructura del Módulo

```
ordenes-trabajo/
├── shared/                          # Código compartido entre digital y offset
│   ├── domain/
│   │   ├── entities/                # Entidades base
│   │   │   ├── OrdenTrabajoBase.ts  # Props comunes (numero_orden, fecha, cliente, tipo_orden)
│   │   │   └── EstadoBase.ts        # Interfaz base para estados
│   │   ├── repositories/            # Contratos compartidos
│   │   │   ├── IOrdenQueryRepository.ts
│   │   │   └── IOrdenCommandRepository.ts
│   │   └── value-objects/           # VOs reutilizables
│   │       ├── NumeroOrden.ts
│   │       └── TipoOrden.ts         # 'digital' | 'offset'
│   ├── application/
│   │   └── use-cases/
│   │       ├── SearchOrdenesUseCase.ts      # Búsqueda general
│   │       └── GetProximoNumeroUseCase.ts   # Obtener próximo número
│   ├── infrastructure/
│   │   └── helpers/
│   │       ├── estadoNormalizer.ts  # Función normalizeEstado reutilizable
│   │       └── ordenValidator.ts    # Validaciones comunes
│   └── types/
│       └── index.ts                 # Tipos compartidos
│
├── digital/                         # Todo lo específico de órdenes DIGITALES
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── OrdenDigital.ts      # extends OrdenTrabajoBase
│   │   │   ├── DetalleOrdenDigital.ts
│   │   │   ├── ProductoOrdenDigital.ts
│   │   │   └── EstadoOrdenDigital.ts
│   │   └── repositories/
│   │       ├── IOrdenDigitalRepository.ts
│   │       ├── IDetalleDigitalRepository.ts
│   │       ├── IProductoDigitalRepository.ts
│   │       └── IEstadoDigitalRepository.ts
│   ├── application/
│   │   └── use-cases/
│   │       ├── CreateOrdenDigitalUseCase.ts
│   │       ├── GetOrdenDigitalByIdUseCase.ts
│   │       ├── UpdateOrdenDigitalUseCase.ts
│   │       ├── DeleteOrdenDigitalUseCase.ts
│   │       ├── AprobarOrdenDigitalUseCase.ts
│   │       ├── EnviarProduccionDigitalUseCase.ts
│   │       ├── UpdateEstadoDigitalUseCase.ts
│   │       ├── GeneratePdfDigitalUseCase.ts
│   │       └── SendEmailDigitalUseCase.ts
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── PgOrdenDigitalRepository.ts
│   │   │   ├── PgDetalleDigitalRepository.ts
│   │   │   ├── PgProductoDigitalRepository.ts
│   │   │   └── PgEstadoDigitalRepository.ts
│   │   └── services/
│   │       ├── OrdenDigitalPdfService.ts     # generarHTMLOrdenDigital
│   │       └── OrdenDigitalEmailService.ts
│   └── presentation/
│       └── controllers/
│           ├── OrdenDigitalCommandController.ts  # POST, PUT, DELETE
│           ├── OrdenDigitalQueryController.ts    # GET
│           ├── OrdenDigitalEstadoController.ts   # Aprobar, enviar producción
│           └── OrdenDigitalDocumentController.ts # PDF, email
│
├── offset/                          # Todo lo específico de órdenes OFFSET
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── OrdenOffset.ts       # extends OrdenTrabajoBase
│   │   │   ├── DetalleOrdenOffset.ts
│   │   │   ├── ProductoOrdenOffset.ts
│   │   │   └── EstadoOrdenOffset.ts
│   │   └── repositories/
│   │       ├── IOrdenOffsetRepository.ts
│   │       ├── IDetalleOffsetRepository.ts
│   │       ├── IProductoOffsetRepository.ts
│   │       └── IEstadoOffsetRepository.ts
│   ├── application/
│   │   └── use-cases/
│   │       ├── CreateOrdenOffsetUseCase.ts
│   │       ├── GetOrdenOffsetByIdUseCase.ts
│   │       ├── UpdateOrdenOffsetUseCase.ts
│   │       ├── DeleteOrdenOffsetUseCase.ts
│   │       ├── AprobarOrdenOffsetUseCase.ts
│   │       ├── EnviarProduccionOffsetUseCase.ts
│   │       ├── UpdateEstadoOffsetUseCase.ts
│   │       ├── GeneratePdfOffsetUseCase.ts
│   │       └── SendEmailOffsetUseCase.ts
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── PgOrdenOffsetRepository.ts
│   │   │   ├── PgDetalleOffsetRepository.ts
│   │   │   ├── PgProductoOffsetRepository.ts
│   │   │   └── PgEstadoOffsetRepository.ts
│   │   └── services/
│   │       ├── OrdenOffsetPdfService.ts     # generarHTMLOrdenOffset
│   │       └── OrdenOffsetEmailService.ts
│   └── presentation/
│       └── controllers/
│           ├── OrdenOffsetCommandController.ts
│           ├── OrdenOffsetQueryController.ts
│           ├── OrdenOffsetEstadoController.ts
│           └── OrdenOffsetDocumentController.ts
│
└── presentation/
    └── routes/
        └── ordenTrabajoModuleRoutes.ts    # Orquestador que monta digital + offset

```

---

## Tablas de Base de Datos

### Tabla Principal
- `orden_trabajo`: Campos comunes (id, numero_orden, fecha, cliente_id, tipo_orden: 'digital'|'offset')

### Digital
- `detalle_orden_trabajo_digital`: Specs digitales (adherencia, lote_material, metros_impresos, etc.)
- `productos_orden_digital`: Productos específicos con numero_salida
- `estado_orden_digital`: Catálogo de estados
- `estado_orden_digital_historial`: Trazabilidad de cambios

### Offset
- `detalle_orden_trabajo_offset`: Specs offset (corte_material, cantidad_pliegos_compra, exceso, etc.)
- `productos_orden_offset`: Productos específicos
- `estado_orden_offset`: Catálogo de estados
- `estado_orden_offset_historial`: Trazabilidad de cambios

---

## Endpoints a Migrar

### Shared (ambos tipos)
- `GET /datosCotizacion/:id` - Obtener datos de cotización para vincular
- `GET /cotizaciones-vinculables` - Listar cotizaciones disponibles
- `PUT /vincular-cotizacion/:id` - Vincular cotización existente a orden
- `POST /crearOrdenTrabajo` - Crear orden (dispatcher según tipo_orden)
- `GET /` (listar) - Listado con filtros y búsqueda
- `GET /buscar` - Búsqueda por número/cliente
- `GET /:id` - Obtener orden por ID (con detalles según tipo)
- `GET /proximoNumero` - Obtener próximo número de orden
- `DELETE /:id` - Eliminar orden

### Digital
- `PUT /:id` - Actualizar orden digital (con detalles y productos)
- `PUT /aprobar/:id` - Aprobar orden digital
- `PUT /enviarProduccion/:id` - Enviar a producción
- `GET /produccion/ordenes` - Órdenes en producción
- `GET /produccion/trazabilidad/:id` - Trazabilidad digital
- `GET /:id/pdf` - Generar PDF digital
- `POST /:id/enviar-correo` - Enviar correo PDF digital
- `GET /:id/preview` - Preview PDF digital
- `PUT /produccion/workflow/:id/estado` - Actualizar estado workflow digital
- `PATCH /:id/responsables-preprensa` - Actualizar responsables preprensa

### Offset
- `PUT /:id` - Actualizar orden offset (con detalles y productos)
- `PUT /aprobar/:id` - Aprobar orden offset
- `PUT /enviarProduccion/:id` - Enviar a producción
- `GET /produccion/ordenes` - Órdenes en producción
- `GET /produccion/trazabilidad/:id` - Trazabilidad offset
- `GET /:id/pdf` - Generar PDF offset
- `POST /:id/enviar-correo` - Enviar correo PDF offset
- `GET /:id/preview` - Preview PDF offset
- `PUT /produccion/workflow/:id/estado` - Actualizar estado workflow offset

### Producción (transversal, pero con lógica separada internamente)
- `POST /produccion/actualizar-estado` - Actualizar estado de producción
- `GET /produccion/workflow/:id` - Obtener workflow por ID
- `GET /produccion/etapas-flujo` - Obtener etapas del flujo de producción
- `GET /produccion/ordenes/ultimas` - Últimas órdenes actualizadas
- `GET /produccion/estados` - Catálogos de estados (digital y offset)
- `PUT /produccion/workflow/:id/cambiar-estado` - Cambiar estado masivo

---

## Estrategia de Migración

1. ✅ **Paso 1**: Limpieza legacy de cotizaciones (completado)
2. **Paso 2**: Crear estructura de carpetas shared/digital/offset
3. **Paso 3**: Implementar domain layer (entities, repositories contracts)
4. **Paso 4**: Migrar use cases shared (búsqueda, próximo número)
5. **Paso 5**: Migrar use cases digital (CRUD, estados, PDF)
6. **Paso 6**: Migrar use cases offset (CRUD, estados, PDF)
7. **Paso 7**: Implementar controllers y routes
8. **Paso 8**: Montar módulo en api.ts
9. **Paso 9**: Deshabilitar legacy routes en ordenTrabajo.ts
10. **Paso 10**: Validación y testing

---

## Principios de Diseño Aplicados

- **Single Responsibility**: Cada carpeta (digital/offset) tiene su propia lógica sin mezclar
- **Open/Closed**: El shared/ contiene abstracciones reutilizables
- **Dependency Inversion**: Controllers dependen de use cases, use cases de repositories (interfaces)
- **Strangler Pattern**: Legacy se mantiene comentado hasta validación completa
- **Don't Repeat Yourself**: Código común en shared/, específico en digital/offset

---

## Notas de Implementación

- **PDF Generators**: Los templates HTML masivos (generarHTMLOrdenDigital, generarHTMLOrdenOffset) se exportarán desde helpers similares a cotizaciones
- **Estado Normalizer**: La lógica de normalización de estados (CANONICAL_STATES, DISPLAY_TO_CANON) va a shared/helpers
- **Validaciones**: Middleware validateOrdenTrabajo se reutiliza inicialmente, luego se puede migrar a use case validators
- **Permisos**: checkPermission('ordenes_trabajo', 'crear|editar|ver') se mantiene en routes
