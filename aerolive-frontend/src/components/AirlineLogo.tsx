import { useState } from 'react'

interface Props {
  code?: string | null
  name?: string | null
  size?: number
}

export function AirlineLogo({ code, name, size = 24 }: Props) {
  const [errored, setErrored] = useState(false)
  if (!code) return null

  const upper = code.toUpperCase()
  if (errored) {
    return (
      <span className="airline-badge" style={{ width: size, height: size, lineHeight: `${size}px`, fontSize: size * 0.45 }}>
        {upper}
      </span>
    )
  }

  return (
    <img
      src={`/logos/${upper}.png`}
      alt={name ?? upper}
      title={name ?? upper}
      width={size}
      height={size}
      style={{ objectFit: 'contain', verticalAlign: 'middle' }}
      onError={() => setErrored(true)}
    />
  )
}
