include .env

anvil :; anvil --fork-url ${MAINNET_RPC_URL_WS}
bot :; node bot.js
test :; node test.js