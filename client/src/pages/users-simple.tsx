import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";

const addUserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["read_only", "standard", "admin", "super_admin"]),
});

type AddUserForm = z.infer<typeof addUserSchema>;

export default function Users() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  // Separate active and pending users
  const activeUsers = users.filter(user => user.status === 'active');
  const pendingUsers = users.filter(user => user.status === 'pending');

  const form = useForm<AddUserForm>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      id: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "standard",
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (userData: AddUserForm) => {
      return apiRequest("POST", "/api/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User added successfully",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      return apiRequest("POST", `/api/users/${userId}/approve`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User approved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/users/${userId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User registration rejected",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error("Rejection error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject user",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddUserForm) => {
    addUserMutation.mutate(data);
  };

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Add a new user to the property management system. They will be able to sign in once added.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter user ID (e.g., 12345678)" {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="read_only">Read Only - View data only</SelectItem>
                          <SelectItem value="standard">Standard - Edit properties, tenants, landlords</SelectItem>
                          <SelectItem value="admin">Admin - Advanced features + audit logs</SelectItem>
                          <SelectItem value="super_admin">Super Admin - Full system access</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addUserMutation.isPending}>
                    {addUserMutation.isPending ? "Adding..." : "Add User"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Pending Registrations Section */}
      {pendingUsers.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-yellow-800 dark:text-yellow-200">
              Pending Registrations ({pendingUsers.length})
            </h2>
            <div className="space-y-4">
              {pendingUsers.map((user: User) => (
                <div key={user.id} className="border border-yellow-200 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email || user.id}
                      </h3>
                      {user.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Requested: {new Date(user.createdAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate({ userId: user.id, role: 'read_only' })}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectMutation.mutate(user.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Users Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Active Users ({activeUsers.length})</h2>
          
          {activeUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No active users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeUsers.map((user: User) => (
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