#!/usr/bin/env python3
"""
Test Employee Management Delete Functionality
"""

import requests
import json

def test_delete_employee():
    """Test employee delete functionality"""
    
    print("=== EMPLOYEE DELETE TEST ===\n")
    
    # First get all employees
    try:
        response = requests.get("http://localhost:8000/api/employee-management/")
        if response.status_code == 200:
            data = response.json()
            employees = data.get('employees', [])
            if employees:
                test_employee = employees[0]  # Use first employee for testing
                employee_id = test_employee['employee_id']
                employee_name = test_employee['name']
                
                print(f"Testing delete for employee: {employee_name} (ID: {employee_id})")
                
                # Test delete
                delete_response = requests.delete("http://localhost:8000/api/delete-employee/", 
                                               json={'employee_id': employee_id})
                
                print(f"Delete Status Code: {delete_response.status_code}")
                delete_data = delete_response.json()
                print(f"Delete Response: {delete_data}")
                
                if delete_response.status_code == 200:
                    print("SUCCESS: Employee deleted successfully!")
                    
                    # Verify employee is gone
                    verify_response = requests.get("http://localhost:8000/api/employee-management/")
                    if verify_response.status_code == 200:
                        remaining_employees = verify_response.data.get('employees', [])
                        deleted_employee = None
                        for emp in remaining_employees:
                            if emp['employee_id'] == employee_id:
                                deleted_employee = emp
                                break
                        
                        if deleted_employee is None:
                            print("SUCCESS: Employee no longer in list!")
                        else:
                            print("FAILED: Employee still exists in list!")
                else:
                    print("FAILED: Delete operation failed!")
            else:
                print("No employees available for testing")
                
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_delete_employee()