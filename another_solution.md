This is a common issue with the Neon serverless driver on Vercel. The problem is likely one of these:

## Most Likely Cause: WebSocket Support

The `@neondatabase/serverless` driver uses WebSockets by default, but Vercel's serverless functions don't support WebSockets. You need to enable HTTP fetch mode.

**Solution: Update your database connection**

```typescript
// api/db.ts or wherever you initialize your connection
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Enable HTTP fetch for Vercel
neonConfig.fetchConnectionCache = true;

// Use WebSocket polyfill for local dev, disable for Vercel
if (process.env.NODE_ENV !== 'production') {
  neonConfig.webSocketConstructor = ws;
} else {
  // Force HTTP mode for Vercel
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineConnect = false;
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

Or even simpler - just force HTTP mode:

```typescript
import { neonConfig } from '@neondatabase/serverless';

// Force HTTP fetch mode (works everywhere including Vercel)
neonConfig.fetchConnectionCache = true;
neonConfig.webSocketConstructor = undefined;
```


