// Query optimization utilities for reducing database egress

export const PRODUCT_LIST_FIELDS = `
  product_id,
  name,
  price,
  image_urls,
  categories,
  rating,
  stock,
  featured
`;

export const PRODUCT_CARD_FIELDS = `
  product_id,
  name,
  price,
  image_urls,
  categories,
  rating
`;

export const PRODUCT_DETAIL_FIELDS = `
  product_id,
  name,
  price,
  description,
  image_urls,
  categories,
  rating,
  stock,
  specification,
  features,
  brand_id
`;

export const CART_ITEM_FIELDS = `
  id,
  product_id,
  cart_id,
  quantity,
  variant_selections,
  products (
    product_id,
    name,
    price,
    image_urls
  )
`;

export const USER_PROFILE_FIELDS = `
  user_id,
  first_name,
  last_name,
  email,
  avatar_url
`;

// Pagination helpers
export const DEFAULT_PAGE_SIZE = 20;
export const FEATURED_PRODUCTS_LIMIT = 50;
export const RELATED_PRODUCTS_LIMIT = 12;