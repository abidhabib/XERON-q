# Crypto-only account activation setup

Run `SCHEMA/20261112_crypto_invoices.sql` once against the database configured
in this server's `.env` file.

Add these values to `Server/.env` before starting the backend:

```env
# Never expose this seed to the frontend or commit it to git.
PAYOUT_MNEMONIC=your twelve-or-twenty-four-word seed phrase

# The BEP20 address that receives swept USDT.
MAIN_WALLET=0xYourAdminWalletAddress

# Optional; defaults to a public BSC endpoint and official Binance-Peg USDT.
BSC_RPC=https://bsc.publicnode.com
USDT_BSC=0x55d398326f99059fF775485246999027B3197955
```

Fund the master wallet (derivation account index `0`) with a small BNB balance.
It pays the gas required for invoice wallets to sweep USDT to `MAIN_WALLET`.
