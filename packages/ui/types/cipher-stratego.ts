/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/cipher_stratego.json`.
 */
export type CipherStratego = {
  "address": "5UejADLz4JjiCDqYqDh4xZubzcTjPdZw7fSqvQq9wBjK",
  "metadata": {
    "name": "cipherStratego",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Arcium & Anchor"
  },
  "docs": [
    "* @description\n  * The main module for the Cipher Stratego program, decorated with `#[arcium_program]`.\n  * This macro replaces Anchor's `#[program]` and is necessary for integrating\n  * with the Arcium network. All game logic instructions will be defined within this module."
  ],
  "instructions": [
    {
      "name": "fireShot",
      "discriminator": [
        66,
        150,
        104,
        42,
        242,
        254,
        17,
        199
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_seed",
                "account": "game"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "computationOffset",
          "type": "u64"
        },
        {
          "name": "x",
          "type": "u8"
        },
        {
          "name": "y",
          "type": "u8"
        }
      ]
    },
    {
      "name": "fireShotCallback",
      "discriminator": [
        144,
        174,
        15,
        132,
        81,
        159,
        129,
        141
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "game",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "output",
          "type": {
            "defined": {
              "name": "computationOutputs"
            }
          }
        }
      ]
    },
    {
      "name": "forfeit",
      "discriminator": [
        80,
        154,
        237,
        158,
        244,
        198,
        154,
        9
      ],
      "accounts": [
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_seed",
                "account": "game"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "initCompDefCheckShot",
      "discriminator": [
        234,
        155,
        123,
        215,
        94,
        52,
        96,
        21
      ],
      "accounts": [
        {
          "name": "payer",
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
      "name": "initCompDefRevealBoards",
      "discriminator": [
        192,
        120,
        161,
        192,
        102,
        77,
        29,
        187
      ],
      "accounts": [
        {
          "name": "payer",
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
      "name": "initializeGame",
      "docs": [
        "* @description Initializes a new game.\n      * Creates the `Game` PDA and sets the caller as Player 1.\n      *\n      * @param ctx - The context containing the accounts for the instruction.\n      * @param game_seed - A random u64 used to seed the game PDA, ensuring a unique address."
      ],
      "discriminator": [
        44,
        62,
        102,
        247,
        126,
        208,
        130,
        215
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "gameSeed"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "gameSeed",
          "type": "u64"
        }
      ]
    },
    {
      "name": "joinGame",
      "discriminator": [
        107,
        112,
        18,
        38,
        56,
        173,
        60,
        128
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_seed",
                "account": "game"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "revealBoards",
      "discriminator": [
        129,
        221,
        53,
        171,
        116,
        131,
        107,
        115
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "game",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_seed",
                "account": "game"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "computationOffset",
          "type": "u64"
        },
        {
          "name": "p1Ciphertext",
          "type": "bytes"
        },
        {
          "name": "p1Pubkey",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "p1Nonce",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        },
        {
          "name": "p2Ciphertext",
          "type": "bytes"
        },
        {
          "name": "p2Pubkey",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "p2Nonce",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        }
      ]
    },
    {
      "name": "revealBoardsCallback",
      "discriminator": [
        18,
        199,
        189,
        97,
        196,
        184,
        67,
        111
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "output",
          "type": {
            "defined": {
              "name": "computationOutputs"
            }
          }
        }
      ]
    },
    {
      "name": "submitBoard",
      "discriminator": [
        159,
        144,
        132,
        92,
        198,
        49,
        200,
        53
      ],
      "accounts": [
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.game_seed",
                "account": "game"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "boardRows",
          "type": "bytes"
        },
        {
          "name": "publicKey",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "nonce",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "game",
      "discriminator": [
        27,
        90,
        166,
        125,
        74,
        100,
        121,
        18
      ]
    }
  ],
  "events": [
    {
      "name": "boardRevealEvent",
      "discriminator": [
        73,
        35,
        129,
        180,
        128,
        92,
        116,
        165
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "gameAlreadyFull",
      "msg": "This game is already full."
    },
    {
      "code": 6001,
      "name": "invalidGameState",
      "msg": "The game is not in the correct state for this action."
    },
    {
      "code": 6002,
      "name": "boardAlreadySubmitted",
      "msg": "This board has already been submitted."
    },
    {
      "code": 6003,
      "name": "notYourTurn",
      "msg": "It is not your turn."
    },
    {
      "code": 6004,
      "name": "squareAlreadyTargeted",
      "msg": "This square has already been targeted."
    },
    {
      "code": 6005,
      "name": "gameNotOver",
      "msg": "The game is not over yet."
    },
    {
      "code": 6006,
      "name": "boardsNotSubmitted",
      "msg": "Both players must submit their boards before play can begin."
    }
  ],
  "types": [
    {
      "name": "boardRevealEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "p1Board",
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    8
                  ]
                },
                8
              ]
            }
          },
          {
            "name": "p2Board",
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    8
                  ]
                },
                8
              ]
            }
          }
        ]
      }
    },
    {
      "name": "computationOutputs",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "bytes",
            "fields": [
              "bytes"
            ]
          },
          {
            "name": "abort"
          }
        ]
      }
    },
    {
      "name": "coordinate",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "x",
            "type": "u8"
          },
          {
            "name": "y",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "game",
      "docs": [
        "* @description The core on-chain account for a single game, using fixed-size arrays\n  *              for predictable sizing as per the project rules."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "players",
            "type": {
              "array": [
                "pubkey",
                2
              ]
            }
          },
          {
            "name": "turnNumber",
            "type": "u64"
          },
          {
            "name": "boardStates",
            "type": {
              "array": [
                {
                  "array": [
                    {
                      "array": [
                        "u8",
                        16
                      ]
                    },
                    8
                  ]
                },
                2
              ]
            }
          },
          {
            "name": "nonces",
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    16
                  ]
                },
                2
              ]
            }
          },
          {
            "name": "publicKeys",
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    32
                  ]
                },
                2
              ]
            }
          },
          {
            "name": "gameLog",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "shot"
                  }
                },
                16
              ]
            }
          },
          {
            "name": "logIdx",
            "type": "u8"
          },
          {
            "name": "gameState",
            "type": {
              "defined": {
                "name": "gameState"
              }
            }
          },
          {
            "name": "gameSeed",
            "type": "u64"
          },
          {
            "name": "boardsSubmitted",
            "type": {
              "array": [
                "bool",
                2
              ]
            }
          }
        ]
      }
    },
    {
      "name": "gameState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "awaitingPlayer"
          },
          {
            "name": "p1Turn"
          },
          {
            "name": "p2Turn"
          },
          {
            "name": "p1Won"
          },
          {
            "name": "p2Won"
          },
          {
            "name": "draw"
          }
        ]
      }
    },
    {
      "name": "hitOrMiss",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "miss"
          },
          {
            "name": "hit"
          }
        ]
      }
    },
    {
      "name": "shot",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "coord",
            "type": {
              "defined": {
                "name": "coordinate"
              }
            }
          },
          {
            "name": "result",
            "type": {
              "defined": {
                "name": "hitOrMiss"
              }
            }
          }
        ]
      }
    }
  ]
};
