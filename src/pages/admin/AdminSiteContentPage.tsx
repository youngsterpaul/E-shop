import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { useAboutContent, AboutPageContent } from '@/hooks/useSiteContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Save, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const AdminSiteContentPage = () => {
  const { aboutContent, rawContent, isLoading, updateContent } = useAboutContent();
  const [editedContent, setEditedContent] = useState<AboutPageContent | null>(null);

  useEffect(() => {
    if (aboutContent) {
      setEditedContent(aboutContent);
    }
  }, [aboutContent]);

  const handleSave = async () => {
    if (!rawContent || !editedContent) return;
    
    await updateContent.mutateAsync({
      id: rawContent.id,
      content: editedContent as any,
    });
  };

  const updateStoryParagraph = (index: number, value: string) => {
    if (!editedContent) return;
    const newParagraphs = [...editedContent.story.paragraphs];
    newParagraphs[index] = value;
    setEditedContent({
      ...editedContent,
      story: { ...editedContent.story, paragraphs: newParagraphs },
    });
  };

  const addStoryParagraph = () => {
    if (!editedContent) return;
    setEditedContent({
      ...editedContent,
      story: {
        ...editedContent.story,
        paragraphs: [...editedContent.story.paragraphs, ''],
      },
    });
  };

  const removeStoryParagraph = (index: number) => {
    if (!editedContent) return;
    const newParagraphs = editedContent.story.paragraphs.filter((_, i) => i !== index);
    setEditedContent({
      ...editedContent,
      story: { ...editedContent.story, paragraphs: newParagraphs },
    });
  };

  const updateMissionParagraph = (index: number, value: string) => {
    if (!editedContent) return;
    const newParagraphs = [...editedContent.mission.paragraphs];
    newParagraphs[index] = value;
    setEditedContent({
      ...editedContent,
      mission: { ...editedContent.mission, paragraphs: newParagraphs },
    });
  };

  const updateValue = (index: number, field: 'name' | 'description', value: string) => {
    if (!editedContent) return;
    const newValues = [...editedContent.values];
    newValues[index] = { ...newValues[index], [field]: value };
    setEditedContent({
      ...editedContent,
      values: newValues,
    });
  };

  const addValue = () => {
    if (!editedContent) return;
    setEditedContent({
      ...editedContent,
      values: [...editedContent.values, { name: '', description: '' }],
    });
  };

  const removeValue = (index: number) => {
    if (!editedContent) return;
    const newValues = editedContent.values.filter((_, i) => i !== index);
    setEditedContent({
      ...editedContent,
      values: newValues,
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <QuickActionsBar title="Site Content Management" />

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">About Page Content</h2>
            <p className="text-muted-foreground">
              Edit the content displayed on the About page
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateContent.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateContent.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {editedContent && (
          <Tabs defaultValue="story" className="space-y-4">
            <TabsList>
              <TabsTrigger value="story">Our Story</TabsTrigger>
              <TabsTrigger value="mission">Mission</TabsTrigger>
              <TabsTrigger value="values">Values</TabsTrigger>
              <TabsTrigger value="cta">Call to Action</TabsTrigger>
            </TabsList>

            <TabsContent value="story">
              <Card>
                <CardHeader>
                  <CardTitle>Our Story Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Section Title</Label>
                    <Input
                      value={editedContent.story.title}
                      onChange={(e) =>
                        setEditedContent({
                          ...editedContent,
                          story: { ...editedContent.story, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Paragraphs</Label>
                      <Button variant="outline" size="sm" onClick={addStoryParagraph}>
                        <Plus className="h-4 w-4 mr-1" /> Add Paragraph
                      </Button>
                    </div>
                    {editedContent.story.paragraphs.map((p, i) => (
                      <div key={i} className="flex gap-2">
                        <Textarea
                          value={p}
                          onChange={(e) => updateStoryParagraph(i, e.target.value)}
                          rows={3}
                          className="flex-1"
                        />
                        {editedContent.story.paragraphs.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStoryParagraph(i)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mission">
              <Card>
                <CardHeader>
                  <CardTitle>Mission Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Section Title</Label>
                    <Input
                      value={editedContent.mission.title}
                      onChange={(e) =>
                        setEditedContent({
                          ...editedContent,
                          mission: { ...editedContent.mission, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-4">
                    <Label>Paragraphs</Label>
                    {editedContent.mission.paragraphs.map((p, i) => (
                      <Textarea
                        key={i}
                        value={p}
                        onChange={(e) => updateMissionParagraph(i, e.target.value)}
                        rows={3}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="values">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Company Values</CardTitle>
                  <Button variant="outline" size="sm" onClick={addValue}>
                    <Plus className="h-4 w-4 mr-1" /> Add Value
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editedContent.values.map((value, i) => (
                    <div key={i} className="flex gap-4 items-start p-4 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Value name"
                          value={value.name}
                          onChange={(e) => updateValue(i, 'name', e.target.value)}
                        />
                        <Textarea
                          placeholder="Description"
                          value={value.description}
                          onChange={(e) => updateValue(i, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                      {editedContent.values.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeValue(i)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cta">
              <Card>
                <CardHeader>
                  <CardTitle>Call to Action Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={editedContent.cta.title}
                      onChange={(e) =>
                        setEditedContent({
                          ...editedContent,
                          cta: { ...editedContent.cta, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editedContent.cta.description}
                      onChange={(e) =>
                        setEditedContent({
                          ...editedContent,
                          cta: { ...editedContent.cta, description: e.target.value },
                        })
                      }
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {!editedContent && !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No About page content found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSiteContentPage;
