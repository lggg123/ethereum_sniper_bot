# Blockchain Sniper Bot

## Overview

This project is a JavaScript-based blockchain sniper bot designed to monitor and execute trades on the blockchain with high-speed precision.

## Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- Ethereum wallet
- Hardhat
- Foundry (for Anvil local blockchain)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/blockchain-sniper-bot.git
cd blockchain-sniper-bot
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Smart Contract Compilation

In this step, we’ll deploy our ERC-20 token smart contract using [Remix](https://remix.ethereum.org). Remix is a web-based IDE for developing, testing, and deploying Solidity contracts.

### 3.1. Open Remix

1. **Navigate to:** [https://remix.ethereum.org](https://remix.ethereum.org)  
2. The Remix IDE will load in your browser.  

### 3.2. Create a New Solidity File

1. On the left-hand side panel in Remix, open the **File Explorer** tab.  
2. Click the **+** icon (or right-click) to create a **New File**.  
3. Name the file **`token.sol`**.

### 3.3. Copy & Paste the Contract Code

Open the newly created `token.sol` file and paste the following code:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(
        string memory name,
        string memory ticker,
        uint256 initialSupply
    ) ERC20(name, ticker) {
        _mint(msg.sender, initialSupply);
    }
}
```

### 3.4. Compile the Contract

1. In the left-hand panel, select the **Solidity Compiler** plugin (it has a small Solidity icon).  
2. Under the **Solidity Compiler** tab:
   - Choose a **compiler version** matching `pragma solidity 0.8.26`.  
   - If you don’t see that exact version, select a compatible `0.8.x` version.  
   - Click the **Compile `token.sol`** button.  
3. Scroll down in the compiler panel to check for any **warnings or errors** in the Remix console.  

---

### 3.5. Retrieve the Bytecode

After a successful compile:

1. Still in the **Solidity Compiler** tab, scroll to the **Compilation Details** at the bottom of the left-hand panel.  
   - You may need to click **Details** to expand it.  
2. **Copy Bytecode**: Look for a button labeled **“copy bytecode to clipboard.”** Click it to copy your compiled bytecode.  
   - store this in the blockchain.json file by replacing the current bytecode with the new one here on "erc20Bytecode". 

---

## Local Blockchain Setup

This project uses Anvil, a local blockchain simulator from Foundry. To set up and run the local blockchain:

1. Install Foundry (if not already installed):
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Start the local Anvil blockchain:
```bash
make anvil
```

This will start a local Ethereum blockchain with pre-funded accounts for testing.

## Configuration

1. Copy the `.env.example` to `.env`
```bash
cp .env.example .env
```

2. Fill in your configuration:
- `MAINNET_RPC_URL_WS`: Websocket RPC URL found on Infura.io
- `LOCAL_RPC_URL_WS`: local RPC URL websockets for testing
- `LOCAL_RPC_URL_HTTP`: local RPC URL HTTP for testing
- `MNEMONIC`: mnemonic phrase obtained from wallet (12 words usually)

## Running the Bot

```bash
make bot
```

## Testing

Run the test suite:
```bash
make test
```

## Features

- Fast blockchain transaction monitoring
- Customizable sniping parameters
- Local blockchain testing with Anvil
- Foundry development environment

## Step by step analysis of code

### What does it mean to create an event listener for a new liquidity pool?

When we talk about creating an “event listener” in the context of a sniper bot, we’re referring to setting up code that continuously monitors the blockchain (specifically a DEX factory contract, such as the UniswapV2Factory or PancakeFactory) for on-chain events that signal the creation of a new liquidity pool (often called a “pair” on many DEXes).

1. Event Emission on the Blockchain
    - On decentralized exchanges (DEXes) like Uniswap or PancakeSwap, when a pair (liquidity pool) is created between two tokens—say, Token A and Token B—a contract factory emits a PairCreated (or similarly named) event.
    - This event includes data such as the addresses of Token A, Token B, and the newly created pair (liquidity pool) contract.
2. Listening for the PairCreated Event
    - A sniper bot subscribes to the factory contract’s logs (on Ethereum, these are “log” events) using libraries like web3.js, ethers.js, or Python’s web3.py.
    - The bot’s “event listener” code basically says: “If the factory contract emits a PairCreated event, let me know immediately!”
    - Once your code “hears” that event, it can act on it in real time—such as by attempting a trade on that newly created pool.
3. Why This Matters for a Sniper Bot
    - The earlier you discover a new liquidity pool (often for a newly launched token), the faster you can “snipe” by buying in at the initial offering price (assuming the token is not heavily restricted).
    - Being fast matters, because a small delay (even seconds) can mean a big difference in price if other bots or traders jump in.

Why are we creating (or monitoring) a new liquidity pool for a sniper bot?

1. Sniper Bot Strategy
    - A sniper bot’s main goal is to buy tokens as soon as they become tradable—often the moment the liquidity is added.
    - Creating a new pool vs. monitoring a new pool can differ, depending on perspective. Most often, the project owner (or token deployer) is the one creating the liquidity pool. The sniper bot is listening for that creation so it can trade immediately.
2. Fresh Token Listings
    - Many new tokens launch on DEXes without a centralized listing process. Liquidity is added manually by the project team, creating a brand-new pool on the DEX.
    - Once that new liquidity pool is live, the token can be traded publicly. A sniper bot is designed to jump in right at that moment to buy the token before its price spikes.
3. Liquidity Pool Creation Mechanics
    - On something like Uniswap or PancakeSwap, anyone can create a pool by calling the factory contract’s createPair function.
    - After the pair is created, the next step is providing liquidity (e.g., Token BNB and the new Token XYZ). Once that liquidity is provided, the token becomes tradable.
    - The sniper bot listens for these on-chain events:
        * Pair creation (PairCreated event).
        - Liquidity added (a Mint event on the pool contract).
    - The sniper bot may also check if there are restrictions like a trading delay, high slippage, or special token mechanics (anti-bot measures).
4. Testing & Development
    - Sometimes, if you’re building your own token and want to test a sniper bot in a development environment, you’ll create a new liquidity pool on a test network. Then you can watch how your sniper bot reacts to that event in a sandbox.
    -In a real-world scenario on mainnet, your bot typically isn’t the one creating the pool; it’s the project dev who does that. Your bot is reacting.

### Why am I compiling a smart contract and getting the bytecode from it and not deploying it?

Compiling the contract and retrieving its bytecode—without deploying it yet—is a standard practice in many Solidity development workflows. Essentially, you’re building the “machine code” version of your Solidity code, which you can then use in several ways:

1. Local or Automated Deployment
    - The bytecode (along with the ABI) is what you’d programmatically deploy to a blockchain via scripts (e.g., Hardhat, Truffle, or a custom deployment script).
    - Sometimes, you don’t deploy directly through Remix. Instead, you use Remix just for a quick compile and bytecode generation. Later, you might use the bytecode in a continuous integration (CI) pipeline or an automated script.
2. Version Control & Build Artifacts
    - Storing bytecode in a JSON file (like blockchain.json) can be part of your build artifacts. This is analogous to how compiled code in other programming languages is stored before deployment.
    - It ensures that everyone on the dev team uses the exact same compiled output when they deploy or interact with the contract—no compile-time mismatches.
3. Off-Chain Validation & Analysis
    - If you have a security or a quality assurance process, you may need the final bytecode for advanced static analysis or verifying the contract on Etherscan without fully deploying it through Remix.
    - Tools like Slither or MythX might require the compiled bytecode and ABI for deeper security checks.
4. Interoperability with Other DApps
    - Some sniper bot setups or other dApps fetch the token’s bytecode to confirm it matches known contracts or to run checks (e.g., to detect a potential scam token).
    - Even if you’re not immediately deploying, you might integrate the contract’s bytecode into your testing environment or app logic.

### Lets go over the snipe function 
1. Reads token address from the snipeList.csv, if there is a token address it attempts to snipe the token.
    ```javascript
        let snipeList = fs.readFileSync(SNIPE_LIST_FILE);
        snipeList = snipeList
            .toString()
            .split("\n")
            .filter(snipe => snipe !== "");
        if(snipeList.length === 0) return;
        for(const snipe of snipeList) {
        const [pairAddress, wethAddress, tokenAddress] = snipe.split(",");
        console.log(`Trying to snipe ${tokenAddress} on ${pairAddress}`);
        const pair = new Contract(
            pairAddress,
            blockchain.pairAbi.abi,
            wallet
        );
    ```
2. Checks for liquidity
    ```javascript
        const totalSupply = await pair.totalSupply(); //LP token or liquidity provider token
        if(totalSupply === 0n) {
            console.log("Pool is empty, snipe cancelled");
            continue;
        }
    ```
3. If there is liquidity it proceeds to buy.
    ```javascript
        const tokenIn = wethAddress;
        const tokenOut = tokenAddress;

        // We buy 0.1 ETH of new token
        const amountIn = parseEther("0.1");
        const amounts  = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
        // Let's define our price tolerance
        // So this means minimumn I will get 95% of the quote I receive
        const amountOutMin = amounts[1] - amounts[1] * 5n / 100n;
        console.log(`
            Buying new token
            ================
            tokenIn: ${amountIn.toString()} ${tokenIn} {WETH}
            tokenOut: ${amountOut.toString()} ${tokenOut}    
        `);
        const tx = await router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            [tokenIn, tokenOut],
            blockchain.recipient,
            Date.now() + 1000 * + 60 * 10 // 10 minutes from now
        );
        const receipt = await tx.wait();
        console.log(`Transaction receipt: ${receipt}`);
    ```
4. If the token is already bought add it to the tokenList and remove it from the snipeList
    ```javascript
    if(receipt.status === "1") {
            //1. add it to list of token bought
            // this isnt the price it was executed in
            fs.appendFileSync(TOKEN_LIST_FILE, `${receipt.blockNumber},${wethAddress},${tokenAddress},${amountOutMin / amountIn}\n`)
            //2. remove it from snipeList
            let lines = fs.readFileSync(SNIPE_LIST_FILE).toString().split("\n");
            lines = lines.filter(line => line !== snipe); // filter out the processed line
            fs.writeFileSync(SNIPE_LIST_FILE, lines.join("\n"));
        }
    ```
### Now customize and add code to the managePosition function to properly manage your position and take a profit properly.
    ```javascript
    const managePosition = async () => {
    //1. Stop Loss
    //2. Take Profit
    }
    ```
## Security Notes

⚠️ **WARNING**: 
- Never share your private keys
- Use test wallets for development
- Understand the risks of blockchain trading

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Disclaimer

This bot is for educational purposes. Use at your own risk. Always do your own research and understand the potential financial implications.