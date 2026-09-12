# Model A: activity gap-fill

Model A estimates only these activity inputs: `energy_kwh`,
`material_quantity_kg`, `transport_distance_km`, and `production_volume`.
The carbon engine remains the sole source of CO2e totals.

## Runtime estimator

`PeerGroupEstimator` is the production estimator. It uses a leakage-safe
hierarchy of same material and tier, same material, same tier, then global
peers. Where a supplied production volume or material quantity is available,
it uses the median peer ratio rather than a raw median. Its per-field
provenance records the peer scope and sample size.

Confidence is derived from match scope, sample support, and robust observed
dispersion (MAD-derived coefficient of variation). It is evidence quality,
not a prediction-accuracy claim. The no-peer benchmark fallback is explicitly
low confidence.

## Experimental ML assets

`generator.py`, `train.py`, `data/synthetic_suppliers.csv`, and
`artifacts/*.joblib` are retained from the earlier experiment. They are **not
loaded by runtime code** and must not be promoted to production: the existing
synthetic data includes a legacy material value outside the frozen glossary,
and no real, group-aware held-out evaluation has established an improvement
over peer groups. Regenerate the dataset with the corrected generator before
any further experiment.

Promoting an ML model requires a versioned real-data training set, supplier or
parent-group-aware validation, realistic missingness masks, baseline
comparison against `PeerGroupEstimator`, and recorded calibration results.
