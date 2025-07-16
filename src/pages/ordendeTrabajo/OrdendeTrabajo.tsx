import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../components/Logo";
import "../../styles/ordenTrabajo/OrdenTrabajo.css";

// Tipos para los datos de la orden
interface OrdenData {
  concepto?: string;
  nombre_cliente?: string;
  numero_cotizacion?: string;
  telefono_cliente?: string;
  email_cliente?: string;
  direccion_cliente?: string;
  cantidad?: string;
  numero_orden?: string;
  // Puedes agregar más campos según lo que devuelva tu backend
  detalle?: any;
  telefono?: string;
  email?: string;
  contacto?: string;
  fecha_entrega?: string; // Nuevo campo para la fecha de entrega
}

// Tipos para los parámetros de la URL
// interface Params {
//   cotizacionId?: string;
//   ordenId?: string;
// }

// Declaración global para ImportMetaEnv (Vite)
declare global {
  interface ImportMeta {
    env: {
      VITE_API_URL: string;
      [key: string]: any;
    };
  }
}

const OrdendeTrabajoEditar: React.FC = () => {
  
  const [concepto, setConcepto] = useState<string>('');
  const [nombre_cliente, setNombre_cliente] = useState<string>('');
  const [numero_cotizacion, setNumero_cotizacion] = useState<string>('');
  const [ordenData, setOrdenData] = useState<OrdenData | null>(null);
  const [fechaCreacion, setFechaCreacion] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [telefono_cliente, setTelefono_cliente] = useState<string>('');
  const [email_cliente, setEmail_cliente] = useState<string>('');
  const [direccion_cliente, setDireccion_cliente] = useState<string>('');
  const [cantidad, setCantidad] = useState<string>('');
  const [numero_orden, setNumero_orden] = useState<string>('');

  // Estados para los campos técnicos (ejemplo, agrega todos los que necesites)
  const [tipoPapelProveedor, setTipoPapelProveedor] = useState('');
  const [tipoPapelPrensa, setTipoPapelPrensa] = useState('');
  const [tipoPapelVelocidad, setTipoPapelVelocidad] = useState('');
  const [tipoPapelCalibre, setTipoPapelCalibre] = useState('');
  const [tipoPapelReferencia, setTipoPapelReferencia] = useState('');
  const [tipoPapelGramos, setTipoPapelGramos] = useState('');
  const [tipoPapelTamano, setTipoPapelTamano] = useState('');
  const [tipoPapelCantColores, setTipoPapelCantColores] = useState('');
  const [tipoPapelCantPliegos, setTipoPapelCantPliegos] = useState('');
  const [tipoPapelExceso, setTipoPapelExceso] = useState('');
  const [guillotinaPliegosCortar, setGuillotinaPliegosCortar] = useState('');
  const [guillotinaTamanoCorte, setGuillotinaTamanoCorte] = useState('');
  const [guillotinaCabidaCorte, setGuillotinaCabidaCorte] = useState('');
  const [prensasPliegosImprimir, setPrensasPliegosImprimir] = useState('');
  const [prensasCabidaImpresion, setPrensasCabidaImpresion] = useState('');
  const [prensasTotalImpresion, setPrensasTotalImpresion] = useState('');
  // Estados adicionales generales
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [estado, setEstado] = useState('');
  const [notasObservaciones, setNotasObservaciones] = useState('');
  const [vendedor, setVendedor] = useState('');
  const [preprensa, setPreprensa] = useState('');
  const [prensa, setPrensa] = useState('');
  const [terminados, setTerminados] = useState('');
  const [facturado, setFacturado] = useState('');

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [ordenGuardadaNumero, setOrdenGuardadaNumero] = useState<string | null>(null);
  const [idDetalleCotizacion, setIdDetalleCotizacion] = useState<number | null>(null);

  const { cotizacionId, ordenId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();


  const apiUrl = import.meta.env.VITE_API_URL;

  // Detectar si hay cotizacionId o no para saber qué hacer
  useEffect(() => {
    // Si estamos en /ordendeTrabajo/crear (sin cotizacionId ni ordenId), limpiar todos los estados
    if (!cotizacionId && !ordenId) {
      setConcepto('');
      setCantidad('');
      setNombre_cliente('');
      setNumero_cotizacion('');
      setTelefono_cliente('');
      setEmail_cliente('');
      setDireccion_cliente('');
      setNumero_orden('');
      setTipoPapelProveedor('');
      setTipoPapelPrensa('');
      setTipoPapelVelocidad('');
      setTipoPapelCalibre('');
      setTipoPapelReferencia('');
      setTipoPapelGramos('');
      setTipoPapelTamano('');
      setTipoPapelCantColores('');
      setTipoPapelCantPliegos('');
      setTipoPapelExceso('');
      setGuillotinaPliegosCortar('');
      setGuillotinaTamanoCorte('');
      setGuillotinaCabidaCorte('');
      setPrensasPliegosImprimir('');
      setPrensasCabidaImpresion('');
      setPrensasTotalImpresion('');
      setFechaEntrega('');
      setEstado('');
      setNotasObservaciones('');
      setVendedor('');
      setPreprensa('');
      setPrensa('');
      setTerminados('');
      setFacturado('');
      setOrdenData(null);
      setIdDetalleCotizacion(null);
      // Obtener el próximo número de orden
      fetch(`${apiUrl}/api/ordenTrabajo/proximoNumero`)
        .then(res => res.json())
        .then(data => setNumero_orden(data.proximoNumero))
        .catch(() => setNumero_orden(''));
      return;
    }
    // Si viene producto por state, inicializar con ese producto
    if (!ordenId && location.state && location.state.producto) {
      const producto = location.state.producto;
      setConcepto(producto.detalle || '');
      setCantidad(producto.cantidad ? String(producto.cantidad) : '');
      if (location.state.id_detalle_cotizacion) {
        setIdDetalleCotizacion(location.state.id_detalle_cotizacion);
      }
      // Si quieres inicializar más campos, agrégalos aquí
      // Los datos del cliente y cotización se pueden seguir trayendo por fetch
      fetch(`${apiUrl}/api/ordenTrabajo/datosCotizacion/${cotizacionId}`)
        .then((response) => response.json())
        .then((data) => {
          setOrdenData(data);
          setNombre_cliente(data.nombre_cliente || '');
          setNumero_cotizacion(data.numero_cotizacion || '');
          setTelefono_cliente(data.telefono_cliente || '');
          setEmail_cliente(data.email_cliente || '');
          setDireccion_cliente(data.direccion_cliente || '');
        })
        .catch((error) => console.error("Error fetching data:", error));
    } else if(ordenId){
      // Modo edición: cargar datos de una orden existente
      fetch(`${apiUrl}/api/ordenTrabajo/orden/${ordenId}`)
        .then((res) => res.json())
        .then((data) => setOrdenData(data))
        .catch((error) => console.error("Error al cargar orden existente:", error));
    } else if (cotizacionId) {
      // Si hay cotización, traemos datos del backend
      fetch(`${apiUrl}/api/ordenTrabajo/datosCotizacion/${cotizacionId}`)
        .then((response) => response.json())
        .then((data) => setOrdenData(data))
        .catch((error) => console.error("Error fetching data:", error));
    } else {
      // Si no hay cotización, inicializar estados vacíos para crear orden nueva
      setOrdenData(null);
      setConcepto('');
      setNombre_cliente('');
      setNumero_cotizacion('');
    }
  }, [cotizacionId, ordenId, location.state]);

  // Sincronizar estados individuales con ordenData cuando cambia
useEffect(() => {
  // Si hay producto seleccionado por state, no sobrescribir concepto/cantidad
  const productoSeleccionado = location.state && location.state.producto;
  if (ordenData) {
    if (!productoSeleccionado) {
      setConcepto(ordenData.concepto || '');
      setCantidad(ordenData.cantidad || '');
      // Solo si no hay producto seleccionado, sincroniza los campos técnicos
      if (ordenData.detalle) {
        setTipoPapelProveedor(ordenData.detalle?.tipo_papel_proveedor || '');
        setTipoPapelPrensa(ordenData.detalle?.tipo_papel_prensa || '');
        setTipoPapelVelocidad(ordenData.detalle?.tipo_papel_velocidad || '');
        setTipoPapelCalibre(ordenData.detalle?.tipo_papel_calibre || '');
        setTipoPapelReferencia(ordenData.detalle?.tipo_papel_referencia || '');
        setTipoPapelGramos(ordenData.detalle?.tipo_papel_gramos || '');
        setTipoPapelTamano(ordenData.detalle?.tipo_papel_tamano || '');
        setTipoPapelCantColores(ordenData.detalle?.tipo_papel_cant_colores || '');
        setTipoPapelCantPliegos(ordenData.detalle?.tipo_papel_cant_pliegos || '');
        setTipoPapelExceso(ordenData.detalle?.tipo_papel_exceso || '');
        setGuillotinaPliegosCortar(ordenData.detalle?.guillotina_pliegos_cortar || '');
        setGuillotinaTamanoCorte(ordenData.detalle?.guillotina_tamano_corte || '');
        setGuillotinaCabidaCorte(ordenData.detalle?.guillotina_cabida_corte || '');
        setPrensasPliegosImprimir(ordenData.detalle?.prensas_pliegos_imprimir || '');
        setPrensasCabidaImpresion(ordenData.detalle?.prensas_cabida_impresion || '');
        setPrensasTotalImpresion(ordenData.detalle?.prensas_total_impresion || '');
      }
    }
    setNombre_cliente(ordenData.nombre_cliente || '');
    setNumero_cotizacion(ordenData.numero_cotizacion || '');
    setTelefono_cliente(ordenData.telefono_cliente || ordenData.telefono || '');
    setEmail_cliente(ordenData.email_cliente || ordenData.email || '');
    setDireccion_cliente(ordenData.direccion_cliente || ordenData.contacto || '');
    setNumero_orden(ordenData.numero_orden || '');
    // Mapear fecha de entrega correctamente para el input tipo date
    if (ordenData.fecha_entrega) {
      // Si viene en formato ISO, recortar a YYYY-MM-DD
      setFechaEntrega(ordenData.fecha_entrega.substring(0, 10));
    } else {
      setFechaEntrega('');
    }
  }
  // Si es formulario de nueva orden (sin cotizacionId ni ordenId), obtener el próximo número de orden
  if (!cotizacionId && !ordenId) {
    fetch(`${apiUrl}/api/ordenTrabajo/proximoNumero`)
      .then(res => res.json())
      .then(data => setNumero_orden(data.proximoNumero))
      .catch(() => setNumero_orden(''));
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [ordenData, cotizacionId, ordenId, location.state]);


 
  if (cotizacionId && !ordenData) {
    return <p>Cargando orden de trabajo...</p>;
  }

  // Función de validación de campos
  const validarCampos = () => {
    const errores: string[] = [];
    // Generales
    if (!nombre_cliente.trim()) errores.push('El campo Cliente es obligatorio.');
    if (!concepto.trim()) errores.push('El campo Concepto es obligatorio.');
    if (!cantidad.trim() || isNaN(Number(cantidad))) errores.push('La Cantidad debe ser un número.');
    if (!fechaCreacion) errores.push('La Fecha de Creación es obligatoria.');
    if (!fechaEntrega) errores.push('La Fecha de Entrega es obligatoria.');
    if (!telefono_cliente.trim()) errores.push('El campo Teléfono es obligatorio.');
    if (!email_cliente.trim()) errores.push('El campo Email es obligatorio.');
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email_cliente)) errores.push('El Email no es válido.');
    // Técnicos (detalle)
    if (!tipoPapelProveedor.trim()) errores.push('El campo Tipo de Papel - Proveedor es obligatorio.');
    if (!tipoPapelPrensa.trim()) errores.push('El campo Tipo de Papel - Prensa es obligatorio.');
    if (!tipoPapelVelocidad.trim()) errores.push('El campo Tipo de Papel - Velocidad es obligatorio.');
    if (!tipoPapelCalibre.trim()) errores.push('El campo Tipo de Papel - Calibre es obligatorio.');
    if (!tipoPapelReferencia.trim()) errores.push('El campo Tipo de Papel - Referencia es obligatorio.');
    if (!tipoPapelGramos.trim()) errores.push('El campo Tipo de Papel - Gramos es obligatorio.');
    if (!tipoPapelTamano.trim()) errores.push('El campo Tipo de Papel - Tamaño es obligatorio.');
    if (!tipoPapelCantColores.trim()) errores.push('El campo Tipo de Papel - Cantidad Colores es obligatorio.');
    if (!tipoPapelCantPliegos.trim()) errores.push('El campo Tipo de Papel - Cantidad Pliegos es obligatorio.');
    if (!tipoPapelExceso.trim()) errores.push('El campo Tipo de Papel - Exceso es obligatorio.');
    if (!guillotinaPliegosCortar.trim()) errores.push('El campo Guillotina - Pliegos a Cortar es obligatorio.');
    if (!guillotinaTamanoCorte.trim()) errores.push('El campo Guillotina - Tamaño de Corte es obligatorio.');
    if (!guillotinaCabidaCorte.trim()) errores.push('El campo Guillotina - Cabida Corte es obligatorio.');
    if (!prensasPliegosImprimir.trim()) errores.push('El campo Prensas - Pliegos a Imprimir es obligatorio.');
    if (!prensasCabidaImpresion.trim()) errores.push('El campo Prensas - Cabida Impresión es obligatorio.');
    if (!prensasTotalImpresion.trim()) errores.push('El campo Prensas - Total Impresión es obligatorio.');
    return errores;
  };

  // Modificar crearOrdenTrabajo para mostrar modal de éxito y redirigir
  const crearOrdenTrabajo = async () => {
    const errores = validarCampos();
    if (errores.length > 0) {
      setValidationErrors(errores);
      setShowValidationModal(true);
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/crearOrdenTrabajo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Datos generales
          nombre_cliente,
          contacto: direccion_cliente,
          email: email_cliente,
          telefono: telefono_cliente,
          cantidad,
          concepto,
          fecha_creacion: fechaCreacion || null,
          fecha_entrega: fechaEntrega || null,
          estado,
          notas_observaciones: notasObservaciones,
          vendedor,
          preprensa,
          prensa,
          terminados,
          facturado,
          id_cotizacion: cotizacionId || null,
          id_detalle_cotizacion: idDetalleCotizacion,
          // Detalle técnico
          detalle: {
            tipo_papel_proveedor: tipoPapelProveedor,
            tipo_papel_prensa: tipoPapelPrensa,
            tipo_papel_velocidad: tipoPapelVelocidad,
            tipo_papel_calibre: tipoPapelCalibre,
            tipo_papel_referencia: tipoPapelReferencia,
            tipo_papel_gramos: tipoPapelGramos,
            tipo_papel_tamano: tipoPapelTamano,
            tipo_papel_cant_colores: tipoPapelCantColores,
            tipo_papel_cant_pliegos: tipoPapelCantPliegos,
            tipo_papel_exceso: tipoPapelExceso,
            guillotina_pliegos_cortar: guillotinaPliegosCortar,
            guillotina_tamano_corte: guillotinaTamanoCorte,
            guillotina_cabida_corte: guillotinaCabidaCorte,
            prensas_pliegos_imprimir: prensasPliegosImprimir,
            prensas_cabida_impresion: prensasCabidaImpresion,
            prensas_total_impresion: prensasTotalImpresion
          }
        }),
      });
      if (!response.ok) throw new Error("Error al crear la orden");
      const data = await response.json();
      setOrdenGuardadaNumero(data.numero_orden);
      setShowSuccessModal(true);
      // Notificación global para todos los usuarios
      window.dispatchEvent(new CustomEvent("nueva-notificacion", {
        detail: {
          titulo: "Nueva orden de trabajo",
          mensaje: `Se ha creado la orden de trabajo N° ${data.numero_orden}`,
          fecha: new Date().toLocaleString()
        }
      }));
    } catch (error) {
      alert("Ocurrió un error al guardar la orden de trabajo.");
    }
  };

  // Modificar editarOrdenTrabajo para validar antes de enviar
  const editarOrdenTrabajo = async () => {
    const errores = validarCampos();
    if (errores.length > 0) {
      setValidationErrors(errores);
      setShowValidationModal(true);
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/editarOrden/${ordenId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Datos generales
          nombre_cliente,
          contacto: direccion_cliente,
          email: email_cliente,
          telefono: telefono_cliente,
          cantidad,
          concepto,
          fecha_creacion: fechaCreacion || null,
          fecha_entrega: fechaEntrega || null,
          notas_observaciones: notasObservaciones,
          vendedor,
          preprensa,
          prensa,
          terminados,
          facturado,
          // Detalle técnico
          detalle: {
            tipo_papel_proveedor: tipoPapelProveedor,
            tipo_papel_prensa: tipoPapelPrensa,
            tipo_papel_velocidad: tipoPapelVelocidad,
            tipo_papel_calibre: tipoPapelCalibre,
            tipo_papel_referencia: tipoPapelReferencia,
            tipo_papel_gramos: tipoPapelGramos,
            tipo_papel_tamano: tipoPapelTamano,
            tipo_papel_cant_colores: tipoPapelCantColores,
            tipo_papel_cant_pliegos: tipoPapelCantPliegos,
            tipo_papel_exceso: tipoPapelExceso,
            guillotina_pliegos_cortar: guillotinaPliegosCortar,
            guillotina_tamano_corte: guillotinaTamanoCorte,
            guillotina_cabida_corte: guillotinaCabidaCorte,
            prensas_pliegos_imprimir: prensasPliegosImprimir,
            prensas_cabida_impresion: prensasCabidaImpresion,
            prensas_total_impresion: prensasTotalImpresion
          }
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al editar la orden de trabajo");
      }
      setShowSuccessModal(true);
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error al actualizar la orden:", err.message);
    }
  };

  return (
    <>
    <div className="flex justify-center bg-gray-90 p-0 min-h-screen print-wrapper">
      <div className="bg-white border border-gray-300 p-6 w-[210mm] h-[297mm] shadow-xl rounded-lg flex flex-col justify-between contenedor">
        {/* Encabezado */}
         
        <div className="mb-2 flex items-center">
          {/* Logo a la izquierda */}
          <div className="flex-shrink-0 w-40 mt-0">
            <Logo/>
          </div>

          {/* Título centrado */}
          <h2 className="flex-grow text-center text-xl font-bold text-gray-800">
            Orden de Trabajo
          </h2>
          {/* Quitar campo Estado del encabezado */}
        </div>

        {/* Información General */}
        <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex gap-4 items-center">
<div className="flex items-center gap-2">
  <p className="font-semibold text-gray-600">Orden N°:</p>
  <input
    className="border border-gray-300 rounded-md p-1 w-20 text-gray-700 text-sm"
    type="text"
    value={numero_orden}
    readOnly
  />
</div>

  
  <div className="flex items-center gap-2">
    <p className="font-semibold text-gray-600">Cotización N°:</p>
    <input className="border border-gray-300 rounded-md p-1 w-20 text-gray-700 text-sm" 
    type="text" value={String(numero_cotizacion).padStart(6, '0')}
  onChange={(e) => setNumero_cotizacion(e.target.value)}
/>
  </div>
   
  <div className="flex items-center gap-2">
    <p className="font-semibold text-gray-600">Fecha Creacion:</p>
    <input className="border border-gray-300 rounded-md p-1 w-30 text-gray-700 text-sm" type="date"   value={fechaCreacion}
  onChange={(e) => setFechaCreacion(e.target.value)} />
  </div>
   
  <div className="flex items-center gap-2">
    <p className="font-semibold text-gray-600">Fecha Entrega:</p>
    <input className="border border-gray-300 rounded-md p-1 w-30 text-gray-700 text-sm" type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} />
  </div>
