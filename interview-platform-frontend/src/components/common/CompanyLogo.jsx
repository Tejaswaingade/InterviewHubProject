import React, { useState } from 'react'
import { getCompanyBrand } from '../../utils/companyBrands'

export function CompanyLogo({
  company = null,
  name = '',
  size = 22,
  borderRadius = '6px',
  style = {},
  className = '',
}) {
  const [hasError, setHasError] = useState(false)

  // Normalize company data
  const companyObj = typeof company === 'object' && company !== null ? company : { name: name || String(company || '') }
  const brand = getCompanyBrand(companyObj)

  const displayName = brand.name || name || 'Company'
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'CO'

  const brandColor = brand.brandColor || '#3b82f6'

  return (
    <span
      className={`company-logo-badge ${className}`}
      title={displayName}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius,
        overflow: 'hidden',
        verticalAlign: 'middle',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: size > 28 ? '4px' : '2px',
        boxSizing: 'border-box',
        flexShrink: 0,
        ...style,
      }}
    >
      {brand.logo && !hasError ? (
        <img
          src={brand.logo}
          alt={`${displayName} logo`}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
          loading="lazy"
        />
      ) : (
        <span
          style={{
            fontSize: `${Math.max(10, Math.floor(size * 0.46))}px`,
            fontWeight: 800,
            color: brandColor,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            userSelect: 'none',
          }}
        >
          {initials}
        </span>
      )}
    </span>
  )
}

export default CompanyLogo
