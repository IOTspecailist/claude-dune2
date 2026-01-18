'use client';

import { useState } from 'react';

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '20px',
    }}>
      <h1 style={{ fontSize: '48px', margin: 0 }}>{count}</h1>
      <button
        onClick={() => setCount(count + 1)}
        style={{
          padding: '12px 24px',
          fontSize: '18px',
          cursor: 'pointer',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#0070f3',
          color: 'white',
        }}
      >
        Click me
      </button>
    </main>
  );
}
