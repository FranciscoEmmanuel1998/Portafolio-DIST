// Professional Trading Types System
export interface MarketCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
}

export interface TechnicalIndicators {
  rsi: number[];
  macd: {
    MACD: number[];
    signal: number[];
    histogram: number[];
  };
  ema20: number[];
  ema50: number[];
  sma200: number[];
  atr: number[];
  bb: {
    upper: number[];
    middle: number[];
    lower: number[];
  };
  volumeMA: number[];
}

export interface AlertRule {
  id: string;
  type: AlertType;
  symbol: string;
  condition: (candle: MarketCandle, indicators: TechnicalIndicators, context: MarketContext) => boolean;
  severity: AlertSeverity;
  message: (symbol: string, candle: MarketCandle, indicators?: TechnicalIndicators) => string;
  enabled: boolean;
  lastTriggered?: number;
  cooldownMs: number;
}

export interface Alert {
  id: string;
  type: AlertType;
  symbol: string;
  message: string;
  severity: AlertSeverity;
  timestamp: number;
  price: number;
  volume?: number;
  technicalData?: Partial<TechnicalIndicators>;
  dismissed: boolean;
  isRead: boolean;
  currentValue?: string;
  threshold?: string;
}

export interface MarketContext {
  marketHours: boolean;
  session: 'pre' | 'regular' | 'after' | 'closed';
  averageVolume: number;
  volatility: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export interface WebSocketMessage {
  type: 'price' | 'volume' | 'candle' | 'alert' | 'technical';
  symbol: string;
  data: any;
  timestamp: number;
}

export interface SymbolData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  marketCap?: number;
  rsi?: number;
  macd?: {
    value: number;
    signal: number;
    histogram: number;
  };
  lastUpdate: number;
}

export type AlertType = 
  | 'breakout' 
  | 'breakdown' 
  | 'volume_spike' 
  | 'rsi_overbought' 
  | 'rsi_oversold' 
  | 'macd_bullish_crossover'
  | 'macd_bearish_crossover'
  | 'bollinger_squeeze'
  | 'support_break'
  | 'resistance_break'
  | 'news_impact'
  | 'volatility_spike';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface ChartConfig {
  symbol: string;
  timeframe: TimeFrame;
  indicators: string[];
  overlays: string[];
  theme: 'dark' | 'light';
  autoScale: boolean;
}

export interface BacktestResult {
  symbol: string;
  strategy: string;
  startDate: Date;
  endDate: Date;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
}

export interface MarketStoreState {
  // Data
  candles: Record<string, MarketCandle[]>;
  indicators: Record<string, TechnicalIndicators>;
  symbols: SymbolData[];
  alerts: Alert[];
  alertRules: AlertRule[];
  
  // UI State  
  selectedSymbol: string;
  timeframe: TimeFrame;
  audioEnabled: boolean;
  theme: 'dark' | 'light';
  isConnected: boolean;
  
  // Market Context
  marketSession: 'pre' | 'regular' | 'after' | 'closed';
  marketHours: boolean;
  
  // Actions
  addCandle: (symbol: string, candle: MarketCandle) => void;
  updateIndicators: (symbol: string, indicators: Partial<TechnicalIndicators>) => void;
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
  dismissAlert: (alertId: string) => void;
  markAlertAsRead: (alertId: string) => void;
  clearAlerts: () => void;
  toggleAudio: () => void;
  setSelectedSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: TimeFrame) => void;
  
  // Internal methods
  calculateIndicators: (candles: MarketCandle[]) => Partial<TechnicalIndicators>;
  checkAlertConditions: (symbol: string, candle: MarketCandle) => void;
  playAlertSound: (severity: AlertSeverity) => void;
  initializeWebSocket: () => void;
  forceConnection: () => void;
  
  // Computed
  getSymbolData: (symbol: string) => SymbolData | undefined;
  getLatestCandle: (symbol: string) => MarketCandle | undefined;
  getActiveAlerts: () => Alert[];
  getAlertsBySymbol: (symbol: string) => Alert[];
  getTechnicalSummary: (symbol: string) => {
    trend: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    signals: string[];
  };
}

// WebSocket Events
export interface WSEvents {
  'price-update': SymbolData;
  'candle-complete': MarketCandle;
  'alert-triggered': Alert;
  'market-status': {
    session: 'pre' | 'regular' | 'after' | 'closed';
    nextOpen?: number;
    nextClose?: number;
  };
  'technical-update': {
    symbol: string;
    indicators: Partial<TechnicalIndicators>;
  };
  'connection': {
    status: 'connected' | 'failed' | 'disconnected';
    error?: string;
    timestamp: number;
  };
}

// Error Types
export class MarketDataError extends Error {
  constructor(
    message: string,
    public code: string,
    public symbol?: string
  ) {
    super(message);
    this.name = 'MarketDataError';
  }
}

export class WebSocketError extends Error {
  constructor(
    message: string,
    public code: string,
    public reconnect: boolean = true
  ) {
    super(message);
    this.name = 'WebSocketError';
  }
}
