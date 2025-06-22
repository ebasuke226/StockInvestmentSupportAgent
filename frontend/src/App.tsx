// frontend/src/App.tsx
import React from 'react';
import { Home } from './pages/Home';  // ← Home.tsx が named export の場合

// もし default export にしたいなら
// import Home from './pages/Home';

export function App() {
  return <Home />;
}

export default App;
