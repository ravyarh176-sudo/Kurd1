#!/bin/bash
# Cloudflare Pages runs this during every deploy.
# It reads the environment variables you set in the Cloudflare dashboard
# (Settings -> Environment variables) and writes them into config.js,
# so the real Supabase URL/key are never stored in the GitHub repo itself.

cat > config.js << EOF
window.SUPABASE_URL = "${SUPABASE_URL}";
window.SUPABASE_ANON_KEY = "${SUPABASE_ANON_KEY}";
EOF

echo "config.js generated."