</div>
 </div>
         <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="font-semibold text-gray-600">Cliente:</p>
            <input className="border border-gray-300 rounded-md p-1 w-full text-gray-700 text-sm" 
            type="text"  value={nombre_cliente}
  onChange={(e) => setNombre_cliente(e.target.value)}/>
            <p className="font-semibold text-gray-600">Teléfono:</p>
            <input className="border border-gray-300 rounded-md p-1 w-full text-gray-700 text-sm" type="text" value={telefono_cliente} onChange={e => setTelefono_cliente(e.target.value)} />
          </div>
          <div>
            <p className="font-semibold text-gray-600">Contacto</p>
            <input className="border border-gray-300 rounded-md p-1 w-full text-gray-700 text-sm" type="text" value={direccion_cliente} onChange={e => setDireccion_cliente(e.target.value)} />
            <p className="font-semibold text-gray-600">Email</p>
            <input className="border border-gray-300 rounded-md p-1 w-full text-gray-700 text-sm" type="text" value={email_cliente} onChange={e => setEmail_cliente(e.target.value)} />
          </div>
       
</div>
        {/* Información Trabajo */}
          <h3 className="font-bold text-lg text-gray-800 mb-2">Información del Trabajo</h3>
        
<div className="flex flex-wrap gap-4 mb-4">
  <div className="flex flex-col basis-1/12">
    <p className="font-semibold text-gray-600">Cantidad:</p>
    <input className="border border-gray-300 rounded-md p-1 text-gray-700 text-sm w-full" type="text" value={cantidad} onChange={e => setCantidad(e.target.value)} />
  </div>

  <div className="flex flex-col basis-4/12">
    <p className="font-semibold text-gray-600">Concepto:</p>
    
     <textarea
          className="border border-gray-300 rounded-md p-1 text-gray-700 text-sm w-90 resize-none"
          rows={1}
         value={concepto}
  onChange={(e) => setConcepto(e.target.value)}
        />
  </div>

  {/* Grupo 1: Tamaño Abierto + Páginas Portada */}
  <div className="flex flex-col basis-2/12 gap-2">
    <div>
      <p className="font-semibold text-gray-600">Tamaño Abierto:</p>
      <input className="border border-gray-300 rounded-md p-1 text-gray-700 text-sm w-full" type="text" />
    </div>
    <div>
      <p className="font-semibold text-gray-600 whitespace-nowrap">Páginas Portada:</p>
      <input className="border border-gray-300 rounded-md p-1 text-gray-700 text-sm w-full" type="text" />
    </div>
  </div>

  {/* Grupo 2: Tamaño Cerrado + Páginas Interiores */}
  <div className="flex flex-col basis-2/12 gap-2">
    <div>
      <p className="font-semibold text-gray-600">Tamaño Cerrado:</p>
      <input className="border border-gray-300 rounded-md p-1 text-gray-700 text-sm w-full" type="text" />
    </div>
    <div>
      <p className="font-semibold text-gray-600 whitespace-nowrap">Páginas Interiores:</p>
      <input className="border border-gray-300 rounded-md p-1 text-gray-700 text-sm w-full" type="text" />
    </div>
  </div>
