export interface Subcategory {
  id: string;
  name: string;
}

export interface Brand {
  id: string;
  name: string;
  categories: string[];
}

export interface CategoryData {
  id: string;
  name: string;
  subcategories: Subcategory[];
  brands: Brand[];
}

export const realCategoryData: CategoryData[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    subcategories: [
      { id: 'smartphones', name: 'Smartphones' },
      { id: 'laptops', name: 'Laptops' },
      { id: 'tablets', name: 'Tablets' },
      { id: 'headphones', name: 'Headphones' },
      { id: 'cameras', name: 'Cameras' },
      { id: 'gaming', name: 'Gaming' }
    ],
    brands: [
      { id: 'apple', name: 'Apple', categories: ['electronics'] },
      { id: 'samsung', name: 'Samsung', categories: ['electronics'] },
      { id: 'sony', name: 'Sony', categories: ['electronics'] },
      { id: 'lg', name: 'LG', categories: ['electronics'] },
      { id: 'xiaomi', name: 'Xiaomi', categories: ['electronics'] },
      { id: 'huawei', name: 'Huawei', categories: ['electronics'] },
      { id: 'dell', name: 'Dell', categories: ['electronics'] },
      { id: 'hp', name: 'HP', categories: ['electronics'] },
      { id: 'lenovo', name: 'Lenovo', categories: ['electronics'] },
      { id: 'canon', name: 'Canon', categories: ['electronics'] },
      { id: 'nikon', name: 'Nikon', categories: ['electronics'] }
    ]
  },
  {
    id: 'clothing',
    name: 'Clothing',
    subcategories: [
      { id: 'mens-clothing', name: "Men's Clothing" },
      { id: 'womens-clothing', name: "Women's Clothing" },
      { id: 'shoes', name: 'Shoes' },
      { id: 'accessories', name: 'Accessories' },
      { id: 'sportswear', name: 'Sportswear' }
    ],
    brands: [
      { id: 'nike', name: 'Nike', categories: ['clothing'] },
      { id: 'adidas', name: 'Adidas', categories: ['clothing'] },
      { id: 'puma', name: 'Puma', categories: ['clothing'] },
      { id: 'zara', name: 'Zara', categories: ['clothing'] },
      { id: 'hm', name: 'H&M', categories: ['clothing'] },
      { id: 'uniqlo', name: 'Uniqlo', categories: ['clothing'] },
      { id: 'levis', name: "Levi's", categories: ['clothing'] },
      { id: 'gap', name: 'Gap', categories: ['clothing'] }
    ]
  },
  {
    id: 'home-garden',
    name: 'Home & Garden',
    subcategories: [
      { id: 'furniture', name: 'Furniture' },
      { id: 'kitchen', name: 'Kitchen' },
      { id: 'bathroom', name: 'Bathroom' },
      { id: 'garden', name: 'Garden' },
      { id: 'decor', name: 'Home Decor' }
    ],
    brands: [
      { id: 'ikea', name: 'IKEA', categories: ['home-garden'] },
      { id: 'wayfair', name: 'Wayfair', categories: ['home-garden'] },
      { id: 'pottery-barn', name: 'Pottery Barn', categories: ['home-garden'] },
      { id: 'west-elm', name: 'West Elm', categories: ['home-garden'] }
    ]
  },
  {
    id: 'books',
    name: 'Books',
    subcategories: [
      { id: 'fiction', name: 'Fiction' },
      { id: 'non-fiction', name: 'Non-Fiction' },
      { id: 'educational', name: 'Educational' },
      { id: 'children', name: 'Children Books' }
    ],
    brands: [
      { id: 'penguin', name: 'Penguin Random House', categories: ['books'] },
      { id: 'macmillan', name: 'Macmillan', categories: ['books'] },
      { id: 'oxford', name: 'Oxford University Press', categories: ['books'] }
    ]
  },
  {
    id: 'beauty',
    name: 'Beauty & Personal Care',
    subcategories: [
      { id: 'skincare', name: 'Skincare' },
      { id: 'makeup', name: 'Makeup' },
      { id: 'haircare', name: 'Hair Care' },
      { id: 'fragrances', name: 'Fragrances' }
    ],
    brands: [
      { id: 'loreal', name: "L'Oréal", categories: ['beauty'] },
      { id: 'nivea', name: 'Nivea', categories: ['beauty'] },
      { id: 'maybelline', name: 'Maybelline', categories: ['beauty'] },
      { id: 'clinique', name: 'Clinique', categories: ['beauty'] }
    ]
  }
];

export const getSubcategoriesForCategory = (categoryId: string): Subcategory[] => {
  const category = realCategoryData.find(cat => cat.id === categoryId || cat.name === categoryId);
  return category?.subcategories || [];
};

export const getBrandsForCategory = (categoryId: string): Brand[] => {
  const category = realCategoryData.find(cat => cat.id === categoryId || cat.name === categoryId);
  return category?.brands || [];
};

export const getAllCategories = (): CategoryData[] => {
  return realCategoryData;
};
