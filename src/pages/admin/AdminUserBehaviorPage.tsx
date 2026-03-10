import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Search, ShoppingCart, Eye, Clock, Heart, TrendingUp,
  BarChart3, Users, Tag, DollarSign, MousePointerClick
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface UserBehaviorRow {
  id: string;
  user_id: string;
  viewed_categories: string[] | null;
  viewed_products: string[] | null;
  searched_terms: string[] | null;
  cart_product_ids: string[] | null;
  wishlist_product_ids: string[] | null;
  purchased_categories: string[] | null;
  clicked_products: string[] | null;
  preferred_brands: string[] | null;
  dwell_time: Record<string, number> | null;
  preferred_price_range: [number, number] | null;
  session_count: number | null;
  last_visit: string | null;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
];

const AdminUserBehaviorPage = () => {
  const [searchFilter, setSearchFilter] = useState('');

  const { data: behaviors = [], isLoading } = useQuery({
    queryKey: ['admin-user-behavior'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_behavior')
        .select('*')
        .order('last_visit', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as UserBehaviorRow[];
    },
  });

  // Aggregate stats
  const aggregated = useMemo(() => {
    const searchCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const cartCounts: Record<string, number> = {};
    const wishlistCounts: Record<string, number> = {};
    const brandCounts: Record<string, number> = {};
    const dwellProducts: Record<string, number> = {};
    let totalSessions = 0;

    for (const b of behaviors) {
      totalSessions += b.session_count || 0;

      for (const term of b.searched_terms || []) {
        searchCounts[term] = (searchCounts[term] || 0) + 1;
      }
      for (const cat of b.viewed_categories || []) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
      for (const pid of b.cart_product_ids || []) {
        cartCounts[pid] = (cartCounts[pid] || 0) + 1;
      }
      for (const pid of b.wishlist_product_ids || []) {
        wishlistCounts[pid] = (wishlistCounts[pid] || 0) + 1;
      }
      for (const brand of b.preferred_brands || []) {
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      }
      if (b.dwell_time) {
        for (const [pid, seconds] of Object.entries(b.dwell_time)) {
          dwellProducts[pid] = (dwellProducts[pid] || 0) + seconds;
        }
      }
    }

    const toSortedList = (obj: Record<string, number>) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));

    return {
      totalUsers: behaviors.length,
      totalSessions,
      topSearches: toSortedList(searchCounts),
      topCategories: toSortedList(categoryCounts),
      topCartProducts: toSortedList(cartCounts),
      topWishlistProducts: toSortedList(wishlistCounts),
      topBrands: toSortedList(brandCounts),
      topDwellProducts: toSortedList(dwellProducts),
    };
  }, [behaviors]);

  // Resolve product names for IDs
  const allProductIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of [...aggregated.topCartProducts, ...aggregated.topWishlistProducts, ...aggregated.topDwellProducts]) {
      ids.add(item.name);
    }
    return Array.from(ids);
  }, [aggregated]);

  const { data: productNames = {} } = useQuery({
    queryKey: ['product-names-lookup', allProductIds],
    queryFn: async () => {
      if (allProductIds.length === 0) return {};
      const { data } = await supabase
        .from('products')
        .select('product_id, name')
        .in('product_id', allProductIds.slice(0, 100));
      const map: Record<string, string> = {};
      for (const p of data || []) {
        map[p.product_id] = p.name;
      }
      return map;
    },
    enabled: allProductIds.length > 0,
  });

  const resolveName = (id: string) => productNames[id] || id.substring(0, 8) + '…';

  const filteredSearches = aggregated.topSearches.filter(s =>
    s.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const maxSearchCount = aggregated.topSearches[0]?.count || 1;
  const maxCategoryCount = aggregated.topCategories[0]?.count || 1;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Behavior Insights</h1>
        <p className="text-muted-foreground">Understand what users search, browse, and want — make data-driven product decisions</p>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{aggregated.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Tracked Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <MousePointerClick className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">{aggregated.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <Search className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">{aggregated.topSearches.length}</p>
                <p className="text-xs text-muted-foreground">Unique Searches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-4/10">
                <TrendingUp className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{aggregated.topCategories.length}</p>
                <p className="text-xs text-muted-foreground">Popular Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="searches" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="searches" className="gap-1.5">
            <Search className="h-3.5 w-3.5" /> Searches
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5">
            <Tag className="h-3.5 w-3.5" /> Categories
          </TabsTrigger>
          <TabsTrigger value="cart" className="gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5" /> Cart Demand
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="gap-1.5">
            <Heart className="h-3.5 w-3.5" /> Wishlist
          </TabsTrigger>
          <TabsTrigger value="dwell" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Dwell Time
          </TabsTrigger>
          <TabsTrigger value="brands" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Brands
          </TabsTrigger>
        </TabsList>

        {/* SEARCHES TAB */}
        <TabsContent value="searches">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" /> Top User Searches
              </CardTitle>
              <CardDescription>
                What users are looking for — use this to stock products or improve SEO
              </CardDescription>
              <div className="pt-2">
                <Input
                  placeholder="Filter search terms..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredSearches.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No search data yet</p>
              ) : (
                <div className="space-y-3">
                  {filteredSearches.slice(0, 25).map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-6 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{item.name}</span>
                          <Badge variant="secondary" className="ml-2 shrink-0">{item.count} users</Badge>
                        </div>
                        <Progress value={(item.count / maxSearchCount) * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CATEGORIES TAB */}
        <TabsContent value="categories">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" /> Most Browsed Categories
                </CardTitle>
                <CardDescription>Categories users spend time in — prioritize stocking these</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aggregated.topCategories.slice(0, 15).map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-6 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{item.name}</span>
                          <Badge variant="outline" className="ml-2 shrink-0">{item.count}</Badge>
                        </div>
                        <Progress value={(item.count / maxCategoryCount) * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                  {aggregated.topCategories.length === 0 && (
                    <p className="text-muted-foreground text-sm py-8 text-center">No data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {aggregated.topCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={aggregated.topCategories.slice(0, 8)}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name.substring(0, 12)} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {aggregated.topCategories.slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm py-16 text-center">No data yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CART DEMAND TAB */}
        <TabsContent value="cart">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Most Added to Cart
              </CardTitle>
              <CardDescription>
                Products with high cart-add rates — ensure these are always in stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aggregated.topCartProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No cart data yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Users Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aggregated.topCartProducts.slice(0, 20).map((item, i) => (
                      <TableRow key={item.name}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{resolveName(item.name)}</TableCell>
                        <TableCell className="text-right">
                          <Badge>{item.count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WISHLIST TAB */}
        <TabsContent value="wishlist">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" /> Most Wishlisted Products
              </CardTitle>
              <CardDescription>
                High-intent products — consider running promotions or restocking these
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aggregated.topWishlistProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No wishlist data yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Users Wishlisted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aggregated.topWishlistProducts.slice(0, 20).map((item, i) => (
                      <TableRow key={item.name}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{resolveName(item.name)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{item.count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DWELL TIME TAB */}
        <TabsContent value="dwell">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Highest Dwell Time Products
              </CardTitle>
              <CardDescription>
                Products users spend the most time viewing — high interest but may need a price drop or better description
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aggregated.topDwellProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No dwell data yet</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={aggregated.topDwellProducts.slice(0, 10).map(p => ({
                      name: resolveName(p.name).substring(0, 20),
                      seconds: p.count,
                    }))}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={80} />
                      <YAxis label={{ value: 'Total seconds', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(val: number) => [`${val}s`, 'Total dwell time']} />
                      <Bar dataKey="seconds" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <Table className="mt-4">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Total Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aggregated.topDwellProducts.slice(0, 15).map((item, i) => (
                        <TableRow key={item.name}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-medium">{resolveName(item.name)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">
                              {item.count >= 60
                                ? `${Math.floor(item.count / 60)}m ${item.count % 60}s`
                                : `${item.count}s`}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BRANDS TAB */}
        <TabsContent value="brands">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Preferred Brands
              </CardTitle>
              <CardDescription>
                Brands users gravitate towards — consider partnering or stocking more from these
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aggregated.topBrands.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No brand data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={aggregated.topBrands.slice(0, 10)} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminUserBehaviorPage;
