import { Client } from "pg";
import { CertificadoRepository } from "../../../../domain/repositories/certificados/CertificadoRepository";
import {
  Certificado,
  Caracteristica,
  CertificadoCreateInput,
  CertificadoUpdateInput,
  CertificadoMedicionInput,
} from "../../../../domain/entities/certificados/Certificado";

export class PgCertificadoRepository implements CertificadoRepository {
  constructor(private readonly client: Client) {}

  // ── READ ────────────────────────────────────────────────────────────────────

  async findAll(): Promise<Certificado[]> {
    const r = await this.client.query(
      "SELECT * FROM certificado_calidad ORDER BY created_at DESC",
    );
    return r.rows;
  }

  async findById(id: number): Promise<Certificado | null> {
    const certRes = await this.client.query(
      "SELECT * FROM certificado_calidad WHERE id = $1",
      [id],
    );
    if (!certRes.rows.length) return null;

    const certificado: Certificado = certRes.rows[0];

    const carRes = await this.client.query(
      `SELECT cm.id, cm.certificado_id, cm.caracteristica_id,
              cm.minimo, cm.nominal, cm.maximo, cm.orden,
              c.nombre, c.unidad
       FROM certificado_medicion cm
       LEFT JOIN caracteristica c ON cm.caracteristica_id = c.id
       WHERE cm.certificado_id = $1
       ORDER BY cm.orden ASC`,
      [id],
    );
    certificado.caracteristicas = carRes.rows;
    return certificado;
  }

  async getNextNumber(): Promise<{ next_seq: number; numero_certificado: string }> {
    const seqRes = await this.client.query(
      "SELECT COALESCE(MAX(numero_secuencia), 0) + 1 AS next_seq FROM certificado_calidad",
    );
    const nextSeq: number = seqRes.rows[0]?.next_seq ?? 1;
    const yearRes = await this.client.query("SELECT to_char(now(),'YYYY') AS y");
    const year = yearRes.rows[0]?.y ?? new Date().getFullYear();
    return {
      next_seq: nextSeq,
      numero_certificado: `CERT-${year}-${String(nextSeq).padStart(6, "0")}`,
    };
  }

  async getCatalogoCar(): Promise<Caracteristica[]> {
    const r = await this.client.query(
      "SELECT id, nombre, unidad FROM caracteristica ORDER BY nombre",
    );
    return r.rows;
  }

  // ── CREATE ──────────────────────────────────────────────────────────────────

  async create(input: CertificadoCreateInput): Promise<{ id: number; numero_certificado: string | null }> {
    await this.client.query("BEGIN");
    try {
      const r = await this.client.query(
        `INSERT INTO certificado_calidad (
           numero_certificado, fecha_creacion, fecha_elaboracion, fecha_caducidad,
           cliente_nombre, referencia, material, descripcion, cantidad, codigo,
           lote, cantidad_despachada, lote_despacho, tamano_cm, orden_compra,
           inspeccionado_por, observaciones, aprobado_area, recepcion_area,
           created_by, created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,now())
         RETURNING id, numero_certificado`,
        [
          input.numero_certificado ?? null,
          input.fecha_creacion ?? null,
          input.fecha_elaboracion ?? null,
          input.fecha_caducidad ?? null,
          input.cliente_nombre ?? null,
          input.referencia ?? null,
          input.material ?? null,
          input.descripcion ?? null,
          input.cantidad ?? null,
          input.codigo ?? null,
          input.lote ?? null,
          input.cantidad_despachada ?? null,
          input.lote_despacho ?? null,
          input.tamano_cm ?? null,
          input.orden_compra ?? null,
          input.inspeccionado_por ?? null,
          input.observaciones ?? null,
          input.aprobado_area ?? null,
          input.recepcion_area ?? null,
          input.created_by ?? null,
        ],
      );

      const certId: number = r.rows[0].id;
      await this._insertMediciones(certId, input.caracteristicas ?? [], input.espesor_mm ?? null);

      await this.client.query("COMMIT");
      return { id: certId, numero_certificado: r.rows[0].numero_certificado };
    } catch (err) {
      await this.client.query("ROLLBACK");
      throw err;
    }
  }

  // ── UPDATE ──────────────────────────────────────────────────────────────────

