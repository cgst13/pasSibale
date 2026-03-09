import { Chart, TooltipModel, Plugin } from 'chart.js';
import dayjs from 'dayjs';
import { rgbaColor } from './utils';

interface GradientColorParams {
  chart: Chart;
  getThemeColor: (color: string) => string;
  growth: boolean;
}

interface TooltipContext {
  chart: Chart;
  tooltip: TooltipModel<'line'>;
}

interface TooltipData {
  date: string;
  time: string;
  value: number;
  volume: number;
}

export const getGradientColor = (
  chart: GradientColorParams['chart'],
  getThemeColor: GradientColorParams['getThemeColor'],
  growth: GradientColorParams['growth']
): CanvasGradient => {
  const {
    ctx,
    chartArea: { top, bottom }
  } = chart;

  const color = growth ? 'success' : 'danger';

  const gradientSegment = ctx.createLinearGradient(0, bottom, 0, top);
  gradientSegment.addColorStop(0, rgbaColor(getThemeColor(color), 0.0));
  gradientSegment.addColorStop(1, rgbaColor(getThemeColor(color), 0.5));

  return gradientSegment;
};

export const getOrCreateTooltip = (chart: Chart): HTMLDivElement => {
  let tooltipEl = chart.canvas.parentNode?.querySelector(
    'div.custom-tooltip'
  ) as HTMLDivElement | null;

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.classList.add('custom-tooltip', 'bg-body', 'border');
    Object.assign(tooltipEl.style, {
      borderRadius: '4px',
      opacity: '0',
      pointerEvents: 'none',
      position: 'absolute',
      transform: 'translate(-50%, 0)',
      transition: 'all .1s ease',
      padding: '14px',
      fontSize: '12px',
      minWidth: '170px',
      zIndex: '9999'
    });
    chart.canvas.parentNode?.appendChild(tooltipEl);
  }

  return tooltipEl;
};

export const externalTooltipHandler = (
  context: TooltipContext,
  data: TooltipData
): void => {
  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateTooltip(chart);

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return;
  }

  if (tooltip.body && tooltip.dataPoints.length > 0) {
    const params = tooltip.dataPoints;

    tooltipEl.innerHTML = `
      <div class="fs-9 text-body-secondary">
        <table class="mb-2 w-100">
          <tbody class="w-100">
            <tr>
              <th class="fw-bold" style="width: 71px;">Price</th>
              <th class="text-center px-2 fw-semibold">:</th>
              <th class="fw-semibold">${params[0].formattedValue} USD</th>
            </tr>
          </tbody>
        </table>
        <div class="border-top pt-2">
          <table>
              <tr>
                <th class="fw-bold" style="width: 72px;">Date</th>
                <th class="text-center px-2 fw-semibold">:</th>
                <th class="fw-semibold">${dayjs(data.date, 'YYYY/MM/DD').format(
                  'D MMM'
                )}</th>
              </tr>
              <tr>
                <th class="fw-bold" style="width: 72px;">Time</th>
                <th class="text-center px-2 fw-semibold">:</th>
                <th class="fw-semibold">${params[0].label}</th>
              </tr>
              <tr>
                <th class="fw-bold" style="width: 72px;">Time Zone</th>
                <th class="text-center px-2 fw-semibold">:</th>
                <th class="fw-semibold">UTC 4</th>
              </tr>
              <tr>
                <th class="fw-bold" style="width: 72px;">Volume</th>
                <th class="text-center px-2 fw-semibold">:</th>
                <th class="fw-semibold">${data.volume}k</th>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    const {
      offsetLeft: positionX,
      offsetTop: positionY,
      clientWidth
    } = chart.canvas;
    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;
    const tooltipX = tooltip.caretX;

    let leftPosition = positionX + tooltipX;

    if (leftPosition + tooltipWidth > clientWidth) {
      leftPosition -= tooltipWidth;
      tooltipEl.style.transform = 'translate(0, 0)';
    } else if (leftPosition < positionX + 100) {
      leftPosition = positionX + 10;
      tooltipEl.style.transform = 'translate(0, 0)';
    } else {
      tooltipEl.style.transform = 'translate(-50%, 0)';
    }

    let top = positionY + tooltip.caretY - tooltipHeight - 10;

    if (top < 0) {
      top = positionY + tooltip.caretY + 10;
    }

    tooltipEl.style.opacity = '1';
    tooltipEl.style.left = `${leftPosition}px`;
    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.font =
      tooltip.options?.bodyFont?.string || '12px sans-serif';
    tooltipEl.style.padding = `${tooltip.options?.padding || 8}px`;
  }
};

export const verticalLinePlugin = (isDark: boolean): Plugin<'line'> => ({
  id: 'verticalDottedLine',
  afterDraw: chart => {
    const tooltip = chart.tooltip;

    if (!tooltip || !tooltip.opacity || !tooltip.dataPoints.length) return;

    const ctx = chart.ctx;
    const x = tooltip.caretX;
    const topY = chart.scales.y.top;
    const bottomY = chart.scales.y.bottom;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(x, topY);
    ctx.lineTo(x, bottomY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = isDark ? '#31374a' : '#CBD0DD';
    ctx.stroke();
    ctx.restore();
  }
});

export const borderXPlugin = (isDark: boolean): Plugin<'line'> => ({
  id: 'borderEndLine',
  beforeDraw: chart => {
    const {
      ctx,
      chartArea: { top, bottom, left, right }
    } = chart;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = isDark ? 'rgba(55, 62, 83, 0.78)' : '#E3E6ED';
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(right, top);
    ctx.lineTo(right, bottom);
    ctx.lineTo(left, bottom);
    ctx.closePath();
    ctx.stroke();
  }
});
