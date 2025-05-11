from app.database import add_updated_at_column

if __name__ == "__main__":
    print("Running database migration...")
    add_updated_at_column()
    print("Migration completed successfully!") 