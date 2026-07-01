import { useState } from 'react';
import logoImage from '../assets/ohmy_Logo-Green.svg';

export function Navbar() {
  const [dateStr] = useState(() =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year:    'numeric',
      month:   'long',
      day:     'numeric',
    })
  );

  return (
    <nav style={{ width: '100%', backgroundColor: '#FFFFFF', position: 'sticky', top: 0, zIndex: 100 }}>
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '15px 32px',
          flexWrap:       'wrap',
          gap:            '10px',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* oh my logo */}
          <img
            src={logoImage}
            alt="oh my Logo"
            style={{
              height:     20,
              width:      'auto',
              display:    'block',
              objectFit:  'contain',
              flexShrink: 0,
            }}
          />

          {/* Vertical divider */}
          <div
            style={{
              width:           1,
              height:          32,
              backgroundColor: '#D0DFF0',
              flexShrink:      0,
            }}
          />

          {/* Home emoji badge */}
          <div
            style={{
              width:           40,
              height:          40,
              backgroundColor: '#dadada',
              borderRadius:    9,
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              fontSize:        22,
              flexShrink:      0,
            }}
          >
            🏠
          </div>

          {/* App title */}
          <span
            style={{
              fontFamily: 'Barlow, sans-serif',
              fontWeight: 700,
              fontSize:   20,
              color:      '#005130',
            }}
          >
            Home Office Tracker
          </span>
        </div>

        {/* Date */}
        <span
          style={{
            fontFamily: 'Barlow, sans-serif',
            fontWeight: 500,
            fontSize:   14,
            color:      '#64a357',
          }}
        >
          {dateStr}
        </span>
      </div>

      {/* Gradient bar */}
      <div
        style={{
          height:     '6px',
          background: 'linear-gradient(to right, #64a357 0%, #64a357 15%, #005130 85%, #005130 100%)',
          width:      '100%',
        }}
      />
    </nav>
  );
}