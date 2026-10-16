# AgriSense design system (data science edition)

## Brief
- **Subject:** AgriSense, a farm data app for small farmers in India. The detail only this product has: a Research Lab that predicts root growth from soil rigidity, hydrogel and rainfall, with a calibrated 90% interval and an honest extrapolation test.
- **Audience:** judges scoring a Data Science entry (data quality, modelling, communication, ethics), then the farmer using it in daylight on a phone.
- **Primary job:** show the whole pipeline (data, audit, model, validation, scenario, limits) so every number is traceable to where it came from.
- **Voice:** plain and exact, like a field notebook. It says what it knows and what it does not.
- **The one memorable thing:** the scenario lab. Move a slider and the predicted curve moves with its 90% band, while the training range stays shaded so extrapolation is visible.

## Dials
DESIGN_VARIANCE 6, MOTION_INTENSITY 4, VISUAL_DENSITY 6.

## Colour logic (the rule the whole app follows)
| Meaning | Token | Light | Dark |
|---|---|---|---|
| Structure and actions | ink (`--primary`) | #17231c | #ece8dc |
| Measured by a sensor or observed in data | soil (`--observed`) | #7a4f2d | #d9a066 |
| Said by a model | model blue (`--model`) | #2a78d6 (text #1c5cab) | #6da7ec |
| Good / watch / alert | `--good` `--warn` `--bad` | #2d7a4d #a86a00 #b83a28 | #6fbf8e #e0a63c #ec7f6c |
| Page / surface | `--background` `--card` | #edefe7 / #f9faf5 | #12100c / #1a1712 |

Observed is always soil brown. Predicted is always model blue. Status colours never carry a series and always ship with an icon and a word.
Crop series (prices): wheat #eda100, rice #1baf7a, cotton #e87ba4, maize #eb6834. Validated with the dataviz script (adjacent CVD 9.1, normal-vision 19.6); contrast relief given by direct labels and a table view.

## Type
- Headings: Bricolage Grotesque (variable). Body and numbers: Public Sans (variable), tabular figures everywhere numbers line up.
- Indic scripts fall back to the system fonts (Noto Sans Devanagari, Gurmukhi, Tamil, Telugu, Kannada, Bengali, Gujarati).
- No monospace for labels, no all-caps eyebrows, no numbered markers unless the content is a sequence.

## Layout
- Light theme by default (readable in sunlight and on a projector), dark theme kept via the existing toggle.
- Every page starts with a data status strip: what is live, simulated, sample or synthetic.
- Figures are captioned like a paper: what it shows, source, n, caveat.
- Home is a field brief: one sentence computed from the data, then bullet-chart rows (value against target band), not a grid of icon cards.

## Motion (LottieFiles motion-design rules)
Personality: calm and clear. One easing `cubic-bezier(.2,0,0,1)`, durations 150 / 280 / 600 ms. Entrances decelerate, exits accelerate. Hover under 100 ms, press under 150 ms. Stagger under 500 ms total. One orchestrated moment per page (markers settle to their values, lines draw once). No page-wide fade-up. Reduced motion switches it all off.

## Anti-defaults we rejected
Mint on near-black; tinted icon boxes in every card; blurred glow blobs; uppercase mono eyebrows; four equal stat cards; emoji as icons; a greeting hero.
