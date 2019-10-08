import {
  src,
  task,
  dest,
} from 'gulp';
import './example';

const typedoc = require('gulp-typedoc');
const exec = require('child_process').execSync;
const glob = require('glob');
import * as fs from 'fs';
import { generateDocsNavigation } from './example';

interface ExampleCode {
  name: string;
  code: string;
  path: string;
}

const SHOWCASE_KEY_WORD: string = 'Showcase';

task('generate-doc-json', generateDocJson);

task('process-type-doc', ['generate-doc-json'], processTypeDoc);

task('get-examples-code', getExamplesCode);

task('generate-navigation', generateDocsNavigation);

task('build-live-examples-app', ['generate-navigation'], buildLiveExamplesApplication);

task('copy-live-examples-app', ['build-live-examples-app'], copyLiveExamplesAppToDocsAppAssets);

task('docs', [
  'generate-doc-json',
  'process-type-doc',
  'get-examples-code',
  'generate-navigation',
  'build-live-examples-app',
  'copy-live-examples-app',
]);

function generateDocJson() {
  return src(['src/framework/**/*.tsx', '!src/framework/**/*.spec.tsx'])
    .pipe(typedoc({
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      resolveJsonModule: true,
      ignoreCompilerErrors: true,
      moduleResolution: 'node',
      jsx: 'react',
      target: 'ES6',
      module: 'commonjs',
      baseUrl: './',
      paths: {
        '@kitten/*': ['./src/framework/*'],
      },
      excludeExternals: true,
      exclude: './node_modules/**/*',
      json: './docs/docs.json',
    }));
}

function processTypeDoc() {
  return exec('prsr -g typedoc -f react -i docs/docs.json -o docs/src/input.json');
}

function getExamplesCode() {
  glob('src/playground/src/ui/screen/documentationExamples/**/*.tsx', (error, filePaths) => {
    if (!error) {
      const examples: ExampleCode[] = filePaths.map((path: string) => {
        const code: string = fs.readFileSync(path, 'utf8');
        const name: string = code
          .split(' ')
          .filter((item: string) => item.includes(SHOWCASE_KEY_WORD))[0]
          .replace(SHOWCASE_KEY_WORD, '');

        return { code, path, name };
      });

      fs.writeFileSync('./docs/src/examples.json', JSON.stringify(examples, null, 2));
    }
  });
}

function buildLiveExamplesApplication() {
  return exec('npm run docs:examples:build');
}

function copyLiveExamplesAppToDocsAppAssets() {
  return src(['src/playground/web-build/**/*'])
    .pipe(dest('docs/src/assets/examples-build'));
}
