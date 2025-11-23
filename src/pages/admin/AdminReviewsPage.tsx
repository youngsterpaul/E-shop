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
import { Star, Search, Trash2, Check, X, Eye, TrendingUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  review_id: string;
  product_id: string;
  user_id: string;
  username: string;
  rating: number;
  comment: string;
  created_at: string;
  media_urls: string[] | null;
  product?: {
    name: string;
    image_urls: string[];
  };
}

export default function AdminReviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch all reviews with product info
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-reviews', searchTerm, ratingFilter],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select('*')
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
                      <TableHead>Review</TableHead>
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
                          <div className="max-w-[300px]">
                            <p className="text-sm line-clamp-2">{review.comment}</p>
                            {review.media_urls && review.media_urls.length > 0 && (
                              <Badge variant="secondary" className="mt-1">
                                {review.media_urls.length} photo(s)
                              </Badge>
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
