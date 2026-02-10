import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';
import Logo from "../../components/Logo";
import SelectorPrensa from '../../components/SelectorPrensa';
import FormularioOrdenOffset from '../../components/FormularioOrdenOffset';
import FormularioOrdenDigital from '../../components/FormularioOrdenDigital';
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
  const [contacto, setContacto] = useState<string>(''); // Nombre de la persona de contacto
  const [numero_cotizacion, setNumero_cotizacion] = useState<string>('');
  const [orden_compra, setOrden_compra] = useState<string>('');
  const [ordenData, setOrdenData] = useState<OrdenData | null>(null);
  const [fechaCreacion, setFechaCreacion] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [telefono_cliente, setTelefono_cliente] = useState<string>('');
  const [email_cliente, setEmail_cliente] = useState<string>('');
  const [direccion_cliente, setDireccion_cliente] = useState<string>(''); // Dirección física (no se muestra en formulario)
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
  
  // Estados adicionales para responsables de orden DIGITAL
  const [laminadoBarnizado, setLaminadoBarnizado] = useState<string>('');
  const [troquelado, setTroquelado] = useState<string>('');
  const [liberacionProducto, setLiberacionProducto] = useState<string>('');

  // Estados para cantidad final de cada responsable
  const [vendedorCantidadFinal, setVendedorCantidadFinal] = useState<string>('');
  const [preprensaCantidadFinal, setPreprensaCantidadFinal] = useState<string>('');
  const [prensaCantidadFinal, setPrensaCantidadFinal] = useState<string>('');
  const [laminadoBarnizadoCantidadFinal, setLaminadoBarnizadoCantidadFinal] = useState<string>('');
  const [troqueladoCantidadFinal, setTroqueladoCantidadFinal] = useState<string>('');
  const [terminadosCantidadFinal, setTerminadosCantidadFinal] = useState<string>('');
  const [liberacionProductoCantidadFinal, setLiberacionProductoCantidadFinal] = useState<string>('');

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

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmUpdateModal, setShowConfirmUpdateModal] = useState(false);
  const [showConfirmCreateNewModal, setShowConfirmCreateNewModal] = useState(false);
  const [ordenGuardadaNumero, setOrdenGuardadaNumero] = useState<string | null>(null);
  const [idDetalleCotizacion, setIdDetalleCotizacion] = useState<number | null>(null);
  const [showClientesModal, setShowClientesModal] = useState(false);
  const [clientesSugeridos, setClientesSugeridos] = useState<any[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteIdSeleccionado, setClienteIdSeleccionado] = useState<number | null>(null);

  const { cotizacionId, ordenId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showTipoOrdenModal, setShowTipoOrdenModal] = useState<boolean>(false);
  const [tipoOrdenSeleccionado, setTipoOrdenSeleccionado] = useState<string | null>(null); // 'prensa' | 'digital'

  // Estados específicos para formulario DIGITAL
  const [productosDigital, setProductosDigital] = useState<any[]>([]);
  const [adherencia, setAdherencia] = useState<string>('');
  const [materialDigital, setMaterialDigital] = useState<string>('');
  const [impresionDigital, setImpresionDigital] = useState<string>('');
  const [tipoImpresion, setTipoImpresion] = useState<string>('');
  const [troquel, setTroquel] = useState<string>('');
  const [codigoTroquel, setCodigoTroquel] = useState<string>('');
  const [loteMaterial, setLoteMaterial] = useState<string>('');
  const [loteProduccion, setLoteProduccion] = useState<string>('');
  const [terminadoEtiqueta, setTerminadoEtiqueta] = useState<string>('');
  const [terminadosEspeciales, setTerminadosEspeciales] = useState<string>('');
  const [cantidadPorRollo, setCantidadPorRollo] = useState<string>('');
  const [observacionesDigital, setObservacionesDigital] = useState<string>('');
  const [numeroSalida, setNumeroSalida] = useState<string>('');

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
      setContacto('');
      setNumero_cotizacion('');
      setOrden_compra('');
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
      // Limpiar campos adicionales responsables digital
      setLaminadoBarnizado('');
      setTroquelado('');
      setLiberacionProducto('');
      // Limpiar cantidades finales
      setVendedorCantidadFinal('');
      setPreprensaCantidadFinal('');
      setPrensaCantidadFinal('');
      setLaminadoBarnizadoCantidadFinal('');
      setTroqueladoCantidadFinal('');
      setTerminadosCantidadFinal('');
      setLiberacionProductoCantidadFinal('');
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
    // MODO EDICIÓN: cargar datos de una orden existente
    if (ordenId) {
      // Modo edición: cargar datos de una orden existente
      const token = localStorage.getItem('token');
      fetch(`${apiUrl}/api/ordenTrabajo/orden/${ordenId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Error al cargar la orden');
          }
          return res.json();
        })
        .then((data) => {
          console.log('📦 Datos de orden cargados para edición:', data);
          setOrdenData(data);
          // Establecer el tipo de orden cuando se carga para edición
          if (data.tipo_orden) {
            console.log('🔧 Estableciendo tipo de orden para edición:', data.tipo_orden);
            setTipoOrdenSeleccionado(data.tipo_orden);
          }
        })
        .catch((error) => {
          console.error("Error al cargar orden existente:", error);
          toast.error('Error al cargar la orden');
        });
    } else if (cotizacionId) {
      // NUEVO: Si hay cotizacionId, cargar datos del cliente y cotización
      console.log('🔍 Detectado cotizacionId, cargando datos...', cotizacionId);
      
      // Si viene producto por state, usarlo para inicializar concepto y cantidad
      if (location.state?.producto) {
        const producto = location.state.producto;
        setConcepto(producto.detalle || '');
        setCantidad(producto.cantidad ? String(producto.cantidad) : '');
        if (location.state.id_detalle_cotizacion) {
          setIdDetalleCotizacion(location.state.id_detalle_cotizacion);
        }
        
        // Si es orden digital, inicializar el primer producto con datos de la cotización
        // El usuario puede editarlo o agregar más productos
        if (location.state?.tipoOrden === 'digital') {
          console.log('🔧 Inicializando producto digital desde cotización:', producto);
          setProductosDigital([{
            cantidad: producto.cantidad ? String(producto.cantidad) : '',
            cod_mg: '',
            cod_cliente: '',
            producto: producto.detalle || '',
            avance: '',
            medida_ancho: '',
            medida_alto: '',
            cavidad: '',
            metros_impresos: ''
          }]);
        }
      }
      
      // Cargar datos del cliente y cotización desde el backend
      const token = localStorage.getItem('token');
      fetch(`${apiUrl}/api/ordenTrabajo/datosCotizacion/${cotizacionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error al cargar cotización: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log('📦 Datos de cotización recibidos:', data);
          // Setear ordenData para que no se quede en "Cargando..."
          setOrdenData(data);
          // Setear TODOS los datos del cliente
          // IMPORTANTE: Usar empresa_cliente para el campo nombre_cliente
          setNombre_cliente(data.empresa_cliente || data.nombre_cliente || '');
          setContacto(data.nombre_cliente || ''); // Nombre de la persona de contacto
          setNumero_cotizacion(data.numero_cotizacion || '');
          setTelefono_cliente(data.telefono_cliente || '');
          setEmail_cliente(data.email_cliente || '');
          setDireccion_cliente(data.direccion_cliente || '');
          // Obtener el próximo número de orden
          return fetch(`${apiUrl}/api/ordenTrabajo/proximoNumero`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        })
        .then(res => res?.json())
        .then(data => {
          if (data) {
            console.log('🔢 Próximo número de orden:', data.proximoNumero);
            setNumero_orden(data.proximoNumero);
          }
        })
        .catch((error) => {
          console.error("❌ Error al cargar datos de cotización:", error);
          // En caso de error, setear un objeto vacío para que no se quede cargando
          setOrdenData({});
          toast.error('Error al cargar datos de la cotización');
        });
    } else {
      // Si no hay cotización, inicializar estados vacíos para crear orden nueva
      setOrdenData(null);
      setConcepto('');
      setNombre_cliente('');
      setContacto('');
      setNumero_cotizacion('');
      setOrden_compra('');
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
    }
    
    // SIEMPRE sincronizar campos técnicos (sin importar si hay producto seleccionado)
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
       
      // Sincronizar campos comunes para ambos tipos
      setPrensaSeleccionada(ordenData.detalle?.prensa_seleccionada || '');
      setNumeroSalida(ordenData.detalle?.numero_salida || '');
      
      // Sincronizar campos específicos de OFFSET
      if (ordenData.tipo_orden === 'offset' || !ordenData.tipo_orden) {
        // Material, impresion, observaciones para offset
        setMaterial(ordenData.detalle?.material || '');
        setImpresion(ordenData.detalle?.impresion || '');
        setObservaciones(ordenData.detalle?.observaciones || '');
        
        // Otros campos offset
        setCorteMaterial(ordenData.detalle?.corte_material || '');
        setCantidadPliegosCompra(ordenData.detalle?.cantidad_pliegos_compra || '');
        setExceso(ordenData.detalle?.exceso || '');
        setTotalPliegos(ordenData.detalle?.total_pliegos || '');
        setTamano(ordenData.detalle?.tamano || '');
        setTamanoAbierto1(ordenData.detalle?.tamano_abierto_1 || '');
        setTamanoCerrado1(ordenData.detalle?.tamano_cerrado_1 || '');
        setInstruccionesImpresion(ordenData.detalle?.instrucciones_impresion || '');
        setInstruccionesAcabados(ordenData.detalle?.instrucciones_acabados || '');
        setInstruccionesEmpacado(ordenData.detalle?.instrucciones_empacado || '');
      }
      
      // Sincronizar campos específicos para órdenes digitales
      if (ordenData.tipo_orden === 'digital') {
        console.log('🔧 Sincronizando campos digitales del detalle:', ordenData.detalle);
        console.log('🔍 productos_digital RAW:', ordenData.detalle?.productos_digital);
        console.log('🔍 tipo de productos_digital:', typeof ordenData.detalle?.productos_digital);
        
        // Material, impresion, observaciones para digital (estados específicos)
        setMaterialDigital(ordenData.detalle?.material || '');
        setImpresionDigital(ordenData.detalle?.impresion || '');
        setObservacionesDigital(ordenData.detalle?.observaciones || '');
        
        // Campos técnicos digitales
        setAdherencia(ordenData.detalle?.adherencia || '');
        setLoteMaterial(ordenData.detalle?.lote_material || '');
        setLoteProduccion(ordenData.detalle?.lote_produccion || '');
        setTipoImpresion(ordenData.detalle?.tipo_impresion || '');
        setTroquel(ordenData.detalle?.troquel || '');
        setCodigoTroquel(ordenData.detalle?.codigo_troquel || '');
        setTerminadoEtiqueta(ordenData.detalle?.terminado_etiqueta || '');
        setTerminadosEspeciales(ordenData.detalle?.terminados_especiales || '');
        setCantidadPorRollo(ordenData.detalle?.cantidad_por_rollo || '');

        
        // Sincronizar productos digitales
        if (ordenData.detalle?.productos_digital) {
          try {
            const productos = typeof ordenData.detalle.productos_digital === 'string' 
              ? JSON.parse(ordenData.detalle.productos_digital)
              : ordenData.detalle.productos_digital;
            console.log('📦 Productos digitales parseados:', productos);
            console.log('📦 Es array?:', Array.isArray(productos));
            console.log('📦 Cantidad de productos:', Array.isArray(productos) ? productos.length : 'N/A');
            // Asegurar que siempre sea un array
            setProductosDigital(Array.isArray(productos) ? productos : []);
          } catch (e) {
            console.error('❌ Error al parsear productos digitales:', e);
            console.error('❌ Valor que causó error:', ordenData.detalle?.productos_digital);
            setProductosDigital([]);
          }
        } else {
          // Si no hay productos, establecer array vacío
          console.log('⚠️ No hay productos_digital en el detalle');
          setProductosDigital([]);
        }
      }
    }
    
    // IMPORTANTE: Usar empresa_cliente para el campo nombre_cliente
    setNombre_cliente(ordenData.empresa_cliente || ordenData.nombre_cliente || '');
    setContacto(ordenData.contacto || ordenData.nombre_cliente || ''); // Nombre de la persona de contacto
    setNumero_cotizacion(ordenData.numero_cotizacion || '');
    setOrden_compra(ordenData.orden_compra || '');
    setTelefono_cliente(ordenData.telefono_cliente || ordenData.telefono || '');
    setEmail_cliente(ordenData.email_cliente || ordenData.email || '');
    setDireccion_cliente(ordenData.direccion_cliente || '');
    
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
      facturado: ordenData.facturado,
      laminado_barnizado: ordenData.laminado_barnizado,
      troquelado: ordenData.troquelado,
      liberacion_producto: ordenData.liberacion_producto
    });
    
    setVendedor(ordenData.vendedor || '');
    setPreprensa(ordenData.preprensa || '');
    setPrensa(ordenData.prensa || '');
    setTerminados(ordenData.terminados || '');
    setFacturado(ordenData.facturado || '');
    
    // Sincronizar cantidades finales de cada responsable
    setVendedorCantidadFinal(ordenData.vendedor_cantidad_final || '');
    setPreprensaCantidadFinal(ordenData.preprensa_cantidad_final || '');
    setPrensaCantidadFinal(ordenData.prensa_cantidad_final || '');
    setLaminadoBarnizadoCantidadFinal(ordenData.laminado_barnizado_cantidad_final || '');
    setTroqueladoCantidadFinal(ordenData.troquelado_cantidad_final || '');
    setTerminadosCantidadFinal(ordenData.terminados_cantidad_final || '');
    setLiberacionProductoCantidadFinal(ordenData.liberacion_producto_cantidad_final || '');
    
    // Sincronizar campos adicionales para orden digital
    if (ordenData.tipo_orden === 'digital') {
      setLaminadoBarnizado(ordenData.laminado_barnizado || '');
      setTroquelado(ordenData.troquelado || '');
      setLiberacionProducto(ordenData.liberacion_producto || '');
    }
    
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

  // Función para cargar todos los clientes para el modal
  const cargarTodosLosClientes = async () => {
    setLoadingClientes(true);
    try {
      const token = localStorage.getItem("token");
      console.log('🔍 Cargando todos los clientes...');
      
      const res = await fetch(`${apiUrl}/api/clientes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('✅ Clientes cargados:', data.length);
      
      // Normalizar los datos para que tengan los campos esperados
      const clientesNormalizados = data.map((cliente: any) => ({
        id: cliente.id,
        nombre_cliente: cliente.nombre || cliente.nombre_cliente,
        email_cliente: cliente.email || cliente.email_cliente,
        empresa: cliente.empresa || cliente.empresa_cliente || '-',
        telefono: cliente.telefono || cliente.telefono_cliente || '-',
        direccion_cliente: cliente.direccion || cliente.direccion_cliente || ''
      }));
      
      setClientesSugeridos(clientesNormalizados);
    } catch (error) {
      console.error('❌ Error al cargar clientes:', error);
      setClientesSugeridos([]);
    } finally {
      setLoadingClientes(false);
    }
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
      orden_compra,
      contacto: contacto,
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
      // Campos adicionales para orden digital
      ...(tipoOrdenSeleccionado === 'digital' && {
        laminado_barnizado: laminadoBarnizado,
        troquelado: troquelado,
        liberacion_producto: liberacionProducto,
        // Cantidades finales para responsables
        vendedor_cantidad_final: vendedorCantidadFinal,
        preprensa_cantidad_final: preprensaCantidadFinal,
        prensa_cantidad_final: prensaCantidadFinal,
        laminado_barnizado_cantidad_final: laminadoBarnizadoCantidadFinal,
        troquelado_cantidad_final: troqueladoCantidadFinal,
        terminados_cantidad_final: terminadosCantidadFinal,
        liberacion_producto_cantidad_final: liberacionProductoCantidadFinal
      }),
      id_cotizacion: cotizacionId || null,
      id_detalle_cotizacion: idDetalleCotizacion,
      tipo_orden: tipoOrdenSeleccionado || 'offset', // Agregar tipo de orden
      // Detalle técnico (depende del tipo de orden)
      detalle: tipoOrdenSeleccionado === 'digital' ? {
        // Datos específicos de digital
        productos_digital: productosDigital, // ⭐ Enviar array directamente, NO JSON.stringify
        adherencia,
        material: materialDigital,
        impresion: impresionDigital,
        tipo_impresion: tipoImpresion,
        troquel,
        codigo_troquel: codigoTroquel,
        lote_material: loteMaterial,
        lote_produccion: loteProduccion,
        terminado_etiqueta: terminadoEtiqueta,
        terminados_especiales: terminadosEspeciales,
        cantidad_por_rollo: cantidadPorRollo,
        numero_salida: numeroSalida,
        observaciones: observacionesDigital
      } : {
        // Datos específicos de offset
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
          orden_compra,
          contacto: contacto,
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
          // Campos adicionales para orden digital
          ...(tipoOrdenSeleccionado === 'digital' && {
            laminado_barnizado: laminadoBarnizado,
            troquelado: troquelado,
            liberacion_producto: liberacionProducto,
            // Cantidades finales para responsables
            vendedor_cantidad_final: vendedorCantidadFinal,
            preprensa_cantidad_final: preprensaCantidadFinal,
            prensa_cantidad_final: prensaCantidadFinal,
            laminado_barnizado_cantidad_final: laminadoBarnizadoCantidadFinal,
            troquelado_cantidad_final: troqueladoCantidadFinal,
            terminados_cantidad_final: terminadosCantidadFinal,
            liberacion_producto_cantidad_final: liberacionProductoCantidadFinal
          }),
          tipo_orden: tipoOrdenSeleccionado || 'offset', // Agregar tipo de orden
          // Detalle técnico (depende del tipo de orden)
          detalle: tipoOrdenSeleccionado === 'digital' ? {
            // Datos específicos de digital
            productos_digital: productosDigital, // ⭐ Enviar array directamente, NO JSON.stringify
            adherencia,
            material: materialDigital,
            impresion: impresionDigital,
            tipo_impresion: tipoImpresion,
            troquel,
            codigo_troquel: codigoTroquel,
            lote_material: loteMaterial,
            lote_produccion: loteProduccion,
            terminado_etiqueta: terminadoEtiqueta,
            terminados_especiales: terminadosEspeciales,
            cantidad_por_rollo: cantidadPorRollo,
            numero_salida: numeroSalida,
            observaciones: observacionesDigital
          } : {
            // Datos específicos de offset
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
        orden_compra,
        contacto: contacto,
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
        // Campos adicionales para orden digital
        ...(tipoOrdenSeleccionado === 'digital' && {
          laminado_barnizado: laminadoBarnizado,
          troquelado: troquelado,
          liberacion_producto: liberacionProducto
        }),
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
              {/* Primera columna: Orden, Cotización y Orden de Compra */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">Orden N°:</label>
                  <input
                    className="border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm w-32"
                    type="text"
                    value={numero_orden}
                    readOnly
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">Cotización N°:</label>
                  <input 
                    className="border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm w-28" 
                    type="text" 
                    value={String(numero_cotizacion).padStart(6, '0')}
                    onChange={(e) => setNumero_cotizacion(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">Orden de Compra:</label>
                  <input 
                    className="border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm w-32" 
                    type="text" 
                    value={orden_compra}
                    onChange={(e) => setOrden_compra(e.target.value)}
                    placeholder="Nº O.C."
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
                   <div className="flex items-center justify-between mb-1">
                     <label className="text-sm font-semibold text-gray-700">Cliente:</label>
                     <button
                       type="button"
                       onClick={() => {
                         setShowClientesModal(true);
                         cargarTodosLosClientes();
                       }}
                       className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                       title="Ver Clientes"
                     >
                       👥 Ver Clientes
                     </button>
                   </div>
                   <input 
                     className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm" 
                     type="text"  
                     value={nombre_cliente}
                     onChange={(e) => setNombre_cliente(e.target.value)}
                     placeholder="Ingrese el nombre del cliente..."
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-gray-700">Contacto:</label>
                   <input 
                     className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm" 
                     type="text" 
                     value={contacto} 
                     onChange={e => setContacto(e.target.value)}
                     placeholder="Nombre de la persona de contacto"
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

          {/* Renderizar formulario según tipo de orden */}
          {tipoOrdenSeleccionado === 'digital' ? (
            <FormularioOrdenDigital
              productos={productosDigital}
              setProductos={setProductosDigital}
              adherencia={adherencia}
              setAdherencia={setAdherencia}
              material={materialDigital}
              setMaterial={setMaterialDigital}
              impresion={impresionDigital}
              setImpresion={setImpresionDigital}
              tipoImpresion={tipoImpresion}
              setTipoImpresion={setTipoImpresion}
              troquel={troquel}
              setTroquel={setTroquel}
              codigoTroquel={codigoTroquel}
              setCodigoTroquel={setCodigoTroquel}
              loteMaterial={loteMaterial}
              setLoteMaterial={setLoteMaterial}
              loteProduccion={loteProduccion}
              setLoteProduccion={setLoteProduccion}
              terminadoEtiqueta={terminadoEtiqueta}
              setTerminadoEtiqueta={setTerminadoEtiqueta}
              terminadosEspeciales={terminadosEspeciales}
              setTerminadosEspeciales={setTerminadosEspeciales}
              cantidadPorRollo={cantidadPorRollo}
              setCantidadPorRollo={setCantidadPorRollo}
              observaciones={observacionesDigital}
              setObservaciones={setObservacionesDigital}
              numeroSalida={numeroSalida}
              setNumeroSalida={setNumeroSalida}
            />
          ) : (
            <FormularioOrdenOffset
              cantidad={cantidad}
              setCantidad={setCantidad}
              concepto={concepto}
              setConcepto={setConcepto}
              tamanoAbierto1={tamanoAbierto1}
              setTamanoAbierto1={setTamanoAbierto1}
              tamanoCerrado1={tamanoCerrado1}
              setTamanoCerrado1={setTamanoCerrado1}
              material={material}
              setMaterial={setMaterial}
              corteMaterial={corteMaterial}
              setCorteMaterial={setCorteMaterial}
              cantidadPliegosCompra={cantidadPliegosCompra}
              setCantidadPliegosCompra={setCantidadPliegosCompra}
              exceso={exceso}
              setExceso={setExceso}
              totalPliegos={totalPliegos}
              impresion={impresion}
              setImpresion={setImpresion}
              instruccionesImpresion={instruccionesImpresion}
              setInstruccionesImpresion={setInstruccionesImpresion}
              instruccionesAcabados={instruccionesAcabados}
              setInstruccionesAcabados={setInstruccionesAcabados}
              instruccionesEmpacado={instruccionesEmpacado}
              setInstruccionesEmpacado={setInstruccionesEmpacado}
              prensaSeleccionada={prensaSeleccionada}
              setPrensaSeleccionada={setPrensaSeleccionada}
              observaciones={observaciones}
              setObservaciones={setObservaciones}
              notasObservaciones={notasObservaciones}
              setNotasObservaciones={setNotasObservaciones}
            />
          )}

          {/* Responsables del Proceso - Diseño compacto */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Responsables del Proceso
            </h3>
            
            {tipoOrdenSeleccionado === 'digital' ? (
              // Responsables para orden DIGITAL con cantidad final
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Vendedor</label>
                  <input 
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-center mb-2" 
                    type="text" 
                    placeholder="Nombre" 
                    value={vendedor} 
                    onChange={e => setVendedor(e.target.value)} 
                  />
                  <input 
                    className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center text-sm" 
                    type="text" 
                    placeholder="Cant. Final" 
                    value={vendedorCantidadFinal} 
                    onChange={e => setVendedorCantidadFinal(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Pre-prensa</label>
                  <input 
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-center mb-2" 
                    type="text" 
                    placeholder="Responsable" 
                    value={preprensa} 
                    onChange={e => setPreprensa(e.target.value)} 
                  />
                  <input 
                    className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center text-sm" 
                    type="text" 
                    placeholder="Cant. Final" 
                    value={preprensaCantidadFinal} 
                    onChange={e => setPreprensaCantidadFinal(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Impresión</label>
                  <input 
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-center mb-2" 
                    type="text" 
                    placeholder="Responsable" 
                    value={prensa} 
                    onChange={e => setPrensa(e.target.value)} 
                  />
                  <input 
                    className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center text-sm" 
                    type="text" 
                    placeholder="Cant. Final" 
                    value={prensaCantidadFinal} 
                    onChange={e => setPrensaCantidadFinal(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Laminado/Barnizado</label>
                  <input 
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-center mb-2" 
                    type="text" 
                    placeholder="Responsable" 
                    value={laminadoBarnizado} 
                    onChange={e => setLaminadoBarnizado(e.target.value)} 
                  />
                  <input 
                    className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center text-sm" 
                    type="text" 
                    placeholder="Cant. Final" 
                    value={laminadoBarnizadoCantidadFinal} 
                    onChange={e => setLaminadoBarnizadoCantidadFinal(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Troquelado</label>
                  <input 
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-center mb-2" 
                    type="text" 
                    placeholder="Responsable" 
                    value={troquelado} 
                    onChange={e => setTroquelado(e.target.value)} 
                  />
                  <input 
                    className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center text-sm" 
                    type="text" 
                    placeholder="Cant. Final" 
                    value={troqueladoCantidadFinal} 
                    onChange={e => setTroqueladoCantidadFinal(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Terminados</label>
                  <input 
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-center mb-2" 
                    type="text" 
                    placeholder="Responsable" 
                    value={terminados} 
                    onChange={e => setTerminados(e.target.value)} 
                  />
                  <input 
                    className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center text-sm" 
                    type="text" 
                    placeholder="Cant. Final" 
                    value={terminadosCantidadFinal} 
                    onChange={e => setTerminadosCantidadFinal(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Liberación Producto</label>
                  <input 
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-center mb-2" 
                    type="text" 
                    placeholder="Responsable" 
                    value={liberacionProducto} 
                    onChange={e => setLiberacionProducto(e.target.value)} 
                  />
                  <input 
                    className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center text-sm" 
                    type="text" 
                    placeholder="Cant. Final" 
                    value={liberacionProductoCantidadFinal} 
                    onChange={e => setLiberacionProductoCantidadFinal(e.target.value)} 
                  />
                </div>
              </div>
            ) : (
              // Responsables para orden OFFSET (mantener los campos originales)
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
            )}
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

        {/* Modal de Clientes */}
        {showClientesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Seleccionar Cliente</h2>
                <button
                  onClick={() => {
                    setShowClientesModal(false);
                    setBusquedaCliente('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {/* Buscador */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Buscar por nombre, empresa o correo..."
                  value={busquedaCliente}
                  onChange={(e) => setBusquedaCliente(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              
              {/* Lista de Clientes */}
              <div className="overflow-y-auto max-h-96">
                {loadingClientes ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-500">Cargando clientes...</div>
                  </div>
                ) : clientesSugeridos.length === 0 ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-500">No se encontraron clientes</div>
                  </div>
                ) : (
                  <table className="min-w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left border-b">Nombre</th>
                        <th className="px-4 py-2 text-left border-b">Empresa</th>
                        <th className="px-4 py-2 text-left border-b">Correo</th>
                        <th className="px-4 py-2 text-left border-b">Teléfono</th>
                        <th className="px-4 py-2 text-center border-b">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesSugeridos
                        .filter((cliente: any) => 
                          cliente.nombre_cliente?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
                          cliente.empresa?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
                          cliente.email_cliente?.toLowerCase().includes(busquedaCliente.toLowerCase())
                        )
                        .map((cliente: any) => (
                          <tr 
                            key={cliente.id} 
                            className="hover:bg-blue-50 cursor-pointer transition-colors"
                            onClick={() => {
                              // Seleccionar el cliente y cerrar el modal
                              setNombre_cliente(cliente.empresa_cliente || cliente.empresa || cliente.nombre_cliente);
                              setContacto(cliente.nombre_cliente || '');
                              setTelefono_cliente(cliente.telefono_cliente || cliente.telefono || '');
                              setEmail_cliente(cliente.email_cliente || '');
                              setDireccion_cliente(cliente.direccion_cliente || '');
                              setClienteIdSeleccionado(cliente.id);
                              setShowClientesModal(false);
                              setBusquedaCliente('');
                            }}
                          >
                            <td className="px-4 py-2 border-b">{cliente.nombre_cliente}</td>
                            <td className="px-4 py-2 border-b">{cliente.empresa}</td>
                            <td className="px-4 py-2 border-b">{cliente.email_cliente}</td>
                            <td className="px-4 py-2 border-b">{cliente.telefono || '-'}</td>
                            <td className="px-4 py-2 border-b text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm pointer-events-none"
                              >
                                Seleccionar
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setShowClientesModal(false);
                    setBusquedaCliente('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cerrar
                </button>
              </div>
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


