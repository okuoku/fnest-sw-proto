#!/bin/sh
cp ./node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3.wasm ./
exec npm exec -- rollup -c
