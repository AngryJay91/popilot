/**
 * Blockchain adapter interface — provider-agnostic balance query layer.
 * Implementations: TronAdapter, (future: EthAdapter, SolanaAdapter)
 */

export interface BlockchainAdapter {
  getBalance(address: string): Promise<{ native: number; token: number }>
  getTokenName(): string
  getNativeName(): string
}

let _adapter: BlockchainAdapter | null = null

export function setBlockchainAdapter(adapter: BlockchainAdapter) {
  _adapter = adapter
}

export function getBlockchainAdapter(): BlockchainAdapter | null {
  return _adapter
}
