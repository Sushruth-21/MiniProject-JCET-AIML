#!/usr/bin/env python3
"""
Test script to verify the Employee ID auto-lookup fix
"""

import requests
import json

# Base URLs
FRONTEND_URL = "http://localhost:5174"
BACKEND_URL = "http://localhost:8000"

def test_employee_id_lookup():
    """Test that employee_id is automatically looked up from username"""
    
    print("Testing Employee ID auto-lookup fix...")
    
    # Test data
    test_username = "employee"  # This should now have proper employee record
    
    # Test 1: Leave Request with username (should auto-lookup employee_id)
    print("\n1. Testing Leave Request with username...")
    
    leave_request_data = {
        "username": test_username,
        "leave_type": "casual",
        "start_date": "2025-12-10",
        "end_date": "2025-12-11", 
        "reason": "Test leave request",
        "role": "employee"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/leave-request/", json=leave_request_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200 or response.status_code == 201:
            print("SUCCESS: Leave Request successful - Employee ID auto-lookup working!")
        else:
            print("FAILED: Leave Request failed")
            
    except Exception as e:
        print(f"ERROR: {e}")
    
    # Test 2: Attendance with username (should auto-lookup employee_id)
    print("\n2. Testing Attendance with username...")
    
    attendance_data = {
        "username": test_username,
        "date": "2025-12-03",
        "status": "present"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/attendance/", json=attendance_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200 or response.status_code == 201:
            print("SUCCESS: Attendance successful - Employee ID auto-lookup working!")
        else:
            print("FAILED: Attendance failed")
            
    except Exception as e:
        print(f"ERROR: {e}")
    
    # Test 3: Get Attendance with username
    print("\n3. Testing Get Attendance with username...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/attendance/?username={test_username}")
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Response: {data}")
        
        if response.status_code == 200:
            print("SUCCESS: Get Attendance successful - Employee ID auto-lookup working!")
        else:
            print("FAILED: Get Attendance failed")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_employee_id_lookup()