import dayjs from 'dayjs';
import {
  CallbackDataParams,
  TooltipPositionCallbackParams
} from 'echarts/types/dist/shared';
import classNames from 'classnames';

export interface Size {
  contentSize: number[];
  viewSize: number[];
}

export const tooltipFormatterDefault = (
  params: CallbackDataParams[],
  dateFormatter = 'MMM DD',
  colorProperty: 'borderColor' | 'color' = 'borderColor'
) => {
  let tooltipItem = ``;
  params.forEach(el => {
    tooltipItem += `<div class='ms-1'>
        <h6 class="text-body-tertiary">
        <span class="d-inline-block rounded-circle me-2" style="height: 0.5rem; width: 0.5rem; background:${
          el[colorProperty] || el.color
        }"></span>
          ${el.seriesName} : ${el.value}
        </h6>
      </div>`;
  });
  return `<div>
            <p class='mb-2 text-body-tertiary'>
              ${
                dayjs(params[0].name).isValid()
                  ? dayjs(params[0].name).format(dateFormatter)
                  : params[0].name
              }
            </p>
            ${tooltipItem}
          </div>`;
};

export const tooltipFormatterList = (params: CallbackDataParams[]) => {
  const result = params.map((param, index) => {
    let label = '';
    if (dayjs(params[0].name).isValid()) {
      if (index > 0) {
        label = dayjs(params[0].name).subtract(1, 'month').format('MMM DD');
      } else {
        label = dayjs(params[0].name).format('MMM DD');
      }
    } else {
      label = params[0].name;
    }
    return {
      value: param.value,
      label,
      color: param.color
    };
  });

  let tooltipItem = ``;
  result.forEach((el, index: number) => {
    tooltipItem += `<h6 class="text-body-tertiary ${
      (result.length === 1 || index > 0) && 'mb-0'
    }"><span class="d-inline-block rounded-circle me-2" style="height: 0.5rem; width: 0.5rem; background:${
      el.color
    }"></span>
    ${el.label} : ${el.value}
  </h6>`;
  });

  return `<div class='ms-1'>
            ${tooltipItem}
          </div>`;
};

export const rtlTooltipFormatter = (
  params: CallbackDataParams,
  isRTL: boolean,
  isDark: boolean
) => {
  const ltr = `<div class=${classNames({
    'text-body-tertiary': isDark,
    'text-black': !isDark
  })}>
    ${params.marker}
    <span class="fw-semibold" style="font-size:14px; margin-left: 2px">
      ${params.name}
    </span>
    <span class="fw-black" style="float:right;margin-left:20px;font-size:14px;">${
      params.value
    }</span>
  </div>`;

  const rtl = `<div class=${classNames({
    'text-body-tertiary': isDark,
    'text-black': !isDark
  })}>
    <span class="fw-black" style="float:left;margin-right:20px;font-size:14px;">${
      params.value
    }</span>
    <span class="fw-semibold" style="font-size:14px; margin-right: 2px">
      ${params.name}
    </span>
    <span class="d-inline-block ms-1" style="border-radius: 10px; width: 10px; height: 10px; background-color:${
      params.color
    }"></span>
  </div>
  `;

  return isRTL ? rtl : ltr;
};

export const handleTooltipPosition = (
  point: number[],
  params: TooltipPositionCallbackParams,
  dom: HTMLDivElement,
  rect: null,
  size: Size
) => {
  if (window.innerWidth <= 540) {
    const tooltipHeight = dom.offsetHeight;
    const obj: { top: number; left?: number; right?: number } = {
      top: point[1] - tooltipHeight - 20
    };

    obj[point[0] < size.viewSize[0] / 2 ? 'left' : 'right'] = 5;

    return obj;
  }

  return null;
};

