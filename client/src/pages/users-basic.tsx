import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function UsersBasic() {
  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "staff"
  });

  const { data: users = [], isLoading, error, refetch } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        alert("User added successfully!");
        setNewUser({ email: "", firstName: "", lastName: "", role: "staff" });
        refetch();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert("Failed to add user");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        alert("User deleted successfully!");
        refetch();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert("Failed to delete user");
    }
  };

  const handleGeneratePassword = async (userId: string, userName: string) => {
    if (!confirm(`Generate a temporary password for ${userName}? This will create a new password that expires in 24 hours.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${userId}/generate-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Password generated successfully!\n\nTemporary Password: ${result.tempPassword}\n\nThis password expires in 24 hours. Please share this securely with the user.`);
        refetch();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to generate password'}`);
      }
    } catch (error) {
      alert("Failed to generate password");
    }
  };

  if (isLoading) {
    return <div style={{padding: "20px"}}>Loading users...</div>;
  }

  if (error) {
    return <div style={{padding: "20px"}}>Error loading users: {String(error)}</div>;
  }

  return (
    <div style={{padding: "20px"}}>
      <h1>User Management</h1>
      
      <div style={{marginBottom: "30px", padding: "20px", border: "1px solid #ccc", borderRadius: "5px"}}>
        <h2>Add New User</h2>
        <form onSubmit={handleAddUser}>
          <div style={{marginBottom: "10px"}}>
            <label>Email: </label>
            <input 
              type="email" 
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              required
              style={{marginLeft: "10px", padding: "5px"}}
            />
          </div>
          
          <div style={{marginBottom: "10px"}}>
            <label>First Name: </label>
            <input 
              type="text" 
              value={newUser.firstName}
              onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
              required
              style={{marginLeft: "10px", padding: "5px"}}
            />
          </div>
          
          <div style={{marginBottom: "10px"}}>
            <label>Last Name: </label>
            <input 
              type="text" 
              value={newUser.lastName}
              onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
              required
              style={{marginLeft: "10px", padding: "5px"}}
            />
          </div>
          
          <div style={{marginBottom: "10px"}}>
            <label>Role: </label>
            <select 
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              style={{marginLeft: "10px", padding: "5px"}}
            >
              <option value="read_only">Read Only</option>
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <button type="submit" style={{padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "3px"}}>
            Add User
          </button>
        </form>
      </div>

      <div>
        <h2>Current Users ({users.length})</h2>
        {users.map((user) => (
          <div key={user.id} style={{padding: "10px", margin: "5px", border: "1px solid #ddd", borderRadius: "3px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <div>
              <strong>{user.firstName} {user.lastName}</strong> ({user.role})
              <br />
              <small>Email: {user.email}</small>
              <br />
              <small>Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</small>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={() => handleGeneratePassword(user.id, `${user.firstName} ${user.lastName}`)}
                style={{
                  padding: "5px 10px", 
                  backgroundColor: "#28a745", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "3px",
                  cursor: "pointer"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#218838"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#28a745"}
              >
                Generate Password
              </button>
              <button 
                onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                style={{
                  padding: "5px 10px", 
                  backgroundColor: "#dc3545", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "3px",
                  cursor: "pointer"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#c82333"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#dc3545"}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}