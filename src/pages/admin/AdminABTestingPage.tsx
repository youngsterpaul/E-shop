import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { useABTests, useABTestStats, ABTest } from '@/hooks/useABTests';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Plus, Play, Pause, Trash2, Edit, BarChart3, Eye, 
  MousePointer, ShoppingCart, Trophy, TrendingUp 
} from 'lucide-react';
import { format } from 'date-fns';

const testTypes = [
  { value: 'hero_banner', label: 'Hero Banner' },
  { value: 'cta', label: 'Call to Action' },
  { value: 'layout', label: 'Layout' },
];

const statusColors: Record<string, string> = {
  draft: 'secondary',
  active: 'default',
  paused: 'outline',
  completed: 'destructive'
};

const ABTestStatsCard = ({ testId }: { testId: string }) => {
  const { data: stats, isLoading } = useABTestStats(testId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading stats...</div>;
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      {/* Variant A */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">A</span>
            Variant A
            {stats.winner === 'A' && <Trophy className="h-4 w-4 text-yellow-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Views</span>
            <span className="font-medium">{stats.variant_a_views}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1"><MousePointer className="h-3 w-3" /> Clicks</span>
            <span className="font-medium">{stats.variant_a_clicks}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> Conversions</span>
            <span className="font-medium">{stats.variant_a_conversions}</span>
          </div>
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span>CTR</span>
              <span className="font-medium">{stats.variant_a_ctr.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Conv. Rate</span>
              <span className="font-medium">{stats.variant_a_conversion_rate.toFixed(2)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variant B */}
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">B</span>
            Variant B
            {stats.winner === 'B' && <Trophy className="h-4 w-4 text-yellow-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Views</span>
            <span className="font-medium">{stats.variant_b_views}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1"><MousePointer className="h-3 w-3" /> Clicks</span>
            <span className="font-medium">{stats.variant_b_clicks}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> Conversions</span>
            <span className="font-medium">{stats.variant_b_conversions}</span>
          </div>
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span>CTR</span>
              <span className="font-medium">{stats.variant_b_ctr.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Conv. Rate</span>
              <span className="font-medium">{stats.variant_b_conversion_rate.toFixed(2)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidence indicator */}
      {stats.winner && stats.winner !== 'tie' && (
        <div className="col-span-2 p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Statistical Confidence</span>
            <span className="text-sm">{stats.confidence.toFixed(0)}%</span>
          </div>
          <Progress value={stats.confidence} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.confidence >= 95 
              ? `Variant ${stats.winner} is the clear winner with high confidence!`
              : `Variant ${stats.winner} is performing better. Continue testing for higher confidence.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

const AdminABTestingPage = () => {
  const { tests, isLoading, createTest, updateTest, deleteTest } = useABTests();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<ABTest | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    test_type: 'hero_banner',
    variant_a: { title: '', subtitle: '', image: '', cta_text: '' },
    variant_b: { title: '', subtitle: '', image: '', cta_text: '' },
    traffic_split: 50
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      test_type: 'hero_banner',
      variant_a: { title: '', subtitle: '', image: '', cta_text: '' },
      variant_b: { title: '', subtitle: '', image: '', cta_text: '' },
      traffic_split: 50
    });
    setEditingTest(null);
  };

  const handleOpenDialog = (test?: ABTest) => {
    if (test) {
      setEditingTest(test);
      setFormData({
        name: test.name,
        description: test.description || '',
        test_type: test.test_type,
        variant_a: test.variant_a as any,
        variant_b: test.variant_b as any,
        traffic_split: test.traffic_split
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingTest) {
      await updateTest.mutateAsync({
        id: editingTest.id,
        ...formData
      });
    } else {
      await createTest.mutateAsync(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleStatusChange = async (test: ABTest, newStatus: string) => {
    await updateTest.mutateAsync({
      id: test.id,
      status: newStatus,
      ...(newStatus === 'active' && !test.start_date ? { start_date: new Date().toISOString() } : {}),
      ...(newStatus === 'completed' ? { end_date: new Date().toISOString() } : {})
    });
  };

  return (
    <AdminLayout>
      <QuickActionsBar
        title="A/B Testing"
        onRefresh={() => {}}
      />

      <div className="flex justify-end mb-4">
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          New A/B Test
        </Button>
      </div>

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tests">All Tests</TabsTrigger>
          <TabsTrigger value="active">Active Tests</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="tests">
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center py-8">Loading tests...</div>
              ) : tests.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No A/B Tests</h3>
                  <p className="text-muted-foreground mb-4">Create your first A/B test to optimize your conversion rate</p>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Test
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Traffic Split</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{test.name}</p>
                            {test.description && (
                              <p className="text-xs text-muted-foreground">{test.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {testTypes.find(t => t.value === test.test_type)?.label || test.test_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ width: `${test.traffic_split}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {test.traffic_split}% / {100 - test.traffic_split}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[test.status] as any}>
                            {test.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(test.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {test.status === 'draft' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(test, 'active')}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {test.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(test, 'paused')}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            )}
                            {test.status === 'paused' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(test, 'active')}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTestId(test.id)}
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(test)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTest.mutate(test.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <div className="grid gap-4">
            {tests.filter(t => t.status === 'active').map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {test.name}
                        <Badge className="bg-green-500">Active</Badge>
                      </CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(test, 'paused')}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ABTestStatsCard testId={test.id} />
                </CardContent>
              </Card>
            ))}
            {tests.filter(t => t.status === 'active').length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Tests</h3>
                  <p className="text-muted-foreground">Start a test to see live results here</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>View detailed analytics for completed and active tests</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedTestId || undefined}
                onValueChange={setSelectedTestId}
              >
                <SelectTrigger className="w-full mb-4">
                  <SelectValue placeholder="Select a test to view results" />
                </SelectTrigger>
                <SelectContent>
                  {tests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.name} ({test.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTestId && <ABTestStatsCard testId={selectedTestId} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTest ? 'Edit A/B Test' : 'Create A/B Test'}</DialogTitle>
            <DialogDescription>
              Configure your A/B test variants and settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Test Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Hero Banner Summer Sale"
                />
              </div>
              <div className="space-y-2">
                <Label>Test Type</Label>
                <Select
                  value={formData.test_type}
                  onValueChange={(v) => setFormData({ ...formData, test_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {testTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the test hypothesis..."
              />
            </div>

            <div className="space-y-2">
              <Label>Traffic Split (Variant A: {formData.traffic_split}% / Variant B: {100 - formData.traffic_split}%)</Label>
              <Slider
                value={[formData.traffic_split]}
                onValueChange={([v]) => setFormData({ ...formData, traffic_split: v })}
                max={100}
                step={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Variant A */}
              <Card className="border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">A</span>
                    Variant A (Control)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={formData.variant_a.title || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        variant_a: { ...formData.variant_a, title: e.target.value }
                      })}
                      placeholder="Banner title"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Subtitle</Label>
                    <Input
                      value={formData.variant_a.subtitle || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        variant_a: { ...formData.variant_a, subtitle: e.target.value }
                      })}
                      placeholder="Banner subtitle"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Image URL</Label>
                    <Input
                      value={formData.variant_a.image || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        variant_a: { ...formData.variant_a, image: e.target.value }
                      })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CTA Text</Label>
                    <Input
                      value={formData.variant_a.cta_text || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        variant_a: { ...formData.variant_a, cta_text: e.target.value }
                      })}
                      placeholder="Shop Now"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Variant B */}
              <Card className="border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">B</span>
                    Variant B (Test)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={formData.variant_b.title || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        variant_b: { ...formData.variant_b, title: e.target.value }
                      })}
                      placeholder="Banner title"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Subtitle</Label>
                    <Input
                      value={formData.variant_b.subtitle || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        variant_b: { ...formData.variant_b, subtitle: e.target.value }
                      })}
                      placeholder="Banner subtitle"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Image URL</Label>
                    <Input
                      value={formData.variant_b.image || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        variant_b: { ...formData.variant_b, image: e.target.value }
                      })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CTA Text</Label>
                    <Input
                      value={formData.variant_b.cta_text || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        variant_b: { ...formData.variant_b, cta_text: e.target.value }
                      })}
                      placeholder="Buy Now"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name}>
              {editingTest ? 'Update Test' : 'Create Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminABTestingPage;