# Demo sandbox

Open <https://bookmark-escape-hatch.sociobot.in/demo> or use “Try it with sample
data” on the landing page. `/?demo=1` is also supported.

The demo begins with a completed inspection of four realistic Netscape bookmark
rows: two portable links, one exact duplicate, and one malformed URL. The sample
includes folders, tags, a note, dates, and source-attribution loss for destination
testing.

Demo results use the separate IndexedDB database `demo:bookmark-escape-hatch`.
They never read or write the real `bookmark-escape-hatch` database. “Reset demo”
re-seeds the original sample. “Start for real” clears the demo snapshot and returns
to the empty real workbench.

The service worker includes `/demo` and its sample in the offline application shell.
