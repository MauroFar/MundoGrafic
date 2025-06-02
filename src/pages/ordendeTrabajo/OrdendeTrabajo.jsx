import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../components/Logo";
import "../../styles/ordenTrabajo/OrdenTrabajo.css";

const OrdendeTrabajoEditar = () => {
  
  const [concepto, setConcepto] = useState('');
  const [nombre_cliente, setNombre_cliente] = useState('');
  const [numero_cotizacion, setNumero_cotizacion] = useState('');
  const [ordenData, setOrdenData] = useState(null);
  const [fechaCreacion, setFechaCreacion] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const { cotizacionId, ordenId } = useParams();


  const apiUrl = import.meta.env.VITE_API_URL;

  // Detectar si hay cotizacionId o no para saber qué hacer
  useEffect(() => {
    if(ordenId){
       // Modo edición: cargar datos de una orden existente
    fetch(`${apiUrl}/api/ordenTrabajo/orden/${ordenId}`)
      .then((res) => res.json())
      .then((data) => setOrdenData(data))
      .catch((error) => console.error("Error al cargar orden existente:", error));
    }
    else if (cotizacionId) {
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
  }, [cotizacionId]);

  // Sincronizar estados individuales con ordenData cuando cambia
useEffect(() => {
  if (ordenData) {
     console.log("Datos recibidos de backend:", ordenData);  // <-- Aquí
    setConcepto(ordenData.concepto || '');
    setNombre_cliente(ordenData.nombre_cliente || '');
    setNumero_cotizacion(ordenData.numero_cotizacion || '');
  }
}, [ordenData]);


 
  if (cotizacionId && !ordenData) {
    return <p>Cargando orden de trabajo...</p>;
  }

  // Función para crear orden de trabajo (funciona con o sin cotización)
 const crearOrdenTrabajo = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/ordenTrabajo/crearOrdenTrabajo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre_cliente,
        concepto,
        id_cotizacion: cotizacionId || null,
        fecha_creacion: fechaCreacion,
      }),
    });

    if (!response.ok) {
      // Si hay error 500 u otro
      const errorText = await response.text();  // captura el mensaje si existe
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }

    const data = await response.json(); // <-- esto sí funcionará si la respuesta es válida
    console.log("Orden creada:", data);

    // Mostrar alerta con número de orden
    alert(`Orden numero: ${data.numero_orden} guardada exitosamente`);

  } catch (error) {
    console.error("Error en la solicitud:", error);
    alert("Ocurrió un error al guardar la orden de trabajo.");
  }
};


