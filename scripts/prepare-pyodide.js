const packages = [
  'micropip',
  'packaging',
  'requests',
  'beautifulsoup4',
  'numpy',
  'pandas',
  'matplotlib',
  'scikit-learn',
  'scipy',
  'regex',
  'sympy',
  'tiktoken',
  'seaborn',
  'pytz',
  'black',
  'openai',
  'openpyxl'
];
const pypiPackages = ['black', 'pathspec', 'mypy_extensions', 'pytokens'];
import { loadPyodide } from 'pyodide';
import { setGlobalDispatcher, ProxyAgent } from 'undici';
import { writeFile, readFile, copyFile, readdir, rmdir, access, mkdir, stat } from 'fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Check if static/pyodide directory exists and contains Pyodide files.
 * If it does, skip the entire download process.
 */
async function checkPyodideDirectory() {
  const pyodideDir = 'static/pyodide';
  try {
    const stats = await stat(pyodideDir);
    if (stats.isDirectory()) {
      // Check if the directory contains Pyodide files (e.g., pyodide.mjs)
      const files = await readdir(pyodideDir);
      if (files.includes('pyodide.mjs')) {
        console.log('Pyodide directory already exists and is complete. Skipping downloads.');
        return true;
      }
    }
  } catch (err) {
    // Directory doesn't exist or isn't accessible
    console.log('Pyodide directory not found or incomplete. Proceeding with download.');
  }
  return false;
}

/**
 * Loading network proxy configurations from the environment variables.
 * And the proxy config with lowercase name has the highest priority to use.
 */
function initNetworkProxyFromEnv() {
  const allProxy = process.env.all_proxy || process.env.ALL_PROXY;
  const httpsProxy = process.env.https_proxy || process.env.HTTPS_PROXY;
  const httpProxy = process.env.http_proxy || process.env.HTTP_PROXY;
  const preferredProxy = httpsProxy || allProxy || httpProxy;

  if (!preferredProxy || !preferredProxy.startsWith('http')) return;

  let preferredProxyURL;
  try {
    preferredProxyURL = new URL(preferredProxy).toString();
  } catch {
    console.warn(`Invalid network proxy URL: "${preferredProxy}"`);
    return;
  }

  const dispatcher = new ProxyAgent({ uri: preferredProxyURL });
  setGlobalDispatcher(dispatcher);
  console.log(`Initialized network proxy "${preferredProxy}" from env`);
}

async function downloadPackages() {
  console.log('Setting up pyodide + micropip');
  let pyodide;
  try {
    pyodide = await loadPyodide({
      packageCacheDir: 'static/pyodide'
    });
  } catch (err) {
    console.error('Failed to load Pyodide:', err);
    return;
  }

  const packageJson = JSON.parse(await readFile('package.json'));
  const pyodideVersion = packageJson.dependencies.pyodide.replace('^', '');

  try {
    const pyodidePackageJson = JSON.parse(await readFile('static/pyodide/package.json'));
    const pyodidePackageVersion = pyodidePackageJson.version.replace('^', '');
    if (pyodideVersion !== pyodidePackageVersion) {
      console.log('Pyodide version mismatch, removing static/pyodide directory');
      await rmdir('static/pyodide', { recursive: true });
    }
  } catch (err) {
    console.log('Pyodide package not found, proceeding with download.', err);
  }

  try {
    console.log('Loading micropip package');
    await pyodide.loadPackage('micropip');
    const micropip = pyodide.pyimport('micropip');
    console.log('Downloading Pyodide packages:', packages);

    try {
      for (const pkg of packages) {
        console.log(`Installing package: ${pkg}`);
        await micropip.install(pkg);
      }
    } catch (err) {
      console.error('Package installation failed:', err);
      return;
    }

    console.log('Pyodide packages downloaded, freezing into lock file');
    try {
      const lockFile = await micropip.freeze();
      await writeFile('static/pyodide/pyodide-lock.json', lockFile);
    } catch (err) {
      console.error('Failed to write lock file:', err);
    }
  } catch (err) {
    console.error('Failed to load or install micropip:', err);
  }
}

async function copyPyodide() {
  console.log('Copying Pyodide files into static directory');
  try {
    await mkdir('static/pyodide', { recursive: true });
  } catch (err) {
    console.log('Directory already exists, skipping mkdir');
  }

  for await (const entry of await readdir('node_modules/pyodide')) {
    await copyFile(`node_modules/pyodide/${entry}`, `static/pyodide/${entry}`);
  }
}

/**
 * Download pure-Python wheels from PyPI and save them into static/pyodide/.
 * Also injects entries into pyodide-lock.json so that micropip resolves these
 * packages from the local server instead of fetching them from the internet.
 */
async function downloadPyPIWheels() {
  const lockPath = 'static/pyodide/pyodide-lock.json';
  let lockData;
  try {
    lockData = JSON.parse(await readFile(lockPath, 'utf-8'));
  } catch {
    console.warn('Could not read pyodide-lock.json, skipping PyPI wheel download');
    return;
  }

  for (const pkg of pypiPackages) {
    console.log(`Fetching PyPI metadata for: ${pkg}`);
    const res = await fetch(`https://pypi.org/pypi/${pkg}/json`);
    if (!res.ok) {
      console.error(`Failed to fetch PyPI metadata for ${pkg}: ${res.status}`);
      continue;
    }
    const meta = await res.json();
    const version = meta.info.version;
    const files = meta.urls || [];

    // Find the pure-Python wheel (py3-none-any)
    const wheel = files.find(
      (f) => f.filename.endsWith('.whl') && f.filename.includes('py3-none-any')
    );

    if (!wheel) {
      console.warn(`No pure-Python wheel found for ${pkg}==${version}, skipping`);
      continue;
    }

    const dest = `static/pyodide/${wheel.filename}`;

    // Download wheel if not already present
    try {
      await access(dest);
      console.log(`Already exists: ${wheel.filename}`);
    } catch {
      console.log(`Downloading: ${wheel.filename}`);
      const wheelRes = await fetch(wheel.url);
      if (!wheelRes.ok) {
        console.error(`Failed to download ${wheel.filename}: ${wheelRes.status}`);
        continue;
      }
      const buffer = Buffer.from(await wheelRes.arrayBuffer());
      await writeFile(dest, buffer);
      console.log(`Saved: ${dest} (${buffer.length} bytes)`);
    }

    // Inject into pyodide-lock.json so micropip resolves locally
    const normalizedName = pkg.replace(/-/g, '_');
    if (!lockData.packages[normalizedName]) {
      lockData.packages[normalizedName] = {
        name: normalizedName,
        version: version,
        file_name: wheel.filename,
        install_dir: 'site',
        sha256: wheel.digests?.sha256 || '',
        package_type: 'package',
        imports: [normalizedName],
        depends: []
      };
      console.log(`Added ${normalizedName}==${version} to pyodide-lock.json`);
    }
  }

  await writeFile(lockPath, JSON.stringify(lockData, null, 2));
  console.log('Updated pyodide-lock.json with PyPI packages');
}

// Main execution
(async () => {
  initNetworkProxyFromEnv();

  // Skip entire process if static/pyodide already exists and is complete
  if (await checkPyodideDirectory()) {
    return;
  }

  await downloadPackages();
  await copyPyodide();
  await downloadPyPIWheels();
})();