</div>

<div className="flex flex-wrap gap-4 mb-4">
  {/* Columna 1: Tipo de Papel */}
  <p className="font-semibold text-gray-700 underline">Tipo de Papel</p>
    
    <div>
      <p className="text-sm text-gray-600">Proveedor:</p>
      <input className="input-field" type="text" value={tipoPapelProveedor} onChange={e => setTipoPapelProveedor(e.target.value)} />
    </div>

    <div>
      <p className="text-sm text-gray-600">Prensa:</p>
      <input className="input-field" type="text" value={tipoPapelPrensa} onChange={e => setTipoPapelPrensa(e.target.value)} />
    </div>

    <div>
      <p className="text-sm text-gray-600">Vel x Hora:</p>
      <input className="input-field" type="text" value={tipoPapelVelocidad} onChange={e => setTipoPapelVelocidad(e.target.value)} />
    </div>
  <div className="flex flex-col basis-4/12 gap-2">
    

    <div>
      <p className="text-sm text-gray-600">Calibre:</p>
      <input className="input-field" type="text" value={tipoPapelCalibre} onChange={e => setTipoPapelCalibre(e.target.value)} />
    </div>

    <div>
      <p className="text-sm text-gray-600">Referencia:</p>
      <input className="input-field" type="text" value={tipoPapelReferencia} onChange={e => setTipoPapelReferencia(e.target.value)} />
    </div>

    <div>
      <p className="text-sm text-gray-600">Gramos:</p>
      <input className="input-field" type="text" value={tipoPapelGramos} onChange={e => setTipoPapelGramos(e.target.value)} />
    </div>

    <div>
      <p className="text-sm text-gray-600">Tamaño:</p>
      <input className="input-field" type="text" value={tipoPapelTamano} onChange={e => setTipoPapelTamano(e.target.value)} />
    </div>

    <div>
      <p className="text-sm text-gray-600">Cantidad Colores:</p>
      <input className="input-field" type="text" value={tipoPapelCantColores} onChange={e => setTipoPapelCantColores(e.target.value)} />
    </div>

    <div>
      <p className="text-sm text-gray-600">Cantidad Pliegos:</p>
      <input className="input-field" type="text" value={tipoPapelCantPliegos} onChange={e => setTipoPapelCantPliegos(e.target.value)} />
    </div>

    <div>
      <p className="text-sm text-gray-600">Exceso:</p>
      <input className="input-field" type="text" value={tipoPapelExceso} onChange={e => setTipoPapelExceso(e.target.value)} />   
    </div>
  </div>
  

  {/* Columna 2: Guillotina */}
  <div className="flex flex-col basis-4/12 gap-2">
    <p className="font-semibold text-gray-700 underline">Guillotina</p>
    
    <div>
      <p className="text-sm text-gray-600">Pliegos a Cortar:</p>
      <input className="input-field" type="text" value={guillotinaPliegosCortar} onChange={e => setGuillotinaPliegosCortar(e.target.value)} />
    </div>

    <div>
      <p className="text-sm text-gray-600">Tamaño de Corte:</p>
      <input className="input-field" type="text" value={guillotinaTamanoCorte} onChange={e => setGuillotinaTamanoCorte(e.target.value)} />
    </div>

    <div>
      <p className="text-sm text-gray-600">Cabida Corte:</p>
      <input className="input-field" type="text" value={guillotinaCabidaCorte} onChange={e => setGuillotinaCabidaCorte(e.target.value)} />
    </div>
  </div>

  {/* Columna 3: Prensas */}
  <div className="flex flex-col basis-3/12 gap-2">
    <p className="font-semibold text-gray-700 underline">Prensas</p>
    
    <div>
      <p className="text-sm text-gray-600">Pliegos a Imprimir:</p>
      <input className="input-field" type="text" value={prensasPliegosImprimir} onChange={e => setPrensasPliegosImprimir(e.target.value)} />
    </div>

    <div>
      <p className="text-sm text-gray-600">Cabida Impresión:</p>
      <input className="input-field" type="text" value={prensasCabidaImpresion} onChange={e => setPrensasCabidaImpresion(e.target.value)} />
    </div>

    <div>
      <p className="text-sm text-gray-600">Total Impresión:</p>
      <input className="input-field" type="text" value={prensasTotalImpresion} onChange={e => setPrensasTotalImpresion(e.target.value)} />
    </div>
  </div>
