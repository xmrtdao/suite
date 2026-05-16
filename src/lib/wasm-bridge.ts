/**
 * WASM Bridge for Monero wallet operations
 * Loads wasm module and exposes typed interface
 */

export interface WasmWallet {
  createWallet(seed?: string): Promise<{
    address: string;
    seed: string;
    viewKey: string;
    spendKey: string;
  }>;
  getBalance(address: string): Promise<{ unlocked: number; total: number }>;
  signTransfer(to: string, amount: number): Promise<string>;
}

let wasmModule: any = null;

export async function loadWasmBridge(): Promise<WasmWallet> {
  if (!wasmModule) {
    const mod = await import('./monero-wallet-wasm.js').catch(() => null);
    wasmModule = mod;
  }

  if (!wasmModule) {
    return createMockBridge();
  }

  return wasmModule as WasmWallet;
}

function createMockBridge(): WasmWallet {
  console.warn('[WASM] Running in mock mode — real operations disabled');
  return {
    async createWallet(seed?: string) {
      return {
        address: '4...mock',
        seed: seed || 'mock-seed-phrase-here',
        viewKey: 'mock-view',
        spendKey: 'mock-spend'
      };
    },
    async getBalance(_address: string) {
      return { unlocked: 0, total: 0 };
    },
    async signTransfer(_to: string, _amount: number) {
      return 'mock-tx-signature';
    }
  };
}

export default loadWasmBridge;
