import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Settings,
  Sliders,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import CategoryFilter from "@/components/products/CategoryFilter";
import BrandFilter from "@/components/products/BrandFilter";
import PriceFilter from "@/components/products/PriceFilter";
import RatingFilter from "@/components/products/RatingFilter";
import ProductGrid from "@/components/products/ProductGrid";
import { useCategories } from '@/hooks/useCategories';
import SubcategoryFilter from "@/components/products/SubcategoryFilter";
import { MobileHeader } from "@/components/ui/mobile-header";
import { isMobileUserAgent } from "@/hooks/use-mobile";
import SiteBreadcrumb from "@/components/Breadcrumb";
import MobileNav from "@/components/MobileNav";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  subcategory?: string;
  categoryId?: number;
  subcategoryId?: number;
  isNew?: boolean;
  isSale?: boolean;
  rating?: number;
  brand?: string;
  brandId?: string;
}

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, subcategories, fetchSubcategories, setSubcategories } = useCategories();
  const { toast } = useToast();
  const mobileFilterRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [openFilterSections, setOpenFilterSections] = useState<string[]>([
    "categories",
    "price",
  ]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [sortOption, setSortOption] = useState("featured");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  
  // Product state
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = isMobileUserAgent();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Handle click outside for mobile filters
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileFiltersOpen && mobileFilterRef.current) {
        const target = event.target as Node;
        if (!mobileFilterRef.current.contains(target)) {
          setMobileFiltersOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileFiltersOpen]);

  // Handle escape key to close mobile filters
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mobileFiltersOpen) {
        setMobileFiltersOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [mobileFiltersOpen]);

  // Prevent body scroll when mobile filters are open
  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileFiltersOpen]);
  
  // Update subcategories when categories change
  useEffect(() => {
    const updateFilterOptions = async () => {
      if (selectedCategories.length === 1) {
        const selectedCategory = categories.find(cat => cat.category === selectedCategories[0]);
        if (selectedCategory) {
          await fetchSubcategories(selectedCategory.id);
        }
        
        // Clear subcategories and brands that are no longer valid
        setSelectedSubcategories([]);
        setSelectedBrands([]);
      } else {
        setSelectedSubcategories([]);
        setSelectedBrands([]);
        setSubcategories([]);
      }
    };

    updateFilterOptions();
  }, [selectedCategories, categories, fetchSubcategories, setSubcategories]);
  
  // Load products on initial render
  useEffect(() => {
    const getProducts = async () => {
      setLoading(true);
      try {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`
            product_id,
            name,
            price,
            image_urls,
            categories,
            rating,
            stock,
            brand_id,
            brands:brand_id (
              name
            )
          `);
        
        if (productError) throw productError;
        
        if (productData) {
          const transformedProducts = productData.map(product => {
            // Parse category and subcategory from "Category > Subcategory" format
            const categoryParts = product.categories?.split(' > ') || [];
            const category = categoryParts[0] || 'Uncategorized';
            const subcategory = categoryParts[1] || undefined;

            return {
              id: product.product_id,
              name: product.name,
              price: product.price || 0,
              originalPrice: product.price ? product.price * 1.1 : undefined,
              image: product.image_urls ? product.image_urls[0] : '/placeholder.svg',
              category: category,
              subcategory: subcategory,
              isNew: Math.random() > 0.7,
              isSale: Math.random() > 0.7,
              rating: product.rating || Math.floor(Math.random() * 5) + 1,
              brand: product.brands?.name || 'Unknown',
              brandId: product.brand_id || undefined
            };
          });
          
          setProducts(transformedProducts);
          applyFilters(transformedProducts);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load products. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    getProducts();
    
    // Initialize filters from URL
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    }
    
    const sortParam = searchParams.get("sort");
    if (sortParam) {
      setSortOption(sortParam);
    }
  }, [searchParams, toast]);
  
  // Apply filters and sorting
  const applyFilters = (productList = products) => {
    let result = [...productList];
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      result = result.filter(product => 
        selectedCategories.includes(product.category)
      );
    }
    
    // Apply subcategory filter
    if (selectedSubcategories.length > 0) {
      result = result.filter(product => 
        product.subcategory && selectedSubcategories.includes(product.subcategory)
      );
    }
    
    // Apply brand filter
    if (selectedBrands.length > 0) {
      result = result.filter(product => 
        selectedBrands.includes(product.brand || '')
      );
    }
    
    // Apply price filter
    result = result.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    // Apply rating filter
    if (selectedRatings.length > 0) {
      result = result.filter(product => 
        product.rating !== undefined && selectedRatings.includes(Math.floor(product.rating))
      );
    }
    
    // Apply sorting
    switch (sortOption) {
      case "price-low-high":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high-low":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort(() => Math.random() - 0.5);
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }
    
    setFilteredProducts(result);
    setCurrentPage(1);
  };
  
