# 🔥 MIGRATION SCRIPT: JavaScript to TypeScript (Windows PowerShell)
# Este script automatiza la migración de archivos JS/JSX a TS/TSX

Write-Host "🚀 Iniciando migración TypeScript..." -ForegroundColor Green

# Función para migrar un archivo
function Migrate-File {
    param(
        [string]$SrcFile,
        [string]$DestFile
    )
    
    if (Test-Path $SrcFile) {
        Write-Host "📦 Migrando: $SrcFile → $DestFile" -ForegroundColor Cyan
        
        # Crear backup
        Copy-Item $SrcFile "$SrcFile.backup" -Force
        
        # Copiar y renombrar
        Copy-Item $SrcFile $DestFile -Force
        
        Write-Host "✅ Migrado: $DestFile" -ForegroundColor Green
    } else {
        Write-Host "❌ No encontrado: $SrcFile" -ForegroundColor Red
    }
}

# Migrar archivos críticos
Write-Host "🎯 Migrando componentes de trading..." -ForegroundColor Yellow

Migrate-File "src\components\trading\ChartPanel.jsx" "src\components\trading\ChartPanel.tsx"
Migrate-File "src\components\trading\SimpleChart.jsx" "src\components\trading\SimpleChart.tsx"
Migrate-File "src\components\trading\AdvancedChartPanel.jsx" "src\components\trading\AdvancedChartPanel.tsx"
Migrate-File "src\components\TradingViewChart.jsx" "src\components\TradingViewChart.tsx"

Write-Host "🏪 Migrando stores..." -ForegroundColor Yellow
Migrate-File "src\stores\marketStore.js" "src\stores\marketStore.ts"

Write-Host "🪝 Migrando hooks..." -ForegroundColor Yellow
Migrate-File "src\hooks\useCandlestickData.js" "src\hooks\useCandlestickData.ts"
Migrate-File "src\hooks\useAdvancedMarketData.js" "src\hooks\useAdvancedMarketData.ts"

Write-Host "📄 Migrando páginas..." -ForegroundColor Yellow
Migrate-File "src\pages\TradingDashboard.jsx" "src\pages\TradingDashboard.tsx"
Migrate-File "src\pages\HyperRealisticTradingDashboard.jsx" "src\pages\HyperRealisticTradingDashboard.tsx"

Write-Host "🔧 Creando archivos de configuración TypeScript..." -ForegroundColor Yellow

# Crear tsconfig.json mejorado
$tsconfigContent = @'
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
'@

Set-Content -Path "tsconfig.json" -Value $tsconfigContent

# Crear directorio de tipos
New-Item -ItemType Directory -Force -Path "src\types"

# Crear types de trading
$tradingTypesContent = @'
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
'@

Set-Content -Path "src\types\trading.ts" -Value $tradingTypesContent

# Crear constantes de trading
New-Item -ItemType Directory -Force -Path "src\constants"

$tradingConstantsContent = @'
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
'@

Set-Content -Path "src\constants\trading.ts" -Value $tradingConstantsContent

# Crear directorio de tests
New-Item -ItemType Directory -Force -Path "src\test"

# Crear configuración de Vitest
$vitestConfigContent = @'
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
'@

Set-Content -Path "vitest.config.ts" -Value $vitestConfigContent

# Crear setup de tests
$testSetupContent = @'
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
'@

Set-Content -Path "src\test\setup.ts" -Value $testSetupContent

Write-Host "🎉 Migración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Instalar dependencias de TypeScript:" -ForegroundColor White
Write-Host "   npm install --save-dev typescript @types/react @types/react-dom" -ForegroundColor Gray
Write-Host "2. Instalar dependencias de testing:" -ForegroundColor White
Write-Host "   npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom" -ForegroundColor Gray
Write-Host "3. Ejecutar type-check:" -ForegroundColor White
Write-Host "   npx tsc --noEmit" -ForegroundColor Gray
Write-Host "4. Ejecutar tests:" -ForegroundColor White
Write-Host "   npm run test" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Los archivos originales han sido respaldados con extensión .backup" -ForegroundColor Yellow
Write-Host "🔥 ¡NO MÁS DATOS FALSOS! Solo real-time data de ahora en adelante." -ForegroundColor Red
