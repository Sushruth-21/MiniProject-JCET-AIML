#!/usr/bin/env python3
"""
Test login to verify employee_id is returned properly
"""

import requests
import json

def test_login():
    """Test that login returns proper employee_id"""
    
    print("Testing login with employee credentials...")
    
    login_data = {
        "username": "employee",
        "password": "employee"
    }
    
    try:
        response = requests.post("http://localhost:8000/api/login/", json=login_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if 'employee_id' in data:
                print("SUCCESS: Login returns employee_id!")
                print(f"Employee ID: {data['employee_id']}")
                print(f"Username: {data['username']}")
                print(f"Name: {data['name']}")
                print(f"Role: {data['role']}")
            else:
                print("FAILED: Login does not return employee_id")
        else:
            print("FAILED: Login failed")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_login()