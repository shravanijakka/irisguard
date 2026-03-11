# IrisGuard

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- User registration with username, password, and iris image upload
- Login flow: username + password + iris image upload
- Simulated iris feature extraction and matching (cosine similarity on image metadata/hash, since real CNN is not available in-browser)
- Cloud dashboard page shown after successful authentication
- User data storage in backend (username, hashed password, stored iris template hash)
- Authentication session/token management

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: store users with username, password hash, and iris template. Expose register, login (password check + iris match), and getProfile endpoints.
2. Frontend: two main pages -- Auth page (register/login tabs) with iris image upload, and Dashboard page shown after successful auth.
3. Iris matching: simulate by comparing uploaded image name/size hash as a fingerprint (demo-level, not real CNN).
4. Show authentication steps visually: Step 1 credentials, Step 2 iris scan, Step 3 access granted.
