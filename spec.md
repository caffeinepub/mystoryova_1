# Mystoryova — Blob Storage Image Uploads

## Current State

All product images (book covers, audiobook covers, merchandise photos) are:
1. Compressed client-side to 300–600px wide at 40–75% quality (base64)
2. Stored in the backend `settings` map with keys like `bookImg_{id}`, `audioImg_{id}`, `colorImg_{id}_{colorIdx}`, `productImages_{id}`
3. Embedded as giant base64 data: URIs in the page HTML

This causes:
- Images are blurry due to aggressive compression
- Zoom lens lags because base64 data URIs are not efficiently cached
- Uploads still occasionally fail when payload approaches 2MB ICP limit

The `blob-storage` Caffeine component is already integrated into the Motoko backend (`MixinStorage` mixin imported). The `StorageClient` class is already present in `src/frontend/src/utils/StorageClient.ts`. The `config.ts` already creates a StorageClient instance with proper configuration.

## Requested Changes (Diff)

### Add
- `src/frontend/src/utils/useStorageClient.ts` — a React hook that lazily initializes a `StorageClient` from the app config. Returns the client plus an `uploadImage(file: File)` helper that uploads raw bytes and returns a direct HTTP URL (no compression at all).
- Upload progress indicator on image inputs in all admin forms.

### Modify
- `AdminBooks.tsx` — replace `compressImage()` with blob upload. Store the resulting URL directly in `coverImageUrl`. Remove canvas-based compression entirely.
- `AdminStoreAudiobooks.tsx` — replace `compressImage()` with blob upload for the audiobook cover image. Store URL in the settings key `audioImg_{id}`.
- `AdminStoreMerch.tsx` — replace `compressImage()` with blob upload for:
  - Clothing per-color images (front/back/lifestyle): stored in `colorImg_{id}_{colorIdx}` as JSON with blob URLs instead of base64
  - Non-clothing product images (primary/alternate/lifestyle): stored in `productImages_{id}` as JSON with blob URLs
  - Standalone cover emoji/image field: blob URL if a file is selected
- `Store.tsx` — no logic changes needed; images are already read from settings as URLs and rendered via `<img src={...}>`. Blob HTTP URLs work the same way.
- `ZoomImage.tsx` — ensure zoom uses native `<img>` src without any base64 workarounds (it already does, no change needed if URLs are proper HTTP).

### Remove
- `compressImage()` function from AdminBooks.tsx and AdminStoreMerch.tsx
- All `new Image()` / `canvas.toDataURL()` base64 compression code

## Implementation Plan

1. Create `useStorageClient.ts` hook that:
   - Calls `loadConfig()` once
   - Creates an `HttpAgent` and `StorageClient`
   - Exposes `uploadImage(file: File, onProgress?: (pct: number) => void): Promise<string>` which calls `storageClient.putFile(bytes)` then `storageClient.getDirectURL(hash)`
2. Update `AdminBooks.tsx`:
   - Import and use `useStorageClient`
   - Replace the `<input type=file>` + canvas compress flow with: read file bytes → `uploadImage()` → set `form.coverImageUrl` to returned URL
   - Show upload progress
3. Update `AdminStoreAudiobooks.tsx`:
   - Same pattern for the cover image field
4. Update `AdminStoreMerch.tsx`:
   - Replace `compressImage` usage in `ImageUploadField` component with blob upload
   - Uploaded URLs are stored in the same settings keys (JSON strings), just now containing HTTP URLs instead of base64
5. Validate and build
