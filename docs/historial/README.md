# FEATURE — Historial admin + professional (orquestación)

## Resumen

Eliminar el catálogo vivo `/admin/reservas` y reemplazarlo por un grupo **Historial** (solo pasado) en admin y professional: turnos + cirugías en rutas dedicadas, redirects de compat, nav tipo Administración, docs/parity actualizados.

## Pack

| Archivo | Rol |
|---------|-----|
| `FEATURE-historial-analysis.md` | Análisis SoT |
| `COMMON.md` | Contexto subagentes |
| `ORCHESTRATOR.md` | Plan maestro + Task |
| `F0-docs-sot.md` … `F6-hardening.md` | Fases |

## Dependencias

F0 → F1 → F2 → F3 → F4 → F5 → F6  
(F1–F4 pueden conceptualmente paralelizarse tras F0; F5 espera rutas; default secuencial.)

## Checklist

- [ ] F0 docs SoT
- [ ] F1 admin historial turnos
- [ ] F2 admin historial cirugías
- [ ] F3 professional mis-turnos
- [ ] F4 professional mis-cirugías
- [ ] F5 sidebar nav
- [ ] F6 hardening

## Blockers / abiertos

- Rama base: WIP portal cirugías en `feature/professional-surgeries` — default branchar/continuar desde ahí.
- Sin ID de tracker (brief 2026-11-12).

## Arranque ejecución

```text
/orquestar-feature Modo B — leé docs/historial/ORCHESTRATOR.md, despachá F0 y seguí F1…F6 auditando handoffs. Sin pedir confirmación entre fases.
```
