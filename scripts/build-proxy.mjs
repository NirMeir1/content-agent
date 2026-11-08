import { build } from 'esbuild';
await build({ entryPoints: ['proxy/server.ts'], outfile: '.proxy-build/server.cjs', bundle: true, platform: 'node', target: 'node24', format: 'cjs', external: ['@libsql/client'], sourcemap: false });
