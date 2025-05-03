Below is a comprehensive migration guide for integrating the **latest version of TanStack Query** (v5 as of May 2025) into a **Next.js App Router** project without TypeScript, focusing on best practices and addressing changes from older versions (e.g., v3 or v4). This guide assumes you have prior experience with an older version of TanStack Query (React Query) and are familiar with Next.js. It covers setup, migration steps, key changes, and best practices tailored for a modern Next.js App Router setup using JavaScript.

---

## Migration Guide: Integrating TanStack Query v5 with Next.js App Router (No TypeScript)

### 1. Overview of TanStack Query v5

TanStack Query v5 is a major version with significant improvements over v3 and v4, including better support for React Server Components, suspense, and streamlined APIs. It’s designed to work seamlessly with Next.js App Router, leveraging Server Components for data fetching while maintaining client-side caching and state management. Key changes include:

- **Single signature for hooks**: `useQuery` and related hooks now use a single object-based signature.
- **Suspense stability**: New hooks like `useSuspenseQuery` for stable suspense support.
- **React 18+ requirement**: Uses `useSyncExternalStore` for better state synchronization.
- **Improved Server Component integration**: Optimized for Next.js App Router with streaming and hydration.

This guide will help you migrate from an older version (v3/v4) to v5, set up TanStack Query in your Next.js project, and follow best practices.

---

### 2. Prerequisites

Before starting, ensure your project meets these requirements:

- **Next.js**: Latest version (Next.js 15 as of May 2025) with App Router enabled.
- **React**: Version 18 or later (Next.js 15 supports React 19, but React 18 is sufficient).
- **Node.js**: Latest LTS version.
- **No TypeScript**: This guide uses JavaScript (`.js` files).

---

### 3. Setup TanStack Query v5 in Next.js App Router

#### Step 1: Install Dependencies

1. Install the latest version of TanStack Query and related packages:

   ```bash
   npm install @tanstack/react-query
   ```

   Optionally, install the devtools for debugging:

   ```bash
   npm install @tanstack/react-query-devtools
   ```

2. Verify the installed version:
   ```bash
   npm list @tanstack/react-query
   ```
   As of May 2025, you should see `@tanstack/react-query@5.x.x`.

#### Step 2: Set Up QueryClientProvider

TanStack Query requires a `QueryClientProvider` to manage the query client. Since Next.js App Router uses Server Components by default, you’ll need to create a client component for the provider.

1. Create a `providers.js` file in your `app` directory:

   ```javascript
   // app/providers.js
   "use client";

   import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
   import { useState } from "react";

   export default function Providers({ children }) {
     const [queryClient] = useState(() => new QueryClient());

     return (
       <QueryClientProvider client={queryClient}>
         {children}
       </QueryClientProvider>
     );
   }
   ```

   - `"use client"` ensures this is a Client Component, as `QueryClientProvider` uses React hooks.
   - `useState` ensures the `QueryClient` persists across renders.

2. Wrap your app with the `Providers` component in the root layout:

   ```javascript
   // app/layout.js
   import Providers from "./providers";

   export default function RootLayout({ children }) {
     return (
       <html lang="en">
         <body>
           <Providers>{children}</Providers>
         </body>
       </html>
     );
   }
   ```

#### Step 3: (Optional) Add DevTools

For debugging, integrate the Query DevTools:

