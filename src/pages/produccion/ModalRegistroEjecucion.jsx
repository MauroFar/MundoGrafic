import React, { useState, useEffect } from 'react';

const apiUrl = import.meta.env.VITE_API_URL;

// Campos dinámicos por etapa
const camposPorEtapa = {
  en_preprensa: [
    { key: 'prueba_color',        label: 'Prueba de color aprobada',  type: 'checkbox' },
    { key: 'aprobado_por',        label: 'Aprobado por',              type: 'text' },
  ],
  en_prensa: [
    { key: 'maquina',             label: 'Máquina',                   type: 'text' },
    { key: 'tiraje_programado',   label: 'Tiraje programado',         type: 'number' },
    { key: 'tiraje_real',         label: 'Tiraje real',               type: 'number' },
    { key: 'tipo_tinta',          label: 'Tipo de tinta',             type: 'text' },
    { key: 'sustrato',            label: 'Sustrato / papel',          type: 'text' },
    { key: 'gramaje',             label: 'Gramaje (g/m²)',            type: 'text' },
  ],
  laminado: [
    { key: 'maquina',             label: 'Máquina',                   type: 'text' },
    { key: 'tipo_laminado',       label: 'Tipo de laminado / barniz', type: 'text' },
    { key: 'lote_barnizado',      label: 'Lote barnizado',            type: 'text' },
    { key: 'velocidad',           label: 'Velocidad (m/min)',         type: 'text' },
  ],
  troquelado: [
    { key: 'maquina',             label: 'Máquina',                   type: 'text' },
    { key: 'troquel_ref',         label: 'Referencia del troquel',    type: 'text' },
    { key: 'muestra_aprobada',    label: 'Muestra física aprobada',   type: 'checkbox' },
  ],
  terminados: [
    { key: 'tipo_acabado',        label: 'Tipo de acabado',           type: 'text' },
    { key: 'cantidad_procesada',  label: 'Cantidad procesada',        type: 'number' },
    { key: 'cantidad_revisada',   label: 'Cantidad revisada',         type: 'number' },
    { key: 'tipo_empaque',        label: 'Tipo de empaque',           type: 'text' },
  ],
};

const camposComunes = [
  { key: 'operario',          label: 'Operario responsable',  type: 'text',   required: true },
  { key: 'cantidad_recibida', label: 'Cantidad recibida',     type: 'number' },
  { key: 'cantidad_entregada',label: 'Cantidad entregada',    type: 'number' },
];

const camposCierre = [
  { key: 'reproceso',       label: '¿Hubo reproceso?',       type: 'checkbox' },
  { key: 'motivo_reproceso',label: 'Motivo del reproceso',   type: 'textarea', conditional: 'reproceso' },
  { key: 'observaciones',   label: 'Observaciones',          type: 'textarea' },
];

const valorInicial = (campos) => {
  const obj = {};
  campos.forEach((c) => { obj[c.key] = c.type === 'checkbox' ? false : ''; });
  return obj;
};

const ahoraFecha = () => new Date().toISOString().slice(0, 10);
const ahoraHora  = () => new Date().toTimeString().slice(0, 5);

const etiquetaEtapa = (etapaId) => {
  const mapa = {
    en_preprensa: 'Preprensa',
    en_prensa:    'Prensa / Impresión',
    laminado:     'Laminado / Barnizado',
    troquelado:   'Troquelado',
    terminados:   'Terminados / Acabados',
  };
  return mapa[etapaId] || etapaId;
};

