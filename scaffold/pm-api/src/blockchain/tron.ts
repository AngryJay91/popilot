import type { BlockchainAdapter } from './adapter.js'

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58ToHex(addr: string): string {
  let num = 0n
  for (const c of addr) {
    const idx = ALPHABET.indexOf(c)
    if (idx < 0) throw new Error(`Invalid base58 char: ${c}`)
    num = num * 58n + BigInt(idx)
  }
  const hex = num.toString(16).padStart(50, '0')
  return hex.slice(0, 42)
}

export class TronAdapter implements BlockchainAdapter {
  private contractAddress: string
  private tokenName: string
  private tokenDecimals: number

  constructor(opts: { contractAddress: string; tokenName: string; tokenDecimals?: number }) {
    this.contractAddress = opts.contractAddress
    this.tokenName = opts.tokenName
    this.tokenDecimals = opts.tokenDecimals ?? 8
  }

  getTokenName(): string { return this.tokenName }
  getNativeName(): string { return 'TRX' }

  async getBalance(address: string): Promise<{ native: number; token: number }> {
    try {
      const addrHex = base58ToHex(address)
      const contractHex = base58ToHex(this.contractAddress)

      const [trxRes, balanceRes] = await Promise.all([
        fetch(`https://api.trongrid.io/v1/accounts/${address}`),
        fetch('https://api.trongrid.io/wallet/triggerconstantcontract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner_address: addrHex,
            contract_address: contractHex,
            function_selector: 'balanceOf(address)',
            parameter: addrHex.slice(2).padStart(64, '0'),
          }),
        }),
      ])

      const trxData = await trxRes.json() as any
      const balanceData = await balanceRes.json() as any

      const native = (trxData.data?.[0]?.balance ?? 0) / 1_000_000
      const token = balanceData.constant_result?.[0]
        ? parseInt(balanceData.constant_result[0], 16) / 10 ** this.tokenDecimals
        : 0

      return { native, token }
    } catch {
      return { native: 0, token: 0 }
    }
  }
}
