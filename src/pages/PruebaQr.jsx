import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from 'qrcode.react';

function PruebaQr(){

  const pruebaimgqr = "https://www.google.com"; 
    return(
        <div>
        <h2>Mi Código QR</h2>
        <QRCodeCanvas value={pruebaimgqr} size={256} />
      </div>
    );
 }
export default PruebaQr;
