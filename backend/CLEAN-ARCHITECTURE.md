# Arquitectura limpia del backend

Esta estructura separa el backend por responsabilidades para poder migrar el sistema poco a poco sin romper lo que ya existe.

## Capas

- **presentation**: rutas, controladores y DTOs. Recibe HTTP y responde HTTP.
- **application**: casos de uso. Coordina el flujo del negocio.
- **domain**: entidades y contratos del negocio. No depende de Express ni de PostgreSQL.
- **infrastructure**: implementaciones técnicas, como SQL, repositorios y adaptadores.
- **shared**: utilidades comunes, errores y logging.

## Flujo recomendado

1. La ruta recibe la petición.
2. El controlador transforma la entrada.
3. El caso de uso ejecuta la regla de negocio.
4. El repositorio consulta o guarda en la base de datos.
5. La respuesta vuelve al controlador y luego al cliente.

## Orden sugerido para migrar

1. Módulos pequeños o poco críticos.
2. Módulos grandes con mucha lógica mezclada.
3. Módulos que más cambian o más dolor generan.

## Carpeta piloto

Se dejó un ejemplo inicial para `pedidos` para usarlo como modelo al migrar otros módulos.
