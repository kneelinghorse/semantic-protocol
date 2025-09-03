import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';
import filesize from 'rollup-plugin-filesize';
import minifyHTML from 'rollup-plugin-minify-html-literals';

const production = !process.env.ROLLUP_WATCH;
const isCDN = process.env.BUILD === 'cdn';

const banner = `/*!
 * Semantic Protocol Web Components v2.0.0
 * (c) ${new Date().getFullYear()} Semantic Protocol Contributors
 * Released under the MIT License
 */`;

// Base configuration
const baseConfig = {
  input: 'src/index.ts',
  external: isCDN ? [] : ['@kneelinghorse/semantic-protocol'],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: !isCDN,
      declarationDir: !isCDN ? './dist' : undefined,
    }),
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    production && minifyHTML(),
    production && filesize(),
  ],
};

// ESM bundle
const esmConfig = {
  ...baseConfig,
  output: {
    file: 'dist/semantic-components.esm.js',
    format: 'es',
    banner,
    sourcemap: !production,
  },
  plugins: [
    ...baseConfig.plugins,
    production && terser({
      format: {
        comments: false,
      },
      compress: {
        drop_console: true,
      },
    }),
  ],
};

// CommonJS bundle
const cjsConfig = {
  ...baseConfig,
  output: {
    file: 'dist/semantic-components.js',
    format: 'cjs',
    banner,
    sourcemap: !production,
    exports: 'named',
  },
  plugins: [
    ...baseConfig.plugins,
    production && terser({
      format: {
        comments: false,
      },
    }),
  ],
};

// UMD bundle for CDN
const umdConfig = {
  ...baseConfig,
  input: 'src/index.ts',
  external: [], // Bundle everything for CDN
  output: {
    file: 'dist/semantic-components.umd.js',
    format: 'umd',
    name: 'SemanticComponents',
    banner,
    sourcemap: !production,
    globals: {
      '@kneelinghorse/semantic-protocol': 'SemanticProtocol',
    },
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
    }),
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    production && minifyHTML(),
    production && terser({
      format: {
        comments: /^!/,
      },
      compress: {
        drop_console: true,
        pure_funcs: ['console.log', 'console.debug'],
      },
    }),
    production && filesize(),
    copy({
      targets: [
        {
          src: 'dist/semantic-components.umd.js',
          dest: 'dist',
          rename: 'semantic-components.min.js',
        },
      ],
      hook: 'writeBundle',
    }),
  ],
};

// IIFE bundle for direct script inclusion
const iifeConfig = {
  ...baseConfig,
  input: 'src/index.ts',
  external: [],
  output: {
    file: 'dist/semantic-components.iife.js',
    format: 'iife',
    name: 'SemanticComponents',
    banner: banner + '\n(function() {',
    footer: '})();',
    sourcemap: !production,
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
    }),
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    production && minifyHTML(),
    production && terser({
      format: {
        comments: /^!/,
      },
      compress: {
        drop_console: true,
      },
    }),
    production && filesize(),
  ],
};

// Auto-define bundle (registers elements automatically)
const autoDefineConfig = {
  input: 'src/auto-define.ts',
  output: {
    file: 'dist/semantic-components.auto.js',
    format: 'iife',
    banner,
    sourcemap: !production,
  },
  plugins: [
    {
      name: 'auto-define-entry',
      resolveId(id) {
        if (id === 'src/auto-define.ts') {
          return id;
        }
      },
      load(id) {
        if (id === 'src/auto-define.ts') {
          return `
            import { defineElements } from './index';
            
            // Auto-initialize when script loads
            if (typeof window !== 'undefined') {
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                  defineElements();
                  console.log('✅ Semantic Web Components initialized');
                });
              } else {
                defineElements();
                console.log('✅ Semantic Web Components initialized');
              }
            }
            
            export { defineElements };
          `;
        }
      },
    },
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
    }),
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    production && minifyHTML(),
    production && terser({
      format: {
        comments: /^!/,
      },
    }),
    production && filesize(),
  ],
};

// Export configurations
const configs = [esmConfig, cjsConfig, umdConfig];

if (isCDN) {
  configs.push(iifeConfig, autoDefineConfig);
}

export default configs;