```javascript
// app/providers.js
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

- The devtools will appear in development mode and help you inspect queries and mutations.

---

### 4. Migrating from Older Versions (v3/v4) to v5

#### Breaking Changes and Migration Steps

TanStack Query v5 introduces several breaking changes compared to v3 and v4. Below are the key changes and how to address them in your JavaScript project.

1. **Package Name Change (v3 to v4+)**

   - **Old (v3)**: `react-query`
   - **New (v4+)**: `@tanstack/react-query`
   - **Action**:
     Update your imports:

     ```javascript
     // Old (v3)
     import { useQuery, QueryClient } from "react-query";

     // New (v5)
     import { useQuery, QueryClient } from "@tanstack/react-query";
     ```

     Uninstall the old package and install the new one:

     ```bash
     npm uninstall react-query
     npm install @tanstack/react-query
     ```

2. **Single Signature for Hooks (v5)**

   - **Old (v3/v4)**: `useQuery` supported multiple signatures (e.g., `useQuery(queryKey, queryFn, options)`).
   - **New (v5)**: Only one object-based signature: `useQuery({ queryKey, queryFn, ...options })`.
   - **Action**:
     Update all `useQuery` calls:

     ```javascript
     // Old (v3/v4)
     const { data } = useQuery("todos", () => fetch("/api/todos"));

     // New (v5)
     const { data } = useQuery({
       queryKey: ["todos"],
       queryFn: () => fetch("/api/todos").then((res) => res.json()),
     });
     ```

     Similarly, update `useMutation` and other hooks:

     ```javascript
     // Old (v3/v4)
     const mutation = useMutation((newTodo) => post("/api/todos", newTodo));

     // New (v5)
     const mutation = useMutation({
       mutationFn: (newTodo) => post("/api/todos", newTodo),
     });
     ```

3. **Query Keys as Arrays (v4+)**

   - **Old (v3)**: Query keys could be strings or arrays.
   - **New (v4+)**: Query keys must be arrays for consistency.
   - **Action**:
     Convert string-based query keys to arrays:

     ```javascript
     // Old (v3)
     useQuery("todos", queryFn);

     // New (v5)
     useQuery({ queryKey: ["todos"], queryFn });
     ```

4. **isLoading and isInitialLoading (v5)**

   - **Old (v4)**: `isLoading` indicated the initial loading state.
   - **New (v5)**: `isLoading` is now `isPending && isFetching`. `isInitialLoading` is deprecated and will be removed in v6.
   - **Action**:
     Use `isPending` for checking if a query is in its initial loading state:

     ```javascript
     // Old (v4)
     if (isLoading) return "Loading...";

     // New (v5)
     if (isPending) return "Loading...";
     ```

5. **Suspense Support (v5)**

   - **Old (v4)**: Suspense was experimental with a `suspense: true` option.
   - **New (v5)**: Dedicated hooks (`useSuspenseQuery`, `useSuspenseInfiniteQuery`) for suspense. The `suspense` option is removed.
   - **Action**:
     Replace `suspense: true` with `useSuspenseQuery`:

     ```javascript
     // Old (v4)
     const { data } = useQuery({
       queryKey: ["todos"],
       queryFn,
       suspense: true,
     });

     // New (v5)
     const { data } = useSuspenseQuery({
       queryKey: ["todos"],
       queryFn,
     });
     ```

     Ensure your component is wrapped in a `<Suspense>` boundary:

     ```javascript
     import { Suspense } from "react";

     function Todos() {
       const { data } = useSuspenseQuery({
         queryKey: ["todos"],
         queryFn: () => fetch("/api/todos").then((res) => res.json()),
       });

       return (
         <div>
           {data.map((todo) => (
             <p>{todo.title}</p>
           ))}
         </div>
       );
     }

     export default function Page() {
       return (
         <Suspense fallback={<div>Loading...</div>}>
           <Todos />
         </Suspense>
       );
     }
     ```

6. **Query Removal (v5)**

   - **Old (v4)**: `query.remove()` was used to remove a query.
   - **New (v5)**: Use `queryClient.removeQueries({ queryKey })`.
   - **Action**:
     Update query removal logic:

     ```javascript
     // Old (v4)
     query.remove();

     // New (v5)
     queryClient.removeQueries({ queryKey: ["todos"] });
     ```

7. **Undefined Cache Values (v4+)**

   - **Old (v3)**: Returning `undefined` from `queryFn` was allowed.
   - **New (v4+)**: `undefined` is invalid and will throw an error.
   - **Action**:
     Ensure `queryFn` returns a valid value or handles errors:

     ```javascript
     // Old (v3)
     const { data } = useQuery({
       queryKey: ["todos"],
       queryFn: () => {
         // Could return undefined
       },
     });

     // New (v5)
     const { data } = useQuery({
       queryKey: ["todos"],
       queryFn: async () => {
         const res = await fetch("/api/todos");
         if (!res.ok) throw new Error("Failed to fetch");
         return res.json();
       },
     });
     ```

8. **React 18+ Requirement (v5)**
   - **Old (v4)**: Worked with React 17 using a shim for `useSyncExternalStore`.
   - **New (v5)**: Requires React 18+ for `useSyncExternalStore`.
   - **Action**:
     Ensure your Next.js project uses React 18 or later. Next.js 15 supports React 18 and 19, so you’re likely compliant. Verify in `package.json`:
     ```json
     "dependencies": {
       "react": "^18.2.0",
       "next": "^15.0.0"
     }
     ```

#### Running Codemods for Automated Migration

TanStack Query provides codemods to automate some migration tasks (e.g., updating imports and hook signatures). Since you’re using JavaScript, run the v5 codemod:

```bash
npx jscodeshift ./app \
  --extensions=js,jsx \
  --transform=./node_modules/@tanstack/react-query/build/codemods/src/v5/remove-overloads/remove-overloads.cjs
