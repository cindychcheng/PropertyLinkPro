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

export default function Users() {
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div>Error loading users: {String(error)}</div>;
  }

  return (
    <div>
      <h1>User Management</h1>
      <p>Total users: {users.length}</p>
      {users.map((user) => (
        <div key={user.id}>
          <p>{user.firstName} {user.lastName} - {user.email} ({user.role})</p>
        </div>
      ))}
    </div>
  );
}