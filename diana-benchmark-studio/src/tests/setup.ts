import "@testing-library/jest-dom/vitest";
import { webcrypto } from "node:crypto";
import { TextDecoder, TextEncoder } from "node:util";
if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, "crypto", { value: webcrypto });
if (!globalThis.TextEncoder) Object.assign(globalThis, { TextEncoder, TextDecoder });
if (!globalThis.URL.createObjectURL) globalThis.URL.createObjectURL = () => "blob:test";
if (!globalThis.URL.revokeObjectURL) globalThis.URL.revokeObjectURL = () => undefined;
