from database import Base, engine

print("Dropping old table...")
Base.metadata.drop_all(bind=engine)

print("Creating new table with 'content' column...")
Base.metadata.create_all(bind=engine)

print("Done! Database is synced.")