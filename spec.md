# Mystoryova — Qikink Integration Phase 2

## Current State

- Backend has `updateOrderFulfillment(id, qikinkOrderId, fulfillmentStatus)` to record Qikink details on an order.
- Backend has `syncQikinkCatalog()` and `getQikinkCatalog()` (Phase 1 complete).
- `Order` type has `qikinkOrderId` and `fulfillmentStatus` fields.
- `AdminOrders.tsx` shows Fulfillment and Qikink ID columns in the orders table but has NO button to trigger fulfillment.
- No backend function exists to send an order to Qikink's API.
- Admin settings has the Qikink toggle and API key saved as `qikink_enabled` and `qikink_api_key`.

## Requested Changes (Diff)

### Add
- **Backend:** `fulfillOrderViaQikink(orderId: Text)` — reads Qikink API key and enabled toggle from settings, looks up the order and its items (using `qikinkProductId` from merch items), constructs the Qikink fulfillment order payload, and sends it via HTTP outcall to `https://api.qikink.com/api/orders`. Returns a result text (Qikink order ID or error message). Updates the order's `qikinkOrderId` and `fulfillmentStatus` on success.
- **Frontend (AdminOrders.tsx):** "Mark as Paid & Fulfill" button per order row (only visible when `fulfillmentStatus` is empty or "Pending" and `qikinkEnabled` is true). Clicking it calls `fulfillOrderViaQikink`, then refreshes the order. Also updates order status to "Processing" automatically.
- **Frontend (AdminOrders.tsx):** Loading/spinner state per row during fulfillment call.
- **Frontend (AdminOrders.tsx):** Fulfillment status badge improved — shows color-coded states: Pending (grey), Sent to Qikink (blue), Failed (red).

### Modify
- **Backend:** `fulfillOrderViaQikink` also calls `updateOrderFulfillment` internally to persist the Qikink order ID and new fulfillment status on success.
- **AdminOrders.tsx:** Order detail modal shows Qikink order ID and fulfillment status.
- **backend.d.ts:** Add `fulfillOrderViaQikink(orderId: string): Promise<string>` to interface.

### Remove
- Nothing removed.

## Implementation Plan

1. Add `fulfillOrderViaQikink` to `src/backend/main.mo` — HTTP outcall to Qikink orders API, reads API key from settings, builds payload from order data and merch `qikinkProductId`, updates order on success.
2. Update `src/frontend/src/backend.d.ts` to add `fulfillOrderViaQikink` signature.
3. Update `src/frontend/src/admin/AdminOrders.tsx`:
   - Add `fulfillOrder(orderId)` handler that calls `fulfillOrderViaQikink`, shows toast, refreshes
   - Add "Mark as Paid & Fulfill" button in the actions column (hidden if already fulfilled or Qikink disabled)
   - Load `qikink_enabled` setting from backend on mount
   - Improve fulfillment status badge colors
   - Show Qikink order ID and fulfillment status in order detail modal
