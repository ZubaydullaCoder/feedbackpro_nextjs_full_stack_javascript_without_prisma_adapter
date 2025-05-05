# TanStack Query (v5) Migration Guide for Next.js App Router (JavaScript)

**Current Date:** Sunday, May 4, 2025

---

### 1. Introduction

TanStack Query (formerly React Query) is a powerful library for fetching, caching, synchronizing, and updating server state in your React applications. It significantly simplifies data fetching logic, eliminates boilerplate code, and provides features like caching, automatic refetching, stale-while-revalidate, and more, out-of-the-box. Version 5 brings refinements and works effectively with the Next.js App Router architecture.

### 2. Prerequisites

- A Next.js project (version 13.4 or later) using the App Router.
- Node.js installed.
- You are using JavaScript (`.js` or `.jsx` files).

### 3. Installation

Install TanStack Query and its dedicated DevTools:

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
# or
yarn add @tanstack/react-query @tanstack/react-query-devtools
# or
pnpm add @tanstack/react-query @tanstack/react-query-devtools
# or
bun add @tanstack/react-query @tanstack/react-query-devtools
```

### 4. Core Setup: QueryClient and Provider

You need to create a `QueryClient` instance and provide it to your application using `QueryClientProvider`. Since the provider uses React Context, it must be within a Client Component.

**a) Create the Provider Wrapper (Client Component)**

Create a new file, for example `components/ReactQueryProvider.js`:

```javascript
// components/ReactQueryProvider.js
"use client"; // This directive is essential

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000, // 1 minute
        // gcTime: 1000 * 60 * 60 * 24, // 24 hours (Example: longer garbage collection time)
      },
    },
  });
}

// Store the client so we don't recreate it on every render
let browserQueryClient = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

// Component using useState to ensure client is only created once
export default function ReactQueryProvider({ children }) {
  // NOTE: Avoid useState when using SSR and hydration, it may mess up hydration
  // const [queryClient] = React.useState(() => new QueryClient({ ... default options ... }));

  // Instead, use the singleton pattern documented by TanStack Query
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools are placed inside the provider */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

- **`staleTime`**: Setting a default `staleTime > 0` is crucial when prefetching data on the server. It tells React Query how long the fetched data is considered "fresh", preventing an automatic refetch immediately after the component hydrates on the client.
- **`gcTime`**: (Garbage Collection Time, formerly `cacheTime`) How long inactive query data stays in memory. Defaults to 5 minutes.
- **Singleton `QueryClient`**: The `getQueryClient` function ensures that on the server, a new client is created for each request, while in the browser, a single client instance is reused across renders to maintain the cache.

**b) Integrate Provider in Root Layout**

Import and use the `ReactQueryProvider` in your root `app/layout.js`:

```javascript
// app/layout.js
import ReactQueryProvider from "@/components/ReactQueryProvider";
// Import global styles, fonts etc.
import "./globals.css";

export const metadata = {
  title: "My TanStack Query App",
  description: "Data fetching example",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          {" "}
          {/* Wrap your app */}
          {/* Other layout elements like Header, Footer */}
          <main>{children}</main>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
```

### 5. Basic Usage (Client Components)

Use hooks like `useQuery` and `useMutation` within Client Components (`'use client'`).

**a) `useQuery` for Fetching Data**

```javascript
// components/PostList.js
"use client";

import { useQuery } from "@tanstack/react-query";

// Define your data fetching function
async function fetchPosts() {
  const res = await fetch(
    "https://jsonplaceholder.typicode.com/posts?_limit=10"
  );
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
}

export default function PostList() {
  const {
    data: posts,
    error,
    isPending,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["posts"], // Unique key for this query
    queryFn: fetchPosts, // The function to fetch data
    // Options:
    // staleTime: 5 * 60 * 1000, // Override default staleTime (5 minutes)
    // refetchOnWindowFocus: false, // Disable refetch on window focus
  });

  // isPending: Query has no data yet, fetch is in progress (initial load or hard refresh)
  // isLoading: Alias for isPending, kept for backward compatibility (true only on initial load without data)
  if (isPending) {
    return <span>Loading posts...</span>;
  }

  if (isError) {
    return <span>Error fetching posts: {error.message}</span>;
  }

  // Render data
  return (
    <div>
      <h2>Posts</h2>
      <ul>
        {posts?.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

- **`queryKey`**: An array used to identify and cache the query. It should be serializable and unique to the query + its parameters. A common pattern is `['entityName', { parameters }]`.
- **`queryFn`**: An async function that fetches and returns (or throws an error) your data.
- **States**: `isPending`, `isLoading`, `isError`, `error`, `data` provide the status and result of the query.

**b) `useMutation` for Modifying Data**

Mutations are used for creating, updating, or deleting data.

```javascript
// components/AddPostForm.js
"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Define the mutation function
async function addPost(newPostData) {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newPostData),
  });
  if (!res.ok) {
    throw new Error("Failed to add post");
  }
  return res.json();
}

