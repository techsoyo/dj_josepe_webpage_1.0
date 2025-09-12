/** @type {import("prettier").Config} */
export default {
  // ===== CONFIGURACIÓN BÁSICA =====
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  
  // ===== INDENTACIÓN =====
  tabWidth: 2,
  useTabs: false,
  
  // ===== LONGITUD DE LÍNEA =====
  printWidth: 80,
  
  // ===== FINAL DE LÍNEA =====
  endOfLine: 'lf',
  
  // ===== ESPACIOS EN BLANCO =====
  insertPragma: false,
  requirePragma: false,
  
  // ===== CONFIGURACIÓN ESPECÍFICA POR TIPO DE ARCHIVO =====
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always',
        tabWidth: 2
      }
    },
    {
      files: '*.{css,scss,less}',
      options: {
        singleQuote: false,
        tabWidth: 2
      }
    },
    {
      files: '*.{html,vue}',
      options: {
        tabWidth: 2,
        printWidth: 100
      }
    },
    {
      files: '*.{js,jsx,ts,tsx}',
      options: {
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        bracketSpacing: true,
        bracketSameLine: false,
        arrowParens: 'always',
        printWidth: 80,
        tabWidth: 2,
        // JSX específico
        jsxSingleQuote: true,
        jsxBracketSameLine: false
      }
    },
    {
      files: '*.{yml,yaml}',
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    }
  ],
  
  // ===== PLUGINS (si están instalados) =====
  plugins: [
    'prettier-plugin-tailwindcss' // Para ordenar clases de Tailwind CSS
  ],
  
  // ===== CONFIGURACIÓN ESPECÍFICA DE TAILWIND =====
  tailwindConfig: './tailwind.config.js',
  tailwindFunctions: ['clsx', 'cn', 'cva']
};
