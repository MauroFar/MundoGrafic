import { OrdenPdfService } from '../src/modules/produccion/ordenes-trabajo/shared/infrastructure/services/OrdenPdfService';

const service = new OrdenPdfService({ query: async () => ({ rows: [] }) } as any);

const orden = {
  numero_orden: '123',
  orden_compra: 'OC-001',
  numero_cotizacion: 'COT-010',
  nombre_cliente: 'Cliente Demo',
  contacto: 'Ana',
  telefono: '555-0101',
  email: 'ana@demo.com',
  fecha_creacion: '2025-01-10',
  fecha_entrega: '2025-01-20',
  artes_aprobados: true,
  fecha_aprobacion_artes: '2025-01-12',
};

const detalle = {
  material: 'Cartulina 300gr',
  corte_material: 'Corte 1/4',
  cantidad_pliegos_compra: '2500',
  exceso: '50',
  total_pliegos: '2550',
  tamano: '12x18',
  tamano_abierto_1: '12x18',
  tamano_cerrado_1: '12x18',
  impresion: '4/0',
  instrucciones_impresion: 'Colores según arte',
  instrucciones_acabados: 'Barnizado brillante',
  instrucciones_empacado: 'Caja por 100',
  observaciones: 'Entrega urgente',
  notas_observaciones: 'Notas extra',
  prensa_seleccionada: 'Prensa 2',
  trazabilidad_proceso: JSON.stringify({
    procesos_seleccionados: ['preprensa','impresion','pegado','encolado','grapado','anillado','estampado','terminado'],
    pegado: { responsable: 'Pablo', cantidad: '1000' },
    encolado: { responsable: 'Lucas', cantidad: '1000' },
    grapado: { responsable: 'Marta', cantidad: '1000' },
    anillado: { responsable: 'Diana', cantidad: '1000' },
    estampado: { responsable: 'Rosa', cantidad: '1000' },
    terminado: { responsable: 'Sara', cantidad: '1000' },
  }),
  productos_offset: [
    { concepto: 'Folleto', cantidad: 1200 },
  ],
  preprensa: 'Preprensa Demo',
  prensa: 'Prensa Demo',
  terminados: 'Terminados Demo',
  vendedor: 'Vendedor Demo',
  liberacion_producto: 'L. Producto',
};

const html = (service as any).buildHtmlOffset(orden, detalle, '', '');
const required = [
  'Información del Trabajo',
  'Material y Corte',
  'Cantidad de Pliegos',
  'Impresión y Acabados',
  'Prensa y Observaciones',
  'Pegado de cajas',
  'Encolado',
  'Grapado',
  'Anillado',
  'Estampado',
  'Cantidad',
  'Concepto',
  'Tamaño Abierto',
  'Seleccionar Prensa',
];

const missing = required.filter((label) => !html.includes(label));
if (missing.length) {
  throw new Error(`Faltan etiquetas en el HTML del PDF offset: ${missing.join(', ')}`);
}

console.log('OK - offset PDF parity check passed.');