export default function AddPostForm() {
  const queryClient = useQueryClient(); // Get QueryClient instance
  const [title, setTitle] = React.useState("");

  const mutation = useMutation({
    mutationFn: addPost, // The function performing the mutation
    onSuccess: (data) => {
      // This runs after the mutation is successful
      console.log("Post added:", data);

      // Option 1: Invalidate the 'posts' query to trigger a refetch
      // Good if you want the freshest data from the server
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      // Option 2: Manually update the cache (Optimistic Update lite)
      // Good if the mutation returns the created item and you want faster UI updates
      // queryClient.setQueryData(['posts'], (oldData) => oldData ? [...oldData, data] : [data]);

      setTitle(""); // Clear form
    },
    onError: (error) => {
      // This runs if the mutation fails
      console.error("Error adding post:", error);
      // Maybe show an error message to the user
    },
    // onSettled: () => {
    //   // This runs after success or error
    //   console.log('Mutation finished.');
    // },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    mutation.mutate({ title, body: "Example body", userId: 1 }); // Call mutate with variables
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add New Post</h3>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
        disabled={mutation.isPending} // Disable form while mutating
      />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Adding..." : "Add Post"}
      </button>
      {mutation.isError && (
        <p style={{ color: "red" }}>Error: {mutation.error.message}</p>
      )}
    </form>
  );
}
```

- **`mutationFn`**: An async function performing the side effect (POST, PUT, DELETE).
- **`mutate`**: Function to trigger the mutation, passing variables if needed.
- **`useQueryClient`**: Hook to access the `QueryClient` instance.
- **`queryClient.invalidateQueries`**: Marks queries matching the key as stale, triggering a refetch if they are currently rendered.
- **`queryClient.setQueryData`**: Allows direct manipulation of the cache. Use with caution.

### 6. Server Component Integration (Prefetching & Hydration)

While you can fetch data directly in Server Components using `Workspace`, TanStack Query provides a powerful pattern for prefetching data on the server and seamlessly hydrating it on the client. This avoids client-side loading spinners for initial data and leverages React Query's caching and background update features.

**a) Server-Side `QueryClient` Utility**

Create a utility to get a server-side `QueryClient` instance, using `React.cache` to ensure it's a singleton per request.

```javascript
// lib/getQueryClient.js
import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

// Use React cache to ensure a single instance per request
const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // Consistent default staleTime
        },
      },
    })
);
export default getQueryClient;
```

**b) Prefetching in a Server Component**

In your Server Component (e.g., a page), get the `QueryClient`, prefetch the data, dehydrate the state, and pass it to a Client Component via `HydrationBoundary`.

```javascript
// app/hydrated-posts/page.js (Server Component)
import {
  dehydrate,
  HydrationBoundary, // Renamed from Hydrate in v5
} from "@tanstack/react-query";
import getQueryClient from "@/lib/getQueryClient"; // Our server singleton utility
import PostListClient from "./PostListClient"; // The client component that will use the data

// The same fetch function used in the client component
async function fetchPosts() {
  console.log("Fetching posts on server...");
  const res = await fetch(
    "https://jsonplaceholder.typicode.com/posts?_limit=5"
  );
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
}

export default async function HydratedPostsPage() {
  const queryClient = getQueryClient();

  // Prefetch the data
  await queryClient.prefetchQuery({
    queryKey: ["posts-hydrated"], // Use a distinct key if needed, or the same one
    queryFn: fetchPosts,
  });

  // Dehydrate the state - gets serializable data from the cache
  const dehydratedState = dehydrate(queryClient);

  return (
    <div>
      <h1>Posts (Prefetched on Server)</h1>
      {/* Pass the dehydrated state to the boundary */}
      <HydrationBoundary state={dehydratedState}>
        {/* Render the client component that uses useQuery with the same queryKey */}
        <PostListClient />
      </HydrationBoundary>
    </div>
  );
}
```

**c) Using Prefetched Data in a Client Component**

The Client Component uses `useQuery` with the _exact same `queryKey`_ used for prefetching. React Query automatically picks up the dehydrated data, avoiding an initial fetch and loading state.

```javascript
// app/hydrated-posts/PostListClient.js (Client Component)
"use client";

import { useQuery } from "@tanstack/react-query";

// Define the fetch function (can be imported)
async function fetchPosts() {
  console.log("Fetching posts on client (should not happen initially)...");
  const res = await fetch(
    "https://jsonplaceholder.typicode.com/posts?_limit=5"
  );
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
}

