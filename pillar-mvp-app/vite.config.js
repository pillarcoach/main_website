import { defineConfig, loadEnv } from 'vite';
import fs from 'fs';
import path from 'path';

const certPath = path.resolve(__dirname, 'cert.pem');
const keyPath  = path.resolve(__dirname, 'key.pem');
const hasCustomCerts  = fs.existsSync(certPath) && fs.existsSync(keyPath);
const shouldUseHttps  = process.env.VITE_HTTPS === 'true' || hasCustomCerts;

// Vite plugin: serves /api/tts locally by proxying directly to ElevenLabs
function localApiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { text } = JSON.parse(body || '{}');
            if (!text) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'text is required' }));
              return;
            }

            const apiKey  = process.env.ELEVENLABS_API_KEY;
            const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

            const upstream = await fetch(
              `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
              {
                method: 'POST',
                headers: {
                  'xi-api-key': apiKey,
                  'Content-Type': 'application/json',
                  'Accept': 'audio/mpeg',
                },
                body: JSON.stringify({
                  text,
                  model_id: 'eleven_turbo_v2',
                  voice_settings: { stability: 0.5, similarity_boost: 0.75 },
                }),
              }
            );

            if (!upstream.ok) {
              const err = await upstream.text();
              res.statusCode = upstream.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err }));
              return;
            }

            const arrayBuffer = await upstream.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ audioContent: base64, audioEncoding: 'mp3' }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load .env.local so the local API plugin can read ELEVENLABS_* keys
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
  base: '/',
  plugins: [localApiPlugin()],
  build: {
    rollupOptions: {
      input: {
        main:             path.resolve(__dirname, 'index.html'),
        coach:            path.resolve(__dirname, 'coach.html'),
        'coach-stream':   path.resolve(__dirname, 'coach-stream.html'),
        'coach-feedback': path.resolve(__dirname, 'coach-feedback.html'),
        client:           path.resolve(__dirname, 'client.html'),
        'client-workout': path.resolve(__dirname, 'client-workout.html'),
        'client-session': path.resolve(__dirname, 'client-session.html'),
        summary:          path.resolve(__dirname, 'summary.html'),
      },
    },
    assetsDir: 'assets',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    https: shouldUseHttps
      ? (hasCustomCerts
          ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
          : true)
      : false,
  },
  }; // end return
}); // end defineConfig
