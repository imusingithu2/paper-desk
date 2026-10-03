import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Candle } from '../core/types';

export function Chart({ candles }: { candles: Candle[] }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#000000' },
        textColor: '#A1A1AA',
      },
      grid: {
        vertLines: { color: '#0B0B0F' },
        horzLines: { color: '#0B0B0F' },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '#0B0B0F' },
      timeScale: { borderColor: '#0B0B0F', timeVisible: true, secondsVisible: false },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    const series = chart.addCandlestickSeries({
      upColor: '#22C55E',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#22C55E',
      wickDownColor: '#EF4444',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

    const data = candles.map(c => ({
      time: (c.time / 1000) as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }));

    seriesRef.current.setData(data);
  }, [candles]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '300px' }} />;
}
