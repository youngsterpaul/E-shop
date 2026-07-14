import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { AppRole } from '@/hooks/useUserRole';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Strong password validation schema matching useAuth.tsx requirements
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .refine(
    (password) => /(?=.*[a-z])/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => /(?=.*[A-Z])/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => /(?=.*\d)/.test(password),
    'Password must contain at least one number'
  )
  .refine(
    (password) => /(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password),
    'Password must contain at least one special character'
  )
  .refine(
    (password) => {
      const commonPasswords = ['password', '12345678', 'qwerty', 'admin', 'letmein'];
      return !commonPasswords.some(common => password.toLowerCase().includes(common));
    },
    'Password cannot contain common words'
  );

const userSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email too short')
    .max(255, 'Email too long')
    .transform(val => val.toLowerCase().trim()),
  password: passwordSchema,
  firstName: z.string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in first name'),
  lastName: z.string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in last name'),
  phone: z.string()
    .optional()
    .refine(
      val => !val || /^(\+254|0)[17]\d{8}$/.test(val),
      'Invalid Kenyan phone number format (e.g., +254712345678 or 0712345678)'
    ),
  role: z.enum(['superadmin', 'admin', 'moderator', 'user'] as const),
});

type UserFormData = z.infer<typeof userSchema>;

// Password strength indicator component
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const checks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'Lowercase letter', valid: /(?=.*[a-z])/.test(password) },
    { label: 'Uppercase letter', valid: /(?=.*[A-Z])/.test(password) },
    { label: 'Number', valid: /(?=.*\d)/.test(password) },
    { label: 'Special character', valid: /(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      {checks.map((check, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          {check.valid ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-red-500" />
          )}
          <span className={check.valid ? 'text-green-600' : 'text-muted-foreground'}>
            {check.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const AdminUserAddPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'user',
    },
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      setIsSubmitting(true);

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          }
        }
      });

      if (authError) throw authError;

      // If user creation was successful, update profile and assign role
      if (authData.user) {
        // Update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
          })
          .eq('user_id', authData.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }

        // Assign role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: data.role,
          });

        if (roleError) {
          console.error('Error assigning role:', roleError);
          toast({
            title: "Warning",
            description: "User created but role assignment failed. Please assign role manually.",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "User created",
        description: "The user has been successfully created.",
      });

      navigate('/admin/users');
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Button 
            variant="ghost"
            onClick={() => navigate('/admin/users')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Button>
          <h1 className="text-2xl font-bold">Add New User</h1>
          <p className="text-muted-foreground">Create a new user account</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>
              Enter the user information below to create a new account.
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
                        <Input {...field} type="email" required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" required />
                      </FormControl>
                      <PasswordStrengthIndicator password={field.value} />
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

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">User (Regular Customer)</SelectItem>
                          <SelectItem value="moderator">Moderator (Content Management)</SelectItem>
                          <SelectItem value="admin">Admin (Products & Orders)</SelectItem>
                          <SelectItem value="superadmin">Super Admin (Full Access)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    className="bg-green-500 hover:bg-green-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create User'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/admin/users')}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUserAddPage;