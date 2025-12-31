import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import ItemEditorModal from './ItemEditorModal';
import '../../styles/cotizaciones/CotizacionItems.css';

// 🎭 DATOS FICTICIOS - Para visualización
const MOCK_COTIZACION = {
  id: 1,
  numero: 'COT-001',
  cliente: 'AOG FOODS S.A.',
  fecha: '2024-04-15',
};

const MOCK_ITEMS_INICIAL = [
  {
    id: 1,
    tipo_trabajo: 'Carpetas',
    descripcion: 'Carpetas tamaño oficio',
    cantidad: 1000,
    tamano_cerrado: '24x33 cm',
    tamano_abierto: '48x33 cm',
    precio_unitario: 5.50,
    total: 5500.00,
    procesos: [
      { proceso: 'DISEÑO', cantidad: 1, precio_unitario: 500, subtotal: 500 },
      { proceso: 'PAPEL COUCHÉ 150g', cantidad: 1000, precio_unitario: 0.50, subtotal: 500 },
      { proceso: 'IMPRESIÓN CMYK', cantidad: 1000, precio_unitario: 2.00, subtotal: 2000 },
      { proceso: 'PLASTIFICADO', cantidad: 1000, precio_unitario: 0.80, subtotal: 800 },
      { proceso: 'UV SELECTIVO', cantidad: 1000, precio_unitario: 1.20, subtotal: 1200 },
    ]
  },
  {
    id: 2,
    tipo_trabajo: 'Folletos',
    descripcion: 'Folletos triptico tamaño carta',
    cantidad: 500,
    tamano_cerrado: '21.5x28 cm',
    tamano_abierto: '64.5x28 cm',
    precio_unitario: 3.20,
    total: 1600.00,
    procesos: [
      { proceso: 'DISEÑO', cantidad: 2, precio_unitario: 500, subtotal: 1000 },
      { proceso: 'PAPEL BOND 75g', cantidad: 500, precio_unitario: 0.20, subtotal: 100 },
      { proceso: 'IMPRESIÓN DIGITAL', cantidad: 500, precio_unitario: 1.00, subtotal: 500 },
    ]
  }
];

function CotizacionItems() {
  const [items, setItems] = useState(MOCK_ITEMS_INICIAL);
  const [showModal, setShowModal] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Calcular total general
  const totalGeneral = items.reduce((sum, item) => sum + item.total, 0);

  const handleAgregarItem = () => {
    setItemEditando(null);
    setShowModal(true);
  };

  const handleEditarItem = (item) => {
    setItemEditando(item);
    setShowModal(true);
  };

  const handleEliminarItem = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const confirmarEliminarItem = () => {
    setItems(items.filter(i => i.id !== itemToDelete.id));
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleGuardarItem = (itemData) => {
    if (itemEditando) {
      // Editar existente
      setItems(items.map(i => i.id === itemEditando.id ? { ...itemData, id: i.id } : i));
    } else {
      // Agregar nuevo
      const nuevoId = Math.max(...items.map(i => i.id), 0) + 1;
      setItems([...items, { ...itemData, id: nuevoId }]);
    }
    setShowModal(false);
    setItemEditando(null);
  };

  return (
    <div className="cotizacion-items-container">
      {/* Header de la cotización */}
      <div className="cotizacion-header">
        <div className="cotizacion-info">
          <h2>Cotización {MOCK_COTIZACION.numero}</h2>
          <p className="cliente-nombre">{MOCK_COTIZACION.cliente}</p>
          <p className="fecha-cotizacion">Fecha: {MOCK_COTIZACION.fecha}</p>
        </div>
        <div className="cotizacion-actions">
          <button className="btn-primary" onClick={handleAgregarItem}>
            <FaPlus /> Agregar Ítem
          </button>
        </div>
      </div>

      {/* Lista de ítems */}
      <div className="items-lista">
        {items.length === 0 ? (
          <div className="empty-state">
            <p>No hay ítems en esta cotización</p>
            <button className="btn-primary" onClick={handleAgregarItem}>
              <FaPlus /> Agregar primer ítem
            </button>
          </div>
        ) : (
          <div className="items-table-container">
            <table className="items-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Tipo de Trabajo</th>
                  <th>Descripción</th>
                  <th>Cantidad</th>
                  <th>Tamaño</th>
                  <th>Precio Unit.</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="item-row">
                    <td className="item-numero">{index + 1}</td>
                    <td className="item-tipo">{item.tipo_trabajo}</td>
                    <td className="item-descripcion">{item.descripcion}</td>
                    <td className="item-cantidad">{item.cantidad.toLocaleString()}</td>
                    <td className="item-tamano">
                      <div className="tamano-info">
                        <small>C: {item.tamano_cerrado}</small>
                        <small>A: {item.tamano_abierto}</small>
                      </div>
                    </td>
                    <td className="item-precio">${item.precio_unitario.toFixed(2)}</td>
                    <td className="item-total">${item.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td className="item-acciones">
                      <button 
                        className="btn-icon btn-edit"
                        onClick={() => handleEditarItem(item)}
                        title="Editar ítem"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn-icon btn-delete"
                        onClick={() => handleEliminarItem(item)}
                        title="Eliminar ítem"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan="6" className="total-label">TOTAL GENERAL</td>
                  <td className="total-value">${totalGeneral.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal de edición de ítem */}
      {showModal && (
        <ItemEditorModal
          item={itemEditando}
          onClose={() => {
            setShowModal(false);
            setItemEditando(null);
          }}
          onSave={handleGuardarItem}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-confirm">
            <h3>Confirmar Eliminación</h3>
            <p>¿Está seguro que desea eliminar el ítem "{itemToDelete?.tipo_trabajo}"?</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes /> Cancelar
              </button>
              <button className="btn-danger" onClick={confirmarEliminarItem}>
                <FaTrash /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CotizacionItems;
