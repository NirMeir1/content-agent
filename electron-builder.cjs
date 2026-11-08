module.exports = {
  appId: 'com.bottomline.contentagent', productName: 'Bottomline Content Agent',
  directories: { app: '.desktop-build/app', output: 'release' },
  files: ['main.cjs', 'package.json', '!**/node_modules{,/**/*}'],
  extraFiles: [
    { from: '.desktop-cache/vc-runtime/vcruntime140.dll_amd64', to: 'vcruntime140.dll' },
    { from: '.desktop-cache/Microsoft-Visual-C-Runtime.rtf', to: 'licenses/Microsoft-Visual-C-Runtime.rtf' },
  ],
  extraResources: [
    { from: '.desktop-build/server', to: 'server', filter: ['**/*', '!**/.env*', '!**/*.map'] },
    // electron-builder deliberately skips root node_modules in generic resource copies.
    { from: '.desktop-build/server/node_modules', to: 'server/node_modules', filter: ['**/*', '!**/.env*', '!**/*.map'] },
    { from: '.desktop-build/client.json', to: 'client.json' },
  ],
  asar: true, npmRebuild: false,
  ...(require('node:fs').existsSync('.desktop-cache/electron/electron.exe') ? { electronDist: '.desktop-cache/electron' } : {}),
  win: { target: [{ target: 'portable', arch: ['x64'] }], artifactName: 'Bottomline-Content-Agent.exe', signExecutable: false },
  toolsets: { nsis: '1.2.1' },
  // true means a fresh NSIS plugin directory per RUN. The default uses a shared
  // per-build directory which a second launch deletes beneath the first instance.
  portable: { requestExecutionLevel: 'user', unpackDirName: true },
  afterPack: async context => {
    const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
    function verifyResources(directory, relative = '') {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const source = path.join(directory, entry.name), name = path.join(relative, entry.name);
        if (entry.isDirectory()) { verifyResources(source, name); continue; }
        const destination = path.join(context.appOutDir, 'resources/server', name);
        if (!fs.existsSync(destination) || createHash('sha256').update(fs.readFileSync(source)).digest('hex') !== createHash('sha256').update(fs.readFileSync(destination)).digest('hex')) throw new Error('Packaged runtime resource is missing or changed: ' + name);
      }
    }
    verifyResources('.desktop-build/server');
    require('node:fs').rmSync(require('node:path').join(context.appOutDir, 'resources/default_app.asar'), { force: true });
    const { flipFuses, FuseVersion, FuseV1Options } = await import('@electron/fuses');
    await flipFuses(require('node:path').join(context.appOutDir, 'Bottomline Content Agent.exe'), {
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    });
  },
};
