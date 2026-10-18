# Contrasto dei token Eira

Calcolo WCAG 2 della luminanza relativa sui valori di `frontend/src/style.css`.
Rapporti prima dell’arrotondamento verificati con assert. Il salvia decorativo
non è usato come testo. I bordi divisori non sono bordi identificativi dei controlli.

| Coppia                                                 |   Light |    Dark | Soglia |
| ------------------------------------------------------ | ------: | ------: | -----: |
| `text-primary` su `bg-canvas`                          | 12.26:1 | 14.52:1 |  4.5:1 |
| `text-secondary` su `bg-canvas`                        |  5.16:1 |  8.54:1 |  4.5:1 |
| `text-secondary` su `bg-subtle`                        |  4.81:1 |  7.28:1 |  4.5:1 |
| `text-secondary` su `bg-hover`                         |  4.52:1 |  5.67:1 |  4.5:1 |
| `action-on-primary` su `action-primary`                |  6.08:1 |  8.52:1 |  4.5:1 |
| `action-on-primary` su `action-primary-hover`          |  8.47:1 |  9.99:1 |  4.5:1 |
| `action-selected-text` su `action-selected-background` |  7.38:1 |  7.77:1 |  4.5:1 |
| `border-control` su `bg-surface`                       |  3.59:1 |  3.78:1 |    3:1 |
| `focus-ring` su `bg-canvas`                            |  6.08:1 |  9.46:1 |    3:1 |
| `status-success` su `status-success-background`        |  6.50:1 |  8.09:1 |  4.5:1 |
| `status-warning` su `status-warning-background`        |  6.27:1 |  8.28:1 |  4.5:1 |
| `status-danger` su `status-danger-background`          |  5.93:1 |  7.88:1 |  4.5:1 |
| `status-info` su `status-info-background`              |  6.61:1 |  7.70:1 |  4.5:1 |
| `status-neutral` su `status-neutral-background`        |  4.52:1 |  5.67:1 |  4.5:1 |

Le combinazioni renderizzate sono state controllate anche con axe nei temi light
e dark; per ambito, screenshot e limiti vedere [PLAN.md](PLAN.md).

Il testo secondario non va applicato sul fondo selezionato light: il rapporto
sarebbe 4,49:1. Usare `action-selected-text`, anche sul giorno corrente del calendario.
