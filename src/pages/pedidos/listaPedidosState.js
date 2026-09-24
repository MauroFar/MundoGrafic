export const normalizarEstadoPedido = (valor = "") => String(valor ?? "").trim().toLowerCase();

export const pedidoCompletado = (estado = "") => normalizarEstadoPedido(estado) === "completo";

export const normalizarOrdenTrabajoId = (valor) => {
  if (valor === null || valor === undefined || valor === "") return null;

  const texto = String(valor).trim();
  if (!texto || texto.toLowerCase() === "null") return null;

  const numero = Number(texto);
  if (!Number.isInteger(numero) || numero <= 0) return null;

  // Los IDs reales de OT suelen ser pequeños y persistentes. Los timestamps / expirations
  // (ej. 1790301200) no deben usarse como OT.
  if (numero > 1000000000) return null;

  return numero;
};

export const debeMostrarModalGuardarCompleto = (estadoAnterior = "", estadoNuevo = "") => {
  const anterior = normalizarEstadoPedido(estadoAnterior);
  const nuevo = normalizarEstadoPedido(estadoNuevo);

  return nuevo === "completo" && anterior !== "completo";
};

export const pedidoBloqueadoPorCompletado = ({ estado = "", guardado = false }) => {
  return guardado && pedidoCompletado(estado);
};
