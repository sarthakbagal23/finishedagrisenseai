# AgriSense AI design system

## 1. Visual theme and atmosphere
An Indian crop research fieldbook with the clarity of a small scientific journal. The product is precise and practical, not a live farm-control system: synthetic research and simulated prototype tools must remain obvious.

Dials: DESIGN_VARIANCE = 6, MOTION_INTENSITY = 2, VISUAL_DENSITY = 5.
The memorable element is the Research Lab scenario plot, where a prediction and its 90% interval move while the training range stays visible.

## 2. Color palette and roles
| Role | Name | Light | Dark | Use |
|---|---|---|---|---|
| base | Field paper | `--background` | `--background` | App canvas |
| surface | Paper | `--card` | `--card` | Inputs, chart tooltips, focused panels |
| text | Field ink | `--foreground` | `--foreground` | Body and headings |
| muted | Pencil | `--muted-foreground` | `--muted-foreground` | Supporting copy, labels, axes |
| accent | Measured soil | `--accent` | `--accent` | Observed values only |
| model | Model blue | `--model` | `--model` | Generated/predicted values only |
| status | Green / amber / red | `--good` / `--warn` / `--bad` | same roles | Always pair status with a word and icon |

Keep the palette already defined in `src/app/globals.css`. Do not add a second accent or use status colors to label chart series. Check contrast on actual text before adding a color.

## 3. Typography
| Role | Family | Weight | Notes |
|---|---|---|---|
| Display | Bricolage Grotesque Variable | 600–700 | Short editorial headlines, tight tracking |
| Body and data | Public Sans Variable | 400–600 | Reading, controls and tabular figures |
| Indic scripts | Platform fallback | normal | Keep native script readable; do not force Latin faces |

These faces have a humanist editorial tone while keeping measurements highly legible. Body copy should stay near 65–75 characters per line. Use tabular numerals for comparable values.

## 4. Components
- Primary action: compact ink-filled button, 44px minimum height, explicit outcome label.
- Secondary action: text link with underline and a clear focus ring.
- Navigation: current page uses a filled ink row; other links gain a tonal hover state. Prototype tools are in a named, expandable group.
- Panels: use spacing and rules first. Reserve surfaces for chart controls, interactive containers and focused data relationships.
- Data status: use words such as Synthetic, Sample data and Simulated. Never imply a physical sensor or feed is connected when it is not.
- Focus, hover, active, disabled and error states must remain visible in both themes.

## 5. Layout
Use a 252px desktop navigation rail and a fluid content area capped at 1480px. The research hierarchy leads; farm tools stay one level below and carry a Demo label. Mobile uses a 5-item bottom navigation with safe-area padding and content padding beneath it. Prefer left-aligned editorial grids, ruled lists, and aligned data tables over repeated cards.

Spacing steps: 4, 8, 12, 16, 24, 32, 48, 64, 80. Use one-pixel rules for structure. Controls and touch targets are at least 44px on mobile.

## 6. Depth and elevation
Use paper/ink tonal contrast and thin, hue-matched rules. Keep charts and figures on the page surface. Use no floating badges over imagery, generic shadows, or nested cards. Small control radii are 4–6px; avoid pill-shaped UI except where native behavior calls for it.

## 7. Do and do not
**Do:** keep generated, measured, sample and live data distinct; include units, sample sizes and caveats beside charts; give each route one clear job; link to official farmer resources for real decisions.

**Do not:** present synthetic research as biological proof; imply demo sensor controls operate hardware; use fake map/sensor feeds as proof; add purple AI gradients, tinted icon tiles everywhere, emoji icons, generic agritech claims or unlabelled sample prices.

## 8. Responsive behavior
At tablet widths, keep the side rail readable and collapse content columns before shrinking labels. At mobile widths, stack hero text before its chart, keep tables scrollable with their headers available, and reserve the bottom safe area for navigation. Check 390, 768, 1280 and 1440px. Honor reduced motion and never hide keyboard focus beneath the sticky header.

## 9. Agent prompt guide
Use existing tokens in `src/app/globals.css`; do not add raw colors or a parallel component theme. Keep copy specific and calm. Label every data source near the figure that uses it. Prefer native links, buttons, labels and tables. On every new screen, verify keyboard access, long content, empty/error states, contrast, mobile layout and reduced motion.

## Inspiration used
- OneSoil: take field-level context and workflows grouped around what needs attention. Reject satellite evidence and recommendation claims that this project does not have.
- Plantix: take the short route from a farmer question to diagnosis or help. Reject treatment guarantees and marketing-first home screens.
- John Deere Operations Center: take clear separation between planning, monitoring and analysis. Reject machinery-heavy density and any implied live telemetry.