  async update(id: number, input: CertificadoUpdateInput): Promise<void> {
    await this.client.query("BEGIN");
    try {
      await this.client.query(
        `UPDATE certificado_calidad SET
           fecha_creacion     = COALESCE(NULLIF($1,'')::timestamptz, now()),
           fecha_elaboracion  = $2,  fecha_caducidad = $3,
           cliente_nombre     = $4,  referencia      = $5,
           material           = $6,  descripcion     = $7,
           cantidad           = $8,  codigo          = $9,
           lote               = $10, cantidad_despachada = $11,
           lote_despacho      = $12, tamano_cm       = $13,
           orden_compra       = $14, inspeccionado_por = $15,
           observaciones      = $16, aprobado_area   = $17,
           recepcion_area     = $18, updated_by      = $19,
           updated_at         = now()
         WHERE id = $20`,
        [
          input.fecha_creacion ?? null,
          input.fecha_elaboracion ?? null,
          input.fecha_caducidad ?? null,
          input.cliente_nombre ?? null,
          input.referencia ?? null,
          input.material ?? null,
          input.descripcion ?? null,
          input.cantidad ?? null,
          input.codigo ?? null,
          input.lote ?? null,
          input.cantidad_despachada ?? null,
          input.lote_despacho ?? null,
          input.tamano_cm ?? null,
          input.orden_compra ?? null,
          input.inspeccionado_por ?? null,
          input.observaciones ?? null,
          input.aprobado_area ?? null,
          input.recepcion_area ?? null,
          input.updated_by ?? null,
          id,
        ],
      );

      // Reemplazar mediciones
      await this.client.query(
        "DELETE FROM certificado_medicion WHERE certificado_id = $1",
        [id],
      );
      await this._insertMediciones(id, input.caracteristicas ?? [], input.espesor_mm ?? null);

      await this.client.query("COMMIT");
    } catch (err) {
      await this.client.query("ROLLBACK");
      throw err;
    }
  }

  // ── DELETE ──────────────────────────────────────────────────────────────────

  async delete(id: number): Promise<void> {
    await this.client.query("DELETE FROM certificado_calidad WHERE id = $1", [id]);
  }

  // ── HELPERS PRIVADOS ────────────────────────────────────────────────────────

