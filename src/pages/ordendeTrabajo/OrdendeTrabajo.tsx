import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../components/Logo";
import "../../styles/ordenTrabajo/OrdenTrabajo.css";
import { usePermisos } from '../../hooks/usePermisos';

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
  // Campos de Responsables del Proceso
  vendedor?: string;
  preprensa?: string;
  prensa?: string;
  terminados?: string;
  facturado?: string;
  // Otros campos generales
  estado?: string;
  notas_observaciones?: string;
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
  const { verificarYMostrarError } = usePermisos();
  
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

  // Log cuando cambia numero_orden para debugging
  useEffect(() => {
    console.log('🔄 FRONTEND - numero_orden cambió a:', numero_orden);
  }, [numero_orden]);

  // Estados para los campos técnicos (ejemplo, agrega todos los que necesites)
  const [tipoPapelProveedor, setTipoPapelProveedor] = useState<string>('');
  const [tipoPapelPrensa, setTipoPapelPrensa] = useState<string>('');
  const [tipoPapelVelocidad, setTipoPapelVelocidad] = useState<string>('');
  const [tipoPapelCalibre, setTipoPapelCalibre] = useState<string>('');
  const [tipoPapelReferencia, setTipoPapelReferencia] = useState<string>('');
  const [tipoPapelGramos, setTipoPapelGramos] = useState<string>('');
  const [tipoPapelTamano, setTipoPapelTamano] = useState<string>('');
  const [tipoPapelCantColores, setTipoPapelCantColores] = useState<string>('');
  const [tipoPapelCantPliegos, setTipoPapelCantPliegos] = useState<string>('');
  const [tipoPapelExceso, setTipoPapelExceso] = useState<string>('');
  const [guillotinaPliegosCortar, setGuillotinaPliegosCortar] = useState<string>('');
  const [guillotinaTamanoCorte, setGuillotinaTamanoCorte] = useState<string>('');
  const [guillotinaCabidaCorte, setGuillotinaCabidaCorte] = useState<string>('');
  const [prensasPliegosImprimir, setPrensasPliegosImprimir] = useState<string>('');
  const [prensasCabidaImpresion, setPrensasCabidaImpresion] = useState<string>('');
  const [prensasTotalImpresion, setPrensasTotalImpresion] = useState<string>('');
  // Estados adicionales generales
  const [fechaEntrega, setFechaEntrega] = useState<string>('');
  const [estado, setEstado] = useState<string>('pendiente');
  const [notasObservaciones, setNotasObservaciones] = useState<string>('');
  const [vendedor, setVendedor] = useState<string>('');
  const [preprensa, setPreprensa] = useState<string>('');
  const [prensa, setPrensa] = useState<string>('');
  const [terminados, setTerminados] = useState<string>('');
  const [facturado, setFacturado] = useState<string>('');

     // Nuevos estados para la información de trabajo
   const [material, setMaterial] = useState<string>('');
   const [corteMaterial, setCorteMaterial] = useState<string>('');
   const [cantidadPliegosCompra, setCantidadPliegosCompra] = useState<string>('');
   const [exceso, setExceso] = useState<string>('');
   const [totalPliegos, setTotalPliegos] = useState<string>('');
   const [tamano, setTamano] = useState<string>('');
       const [tamanoAbierto1, setTamanoAbierto1] = useState<string>('');
    const [tamanoCerrado1, setTamanoCerrado1] = useState<string>('');
   const [impresion, setImpresion] = useState<string>('');
   const [instruccionesImpresion, setInstruccionesImpresion] = useState<string>('');
   const [instruccionesAcabados, setInstruccionesAcabados] = useState<string>('');
   const [instruccionesEmpacado, setInstruccionesEmpacado] = useState<string>('');
   const [observaciones, setObservaciones] = useState<string>('');
   const [prensaSeleccionada, setPrensaSeleccionada] = useState<string>('');
   const [mostrarDropdownPrensa, setMostrarDropdownPrensa] = useState<boolean>(false);

  // Opciones de prensa
  const opcionesPrensa = ['GTO 52', 'PM52', 'CD102'];

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmUpdateModal, setShowConfirmUpdateModal] = useState(false);
  const [showConfirmCreateNewModal, setShowConfirmCreateNewModal] = useState(false);
  const [ordenGuardadaNumero, setOrdenGuardadaNumero] = useState<string | null>(null);
  const [idDetalleCotizacion, setIdDetalleCotizacion] = useState<number | null>(null);

  const { cotizacionId, ordenId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showTipoOrdenModal, setShowTipoOrdenModal] = useState<boolean>(false);
  const [tipoOrdenSeleccionado, setTipoOrdenSeleccionado] = useState<string | null>(null); // 'prensa' | 'digital'

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
    // Si venimos navegando con tipoOrden, guardarlo
    if (location.state && (location.state as any).tipoOrden) {
      setTipoOrdenSeleccionado((location.state as any).tipoOrden);
    }

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
      // Si no tenemos tipo de orden aún, mostrar modal de selección
      if (!tipoOrdenSeleccionado) {
        setShowTipoOrdenModal(true);
      }
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
   console.log('🔄 useEffect - ordenData recibido:', ordenData);
   
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
    
    // Solo sincronizar numero_orden si estamos editando una orden existente
    if (ordenId) {
      setNumero_orden(ordenData.numero_orden || '');
    }
    
    // Sincronizar campos de Responsables del Proceso
    console.log('🔄 Sincronizando Responsables del Proceso:', {
      vendedor: ordenData.vendedor,
      preprensa: ordenData.preprensa,
      prensa: ordenData.prensa,
      terminados: ordenData.terminados,
      facturado: ordenData.facturado
    });
    
    setVendedor(ordenData.vendedor || '');
    setPreprensa(ordenData.preprensa || '');
    setPrensa(ordenData.prensa || '');
    setTerminados(ordenData.terminados || '');
    setFacturado(ordenData.facturado || '');
    
    // Sincronizar otros campos generales
    setEstado(ordenData.estado || 'pendiente');
    setNotasObservaciones(ordenData.notas_observaciones || '');
    
    // Mapear fecha de entrega correctamente para el input tipo date
    if (ordenData.fecha_entrega) {
      // Si viene en formato ISO, recortar a YYYY-MM-DD
      setFechaEntrega(ordenData.fecha_entrega.substring(0, 10));
    } else {
      setFechaEntrega('');
    }
     }
 // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenData, cotizacionId, ordenId, location.state]);

  // Efecto para obtener el próximo número de orden cuando sea necesario
  useEffect(() => {
    if (!ordenId) {
      console.log('🔄 FRONTEND - Obteniendo próximo número de orden...');
      console.log('📋 FRONTEND - cotizacionId:', cotizacionId);
      console.log('📋 FRONTEND - ordenId:', ordenId);
      
      // Obtener el próximo número si estamos creando una nueva orden (con o sin cotización)
      fetch(`${apiUrl}/api/ordenTrabajo/proximoNumero`)
        .then(res => res.json())
        .then(data => {
          console.log('✅ FRONTEND - Próximo número obtenido:', data.proximoNumero);
          setNumero_orden(data.proximoNumero);
        })
        .catch((error) => {
          console.error('❌ FRONTEND - Error al obtener próximo número:', error);
          setNumero_orden('');
        });
    } else {
      console.log('🔄 FRONTEND - No obteniendo próximo número (editando orden existente)');
    }
  }, [cotizacionId, ordenId, apiUrl]);

  
  if (cotizacionId && !ordenData) {
    return <p>Cargando orden de trabajo...</p>;
  }

  // Función para asegurar que los valores sean strings
  const asegurarString = (valor: any): string => {
    if (valor === null || valor === undefined) return '';
    if (typeof valor === 'string') return valor;
    return String(valor);
  };

  // Función de validación de campos (solo campos esenciales son obligatorios)
  const validarCampos = () => {
    console.log('🔍 FRONTEND - Ejecutando validación de campos');
    
    // Asegurar que todos los valores sean strings
    const nombreClienteStr = asegurarString(nombre_cliente);
    const conceptoSrt = asegurarString(concepto);
    const cantidadStr = asegurarString(cantidad);
    const cantidadPliegosCompraStr = asegurarString(cantidadPliegosCompra);
    const excesoStr = asegurarString(exceso);
    
    console.log('🔍 FRONTEND - Valores convertidos a string:', {
      nombreClienteStr,
      conceptoSrt,
      cantidadStr,
      cantidadPliegosCompraStr,
      excesoStr
    });
    
    const errores: string[] = [];
    
    // Solo campos esenciales son obligatorios
    if (!nombreClienteStr.trim()) {
      console.log('❌ FRONTEND - Cliente vacío');
      errores.push('El campo Cliente es obligatorio.');
    }
    if (!conceptoSrt.trim()) {
      console.log('❌ FRONTEND - Concepto vacío');
      errores.push('El campo Concepto es obligatorio.');
    }
    if (!cantidadStr.trim() || isNaN(Number(cantidadStr))) {
      console.log('❌ FRONTEND - Cantidad inválida:', cantidadStr);
      errores.push('La Cantidad debe ser un número.');
    }
    
    // Validar formato de email solo si se proporciona
    if (email_cliente && typeof email_cliente === 'string' && email_cliente.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email_cliente)) {
      errores.push('El Email no es válido.');
    }
    
    // Validar formato de números solo si se proporcionan
    if (cantidadPliegosCompraStr.trim() && isNaN(Number(cantidadPliegosCompraStr))) {
      errores.push('La Cantidad de Pliegos de Compra debe ser un número.');
    }
    
    if (excesoStr.trim() && isNaN(Number(excesoStr))) {
      errores.push('El Exceso debe ser un número.');
    }
    
    console.log('✅ FRONTEND - Validación completada, errores:', errores);
    return errores;
  };

  // Modificar crearOrdenTrabajo para mostrar modal de éxito y redirigir
  const crearOrdenTrabajo = async () => {
    console.log('🚀 FRONTEND - Iniciando creación de orden');
    console.log('🔍 FRONTEND - Verificando que la función se ejecute');
    
    // Validar permisos ANTES de continuar
    if (!verificarYMostrarError('ordenes_trabajo', 'crear', 'crear esta orden de trabajo')) {
      return;
    }
    
    const errores = validarCampos();
    if (errores.length > 0) {
      console.log('❌ FRONTEND - Errores de validación:', errores);
      setValidationErrors(errores);
      setShowValidationModal(true);
      return;
    }
    
    console.log('✅ FRONTEND - Validación pasada, enviando datos...');
    
    const dataToSend = {
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
    };
    
    console.log('📤 FRONTEND - Datos a enviar:', dataToSend);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/crearOrdenTrabajo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend)
      });
      
      console.log('📥 FRONTEND - Respuesta recibida:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ FRONTEND - Error en respuesta:', errorData);
        throw new Error("Error al crear la orden");
      }
      
      const data = await response.json();
      console.log('✅ FRONTEND - Orden creada exitosamente:', data);
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
      console.error('❌ FRONTEND - Error en catch:', error);
      alert("Ocurrió un error al guardar la orden de trabajo.");
    }
  };

  // Función para mostrar modal de confirmación de actualización
  const confirmarActualizacion = () => {
    setShowConfirmUpdateModal(true);
  };

  // Función para ejecutar la actualización después de confirmar
  const ejecutarActualizacion = async () => {
    setShowConfirmUpdateModal(false);
    console.log('🚀 FRONTEND - Iniciando actualización de orden');
    console.log('📋 FRONTEND - ordenId:', ordenId);
    
    // Validar permisos ANTES de continuar
    if (!verificarYMostrarError('ordenes_trabajo', 'editar', 'actualizar esta orden de trabajo')) {
      return;
    }
    
    const errores = validarCampos();
    if (errores.length > 0) {
      console.log('❌ FRONTEND - Errores de validación:', errores);
      setValidationErrors(errores);
      setShowValidationModal(true);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/editarOrden/${ordenId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
          estado,
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
      setOrdenGuardadaNumero(numero_orden);
      // Notificación global para todos los usuarios
      window.dispatchEvent(new CustomEvent("nueva-notificacion", {
        detail: {
          titulo: "Orden de trabajo actualizada",
          mensaje: `Se ha actualizado la orden de trabajo N° ${numero_orden}`,
          fecha: new Date().toLocaleString()
        }
      }));
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error al actualizar la orden:", err.message);
      alert("Error al actualizar la orden de trabajo: " + err.message);
    }
  };

  // Función para mostrar modal de confirmación de crear como nueva
  const confirmarCrearComoNueva = () => {
    setShowConfirmCreateNewModal(true);
  };

  // Función para ejecutar la creación como nueva después de confirmar
  const ejecutarCrearComoNueva = async () => {
    setShowConfirmCreateNewModal(false);
    console.log('🚀 FRONTEND - Iniciando creación de orden como nueva');
    console.log('📋 FRONTEND - ordenId actual:', ordenId);
    
    // Validar permisos ANTES de continuar
    if (!verificarYMostrarError('ordenes_trabajo', 'crear', 'crear esta orden de trabajo')) {
      return;
    }
    
    const errores = validarCampos();
    if (errores.length > 0) {
      console.log('❌ FRONTEND - Errores de validación:', errores);
      setValidationErrors(errores);
      setShowValidationModal(true);
      return;
    }

    try {
      console.log('🚀 FRONTEND - Iniciando creación de orden como nueva');
      
      // Obtener el próximo número de orden
      const responseProximo = await fetch(`${apiUrl}/api/ordenTrabajo/proximoNumero`);
      if (!responseProximo.ok) {
        throw new Error("Error al obtener el próximo número de orden");
      }
      const dataProximo = await responseProximo.json();
      const nuevoNumeroOrden = dataProximo.proximoNumero;
      
      console.log('✅ FRONTEND - Próximo número obtenido:', nuevoNumeroOrden);
      
      const dataToSend = {
        // Datos generales
        nombre_cliente,
        contacto: direccion_cliente,
        email: email_cliente,
        telefono: telefono_cliente,
        cantidad,
        concepto,
        fecha_creacion: fechaCreacion || null,
        fecha_entrega: fechaEntrega || null,
        estado: 'pendiente', // Nueva orden siempre pendiente
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
      };
      
      console.log('📤 FRONTEND - Datos a enviar para nueva orden:', dataToSend);
      
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/crearOrdenTrabajo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend)
      });
      
      console.log('📥 FRONTEND - Respuesta recibida:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ FRONTEND - Error en respuesta:', errorData);
        throw new Error("Error al crear la nueva orden");
      }
      
      const data = await response.json();
      console.log('✅ FRONTEND - Nueva orden creada exitosamente:', data);
      
      setOrdenGuardadaNumero(data.numero_orden);
      setShowSuccessModal(true);
      
      // Notificación global para todos los usuarios
      window.dispatchEvent(new CustomEvent("nueva-notificacion", {
        detail: {
          titulo: "Nueva orden de trabajo",
          mensaje: `Se ha creado la orden de trabajo N° ${data.numero_orden} como nueva`,
          fecha: new Date().toLocaleString()
        }
      }));
    } catch (error) {
      console.error('❌ FRONTEND - Error en catch:', error);
      alert("Ocurrió un error al crear la nueva orden de trabajo.");
    }
  };

  return (
    <>
      {/* Modal de selección de tipo de orden (solo creación) */}
      {showTipoOrdenModal && !ordenId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Selecciona el tipo de orden</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => { setTipoOrdenSeleccionado('prensa'); setShowTipoOrdenModal(false); }}
              >
                Prensa
              </button>
              <button
                className="px-4 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                onClick={() => { setTipoOrdenSeleccionado('digital'); setShowTipoOrdenModal(false); }}
              >
                Digital
              </button>
            </div>
            
          </div>
        </div>
      )}
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-4">
          {/* Encabezado */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-shrink-0">
                <Logo/>
              </div>
              <h2 className="text-xl font-bold text-gray-800 flex-1 text-center">
                Orden de Trabajo
              </h2>
              <div className="flex-shrink-0">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">Estado:</label>
                                     <select 
                     className="border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm"
                     value={estado}
                     onChange={(e) => setEstado(e.target.value)}
                   >
                     <option value="pendiente">Pendiente</option>
                     <option value="En Proceso">En Proceso</option>
                     <option value="En Impresión">En Impresión</option>
                     <option value="En Acabados">En Acabados</option>
                     <option value="En Empacado">En Empacado</option>
                     <option value="Listo para Entrega">Listo para Entrega</option>
                     <option value="Entregado">Entregado</option>
                     <option value="Facturado">Facturado</option>
                     <option value="Cancelado">Cancelado</option>
                   </select>
                </div>
              </div>
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
                 <button type="button" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors" onClick={crearOrdenTrabajo}>
                   Crear Orden
                 </button>
               ) : (
                 <>
                                       <button
                      type="button"
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors"
                      onClick={confirmarCrearComoNueva}
                    >
                      Crear como Nueva
                    </button>
                    <button
                      type="button"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
                      onClick={confirmarActualizacion}
                    >
                      Actualizar Orden
                    </button>
                 </>
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
             <h3 className="text-lg font-semibold mb-2 text-green-700">
               {ordenId ? '¡Orden actualizada exitosamente!' : '¡Orden guardada exitosamente!'}
             </h3>
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

        {/* Modal de confirmación para Actualizar Orden */}
        {showConfirmUpdateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
              <h3 className="text-lg font-semibold mb-4 text-blue-700">
                ¿Confirmar actualización?
              </h3>
              <p className="mb-6 text-gray-700">
                ¿Estás seguro de que deseas actualizar la orden de trabajo N° <span className="font-bold">{numero_orden}</span>?
                <br />
                <span className="text-sm text-gray-600">Esta acción no se puede deshacer.</span>
              </p>
              <div className="flex justify-center gap-4">
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors"
                  onClick={() => setShowConfirmUpdateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
                  onClick={ejecutarActualizacion}
                >
                  Sí, Actualizar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para Crear como Nueva */}
        {showConfirmCreateNewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
              <h3 className="text-lg font-semibold mb-4 text-green-700">
                ¿Crear como nueva orden?
              </h3>
              <p className="mb-6 text-gray-700">
                ¿Estás seguro de que deseas crear una nueva orden basada en la orden N° <span className="font-bold">{numero_orden}</span>?
                <br />
                <span className="text-sm text-gray-600">
                  Se creará una nueva orden con un nuevo número, manteniendo todos los datos actuales.
                </span>
              </p>
              <div className="flex justify-center gap-4">
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors"
                  onClick={() => setShowConfirmCreateNewModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors"
                  onClick={ejecutarCrearComoNueva}
                >
                  Sí, Crear Nueva
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

export default OrdendeTrabajoEditar;


