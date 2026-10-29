import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalculator, FaCog, FaDollarSign, FaEdit, FaTrash, FaCheckCircle } from 'react-icons/fa';
import {
  obtenerMaterialesDigitales,
  crearMaterialDigital,
  actualizarMaterialDigital,
  eliminarMaterialDigital,
  obtenerProcesosDigitales,
  crearProcesoDigital,
  actualizarProcesoDigital,
  eliminarProcesoDigital,
  obtenerCostosOperativosDigitales,
  crearCostoOperativoDigital,
  actualizarCostoOperativoDigital,
  eliminarCostoOperativoDigital,
  obtenerConfiguracionComercialDigital,
  crearMargenComercial,
  actualizarMargenComercial,
  eliminarMargenComercial,
  crearPlazoComercial,
  actualizarPlazoComercial,
  eliminarPlazoComercial,
} from '../../services/digitalCostosService';

const emptyMaterial = { nombre: '', unidad: 'Metro', costo_unitario: '', estado: 'Activo' };
const emptyProceso = { nombre: '', tipo_cobro: 'metro', precio: '', estado: 'Activo' };
const emptyOperativo = { concepto: '', costo_fijo: '', estado: 'Activo' };
const emptyMargen = { nombre: '', porcentaje: '', activo: true, orden: 1 };
const emptyPlazo = { nombre: '', dias: '', recargo_porcentaje: '', activo: true, orden: 1 };

