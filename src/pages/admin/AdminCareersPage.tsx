import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useJobListings, JobListing } from '@/hooks/useJobListings';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Briefcase, MapPin, Clock } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const emptyJob = {
  title: '',
  department: '',
  location: '',
  experience: '',
  type: 'Full-time',
  salary_range: '',
  responsibilities: [] as string[],
  requirements: [] as string[],
  is_active: true,
  display_order: 0,
};

const AdminCareersPage = () => {
  const { jobs, isLoading, createJob, updateJob, deleteJob, isCreating, isUpdating, isDeleting } = useJobListings(false);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Partial<JobListing> | null>(null);
  const [formData, setFormData] = useState(emptyJob);
  const [responsibilitiesText, setResponsibilitiesText] = useState('');
  const [requirementsText, setRequirementsText] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenDialog = (job?: JobListing) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title,
        department: job.department,
        location: job.location,
        experience: job.experience,
        type: job.type,
        salary_range: job.salary_range || '',
        responsibilities: job.responsibilities,
        requirements: job.requirements,
        is_active: job.is_active,
        display_order: job.display_order,
      });
      setResponsibilitiesText(job.responsibilities.join('\n'));
      setRequirementsText(job.requirements.join('\n'));
    } else {
      setEditingJob(null);
      setFormData(emptyJob);
      setResponsibilitiesText('');
      setRequirementsText('');
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.department || !formData.location || !formData.experience) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    const jobData = {
      ...formData,
      responsibilities: responsibilitiesText.split('\n').filter(r => r.trim()),
      requirements: requirementsText.split('\n').filter(r => r.trim()),
    };

    try {
      if (editingJob?.id) {
        await updateJob({ id: editingJob.id, ...jobData });
        toast({ title: 'Success', description: 'Job listing updated' });
      } else {
        await createJob(jobData);
        toast({ title: 'Success', description: 'Job listing created' });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save job listing', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteJob(deleteId);
      toast({ title: 'Success', description: 'Job listing deleted' });
      setDeleteId(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete job listing', variant: 'destructive' });
    }
  };

  const toggleActive = async (job: JobListing) => {
    try {
      await updateJob({ id: job.id, is_active: !job.is_active });
      toast({ title: 'Success', description: `Job ${job.is_active ? 'deactivated' : 'activated'}` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update job status', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <QuickActionsBar title="Career Listings" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Career Listings</h1>
            <p className="text-muted-foreground">Manage job openings displayed on the careers page</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Job
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.department}</TableCell>
                    <TableCell>{job.location}</TableCell>
                    <TableCell>{job.type}</TableCell>
                    <TableCell>
                      <Switch
                        checked={job.is_active}
                        onCheckedChange={() => toggleActive(job)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(job)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(job.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {jobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No job listings yet. Click "Add Job" to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingJob ? 'Edit Job Listing' : 'Add Job Listing'}</DialogTitle>
            <DialogDescription>
              {editingJob ? 'Update job listing details' : 'Create a new job listing for your careers page'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label>Department *</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData(p => ({ ...p, department: e.target.value }))}
                  placeholder="e.g., Engineering"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location *</Label>
                <Select value={formData.location} onValueChange={(v) => setFormData(p => ({ ...p, location: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="On-site">On-site</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="Remote/Hybrid">Remote/Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Job Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Experience *</Label>
                <Input
                  value={formData.experience}
                  onChange={(e) => setFormData(p => ({ ...p, experience: e.target.value }))}
                  placeholder="e.g., 3-5 years"
                />
              </div>
              <div className="space-y-2">
                <Label>Salary Range</Label>
                <Input
                  value={formData.salary_range}
                  onChange={(e) => setFormData(p => ({ ...p, salary_range: e.target.value }))}
                  placeholder="e.g., Ksh 50,000 - Ksh 80,000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Responsibilities (one per line)</Label>
              <Textarea
                value={responsibilitiesText}
                onChange={(e) => setResponsibilitiesText(e.target.value)}
                placeholder="Enter each responsibility on a new line"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Requirements (one per line)</Label>
              <Textarea
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                placeholder="Enter each requirement on a new line"
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(p => ({ ...p, is_active: checked }))}
              />
              <Label>Active (visible on careers page)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingJob ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this job listing. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminCareersPage;
