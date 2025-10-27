
export interface CategoryAttribute {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'range' | 'checkbox' | 'size' | 'color';
  options?: string[];
  required?: boolean;
  displayInFilters?: boolean;
  displayInCart?: boolean;
}

export interface CategoryConfig {
  id: string;
  name: string;
  attributes: CategoryAttribute[];
  subcategories?: Record<string, CategoryAttribute[]>;
}

export const categoryConfigs: Record<string, CategoryConfig> = {
  electronics: {
    id: 'electronics',
    name: 'Electronics',
    attributes: [
      {
        id: 'brand',
        name: 'Brand',
        type: 'select',
        options: ['Samsung', 'Apple', 'Sony', 'LG', 'Huawei'],
        displayInFilters: true,
        displayInCart: true
      },
      {
        id: 'warranty',
        name: 'Warranty Period',
        type: 'select',
        options: ['6 months', '1 year', '2 years', '3 years'],
        displayInFilters: true,
        displayInCart: true
      },
      {
        id: 'storage',
        name: 'Storage',
        type: 'select',
        options: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'],
        displayInFilters: true,
        displayInCart: true
      }
    ],
    subcategories: {
      smartphones: [
        {
          id: 'screen_size',
          name: 'Screen Size',
          type: 'select',
          options: ['5.5"', '6.1"', '6.5"', '6.7"'],
          displayInFilters: true,
          displayInCart: true
        },
        {
          id: 'color',
          name: 'Color',
          type: 'color',
          options: ['black', 'white', 'blue', 'red', 'gold'],
          displayInFilters: true,
          displayInCart: true
        }
      ],
      laptops: [
        {
          id: 'processor',
          name: 'Processor',
          type: 'select',
          options: ['Intel i3', 'Intel i5', 'Intel i7', 'AMD Ryzen 5', 'AMD Ryzen 7'],
          displayInFilters: true,
          displayInCart: true
        },
        {
          id: 'ram',
          name: 'RAM',
          type: 'select',
          options: ['4GB', '8GB', '16GB', '32GB'],
          displayInFilters: true,
          displayInCart: true
        }
      ]
    }
  },
  clothing: {
    id: 'clothing',
    name: 'Clothing',
    attributes: [
      {
        id: 'brand',
        name: 'Brand',
        type: 'select',
        options: ['Nike', 'Adidas', 'Puma', 'Zara', 'H&M'],
        displayInFilters: true,
        displayInCart: true
      },
      {
        id: 'material',
        name: 'Material',
        type: 'multiselect',
        options: ['Cotton', 'Polyester', 'Wool', 'Silk', 'Denim'],
        displayInFilters: true,
        displayInCart: false
      },
      {
        id: 'size',
        name: 'Size',
        type: 'size',
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        required: true,
        displayInFilters: true,
        displayInCart: true
      },
      {
        id: 'color',
        name: 'Color',
        type: 'color',
        options: ['black', 'white', 'blue', 'red', 'green', 'yellow'],
        displayInFilters: true,
        displayInCart: true
      }
    ],
    subcategories: {
      shirts: [
        {
          id: 'collar_type',
          name: 'Collar Type',
          type: 'select',
          options: ['Regular', 'Button-down', 'Spread', 'Cutaway'],
          displayInFilters: true,
          displayInCart: true
        },
        {
          id: 'sleeve_length',
          name: 'Sleeve Length',
          type: 'select',
          options: ['Short Sleeve', 'Long Sleeve', '3/4 Sleeve'],
          displayInFilters: true,
          displayInCart: true
        }
      ],
      shoes: [
        {
          id: 'shoe_size',
          name: 'Shoe Size',
          type: 'select',
          options: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
          required: true,
          displayInFilters: true,
          displayInCart: true
        },
        {
          id: 'shoe_type',
          name: 'Type',
          type: 'select',
          options: ['Sneakers', 'Formal', 'Boots', 'Sandals'],
          displayInFilters: true,
          displayInCart: true
        }
      ]
    }
  },
  home_garden: {
    id: 'home_garden',
    name: 'Home & Garden',
    attributes: [
      {
        id: 'room',
        name: 'Room',
        type: 'multiselect',
        options: ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Garden'],
        displayInFilters: true,
        displayInCart: false
      },
      {
        id: 'material',
        name: 'Material',
        type: 'select',
        options: ['Wood', 'Metal', 'Plastic', 'Glass', 'Fabric'],
        displayInFilters: true,
        displayInCart: true
      }
    ],
    subcategories: {
      furniture: [
        {
          id: 'dimensions',
          name: 'Dimensions',
          type: 'select',
          options: ['Small', 'Medium', 'Large', 'Extra Large'],
          displayInFilters: true,
          displayInCart: true
        },
        {
          id: 'assembly_required',
          name: 'Assembly Required',
          type: 'checkbox',
          displayInFilters: true,
          displayInCart: true
        }
      ]
    }
  },
  books: {
    id: 'books',
    name: 'Books',
    attributes: [
      {
        id: 'author',
        name: 'Author',
        type: 'select',
        options: [], // Would be populated dynamically
        displayInFilters: true,
        displayInCart: true
      },
      {
        id: 'language',
        name: 'Language',
        type: 'select',
        options: ['English', 'Swahili', 'French', 'Spanish'],
        displayInFilters: true,
        displayInCart: true
      },
      {
        id: 'format',
        name: 'Format',
        type: 'select',
        options: ['Paperback', 'Hardcover', 'E-book', 'Audiobook'],
        displayInFilters: true,
        displayInCart: true
      },
      {
        id: 'genre',
        name: 'Genre',
        type: 'multiselect',
        options: ['Fiction', 'Non-fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Biography'],
        displayInFilters: true,
        displayInCart: false
      }
    ]
  }
};

export const getCategoryAttributes = (category: string, subcategory?: string): CategoryAttribute[] => {
  const config = categoryConfigs[category];
  if (!config) return [];
  
  let attributes = [...config.attributes];
  
  if (subcategory && config.subcategories?.[subcategory]) {
    attributes = [...attributes, ...config.subcategories[subcategory]];
  }
  
  return attributes;
};

export const getFilterableAttributes = (category: string, subcategory?: string): CategoryAttribute[] => {
  return getCategoryAttributes(category, subcategory).filter(attr => attr.displayInFilters);
};

export const getCartDisplayAttributes = (category: string, subcategory?: string): CategoryAttribute[] => {
  return getCategoryAttributes(category, subcategory).filter(attr => attr.displayInCart);
};

