set(sqlite3_version 3.51.1-build2)
set(sqlite3_url
    https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@${sqlite3_version}/sqlite-wasm/jswasm)

set(dist ${CMAKE_CURRENT_BINARY_DIR}/build)
file(MAKE_DIRECTORY ${dist})
foreach(e sqlite3.wasm sqlite3.mjs)
    file(DOWNLOAD
        ${sqlite3_url}/${e}
        ${dist}/${e}
    )
endforeach()

