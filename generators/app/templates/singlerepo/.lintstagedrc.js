module.exports = {
    "*.{js,jsx,ts,tsx}": "eslint",
    "*.{js,jsx,ts,tsx,json,html,css,scss,md}": "prettier --write",
    '*': () => [
        'madge --circular ./app/src/',
        'tsc -p tsconfig.json --incremental false --noEmit',
    ],
}
