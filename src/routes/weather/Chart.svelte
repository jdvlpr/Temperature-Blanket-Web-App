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

<script>
  import { units } from '$lib/state';
  import {
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    Filler,
    Legend,
    LineController,
    LineElement,
    LinearScale,
    LogarithmicScale,
    PointElement,
    RadialLinearScale,
    TimeScale,
    TimeSeriesScale,
    Title,
    Tooltip,
  } from 'chart.js';
  import { onMount } from 'svelte';
  import { hour } from './+page.svelte';

  let { data } = $props();

  Chart.register(
    LineElement,
    BarElement,
    PointElement,
    BarController,
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

  let dataSets, chart;

  onMount(() => {
    if (data.some((item) => item?.temperature_2m_max)) {
      dataSets = [
        {
          label: 'Temperature Max',
          id: 'tmin',
          data: data.map((item) => item.temperature_2m_max),
          borderColor: '#f8717170',
          pointHoverBorderColor: '#f8717120',
          pointBorderColor: '#f87171',
          pointHoverBackgroundColor: '#f87171',
          yAxisID: 'y',
          type: 'line',
          fill: 1,
          backgroundColor: '#94a3b820',
        },
        {
          label: 'Temperature Min',
          id: 'tmax',
          data: data.map((item) => item.temperature_2m_min),
          borderColor: '#38bdf870',
          pointHoverBorderColor: '#38bdf820',
          pointBorderColor: '#38bdf8',
          pointHoverBackgroundColor: '#38bdf8',
          yAxisID: 'y',
          type: 'line',
        },
        {
          label: 'Precipitation Probability',
          id: 'prcp',
          data: data.map((item) => item.precipitation_probability_max),
          backgroundColor: '#62BAF350',
          yAxisID: 'y2',
          type: 'bar',
        },
      ];
    } else {
      dataSets = [
        {
          label: 'Temperature',
          id: 'temp',
          data: data.map((item) => item.temperature_2m),
          borderColor: '#94a3b870',
          pointHoverBorderColor: '#94a3b820',
          pointBorderColor: '#94a3b8',
          pointHoverBackgroundColor: '#94a3b8',
          yAxisID: 'y',
          type: 'line',
        },
        {
          label: 'Precipitation Probability',
          id: 'prcp',
          data: data.map((item) => item.precipitation_probability),
          backgroundColor: '#62BAF350',
          yAxisID: 'y2',
          type: 'bar',
        },
      ];
    }

    const events = (chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((item) => {
          const locale = navigator.languages
            ? navigator.languages[0]
            : navigator.language;
          let time;
          if (item.temperature_2m_max) {
            time = new Date(item.time).toLocaleString(
              window.navigator.language,
              {
                weekday: 'short',
              },
            );
          } else {
            time =
              new Date(item.time).toLocaleDateString(locale, {
                dateStyle: 'short',
              }) +
              ' ' +
              new Date(item.time).toLocaleTimeString(locale, {
                timeStyle: 'short',
                hour12: $hour === '12' ? true : false,
              });
          }
          return time;
        }),
        datasets: dataSets,
      },
      options: {
        elements: {
          line: {
            tension: 0.8,
            borderWidth: 6,
          },
          point: {
            pointRadius: 1,
            pointHitRadius: 15,
            borderWidth: 0,
            fill: false,
            pointHoverRadius: 6,
            hoverBorderWidth: 25,
          },
        },
        // events: ["click", "mousemove", "touchstart", "touchmove"],
        events: [],
        animation: false,
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
            max: 100,
            grid: {
              drawOnChartArea: false, // only want the grid lines for one axis to show up
            },
            title: {
              text: 'Precipitation %',
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
  });

  let ctx = $state();
</script>

<div class="rounded-container-token my-2 h-[240px]">
  <canvas id="weather-chart" bind:this={ctx}></canvas>
</div>
