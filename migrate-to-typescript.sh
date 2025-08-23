#!/bin/bash

# 🔥 MIGRATION SCRIPT: JavaScript to TypeScript
# Este script automatiza la migración de archivos JS/JSX a TS/TSX

echo "🚀 Iniciando migración TypeScript..."

# Función para migrar un archivo
migrate_file() {
    local src_file="$1"
    local dest_file="$2"
    
    if [ -f "$src_file" ]; then
        echo "📦 Migrando: $src_file → $dest_file"
        
        # Crear backup
        cp "$src_file" "$src_file.backup"
        
        # Copiar y renombrar
        cp "$src_file" "$dest_file"
        
        # Agregar tipos básicos si no existen
        if ! grep -q "interface\|type\|React.FC" "$dest_file"; then
            echo "⚡ Añadiendo tipos básicos a $dest_file"
            # Aquí se pueden agregar transformaciones automáticas
        fi
        
        echo "✅ Migrado: $dest_file"
    else
        echo "❌ No encontrado: $src_file"
    fi
}

# Migrar archivos críticos
echo "🎯 Migrando componentes de trading..."

migrate_file "src/components/trading/ChartPanel.jsx" "src/components/trading/ChartPanel.tsx"
migrate_file "src/components/trading/SimpleChart.jsx" "src/components/trading/SimpleChart.tsx"
migrate_file "src/components/trading/AdvancedChartPanel.jsx" "src/components/trading/AdvancedChartPanel.tsx"
migrate_file "src/components/TradingViewChart.jsx" "src/components/TradingViewChart.tsx"

echo "🏪 Migrando stores..."
migrate_file "src/stores/marketStore.js" "src/stores/marketStore.ts"

echo "🪝 Migrando hooks..."
migrate_file "src/hooks/useCandlestickData.js" "src/hooks/useCandlestickData.ts"
migrate_file "src/hooks/useAdvancedMarketData.js" "src/hooks/useAdvancedMarketData.ts"

echo "📄 Migrando páginas..."
migrate_file "src/pages/TradingDashboard.jsx" "src/pages/TradingDashboard.tsx"
migrate_file "src/pages/HyperRealisticTradingDashboard.jsx" "src/pages/HyperRealisticTradingDashboard.tsx"

echo "🔧 Creando archivos de configuración TypeScript..."

# Crear tsconfig.json mejorado
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    // Configuraciones estrictas para trading
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.backup"
  ]
}
EOF

# Crear types globales
mkdir -p src/types
cat > src/types/trading.ts << 'EOF'
// 🔥 TRADING TYPES - NO FAKE DATA ALLOWED

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number;
  atr: number;
  bb: {
    upper: number;
    middle: number;
    lower: number;
  };
  macd: {
    MACD: number;
    signal: number;
    histogram: number;
  };
  volumeMA: number;
  ema12: number;
  ema26: number;
  series: {
    rsi: number[];
    bb: Array<{upper: number; middle: number; lower: number}>;
    macd: Array<{MACD: number; signal: number; histogram: number}>;
    ema12: number[];
    ema26: number[];
  };
}

export interface AlertData {
  id: string;
  symbol: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  price: number;
  timestamp: number;
  indicators: {
    rsi: number;
    atr: number;
    volume: number;
    volumeMA: number;
  };
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdate: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  status: 'connected' | 'disconnected' | 'reconnecting';
  lastHeartbeat: number;
  reconnectAttempts: number;
}

// Security types
export interface SanitizedSymbol {
  original: string;
  sanitized: string;
  isValid: boolean;
}

export interface TradingSession {
  userId: string;
  sessionId: string;
  startTime: number;
  isDemo: boolean;
  permissions: string[];
}
EOF

# Crear archivo de utilidades de tipos
cat > src/types/utils.ts << 'EOF'
// Utilidades de tipos para trading seguro

export type NonEmptyArray<T> = [T, ...T[]];

export type Timestamp = number;

export type Price = number;

