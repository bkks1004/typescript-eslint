/**
 * Pack all of our packages so we can "install" them later.
 * We do this here rather than per test so that we only have
 * to do it once per test run as it takes a decent chunk of
 * time to do.
 * This also ensures all of the tests are guaranteed to run
 * against the exact same version of the package.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import tmp from 'tmp';

interface PackageJSON {
  devDependencies: Record<string, string>;
  name: string;
  private?: boolean;
}

const PACKAGES_DIR = path.resolve(__dirname, '..', '..');
const PACKAGES = fs.readdirSync(PACKAGES_DIR);

const tarFolder = tmp.dirSync({
  // because of how jest executes things, we need to ensure
  // the temp files hang around
  keep: true,
}).name;

export const tseslintPackages: PackageJSON['devDependencies'] = {};
for (const pkg of PACKAGES) {
  const packageDir = path.join(PACKAGES_DIR, pkg);
  const packagePath = path.join(packageDir, 'package.json');
  if (!fs.existsSync(packagePath)) {
    continue;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports -- this file needs to be sync and CJS for jest
  const packageJson = require(packagePath) as PackageJSON;
  if (packageJson.private === true) {
    continue;
  }

  const result = spawnSync('npm', ['pack', packageDir], {
    cwd: tarFolder,
    encoding: 'utf-8',
  });
  const stdoutLines = result.stdout.trim().split('\n');
  const tarball = stdoutLines[stdoutLines.length - 1];

  tseslintPackages[packageJson.name] = `file:${path.join(tarFolder, tarball)}`;
}

console.log('Finished packing local packages.');