const editarOrdenTrabajo = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/ordenTrabajo/editarOrden/${ordenId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre_cliente,
        concepto,
        fechaCreacion,
        
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al editar la orden de trabajo");
    }

    console.log("Orden actualizada:", data);
    // Redirige o muestra notificación de éxito
  } catch (error) {
    console.error("Error al actualizar la orden:", error.message);
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

          {/* Campo Estado a la derecha */}
          <div className="flex-shrink-0 w-40 flex items-center justify-end gap-2">
            <label htmlFor="estado" className="font-semibold text-gray-600">
              Estado:
            </label>
            <input
              id="estado"
              type="text"
              className="border border-gray-300 rounded-md p-1 w-24 text-gray-700 text-sm"
            />
          </div>
        </div>

        {/* Información General */}
        <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex gap-4 items-center">
<div className="flex items-center gap-2">
  <p className="font-semibold text-gray-600">Orden N°:</p>
  <input
    className="border border-gray-300 rounded-md p-1 w-20 text-gray-700 text-sm"
    type="text"
    
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
    <input className="border border-gray-300 rounded-md p-1 w-15 text-gray-700 text-sm" type="date"   value={fechaCreacion}
  onChange={(e) => setFechaCreacion(e.target.value)} />
  </div>
   
  <div className="flex items-center gap-2">
    <p className="font-semibold text-gray-600">Fecha Entrega:</p>
    <input className="border border-gray-300 rounded-md p-1 w-25 text-gray-700 text-sm" type="date" />
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
            <input className="border border-gray-300 rounded-md p-1 w-full text-gray-700 text-sm" type="text" />
          </div>
          <div>
            <p className="font-semibold text-gray-600">Contacto</p>
            <input className="border border-gray-300 rounded-md p-1 w-full text-gray-700 text-sm" type="text" />
            <p className="font-semibold text-gray-600">Email</p>
            <input className="border border-gray-300 rounded-md p-1 w-full text-gray-700 text-sm" type="text" />
          </div>
       
</div>
        {/* Información Trabajo */}
          <h3 className="font-bold text-lg text-gray-800 mb-2">Información del Trabajo</h3>
        
<div className="flex flex-wrap gap-4 mb-4">
  <div className="flex flex-col basis-1/12">
    <p className="font-semibold text-gray-600">Cantidad:</p>
    <input className="border border-gray-300 rounded-md p-1 text-gray-700 text-sm w-full" type="text" />
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
      <input className="input-field" type="text" />
    </div>

    <div>
      <p className="text-sm text-gray-600">Prensa:</p>
      <input className="input-field" type="text" />
    </div>

    <div>
      <p className="text-sm text-gray-600">Vel x Hora:</p>
      <input className="input-field" type="text" />
    </div>
  <div className="flex flex-col basis-4/12 gap-2">
    

    <div>
      <p className="text-sm text-gray-600">Calibre:</p>
      <input className="input-field" type="text" />
    </div>

    <div>
      <p className="text-sm text-gray-600">Referencia:</p>
      <input className="input-field" type="text" />
    </div>

    <div>
      <p className="text-sm text-gray-600">Gramos:</p>
      <input className="input-field" type="text" />
    </div>

    <div>
      <p className="text-sm text-gray-600">Tamaño:</p>
      <input className="input-field" type="text" />
    </div>

    <div>
      <p className="text-sm text-gray-600">Cantidad Colores:</p>
      <input className="input-field" type="text" />
    </div>

    <div>
      <p className="text-sm text-gray-600">Cantidad Pliegos:</p>
      <input className="input-field" type="text" />
    </div>

    <div>
      <p className="text-sm text-gray-600">Exceso:</p>
      <input className="input-field" type="text" />   
    </div>
  </div>
  

  {/* Columna 2: Guillotina */}
  <div className="flex flex-col basis-4/12 gap-2">
    <p className="font-semibold text-gray-700 underline">Guillotina</p>
    
    <div>
      <p className="text-sm text-gray-600">Pliegos a Cortar:</p>
      <input className="input-field" type="text" />
    </div>

    <div>
      <p className="text-sm text-gray-600">Tamaño de Corte:</p>
      <input className="input-field" type="text" />
    </div>

    <div>
      <p className="text-sm text-gray-600">Cabida Corte:</p>
      <input className="input-field" type="text" />
    </div>
  </div>

  {/* Columna 3: Prensas */}
  <div className="flex flex-col basis-3/12 gap-2">
    <p className="font-semibold text-gray-700 underline">Prensas</p>
    
    <div>
      <p className="text-sm text-gray-600">Pliegos a Imprimir:</p>
      <input className="input-field" type="text" />
    </div>

    <div>
      <p className="text-sm text-gray-600">Cabida Impresión:</p>
      <input className="input-field" type="text" />
    </div>

    <div>
      <p className="text-sm text-gray-600">Total Impresión:</p>
      <input className="input-field" type="text" />
    </div>
  </div>
</div>


        {/* Notas y Observaciones */}
        <h3 className="font-bold text-lg text-gray-800 mb-2">Notas y Observaciones</h3>
        <textarea className="border border-gray-300 p-2 rounded-md w-full h-24 text-sm text-gray-700 mb-4" placeholder="Añadir notas u observaciones aquí..."></textarea>
      <div className="flex justify-between gap-4 mb-2 p-0">
  {/* Vendedor */}
  <div className="flex flex-col items-start text-center w-1/5">
    <p className="font-semibold text-xs text-gray-700 underline mb-1">Vendedor</p>
    <input className="input-field text-xs w-full" type="text" placeholder="Nombre" />
  </div>

  {/* Preprensa */}           
  <div className="flex flex-col items-start text-center w-1/5">
    <p className="font-semibold text-xs text-gray-700 underline mb-1">Preprensa</p>
    <input className="input-field text-xs w-full" type="text" placeholder="Responsable" />
  </div>

  {/* Prensa */}
  <div className="flex flex-col items-start text-center w-1/5">
    <p className="font-semibold text-xs text-gray-700 underline mb-1">Prensa</p>
    <input className="input-field text-xs w-full" type="text" placeholder="Responsable" />
  </div>

  {/* Terminados */}
  <div className="flex flex-col items-start text-center w-1/5">
    <p className="font-semibold text-xs text-gray-700 underline mb-1">Terminados</p>
    <input className="input-field text-xs w-full" type="text" placeholder="Responsable" />
  </div>

  {/* Facturado */}
  <div className="flex flex-col items-start text-center w-1/5">
    <p className="font-semibold text-xs text-gray-700 underline mb-1">Facturado</p>
    <input className="input-field text-xs w-full" type="text" placeholder="Sí / No" />
  </div>
</div>

  
      </div>
    </div>
          {/* Botones */}
        <div className="flex justify-end gap-4 mb-4 botones-opcion">
             <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => window.print()}>Imprimir</button>
          {!ordenId ? ( 
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={crearOrdenTrabajo}>Crear Orden</button>
          ):(          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={editarOrdenTrabajo}>Editar Orden</button>
)}
          <button className="bg-red-500 text-white px-4 py-2 rounded">Cancelar</button>
        
        </div>
    </>
  );
};

export default OrdendeTrabajoEditar;
