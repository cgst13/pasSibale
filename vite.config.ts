import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import tsconfigPaths from 'vite-tsconfig-paths';
import compileSCSS from './compile-scss';
import os from 'os';

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

export default ({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, process.cwd(), '');
  process.env = { ...process.env, ...env };

  // Set default port if not specified
  const port = parseInt(env.VITE_PORT || '5001', 10);
  const localIp = getLocalIp();

  return defineConfig({
    base: '/',
    define: {
      '__LOCAL_IP__': JSON.stringify(localIp)
    },
    plugins: [
      tsconfigPaths(), 
      react(), 
      compileSCSS(),
      basicSsl() // Generates self-signed cert for HTTPS
    ],
    build: {
      rollupOptions: {
        external: ['perf_hooks'],
        onwarn(warning, warn) {
          if (warning.code === 'EVAL') return;
          warn(warning);
        }
      }
    },
    preview: {
      port: port + 1 // Use a different port for preview
    },
    server: {
      host: '0.0.0.0',
      port: port
    }
  });
};
