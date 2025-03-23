import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface ApiRequestOptions {
  method: string;
  body?: string;
  headers?: Record<string, string>;
  on401?: "returnNull" | "throw";
}

export async function apiRequest(
  url: string,
  options: ApiRequestOptions,
): Promise<any> {
  const { method, body, headers = {}, on401 = "throw" } = options;
  
  if (body) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });
  
  if (on401 === "returnNull" && res.status === 401) {
    return null;
  }
  
  await throwIfResNotOk(res);
  
  // For empty responses (like 204 No Content)
  if (res.status === 204) {
    return { success: true };
  }
  
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
