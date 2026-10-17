| column | data_type | unit | meaning | valid_values_or_range |
|---|---|---|---|---|
| Trial_ID | string | identifier | Unique synthetic trial-row ID; not a real experimental replicate. | AS-0001 onward; unique in this file |
| Hydrogel_Concentration_Percent | float | % (basis not specified) | Hydrogel tier used in the scenario equation. | 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2 |
| Soil_Rigidity_kPa | float | kPa | Illustrative simulated soil-rigidity/impedance input; not calibrated to a field instrument. | 5–100 kPa allowed; generator currently produces 5–69.64 |
| Average_Daily_Rainfall_mm | float | mm/day | Synthetic scenario rainfall; not sourced local weather data. | 0–12 mm/day |
| Root_Elongation_Rate_mm_day | float | mm/day | Synthetic target computed from the coded scenario equation plus noise; not observed plant growth. | 0.2–14 mm/day |
| Stress_Gene_Expression_Fold_Change | float | fold change (simulated proxy) | Hypothetical EXPA1-like stress-response proxy. Not actual transcriptomic expression or a validated EXPA1 prediction. | 0.25–8 fold-change units |
