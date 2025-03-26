import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    backgroundColor: 'white',
    padding: 20,
  },
  encabezado: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  encabezadoLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  mundografic: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  corporacion: {
    fontSize: 10,
    color: '#959191',
    fontWeight: 'bold',
    letterSpacing: 6,
  },
  grafic: {
    color: 'red',
  },
  subtitulo: {
    fontSize: 11,
    fontWeight: 'normal',
    color: '#333',
    textTransform: 'uppercase',
  },
  cotizacionSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  cotizacionBox: {
    display: 'flex',
    alignItems: 'center',
  },
  numeroCotizacion: {
    color: '#d94444',
    fontSize: 18,
    marginLeft: 10,
  },
  rucBox: {
    marginTop: 10,
    display: 'flex',
    alignItems: 'center',
  },
  rucLabel: {
    fontWeight: 'bold',
    marginRight: 10,
    color: '#000',
  },
  rucSelect: {
    padding: 5,
    borderRadius: 5,
  },
  columna: {
    textAlign: 'center',
    fontSize: 8,
    color: '#333',
    padding: 5,
    lineHeight: 1,
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    borderRight: '1px solid #000',
  },
  seccionColumnas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    marginTop: 5,
    padding: 5,
  },
});

const CotizacionPDF = ({ cotizacion }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.encabezado}>
          <View style={styles.encabezadoLeft}>
            <Text style={styles.corporacion}>CORPORACION</Text>
            <Text style={styles.mundografic}>
              MUNDO <Text style={styles.grafic}>GRAFIC</Text>
            </Text>
            <Text style={styles.subtitulo}>
              CORPORACION MUNDO GRAFIC MUNDOGRAFIC CIA. LTDA.
            </Text>
          </View>
          <View style={styles.cotizacionSection}>
            <View style={styles.cotizacionBox}>
              <Text style={{ fontSize: 12 }}>COTIZACIÓN</Text>
              <Text style={styles.numeroCotizacion}>{cotizacion.numero}</Text>
            </View>
            <View style={styles.rucBox}>
              <Text style={styles.rucLabel}>R.U.C</Text>
              <Text style={styles.rucSelect}>{cotizacion.ruc}</Text>
            </View>
          </View>
        </View>

        <View style={styles.seccionColumnas}>
          {cotizacion.productos.map((producto, index) => (
            <View key={index} style={styles.columna}>
              <Text>{producto.descripcion}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default CotizacionPDF;
