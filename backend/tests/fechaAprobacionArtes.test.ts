const test = require('node:test');
const assert = require('node:assert/strict');
const { UpdateOrdenCompletaUseCase } = require('../dist/modules/produccion/ordenes-trabajo/shared/application/use-cases/UpdateOrdenCompletaUseCase.js');

test('respetar la fecha de aprobación de artes cuando el usuario la selecciona', async () => {
  const updateCalls = [];

  const useCase = new UpdateOrdenCompletaUseCase({
    ordenRepo: {
      update: async (id, payload) => {
        updateCalls.push({ id, payload });
        return { id, ...payload };
      },
    },
    detalleDigitalRepo: {
      upsertDetalleCompleto: async () => undefined,
      deleteProductosByOrden: async () => undefined,
    },
    detalleOffsetRepo: {
      upsertDetalleCompleto: async () => undefined,
      deleteProductosByOrden: async () => undefined,
    },
    runInTransaction: async (fn) => fn(),
  });

  await useCase.execute(42, {
    nombre_cliente: 'Cliente 1',
    artes_aprobados: true,
    fecha_aprobacion_artes: '2024-10-12',
    tipo_orden: 'offset',
    detalle: { productos_offset: [] },
  }, 7);

  assert.equal(updateCalls.length, 1);
  assert.equal(updateCalls[0].payload.fecha_aprobacion_artes, '2024-10-12');
});
