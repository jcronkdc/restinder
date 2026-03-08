import jwt from 'jsonwebtoken';

export function generateDoorDashJWT() {
  const developerId = process.env.DOORDASH_DEVELOPER_ID;
  const keyId = process.env.DOORDASH_KEY_ID;
  const signingSecret = process.env.DOORDASH_SIGNING_SECRET;

  if (!developerId || !keyId || !signingSecret) {
    throw new Error(
      'Missing DoorDash credentials. Set DOORDASH_DEVELOPER_ID, DOORDASH_KEY_ID, and DOORDASH_SIGNING_SECRET in .env'
    );
  }

  const data = {
    aud: 'doordash',
    iss: developerId,
    kid: keyId,
    exp: Math.floor(Date.now() / 1000 + 300),
    iat: Math.floor(Date.now() / 1000),
  };

  const headers = {
    algorithm: 'HS256',
    header: { 'dd-ver': 'DD-JWT-V1' },
  };

  const token = jwt.sign(
    data,
    Buffer.from(signingSecret, 'base64'),
    headers,
  );

  return token;
}
