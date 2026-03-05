import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// 1. A dummy database of "paying" AI Agents for our prototype
const VALID_AGENTS = {
  'agent_alpha_123': 'secret_password_456' // e.g., Perplexity or a Fintech Bot
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_id, client_secret } = body;

    // 2. Authenticate the Agent
    if (!client_id || !client_secret || VALID_AGENTS[client_id as keyof typeof VALID_AGENTS] !== client_secret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid client credentials' }, { status: 401 });
    }

    // 3. Prepare the Cryptographic Secret from our .env.local
    const secretKey = process.env.AGENT_JWT_SECRET;
    if (!secretKey) throw new Error("Missing AGENT_JWT_SECRET");
    const secret = new TextEncoder().encode(secretKey);

    // 4. Mint the JWT (Strictly following the Architect's 10-minute rule)
    const jwt = await new SignJWT({ 
      scope: 'feed:financial_schedule',
      plan: 'pro' 
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer('urn:whenisdue:issuer')
      .setSubject(client_id)
      .setAudience('urn:whenisdue:api')
      .setIssuedAt()
      .setExpirationTime('10m') // Dies in exactly 10 minutes
      .setJti(crypto.randomUUID()) // Unique ID to prevent replay attacks
      .sign(secret);

    // 5. Hand the temporary token back to the AI Agent
    return NextResponse.json({
      access_token: jwt,
      token_type: 'Bearer',
      expires_in: 600 // 600 seconds = 10 minutes
    }, { status: 200 });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}