import { build } from "esbuild";
await build({
  entryPoints: ["assets/cloud-source.js"],
  outfile: "assets/cloud-client.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  // Keep embedded SDK strings escaped, not literal whitespace at line ends.
  supported: { "template-literal": false },
  legalComments: "eof",
});
