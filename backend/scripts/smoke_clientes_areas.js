/*
 * Smoke test for Clientes and Areas endpoints.
 *
 * Usage:
 *   BASE_URL=http://localhost:3002 TOKEN=<jwt> node scripts/smoke_clientes_areas.js
 *
 * Optional:
 *   STRICT=true        -> fail on permission errors (403)
 *   ADMIN_TOKEN=<jwt>  -> token for admin-only area routes
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3002";
const TOKEN = process.env.TOKEN || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || TOKEN;
const STRICT = String(process.env.STRICT || "false").toLowerCase() === "true";

if (!TOKEN) {
  console.error("Missing TOKEN env var. Example:");
  console.error("BASE_URL=http://localhost:3002 TOKEN=<jwt> node scripts/smoke_clientes_areas.js");
  process.exit(1);
}

const now = Date.now();
const random = Math.floor(Math.random() * 100000);
const tempName = `SMOKE CLIENTE ${now}-${random}`;

function authHeaders(token, extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function request(path, options = {}, token = TOKEN) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...authHeaders(token),
    },
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data, url };
}

function allowByPolicy(result, allowedStatuses = [200, 201], permissionStatuses = [401, 403]) {
  if (allowedStatuses.includes(result.status)) {
    return { pass: true, mode: "ok" };
  }

  if (!STRICT && permissionStatuses.includes(result.status)) {
    return { pass: true, mode: "permission" };
  }

  return { pass: false, mode: "fail" };
}

async function run() {
  const summary = [];

  const listClientes = await request("/api/clientes");
  summary.push(["GET /api/clientes", listClientes.status, listClientes.ok]);
  const p1 = allowByPolicy(listClientes, [200], [401, 403]);
  if (!p1.pass) throw new Error(`GET /api/clientes failed with ${listClientes.status}`);

  const buscarClientes = await request("/api/clientes/buscar?q=aa");
  summary.push(["GET /api/clientes/buscar", buscarClientes.status, buscarClientes.ok]);
  const p2 = allowByPolicy(buscarClientes, [200], [401, 403]);
  if (!p2.pass) throw new Error(`GET /api/clientes/buscar failed with ${buscarClientes.status}`);

  let createdClientId = null;

  const createCliente = await request(
    "/api/clientes",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: tempName,
        empresa: tempName,
        direccion: "Smoke Street 123",
        telefono: "0999999999",
        email: `smoke.${now}.${random}@example.com`,
        ruc_cedula: String(now).slice(-10),
        estado: "activo",
        notas: "Smoke test create",
      }),
    },
  );

  summary.push(["POST /api/clientes", createCliente.status, createCliente.ok]);
  const p3 = allowByPolicy(createCliente, [201], [401, 403]);
  if (!p3.pass) throw new Error(`POST /api/clientes failed with ${createCliente.status}`);

  if (createCliente.ok) {
    createdClientId = Number(createCliente.data?.cliente?.id || NaN);
    if (!Number.isInteger(createdClientId)) {
      throw new Error("POST /api/clientes returned success but no cliente.id");
    }

    const updateCliente = await request(
      `/api/clientes/${createdClientId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: `${tempName} EDITADO`,
          empresa: `${tempName} EDITADO`,
          direccion: "Smoke Street 456",
          telefono: "0988888888",
          email: `smoke.edit.${now}.${random}@example.com`,
          ruc_cedula: String(now + 1).slice(-10),
          estado: "activo",
          notas: "Smoke test update",
        }),
      },
    );

    summary.push(["PUT /api/clientes/:id", updateCliente.status, updateCliente.ok]);
    const p4 = allowByPolicy(updateCliente, [200], [401, 403]);
    if (!p4.pass) throw new Error(`PUT /api/clientes/:id failed with ${updateCliente.status}`);

    const getCliente = await request(`/api/clientes/${createdClientId}`);
    summary.push(["GET /api/clientes/:id", getCliente.status, getCliente.ok]);
    const p5 = allowByPolicy(getCliente, [200], [401, 403]);
    if (!p5.pass) throw new Error(`GET /api/clientes/:id failed with ${getCliente.status}`);
  }

  const areasActivas = await request("/api/areas");
  summary.push(["GET /api/areas", areasActivas.status, areasActivas.ok]);
  const p6 = allowByPolicy(areasActivas, [200], [401, 403]);
  if (!p6.pass) throw new Error(`GET /api/areas failed with ${areasActivas.status}`);

  const areasAll = await request("/api/areas/all", {}, ADMIN_TOKEN);
  summary.push(["GET /api/areas/all", areasAll.status, areasAll.ok]);
  const p7 = allowByPolicy(areasAll, [200], [401, 403]);
  if (!p7.pass) throw new Error(`GET /api/areas/all failed with ${areasAll.status}`);

  let firstAreaId = null;
  if (Array.isArray(areasActivas.data) && areasActivas.data.length > 0) {
    firstAreaId = Number(areasActivas.data[0]?.id || NaN);
  }

  if (Number.isInteger(firstAreaId)) {
    const getArea = await request(`/api/areas/${firstAreaId}`, {}, ADMIN_TOKEN);
    summary.push(["GET /api/areas/:id", getArea.status, getArea.ok]);
    const p8 = allowByPolicy(getArea, [200], [401, 403]);
    if (!p8.pass) throw new Error(`GET /api/areas/:id failed with ${getArea.status}`);
  }

  if (createdClientId) {
    const deleteCliente = await request(`/api/clientes/${createdClientId}`, { method: "DELETE" });
    summary.push(["DELETE /api/clientes/:id", deleteCliente.status, deleteCliente.ok]);
    const p9 = allowByPolicy(deleteCliente, [200], [401, 403, 409]);
    if (!p9.pass) throw new Error(`DELETE /api/clientes/:id failed with ${deleteCliente.status}`);
  }

  console.log("\nSmoke test summary (clientes/areas):");
  for (const [name, status, ok] of summary) {
    console.log(`- ${name}: ${status} (${ok ? "ok" : "no"})`);
  }

  console.log("\nSmoke test finished successfully.");
}

run().catch((error) => {
  console.error("\nSmoke test failed:");
  console.error(error?.message || error);
  process.exit(1);
});
