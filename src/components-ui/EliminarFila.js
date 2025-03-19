// src/components-ui/EliminarFila.js

import React from 'react';

const EliminarFila = ({ onClick }) => {
  return (
    <button className="btn-cancelar" onClick={onClick}>
      Cancelar
    </button>
  );
};

export default EliminarFila;
