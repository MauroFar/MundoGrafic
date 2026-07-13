export default function TestRoute() {
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px', border: '2px solid red' }}>
      <h1>✅ ROUTE TEST COMPONENT</h1>
      <p>Si ves esto, la ruta está siendo matcheada correctamente en React Router.</p>
      <p>Si ves PageNotFound en lugar de esto, hay un problema con las rutas.</p>
    </div>
  );
}
