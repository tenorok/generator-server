module.exports = {
    '*': () => 'tsc -p tsconfig.json --noEmit',
    '*': () => 'madge --circular --extensions ts ./src/',
    "*.{js,jsx,ts,tsx,json,html,css,scss,md}": "prettier --write"
}
