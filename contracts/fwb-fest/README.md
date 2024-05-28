# FWBFestAttendanceNFT

## Development

Use `.env.example` as an template to create `.env` file.

Replace zero addresses in `TRUSTED_ADDRESS` and `CAMPAIGN_MANAGER` values to non zero addresses.

## Deployment

```
npx hardhat deploy:FWB --network {network} --trusted {trustedAddress}
```

If you're already set `TRUESTED_ADDRESS` env var, you can omit `trusted` option.
