# The Citation Trail｜引用踪迹

A bilingual, static digital-curation prototype tracing six excerpt groups from 《贞丰八年血泪录》 across seven public-facing sources.

## Deploy on Vercel

This project is plain HTML, CSS, and JavaScript. It has no npm dependencies, backend, or build step.

1. Extract the ZIP file.
2. Upload the **contents** of this folder to the root of your GitHub repository. `index.html` must sit directly in the repository root.
3. In Vercel, import the repository.
4. Choose **Other** as the framework preset.
5. Leave Build Command and Install Command empty.
6. Set Output Directory to `.` (or leave the default root output if Vercel accepts it).
7. Deploy.

If you keep the files inside a nested folder named `the-citation-trail`, set Vercel's **Root Directory** to that folder. The simpler option is to upload the files directly to the repository root.

## Files

- `index.html` — page structure and bilingual curatorial text
- `style.css` — visual design and responsive layout
- `script.js` — D3 force network, excerpt/source interactions, language switch
- `data.js` — editable source, excerpt, and reference data
- `references.md` — source register and verification checklist
- `vercel.json` — static deployment configuration

## Important research-integrity note

The excerpt wording and source-to-excerpt associations in `data.js` were carried over from the existing project draft. They are **working transcriptions**, not independently authenticated transcriptions. The prototype visibly labels this limitation. Before public release, compare every Chinese passage and English translation against the exact cited publication or inscription, and complete missing bibliographic details.

The graph encodes **shared excerpt presence**. An undirected edge means two sources are associated with one or more of the same excerpt IDs in the working dataset. It does not prove direct copying, a direction of citation, or a closed citation loop. Those stronger claims require documentary evidence such as publication chronology, references/footnotes, and textual comparison.

## Editing the data

Edit `data.js`:
- `sources`: seven source records and their `excerptIds`
- `excerpts`: six bilingual excerpt records
- `references`: complete source register

Use only evidence you can verify. If a source URL is unknown, leave `url` empty and record what evidence is still needed; do not guess a URL.

## External dependency

D3.js v7 is loaded from the official CDN: `https://d3js.org/d3.v7.min.js`. An internet connection is required for the network visualization. The rest of the page is static.

## Design reference

The interaction hierarchy and restrained information-design approach were informed by the author's INFOSCI 301 Advanced Visualization Atlas:
https://github.com/Sitong-Chang/infosci301-advanced-visualization-atlas
