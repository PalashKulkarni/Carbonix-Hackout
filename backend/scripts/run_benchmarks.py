import time
import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import mean_absolute_error, ndcg_score, mean_absolute_percentage_error

from backend.engine.calculator import calculate_supplier_emissions
from backend.engine.models import SupplierActivityInput
from backend.ml.model_a.service import ModelAService
from backend.ml.model_b.service import get_model_b_service
from backend.ml.model_b.schemas import Recommendation

def benchmark_carbon_engine():
    # Load demo supplier
    with open("fixtures/suppliers.json") as f:
        data = json.load(f)
    supplier = SupplierActivityInput(**data["items"][0])
    
    # Latency
    start = time.perf_counter()
    n_iters = 1000
    for _ in range(n_iters):
        calculate_supplier_emissions(supplier)
    duration = time.perf_counter() - start
    
    latency_ms = (duration / n_iters) * 1000
    print(f"Carbon Engine Latency: {latency_ms:.3f} ms/call")
    return latency_ms

def benchmark_model_a():
    with open("fixtures/suppliers.json") as f:
        data = json.load(f)
    suppliers = [SupplierActivityInput(**item) for item in data["items"]]
    
    service = ModelAService()
    
    # Leave-one-out evaluation on energy_kwh
    y_true = []
    y_pred_peer = []
    y_pred_mean = []
    
    for i, supp in enumerate(suppliers):
        if not supp.energy_kwh: continue
        peers = [s for j, s in enumerate(suppliers) if j != i]
        service.set_peers(peers)
        
        # True value
        y_true.append(supp.energy_kwh)
        
        # Peer group prediction
        act_missing = supp.model_copy(deep=True)
        act_missing.energy_kwh = 0.0 # treat as missing
        _, res = service.fill_supplier_activity(act_missing, missing_fields=["energy_kwh"])
        y_pred_peer.append(res.energy_kwh if res.energy_kwh is not None else 0.0)
        
        # Mean baseline
        peer_energies = [p.energy_kwh for p in peers if p.energy_kwh]
        y_pred_mean.append(np.mean(peer_energies) if peer_energies else 0.0)
        
    mae_peer = mean_absolute_error(y_true, y_pred_peer)
    mae_mean = mean_absolute_error(y_true, y_pred_mean)
    
    print(f"Model A (Peer Group) MAE: {mae_peer:.2f}")
    print(f"Model A (Mean Base) MAE: {mae_mean:.2f}")
    
    # Latency
    start = time.perf_counter()
    n_iters = 100
    for _ in range(n_iters):
        service.fill_supplier_activity(act_missing, missing_fields=["energy_kwh"])
    duration = time.perf_counter() - start
    latency_ms = (duration / n_iters) * 1000
    print(f"Model A Latency: {latency_ms:.3f} ms/call")
    
    return mae_peer, mae_mean, latency_ms

def benchmark_model_b():
    data_file = Path("backend/ml/model_b/data/synthetic_candidates.csv")
    if not data_file.exists():
        print("Model B synthetic data not found.")
        return
        
    df = pd.read_csv(data_file)
    
    # Ranking metrics (already trained)
    from backend.ml.model_b.ranker import get_ml_ranker
    ranker = get_ml_ranker()
    
    X = df[["action_type", "delta_co2e_kg", "delta_pct", "supplier_tier", "current_co2e_kg"]]
    y = df["utility_score"]
    groups = df["supplier_id"]
    
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    _, test_idx = next(gss.split(X, y, groups))
    
    test_df = df.iloc[test_idx].copy()
    
    # Predict
    test_df["y_pred_ml"] = ranker.model.predict(X.iloc[test_idx])
    test_df["y_pred_base"] = test_df["delta_co2e_kg"]
    
    ndcg_ml = []
    ndcg_base = []
    top1_ml = []
    top1_base = []
    
    for supplier, group in test_df.groupby("supplier_id"):
        if len(group) < 2: continue
        y_true = np.asarray([group["utility_score"].values])
        if np.std(y_true) == 0: continue
        
        ndcg_ml.append(ndcg_score(y_true, np.asarray([group["y_pred_ml"].values]), k=3))
        ndcg_base.append(ndcg_score(y_true, np.asarray([group["y_pred_base"].values]), k=3))
        
        true_top1_idx = np.argmax(group["utility_score"].values)
        top1_ml.append(1 if np.argmax(group["y_pred_ml"].values) == true_top1_idx else 0)
        top1_base.append(1 if np.argmax(group["y_pred_base"].values) == true_top1_idx else 0)
        
    print(f"Model B ML NDCG@3: {np.mean(ndcg_ml):.4f}")
    print(f"Model B Base NDCG@3: {np.mean(ndcg_base):.4f}")
    print(f"Model B ML Top-1: {np.mean(top1_ml):.4f}")
    print(f"Model B Base Top-1: {np.mean(top1_base):.4f}")
    
    # E2E Latency
    with open("fixtures/suppliers.json") as f:
        data = json.load(f)
    supplier = SupplierActivityInput(**data["items"][0])
    
    service = get_model_b_service()
    start = time.perf_counter()
    n_iters = 50
    for _ in range(n_iters):
        service.get_recommendations_for_supplier(supplier)
    duration = time.perf_counter() - start
    latency_ms = (duration / n_iters) * 1000
    print(f"Model B E2E Latency: {latency_ms:.3f} ms/call")
    
    return np.mean(ndcg_ml), np.mean(ndcg_base), np.mean(top1_ml), np.mean(top1_base), latency_ms

if __name__ == "__main__":
    print("--- Carbon Engine ---")
    benchmark_carbon_engine()
    print("\n--- Model A ---")
    benchmark_model_a()
    print("\n--- Model B ---")
    benchmark_model_b()
