import { useState, useEffect } from "react";

/**
 * Hook to detect user role by testing API endpoints
 * Returns: { isOwner, isManager, isSales, isLoading }
 */
export function useRoleDetection(token) {
  const [role, setRole] = useState({
    isOwner: false,
    isManager: false,
    isSales: false,
    isLoading: true,
  });

  useEffect(() => {
    if (!token) {
      setRole({ isOwner: false, isManager: false, isSales: false, isLoading: false });
      return;
    }

    const detectRole = async () => {
      const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
      
      // Test endpoints in order: owner -> manager -> sales
      // We test owner first because owners can access manager endpoints
      try {
        // Test if user is owner
        const ownerResponse = await fetch(`${base}/owner/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (ownerResponse.status === 200) {
          setRole({ isOwner: true, isManager: true, isSales: false, isLoading: false });
          return;
        }

        // Test if user is manager (can access manager endpoints)
        const managerResponse = await fetch(`${base}/manager/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (managerResponse.status === 200) {
          setRole({ isOwner: false, isManager: true, isSales: false, isLoading: false });
          return;
        }

        // Test if user is sales
        const salesResponse = await fetch(`${base}/sales/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (salesResponse.status === 200) {
          setRole({ isOwner: false, isManager: false, isSales: true, isLoading: false });
          return;
        }

        // If none of the above, user might not be a supplier
        setRole({ isOwner: false, isManager: false, isSales: false, isLoading: false });
      } catch (error) {
        console.error("Error detecting role:", error);
        setRole({ isOwner: false, isManager: false, isSales: false, isLoading: false });
      }
    };

    detectRole();
  }, [token]);

  return role;
}