export const TopCouponChartTooltip = (
  point: number[],
  params: TooltipPositionCallbackParams,
  el: HTMLDivElement,
  rect: null,
  size: Size
) => {
  const obj: { top?: number; left?: number; right?: number } = {
    top: point[1] - 35
  };

  if (window.innerWidth > 540) {
    if (point[0] <= size.viewSize[0] / 2) {
      obj.left = point[0] + 20;
    } else {
      obj.left = point[0] - size.contentSize[0] - 20;
    }
  } else {
    obj[point[0] < size.viewSize[0] / 2 ? 'left' : 'right'] = 0;
  }

  return obj;
};

export const stockShareReportTooltipFormatter = params => {
  return `<div class="fs-9 text-body-secondary">
          <table class="mb-2">
            <tbody>
              <tr>
                <th class="fw-bold" style="width: 72px">Price</th>
                <th class="text-center px-2 fw-semibold">:</th>
                <th class="fw-semibold">${params[0].value[6]} USD</th>
              </tr>
            </tbody>
          </table>
          <div class="border-top pt-2">
            <table>
              <tbody>
                <tr>
                  <th class="fw-bold" style="width: 72px">Open</th>
                  <th class="text-center px-2 fw-semibold">:</th>
                  <th class="fw-semibold">${params[0].value[1]} USD</th>
                </tr>
                <tr>
                  <th class="fw-bold" style="width: 72px">Close</th>
                  <th class="text-center px-2 fw-semibold">:</th>
                  <th class="fw-semibold">${params[0].value[2]} USD</th>
                </tr>
                <tr>
                  <th class="fw-bold" style="width: 72px">High</th>
                  <th class="text-center px-2 fw-semibold">:</th>
                  <th class="fw-semibold">${params[0].value[4]} USD</th>
                </tr>
                <tr>
                  <th class="fw-bold" style="width: 72px">Low</th>
                  <th class="text-center px-2 fw-semibold">:</th>
                  <th class="fw-semibold">${params[0].value[3]} USD</th>
                </tr>
                <tr>
                  <th class="fw-bold" style="width: 72px">Volume</th>
                  <th class="text-center px-2 fw-semibold">:</th>
                  <th class="fw-semibold">${params[0].value[5]}k</th>
                </tr>
              </tbody>
            </table>
          </div>
        </div>`;
};

export const generateXAxisLabels = (startDate: string, count: number) => {
  const labels = [];
  const start = new Date(startDate);

  Array.from({ length: count }).map((_, i) =>
    labels.push(
      dayjs(start)
        .add(i + 1, 'day')
        .format('DD MMM')
    )
  );
};

export const taskPerformanceTooltipFormatter = (
  params: CallbackDataParams,
  range: 'week' | 'month' | 'year'
) => {
  if (!params || !params.value) return '';
  
  let dateFormat = '';
  if (range.toLowerCase() === 'week') {
    dateFormat += `<p class="text-white fs-10 fw-bold mb-1">
    ${params.value[0]}, ${dayjs(params.value[2]).format('DD MMM, YYYY')}
    </p>`;
  } else if (range.toLowerCase() === 'month') {
    dateFormat += `<p class="text-white fs-10 fw-bold mb-1">
     ${dayjs(params.value[0]).format('DD MMM, YYYY')}
    </p>`;
  } else {
    dateFormat += `<p class="text-white fs-10 fw-bold mb-1">
     ${dayjs(params.value[0]).format('MMM, YYYY')}
    </p>`;
  }
  return `
    <div style="min-width: 140px;">
      ${dateFormat}
      <table class="mb-0 w-100" style="vertical-align: middle;">
        <tr>
          <td style="width: 16px;">
            <div style="width: 10px; height: 10px; background-color: ${params.color} "></div>
          </td>
          <td style="min-width: 78px">
            <h6 class="text-white mb-0">${params.seriesName}</h6>
          </td>
          <td style="min-width: 16px;">
            <h6 class="text-white mb-0">${params.value[1]}</h6>
          </td>
        </tr>
      </table>
    </div>
  `;
};
