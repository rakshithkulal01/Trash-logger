# Troubleshooting: App Unable to Load Data

## Current Status ✅
- **Backend**: Running successfully on port 3000
- **Frontend**: Running successfully on port 5174
- **Database**: Initialized and contains data
- **API Health**: `/health` endpoint responding correctly
- **API Data**: `/api/trash` endpoint returning data
- **Build**: Frontend builds without errors

## Quick Diagnosis Steps

### 1. Check Browser Console
Open your browser and go to http://localhost:5174

**Press F12 to open Developer Tools, then:**
1. Go to **Console** tab
2. Look for any red error messages
3. Check if there are any JavaScript errors

### 2. Check Network Tab
In Developer Tools:
1. Go to **Network** tab
2. Refresh the page
3. Look for failed API calls (red entries)
4. Check if calls to `localhost:3000/api/*` are being made

### 3. Test API Directly
Open these URLs in your browser:
- http://localhost:3000/health (should show server status)
- http://localhost:3000/api/trash (should show JSON data)
- http://localhost:3000/api/stats (should show statistics)

## Common Issues & Solutions

### Issue 1: CORS Error
**Symptoms**: Console shows CORS policy errors
**Solution**: Backend CORS is configured, but check if frontend is calling correct URL

### Issue 2: Wrong API URL
**Symptoms**: Network calls to wrong port or URL
**Solution**: Check if frontend is calling `localhost:3000` not `localhost:5174`

### Issue 3: JavaScript Runtime Error
**Symptoms**: White screen or components not rendering
**Solution**: Check console for JavaScript errors

### Issue 4: Excel Library Import Error
**Symptoms**: Error related to XLSX or file-saver
**Solution**: The new Excel export might have import issues

## Immediate Fixes to Try

### Fix 1: Clear Browser Cache
1. Press Ctrl+Shift+R to hard refresh
2. Or clear browser cache completely

### Fix 2: Restart Development Server
```bash
# Stop current process
Ctrl+C in terminal

# Restart
npm run dev
```

### Fix 3: Check Port Conflict
The frontend is running on port 5174 instead of 5173. This is normal but make sure you're accessing the correct URL:
- ✅ http://localhost:5174 (correct)
- ❌ http://localhost:5173 (wrong)

### Fix 4: Temporary Excel Library Fix
If the issue is with the new Excel export, we can temporarily disable it:

1. Comment out Excel imports in `ReportView.tsx`
2. Hide Excel export buttons
3. Test if data loads without Excel functionality

## Detailed Debugging

### Check API Configuration
File: `frontend/src/services/api.ts`
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```
Should point to port 3000 (backend)

### Check Component Loading
1. Go to Map view - does it show the map?
2. Go to Log Trash - does the form appear?
3. Go to Report - does it show loading spinner?

### Check Data Flow
1. **MapView**: Should call `getTrashEntries()` on load
2. **ReportView**: Should call `getStatistics()` and `getTrashEntries()`
3. **LogView**: Should work without API calls initially

## Error Patterns to Look For

### Console Errors
```
❌ Failed to fetch
❌ CORS policy error
❌ Cannot resolve module 'xlsx'
❌ Unexpected token in JSON
❌ Network request failed
```

### Network Tab Issues
```
❌ 404 errors on API calls
❌ 500 server errors
❌ Pending requests that never complete
❌ No API calls being made at all
```

## Quick Test Commands

### Test Backend API
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/trash
curl http://localhost:3000/api/stats
```

### Test Frontend Access
```bash
curl http://localhost:5174
```

## Recovery Steps

### Step 1: Identify the Issue
1. Open browser console
2. Note any error messages
3. Check network tab for failed requests

### Step 2: Apply Appropriate Fix
- **JavaScript Error**: Fix the code issue
- **Network Error**: Check API URL configuration
- **Import Error**: Fix library imports
- **CORS Error**: Check backend CORS settings

### Step 3: Verify Fix
1. Refresh browser
2. Check console is clear
3. Verify data loads in all views

## Contact Information
If you're still having issues, please share:
1. **Browser console errors** (screenshot or text)
2. **Network tab** showing failed requests
3. **Which specific page** is not loading data
4. **What you see** instead of data (loading spinner, error message, blank page)

## Temporary Workaround
If Excel export is causing issues, we can:
1. Disable Excel functionality temporarily
2. Keep PDF export working
3. Fix Excel issues separately

This will get the core app working while we debug the Excel feature.