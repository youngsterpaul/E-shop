export type UserIntent = {
  viewedCategories: string[];
  viewedProducts: string[];
  searchedTerms: string[];
  cartProductIds: string[];
  wishlistProductIds: string[];
};

const KEY = "user_intent_v1";

export const getUserIntent = (): UserIntent => {
  if (typeof window === "undefined") {
    return emptyIntent();
  }

  return (
    JSON.parse(localStorage.getItem(KEY) || "null") || emptyIntent()
  );
};

export const updateUserIntent = (
  patch: Partial<UserIntent>
) => {
  const current = getUserIntent();
  const updated = {
    ...current,
    ...Object.fromEntries(
      Object.entries(patch).map(([k, v]) => [
        k,
        Array.from(new Set([...(current as any)[k], ...(v as any[])])),
      ])
    ),
  };

  localStorage.setItem(KEY, JSON.stringify(updated));
};

const emptyIntent = (): UserIntent => ({
  viewedCategories: [],
  viewedProducts: [],
  searchedTerms: [],
  cartProductIds: [],
  wishlistProductIds: [],
});
