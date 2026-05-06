import { existsSync, rmSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const sourceDir = join(process.cwd(), 'dist', 'client', 'assets');
const destDir = join(process.cwd(), 'public', 'assets');

function copyRecursive(src, dest) {
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

if (!existsSync(sourceDir)) {
  throw new Error(`Source directory not found: ${sourceDir}`);
}

rmSync(destDir, { recursive: true, force: true });
mkdirSync(destDir, { recursive: true });
copyRecursive(sourceDir, destDir);
console.log(`Copied client assets from ${sourceDir} to ${destDir}`);
