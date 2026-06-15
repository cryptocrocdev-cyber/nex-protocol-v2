/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/void.json`.
 */
export type Void = {
  "address": "9xdgUtSwbkztgcG8FeKLJ9kJkP8tc3C7rY2LebMfahut",
  "metadata": {
    "name": "void",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "burnXnt",
      "docs": [
        "3. Burn XNT → earn pending NEX (1:1)"
      ],
      "discriminator": [
        205,
        179,
        75,
        101,
        13,
        149,
        38,
        127
      ],
      "accounts": [
        {
          "name": "protocolState",
          "writable": true
        },
        {
          "name": "userState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "burnVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  114,
                  110,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimNex",
      "docs": [
        "4. Claim pending NEX (1:1, no bonus)"
      ],
      "discriminator": [
        143,
        193,
        142,
        129,
        244,
        71,
        248,
        180
      ],
      "accounts": [
        {
          "name": "userState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "claimVaultReward",
      "docs": [
        "9. Claim vault reward"
      ],
      "discriminator": [
        80,
        2,
        39,
        115,
        76,
        142,
        218,
        62
      ],
      "accounts": [
        {
          "name": "protocolState",
          "writable": true
        },
        {
          "name": "userState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "vaultRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  115,
                  104,
                  97,
                  114,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "consumePrestigeMedals",
      "docs": [
        "11. Consume old prestige medals into the newest one"
      ],
      "discriminator": [
        67,
        210,
        190,
        24,
        99,
        213,
        194,
        76
      ],
      "accounts": [
        {
          "name": "userState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "targetMedal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  101,
                  115,
                  116,
                  105,
                  103,
                  101,
                  95,
                  109,
                  101,
                  100,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "user_state.prestige_count",
                "account": "userState"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "count",
          "type": "u64"
        },
        {
          "name": "sourceCount",
          "type": "u8"
        }
      ]
    },
    {
      "name": "cosmeticUpgrade",
      "docs": [
        "10. Cosmetic upgrade — burn XNT for visual layers on medal"
      ],
      "discriminator": [
        168,
        205,
        177,
        200,
        5,
        251,
        154,
        173
      ],
      "accounts": [
        {
          "name": "protocolState",
          "writable": true
        },
        {
          "name": "userState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "devWallet",
          "writable": true,
          "address": "BQLB3NPHGRfibY23qTDbEYBuhZu2KsdiD3pbxuu8Fpxh"
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "upgradeKind",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initProtocol",
      "docs": [
        "1. Initialize protocol — authority sets dev wallet"
      ],
      "discriminator": [
        3,
        188,
        141,
        237,
        225,
        226,
        232,
        210
      ],
      "accounts": [
        {
          "name": "protocolState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "devWallet",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "initUser",
      "docs": [
        "2. Initialize user state"
      ],
      "discriminator": [
        14,
        51,
        68,
        159,
        237,
        78,
        158,
        102
      ],
      "accounts": [
        {
          "name": "userState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "mintChildToken",
      "docs": [
        "5. Mint a child token"
      ],
      "discriminator": [
        48,
        103,
        49,
        19,
        120,
        115,
        133,
        66
      ],
      "accounts": [
        {
          "name": "protocolState",
          "writable": true
        },
        {
          "name": "userState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "childToken",
          "writable": true
        },
        {
          "name": "devWallet",
          "writable": true,
          "address": "BQLB3NPHGRfibY23qTDbEYBuhZu2KsdiD3pbxuu8Fpxh"
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "tokenIndex",
          "type": "u8"
        }
      ]
    },
    {
      "name": "pairTokens",
      "docs": [
        "7. Pair two child tokens"
      ],
      "discriminator": [
        142,
        131,
        59,
        141,
        221,
        43,
        219,
        199
      ],
      "accounts": [
        {
          "name": "protocolState",
          "writable": true
        },
        {
          "name": "userState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "tokenPair",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  112,
                  97,
                  105,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "arg",
                "path": "aIdx"
              },
              {
                "kind": "arg",
                "path": "bIdx"
              }
            ]
          }
        },
        {
          "name": "childTokenA"
        },
        {
          "name": "childTokenB"
        },
        {
          "name": "devWallet",
          "writable": true,
          "address": "BQLB3NPHGRfibY23qTDbEYBuhZu2KsdiD3pbxuu8Fpxh"
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "aIdx",
          "type": "u8"
        },
        {
          "name": "bIdx",
          "type": "u8"
        }
      ]
    },
    {
      "name": "prestige",
      "docs": [
        "6. Prestige — consume all tokens to mint a medal"
      ],
      "discriminator": [
        165,
        199,
        34,
        149,
        7,
        36,
        38,
        66
      ],
      "accounts": [
        {
          "name": "protocolState",
          "writable": true
        },
        {
          "name": "userState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "prestigeMedal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  101,
                  115,
                  116,
                  105,
                  103,
                  101,
                  95,
                  109,
                  101,
                  100,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "user_state.prestige_count",
                "account": "userState"
              }
            ]
          }
        },
        {
          "name": "devWallet",
          "writable": true,
          "address": "BQLB3NPHGRfibY23qTDbEYBuhZu2KsdiD3pbxuu8Fpxh"
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "setDevFee",
      "docs": [
        "13. Set dev fee (authority only, capped at 1000 bps = 10%)"
      ],
      "discriminator": [
        94,
        243,
        39,
        111,
        187,
        92,
        59,
        110
      ],
      "accounts": [
        {
          "name": "protocolState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "feeIndex",
          "type": "u8"
        },
        {
          "name": "newBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "setTokenPrice",
      "docs": [
        "12. Set token price (authority only)"
      ],
      "discriminator": [
        166,
        216,
        142,
        197,
        200,
        225,
        253,
        233
      ],
      "accounts": [
        {
          "name": "protocolState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        },
        {
          "name": "newPrice",
          "type": "u64"
        }
      ]
    },
    {
      "name": "tickProduction",
      "docs": [
        "8. Tick production — accumulate resources"
      ],
      "discriminator": [
        78,
        135,
        124,
        91,
        71,
        232,
        45,
        102
      ],
      "accounts": [
        {
          "name": "userState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "childToken",
      "discriminator": [
        68,
        185,
        153,
        8,
        130,
        139,
        5,
        184
      ]
    },
    {
      "name": "prestigeMedal",
      "discriminator": [
        175,
        128,
        106,
        83,
        19,
        95,
        217,
        204
      ]
    },
    {
      "name": "protocolState",
      "discriminator": [
        33,
        51,
        173,
        134,
        35,
        140,
        195,
        248
      ]
    },
    {
      "name": "tokenPair",
      "discriminator": [
        17,
        214,
        45,
        176,
        229,
        149,
        197,
        71
      ]
    },
    {
      "name": "userState",
      "discriminator": [
        72,
        177,
        85,
        249,
        76,
        167,
        186,
        126
      ]
    },
    {
      "name": "vaultRecord",
      "discriminator": [
        47,
        1,
        218,
        116,
        82,
        70,
        124,
        119
      ]
    }
  ],
  "events": [
    {
      "name": "burnEvent",
      "discriminator": [
        33,
        89,
        47,
        117,
        82,
        124,
        238,
        250
      ]
    },
    {
      "name": "childTokenMintEvent",
      "discriminator": [
        139,
        123,
        149,
        15,
        219,
        55,
        239,
        64
      ]
    },
    {
      "name": "claimEvent",
      "discriminator": [
        93,
        15,
        70,
        170,
        48,
        140,
        212,
        219
      ]
    },
    {
      "name": "cosmeticUpgradeEvent",
      "discriminator": [
        77,
        129,
        250,
        117,
        1,
        188,
        114,
        250
      ]
    },
    {
      "name": "medalsConsumedEvent",
      "discriminator": [
        49,
        104,
        124,
        225,
        200,
        116,
        165,
        38
      ]
    },
    {
      "name": "pairEvent",
      "discriminator": [
        44,
        90,
        84,
        69,
        45,
        101,
        184,
        154
      ]
    },
    {
      "name": "prestigeEvent",
      "discriminator": [
        32,
        226,
        75,
        172,
        3,
        113,
        59,
        232
      ]
    },
    {
      "name": "tickEvent",
      "discriminator": [
        180,
        6,
        239,
        72,
        112,
        13,
        39,
        219
      ]
    },
    {
      "name": "vaultClaimEvent",
      "discriminator": [
        135,
        55,
        213,
        170,
        157,
        213,
        117,
        117
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "zeroAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6001,
      "name": "insufficientNex",
      "msg": "Insufficient NEX balance"
    },
    {
      "code": 6002,
      "name": "insufficientXnt",
      "msg": "Insufficient XNT balance"
    },
    {
      "code": 6003,
      "name": "invalidTokenIndex",
      "msg": "Invalid token index (0-8)"
    },
    {
      "code": 6004,
      "name": "missingPrerequisite",
      "msg": "Must own previous token first: CROWN→ORACLE→ANVIL→ECHO→FORGE→TIDE→VAULT→RIFT→PRIME"
    },
    {
      "code": 6005,
      "name": "tokenAlreadyMinted",
      "msg": "Already own this token"
    },
    {
      "code": 6006,
      "name": "nothingToClaim",
      "msg": "No pending NEX to claim"
    },
    {
      "code": 6007,
      "name": "notAllTokensActive",
      "msg": "Not all 9 child tokens active"
    },
    {
      "code": 6008,
      "name": "insufficientNexEarned",
      "msg": "Total NEX earned too low for prestige"
    },
    {
      "code": 6009,
      "name": "noPrestigeMedal",
      "msg": "No prestige medal found"
    },
    {
      "code": 6010,
      "name": "childTokenNotFound",
      "msg": "Child token not found"
    },
    {
      "code": 6011,
      "name": "tokenNotActive",
      "msg": "Child token not active"
    },
    {
      "code": 6012,
      "name": "sameToken",
      "msg": "Same token cannot pair with itself"
    },
    {
      "code": 6013,
      "name": "pairAlreadyExists",
      "msg": "Token pair already exists"
    },
    {
      "code": 6014,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6015,
      "name": "unauthorized",
      "msg": "Authorized call only"
    },
    {
      "code": 6016,
      "name": "invalidFeeIndex",
      "msg": "Fee index out of bounds (0-4)"
    },
    {
      "code": 6017,
      "name": "maxPrestigeReached",
      "msg": "Max prestige (100) already reached"
    },
    {
      "code": 6018,
      "name": "feeTooHigh",
      "msg": "Fee exceeds maximum (1000 bps = 10%)"
    },
    {
      "code": 6019,
      "name": "noVaultReward",
      "msg": "Nothing to claim from vault"
    },
    {
      "code": 6020,
      "name": "alreadyClaimedEpoch",
      "msg": "Already claimed this epoch"
    }
  ],
  "types": [
    {
      "name": "burnEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "xntAmount",
            "type": "u64"
          },
          {
            "name": "pendingNex",
            "type": "u64"
          },
          {
            "name": "totalBurned",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "childToken",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "tokenIndex",
            "type": "u8"
          },
          {
            "name": "mintedAt",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "resourceBalance",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "childTokenMintEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "tokenIndex",
            "type": "u8"
          },
          {
            "name": "cost",
            "type": "u64"
          },
          {
            "name": "devFee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "claimEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "claimed",
            "type": "u64"
          },
          {
            "name": "newBalance",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "cosmeticUpgradeEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "upgradeKind",
            "type": "u8"
          },
          {
            "name": "cost",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "medalsConsumedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "count",
            "type": "u64"
          },
          {
            "name": "newAbsorbed",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "pairEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "tokenA",
            "type": "u8"
          },
          {
            "name": "tokenB",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "prestigeEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "prestigeCount",
            "type": "u64"
          },
          {
            "name": "threshold",
            "type": "u64"
          },
          {
            "name": "medalSeed",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "prestigeMedal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "prestigeNumber",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "visualSeed",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "absorbedCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "protocolState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "devWallet",
            "type": "pubkey"
          },
          {
            "name": "totalXntBurned",
            "type": "u64"
          },
          {
            "name": "totalNexSupply",
            "type": "u64"
          },
          {
            "name": "totalBurns",
            "type": "u64"
          },
          {
            "name": "tokenPrices",
            "type": {
              "array": [
                "u64",
                9
              ]
            }
          },
          {
            "name": "devFeeBps",
            "type": {
              "array": [
                "u16",
                5
              ]
            }
          },
          {
            "name": "vaultTreasuryBalance",
            "type": "u64"
          },
          {
            "name": "cosmeticPrices",
            "type": {
              "array": [
                "u64",
                5
              ]
            }
          }
        ]
      }
    },
    {
      "name": "tickEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "ticksElapsed",
            "type": "i64"
          },
          {
            "name": "activeTokens",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "tokenPair",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "tokenA",
            "type": "u8"
          },
          {
            "name": "tokenB",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "userState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "totalXntBurned",
            "type": "u64"
          },
          {
            "name": "currentNexBalance",
            "type": "u64"
          },
          {
            "name": "pendingNex",
            "type": "u64"
          },
          {
            "name": "lastBurnTime",
            "type": "i64"
          },
          {
            "name": "lastClaimTime",
            "type": "i64"
          },
          {
            "name": "multiplier",
            "type": "u64"
          },
          {
            "name": "burnCount",
            "type": "u64"
          },
          {
            "name": "totalNexEarned",
            "type": "u64"
          },
          {
            "name": "hasMintPass",
            "type": "bool"
          },
          {
            "name": "prestigeCount",
            "type": "u64"
          },
          {
            "name": "lastTickTime",
            "type": "i64"
          },
          {
            "name": "activeTokenMask",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vaultClaimEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "epoch",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "vaultRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "lastClaimEpoch",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
