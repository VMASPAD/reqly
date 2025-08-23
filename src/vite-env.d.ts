/// <reference types="vite/client" />
/// <reference types="preact" />

// Make React and Preact JSX compatible
declare global {
  namespace JSX {
    interface Element extends preact.VNode<any> {}
    interface IntrinsicElements extends preact.JSX.IntrinsicElements {}
  }
}

// Override React namespace to use Preact types
declare module "react" {
  export = preact;
  export as namespace React;
}

declare module "react/jsx-runtime" {
  export = preact.JSX;
}