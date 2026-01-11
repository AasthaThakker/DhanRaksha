import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import os
import psycopg2
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

# 1. Database Connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/securebank?schema=public")

def fetch_data_and_train():
    print("🔄 Connecting to database to fetch training data...")
    try:
        # Robust URL parsing
        # Remove query parameters that might confuse psycopg2
        base_url = DATABASE_URL.split("?")[0]
        clean_url = base_url.replace("postgresql://", "postgresql+psycopg2://")
        
        print(f"📡 Using connection: {base_url}") # Don't log full URL with password in prod, but ok here
        
        engine = create_engine(clean_url)
        
        query = """
        SELECT "userId", "amount", "date" as created_at
        FROM "Transaction"
        ORDER BY "date" ASC
        """
        df = pd.read_sql(query, engine)
        
        if len(df) < 5:
            print("⚠️ Not enough data in database to train a robust model. Using synthetic data fallback.")
            # Create some "normal" patterns
            synthetic_data = [
                [100, 1, 1, 0], [150, 2, 1, 1], [50, 1, 1, 2], [200, 3, 1, 1],
                [120, 2, 1, 0], [80, 1, 1, 1], [110, 2, 1, 0], [90, 1, 1, 0]
            ]
            # Add some "anomalies"
            synthetic_data += [[5000, 15, 8, 12], [3000, 10, 5, 10]]
            
            X = pd.DataFrame(synthetic_data, columns=[
                "avg_amount_7d", "tx_velocity_1h", "device_change_freq", "time_of_day_deviation"
            ])
        else:
            print(f"📊 Processing {len(df)} transactions from database...")
            
            # Feature Engineering logic
            df['created_at'] = pd.to_datetime(df['created_at'])
            df['hour'] = df['created_at'].dt.hour
            
            # Calculate user mean hour
            user_means = df.groupby('userId')['hour'].mean().to_dict()
            
            features = []
            for idx, row in df.iterrows():
                u_id = row['userId']
                curr_time = row['created_at']
                
                # avg_amount_7d
                week_ago = curr_time - pd.Timedelta(days=7)
                avg_7d = df[(df['userId'] == u_id) & (df['created_at'] >= week_ago) & (df['created_at'] < curr_time)]['amount'].mean()
                if pd.isna(avg_7d): avg_7d = row['amount'] # Fallback to current if first tx
                
                # tx_velocity_1h
                hour_ago = curr_time - pd.Timedelta(hours=1)
                velocity_1h = df[(df['userId'] == u_id) & (df['created_at'] >= hour_ago) & (df['created_at'] < curr_time)].shape[0]
                
                # time_of_day_deviation
                mean_h = user_means.get(u_id, 12)
                dev = abs(row['hour'] - mean_h)
                
                features.append([avg_7d, velocity_1h, 1, dev]) # 1 is placeholder for device_change_freq
            
            X = pd.DataFrame(features, columns=[
                "avg_amount_7d", "tx_velocity_1h", "device_change_freq", "time_of_day_deviation"
            ])

        # 2. Train Isolation Forest
        print("🧠 Training Isolation Forest model...")
        model = IsolationForest(
            n_estimators=200,
            contamination=0.03,
            random_state=42
        )
        model.fit(X)

        # 3. Save Model
        model_path = os.path.join(os.path.dirname(__file__), "fraud_model.pkl")
        joblib.dump(model, model_path)
        print(f"✅ Model trained on {len(X)} samples and saved to {model_path}")

    except Exception as e:
        import traceback
        print(f"❌ Error during training pipeline: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    fetch_data_and_train()
