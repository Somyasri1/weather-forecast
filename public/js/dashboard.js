const $ = (id) => document.getElementById(id);

const form = $('search-form');
const input = $('city-input');
const statusBox = $('status');

let calendarDate = new Date();

const weatherIcon = (code, size = '2x') =>
  `https://openweathermap.org/img/wn/${code || '01d'}@${size}.png`;

const safe = (value, fallback = '--') =>
  value === null || value === undefined || value === '' ? fallback : value;

function setStatus(message = '', error = false) {
  statusBox.className = message
    ? `status show${error ? ' error' : ''}`
    : 'status';

  statusBox.replaceChildren();

  if (message && !error) {
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    statusBox.append(spinner);
  }

  if (message) {
    statusBox.append(document.createTextNode(message));
  }
}

function localTime(timestamp, timezone = 0) {
  const date = new Date((timestamp + timezone) * 1000);
  const hours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const hour12 = hours % 12 || 12;

  return `${hour12}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
}

function dateLabel(
  dateString,
  options = { weekday: 'short', month: 'short', day: 'numeric' }
) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString(
    'en-US',
    options
  );
}

function renderForecast(days) {
  const grid = $('forecast-grid');
  const prediction = $('prediction-list');

  if (!days || !days.length) {
    grid.innerHTML =
      '<div class="forecast-placeholder">Forecast unavailable.</div>';

    prediction.innerHTML =
      '<div class="prediction-placeholder">No forecast available.</div>';

    return;
  }

  grid.innerHTML = days.map((day, i) => `
    <article class="forecast-card">
      <div class="day">${i === 0 ? 'Today' : day.day}</div>
      <div class="date">${dateLabel(day.date, {
        month: 'short',
        day: 'numeric'
      })}</div>
      <img
        src="${weatherIcon(day.icon)}"
        alt="${day.description}"
        loading="lazy"
      >
      <div class="condition">${day.description}</div>
      <div class="temps">
        <span>${day.max}°</span>
        <span>${day.min}°</span>
      </div>
    </article>
  `).join('');

  prediction.innerHTML = days.slice(0, 3).map((day, i) => `
    <article class="prediction-item">
      <img src="${weatherIcon(day.icon)}" alt="">
      <div>
        <div class="pred-day">
          ${dateLabel(day.date, { month: 'short', day: 'numeric' })}
          ${i === 0 ? ' · Today' : ''}
        </div>
        <div class="pred-condition">${day.description}</div>
      </div>
      <div class="pred-temp">${day.max}° / ${day.min}°</div>
    </article>
  `).join('');
}

function renderAir(aqi) {
  const names = [
    'Unavailable',
    'Good',
    'Fair',
    'Moderate',
    'Poor',
    'Very poor'
  ];

  const descriptions = [
    '',
    'Air quality is good today.',
    'Air quality is fair for most people.',
    'Sensitive people may wish to take care.',
    'Consider reducing prolonged outdoor activity.',
    'Limit outdoor activity if you feel affected.'
  ];

  if (!aqi) {
    $('aqi-label').textContent = 'Air quality unavailable';
    $('aqi-description').textContent =
      'Air quality data is not available.';
    $('aqi-number').textContent = '--';
    $('aqi-marker').style.left = '4%';

    ['pm25', 'pm10', 'no2', 'o3'].forEach(id => {
      $(id).textContent = '--';
    });

    return;
  }

  const value = aqi.value;

  $('aqi-label').textContent = names[value] || 'Air quality';
  $('aqi-description').textContent =
    descriptions[value] || 'Latest air quality estimate.';
  $('aqi-number').textContent = value;

  $('aqi-marker').style.left =
    `${Math.max(3, Math.min(95, (value - 1) * 24 + 4))}%`;

  const components = aqi.components || {};
  const format = value => value == null ? '--' : Number(value).toFixed(1);

  $('pm25').textContent = format(components.pm2_5);
  $('pm10').textContent = format(components.pm10);
  $('no2').textContent = format(components.no2);
  $('o3').textContent = format(components.o3);
}

let selectedDate = new Date();
selectedDate.setHours(0, 0, 0, 0);

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  $('calendar-month').textContent = calendarDate.toLocaleDateString(
    'en-US',
    {
      month: 'long',
      year: 'numeric'
    }
  );

  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calendar = $('calendar-days');
  calendar.innerHTML = '';

  for (let i = 0; i < 42; i++) {
    let date;
    let className = '';

    if (i < offset) {
      date = new Date(
        year,
        month - 1,
        previousMonthDays - offset + i + 1
      );
      className = 'muted-day';
    } else if (i >= offset + daysInMonth) {
      date = new Date(
        year,
        month + 1,
        i - offset - daysInMonth + 1
      );
      className = 'muted-day';
    } else {
      date = new Date(year, month, i - offset + 1);
    }

    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      className += ' today';
    }

    if (date.getTime() === selectedDate.getTime()) {
      className += ' selected';
    }

    const button = document.createElement('button');

    button.type = 'button';
    button.className = className.trim();
    button.textContent = date.getDate();
    button.setAttribute('aria-label', date.toDateString());

    button.addEventListener('click', () => {
      selectedDate = new Date(date);
      renderCalendar();
      loadSelectedDateWeather(selectedDate);
    });

    calendar.appendChild(button);
  }
}

function updateTips(data) {
  const condition = data.condition.toLowerCase();
  let tip = 'Check your local forecast before heading out.';

  if (
    condition.includes('rain') ||
    condition.includes('drizzle') ||
    condition.includes('thunder')
  ) {
    tip = 'Rain may be around. Keep an umbrella handy.';
  } else if (condition.includes('clear')) {
    tip =
      'Clear skies ahead. Enjoy the outdoors if conditions are comfortable.';
  } else if (condition.includes('snow')) {
    tip = 'Cold conditions are possible. Dress warmly.';
  } else if (data.temp >= 32) {
    tip = 'It is warm outside. Drink water regularly and seek shade.';
  } else if (
    condition.includes('cloud') ||
    condition.includes('mist') ||
    condition.includes('fog') ||
    condition.includes('haze')
  ) {
    tip = 'Cloud cover may change. Check again before making plans.';
  }

  $('weather-tip').textContent = tip;
}

function renderWeather(data) {
  $('current-temp').textContent = data.temp;
  $('current-city').textContent = `${data.city}, ${data.country}`;
  $('hero-country').textContent = 'CURRENT WEATHER';
  $('current-condition').textContent = data.description;

  $('current-icon').src = weatherIcon(data.icon, '4x');
  $('current-icon').alt = data.description;
  $('current-icon').style.display = '';

  $('feels-like').textContent = `${data.feelsLike}°`;
  $('updated-time').textContent =
    `Updated ${localTime(data.updatedAt, data.timezone)}`;

  $('humidity').textContent = `${data.humidity}%`;
  $('wind-speed').textContent = `${safe(data.wind)} m/s`;
  $('pressure').textContent = `${safe(data.pressure)} hPa`;

  $('visibility').textContent =
    data.visibility == null ? '-- km' : `${data.visibility} km`;

  $('air-location').textContent = `Air conditions near ${data.city}`;
  $('sun-city').textContent = data.city;

  $('sunrise-time').textContent = localTime(data.sunrise, data.timezone);
  $('sunset-time').textContent = localTime(data.sunset, data.timezone);

  const daylight = Math.max(0, data.sunset - data.sunrise);

  $('daylight-length').textContent =
    `${Math.floor(daylight / 3600)}h ${Math.floor(
      (daylight % 3600) / 60
    )}m daylight`;

  $('timezone-label').textContent =
    `Local time ${localTime(data.updatedAt, data.timezone)}`;

  const cityDate = new Date(
    (data.updatedAt + data.timezone) * 1000
  );

  $('today-weekday').textContent = cityDate.toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      timeZone: 'UTC'
    }
  );

  $('today-date').textContent = cityDate.toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    }
  );

  $('right-weekday').textContent = cityDate.toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      timeZone: 'UTC'
    }
  );

  $('right-day-number').textContent = cityDate.toLocaleDateString(
    'en-US',
    {
      day: 'numeric',
      timeZone: 'UTC'
    }
  );

  const condition = data.condition.toLowerCase();
  const isNight = String(data.icon).endsWith('n');
  const hero = $('hero');

  hero.classList.remove('rainy', 'cloudy', 'night');

  if (isNight) {
    hero.classList.add('night');
  } else if (
    condition.includes('rain') ||
    condition.includes('drizzle') ||
    condition.includes('thunder')
  ) {
    hero.classList.add('rainy');
  } else if (
    condition.includes('cloud') ||
    condition.includes('mist') ||
    condition.includes('fog') ||
    condition.includes('haze')
  ) {
    hero.classList.add('cloudy');
  }

  renderForecast(data.forecast);
  renderAir(data.aqi);
  updateTips(data);
}

async function loadWeather(city) {
  if (!city.trim()) {
    setStatus('Please enter a city name.', true);
    input.focus();
    return;
  }

  setStatus(`Loading weather for ${city.trim()}…`);
  form.querySelector('button').disabled = true;

  try {
    const response = await fetch(
      `/api/weather?city=${encodeURIComponent(city.trim())}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Could not load weather.');
    }

    renderWeather(data);
    input.value = data.city;
    setStatus('');
  } catch (error) {
    setStatus(error.message || 'Something went wrong. Please try again.', true);
  } finally {
    form.querySelector('button').disabled = false;
  }
}

