import React from 'react';
import {
  FaTimes,
  FaUser,
  FaFileAlt,
  FaCalendar,
  FaClipboardList,
  FaHistory,
  FaEdit,
  FaEye
} from 'react-icons/fa';

const OrdenDetalleModal = ({ ordenDetalle, onClose, onEdit, onViewPDF, canEdit }) => {
  if (!ordenDetalle) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Detalles de la Orden de Trabajo - {ordenDetalle.tipo_orden === 'digital' ? 'Digital' : 'Offset'}
              </h2>
              <div className="text-green-100 text-lg font-semibold">Orden N° {ordenDetalle.numero_orden}</div>
              {ordenDetalle.numero_cotizacion && (
                <div className="text-green-200 text-sm">Cotización: {ordenDetalle.numero_cotizacion}</div>
              )}
            </div>
            <button onClick={onClose} className="text-white hover:bg-green-500 rounded-full p-2 transition-colors">
              <FaTimes size={24} />
            </button>
          </div>
          {ordenDetalle.estado && (
            <div className="mt-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                ordenDetalle.estado.toLowerCase() === 'en producción' ? 'bg-blue-500 text-white'
                : ordenDetalle.estado.toLowerCase() === 'completado' ? 'bg-green-500 text-white'
                : ordenDetalle.estado.toLowerCase() === 'pendiente' ? 'bg-yellow-500 text-white'
                : 'bg-gray-500 text-white'
              }`}>
                {ordenDetalle.estado.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">

          {/* ── 1. INFORMACIÓN DEL CLIENTE ── */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
              <FaUser className="mr-2 text-green-600" /> Información del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm text-gray-500 block mb-1">Cliente</label>
                <p className="text-gray-900 font-medium">{ordenDetalle.nombre_cliente || 'N/A'}</p>
              </div>
              {ordenDetalle.contacto && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-sm text-gray-500 block mb-1">Contacto</label>
                  <p className="text-gray-900 font-medium">{ordenDetalle.contacto}</p>
                </div>
              )}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm text-gray-500 block mb-1">Email</label>
                <p className="text-gray-900 font-medium">{ordenDetalle.email || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm text-gray-500 block mb-1">Teléfono</label>
                <p className="text-gray-900 font-medium">{ordenDetalle.telefono || 'N/A'}</p>
              </div>
              {ordenDetalle.orden_compra && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-sm text-gray-500 block mb-1">Orden de Compra</label>
                  <p className="text-gray-900 font-medium">{ordenDetalle.orden_compra}</p>
                </div>
              )}
              <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-3">
                <FaCalendar className="text-green-600 shrink-0" />
                <div>
                  <label className="text-sm text-gray-500 block">Fecha de Creación</label>
                  <p className="text-gray-900 font-medium">
                    {ordenDetalle.fecha_creacion
                      ? new Date(ordenDetalle.fecha_creacion).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-3">
                <FaCalendar className="text-green-600 shrink-0" />
                <div>
                  <label className="text-sm text-gray-500 block">Fecha de Entrega</label>
                  <p className="text-gray-900 font-medium">
                    {ordenDetalle.fecha_entrega
                      ? new Date(ordenDetalle.fecha_entrega).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2 + 3 + 4: DIFERENCIADO POR TIPO ── */}
          {ordenDetalle.tipo_orden === 'digital' ? (
            <>
              {/* DIGITAL – Información del Trabajo */}
              {ordenDetalle.detalle?.productos_digital && ordenDetalle.detalle.productos_digital.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaClipboardList className="mr-2 text-green-600" /> Información del Trabajo
                  </h3>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Cantidad</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Cod MG</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Cod Cliente</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Producto</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Avance (mm)</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b whitespace-nowrap">Gap H (mm)</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b whitespace-nowrap">Ancho (mm)</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b whitespace-nowrap">Gap V (mm)</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b whitespace-nowrap">Alto (mm)</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Cavidad</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b whitespace-nowrap">Metros Imp.</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b whitespace-nowrap">Papel Ancho</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b whitespace-nowrap">Papel Largo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ordenDetalle.detalle.productos_digital.map((producto, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.cantidad || 'N/A'}</td>
                              <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.cod_mg || 'N/A'}</td>
                              <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.cod_cliente || 'N/A'}</td>
                              <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.producto || producto.descripcion || 'N/A'}</td>
                              <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.avance || 'N/A'}</td>
                              <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.gap_horizontal || 'N/A'}</td>
                              <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.medida_ancho || 'N/A'}</td>
                              <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.gap_vertical || 'N/A'}</td>
                              <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.medida_alto || 'N/A'}</td>
                              <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.cavidad || 'N/A'}</td>
                              <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.metros_impresos || 'N/A'}</td>
                              <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.tamano_papel_ancho || 'N/A'}</td>
                              <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.tamano_papel_largo || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* DIGITAL – Información Técnica */}
              {(ordenDetalle.detalle?.adherencia || ordenDetalle.detalle?.material ||
                ordenDetalle.detalle?.impresion || ordenDetalle.detalle?.tipo_impresion ||
                ordenDetalle.detalle?.terminado_etiqueta || ordenDetalle.detalle?.espesor) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaClipboardList className="mr-2 text-green-600" /> Información Técnica
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ordenDetalle.detalle?.adherencia && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Adherencia</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.detalle.adherencia}</p>
                      </div>
                    )}
                    {ordenDetalle.detalle?.material && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Material</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.detalle.material}</p>
                      </div>
                    )}
                    {ordenDetalle.detalle?.proveedor_material && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Proveedor de Material</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.detalle.proveedor_material}</p>
                      </div>
                    )}
                    {ordenDetalle.detalle?.lote_material && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Lote Material / Código Material</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.detalle.lote_material}</p>
                      </div>
                    )}
                    {ordenDetalle.detalle?.lote_produccion && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Lote de Producción</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.detalle.lote_produccion}</p>
                      </div>
                    )}
                    {ordenDetalle.detalle?.impresion && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Impresión</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.detalle.impresion}</p>
                      </div>
                    )}
                    {ordenDetalle.detalle?.tipo_impresion && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Tipo de Impresión</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.detalle.tipo_impresion}</p>
                      </div>
                    )}
                    {ordenDetalle.detalle?.troquel && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Troquel</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.detalle.troquel}</p>
                      </div>
                    )}
                    {ordenDetalle.detalle?.codigo_troquel && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Código Troquel</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.detalle.codigo_troquel}</p>
                      </div>
                    )}
                    {ordenDetalle.detalle?.numero_salida && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Número de Salida</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.detalle.numero_salida}</p>
                      </div>
                    )}
                    {ordenDetalle.detalle?.terminado_etiqueta && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Terminado de Etiqueta</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.detalle.terminado_etiqueta}</p>
                      </div>
                    )}
                    {ordenDetalle.detalle?.terminados_especiales && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Terminados Especiales</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.detalle.terminados_especiales}</p>
                      </div>
                    )}
                    {ordenDetalle.detalle?.cantidad_por_rollo && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Cantidad por Rollo</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.detalle.cantidad_por_rollo}</p>
                      </div>
                    )}
                    {ordenDetalle.detalle?.espesor && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Espesor Total (mm)</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.detalle.espesor}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DIGITAL – Observaciones */}
              {(ordenDetalle.detalle?.observaciones || ordenDetalle.notas_observaciones) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaFileAlt className="mr-2 text-green-600" /> Observaciones
                  </h3>
                  <div className="space-y-3">
                    {ordenDetalle.detalle?.observaciones && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <label className="text-sm text-gray-600 block mb-2 font-semibold">Observaciones Generales</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.detalle.observaciones}</p>
                      </div>
                    )}
                    {ordenDetalle.notas_observaciones && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <label className="text-sm text-gray-600 block mb-2 font-semibold">Notas Adicionales</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.notas_observaciones}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* OFFSET – Información del Trabajo */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaClipboardList className="mr-2 text-green-600" /> Información del Trabajo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ordenDetalle.concepto && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-500 block mb-1">Concepto</label>
                      <p className="text-gray-900 font-medium">{ordenDetalle.concepto}</p>
                    </div>
                  )}
                  {ordenDetalle.cantidad && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-500 block mb-1">Cantidad</label>
                      <p className="text-gray-900 font-medium">{ordenDetalle.cantidad}</p>
                    </div>
                  )}
                  {ordenDetalle.detalle?.tamano_abierto_1 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-500 block mb-1">Tamaño Abierto</label>
                      <p className="text-gray-900 font-medium">{ordenDetalle.detalle.tamano_abierto_1}</p>
                    </div>
                  )}
                  {ordenDetalle.detalle?.tamano_cerrado_1 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-500 block mb-1">Tamaño Cerrado</label>
                      <p className="text-gray-900 font-medium">{ordenDetalle.detalle.tamano_cerrado_1}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* OFFSET – Información Técnica */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaClipboardList className="mr-2 text-green-600" /> Información Técnica
                </h3>
                <div className="space-y-4">
                  {(ordenDetalle.detalle?.material || ordenDetalle.detalle?.espesor_material || ordenDetalle.detalle?.corte_material) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {ordenDetalle.detalle?.material && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <label className="text-sm text-gray-500 block mb-1">Material</label>
                          <p className="text-gray-900 font-medium">{ordenDetalle.detalle.material}</p>
                        </div>
                      )}
                      {ordenDetalle.detalle?.espesor_material && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <label className="text-sm text-gray-500 block mb-1">Espesor del Material (mm)</label>
                          <p className="text-gray-900 font-medium">{ordenDetalle.detalle.espesor_material}</p>
                        </div>
                      )}
                      {ordenDetalle.detalle?.corte_material && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <label className="text-sm text-gray-500 block mb-1">Corte de Material</label>
                          <p className="text-gray-900 font-medium">{ordenDetalle.detalle.corte_material}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {(ordenDetalle.detalle?.cantidad_pliegos_compra || ordenDetalle.detalle?.exceso || ordenDetalle.detalle?.total_pliegos) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {ordenDetalle.detalle?.cantidad_pliegos_compra && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <label className="text-sm text-gray-500 block mb-1">Pliegos de Compra</label>
                          <p className="text-gray-900 font-medium">{ordenDetalle.detalle.cantidad_pliegos_compra}</p>
                        </div>
                      )}
                      {ordenDetalle.detalle?.exceso && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <label className="text-sm text-gray-500 block mb-1">Exceso</label>
                          <p className="text-gray-900 font-medium">{ordenDetalle.detalle.exceso}</p>
                        </div>
                      )}
                      {ordenDetalle.detalle?.total_pliegos && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <label className="text-sm text-gray-500 block mb-1">Total Pliegos</label>
                          <p className="text-gray-900 font-medium">{ordenDetalle.detalle.total_pliegos}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {ordenDetalle.detalle?.impresion && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-500 block mb-1">Impresión</label>
                      <p className="text-gray-900 font-medium">{ordenDetalle.detalle.impresion}</p>
                    </div>
                  )}
                  {ordenDetalle.detalle?.instrucciones_impresion && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <label className="text-sm text-gray-600 block mb-2 font-semibold">Instrucciones de Impresión</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.detalle.instrucciones_impresion}</p>
                    </div>
                  )}
                  {ordenDetalle.detalle?.instrucciones_acabados && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <label className="text-sm text-gray-600 block mb-2 font-semibold">Instrucciones de Acabados</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.detalle.instrucciones_acabados}</p>
                    </div>
                  )}
                  {ordenDetalle.detalle?.instrucciones_empacado && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <label className="text-sm text-gray-600 block mb-2 font-semibold">Instrucciones de Empacado</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.detalle.instrucciones_empacado}</p>
                    </div>
                  )}
                  {ordenDetalle.detalle?.prensa_seleccionada && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-500 block mb-1">Prensa Seleccionada</label>
                      <p className="text-gray-900 font-medium">{ordenDetalle.detalle.prensa_seleccionada}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* OFFSET – Observaciones */}
              {(ordenDetalle.detalle?.observaciones || ordenDetalle.notas_observaciones) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaFileAlt className="mr-2 text-green-600" /> Observaciones
                  </h3>
                  <div className="space-y-3">
                    {ordenDetalle.detalle?.observaciones && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <label className="text-sm text-gray-600 block mb-2 font-semibold">Observaciones Generales</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.detalle.observaciones}</p>
                      </div>
                    )}
                    {ordenDetalle.notas_observaciones && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <label className="text-sm text-gray-600 block mb-2 font-semibold">Notas Adicionales</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.notas_observaciones}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── 5. RESPONSABLES DEL PROCESO ── */}
          {(ordenDetalle.vendedor || ordenDetalle.preprensa || ordenDetalle.prensa ||
            ordenDetalle.terminados || ordenDetalle.laminado_barnizado || ordenDetalle.troquelado ||
            ordenDetalle.liberacion_producto || ordenDetalle.facturado) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                <FaClipboardList className="mr-2 text-green-600" /> Responsables del Proceso
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ordenDetalle.vendedor && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <label className="text-xs text-gray-600 block mb-1">Vendedor</label>
                    <p className="text-gray-900 font-medium text-sm">{ordenDetalle.vendedor}</p>
                  </div>
                )}
                {ordenDetalle.preprensa && (
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <label className="text-xs text-gray-600 block mb-1">Pre-prensa</label>
                    <p className="text-gray-900 font-medium text-sm">{ordenDetalle.preprensa}</p>
                  </div>
                )}
                {ordenDetalle.prensa && (
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                    <label className="text-xs text-gray-600 block mb-1">{ordenDetalle.tipo_orden === 'digital' ? 'Impresión' : 'Offset'}</label>
                    <p className="text-gray-900 font-medium text-sm">{ordenDetalle.prensa}</p>
                  </div>
                )}
                {ordenDetalle.laminado_barnizado && (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <label className="text-xs text-gray-600 block mb-1">Laminado/Barnizado</label>
                    <p className="text-gray-900 font-medium text-sm">{ordenDetalle.laminado_barnizado}</p>
                  </div>
                )}
                {ordenDetalle.troquelado && (
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <label className="text-xs text-gray-600 block mb-1">Troquelado</label>
                    <p className="text-gray-900 font-medium text-sm">{ordenDetalle.troquelado}</p>
                  </div>
                )}
                {ordenDetalle.terminados && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <label className="text-xs text-gray-600 block mb-1">Terminados</label>
                    <p className="text-gray-900 font-medium text-sm">{ordenDetalle.terminados}</p>
                  </div>
                )}
                {ordenDetalle.liberacion_producto && (
                  <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                    <label className="text-xs text-gray-600 block mb-1">Liberación Producto</label>
                    <p className="text-gray-900 font-medium text-sm">{ordenDetalle.liberacion_producto}</p>
                  </div>
                )}
                {ordenDetalle.facturado && (
                  <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                    <label className="text-xs text-gray-600 block mb-1">Facturado</label>
                    <p className="text-gray-900 font-medium text-sm">{ordenDetalle.facturado}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 6. AUDITORÍA ── */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
              <FaHistory className="mr-2 text-green-600" /> Auditoría
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <label className="text-sm text-gray-600 block mb-2 font-semibold">Creado por</label>
                <p className="text-gray-900 font-medium mb-1">{ordenDetalle.created_by_nombre || 'Sistema'}</p>
                <p className="text-xs text-gray-500">
                  {ordenDetalle.created_at
                    ? new Date(ordenDetalle.created_at).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
                    : 'N/A'}
                </p>
              </div>
              {ordenDetalle.updated_by_nombre && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="text-sm text-gray-600 block mb-2 font-semibold">Última modificación por</label>
                  <p className="text-gray-900 font-medium mb-1">{ordenDetalle.updated_by_nombre}</p>
                  <p className="text-xs text-gray-500">
                    {ordenDetalle.updated_at
                      ? new Date(ordenDetalle.updated_at).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
                      : 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── BOTONES ── */}
          <div className="flex gap-3 pt-4 border-t">
            {canEdit && (
              <button
                onClick={() => { onClose(); onEdit(ordenDetalle.id); }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <FaEdit /> Editar Orden
              </button>
            )}
            <button
              onClick={() => { onClose(); onViewPDF(ordenDetalle.id); }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <FaEye /> Ver PDF
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <FaTimes /> Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdenDetalleModal;
