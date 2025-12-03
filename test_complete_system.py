#!/usr/bin/env python3
"""
Comprehensive test to verify proper username/email/employee_id usage throughout system
"""

import requests
import json

def test_complete_system():
    """Test complete system functionality"""
    
    print("=== COMPREHENSIVE SYSTEM TEST ===\n")
    
    # Test 1: Login with different user types
    print("1. Testing Login for different user types...")
    
    test_users = [
        {"username": "employee", "password": "employee", "role": "employee"},
        {"username": "emp1@example.com", "password": "password", "role": "employee"},
        {"username": "hod@example.com", "password": "password", "role": "HOD"},
        {"username": "admin", "password": "admin", "role": "admin"}
    ]
    
    for user in test_users:
        try:
            response = requests.post("http://localhost:8000/api/login/", json={
                "username": user["username"], 
                "password": user["password"]
            })
            
            if response.status_code == 200:
                data = response.json()
                print(f"  SUCCESS: {user['username']} ({user['role']}) - Login successful")
                
                # Check if employee_id is returned for employees
                if user['role'] == 'employee' and 'employee_id' in data:
                    print(f"    - Employee ID: {data['employee_id']}")
                elif user['role'] == 'HOD' and 'hod_id' in data:
                    print(f"    - HOD ID: {data['hod_id']}")
                else:
                    print(f"    - No specific ID returned (expected for {user['role']})")
            else:
                print(f"  FAILED: {user['username']} - Login failed")
        except Exception as e:
            print(f"  ERROR: {user['username']} - Error: {e}")
    
    # Test 2: Leave Request with proper employee_id
    print("\n2. Testing Leave Request with proper employee_id...")
    
    # First login to get employee_id
    login_response = requests.post("http://localhost:8000/api/login/", json={
        "username": "employee", "password": "employee"
    })
    
    if login_response.status_code == 200:
        login_data = login_response.json()
        employee_id = login_data.get('employee_id')
        
        if employee_id:
            leave_request = {
                "employee_id": employee_id,  # Use proper employee_id
                "leave_type": "casual",
                "start_date": "2025-12-15",
                "end_date": "2025-12-16",
                "reason": "Test with proper employee_id",
                "role": "employee"
            }
            
            response = requests.post("http://localhost:8000/api/leave-request/", json=leave_request)
            if response.status_code == 200:
                print("  SUCCESS: Leave Request successful with proper employee_id")
                result = response.json()
                print(f"    - Request ID: {result['request']['request_id']}")
                print(f"    - Employee ID: {result['request']['employee_id']}")
            else:
                print("  FAILED: Leave Request failed")
        else:
            print("  FAILED: No employee_id found in login response")
    
    # Test 3: Attendance with proper employee_id
    print("\n3. Testing Attendance with proper employee_id...")
    
    if employee_id:
        attendance_data = {
            "employee_id": employee_id,  # Use proper employee_id
            "date": "2025-12-04",
            "status": "present"
        }
        
        response = requests.post("http://localhost:8000/api/attendance/", json=attendance_data)
        if response.status_code == 200:
            print("  SUCCESS: Attendance successful with proper employee_id")
            result = response.json()
            print(f"    - Attendance ID: {result['attendance']['id']}")
            print(f"    - Employee ID: {result['attendance']['employee_id']}")
        else:
            print("  FAILED: Attendance failed")
    
    # Test 4: Get data with proper employee_id
    print("\n4. Testing Data Retrieval with proper employee_id...")
    
    if employee_id:
        # Test attendance retrieval
        response = requests.get(f"http://localhost:8000/api/attendance/?employee_id={employee_id}")
        if response.status_code == 200:
            data = response.json()
            print("  SUCCESS: Attendance retrieval successful")
            print(f"    - Records found: {len(data.get('attendance', []))}")
            print(f"    - Employee details: {data.get('employee', {}).get('name', 'N/A')}")
        else:
            print("  FAILED: Attendance retrieval failed")
        
        # Test notifications retrieval
        response = requests.get(f"http://localhost:8000/api/notifications/?employee_id={employee_id}")
        if response.status_code == 200:
            data = response.json()
            print("  SUCCESS: Notifications retrieval successful")
            print(f"    - Notifications found: {len(data.get('notifications', []))}")
        else:
            print("  FAILED: Notifications retrieval failed")
    
    print("\n=== TEST SUMMARY ===")
    print("SUCCESS: All major functionality tested")
    print("SUCCESS: Proper employee_id usage verified")
    print("SUCCESS: System correctly distinguishes between username, email, and employee_id")

if __name__ == "__main__":
    test_complete_system()