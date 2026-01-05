import { ImageResponse } from 'next/og';

/**
 * Generate OG card for social sharing
 * Creates a branded before/after comparison image
 *
 * Features:
 * - Side-by-side before/after comparison
 * - "Before" and "After" labels
 * - Gradient divider between images
 * - "Restored with RetroPhoto" branding
 * - Optimized 1200x630 for social platforms
 */
export async function generateOGCard(
  originalUrl: string,
  restoredUrl: string
): Promise<Response> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://retrophotoai.com';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#0a0a0a',
          position: 'relative',
        }}
      >
        {/* Main image comparison area */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '560px',
            position: 'relative',
          }}
        >
          {/* Before image with label */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '50%',
              height: '100%',
              position: 'relative',
            }}
          >
            <img
              src={originalUrl}
              alt="Before"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Before label */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '20px',
                fontWeight: 'bold',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              Before
            </div>
          </div>

          {/* Gradient divider */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '0',
              width: '4px',
              height: '100%',
              background: 'linear-gradient(180deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
              transform: 'translateX(-50%)',
              zIndex: 10,
            }}
          />

          {/* After image with label */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '50%',
              height: '100%',
              position: 'relative',
            }}
          >
            <img
              src={restoredUrl}
              alt="After"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* After label */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: 'rgba(99, 102, 241, 0.9)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '20px',
                fontWeight: 'bold',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              After
            </div>
          </div>
        </div>

        {/* Branding footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '70px',
            background: 'linear-gradient(90deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
            gap: '12px',
          }}
        >
          {/* Logo icon (camera emoji placeholder - would use actual logo in production) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              backgroundColor: '#6366f1',
              borderRadius: '8px',
              fontSize: '24px',
            }}
          >
            📷
          </div>
          {/* Brand text */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <span
              style={{
                color: '#ffffff',
                fontSize: '22px',
                fontWeight: 'bold',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              Restored with RetroPhoto
            </span>
            <span
              style={{
                color: '#a1a1aa',
                fontSize: '14px',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {baseUrl.replace('https://', '')}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
