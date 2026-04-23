import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const withRoleProtection = (Component, allowedRoles, requiredLocalStorage = null) => {
  const ProtectedComponent = (props) => {
    const navigate = useNavigate();
    
    // Simple synchronous check - no state management needed
    const userRole = localStorage.getItem('userRole');
    const selectedHodId = localStorage.getItem('selectedHodId');
    const selectedPrincipalId = localStorage.getItem('selectedPrincipalId');
    
    console.log(`\n[${new Date().toLocaleTimeString()}] 🔐 RoleProtection CHECK - ${Component.displayName || Component.name}`);
    console.log(`  User Role: ${userRole}`);
    console.log(`  Allowed Roles: [${allowedRoles.join(', ')}]`);
    console.log(`  selectedHodId: ${selectedHodId || 'none'}`);
    console.log(`  selectedPrincipalId: ${selectedPrincipalId || 'none'}`);

    // First check: user must have a role
    if (!userRole) {
      console.error('  ❌ DENIED: No role in localStorage!');
      navigate('/');
      return null;
    }

    // CRITICAL: If admin selected HOD but is trying to access Principal, block them
    if (userRole === 'admin' && selectedHodId && Component.displayName === 'PrincipalDashboard') {
      console.error(`  ❌ DENIED: Admin with selectedHodId cannot access PrincipalDashboard`);
      navigate('/hod');
      return null;
    }

    // Second check: user's role must be in allowed roles
    const hasRoleAccess = allowedRoles.includes(userRole);
    console.log(`  Role Match: ${hasRoleAccess ? '✅ YES' : '❌ NO'}`);
    
    if (!hasRoleAccess) {
      console.error(`  ❌ DENIED: Role "${userRole}" not in allowed list`);
      return null; // Don't redirect, just deny access
    }

    // Third check: if required localStorage key is specified, it must exist (except for admins who are just logging in normally)
    if (requiredLocalStorage && userRole !== 'admin') {
      const requiredValue = localStorage.getItem(requiredLocalStorage);
      console.log(`  Required key "${requiredLocalStorage}": ${requiredValue ? '✅ SET' : '❌ NOT SET'}`);
      
      if (!requiredValue) {
        console.error(`  ❌ DENIED: Required key "${requiredLocalStorage}" not found`);
        return null; // Don't redirect, just deny access
      }
    }

    // All checks passed
    console.log(`  ✅ GRANTED: Access allowed!`);
    return <Component {...props} />;
  };

  ProtectedComponent.displayName = `withRoleProtection(${Component.displayName || Component.name})`;
  return ProtectedComponent;
};