async function loadSelectedDateWeather(date) {
  const city = input.value.trim();

  if (!city) {
    setStatus('');
    return;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  setStatus('');

  try {
    const response = await fetch(
      `/api/weather/day?city=${encodeURIComponent(city)}&date=${dateString}`
    );

    const data = await response.json();

    if (!response.ok) {
      // Hide the message and clear old weather values for unavailable dates.
      setStatus('');

      $('hero-country').textContent =
        `FORECAST FOR ${date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }).toUpperCase()}`;

      $('current-temp').textContent = '--';
      $('current-condition').textContent = 'Forecast unavailable';

      const icon = $('current-icon');
      icon.removeAttribute('src');
      icon.alt = '';
      icon.style.display = 'none';

      $('feels-like').textContent = '--';
      $('humidity').textContent = '--';
      $('wind-speed').textContent = '--';
      $('pressure').textContent = '--';

      return;
    }

    $('current-temp').textContent = data.temp;
    $('current-city').textContent = data.city;
    $('current-condition').textContent = data.description;

    const icon = $('current-icon');
    icon.src = weatherIcon(data.icon, '4x');
    icon.alt = data.description;
    icon.style.display = '';

    $('feels-like').textContent = `${data.feelsLike}°`;
    $('humidity').textContent = `${data.humidity}%`;
    $('wind-speed').textContent = `${data.wind} m/s`;
    $('pressure').textContent = `${data.pressure} hPa`;

    $('hero-country').textContent =
      `FORECAST FOR ${date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).toUpperCase()}`;

    setStatus('');
  } catch (error) {
    // Keep the dashboard quiet if a selected-date forecast cannot be loaded.
    setStatus('');
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  loadWeather(input.value);
});

$('prev-month').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

$('next-month').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

$('scroll-forecast').addEventListener('click', () => {
  $('forecast').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
});

renderCalendar();

const now = new Date();

$('today-weekday').textContent = now.toLocaleDateString(
  'en-US',
  { weekday: 'long' }
);

$('today-date').textContent = now.toLocaleDateString(
  'en-US',
  { month: 'short', day: 'numeric' }
);

$('right-weekday').textContent = now.toLocaleDateString(
  'en-US',
  { weekday: 'long' }
);

$('right-day-number').textContent = now.getDate();

// Load weather only after the user searches for a city.

/* Sidebar navigation */
const sidebarLinks = document.querySelectorAll('.rail-nav .rail-link');

sidebarLinks.forEach(link => {
  link.addEventListener('click', () => {
    sidebarLinks.forEach(item => {
      item.classList.remove('active');
      item.removeAttribute('aria-current');
    });

    link.classList.add('active');
    link.setAttribute('aria-current', 'page');
  });
});

function updateActiveSidebarLink() {
  const currentHash = window.location.hash || '#overview';

  sidebarLinks.forEach(link => {
    const isActive = link.getAttribute('href') === currentHash;

    link.classList.toggle('active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

window.addEventListener('hashchange', updateActiveSidebarLink);
updateActiveSidebarLink();
 