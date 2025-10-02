import { ImageResponse } from 'next/og';

export async function generateOGCard(
  originalUrl: string,
  restoredUrl: string
): Promise<Response> {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#0a0a0a',
        }}
      >
        <img
          src={originalUrl}
          alt="Before"
          style={{ width: '50%', objectFit: 'cover' }}
        />
        <img
          src={restoredUrl}
          alt="After"
          style={{ width: '50%', objectFit: 'cover' }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
