import asyncio
import os
import sys

# Ensure current folder is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import database
from database import get_db, User
from auth import register, login, UserCreate, UserLogin

async def run_tests():
    print("--- STARTING SECURITY AUTH TESTS ---")
    
    # 1. Init Database
    database.init_db()
    
    db = next(get_db())
    
    # Clean up existing test user if present
    test_email = "test_verify_user@example.com"
    existing = db.query(User).filter(User.email == test_email).first()
    if existing:
        db.delete(existing)
        db.commit()
        print("Cleaned up old test user.")
        
    # 2. Test registration
    print("Testing Registration...")
    reg_data = UserCreate(email=test_email, password="securepassword123", name="Tester")
    res = await register(reg_data, db)
    
    assert res.access_token is not None, "Registration failed to return access token"
    assert res.user["email"] == test_email, "User email mismatch in registration response"
    print("Registration OK!")
    
    # 3. Test duplicate registration
    print("Testing Duplicate Registration...")
    try:
        await register(reg_data, db)
        assert False, "Allowed duplicate registration"
    except Exception as e:
        print("Duplicate Registration correctly blocked:", str(e))
        
    # 4. Test login
    print("Testing Login...")
    login_data = UserLogin(email=test_email, password="securepassword123")
    login_res = await login(login_data, db)
    assert login_res.access_token is not None, "Login failed to return token"
    print("Login OK!")
    
    # 5. Test invalid login
    print("Testing Invalid Login...")
    bad_login_data = UserLogin(email=test_email, password="wrongpassword")
    try:
        await login(bad_login_data, db)
        assert False, "Allowed login with wrong password"
    except Exception as e:
        print("Wrong password correctly blocked:", str(e))
        
    print("--- ALL TESTS COMPLETED SUCCESSFULLY! ---")

if __name__ == "__main__":
    asyncio.run(run_tests())
