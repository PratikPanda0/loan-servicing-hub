
# Plan: Create Cenlar API Proxy Edge Function

## Problem Summary
The loan table is empty because the browser cannot directly call `https://cenlar-backend.onrender.com/loans` due to CORS restrictions. The Cenlar backend doesn't include headers allowing requests from the Lovable preview domain.

## Solution
Create a Supabase Edge Function that acts as a proxy between your frontend and the Cenlar backend.

```text
+------------------+       +------------------+       +------------------+
|   Your Browser   | ----> |   Edge Function  | ----> |  Cenlar Backend  |
|   (Lovable App)  |       |   (cenlar-proxy) |       |   (Render.com)   |
+------------------+       +------------------+       +------------------+
        |                          |                          |
        |  Same-origin request     |  Server-to-server call   |
        |  (No CORS issue)         |  (No CORS restrictions)  |
```

## Implementation Steps

### Step 1: Create the Edge Function
Create a new edge function `supabase/functions/cenlar-proxy/index.ts` that:
- Handles GET requests to `/loans` (list all loans)
- Handles GET requests to `/loans/{borrower}` (get single loan)
- Handles PATCH requests to `/loans/{borrower}` (update loan)
- Includes proper CORS headers for browser requests
- Forwards all requests to `https://cenlar-backend.onrender.com`

### Step 2: Update the Configuration
Add the new function to `supabase/config.toml` with JWT verification disabled (public access).

### Step 3: Update the Frontend API Service
Modify `src/services/loanApi.ts` to:
- Call the edge function instead of the Cenlar backend directly
- Use the Supabase functions invoke method for cleaner integration
- Handle the proxy responses correctly

### Step 4: Update Dashboard (if needed)
Ensure the loan API changes work with the existing `useQuery` hook in `LoanDashboard.tsx`.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/cenlar-proxy/index.ts` | Create | New edge function to proxy Cenlar API requests |
| `supabase/config.toml` | Modify | Add cenlar-proxy function configuration |
| `src/services/loanApi.ts` | Modify | Update to call edge function instead of direct backend |

## Technical Details

The edge function will:
- Accept a `path` query parameter (e.g., `/loans` or `/loans/John%20Doe`)
- Accept a `method` query parameter for PATCH requests
- Forward the request body for PATCH operations
- Return the Cenlar response with proper CORS headers

No secrets are required since the Cenlar backend is public.

## Expected Outcome
After implementation:
- The loan table will display all loans from the Cenlar backend
- The loan detail pages will load correctly
- Loan updates via PATCH will work
- The OCR flow will be able to match borrowers and update records
