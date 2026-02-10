

## Flash Sale System Optimization Plan

### Issues Found

1. **"Fill All Empty Slots" only fills one slot** -- The admin button labeled "Fill Empty (N)" only creates the first empty slot instead of batch-creating all empty slots automatically.

2. **No navigation header/footer on user Flash Sale page** -- The page lacks the standard Header and Footer components, making it impossible for users to navigate back without using the browser back button.

3. **Date never refreshes on user page** -- The `today` variable is memoized with an empty dependency array, so if a user keeps the tab open past midnight, slots won't update to the new day.

4. **Inactive flash sales show as "Ended" instead of "Inactive"** -- All existing flash sales in the database have `is_active: false`, but the slot creator and table show them as "Ended" when they should show as "Inactive" (turned off by admin).

5. **Desktop product grid too dense** -- `grid-cols-6` on desktop makes product cards very small on the flash sale page.

6. **Bulk actions execute sequentially** -- The bulk activate/deactivate/delete operations use a `for` loop with `await`, which is slow for many selections. Should use `Promise.all` for parallel execution.

7. **Missing loading/success feedback on bulk operations** -- No toast notifications or loading states during bulk actions.

---

### Changes

#### 1. `src/pages/FlashSalePage.tsx` -- User Page Fixes
- Add `Header` and `Footer` components for proper navigation
- Change `today` from static memoized value to state that updates at midnight
- Adjust desktop grid from `grid-cols-6` to `grid-cols-5` for better card sizing
- Add a "View All" link back to the products page for ended slots
- Fix auto-slot-update interval to also refresh the `today` date

#### 2. `src/pages/admin/AdminFlashSalesPage.tsx` -- Admin Page Improvements
- Fix bulk operations to use `Promise.all` for parallel execution
- Add toast notifications for bulk action completion
- Add loading states during bulk mutations
- Improve the empty state messaging

#### 3. `src/components/admin/FlashSaleSlotCreator.tsx` -- Slot Creator Fix
- Fix "Fill All Empty Slots" to actually batch-create all empty slots sequentially (opening dialog for each is impractical; instead, create them all with default discount and 0 products, then admin can edit each to add products)
- Add a confirmation dialog before filling all slots
- Show a progress indicator during batch creation

#### 4. `src/utils/flashSaleSlots.ts` -- No changes needed
- The slot logic is correct. Times use local browser time which is appropriate.

---

### Technical Details

**Files to modify:**
1. `src/pages/FlashSalePage.tsx` -- Add Header/Footer, fix date memoization, adjust grid
2. `src/pages/admin/AdminFlashSalesPage.tsx` -- Parallel bulk ops, better feedback
3. `src/components/admin/FlashSaleSlotCreator.tsx` -- Batch fill all empty slots properly

**Key behavior improvements:**
- Users can navigate to/from the flash sale page using the site header
- Bulk admin actions complete faster and show progress feedback
- "Fill All Empty Slots" creates flash sales for every unfilled future slot in one action
- Product grid is more readable on desktop

