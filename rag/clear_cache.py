from sqlalchemy import text
from database import SessionLocal

def clear_data():
    db = SessionLocal()
    try:
        # This deletes ALL cached sites so you can re-test cleanly
        print("Clearing bad cache data...")
        db.execute(text("DELETE FROM processed_sites"))
        db.commit()
        print("Success! Database is empty. You can scan again.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_data()