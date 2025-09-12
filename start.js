#!/usr/bin/env node

/**
 * DJ Josep Project - Start Script
 * ✅ Adaptado para aplicación Vite + Node.js monousuario
 * 
 * Este script facilita el inicio del proyecto en diferentes modos
 */

import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Función para imprimir con colores
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Función para mostrar el banner
const showBanner = () => {
  log('\n🎵 ================================== 🎵', 'cyan');
  log('    DJ Josep - Panel de Administración', 'bright');
  log('    Sistema Monousuario Refactorizado', 'blue');
  log('🎵 ================================== 🎵\n', 'cyan');
};

// Función para verificar si existe un archivo
const fileExists = (path) => {
  try {
    return fs.existsSync(path);
  } catch {
    return false;
  }
};

// Función para verificar dependencias
const checkDependencies = (dir, name) => {
  const packagePath = join(__dirname, dir, 'package.json');
  const nodeModulesPath = join(__dirname, dir, 'node_modules');

  if (!fileExists(packagePath)) {
    log(`❌ No se encontró package.json en ${dir}`, 'red');
    return false;
  }

  if (!fileExists(nodeModulesPath)) {
    log(`⚠️  Dependencias no instaladas en ${name}`, 'yellow');
    return false;
  }

  return true;
};

// Función para instalar dependencias
const installDependencies = (dir, name) => {
  return new Promise((resolve, reject) => {
    log(`📦 Instalando dependencias para ${name}...`, 'blue');

    const npm = spawn('npm', ['install'], {
      cwd: join(__dirname, dir),
      stdio: 'inherit',
      shell: true
    });

    npm.on('close', (code) => {
      if (code === 0) {
        log(`✅ Dependencias instaladas para ${name}`, 'green');
        resolve();
      } else {
        log(`❌ Error instalando dependencias para ${name}`, 'red');
        reject(new Error(`npm install failed with code ${code}`));
      }
    });

    npm.on('error', (error) => {
      log(`❌ Error: ${error.message}`, 'red');
      reject(error);
    });
  });
};

// Función para verificar archivos de entorno
const checkEnvFiles = () => {
  const backendEnv = join(__dirname, 'backend', '.env');
  const frontendEnv = join(__dirname, 'frontend', '.env');

  let needsSetup = false;

  if (!fileExists(backendEnv)) {
    log('⚠️  Archivo .env no encontrado en backend', 'yellow');
    log('   Copia backend/.env.example como backend/.env', 'yellow');
    needsSetup = true;
  }

  if (!fileExists(frontendEnv)) {
    log('⚠️  Archivo .env no encontrado en frontend', 'yellow');
    log('   Copia frontend/.env.example como frontend/.env', 'yellow');
    needsSetup = true;
  }

  return !needsSetup;
};

// Función para iniciar un proceso
const startProcess = (command, args, cwd, name, color = 'blue') => {
  return new Promise((resolve, reject) => {
    log(`🚀 Iniciando ${name}...`, color);

    const process = spawn(command, args, {
      cwd: join(__dirname, cwd),
      stdio: 'inherit',
      shell: true
    });

    process.on('error', (error) => {
      log(`❌ Error iniciando ${name}: ${error.message}`, 'red');
      reject(error);
    });

    // No resolvemos inmediatamente para mantener el proceso vivo
    setTimeout(() => resolve(process), 2000);
  });
};

// Función para mostrar el menú
const showMenu = () => {
  log('\n📋 Opciones disponibles:', 'bright');
  log('1. 🔧 Desarrollo completo (Frontend + Backend)', 'cyan');
  log('2. 🎨 Solo Frontend (Vite)', 'blue');
  log('3. ⚙️  Solo Backend (Node.js + Express)', 'green');
  log('4. 📊 Prisma Studio (Base de datos)', 'magenta');
  log('5. 🔄 Reinstalar dependencias', 'yellow');
  log('6. ❌ Salir', 'red');
  log('');
};

// Función para obtener entrada del usuario
const getUserInput = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

