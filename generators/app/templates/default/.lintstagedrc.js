module.exports = {
    "*.{js,jsx,ts,tsx}": "eslint",
    "*.{js,jsx,ts,tsx,json,html,css,scss,md}": "prettier --write",
    '*': () => 'madge --circular --extensions ts ./src/',
    '*': () => 'tsc -p tsconfig.json --incremental false --noEmit',
}
