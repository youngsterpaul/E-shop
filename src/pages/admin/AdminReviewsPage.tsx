import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Star, Search, Trash2, Check, X, Eye, TrendingUp, MessageSquare, Reply } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface ReviewReply {
  id: string;
  reply_text: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Review {
  review_id: string;
  product_id: string;
  user_id: string;
  username: string;
  rating: number;
  comment: string;
  created_at: string;
  media_urls: string[] | null;
  review_replies?: ReviewReply[];
  product?: {
    name: string;
    image_urls: string[];
  };
}

export default function AdminReviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all reviews with product info and replies
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-reviews', searchTerm, ratingFilter],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          review_replies (
            id,
            reply_text,
            user_id,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,comment.ilike.%${searchTerm}%`);
      }

      if (ratingFilter !== 'all') {
        query = query.eq('rating', parseInt(ratingFilter));
      }

      const { data: reviewsData, error } = await query;
      if (error) throw error;

      // Fetch product details for each review
      const productIds = [...new Set(reviewsData.map(r => r.product_id))];
      const { data: productsData } = await supabase
        .from('products')
        .select('product_id, name, image_urls')
        .in('product_id', productIds);

      const productsMap = new Map(productsData?.map(p => [p.product_id, p]) || []);
      
      return reviewsData.map(review => ({
        ...review,
        product: productsMap.get(review.product_id)
      })) as Review[];
    }
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['admin-reviews-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating');
      
      if (error) throw error;

      const totalReviews = data.length;
      const avgRating = data.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
      const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: data.filter(r => r.rating === rating).length,
        percentage: (data.filter(r => r.rating === rating).length / totalReviews) * 100
      }));

      return {
        totalReviews,
        avgRating: avgRating.toFixed(1),
        ratingDistribution
      };
    }
  });

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: async (reviewIds: string[]) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .in('review_id', reviewIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-analytics'] });
      setSelectedReviews([]);
      toast.success('Review(s) deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete review(s): ' + error.message);
    }
  });

  const handleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map(r => r.review_id));
    }
  };

  const handleSelectReview = (reviewId: string) => {
    setSelectedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleBulkDelete = () => {
    if (selectedReviews.length === 0) {
      toast.error('Please select reviews to delete');
      return;
    }
    
    if (confirm(`Delete ${selectedReviews.length} review(s)?`)) {
      deleteMutation.mutate(selectedReviews);
    }
  };

  const handleDeleteSingle = (reviewId: string) => {
    if (confirm('Delete this review?')) {
      deleteMutation.mutate([reviewId]);
    }
  };

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, text }: { reviewId: string; text: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('review_replies')
        .insert({
          review_id: reviewId,
          user_id: user.id,
          reply_text: text
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setReplyingTo(null);
      setReplyText('');
      toast.success('Reply posted successfully');
    },
    onError: (error) => {
      toast.error('Failed to post reply: ' + error.message);
    }
  });

  // Edit reply mutation
  const editReplyMutation = useMutation({
    mutationFn: async ({ replyId, text }: { replyId: string; text: string }) => {
      const { error } = await supabase
        .from('review_replies')
        .update({ reply_text: text, updated_at: new Date().toISOString() })
        .eq('id', replyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setEditingReplyId(null);
      setEditReplyText('');
      toast.success('Reply updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update reply: ' + error.message);
    }
  });

  const handleReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    replyMutation.mutate({ reviewId, text: replyText });
  };

  const handleEditReply = (replyId: string) => {
    if (!editReplyText.trim()) return;
    editReplyMutation.mutate({ replyId, text: editReplyText });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reviews Management</h1>
          <p className="text-muted-foreground mt-1">Moderate and manage customer reviews</p>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalReviews}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  {analytics.avgRating}
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rating Distribution</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {analytics.ratingDistribution.slice(0, 3).map(({ rating, percentage }) => (
                    <div key={rating} className="flex items-center gap-2 text-xs">
                      <span className="w-8">{rating}⭐</span>
                      <div className="flex-1 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-10 text-muted-foreground">{percentage.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 flex gap-2 w-full md:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Ratings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedReviews.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedReviews.length})
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No reviews found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedReviews.length === reviews.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead className="w-[400px]">Review & Replies</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.review_id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedReviews.includes(review.review_id)}
                            onCheckedChange={() => handleSelectReview(review.review_id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {review.product?.image_urls?.[0] && (
                              <img 
                                src={review.product.image_urls[0]} 
                                alt={review.product?.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <span className="font-medium text-sm max-w-[200px] truncate">
                              {review.product?.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {review.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{review.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm">{review.comment}</p>
                              {review.media_urls && review.media_urls.length > 0 && (
                                <Badge variant="secondary" className="mt-1">
                                  {review.media_urls.length} photo(s)
                                </Badge>
                              )}
                            </div>

                            {/* Display existing replies */}
                            {review.review_replies && review.review_replies.length > 0 && (
                              <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                                {review.review_replies.map((reply) => (
                                  <div key={reply.id} className="bg-muted/50 p-2 rounded text-sm">
                                    {editingReplyId === reply.id ? (
                                      <div className="space-y-2">
                                        <Textarea
                                          value={editReplyText}
                                          onChange={(e) => setEditReplyText(e.target.value)}
                                          className="min-h-[60px]"
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => handleEditReply(reply.id)}
                                            disabled={editReplyMutation.isPending}
                                          >
                                            Save
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              setEditingReplyId(null);
                                              setEditReplyText('');
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <p className="text-primary font-medium mb-1">Admin Reply:</p>
                                        <p>{reply.reply_text}</p>
                                        <div className="flex items-center justify-between mt-1">
                                          <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                          </span>
                                          {user?.id === reply.user_id && (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                setEditingReplyId(reply.id);
                                                setEditReplyText(reply.reply_text);
                                              }}
                                            >
                                              Edit
                                            </Button>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply form */}
                            {replyingTo === review.review_id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Write your reply..."
                                  className="min-h-[80px]"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleReply(review.review_id)}
                                    disabled={replyMutation.isPending || !replyText.trim()}
                                  >
                                    <Reply className="h-4 w-4 mr-1" />
                                    Post Reply
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyText('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReplyingTo(review.review_id)}
                              >
                                <Reply className="h-4 w-4 mr-1" />
                                Reply
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSingle(review.review_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