```

- Review the changes carefully, as codemods may not catch all edge cases.
- Run `prettier` or `eslint` afterward to fix formatting:
  ```bash
  npx prettier --write ./app
  ```

---

### 5. Best Practices for TanStack Query v5 with Next.js App Router

#### 1. Leverage Server Components for Initial Data Fetching

Next.js App Router’s Server Components are ideal for prefetching data on the server, reducing client-side JavaScript. Use TanStack Query to hydrate this data on the client.

Example:

```javascript
// app/page.js
import { dehydrate, Hydrate } from "@tanstack/react-query";
import { getQueryClient } from "./getQueryClient";
import Todos from "./todos";

async function getTodos() {
  const res = await fetch("https://api.example.com/todos");
  return res.json();
}

export default async function Page() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["todos"],
    queryFn: getTodos,
  });
  const dehydratedState = dehydrate(queryClient);

  return (
    <Hydrate state={dehydratedState}>
      <Todos />
    </Hydrate>
  );
}

// app/getQueryClient.js
import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

export const getQueryClient = cache(() => new QueryClient());
```

```javascript
// app/todos.js
"use client";

import { useQuery } from "@tanstack/react-query";

export default function Todos() {
  const { data, isPending, error } = useQuery({
    queryKey: ["todos"],
    queryFn: () =>
      fetch("https://api.example.com/todos").then((res) => res.json()),
  });

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((todo) => (
        <p key={todo.id}>{todo.title}</p>
      ))}
    </div>
  );
}
```

- **Why?** Prefetching in Server Components minimizes client-side fetching, and `Hydrate` ensures the client uses the prefetched data.

#### 2. Use Suspense for Streaming

TanStack Query v5’s `useSuspenseQuery` pairs well with Next.js’s streaming and `<Suspense>` boundaries. Place suspense boundaries in your Server Components to stream content as it becomes ready.

Example:

```javascript
// app/page.js
import { Suspense } from "react";
import Todos from "./todos";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading todos...</div>}>
      <Todos />
    </Suspense>
  );
}

// app/todos.js
"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