// Función principal
const main = async () => {
  try {
    showBanner();

    // Verificar estructura de proyecto
    if (!fileExists(join(__dirname, 'backend')) || !fileExists(join(__dirname, 'frontend'))) {
      log('❌ Estructura de proyecto incorrecta. Se esperan carpetas "backend" y "frontend"', 'red');
      process.exit(1);
    }

    // Verificar archivos de entorno
    if (!checkEnvFiles()) {
      log('\n⚠️  Configura los archivos de entorno antes de continuar', 'yellow');
      log('Presiona Enter para continuar...', 'blue');
      await getUserInput('');
    }

    while (true) {
      showMenu();
      const choice = await getUserInput('Selecciona una opción (1-6): ');

      switch (choice) {
        case '1':
          // Desarrollo completo
          log('\n🔧 Iniciando desarrollo completo...', 'bright');

          // Verificar dependencias
          const backendReady = checkDependencies('backend', 'Backend');
          const frontendReady = checkDependencies('frontend', 'Frontend');

          if (!backendReady) {
            await installDependencies('backend', 'Backend');
          }

          if (!frontendReady) {
            await installDependencies('frontend', 'Frontend');
          }

          // Iniciar procesos
          log('\n🚀 Iniciando servicios...', 'bright');
          await startProcess('npm', ['run', 'dev'], 'backend', 'Backend API', 'green');
          await startProcess('npm', ['run', 'dev'], 'frontend', 'Frontend Vite', 'blue');

          log('\n✅ Servicios iniciados:', 'green');
          log('   • Frontend: http://localhost:5173', 'blue');
          log('   • Backend: http://localhost:3000', 'green');
          log('\nPresiona Ctrl+C para detener los servicios', 'yellow');

          // Mantener el script vivo
          process.stdin.resume();
          return;

        case '2':
          // Solo Frontend
          if (!checkDependencies('frontend', 'Frontend')) {
            await installDependencies('frontend', 'Frontend');
          }
          await startProcess('npm', ['run', 'dev'], 'frontend', 'Frontend Vite', 'blue');
          log('\n✅ Frontend iniciado en http://localhost:5173', 'blue');
          process.stdin.resume();
          return;

        case '3':
          // Solo Backend
          if (!checkDependencies('backend', 'Backend')) {
            await installDependencies('backend', 'Backend');
          }
          await startProcess('npm', ['run', 'dev'], 'backend', 'Backend API', 'green');
          log('\n✅ Backend iniciado en http://localhost:3000', 'green');
          process.stdin.resume();
          return;

        case '4':
          // Prisma Studio
          if (!checkDependencies('backend', 'Backend')) {
            await installDependencies('backend', 'Backend');
          }
          await startProcess('npm', ['run', 'prisma:studio'], 'backend', 'Prisma Studio', 'magenta');
          log('\n✅ Prisma Studio iniciado en http://localhost:5555', 'magenta');
          process.stdin.resume();
          return;

        case '5':
          // Reinstalar dependencias
          log('\n🔄 Reinstalando dependencias...', 'yellow');
          try {
            await installDependencies('backend', 'Backend');
            await installDependencies('frontend', 'Frontend');
            log('\n✅ Dependencias reinstaladas correctamente', 'green');
          } catch (error) {
            log('\n❌ Error reinstalando dependencias', 'red');
          }
          log('\nPresiona Enter para continuar...', 'blue');
          await getUserInput('');
          break;

        case '6':
          // Salir
          log('\n👋 ¡Hasta luego!', 'cyan');
          process.exit(0);

        default:
          log('\n❌ Opción inválida. Selecciona un número del 1 al 6.', 'red');
          log('Presiona Enter para continuar...', 'blue');
          await getUserInput('');
          break;
      }
    }

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
};

// Manejo de señales para cleanup
process.on('SIGINT', () => {
  log('\n\n👋 Cerrando servicios...', 'yellow');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n\n👋 Cerrando servicios...', 'yellow');
  process.exit(0);
});

// Ejecutar función principal
main().catch((error) => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  process.exit(1);
});