export default function PostListClient() {
  const {
    data: posts,
    error,
    isPending,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["posts-hydrated"], // <<< MUST match the key used in prefetchQuery
    queryFn: fetchPosts,
  });

  // Because data is hydrated, isPending/isLoading should be false initially
  if (isPending) {
    return <span>Loading posts... (Should not see this on initial load)</span>;
  }

  if (isError) {
    return <span>Error fetching posts: {error.message}</span>;
  }

  return (
    <div>
      <ul>
        {posts?.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 7. Server Actions Integration (Mutations)

You can easily integrate Next.js Server Actions with `useMutation`.

**a) Define the Server Action**

Create a file (e.g., `app/actions.js`) for your server actions.

```javascript
// app/actions.js
"use server"; // Mark all functions in this file as Server Actions

import { revalidatePath } from "next/cache"; // Optional: For revalidating server-rendered pages

export async function createPostAction(formData) {
  // Simulate API call / database operation
  const title = formData.get("title");
  console.log("Server Action: Creating post with title -", title);

  // Example: Pretend to save to DB and get back the new post
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

  if (!title) {
    // You can throw errors from Server Actions
    throw new Error("Title is required");
  }

  const newPost = {
    id: Date.now(), // Simulate ID generation
    title: title,
    body: "Generated by Server Action",
    userId: 1,
  };

  // Optional: If this action affects data displayed on a server-rendered page,
  // you might want to revalidate the path or tag.
  // revalidatePath('/some-server-page');

  console.log("Server Action: Post created -", newPost);
  return newPost; // Return data from the action
}
```

**b) Call Server Action with `useMutation`**

In your Client Component form, use `useMutation`, passing the imported Server Action to `mutationFn`.

```javascript
// components/AddPostFormServerAction.js
"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPostAction } from "@/app/actions"; // Import the Server Action

export default function AddPostFormServerAction() {
  const queryClient = useQueryClient();
  const formRef = React.useRef(null); // Ref to reset the form

  const mutation = useMutation({
    mutationFn: createPostAction, // Pass the Server Action directly
    onSuccess: (data) => {
      console.log("Server Action Success:", data);
      // Invalidate queries that should be refetched after the action
      queryClient.invalidateQueries({ queryKey: ["posts"] }); // Or ['posts-hydrated'], etc.
      queryClient.invalidateQueries({ queryKey: ["posts-hydrated"] });

      // Reset the form
      formRef.current?.reset();
    },
    onError: (error) => {
      console.error("Server Action Error:", error);
      alert(`Error: ${error.message}`); // Show error to user
    },
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    mutation.mutate(formData); // Pass FormData to the mutation
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <h3>Add New Post (via Server Action)</h3>
      <input
        type="text"
        name="title" // Ensure input has a name attribute for FormData
        placeholder="Post title"
        disabled={mutation.isPending}
        required
      />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Adding..." : "Add Post"}
      </button>
      {mutation.isError && (
        <p style={{ color: "red" }}>Error: {mutation.error.message}</p>
      )}
    </form>
  );
}
```

### 8. DevTools

The `<ReactQueryDevtools />` component (added inside the provider wrapper in step 4a) provides a powerful tool during development to inspect your query cache, see query statuses, manually refetch, etc. They only render in development mode.

### 9. Configuration & Best Practices

- **Singleton `QueryClient`**: Essential for consistent caching. Use the `React.cache` pattern for server-side prefetching and the `typeof window` check for the client-side provider.
- **Query Keys**: Structure them consistently (e.g., `['todos', 'list', { status: 'done' }]`). They determine caching, so be precise. Ensure they are serializable.
- **`staleTime` vs `gcTime`**:
  - `staleTime`: How long data is considered fresh (won't refetch on mount/window focus). Default is `0`. Increase for data that doesn't change often, especially when hydrating.
  - `gcTime`: How long _inactive_ data stays in cache before being garbage collected. Default is 5 minutes. Increase if you want data to remain available longer even if unused (e.g., for quick revisits).
- **Error Handling**: Implement `isError` checks and potentially use React Error Boundaries for critical queries.
- **Server Components**: Fetch data directly or use the prefetch/hydration pattern for optimal user experience and to leverage React Query's client-side features.
- **Client Components**: Use `useQuery` for data fetching and `useMutation` for updates/creations/deletions, integrating with Server Actions where appropriate.
- **Invalidation vs Manual Updates**: Prefer `invalidateQueries` after mutations for simplicity and ensuring data consistency with the server. Use `setQueryData` for optimistic updates or specific caching scenarios, but be mindful of potential inconsistencies.

### 10. Conclusion

TanStack Query offers a robust and efficient way to manage server state in modern Next.js applications. By setting up the `QueryClientProvider`, utilizing hooks like `useQuery` and `useMutation`, leveraging the prefetching/hydration pattern with Server Components, and integrating with Server Actions, you can build fast, resilient, and maintainable data-driven UIs. Remember to configure `staleTime` appropriately when using hydration and manage your query keys effectively.
