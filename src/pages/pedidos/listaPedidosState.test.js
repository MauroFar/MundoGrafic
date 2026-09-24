import test from "node:test";
import assert from "node:assert/strict";

import {
  debeMostrarModalGuardarCompleto,
  normalizarOrdenTrabajoId,
  pedidoBloqueadoPorCompletado,
  pedidoCompletado,
} from "./listaPedidosState.js";

test("muestra confirmación solo cuando el estado cambia a completo", () => {
  assert.equal(debeMostrarModalGuardarCompleto("En proceso", "Completo"), true);
  assert.equal(debeMostrarModalGuardarCompleto("Completo", "Completo"), false);
  assert.equal(debeMostrarModalGuardarCompleto("En proceso", "Atrasado"), false);
});

test("bloquea edición una vez guardado como completo", () => {
  assert.equal(pedidoCompletado("Completo"), true);
  assert.equal(pedidoBloqueadoPorCompletado({ estado: "Completo", guardado: true }), true);
  assert.equal(pedidoBloqueadoPorCompletado({ estado: "En proceso", guardado: true }), false);
  assert.equal(pedidoBloqueadoPorCompletado({ estado: "Completo", guardado: false }), false);
});

test("rechaza IDs temporales/timestamps que no son OT reales", () => {
  assert.equal(normalizarOrdenTrabajoId(1790301200), null);
  assert.equal(normalizarOrdenTrabajoId("13"), 13);
  assert.equal(normalizarOrdenTrabajoId(null), null);
  assert.equal(normalizarOrdenTrabajoId(""), null);
});
