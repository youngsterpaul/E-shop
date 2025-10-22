import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isAdmin: boolean;
}

const AdminUserEditPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const form = useForm<UserFormData>({
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      isAdmin: false,
    },
  });

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        toast({
          title: "Error",
          description: "User ID is missing",
          variant: "destructive"
        });
        navigate('/supersmartkenyaadmin123/users');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            email: data.email || '',
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            phone: data.phone || '',
            isAdmin: data.is_admin || false,
          });
        }
      } catch (error: any) {
        console.error('Error fetching user:', error);
        toast({
          title: "Error loading user",
          description: error.message,
          variant: "destructive"
        });
        navigate('/supersmartkenyaadmin123/users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId, navigate, toast, form]);

  const onSubmit = async (data: UserFormData) => {
    if (!userId) return;

    try {
      setIsSubmitting(true);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          is_admin: data.isAdmin,
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      toast({
        title: "User updated",
        description: "The user has been successfully updated.",
      });

      navigate('/supersmartkenyaadmin123/users');
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="ml-0 md:ml-64 p-4 md:p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="ml-0 md:ml-64 p-4 md:p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/supersmartkenyaadmin123/users')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Button>
          <h1 className="text-2xl font-bold">Edit User</h1>
          <p className="text-muted-foreground">Update user information</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>
              Update the user information below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} required />
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
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" required disabled />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Email cannot be changed
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="+254..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={form.watch('isAdmin')}
                    onChange={(e) => form.setValue('isAdmin', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="isAdmin" className="text-sm font-medium">
                    Admin User
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    className="bg-green-500 hover:bg-green-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Updating...' : 'Update User'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/supersmartkenyaadmin123/users')}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserEditPage;