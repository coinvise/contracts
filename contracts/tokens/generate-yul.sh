# :'
# solidity: {
#     compilers: [
#       {
#         version: "0.8.18",
#         settings: {
#           metadata: {
#             // Not including the metadata hash
#             // https://github.com/paulrberg/hardhat-template/issues/31
#             bytecodeHash: "none",
#           },
#           viaIR: true,
#           optimizer: {
#             runs: 800,
#             enabled: true,
#           },
#           outputSelection: {
#             "*": {
#               "*": ["evm.assembly", "irOptimized"],
#             },
#           },
#         },
#       },
#     ],
#   }
# '

CONTRACT="ERC721TokenFactory"
DBG_PATH="artifacts/contracts/tokens/erc721/clones/""${CONTRACT}"".sol/""${CONTRACT}"".dbg.json"
BUILD_PATH=$(jq -r '.buildInfo[26:]' "$DBG_PATH")
jq -r '.output.contracts."contracts/tokens/erc721/clones/'"${CONTRACT}"'.sol".'"${CONTRACT}"'.irOptimized' \
  artifacts/build-info/"$BUILD_PATH" |
  cat >"contracts/tokens/erc721/clones/${CONTRACT}".yul