</div>


        {/* Notas y Observaciones */}
        <h3 className="font-bold text-lg text-gray-800 mb-2">Notas y Observaciones</h3>
        <textarea className="border border-gray-300 p-2 rounded-md w-full h-24 text-sm text-gray-700 mb-4" placeholder="Añadir notas u observaciones aquí..." value={notasObservaciones} onChange={e => setNotasObservaciones(e.target.value)}></textarea>
      <div className="flex justify-between gap-4 mb-2 p-0">
  {/* Vendedor */}
  <div className="flex flex-col items-start text-center w-1/5">
    <p className="font-semibold text-xs text-gray-700 underline mb-1">Vendedor</p>
    <input className="input-field text-xs w-full" type="text" placeholder="Nombre" value={vendedor} onChange={e => setVendedor(e.target.value)} />
  </div>

  {/* Preprensa */}           
  <div className="flex flex-col items-start text-center w-1/5">
    <p className="font-semibold text-xs text-gray-700 underline mb-1">Preprensa</p>
    <input className="input-field text-xs w-full" type="text" placeholder="Responsable" value={preprensa} onChange={e => setPreprensa(e.target.value)} />
  </div>

  {/* Prensa */}
  <div className="flex flex-col items-start text-center w-1/5">
    <p className="font-semibold text-xs text-gray-700 underline mb-1">Prensa</p>
    <input className="input-field text-xs w-full" type="text" placeholder="Responsable" value={prensa} onChange={e => setPrensa(e.target.value)} />
  </div>

  {/* Terminados */}
  <div className="flex flex-col items-start text-center w-1/5">
    <p className="font-semibold text-xs text-gray-700 underline mb-1">Terminados</p>
    <input className="input-field text-xs w-full" type="text" placeholder="Responsable" value={terminados} onChange={e => setTerminados(e.target.value)} />
  </div>

  {/* Facturado */}
  <div className="flex flex-col items-start text-center w-1/5">
    <p className="font-semibold text-xs text-gray-700 underline mb-1">Facturado</p>
    <input className="input-field text-xs w-full" type="text" placeholder="Sí / No" value={facturado} onChange={e => setFacturado(e.target.value)} />
  </div>
