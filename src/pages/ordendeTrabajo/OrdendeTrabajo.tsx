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

     // Nuevos estados para la información de trabajo
   const [material, setMaterial] = useState('');
   const [corteMaterial, setCorteMaterial] = useState('');
   const [cantidadPliegosCompra, setCantidadPliegosCompra] = useState('');
   const [exceso, setExceso] = useState('');
   const [totalPliegos, setTotalPliegos] = useState('');
   const [tamano, setTamano] = useState('');
       const [tamanoAbierto1, setTamanoAbierto1] = useState('');
    const [tamanoCerrado1, setTamanoCerrado1] = useState('');
   const [impresion, setImpresion] = useState('');
   const [instruccionesImpresion, setInstruccionesImpresion] = useState('');
   const [instruccionesAcabados, setInstruccionesAcabados] = useState('');
   const [instruccionesEmpacado, setInstruccionesEmpacado] = useState('');
   const [observaciones, setObservaciones] = useState('');
   const [prensaSeleccionada, setPrensaSeleccionada] = useState('');
   const [mostrarDropdownPrensa, setMostrarDropdownPrensa] = useState(false);

  // Opciones de prensa
  const opcionesPrensa = ['GTO 52', 'PM52', 'CD102'];

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [ordenGuardadaNumero, setOrdenGuardadaNumero] = useState<string | null>(null);
  const [idDetalleCotizacion, setIdDetalleCotizacion] = useState<number | null>(null);

  const { cotizacionId, ordenId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Función para calcular el total de pliegos
  const calcularTotalPliegos = () => {
    const pliegos = parseInt(cantidadPliegosCompra) || 0;
    const excesoNum = parseInt(exceso) || 0;
    const total = pliegos + excesoNum;
    setTotalPliegos(total.toString());
  };

  // Efecto para recalcular el total cuando cambien los valores
  useEffect(() => {
    calcularTotalPliegos();
  }, [cantidadPliegosCompra, exceso]);

  // Efecto para cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.prensa-dropdown')) {
        setMostrarDropdownPrensa(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


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
       // Limpiar nuevos campos
               setMaterial('');
        setCorteMaterial('');
        setCantidadPliegosCompra('');
        setExceso('');
        setTotalPliegos('');
        setTamano('');
                 setTamanoAbierto1('');
         setTamanoCerrado1('');
        setImpresion('');
        setInstruccionesImpresion('');
        setInstruccionesAcabados('');
        setInstruccionesEmpacado('');
        setObservaciones('');
        setPrensaSeleccionada('');
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
         
         // Sincronizar nuevos campos
                   setMaterial(ordenData.detalle?.material || '');
          setCorteMaterial(ordenData.detalle?.corte_material || '');
          setCantidadPliegosCompra(ordenData.detalle?.cantidad_pliegos_compra || '');
          setExceso(ordenData.detalle?.exceso || '');
          setTotalPliegos(ordenData.detalle?.total_pliegos || '');
          setTamano(ordenData.detalle?.tamano || '');
                     setTamanoAbierto1(ordenData.detalle?.tamano_abierto_1 || '');
           setTamanoCerrado1(ordenData.detalle?.tamano_cerrado_1 || '');
          setImpresion(ordenData.detalle?.impresion || '');
          setInstruccionesImpresion(ordenData.detalle?.instrucciones_impresion || '');
          setInstruccionesAcabados(ordenData.detalle?.instrucciones_acabados || '');
          setInstruccionesEmpacado(ordenData.detalle?.instrucciones_empacado || '');
          setObservaciones(ordenData.detalle?.observaciones || '');
          setPrensaSeleccionada(ordenData.detalle?.prensa_seleccionada || '');
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
     
     // Nuevos campos de trabajo
     if (!material.trim()) errores.push('El campo Material es obligatorio.');
     if (!corteMaterial.trim()) errores.push('El campo Corte de Material es obligatorio.');
     if (!cantidadPliegosCompra.trim() || isNaN(Number(cantidadPliegosCompra))) errores.push('La Cantidad de Pliegos de Compra debe ser un número.');
     if (!exceso.trim() || isNaN(Number(exceso))) errores.push('El Exceso debe ser un número.');
           if (!tamanoAbierto1.trim()) errores.push('El campo Tamaño Abierto es obligatorio.');
      if (!tamanoCerrado1.trim()) errores.push('El campo Tamaño Cerrado es obligatorio.');
     if (!impresion.trim()) errores.push('El campo Impresión es obligatorio.');
     if (!instruccionesImpresion.trim()) errores.push('El campo Instrucciones de Impresión es obligatorio.');
     if (!instruccionesAcabados.trim()) errores.push('El campo Instrucciones de Acabados es obligatorio.');
     if (!instruccionesEmpacado.trim()) errores.push('El campo Instrucciones de Empacado es obligatorio.');
     if (!prensaSeleccionada.trim()) errores.push('El campo Prensa es obligatorio.');
     
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
             material: material,
             corte_material: corteMaterial,
             cantidad_pliegos_compra: cantidadPliegosCompra,
             exceso: exceso,
             total_pliegos: totalPliegos,
             tamano: tamano,
             tamano_abierto_1: tamanoAbierto1,
             tamano_cerrado_1: tamanoCerrado1,
             impresion: impresion,
             instrucciones_impresion: instruccionesImpresion,
             instrucciones_acabados: instruccionesAcabados,
             instrucciones_empacado: instruccionesEmpacado,
             observaciones: observaciones,
             prensa_seleccionada: prensaSeleccionada
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
            material: material,
            corte_material: corteMaterial,
            cantidad_pliegos_compra: cantidadPliegosCompra,
            exceso: exceso,
            total_pliegos: totalPliegos,
            tamano: tamano,
            tamano_abierto_1: tamanoAbierto1,
            tamano_cerrado_1: tamanoCerrado1,
            impresion: impresion,
            instrucciones_impresion: instruccionesImpresion,
            instrucciones_acabados: instruccionesAcabados,
            instrucciones_empacado: instruccionesEmpacado,
            observaciones: observaciones,
            prensa_seleccionada: prensaSeleccionada
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
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-4">
          {/* Encabezado */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-shrink-0">
                <Logo/>
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Orden de Trabajo
              </h2>
            </div>

            {/* Información General - Diseño compacto */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Primera columna: Orden y Cotización */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">Orden N°:</label>
                  <input
                    className="border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm w-20"
                    type="text"
                    value={numero_orden}
                    readOnly
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">Cotización N°:</label>
                  <input 
                    className="border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm w-20" 
                    type="text" 
                    value={String(numero_cotizacion).padStart(6, '0')}
                    onChange={(e) => setNumero_cotizacion(e.target.value)}
                  />
                </div>
              </div>

              {/* Segunda columna: Fechas */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">Fecha Creación:</label>
                  <input 
                    className="border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm" 
                    type="date"   
                    value={fechaCreacion}
                    onChange={(e) => setFechaCreacion(e.target.value)} 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">Fecha Entrega:</label>
                  <input 
                    className="border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm" 
                    type="date" 
                    value={fechaEntrega} 
                    onChange={e => setFechaEntrega(e.target.value)} 
                  />
                </div>
              </div>

                             {/* Tercera columna: Cliente y Contacto */}
               <div className="space-y-2">
                 <div>
                   <label className="block text-sm font-semibold text-gray-700">Cliente:</label>
                   <input 
                     className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm" 
                     type="text"  
                     value={nombre_cliente}
                     onChange={(e) => setNombre_cliente(e.target.value)}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-gray-700">Contacto:</label>
                   <input 
                     className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm" 
                     type="text" 
                     value={direccion_cliente} 
                     onChange={e => setDireccion_cliente(e.target.value)} 
                   />
                 </div>
               </div>

               {/* Cuarta columna: Teléfono y Email */}
               <div className="space-y-2">
                 <div>
                   <label className="block text-sm font-semibold text-gray-700">Teléfono:</label>
                   <input 
                     className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm" 
                     type="text" 
                     value={telefono_cliente} 
                     onChange={e => setTelefono_cliente(e.target.value)} 
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-gray-700">Email:</label>
                   <input 
                     className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm" 
                     type="text" 
                     value={email_cliente} 
                     onChange={e => setEmail_cliente(e.target.value)} 
                   />
                 </div>
               </div>
             </div>
          </div>

                     {/* Información del Trabajo - Diseño compacto */}
           <div className="bg-white rounded-lg shadow-md p-4 mb-4">
             <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
               Información del Trabajo
             </h3>
             
                                                                                                                                                                                                                               <div className="flex gap-4 items-start">
                   <div className="flex flex-col">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                     <input 
                       className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                       type="text" 
                       value={cantidad} 
                       onChange={e => setCantidad(e.target.value)} 
                     />
                   </div>

                   <div className="flex-1 flex flex-col">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                     <textarea
                       className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                       rows={2}
                       value={concepto}
                       onChange={(e) => setConcepto(e.target.value)}
                       placeholder="Descripción del trabajo..."
                     />
                   </div>

                   <div className="flex flex-col">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño Abierto</label>
                     <input 
                       className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                       type="text" 
                       placeholder="5x9"
                       value={tamanoAbierto1}
                       onChange={e => setTamanoAbierto1(e.target.value)}
                     />
                   </div>

                   <div className="flex flex-col">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño Cerrado</label>
                     <input 
                       className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                       type="text" 
                       placeholder="5x9"
                       value={tamanoCerrado1}
                       onChange={e => setTamanoCerrado1(e.target.value)}
                     />
                   </div>
                 </div>
           </div>

          {/* Material y Corte - Diseño horizontal */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Material y Corte
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <textarea
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
                  rows={2}
                  value={material}
                  onChange={e => setMaterial(e.target.value)}
                  placeholder="Especificaciones del material..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Corte de Material</label>
                <textarea
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
                  rows={2}
                  value={corteMaterial}
                  onChange={e => setCorteMaterial(e.target.value)}
                  placeholder="Instrucciones de corte..."
                />
              </div>
            </div>
          </div>

          {/* Cantidad de Pliegos - Diseño compacto */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Cantidad de Pliegos
            </h3>
            
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pliegos de Compra</label>
                <input 
                  className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500" 
                  type="number" 
                  value={cantidadPliegosCompra}
                  onChange={e => setCantidadPliegosCompra(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exceso</label>
                <input 
                  className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500" 
                  type="number" 
                  value={exceso}
                  onChange={e => setExceso(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                <input 
                  className="w-24 px-2 py-1 border border-gray-300 rounded bg-gray-50 font-semibold text-gray-700 cursor-not-allowed" 
                  type="text" 
                  value={totalPliegos}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Impresión y Acabados - Diseño horizontal */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Impresión y Acabados
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Impresión</label>
                <textarea
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                  rows={2}
                  value={impresion}
                  onChange={e => setImpresion(e.target.value)}
                  placeholder="Especificaciones de impresión..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones de Impresión</label>
                <textarea
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                  rows={2}
                  value={instruccionesImpresion}
                  onChange={e => setInstruccionesImpresion(e.target.value)}
                  placeholder="Instrucciones específicas..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones de Acabados</label>
                <textarea
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                  rows={2}
                  value={instruccionesAcabados}
                  onChange={e => setInstruccionesAcabados(e.target.value)}
                  placeholder="Instrucciones de acabados..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones de Empacado</label>
                <textarea
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                  rows={2}
                  value={instruccionesEmpacado}
                  onChange={e => setInstruccionesEmpacado(e.target.value)}
                  placeholder="Instrucciones de empacado..."
                />
              </div>
            </div>
          </div>

          {/* Prensa y Observaciones - Diseño horizontal */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Prensa y Observaciones
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="relative prensa-dropdown">
                <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Prensa</label>
                <div className="relative">
                  <input 
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 pr-8" 
                    type="text" 
                    value={prensaSeleccionada}
                    onChange={e => setPrensaSeleccionada(e.target.value)}
                    onFocus={() => setMostrarDropdownPrensa(true)}
                    placeholder="Seleccionar o escribir prensa..."
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setMostrarDropdownPrensa(!mostrarDropdownPrensa)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {mostrarDropdownPrensa && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg z-10 mt-1">
                    {opcionesPrensa.map((opcion, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          setPrensaSeleccionada(opcion);
                          setMostrarDropdownPrensa(false);
                        }}
                      >
                        {opcion}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones Generales</label>
                <textarea
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  rows={2}
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Observaciones generales del trabajo..."
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales</label>
              <textarea 
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" 
                rows={2}
                placeholder="Añadir notas adicionales aquí..." 
                value={notasObservaciones} 
                onChange={e => setNotasObservaciones(e.target.value)}
              />
            </div>
          </div>

          {/* Responsables del Proceso - Diseño compacto */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Responsables del Proceso
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Vendedor</label>
                <input 
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-center" 
                  type="text" 
                  placeholder="Nombre" 
                  value={vendedor} 
                  onChange={e => setVendedor(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Preprensa</label>
                <input 
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-center" 
                  type="text" 
                  placeholder="Responsable" 
                  value={preprensa} 
                  onChange={e => setPreprensa(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Prensa</label>
                <input 
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-center" 
                  type="text" 
                  placeholder="Responsable" 
                  value={prensa} 
                  onChange={e => setPrensa(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Terminados</label>
                <input 
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-center" 
                  type="text" 
                  placeholder="Responsable" 
                  value={terminados} 
                  onChange={e => setTerminados(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Facturado</label>
                <input 
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-center" 
                  type="text" 
                  value={facturado} 
                  onChange={e => setFacturado(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-end gap-4">
              {ordenId && (
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors" onClick={() => window.print()}>
                  Imprimir
                </button>
              )}
              
              {!ordenId ? (
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors" onClick={crearOrdenTrabajo}>
                  Crear Orden
                </button>
              ) : (
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors" onClick={editarOrdenTrabajo}>
                  Editar Orden
                </button>
              )}
              
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded transition-colors"
                onClick={() => {
                  if (ordenId) {
                    navigate('/ordendeTrabajo/ver');
                  } else {
                    window.history.back();
                  }
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
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


