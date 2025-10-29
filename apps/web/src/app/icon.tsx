import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'oklch(55% 0.25 260)', // Primary blue
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'oklch(100% 0 0)', // Pure white
          borderRadius: '20%',
          fontWeight: 'bold',
        }}
      >
        S
      </div>
    ),
    {
      ...size,
    }
  )
}
