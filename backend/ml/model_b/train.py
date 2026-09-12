"""Training script for Model B ranking model."""

import os
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import GroupShuffleSplit
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.preprocessing import OrdinalEncoder
from sklearn.metrics import mean_absolute_error, ndcg_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

# Setup paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
DATA_FILE = DATA_DIR / "synthetic_candidates.csv"
ARTIFACTS_DIR = BASE_DIR / "artifacts"

def load_data() -> pd.DataFrame:
    df = pd.read_csv(DATA_FILE)
    return df

def train_model():
    df = load_data()
    print(f"Loaded {len(df)} samples.")
    
    # Feature Engineering
    feature_cols = ["action_type", "delta_co2e_kg", "delta_pct", "supplier_tier", "current_co2e_kg"]
    X = df[feature_cols]
    y = df["utility_score"]
    groups = df["supplier_id"]
    
    # Group-aware split to prevent data leakage (suppliers in train shouldn't be in test)
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))
    
    X_train, y_train = X.iloc[train_idx], y.iloc[train_idx]
    X_test, y_test = X.iloc[test_idx], y.iloc[test_idx]
    groups_test = groups.iloc[test_idx]
    
    categorical_cols = ["action_type"]
    numerical_cols = [c for c in feature_cols if c not in categorical_cols]
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), categorical_cols)
        ],
        remainder="passthrough"
    )
    
    categorical_features_idx = [0]
    
    model = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", HistGradientBoostingRegressor(
            categorical_features=categorical_features_idx,
            max_iter=300,
            learning_rate=0.05,
            random_state=42
        ))
    ])
    
    print("Training ML ranker...")
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    
    # Evaluate Regression
    mae = mean_absolute_error(y_test, y_pred)
    
    # Evaluate Ranking (NDCG) and compare to baseline (sorting by delta_co2e_kg)
    # We group by supplier_id in the test set.
    test_df = pd.DataFrame({
        "supplier_id": groups_test,
        "y_true": y_test,
        "y_pred": y_pred,
        "baseline_pred": X_test["delta_co2e_kg"] # Baseline ranks by absolute carbon reduction
    })
    
    ndcg_ml = []
    ndcg_baseline = []
    top1_acc_ml = []
    top1_acc_baseline = []
    
    for supplier, group in test_df.groupby("supplier_id"):
        if len(group) < 2:
            continue # Need at least 2 candidates to rank
            
        y_true = np.asarray([group["y_true"].values])
        y_pred_ml = np.asarray([group["y_pred"].values])
        y_pred_base = np.asarray([group["baseline_pred"].values])
        
        # We need true scores to have some variance for NDCG. If all same, skip.
        if np.std(y_true) == 0:
            continue
            
        ndcg_ml.append(ndcg_score(y_true, y_pred_ml, k=3))
        ndcg_baseline.append(ndcg_score(y_true, y_pred_base, k=3))
        
        # Top-1 accuracy
        true_top1_idx = np.argmax(group["y_true"].values)
        ml_top1_idx = np.argmax(group["y_pred"].values)
        base_top1_idx = np.argmax(group["baseline_pred"].values)
        
        top1_acc_ml.append(1 if true_top1_idx == ml_top1_idx else 0)
        top1_acc_baseline.append(1 if true_top1_idx == base_top1_idx else 0)
        
    print("\nEvaluation Metrics on Test Set (Grouped by Supplier - Leakage Free):")
    print(f"Regression MAE: {mae:.4f}")
    if ndcg_ml:
        print(f"ML Ranker NDCG@3: {np.mean(ndcg_ml):.4f}")
        print(f"Baseline (Max CO2) NDCG@3: {np.mean(ndcg_baseline):.4f}")
        print(f"ML Ranker Top-1 Acc: {np.mean(top1_acc_ml):.4f}")
        print(f"Baseline Top-1 Acc: {np.mean(top1_acc_baseline):.4f}")
    else:
        print("Not enough >1 candidate groups in test set for NDCG.")
    
    ARTIFACTS_DIR.mkdir(exist_ok=True)
    model_path = ARTIFACTS_DIR / "ranker_model.joblib"
    joblib.dump(model, model_path)
    print(f"\nSaved model to {model_path}")
    
if __name__ == "__main__":
    if not DATA_FILE.exists():
        print(f"Error: {DATA_FILE} not found. Run synthesizer.py first.")
    else:
        train_model()
