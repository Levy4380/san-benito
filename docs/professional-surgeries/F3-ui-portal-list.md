# FEATURE FASE F3 — UI portal list (professional-surgeries) — enmendado Historial F0

**Estado:** entregable de nav **enmendado / superseded** respecto al F3 original.

## Enmienda (Historial F0, 2026-11-12)

El F3 original pedía parity «**4 hijos** (pending / requested / approved / **Historial**)» bajo el grupo **Mis Cirugías**. Eso **queda superseded**.

### Parity nav vigente

- Grupo **Mis Cirugías**: solo **3 hijos** workflow (`pending` / `requested` / `approved`) + calendario. **Sin** hijo Historial / `section=history` en `surgeryChildren`.
- Historial portal: grupo dedicado **Historial** con paths:
  - `GET /profesional/historial/mis-turnos`
  - `GET /profesional/historial/mis-cirugias`
- Ver `docs/professional-surgeries/COMMON.md` Decisión 13 (forma NUEVA) y `new-design.md` d47.

### Criterios de aceptación (nav) — actualizados

- [ ] Mis Cirugías **no** lista un cuarto hijo «Historial».
- [ ] No hay «4 hijos con Historial» en docs ni en copy de esta fase.
- [ ] Historial de cirugías del professional se documenta / navega vía grupo Historial (`.../historial/mis-cirugias`), no vía `?section=history` como hijo del grupo workflow (ese query solo queda como redirect compat).

### Fuera de alcance de esta nota

- Implementación runtime de Historial (pack `docs/historial/` F1+).
- Resto de entregables UI de listado portal cirugías no tocados por esta enmienda de nav.
