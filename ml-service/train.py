import os
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    roc_curve
)

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/securebank?schema=public"
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "fraud_model.pkl")


def fetch_data_and_train():
    try:
        print("🔄 Connecting to database...")

        base_url = DATABASE_URL.split("?")[0]
        clean_url = base_url.replace("postgresql://", "postgresql+psycopg2://")
        engine = create_engine(clean_url)

        query = """
        SELECT "userId", "amount", "date" AS created_at
        FROM "Transaction"
        ORDER BY "date" ASC
        """

        df = pd.read_sql(query, engine)

        # ------------------------------------------------------------------
        # FALLBACK: SYNTHETIC DATA
        # ------------------------------------------------------------------
        if len(df) < 10:
            print("⚠️ Not enough data — using synthetic fallback")

            normal = np.random.normal(loc=[100, 1, 1, 1], scale=[20, 0.5, 0, 0.5], size=(200, 4))
            anomalies = np.array([
                [5000, 15, 1, 12],
                [3000, 10, 1, 10],
                [8000, 20, 1, 15]
            ])

            X = pd.DataFrame(
                np.vstack([normal, anomalies]),
                columns=[
                    "avg_amount_7d",
                    "tx_velocity_1h",
                    "device_change_freq",
                    "time_of_day_deviation",
                ],
            )

        # ------------------------------------------------------------------
        # REAL FEATURE ENGINEERING
        # ------------------------------------------------------------------
        else:
            print(f"📊 Processing {len(df)} transactions")

            df["created_at"] = pd.to_datetime(df["created_at"])
            df["hour"] = df["created_at"].dt.hour

            user_mean_hour = df.groupby("userId")["hour"].mean().to_dict()
            features = []

            for _, row in df.iterrows():
                uid = row["userId"]
                now = row["created_at"]

                week_ago = now - pd.Timedelta(days=7)
                avg_7d = df[
                    (df["userId"] == uid)
                    & (df["created_at"] >= week_ago)
                    & (df["created_at"] < now)
                ]["amount"].mean()

                if pd.isna(avg_7d):
                    avg_7d = row["amount"]

                hour_ago = now - pd.Timedelta(hours=1)
                velocity_1h = df[
                    (df["userId"] == uid)
                    & (df["created_at"] >= hour_ago)
                    & (df["created_at"] < now)
                ].shape[0]

                deviation = abs(row["hour"] - user_mean_hour.get(uid, 12))

                features.append([avg_7d, velocity_1h, 1, deviation])

            X = pd.DataFrame(
                features,
                columns=[
                    "avg_amount_7d",
                    "tx_velocity_1h",
                    "device_change_freq",
                    "time_of_day_deviation",
                ],
            )

        # ------------------------------------------------------------------
        # TRAIN / TEST SPLIT
        # ------------------------------------------------------------------
        X_train, X_test = train_test_split(X, test_size=0.25, random_state=42)

        # ------------------------------------------------------------------
        # TRAIN MODEL
        # ------------------------------------------------------------------
        model = IsolationForest(
            n_estimators=200,
            contamination=0.03,
            random_state=42,
        )

        print("🧠 Training Isolation Forest...")
        model.fit(X_train)

        # ------------------------------------------------------------------
        # PREDICTIONS & SCORES
        # ------------------------------------------------------------------
        scores = model.decision_function(X_test)
        y_pred = np.where(model.predict(X_test) == -1, 1, 0)

        # ------------------------------------------------------------------
        # PROXY GROUND TRUTH (TOP 3%)
        # ------------------------------------------------------------------
        threshold = np.percentile(scores, 3)
        y_true = np.where(scores <= threshold, 1, 0)

        # ------------------------------------------------------------------
        # METRICS
        # ------------------------------------------------------------------
        print("\n📊 Evaluation Metrics (Proxy Labels)")
        print(classification_report(y_true, y_pred, target_names=["Normal", "Fraud"]))

        roc_auc = roc_auc_score(y_true, -scores)
        print(f"ROC-AUC: {roc_auc:.4f}")

        # ------------------------------------------------------------------
        # CONFUSION MATRIX
        # ------------------------------------------------------------------
        cm = confusion_matrix(y_true, y_pred)
        plt.figure(figsize=(5, 4))
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
        plt.title("Confusion Matrix")
        plt.xlabel("Predicted")
        plt.ylabel("Actual")
        plt.tight_layout()
        plt.show()

        # ------------------------------------------------------------------
        # ROC CURVE
        # ------------------------------------------------------------------
        fpr, tpr, _ = roc_curve(y_true, -scores)
        plt.figure(figsize=(6, 4))
        plt.plot(fpr, tpr, label=f"AUC={roc_auc:.3f}")
        plt.plot([0, 1], [0, 1], linestyle="--")
        plt.xlabel("False Positive Rate")
        plt.ylabel("True Positive Rate")
        plt.title("ROC Curve")
        plt.legend()
        plt.tight_layout()
        plt.show()

        # ------------------------------------------------------------------
        # SCORE DISTRIBUTION
        # ------------------------------------------------------------------
        plt.figure(figsize=(6, 4))
        sns.histplot(scores, bins=50, kde=True)
        plt.axvline(threshold, color="red", linestyle="--", label="Fraud Threshold")
        plt.title("Anomaly Score Distribution")
        plt.legend()
        plt.tight_layout()
        plt.show()

        # ------------------------------------------------------------------
        # STABILITY TEST (JACCARD)
        # ------------------------------------------------------------------
        model2 = IsolationForest(
            n_estimators=200,
            contamination=0.03,
            random_state=99,
        ).fit(X_train)

        scores2 = model2.decision_function(X_test)

        top1 = set(np.argsort(scores)[: int(0.03 * len(scores))])
        top2 = set(np.argsort(scores2)[: int(0.03 * len(scores2))])

        jaccard = len(top1 & top2) / len(top1 | top2)
        print(f"🔁 Stability (Jaccard Overlap): {jaccard:.2%}")

        # ------------------------------------------------------------------
        # SAVE MODEL
        # ------------------------------------------------------------------
        joblib.dump(model, MODEL_PATH)
        print(f"✅ Model saved to {MODEL_PATH}")

    except Exception as e:
        import traceback
        print("❌ Training failed")
        traceback.print_exc()


if __name__ == "__main__":
    fetch_data_and_train()
