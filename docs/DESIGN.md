# Design System: Eira

Eira prende [Atomize Themes](https://atomizedesign.com/#themes) come riferimento
per temi a token, superfici coerenti e componenti moderni. Il sistema è adattato
al lavoro clinico di infermieri e
caposala: leggibilità e velocità di consultazione restano prioritarie.
L'implementazione usa Vue, PrimeVue Aura e i componenti locali; il kit Figma
non è una dipendenza runtime.

## Direzione

- **Tono:** professionale, calmo, contemporaneo.
- **Densità:** alta nelle tabelle e nelle dashboard, con gerarchia chiara.
- **Motion:** sobrio, con transizioni brevi e nessuna animazione decorativa.
- **Target:** desktop e tablet di reparto; mobile resta supportato.
- **Tema:** light/dark automatico tramite `prefers-color-scheme`.

## Colori e ruoli

| Token           | Light     | Dark      | Uso                                 |
| --------------- | --------- | --------- | ----------------------------------- |
| Canvas          | `#F6F8F8` | `#121B19` | Fondo pagina                        |
| Surface         | `#FFFFFF` | `#1C2825` | Schede, tabelle e form              |
| Surface muted   | `#F0F4F3` | `#263530` | Intestazioni e superfici secondarie |
| Ink             | `#172724` | `#F1F7F4` | Testo principale                    |
| Steel           | `#526760` | `#B7CBC2` | Testo secondario                    |
| Aqua teal       | `#00A499` | `#51C5B2` | Accento di brand e dettagli         |
| Accessible teal | `#00786F` | `#6BC2B6` | Azioni primarie                     |

Il teal NHS `#00A499` è il riferimento cromatico. La navigazione chiara usa
una superficie aqua pallida e riserva il teal pieno alle voci selezionate e
alle azioni; in scuro la sidebar resta profonda ma meno nera. I componenti
devono usare token semantici come `--color-primary`, `--surface`, `--ink` e
`--border`; evitare nuovi valori di brand hardcoded.

I colori di stato restano separati dall'accent: urgente/rifiutato rosso,
attesa ambra, approvato/attivo verde, chiuso grigio. Le informazioni di stato
devono essere comprensibili anche senza distinguere il colore.

## Tipografia e componenti

- **Display e body:** Manrope; **numeri clinici, orari e date:** Geist Mono.
- **Titoli:** 1.75–2rem, peso 750; **sezioni:** circa 1rem, peso 650–700.
- **Schede:** `EiraCard` usa superfici, bordo sottile, raggio 1.125rem e ombra
  leggera. Riservare le schede a moduli funzionali, non alle singole righe.
- **Tabelle:** pattern primario per dati densi, con header muted, divider,
  hover discreto e scroll orizzontale interno quando serve.
- **Pulsanti:** teal pieno per l'azione primaria; outline o ghost per azioni
  secondarie. Campi con label sopra e messaggi di errore inline.
- **Focus:** sempre visibile, con outline teal e offset di 2px.
- **Stati:** badge con testo e tinta attenuata; mai solo un'icona o il colore.

## Layout e responsive

- Sidebar aqua chiara in light mode e teal profonda in dark mode; contenuto su
  canvas neutro con moduli su superfici distinte.
- Dashboard con griglie a colonne asimmetriche e schede operative; viste dati
  e moduli mantengono la loro gerarchia funzionale.
- Contenitori centrati e fluidi; usare CSS Grid per la struttura.
- **Desktop (≥1024px):** sidebar fissa e viste a colonne.
- **Tablet (768–1023px):** sidebar collassata a icone e griglie ridotte.
- **Mobile (<768px):** topbar con drawer, una colonna e tabelle scrollabili.
- Target touch minimo 44px; nessuno scroll orizzontale a livello pagina.

## Motion e accessibilità

- Hover e focus usano transizioni di 150–200ms; rispettare
  `prefers-reduced-motion`.
- Nessuno shimmer, pulse o gradiente decorativo. È ammesso un indicatore live
  discreto solo per uno stato realmente in attesa.
- Non usare nero puro, colori neon, gradienti viola o copy promozionale.
- Testo, controlli e indicatori devono rispettare WCAG 2.2 AA; il significato
  non deve dipendere solo da colore o posizione.
- Loading, empty ed error state devono spiegare il contesto e offrire un
  recupero utile quando possibile.
