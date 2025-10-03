import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.REPLICATE_API_TOKEN;
  
  return NextResponse.json({
    token_exists: !!token,
    token_length: token?.length || 0,
    token_preview: token ? `${token.substring(0, 6)}...${token.substring(token.length - 4)}` : 'NOT_SET',
    has_newline: token?.includes('\n') || false,
    trimmed_length: token?.trim().length || 0,
    env_keys: Object.keys(process.env).filter(k => k.includes('REPLICATE')),
  });
}