export default function Todos() {
  const { data } = useSuspenseQuery({
    queryKey: ["todos"],
    queryFn: () => fetch("https://api.example.com/todos").then((res) => res.json()),
  });

  return (
    <div>
      {data.map((todo) => (
        <p key={todo.id}>{todo.title}</p>
      ))}
    </div>
  );
}
```

- **Why?** Suspense enables progressive rendering, improving perceived performance.

#### 3. Avoid Overusing TanStack Query

If your data fetching needs are simple (e.g., static or server-only data), use Next.js’s built-in `fetch` with `cache: "force-cache"`. Reserve TanStack Query for:

- Client-side caching and background updates.
- Complex state management (e.g., pagination, infinite queries).
- Mutations (e.g., POST requests).

Example of when to use TanStack Query:

```javascript
// app/add-todo.js
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function AddTodo() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newTodo) =>
      fetch("/api/todos", {
        method: "POST",
        body: JSON.stringify(newTodo),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const title = e.target.title.value;
    mutation.mutate({ title });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" type="text" />
      <button type="submit" disabled={mutation.isPending}>
        Add Todo
      </button>
    </form>
  );
}
```

- **Why?** TanStack Query excels at handling mutations and cache invalidation.

#### 4. Optimize Query Keys

Use hierarchical query keys to manage related data:

```javascript
const { data } = useQuery({
  queryKey: ["todos", userId, { status: "active" }],
  queryFn: () =>
    fetch(`/api/todos?userId=${userId}&status=active`).then((res) =>
      res.json()
    ),
});
```

- **Why?** Array-based keys allow partial matching for invalidation (e.g., `queryClient.invalidateQueries(["todos"])` invalidates all todo-related queries).

#### 5. Handle Errors Gracefully

Always handle errors in your queries and mutations:

```javascript
const { data, error, isPending } = useQuery({
  queryKey: ["todos"],
  queryFn: () =>
    fetch("/api/todos").then((res) => {
      if (!res.ok) throw new Error("Failed to fetch todos");
      return res.json();
    }),
});

if (isPending) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
```

#### 6. Configure QueryClient Defaults

Set global defaults for queries to reduce boilerplate:

```javascript
// app/providers.js
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

- **Why?** Defaults ensure consistent behavior across queries.

---

### 6. Common Pitfalls and Solutions

1. **Hydration Errors**:

   - Ensure `dehydratedState` matches the client-side query keys and data structure.
   - Use `Hydrate` and `dehydrate` correctly, as shown in the Server Component example.

2. **Server Component Limitations**:

   - Avoid using TanStack Query hooks in Server Components. Use `prefetchQuery` in Server Components and hooks in Client Components.

3. **Suspense Boundary Placement**:

   - Place `<Suspense>` boundaries strategically to avoid waterfalls. For example, wrap individual components rather than the entire page if only parts need suspense.

4. **Performance**:
   - Avoid `queryClient.fetchQuery` in Server Components unless error handling is needed. Use `prefetchQuery` instead.
   - Set appropriate `staleTime` and `cacheTime` to balance freshness and performance.

---

### 7. Testing Your Migration

1. **Verify Imports**:
   Ensure all imports use `@tanstack/react-query`.

2. **Test Queries**:
   Check that all `useQuery` calls use the object-based signature and array-based query keys.

3. **Test Suspense**:
   If using suspense, verify that `useSuspenseQuery` works with `<Suspense>` boundaries.

4. **Check DevTools**:
   Use the React Query DevTools to inspect queries and ensure they’re firing correctly.

5. **Run Your App**:
   Test server-side rendering, client-side hydration, and mutations to ensure no runtime errors.

---

### 8. Additional Resources

- **Official TanStack Query v5 Migration Guide**: https://tanstack.com/query/v5/docs/react/guides/migrating-to-v5[](https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5)
- **Next.js App Router Documentation**: https://nextjs.org/docs/app[](https://nextjs.org/docs/app/guides/migrating/app-router-migration)
- **TanStack Query with Next.js Example**: https://tanstack.com/query/v5/docs/react/examples/react/nextjs[](https://tanstack.com/query/latest/docs/framework/react/examples/nextjs)
- **TkDodo’s Blog on React Query and Server Components**: https://tkdodo.eu/blog/you-might-not-need-react-query[](https://tkdodo.eu/blog/you-might-not-need-react-query)

---

### 9. Conclusion

Migrating to TanStack Query v5 in a Next.js App Router project involves updating dependencies, adapting to new hook signatures, and leveraging Server Components for optimal data fetching. By following this guide, you can integrate TanStack Query seamlessly, adhere to best practices, and avoid common pitfalls. Focus on using Server Components for prefetching, Client Components for interactivity, and suspense for streaming to create a performant and modern application.

If you encounter specific issues during migration, feel free to share details, and I can provide targeted assistance!
