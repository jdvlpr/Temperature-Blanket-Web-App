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

<script module>
  import { browser } from '$app/environment';
  import { project, weather } from '$lib/state';
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

  let ctx = $state(null);

  class WeatherChartClass {
    #labels = $derived(
      weather.data?.map((day) => day.date?.toLocaleDateString()),
    );

    #dataSets = $derived([
      {
        label: 'High Temperature',
        id: 'tmax',
        data: weather.params.tmax,
        borderColor: '#f8717170',
        pointHoverBorderColor: '#f8717120',
        pointBorderColor: '#f87171',
        pointHoverBackgroundColor: '#f87171',
        yAxisID: 'y',
        type: 'line',
        hidden: !weather.table.showParameters.tmax,
      },
      {
        label: 'Average Temperature',
        id: 'tavg',
        data: weather.params.tavg,
        borderColor: '#a3a3a370',
        pointHoverBorderColor: '#a3a3a320',
        pointBorderColor: '#a3a3a3',
        pointHoverBackgroundColor: '#a3a3a3',
        yAxisID: 'y',
        type: 'line',
        hidden: !weather.table.showParameters.tavg,
      },
      {
        label: 'Low Temperature',
        id: 'tmin',
        data: weather.params.tmin,
        borderColor: '#38bdf870',
        pointHoverBorderColor: '#38bdf820',
        pointBorderColor: '#38bdf8',
        pointHoverBackgroundColor: '#38bdf8',
        yAxisID: 'y',
        type: 'line',
        hidden: !weather.table.showParameters.tmin,
      },
      {
        label: 'Rain',
        id: 'prcp',
        data: weather.params.prcp,
        borderColor: '#818cf870',
        pointHoverBorderColor: '#818cf820',
        pointBorderColor: '#818cf8',
        pointHoverBackgroundColor: '#818cf8',
        yAxisID: 'y2',
        type: 'line',
        hidden: !weather.table.showParameters.prcp,
      },
      {
        label: 'Snow',
        id: 'snow',
        data: weather.params.snow,
        borderColor: '#94a3b870',
        pointHoverBorderColor: '#94a3b820',
        pointBorderColor: '#94a3b8',
        pointHoverBackgroundColor: '#94a3b8',
        yAxisID: 'y2',
        type: 'line',
        hidden: !weather.table.showParameters.snow,
      },
      {
        label: 'Daytime',
        id: 'dayt',
        data: weather.params.dayt,
        fill: {
          target: 'origin',
          above: 'rgba(255, 203, 71, 0.03)', // Why above and not below?
        },
        borderColor: '#facc1570',
        pointHoverBorderColor: '#facc1520',
        pointBorderColor: '#facc15',
        pointHoverBackgroundColor: '#facc15',
        yAxisID: 'y2',
        hidden: !weather.table.showParameters.dayt,
      },
    ]);

    current;

    setup() {
      this.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: $state.snapshot(this.#labels),
          datasets: $state.snapshot(this.#dataSets),
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
          events: ['click'],
          animation: false,
          plugins: {
            tooltip: {
              enabled: true,
              interaction: {
                mode: 'index',
                axis: 'y',
              },
              usePointStyle: true,
            },
            legend: {
              display: false,
            },
          },
          responsive: true,
          maintainAspectRatio: false,
          aspectRatio: 3,
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
                  project.units === 'metric'
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
                  project.units === 'metric'
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
      });
    }

    update() {
      if (this.current) this.current.destroy();
      this.setup();
    }
  }

  export let weatherChart = browser ? new WeatherChartClass() : null;
</script>

<script>
  import { onMount } from 'svelte';

  onMount(() => {
    weatherChart.setup();
  });

  $effect(() => {
    if (weather.data) {
      weatherChart.update();
    }
  });
  $effect(() => {
    weather.table.showParameters;
    weatherChart.update();
  });
</script>

<div class="bg-surface-50-950 mb-4 h-[300px]">
  <canvas id="weather-chart" bind:this={ctx}></canvas>
</div>
