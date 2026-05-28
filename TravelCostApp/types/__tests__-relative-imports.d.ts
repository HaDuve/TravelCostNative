// Work around TypeScript module resolution for some relative imports in tests.
// Jest compiles these paths fine, but the TS language service used by editor diagnostics
// can occasionally fail to resolve newly-added util modules.
declare module "../../util/budget" {
  export * from "../util/budget";
}

