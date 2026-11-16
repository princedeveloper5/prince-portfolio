const crypto = require('crypto');

const enabled = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'portfolio-uploads';
const client = enabled
  ? require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

async function prepareBucket() {
  if (!client) return;
  const { data, error } = await client.storage.getBucket(bucket);
  if (!error && data) return;
  const result = await client.storage.createBucket(bucket, { public: true, fileSizeLimit: 10 * 1024 * 1024 });
  if (result.error && !/already exists/i.test(result.error.message)) throw result.error;
}

async function save(file) {
  if (!client || !file?.buffer) return file?.filename;
  const key = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${file.originalname?.match(/\.[a-z0-9]{1,5}$/i)?.[0]?.toLowerCase() || '.img'}`;
  const { error } = await client.storage.from(bucket).upload(key, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });
  if (error) throw error;
  file.filename = key;
  return key;
}

function publicUrl(key) {
  if (!client || !key) return '';
  return client.storage.from(bucket).getPublicUrl(key).data.publicUrl;
}

function remove(key) {
  if (!client || !key || /^(https?:)?\/\//.test(key) || key.startsWith('/')) return;
  client.storage.from(bucket).remove([key]).catch((error) => console.error('[storage] delete failed:', error.message));
}

module.exports = { enabled, prepareBucket, save, publicUrl, remove };