</div>

  
      </div>
    </div>
          {/* Botones */}
        <div className="flex justify-end gap-4 mb-4 botones-opcion">
          {/* Mostrar Imprimir solo en edición */}
          {ordenId && (
            <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => window.print()}>Imprimir</button>
          )}
          {/* Botón Crear/Editar */}
          {!ordenId ? (
            <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={crearOrdenTrabajo}>Crear Orden</button>
          ) : (
            <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={editarOrdenTrabajo}>Editar Orden</button>
          )}
          {/* Botón Cancelar */}
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={() => {
              if (ordenId) {
                navigate('/ordendeTrabajo/ver');
              } else {
                // Si es creación, puedes limpiar el formulario o navegar atrás
                window.history.back();
              }
            }}
          >
            Cancelar
          </button>
        </div>
      {/* Modal de errores de validación */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
            <h3 className="text-lg font-semibold mb-2 text-red-600">Errores en el formulario</h3>
            <ul className="text-left text-sm text-gray-800 mb-4">
              {validationErrors.map((err, idx) => (
                <li key={idx}>• {err}</li>
              ))}
            </ul>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => setShowValidationModal(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      {showSuccessModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
        <h3 className="text-lg font-semibold mb-2 text-green-700">¡Orden guardada exitosamente!</h3>
        <p className="mb-4">Orden número: <span className="font-bold">{ordenGuardadaNumero}</span></p>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => { setShowSuccessModal(false); navigate('/ordendeTrabajo/ver'); }}
        >
          Ir al listado de órdenes
        </button>
      </div>
    </div>
  )}
    </>
  );
};

export default OrdendeTrabajoEditar;
