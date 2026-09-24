const test = require('node:test');
const assert = require('node:assert/strict');
const { UpdatePedidoUseCase } = require('../dist/application/use-cases/listaPedidos/UpdatePedidoUseCase.js');

test('no rechaza la misma OT cuando el pedido ya tiene ese ID vinculado', async () => {
  const repo = {
    async findById(id) {
      return { id: 26, orden_trabajo_id: 511 };
    },
    async findByOrdenTrabajoId(id) {
      assert.equal(id, 511);
      return { id: '26', orden_trabajo_id: '511' };
    },
    async update(input) {
      return { ...input, id: 26 };
    },
  };

  const useCase = new UpdatePedidoUseCase(repo);

  const result = await useCase.execute(26, {
    tipo: 'digital',
    fecha_ingreso_pedido: '2026-09-24',
    fecha_aprobacion: null,
    fecha_entrega: null,
    responsable_nombre: 'Mauro Farinango',
    cliente: 'KFC (INT FOOD SERVICES)',
    cliente_id: null,
    orden_trabajo_id: 511,
    descripcion_producto: 'Prueba',
    cantidad: 50,
    no_oc: '',
    no_op: '',
    estado: 'Sin empezar',
    fase: null,
    no_factura: '',
    observaciones: 'prueba persistencia API',
  }, 1);

  assert.equal(result.id, 26);
  assert.equal(result.observaciones, 'prueba persistencia API');
});
