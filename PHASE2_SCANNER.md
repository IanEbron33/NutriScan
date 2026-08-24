# Phase 2: Expo Camera & Scan UI Specification (`PHASE2_SCANNER.md`)

## 1. Purpose
Build the camera viewfinder, photo gallery picker, custom bottom navigation bar, and **Automated 1080p Image Compression Layer**.

*For complete color tokens, visual styles, and UI layout specs, see [DESIGN.md Section 3 (Screen A)](file:///c:/Users/ADMIN/Desktop/Folder1/NutriScan/DESIGN.md).*

---

## 2. Technical Component Architecture
* **`ScanScreen.tsx`**: Renders `expo-camera` with live aspect ratio, target scan area frame, and "Scan Food" pill overlay.
* **Bottom Control Bar**: Photo gallery trigger (`expo-image-picker`), shutter action button, and quick code toggle.
* **App Navigation**: 5-Tab bar (`Home`, `Diary`, `Scan`, `Insights`, `Profile`).

---

## 3. Image Compression & Resizing Layer (`utils/imageCompressor.ts`)
Scales down camera/gallery photo captures to max **1080p** (`width: 1080`, preserving aspect ratio) at quality `0.8` using `expo-image-manipulator`.

```typescript
import * as ImageManipulator from 'expo-image-manipulator';

export const compressAndResizeTo1080p = async (imageUri: string) => {
  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1080 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return result;
};
```

---

## 4. Verification Steps
1. Test camera permission prompt handling.
2. Select a 4K photo from gallery and verify `compressAndResizeTo1080p` reduces file payload size to ~400KB–600KB.
3. Pass compressed base64 payload to HTTP API handler.
