<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script context="module">
  import { activeWeatherElementIndex } from '$lib/stores';
  import { writable } from 'svelte/store';
  export let weatherChart = writable(null);
</script>

<script>
  import {
    weatherParametersData,
    units,
    weather,
    weatherParametersInView,
  } from '$lib/stores';
  import {
    CategoryScale,
    Chart,
    Filler,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    LogarithmicScale,
    PointElement,
    RadialLinearScale,
    TimeScale,
    TimeSeriesScale,
    Title,
    Tooltip,
  } from 'chart.js';
  import { onMount } from 'svelte';

  Chart.register(
    LineElement,
    PointElement,
    LineController,
    CategoryScale,
    LinearScale,
    LogarithmicScale,
    RadialLinearScale,
    TimeScale,
    TimeSeriesScale,
    Filler,
    Legend,
    Title,
    Tooltip,
  );

  let dataSets;

  onMount(() => {
    dataSets = [
      {
        label: 'High Temperature',
        id: 'tmax',
        data: weatherParametersData.tmax,
        borderColor: '#f8717170',
        pointHoverBorderColor: '#f8717120',
        pointBorderColor: '#f87171',
        pointHoverBackgroundColor: '#f87171',
        yAxisID: 'y',
        type: 'line',
      },
      {
        label: 'Average Temperature',
        id: 'tavg',
        data: weatherParametersData.tavg,
        borderColor: '#a3a3a370',
        pointHoverBorderColor: '#a3a3a320',
        pointBorderColor: '#a3a3a3',
        pointHoverBackgroundColor: '#a3a3a3',
        yAxisID: 'y',
        type: 'line',
      },
      {
        label: 'Low Temperature',
        id: 'tmin',
        data: weatherParametersData.tmin,
        borderColor: '#38bdf870',
        pointHoverBorderColor: '#38bdf820',
        pointBorderColor: '#38bdf8',
        pointHoverBackgroundColor: '#38bdf8',
        yAxisID: 'y',
        type: 'line',
      },
      {
        label: 'Rain',
        id: 'prcp',
        data: weatherParametersData.prcp,
        borderColor: '#818cf870',
        pointHoverBorderColor: '#818cf820',
        pointBorderColor: '#818cf8',
        pointHoverBackgroundColor: '#818cf8',
        yAxisID: 'y2',
        type: 'line',
        // hidden: true
      },
      {
        label: 'Snow',
        id: 'snow',
        data: weatherParametersData.snow,
        borderColor: '#94a3b870',
        pointHoverBorderColor: '#94a3b820',
        pointBorderColor: '#94a3b8',
        pointHoverBackgroundColor: '#94a3b8',
        yAxisID: 'y2',
        type: 'line',
        // hidden: true
      },
      {
        label: 'Daytime',
        id: 'dayt',
        data: weatherParametersData.dayt,
        fill: {
          target: 'origin',
          above: 'rgba(255, 203, 71, 0.03)', // Why above and not below?
        },
        borderColor: '#facc1570',
        pointHoverBorderColor: '#facc1520',
        pointBorderColor: '#facc15',
        pointHoverBackgroundColor: '#facc15',
        yAxisID: 'y2',
      },
    ];

    const events = ($weatherChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: dataSets,
      },
      options: {
        elements: {
          line: {
            tension: 0,
          },
          point: {
            pointRadius: 1,
            pointHitRadius: 15,
            borderWidth: 1,
            fill: false,
            pointHoverRadius: 6,
            hoverBorderWidth: 25,
          },
        },
        // events: ["click", "mousemove", "touchstart", "touchmove"],
        events: ['click', 'touchstart'],
        animation: false,
        onHover,
        plugins: {
          tooltip: {
            enabled: false,
          },
          legend: {
            display: false,
          },
        },
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 3,
        interaction: {
          position: 'nearest',
          intersect: false,
          mode: 'index',
        },
        scales: {
          x: {
            ticks: {
              color: '#94a3b8',
            },
            title: {
              color: '#94a3b8',
            },
            grid: {
              drawOnChartArea: false, // only want the grid lines for one axis to show up
            },
          },
          y: {
            type: 'linear',
            position: 'left',
            // display: false,
            grid: {
              drawOnChartArea: true, // only want the grid lines for one axis to show up
              color: '#94a3b8',
            },
            title: {
              text:
                units.value === 'metric'
                  ? 'Degrees Celsius'
                  : 'Degrees Fahrenheit',
              display: true,
              color: '#94a3b8',
            },
            ticks: {
              color: '#94a3b8',
            },
          },
          y2: {
            type: 'linear',
            position: 'right',
            // display: false,
            beginAtZero: true,
            grid: {
              drawOnChartArea: false, // only want the grid lines for one axis to show up
            },
            title: {
              text:
                units.value === 'metric'
                  ? 'Millimeters / Minutes'
                  : 'Inches / Hours',
              display: true,
              color: '#94a3b8',
            },
            ticks: {
              color: '#94a3b8',
            },
          },
        },
      },
    }));
    setView();
  });

  const labels = weather.data?.map((day) => day.date?.toLocaleDateString());

  let ctx;

  $: if ($weatherParametersInView) setView();

  function setView() {
    if (!dataSets) return;
    dataSets?.forEach((item, index) => {
      const meta = $weatherChart.getDatasetMeta(index);
      meta.hidden = !$weatherParametersInView[item.id];
    });
    $weatherChart.update();
  }

  function onHover(e) {
    let value = $weatherChart.scales.x.getValueForPixel(e.x);
    if (value < 0) $activeWeatherElementIndex = 0;
    else if (value > weather.data?.length - 1)
      $activeWeatherElementIndex = weather.data?.length - 1;
    else $activeWeatherElementIndex = value;
  }
</script>

<div class="bg-surface-50-900-token mb-4 h-[300px]">
  <canvas id="weather-chart" bind:this={ctx}></canvas>
</div>
