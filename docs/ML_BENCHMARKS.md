# Complete ML & Carbon Engine Benchmarks

## Executive Summary

- **Model A** successfully estimates missing activity data using peer-group ratios, outperforming a global mean baseline by reducing error by ~60%. 
- **Model B** effectively generates and ranks circular recommendations, simulating exact carbon impacts via the Carbon Engine, and intelligently scoring feasibility/suitability via an ML Ranker that outperforms naive CO₂e sorting.
- **Carbon Engine** acts as the deterministic source of truth. It passes all mathematical invariants and runs highly efficiently.
- **Overall Readiness:** The isolated backend ML and calculation components are **READY FOR INTEGRATION**.

### Overall Results

| Component | Primary Metric | Result | Baseline | Status |
| :--- | :--- | :--- | :--- | :--- |
| Model A | Regression MAE (energy_kwh) | 5,555 | 13,733 | ✅ |
| Model B | NDCG@3 | 0.9996 | 0.9937 | ✅ |
| Model B | Top-1 Accuracy | 97.67% | 93.02% | ✅ |
| Carbon Engine | Golden/Invariant Tests | 54/54 Passed | N/A | ✅ |

---

## Model A

* **Task:** Missing activity data gap-fill at ingest (e.g., estimating null `energy_kwh` based on available metrics and peer behavior).
* **Validation:** Leave-one-out cross-validation on the fixture supplier dataset.
* **Key metrics:** Mean Absolute Error (MAE) for `energy_kwh` prediction.
* **Baseline comparison:** Compared against a naive "global mean" baseline. Model A's peer-group implementation significantly reduces the MAE.
* **Generalization:** Model A natively generalizes safely since it applies ratio scaling to explicit production volumes and strictly isolates peers by `org_id` to prevent cross-tenant data leakage.
* **Key limitation:** Predictions are highly dependent on the existence of a peer pool for the specific `material_code` and `tier`. If peers are missing, it relies on low-confidence fallback benchmarks.

## Model B

* **Task:** Generate, exactly simulate, and rank low-carbon recommendations for suppliers.
* **Validation:** GroupShuffleSplit on `supplier_id` using 5,122 domain-aware synthetic candidate scenarios to prevent leakage.
* **NDCG@3:** 0.9996 (ML Ranker) vs 0.9937 (Max CO₂e Baseline)
* **Top-1 Accuracy:** 97.67% (ML Ranker) vs 93.02% (Max CO₂e Baseline)
* **Improvement:** The ML ranker successfully learns the simulated domain expert heuristics (e.g., favoring high percentage reductions, preferring circular materials, and tier-specific feasibility constraints), outperforming naive absolute CO₂e sorting.
* **Unseen-supplier result:** Testing robustly demonstrated safe failure behavior on sparse/zero-emission "perfect" suppliers (generating no invalid candidates) and accurate predictions on test sets unseen during training.
* **Key limitation:** The ML ranker is trained entirely on domain-heuristic synthetic labels. Real human-acceptance feedback loops will be required in production to fine-tune the ranking beyond these heuristics.

## Carbon Engine

* **Golden/reference validation:** Passes all reference fixtures (e.g., `fixtures/emissions.json` vs calculated totals).
* **Invariant tests:** Passes mathematical invariants (e.g., candidate `current == projected + delta`, zero activity == zero emissions).
* **Edge-case status:** Rejects non-finite values safely and gracefully applies fallbacks.
* **Representative latency:** `~0.035 ms / call` (highly performant).

## System End-to-End

* **End-to-end status:** Seamless data flow. Missing data correctly flows from Supplier Input → Model A gap-fill → Carbon Engine calculation → Model B recommendation generation & exact simulation.
* **Representative inference latency (Model B):** `~6.68 ms / call`. (Includes candidate generation, multiple baseline/simulated Carbon Engine calculations, and ML inference).
* **Test count:** 54 passing regression, invariant, and behavioral tests.
* **Reproducibility:** Fully reproducible via Python scripts and locked random states.

## Limitations

* **Model B Labels:** The Model B training dataset relies on a synthetic utility heuristic. The absolute performance metrics (NDCG) are very high because the model learns the heuristic easily, but true generalization will require capturing actual user acceptance labels.
* **Model A Model Sophistication:** Currently uses deterministic ratio scaling (peer group). An ML regressor is written (`train.py`) but experimental.

## Reproduction

To reproduce the benchmark outputs, execute the following from the project root:

```bash
# Ensure PYTHONPATH is set
export PYTHONPATH="$(pwd)"

# 1. Run the test suite
pytest backend/tests/ -v

# 2. Reproduce the benchmark numbers
python backend/scripts/run_benchmarks.py

# 3. Retrain the Model B ML Ranker (Optional)
python -m backend.ml.model_b.synthesizer
python -m backend.ml.model_b.train
```

---

# Final Verdict

**READY FOR INTEGRATION**