// Update URL when filters change (debounced)
useEffect(() => {
  const timeoutId = setTimeout(() => {
    const params = new URLSearchParams();
    
    if (selectedCategories.length === 1) {
      params.set("category", selectedCategories[0]);
    }
    
    if (sortOption !== "featured") {
      params.set("sort", sortOption);
    }
    
    setSearchParams(params);
  }, 300); // 300ms debounce

  applyFilters();

  return () => clearTimeout(timeoutId);
}, [selectedCategories, selectedSubcategories, selectedBrands, priceRange, selectedRatings, sortOption]);

  // Toggle filter sections (mobile)
  const toggleFilterSection = (section: string) => {
    if (openFilterSections.includes(section)) {
      setOpenFilterSections(openFilterSections.filter(s => s !== section));
    } else {
      setOpenFilterSections([...openFilterSections, section]);
    }
  };
  
  // Toggle category selection
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([category]); // Only allow one category at a time
    }
  };
  
  // Toggle subcategory selection
  const toggleSubcategory = (subcategory: string) => {
    if (selectedSubcategories.includes(subcategory)) {
      setSelectedSubcategories(selectedSubcategories.filter(s => s !== subcategory));
    } else {
      setSelectedSubcategories([...selectedSubcategories, subcategory]);
    }
  };
  
  // Toggle brand selection
  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };
  
  // Toggle rating selection
  const toggleRating = (rating: number) => {
    if (selectedRatings.includes(rating)) {
      setSelectedRatings(selectedRatings.filter(r => r !== rating));
    } else {
      setSelectedRatings([...selectedRatings, rating]);
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedBrands([]);
    setPriceRange([0, 100000]);
    setSelectedRatings([]);
    setSortOption("featured");
    setSearchParams({});
  };
  
  // Calculate pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  
  // Generate page links
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (currentPage <= 3) {
      return [1, 2, 3, 4, 'ellipsis', totalPages];
    }
    
    if (currentPage >= totalPages - 2) {
      return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    
    return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
  };
  
  const pageNumbers = getPageNumbers();

  // Transform categories for the filter component
  const categoryData = categories.map(cat => ({
    id: cat.id.toString(),
    name: cat.category,
    subcategories: [],
    brands: []
  }));

  // Transform subcategories for the filter component
  const subcategoryData = subcategories.map(subcat => ({
    id: subcat.id.toString(),
    name: subcat.category
  }));

  return (
    <>
      {/* About Page Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Products - SmartKenya",
          "description": "Filter products by categories, subcategories, price and brands - SmartKenya",
          "url": "https://smartkenya.co.ke/products",
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://smartkenya.co.ke"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Products",
                "item": "https://smartkenya.co.ke/products"
              }
            ]
          }
        })}
      </script>

      <div className="flex flex-col min-h-screen">
        {!isMobile && <Header />}
        {isMobile && (
          <MobileHeader 
            title={'Products'}
            backTo="/"
            rightAction={
              <Button variant="ghost" size="sm" className="p-2">
                <Settings className="h-4 w-4" />
              </Button>
            }
          />
        )}

        <main className="flex-grow pt-6 pb-16">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <SiteBreadcrumb 
              items={[
                { label: 'Home', href: '/' },
                { label: 'Products' }
              ]}
              className="mb-6"
            />

            {/* Title and sort */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold">All Products</h1>
                <p className="text-gray-500">
                  {filteredProducts.length} products found
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-full md:w-48">
                  <Select value={sortOption} onValueChange={setSortOption}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                      <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  className="md:hidden"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <Sliders className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Active filters */}
            {(selectedCategories.length > 0 ||
              selectedSubcategories.length > 0 ||
              selectedBrands.length > 0 ||
              selectedRatings.length > 0 ||
              priceRange[0] > 0 ||
              priceRange[1] < 100000) && (
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedCategories.map((category) => (
                  <Badge key={category} variant="outline" className="pl-2 flex items-center gap-1">
                    {category}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleCategory(category)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}

                {selectedSubcategories.map((subcategory) => (
                  <Badge key={subcategory} variant="outline" className="pl-2 flex items-center gap-1">
                    {subcategory}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleSubcategory(subcategory)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}

                {selectedBrands.map((brand) => (
                  <Badge key={brand} variant="outline" className="pl-2 flex items-center gap-1">
                    {brand}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleBrand(brand)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}

                {selectedRatings.map((rating) => (
                  <Badge key={rating} variant="outline" className="pl-2 flex items-center gap-1">
                    {rating}★ & Up
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleRating(rating)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}

                {(priceRange[0] > 0 || priceRange[1] < 100000) && (
                  <Badge variant="outline" className="pl-2 flex items-center gap-1">
                    Ksh {priceRange[0].toLocaleString()} - Ksh{" "}
                    {priceRange[1].toLocaleString()}
                  </Badge>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm hover:bg-transparent hover:text-orange-600"
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </div>
            )}

            <div className="grid grid-cols-12 gap-6">
              {/* Desktop Filters */}
              <aside className="hidden md:block col-span-3 lg:col-span-2">
                <div className="sticky top-24 space-y-6">
                  <CategoryFilter 
                    categories={categoryData}
                    selectedCategories={selectedCategories}
                    onToggleCategory={toggleCategory}
                  />

                  <SubcategoryFilter 
                    subcategories={subcategoryData}
                    selectedSubcategories={selectedSubcategories}
                    onToggleSubcategory={toggleSubcategory}
                    selectedCategories={selectedCategories}
                  />

                  <PriceFilter 
                    priceRange={priceRange}
                    onPriceChange={setPriceRange}
                  />

                  <BrandFilter 
                    selectedBrands={selectedBrands}
                    onToggleBrand={toggleBrand}
                    selectedCategories={selectedCategories}
                    selectedSubcategories={selectedSubcategories}
                  />

                  <RatingFilter 
                    selectedRatings={selectedRatings}
                    onToggleRating={toggleRating}
                  />
                </div>
              </aside>

              {/* Mobile filters overlay */}
              {mobileFiltersOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
                  <div 
                    ref={mobileFilterRef}
                    className="absolute right-0 top-0 bottom-0 w-[80%] max-w-md bg-white overflow-y-auto"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4 border-b">
                        <h2 className="text-xl font-bold">Filters</h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMobileFiltersOpen(false)}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <Button
                            variant="ghost"
                            className="flex w-full justify-between px-0"
                            onClick={() => toggleFilterSection("categories")}
                          >
                            <span className="font-medium">Categories</span>
                            {openFilterSections.includes("categories") ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </Button>
                          {openFilterSections.includes("categories") && (
                            <div className="mt-2">
                              <CategoryFilter 
                                categories={categoryData}
                                selectedCategories={selectedCategories}
                                onToggleCategory={toggleCategory}
                              />
                            </div>
                          )}
                        </div>

                        {subcategories.length > 0 && (
                          <div>
                            <Button
                              variant="ghost"
                              className="flex w-full justify-between px-0"
                              onClick={() => toggleFilterSection("subcategories")}
                            >
                              <span className="font-medium">Subcategories</span>
                              {openFilterSections.includes("subcategories") ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </Button>
                            {openFilterSections.includes("subcategories") && (
                              <div className="mt-2">
                                <SubcategoryFilter 
                                  subcategories={subcategoryData}
                                  selectedSubcategories={selectedSubcategories}
                                  onToggleSubcategory={toggleSubcategory}
                                  selectedCategories={selectedCategories}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <Button
                            variant="ghost"
                            className="flex w-full justify-between px-0"
                            onClick={() => toggleFilterSection("price")}
                          >
                            <span className="font-medium">Price Range</span>
                            {openFilterSections.includes("price") ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </Button>
                          {openFilterSections.includes("price") && (
                            <div className="mt-4">
                              <PriceFilter 
                                priceRange={priceRange}
                                onPriceChange={setPriceRange}
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <Button
                            variant="ghost"
                            className="flex w-full justify-between px-0"
                            onClick={() => toggleFilterSection("brand")}
                          >
                            <span className="font-medium">Brand</span>
                            {openFilterSections.includes("brand") ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </Button>
                          {openFilterSections.includes("brand") && (
                            <div className="mt-2">
                              <BrandFilter 
                                selectedBrands={selectedBrands}
                                onToggleBrand={toggleBrand}
                                selectedCategories={selectedCategories}
                                selectedSubcategories={selectedSubcategories}
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <Button
                            variant="ghost"
                            className="flex w-full justify-between px-0"
                            onClick={() => toggleFilterSection("rating")}
                          >
                            <span className="font-medium">Rating</span>
                            {openFilterSections.includes("rating") ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </Button>
                          {openFilterSections.includes("rating") && (
                            <div className="mt-2">
                              <RatingFilter 
                                selectedRatings={selectedRatings}
                                onToggleRating={toggleRating}
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-4 border-t sticky bottom-0 bg-white">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={resetFilters}
                          >
                            Reset
                          </Button>
                          <Button
                            className="flex-1 bg-orange-500 hover:bg-orange-600"
                            onClick={() => setMobileFiltersOpen(false)}
                          >
                            Apply Filters
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Products */}
              <div className="col-span-12 md:col-span-9 lg:col-span-10">
                <ProductGrid products={currentProducts} loading={loading} />

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                  <Pagination className="mt-8">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {pageNumbers.map((page, idx) => (
                        <PaginationItem key={idx}>
                          {page === "ellipsis" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => setCurrentPage(page as number)}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </div>
          </div>
        </main>
        <MobileNav/>
      </div>
    </>
  );
};

export default ProductsPage;