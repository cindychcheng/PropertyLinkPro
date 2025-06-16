import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export default function Users() {
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error loading users: {String(error)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">System Users ({users.length})</h2>
          
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user: User) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email || user.id}
                      </h3>
                      {user.email && (
                        <p className="text-sm text-gray-600">{user.email}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {user.role}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {user.status || 'active'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}