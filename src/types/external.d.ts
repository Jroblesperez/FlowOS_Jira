declare module 'react' {
  export type ReactNode = unknown;
  export type SetStateAction<T> = T | ((previous: T) => T);
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useState<T>(initial: T): [T, (value: SetStateAction<T>) => void];
  export function useState<T = undefined>(): [
    T | undefined,
    (value: SetStateAction<T | undefined>) => void,
  ];
  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  export function useCallback<T extends (...args: never[]) => unknown>(
    callback: T,
    deps: unknown[],
  ): T;
  export function memo<T>(component: T): T;
  const React: { StrictMode: (props: { children?: unknown }) => unknown };
  export default React;
}
declare module 'react-dom/client' {
  export function createRoot(element: Element): { render(node: unknown): void };
}
declare module 'react/jsx-runtime' {
  export const jsx: unknown;
  export const jsxs: unknown;
  export const Fragment: unknown;
}
declare namespace JSX {
  interface IntrinsicAttributes {
    key?: string | number;
  }
  interface IntrinsicElements {
    [elementName: string]: unknown;
  }
}
declare module '*.css' {}
declare module '@forge/bridge' {
  export function invoke<T = unknown>(key: string, payload?: unknown): Promise<T>;
  export const view: { getContext(): Promise<{ moduleKey: string }> };
}
declare module '@forge/resolver' {
  export default class Resolver {
    define(key: string, cb: (request: unknown) => unknown): void;
    getDefinitions(): unknown;
  }
}
declare module '@forge/api' {
  const api: {
    asUser(): {
      requestJira(
        path: unknown,
        init?: unknown,
      ): Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
    };
  };
  export function route(strings: TemplateStringsArray, ...values: unknown[]): string;
  export default api;
}
declare module '@forge/kvs' {
  export const kvs: {
    set<T>(key: string, value: T): Promise<void>;
    get<T>(key: string): Promise<T | undefined>;
  };
}
declare module '@storybook/react' {
  export type Meta<T> = { component?: T; [key: string]: unknown };
  export type StoryObj<T> = { args?: unknown; componentType?: T };
}
declare module '@vitejs/plugin-react' {
  export default function react(): unknown;
}
declare module 'vite' {
  export function defineConfig(config: unknown): unknown;
}
declare module 'vitest/config' {
  export function defineConfig(config: unknown): unknown;
}
declare module 'vitest' {
  export function it(name: string, fn: () => unknown): void;
  export const expect: (value: unknown) => {
    toBe(expected: unknown): void;
    toBeDefined(): void;
    toContain(expected: unknown): void;
  };
}