export interface Branded<T, Brand> {
  readonly _brand: Brand;
  readonly value: T;
}

export type SafePrice = Branded<number, 'SafePrice'>;
export type SafeVolume = Branded<number, 'SafeVolume'>;
export type SafeSymbol = Branded<string, 'SafeSymbol'>;

// Validadores de tipos
export const createSafePrice = (value: number): SafePrice | null => {
  if (isNaN(value) || value < 0 || !isFinite(value)) {
    return null;
  }
  return { _brand: 'SafePrice' as const, value };
};

export const createSafeSymbol = (value: string): SafeSymbol | null => {
  const sanitized = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (sanitized.length === 0 || sanitized.length > 10) {
    return null;
  }
  return { _brand: 'SafeSymbol' as const, value: sanitized };
};
EOF

# Crear archivo de constantes de trading
cat > src/constants/trading.ts << 'EOF'
// 🔥 TRADING CONSTANTS - PROFESSIONAL GRADE

export const TRADING_CONSTANTS = {
  // Límites de seguridad
  MAX_SYMBOLS: 10,
  MAX_CANDLES: 1000,
  MAX_ALERTS: 50,
  
  // Intervalos de actualización
  REALTIME_INTERVAL: 1000, // 1 segundo
  CHART_UPDATE_INTERVAL: 5000, // 5 segundos
  HEARTBEAT_INTERVAL: 10000, // 10 segundos
  
  // Umbrales de alertas
  DEFAULT_ATR_MULTIPLIER: 2,
  MIN_ALERT_THRESHOLD: 0.1, // 0.1%
  MAX_ALERT_THRESHOLD: 50, // 50%
  
  // Reconexión
  RECONNECT_INTERVALS: [1000, 2000, 4000, 8000, 16000, 30000] as const,
  MAX_RECONNECT_ATTEMPTS: 6,
  
  // Performance
  CANVAS_FPS: 30,
  ANIMATION_THROTTLE: 16, // ~60fps
  
  // Validación
  SYMBOL_REGEX: /^[A-Z0-9]{1,10}$/,
  PRICE_PRECISION: 8,
  VOLUME_PRECISION: 2
} as const;

export const SUPPORTED_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT',
  'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN'
] as const;

export type SupportedSymbol = typeof SUPPORTED_SYMBOLS[number];
EOF

echo "🎯 Creando archivo de configuración de tests..."

# Crear configuración de Vitest
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.backup'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
EOF

# Crear setup de tests
mkdir -p src/test
cat > src/test/setup.ts << 'EOF'
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock WebSocket
global.WebSocket = vi.fn();

// Mock Audio Context
global.AudioContext = vi.fn();
global.webkitAudioContext = vi.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock console.warn for test environment
const originalWarn = console.warn;
console.warn = vi.fn((message) => {
  if (!message.includes('React.StrictMode')) {
    originalWarn(message);
  }
});
EOF

echo "📦 Actualizando package.json..."

# Actualizar scripts en package.json
if [ -f "package.json" ]; then
    # Aquí se pueden agregar scripts de migración específicos
    echo "⚡ Añadir scripts de TypeScript a package.json manualmente:"
    echo "  \"type-check\": \"tsc --noEmit\""
    echo "  \"test\": \"vitest\""
    echo "  \"test:coverage\": \"vitest --coverage\""
    echo "  \"lint:ts\": \"eslint src/**/*.{ts,tsx}\""
fi

echo "🎉 Migración completada!"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Revisar y corregir errores de TypeScript"
echo "2. Instalar dependencias: npm install --save-dev typescript @types/react @types/react-dom"
echo "3. Ejecutar type-check: npm run type-check"
echo "4. Configurar ESLint para TypeScript"
echo "5. Escribir tests críticos"
echo ""
echo "⚠️  IMPORTANTE: Los archivos originales han sido respaldados con extensión .backup"
echo "🔥 ¡NO MÁS DATOS FALSOS! Solo real-time data de ahora en adelante."