  /**
   * Inserta las mediciones de un certificado, incluyendo la lógica de espesor
   * (mm → micras) cuando no viene ya en el payload.
   */
  private async _insertMediciones(
    certId: number,
    caracteristicas: CertificadoMedicionInput[],
    espesorMmOverride: string | null,
  ): Promise<void> {
    // 1. Insertar mediciones del payload
    for (let i = 0; i < caracteristicas.length; i++) {
      const c = caracteristicas[i];
      const nombre = c.nombre ?? c.name ?? null;
      let caracteristicaId = c.caracteristica_id ?? null;
      let unidadResolved   = c.unidad ?? null;

      if (caracteristicaId) {
        const cat = await this.client.query(
          "SELECT id, nombre, unidad FROM caracteristica WHERE id = $1 LIMIT 1",
          [caracteristicaId],
        );
        if (!cat.rows.length) {
          caracteristicaId = null;
        } else {
          if (!unidadResolved) unidadResolved = cat.rows[0].unidad ?? null;
        }
      }

      if (!caracteristicaId) {
        const resolved = await this._resolveCaracteristica(nombre, unidadResolved);
        if (resolved) {
          caracteristicaId = resolved.id;
          if (!unidadResolved) unidadResolved = resolved.unidad ?? null;
        }
      }

      await this.client.query(
        `INSERT INTO certificado_medicion
           (certificado_id, caracteristica_id, minimo, nominal, maximo, orden)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [certId, caracteristicaId, c.minimo ?? null, c.nominal ?? null, c.maximo ?? null, c.orden ?? i],
      );
    }

    // 2. Determinar valor de espesor mm
    let espesorMmVal: string | null = espesorMmOverride ?? null;
    if (!espesorMmVal) {
      const espMm = caracteristicas.find(
        (c) =>
          String(c.nombre ?? c.name ?? "").toLowerCase().includes("espesor") &&
          String(c.unidad ?? "").toLowerCase().includes("mm") &&
          (c.nominal ?? "") !== "",
      );
      if (espMm) espesorMmVal = espMm.nominal ?? null;
    }
    if (!espesorMmVal) {
      const espAny = caracteristicas.find(
        (c) =>
          String(c.nombre ?? c.name ?? "").toLowerCase().includes("espesor") &&
          (c.nominal ?? "") !== "",
      );
      if (espAny) espesorMmVal = espAny.nominal ?? null;
    }

    const payloadHasEspMm = caracteristicas.some(
      (c) =>
        String(c.nombre ?? c.name ?? "").toLowerCase().includes("espesor") &&
        String(c.unidad ?? "").toLowerCase().includes("mm"),
    );
    const payloadHasEspMic = caracteristicas.some(
      (c) =>
        String(c.nombre ?? c.name ?? "").toLowerCase().includes("espesor") &&
        String(c.unidad ?? "").toLowerCase().includes("mic"),
    );

    // Calcular micras
    let espesorMicVal: string | null = null;
    if (espesorMmVal) {
      const num = parseFloat(String(espesorMmVal).replace(",", "."));
      if (!isNaN(num)) {
        const micRaw = num * 1000;
        espesorMicVal =
          Math.abs(micRaw - Math.round(micRaw)) < 1e-9
            ? String(Math.round(micRaw))
            : String(parseFloat(micRaw.toFixed(4))).replace(/\.0+$/, "");
      }
    }

    // Obtener el último orden base
    const cntRes = await this.client.query(
      "SELECT COUNT(*)::int AS cnt FROM certificado_medicion WHERE certificado_id = $1",
      [certId],
    );
    let ordenBase: number = cntRes.rows[0]?.cnt ?? 0;

    // 3. Insertar ESPESOR mm si no vino en payload
    if (espesorMmVal && !payloadHasEspMm) {
      let carRes = await this.client.query(
        "SELECT id FROM caracteristica WHERE lower(nombre)=lower($1) AND lower(unidad)=lower($2) LIMIT 1",
        ["ESPESOR", "mm"],
      );
      if (!carRes.rows.length) {
        carRes = await this.client.query(
          "SELECT id FROM caracteristica WHERE lower(nombre)=lower($1) LIMIT 1",
          ["ESPESOR"],
        );
      }
      await this.client.query(
        `INSERT INTO certificado_medicion (certificado_id, caracteristica_id, minimo, nominal, maximo, orden)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [certId, carRes.rows[0]?.id ?? null, null, espesorMmVal, null, ordenBase++],
      );
    }

    // 4. Insertar ESPESOR micras si no vino en payload
    if (espesorMicVal && !payloadHasEspMic) {
      const carId = await this._resolveEspesorMicrasId();
      await this.client.query(
        `INSERT INTO certificado_medicion (certificado_id, caracteristica_id, minimo, nominal, maximo, orden)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [certId, carId, null, espesorMicVal, null, ordenBase++],
      );
    }
  }

  /** Resolución flexible de una característica por nombre y/o unidad */
  private async _resolveCaracteristica(
    nombre: string | null,
    unidad: string | null,
  ): Promise<{ id: number; nombre: string; unidad: string | null } | null> {
    const nm = (nombre ?? "").trim();
    const un = (unidad ?? "").trim();

    if (nm) {
      if (un) {
        const r = await this.client.query(
          "SELECT id, nombre, unidad FROM caracteristica WHERE lower(nombre)=lower($1) AND lower(unidad)=lower($2) LIMIT 1",
          [nm, un],
        );
        if (r.rows.length) return r.rows[0];
      }
      const r2 = await this.client.query(
        "SELECT id, nombre, unidad FROM caracteristica WHERE lower(nombre)=lower($1) LIMIT 1",
        [nm],
      );
      if (r2.rows.length) return r2.rows[0];

      const r3 = await this.client.query(
        "SELECT id, nombre, unidad FROM caracteristica WHERE lower(nombre) LIKE $1 LIMIT 1",
        [`%${nm.toLowerCase()}%`],
      );
      if (r3.rows.length) return r3.rows[0];
    }

    if (un) {
      for (const v of [un, "micras", "micra", "µm", "um", "mm"]) {
        const r = await this.client.query(
          "SELECT id, nombre, unidad FROM caracteristica WHERE lower(unidad)=lower($1) LIMIT 1",
          [v],
        );
        if (r.rows.length) return r.rows[0];
      }
    }

    const rf = await this.client.query(
      "SELECT id, nombre, unidad FROM caracteristica WHERE lower(nombre) LIKE '%espesor%' LIMIT 1",
    );
    return rf.rows[0] ?? null;
  }

  /** Resuelve el id de la característica ESPESOR en micras con varios intentos */
  private async _resolveEspesorMicrasId(): Promise<number | null> {
    for (const unit of ["micras", "micra", "µm", "um"]) {
      const r = await this.client.query(
        "SELECT id FROM caracteristica WHERE lower(nombre)=lower($1) AND lower(unidad)=lower($2) LIMIT 1",
        ["ESPESOR", unit],
      );
      if (r.rows.length) return r.rows[0].id;
    }
    const r2 = await this.client.query(
      "SELECT id FROM caracteristica WHERE lower(nombre)=lower('ESPESOR') LIMIT 1",
    );
    if (r2.rows.length) return r2.rows[0].id;

    const r3 = await this.client.query(
      "SELECT id FROM caracteristica WHERE lower(nombre) LIKE '%espesor%' LIMIT 1",
    );
    return r3.rows[0]?.id ?? null;
  }
}