const ModalRegistroEjecucion = ({ orden, etapa, onConfirmar, onCancelar, fechaInicioEtapa, horaInicioEtapa, cantidadRecibida }) => {
  const camposEtapa     = camposPorEtapa[etapa?.id] || [];
  const todosLosCampos  = [...camposComunes, ...camposEtapa, ...camposCierre];

  const [form, setForm] = useState(() => {
    const base = valorInicial(todosLosCampos);
    return {
      ...base,
      fecha_inicio:      fechaInicioEtapa || ahoraFecha(),
      hora_inicio:       horaInicioEtapa  || ahoraHora(),
      cantidad_recibida: cantidadRecibida || '',
    };
  });

  // recargar si cambia la etapa o los timestamps
  useEffect(() => {
    const base = valorInicial(todosLosCampos);
    setForm({
      ...base,
      fecha_inicio:      fechaInicioEtapa || ahoraFecha(),
      hora_inicio:       horaInicioEtapa  || ahoraHora(),
      cantidad_recibida: cantidadRecibida || '',
    });
    // eslint-disable-next-line
  }, [etapa?.id, fechaInicioEtapa, horaInicioEtapa, cantidadRecibida]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleGuardar = async () => {
    if (!form.operario?.trim()) {
      alert('El campo "Operario responsable" es obligatorio.');
      return;
    }

    // Separar campos comunes de campos específicos de la etapa
    const camposEtapaKeys = new Set((camposPorEtapa[etapa?.id] || []).map((c) => c.key));
    const datos_etapa = {};
    const body = {
      etapa_id:          etapa.id,
      etapa_titulo:      etapa.titulo,
      operario:          form.operario,
      fecha_inicio:      form.fecha_inicio || null,
      hora_inicio:       form.hora_inicio  || null,
      fecha_fin:         null,
      hora_fin:          null,
      reproceso:         !!form.reproceso,
      motivo_reproceso:  form.reproceso ? (form.motivo_reproceso || null) : null,
      observaciones:     form.observaciones || null,
    };
    // Guardar cantidades en datos_etapa (JSONB) para no requerir migración
    datos_etapa.cantidad_recibida  = form.cantidad_recibida  || null;
    datos_etapa.cantidad_entregada = form.cantidad_entregada || null;
    camposEtapaKeys.forEach((k) => { datos_etapa[k] = form[k]; });
    body.datos_etapa = datos_etapa;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/${orden.id}/ejecucion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar');
      }
      const data = await res.json();
      onConfirmar(data.ejecucion, form.cantidad_entregada || null);
    } catch (e) {
      console.error('Error guardando registro de ejecución:', e);
      alert(`No se pudo guardar el registro: ${e.message}`);
    }
  };

  const renderCampo = (campo) => {
    // campos condicionales: solo se muestran si el campo padre es true
    if (campo.conditional && !form[campo.conditional]) return null;

    const valor = form[campo.key];

    if (campo.type === 'checkbox') {
      return (
        <div key={campo.key} className="flex items-center gap-2">
          <input
            id={campo.key}
            type="checkbox"
            checked={!!valor}
            onChange={(e) => set(campo.key, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <label htmlFor={campo.key} className="text-sm text-gray-700">{campo.label}</label>
        </div>
      );
    }

    if (campo.type === 'textarea') {
      return (
        <div key={campo.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {campo.label}
          </label>
          <textarea
            rows={2}
            value={valor}
            onChange={(e) => set(campo.key, e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>
      );
    }

    return (
      <div key={campo.key}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {campo.label}{campo.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type={campo.type}
          value={valor}
          onChange={(e) => set(campo.key, e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Registro de ejecución</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {etiquetaEtapa(etapa?.id)} — OT #{orden?.numero_orden} · {orden?.nombre_cliente}
            </p>
          </div>
          <button
            onClick={onCancelar}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* Sección: datos de la orden (solo lectura) */}
          {(orden?.material || orden?.lote_material || orden?.lote_produccion) && (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos de la orden</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Material</label>
                  <div className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
                    {orden?.material || <span className="text-gray-400 italic">No registrado</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Lote material</label>
                  <div className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
                    {orden?.lote_material || <span className="text-gray-400 italic">No registrado</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Lote producción</label>
                  <div className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
                    {orden?.lote_produccion || <span className="text-gray-400 italic">No registrado</span>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Sección: tiempos de la etapa (read-only, vienen del modal de confirmación) */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiempos de la etapa</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Fecha inicio
                {fechaInicioEtapa && <span className="ml-1 text-green-600 font-normal">(auto)</span>}
              </label>
              {fechaInicioEtapa ? (
                <div className="w-full rounded border border-green-200 bg-green-50 px-3 py-1.5 text-sm text-gray-700 font-mono">
                  {form.fecha_inicio}
                </div>
              ) : (
                <input type="date" value={form.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Hora inicio
                {horaInicioEtapa && <span className="ml-1 text-green-600 font-normal">(auto)</span>}
              </label>
              {horaInicioEtapa ? (
                <div className="w-full rounded border border-green-200 bg-green-50 px-3 py-1.5 text-sm text-gray-700 font-mono">
                  {form.hora_inicio}
                </div>
              ) : (
                <input type="time" value={form.hora_inicio} onChange={(e) => set('hora_inicio', e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              )}
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400 italic">
                La fecha y hora de fin se registran automáticamente al confirmar el envío al siguiente proceso.
              </p>
            </div>
          </div>

          {/* Sección: datos generales */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos generales</p>
          <div className="grid grid-cols-2 gap-3">
            {camposComunes.map(renderCampo)}
          </div>

          {/* Sección: datos de la etapa */}
          {camposEtapa.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">
                Datos de {etiquetaEtapa(etapa?.id)}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {camposEtapa.map(renderCampo)}
              </div>
            </>
          )}

          {/* Sección: cierre */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Cierre y observaciones</p>
          <div className="space-y-3">
            {camposCierre.map(renderCampo)}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
          <button
            onClick={onCancelar}
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="rounded bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
          >
            Guardar y enviar a calidad
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistroEjecucion;
