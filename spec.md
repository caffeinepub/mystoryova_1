# Mystoryova

## Current State
Merchandise items support: per-size stock (XS–XXL for Clothing category), saved as `sizeStock_{id}` setting. Cart stores `id`, `name`, `price`, `type`, `quantity`, `currency`. The `MerchDetailModal` shows size selector and blocks Add to Cart until size chosen.

## Requested Changes (Diff)

### Add
- `colorStock` per merch item: array of `{ name: string; hex: string; stock: number }` stored as JSON in a new setting key `colorStock_{id}`
- Admin form: color management section — add/remove colors with name input, hex color picker, and per-color stock count
- Store MerchDetailModal: color swatch selector (circular swatches showing hex color) below size selector
- `CartItem` gets optional `selectedColor?: string` field to track chosen color
- Cart page and checkout display selected color alongside size

### Modify
- `AdminStoreMerch.tsx`: add color stock section in form (Clothing category only, same as size stock section); load/save `colorStock_{id}` from settings; delete it on item delete
- `Store.tsx MerchDetailModal`: add color selector section; `canAdd` also requires color selection if colors exist; `onAddToCart` passes selected color; button label shows size + color
- `Store.tsx handleAddToCart`: pass `selectedColor` into cart item name e.g. `${item.name} (${size} / ${color})`
- `utils/cart.ts CartItem` interface: add `selectedColor?: string`
- Admin table: show color count badge alongside size badge

### Remove
- Nothing removed

## Implementation Plan
1. Update `CartItem` in `utils/cart.ts` to add `selectedColor?: string`
2. Update `AdminStoreMerch.tsx`:
   - Add `ColorEntry` type `{ name: string; hex: string; stock: string }`
   - Add `colorStock: ColorEntry[]` to `FormState`
   - Load `colorStock_{id}` from settings in `load()`
   - Save/delete `colorStock_{id}` on save/delete
   - Add color stock UI section in form (below size stock, Clothing only): add color button, name input, hex picker, stock input, remove button
   - Show color count in table row
3. Update `Store.tsx`:
   - Load `colorStock_{id}` from settings in load()
   - Pass `colorStock` to `MerchDetailModal`
   - In `MerchDetailModal`: add color swatches; require color selection if colors exist; pass color to `onAddToCart`
   - In `handleAddToCart`: append color to cart item name