const ParametrosCostos = () => {
  const navigate = useNavigate();
  const [modalAbierto, setModalAbierto] = useState(true);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [activeTab, setActiveTab] = useState('materiales');

  const [materiales, setMateriales] = useState([]);
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [materialEditId, setMaterialEditId] = useState(null);

  const [procesos, setProcesos] = useState([]);
  const [procesoForm, setProcesoForm] = useState(emptyProceso);
  const [procesoEditId, setProcesoEditId] = useState(null);

  const [operativos, setOperativos] = useState([]);
  const [operativoForm, setOperativoForm] = useState(emptyOperativo);
  const [operativoEditId, setOperativoEditId] = useState(null);

  const [margenes, setMargenes] = useState([]);
  const [plazos, setPlazos] = useState([]);
  const [margenForm, setMargenForm] = useState(emptyMargen);
  const [plazoForm, setPlazoForm] = useState(emptyPlazo);
  const [margenEditId, setMargenEditId] = useState(null);
  const [plazoEditId, setPlazoEditId] = useState(null);

  useEffect(() => {
    const cargarDigital = async () => {
      try {
        const [materialesData, procesosData, operativosData, configData] = await Promise.all([
          obtenerMaterialesDigitales(),
          obtenerProcesosDigitales(),
          obtenerCostosOperativosDigitales(),
          obtenerConfiguracionComercialDigital(),
        ]);

        setMateriales(materialesData);
        setProcesos(procesosData);
        setOperativos(operativosData);
        setMargenes(configData?.margenes || []);
        setPlazos(configData?.plazos || []);
      } catch (error) {
        console.error('Error cargando parámetros digitales:', error);
      }
    };

    if (tipoSeleccionado === 'digital' || tipoSeleccionado === 'comercial') {
      cargarDigital();
    }
  }, [tipoSeleccionado]);

  const handleSelectTipo = (tipo) => {
    setTipoSeleccionado(tipo);
    setModalAbierto(false);
  };

  const handleCancel = () => {
    setModalAbierto(false);
    navigate('/administracion');
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!materialForm.nombre.trim()) return;

    try {
      if (materialEditId) {
        const updated = await actualizarMaterialDigital(Number(materialEditId), {
          nombre: materialForm.nombre,
          unidad: materialForm.unidad,
          costo_unitario: Number(materialForm.costo_unitario),
          estado: materialForm.estado,
        });
        setMateriales((prev) => prev.map((item) => item.id === materialEditId ? updated : item));
        setMaterialEditId(null);
      } else {
        const created = await crearMaterialDigital({
          nombre: materialForm.nombre,
          unidad: materialForm.unidad,
          costo_unitario: Number(materialForm.costo_unitario),
          estado: materialForm.estado,
        });
        setMateriales((prev) => [...prev, created]);
      }
      setMaterialForm(emptyMaterial);
    } catch (error) {
      console.error('Error guardando material:', error);
    }
  };

  const handleProcesoSubmit = async (e) => {
    e.preventDefault();
    if (!procesoForm.nombre.trim()) return;

    try {
      if (procesoEditId) {
        const updated = await actualizarProcesoDigital(Number(procesoEditId), {
          nombre: procesoForm.nombre,
          tipo_cobro: procesoForm.tipo_cobro,
          precio: Number(procesoForm.precio),
          estado: procesoForm.estado,
        });
        setProcesos((prev) => prev.map((item) => item.id === procesoEditId ? updated : item));
        setProcesoEditId(null);
      } else {
        const created = await crearProcesoDigital({
          nombre: procesoForm.nombre,
          tipo_cobro: procesoForm.tipo_cobro,
          precio: Number(procesoForm.precio),
          estado: procesoForm.estado,
        });
        setProcesos((prev) => [...prev, created]);
      }
      setProcesoForm(emptyProceso);
    } catch (error) {
      console.error('Error guardando proceso:', error);
    }
  };

  const handleOperativoSubmit = async (e) => {
    e.preventDefault();
    if (!operativoForm.concepto.trim()) return;

    try {
      if (operativoEditId) {
        const updated = await actualizarCostoOperativoDigital(Number(operativoEditId), {
          concepto: operativoForm.concepto,
          costo_fijo: Number(operativoForm.costo_fijo),
          estado: operativoForm.estado,
        });
        setOperativos((prev) => prev.map((item) => item.id === operativoEditId ? updated : item));
        setOperativoEditId(null);
      } else {
        const created = await crearCostoOperativoDigital({
          concepto: operativoForm.concepto,
          costo_fijo: Number(operativoForm.costo_fijo),
          estado: operativoForm.estado,
        });
        setOperativos((prev) => [...prev, created]);
      }
      setOperativoForm(emptyOperativo);
    } catch (error) {
      console.error('Error guardando costo operativo:', error);
    }
  };

  const handleMargenSubmit = async (e) => {
    e.preventDefault();
    if (!margenForm.nombre.trim()) return;

    try {
      const config = await obtenerConfiguracionComercialDigital();
      const configId = config?.configuracion?.id;
      if (!configId) return;

      if (margenEditId) {
        const updated = await actualizarMargenComercial(Number(margenEditId), {
          nombre: margenForm.nombre,
          porcentaje: Number(margenForm.porcentaje),
          activo: margenForm.activo,
          orden: Number(margenForm.orden),
        });
        setMargenes((prev) => prev.map((item) => item.id === margenEditId ? updated : item));
        setMargenEditId(null);
      } else {
        const created = await crearMargenComercial({
          configuracion_comercial_id: configId,
          nombre: margenForm.nombre,
          porcentaje: Number(margenForm.porcentaje),
          activo: margenForm.activo,
          orden: Number(margenForm.orden),
        });
        setMargenes((prev) => [...prev, created]);
      }
      setMargenForm(emptyMargen);
    } catch (error) {
      console.error('Error guardando margen:', error);
    }
  };

  const handlePlazoSubmit = async (e) => {
    e.preventDefault();
    if (!plazoForm.nombre.trim()) return;

    try {
      const config = await obtenerConfiguracionComercialDigital();
      const configId = config?.configuracion?.id;
      if (!configId) return;

      if (plazoEditId) {
        const updated = await actualizarPlazoComercial(Number(plazoEditId), {
          nombre: plazoForm.nombre,
          dias: Number(plazoForm.dias),
          recargo_porcentaje: Number(plazoForm.recargo_porcentaje),
          activo: plazoForm.activo,
          orden: Number(plazoForm.orden),
        });
        setPlazos((prev) => prev.map((item) => item.id === plazoEditId ? updated : item));
        setPlazoEditId(null);
      } else {
        const created = await crearPlazoComercial({
          configuracion_comercial_id: configId,
          nombre: plazoForm.nombre,
          dias: Number(plazoForm.dias),
          recargo_porcentaje: Number(plazoForm.recargo_porcentaje),
          activo: plazoForm.activo,
          orden: Number(plazoForm.orden),
        });
        setPlazos((prev) => [...prev, created]);
      }
      setPlazoForm(emptyPlazo);
    } catch (error) {
      console.error('Error guardando plazo:', error);
    }
  };

  const renderMaterialesTab = () => (
    <div className="grid xl:grid-cols-[380px_1fr] gap-6">
      <form onSubmit={handleMaterialSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {materialEditId ? 'Editar material' : 'Nuevo material / sustrato'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del material</label>
            <input
              type="text"
              value={materialForm.nombre}
              onChange={(e) => setMaterialForm({ ...materialForm, nombre: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ej: Polipropileno Metalizado P1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <input
                type="text"
                value={materialForm.unidad}
                onChange={(e) => setMaterialForm({ ...materialForm, unidad: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo por unidad ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={materialForm.costo_unitario}
                onChange={(e) => setMaterialForm({ ...materialForm, costo_unitario: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0.40"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={materialForm.estado}
              onChange={(e) => setMaterialForm({ ...materialForm, estado: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg">
              {materialEditId ? 'Guardar cambios' : 'Agregar material'}
            </button>
            {materialEditId && (
              <button
                type="button"
                onClick={() => {
                  setMaterialEditId(null);
                  setMaterialForm(emptyMaterial);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 px-4 rounded-lg"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Materiales registrados</h3>
          <span className="text-sm text-slate-600">{materiales.length} items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Nombre</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Unidad</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Costo</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materiales.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 text-gray-800">{item.nombre}</td>
                  <td className="px-4 py-3 text-gray-700">{item.unidad}</td>
                  <td className="px-4 py-3 text-gray-700">${Number(item.costo_unitario || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${item.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMaterialEditId(item.id);
                          setMaterialForm({
                            nombre: item.nombre,
                            unidad: item.unidad,
                            costo_unitario: item.costo_unitario,
                            estado: item.estado,
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await eliminarMaterialDigital(item.id);
                          setMateriales((prev) => prev.filter((i) => i.id !== item.id));
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProcesosTab = () => (
    <div className="grid xl:grid-cols-[380px_1fr] gap-6">
      <form onSubmit={handleProcesoSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {procesoEditId ? 'Editar proceso / insumo' : 'Nuevo proceso o insumo'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del proceso o insumo</label>
            <input
              type="text"
              value={procesoForm.nombre}
              onChange={(e) => setProcesoForm({ ...procesoForm, nombre: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ej: Barniz Brillante"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cobro</label>
            <select
              value={procesoForm.tipo_cobro}
              onChange={(e) => setProcesoForm({ ...procesoForm, tipo_cobro: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="metro">Por Metro</option>
              <option value="fijo">Costo Fijo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={procesoForm.precio}
              onChange={(e) => setProcesoForm({ ...procesoForm, precio: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0.25"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={procesoForm.estado}
              onChange={(e) => setProcesoForm({ ...procesoForm, estado: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg">
              {procesoEditId ? 'Guardar cambios' : 'Agregar proceso'}
            </button>
            {procesoEditId && (
              <button
                type="button"
                onClick={() => {
                  setProcesoEditId(null);
                  setProcesoForm(emptyProceso);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 px-4 rounded-lg"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Procesos y acabados</h3>
          <span className="text-sm text-slate-600">{procesos.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Nombre</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Tipo</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Precio</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {procesos.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 text-gray-800">{item.nombre}</td>
                  <td className="px-4 py-3 text-gray-700">{item.tipo_cobro}</td>
                  <td className="px-4 py-3 text-gray-700">${Number(item.precio).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${item.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProcesoEditId(item.id);
                          setProcesoForm({
                            nombre: item.nombre,
                            tipo_cobro: item.tipo_cobro,
                            precio: item.precio,
                            estado: item.estado,
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await eliminarProcesoDigital(item.id);
                          setProcesos((prev) => prev.filter((i) => i.id !== item.id));
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOperativosTab = () => (
    <div className="grid xl:grid-cols-[380px_1fr] gap-6">
      <form onSubmit={handleOperativoSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {operativoEditId ? 'Editar costo operativo' : 'Nuevo costo operativo'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del concepto</label>
            <input
              type="text"
              value={operativoForm.concepto}
              onChange={(e) => setOperativoForm({ ...operativoForm, concepto: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ej: Arranque - Costo Fijo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo fijo ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={operativoForm.costo_fijo}
              onChange={(e) => setOperativoForm({ ...operativoForm, costo_fijo: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="20.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={operativoForm.estado}
              onChange={(e) => setOperativoForm({ ...operativoForm, estado: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg">
              {operativoEditId ? 'Guardar cambios' : 'Agregar concepto'}
            </button>
            {operativoEditId && (
              <button
                type="button"
                onClick={() => {
                  setOperativoEditId(null);
                  setOperativoForm(emptyOperativo);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 px-4 rounded-lg"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Costos operativos y fijos</h3>
          <span className="text-sm text-slate-600">{operativos.length} conceptos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Concepto</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Costo fijo</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {operativos.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 text-gray-800">{item.concepto}</td>
                  <td className="px-4 py-3 text-gray-700">${Number(item.costo_fijo || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${item.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOperativoEditId(item.id);
                          setOperativoForm({
                            concepto: item.concepto,
                            costo_fijo: item.costo_fijo,
                            estado: item.estado,
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await eliminarCostoOperativoDigital(item.id);
                          setOperativos((prev) => prev.filter((i) => i.id !== item.id));
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'materiales', label: 'Materiales / Papeles', icon: <FaCog /> },
    { id: 'procesos', label: 'Impresión y Acabados', icon: <FaCalculator /> },
    { id: 'operativos', label: 'Costos Operativos y Fijos', icon: <FaDollarSign /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-gray-800">Selecciona el tipo de costo</h2>
              <p className="text-gray-600 mt-2">
                Elige la modalidad de cotización que deseas configurar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSelectTipo('offset')}
                className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl p-5 text-left transition-colors shadow-sm"
              >
                <div className="text-lg font-bold mb-1">Offset</div>
                <div className="text-sm opacity-90">Papeles, tintas y procesos de impresión.</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTipo('digital')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl p-5 text-left transition-colors shadow-sm"
              >
                <div className="text-lg font-bold mb-1">Digital</div>
                <div className="text-sm opacity-90">Impresión digital y tiempos de producción.</div>
              </button>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setTipoSeleccionado('comercial');
                  setModalAbierto(false);
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl p-4 text-left transition-colors shadow-sm"
              >
                <div className="text-lg font-bold mb-1">Configuración comercial</div>
                <div className="text-sm opacity-90">Márgenes y plazos de crédito para el cotizador.</div>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Parámetros de Costos</h1>
          <p className="text-gray-600 mt-1">
            {tipoSeleccionado
              ? `Configuración activa: ${tipoSeleccionado === 'offset' ? 'Offset' : 'Digital'}`
              : 'Configura los valores base para la calculadora de cotizaciones.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {tipoSeleccionado && (
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
              Cambiar tipo
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/administracion')}
            className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <FaArrowLeft />
            Volver
          </button>
        </div>
      </div>

      {tipoSeleccionado === 'digital' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5">
            <div className="flex items-center gap-3 text-white">
              <div className="bg-white/15 rounded-full p-3">
                <FaCalculator className="text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Área Digital</h2>
                <p className="text-emerald-50 text-sm">Administración de materiales, procesos y costos operativos</p>
              </div>
            </div>
          </div>

          <div className="p-5 border-b border-slate-200">
            <div className="flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'materiales' && renderMaterialesTab()}
            {activeTab === 'procesos' && renderProcesosTab()}
            {activeTab === 'operativos' && renderOperativosTab()}
          </div>
        </div>
      ) : tipoSeleccionado === 'comercial' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5">
            <div className="flex items-center gap-3 text-white">
              <div className="bg-white/15 rounded-full p-3">
                <FaDollarSign className="text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Configuración Comercial</h2>
                <p className="text-amber-50 text-sm">Márgenes y plazos de crédito del cotizador</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid xl:grid-cols-2 gap-6">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h3 className="text-lg font-bold text-amber-800 mb-3">Márgenes</h3>
                <p className="text-sm text-amber-700 mb-4">
                  Define los porcentajes de utilidad que aplicará el cotizador.
                </p>

                <form onSubmit={handleMargenSubmit} className="space-y-3 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={margenForm.nombre}
                      onChange={(e) => setMargenForm({ ...margenForm, nombre: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      placeholder="Ej: Margen base"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje</label>
                      <input
                        type="number"
                        step="0.01"
                        value={margenForm.porcentaje}
                        onChange={(e) => setMargenForm({ ...margenForm, porcentaje: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="33"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                      <input
                        type="number"
                        value={margenForm.orden}
                        onChange={(e) => setMargenForm({ ...margenForm, orden: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={margenForm.activo}
                      onChange={(e) => setMargenForm({ ...margenForm, activo: e.target.checked })}
                    />
                    Activo
                  </div>

                  <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-lg py-2.5 font-semibold">
                    {margenEditId ? 'Guardar margen' : 'Agregar margen'}
                  </button>
                </form>

                <div className="space-y-3">
                  {margenes.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay márgenes registrados.</p>
                  ) : margenes.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-amber-200">
                      <div>
                        <div className="font-semibold text-gray-800">{item.nombre}</div>
                        <div className="text-xs text-gray-500">{item.activo ? 'Activo' : 'Inactivo'}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-800">{Number(item.porcentaje).toFixed(2)}%</span>
                        <button type="button" onClick={() => { setMargenEditId(item.id); setMargenForm({ nombre: item.nombre, porcentaje: item.porcentaje, activo: item.activo, orden: item.orden }); }} className="text-blue-600"><FaEdit /></button>
                        <button type="button" onClick={async () => { await eliminarMargenComercial(item.id); setMargenes((prev) => prev.filter((x) => x.id !== item.id)); }} className="text-red-600"><FaTrash /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <h3 className="text-lg font-bold text-slate-800 mb-3">Plazos de crédito</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Define los incrementos por días de crédito del cliente.
                </p>

                <form onSubmit={handlePlazoSubmit} className="space-y-3 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={plazoForm.nombre}
                      onChange={(e) => setPlazoForm({ ...plazoForm, nombre: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      placeholder="Ej: 60 días"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Días</label>
                      <input
                        type="number"
                        value={plazoForm.dias}
                        onChange={(e) => setPlazoForm({ ...plazoForm, dias: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="60"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recargo %</label>
                      <input
                        type="number"
                        step="0.01"
                        value={plazoForm.recargo_porcentaje}
                        onChange={(e) => setPlazoForm({ ...plazoForm, recargo_porcentaje: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                      <input
                        type="number"
                        value={plazoForm.orden}
                        onChange={(e) => setPlazoForm({ ...plazoForm, orden: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="1"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 pt-7">
                      <input
                        type="checkbox"
                        checked={plazoForm.activo}
                        onChange={(e) => setPlazoForm({ ...plazoForm, activo: e.target.checked })}
                      />
                      Activo
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-slate-700 hover:bg-slate-800 text-white rounded-lg py-2.5 font-semibold">
                    {plazoEditId ? 'Guardar plazo' : 'Agregar plazo'}
                  </button>
                </form>

                <div className="space-y-3">
                  {plazos.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay plazos registrados.</p>
                  ) : plazos.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-slate-200">
                      <div>
                        <div className="font-semibold text-gray-800">{item.nombre}</div>
                        <div className="text-xs text-gray-500">{item.activo ? 'Activo' : 'Inactivo'}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-800">{item.dias} días / +{Number(item.recargo_porcentaje).toFixed(2)}%</span>
                        <button type="button" onClick={() => { setPlazoEditId(item.id); setPlazoForm({ nombre: item.nombre, dias: item.dias, recargo_porcentaje: item.recargo_porcentaje, activo: item.activo, orden: item.orden }); }} className="text-blue-600"><FaEdit /></button>
                        <button type="button" onClick={async () => { await eliminarPlazoComercial(item.id); setPlazos((prev) => prev.filter((x) => x.id !== item.id)); }} className="text-red-600"><FaTrash /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 border border-dashed border-amber-300 bg-amber-50 rounded-2xl p-5">
              <p className="text-sm text-amber-800">
                <strong>Nota:</strong> esta sección no pertenece al CRUD de insumos, sino a la configuración comercial global del cotizador para que aplique márgenes y plazos de crédito automáticamente al precio final.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-5">
            <div className="flex items-center gap-3 text-white">
              <div className="bg-white/15 rounded-full p-3">
                <FaCalculator className="text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Área Offset</h2>
                <p className="text-sky-50 text-sm">Configuración pendiente de implementación</p>
              </div>
            </div>
          </div>

          <div className="p-8 text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-sky-100 text-sky-600 mx-auto mb-4">
              <FaCheckCircle className="text-3xl" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Offset en desarrollo</h3>
            <p className="text-gray-600 max-w-xl mx-auto">
              La interfaz específica de Offset se implementará más adelante. Por ahora se está trabajando la estructura y el CRUD para Digital.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParametrosCostos;
