# 🌦️ Weather Forecast Dashboard

A web-based weather dashboard that allows users to search for a city and view its current weather conditions, five-day forecast, air quality information, and other weather details through a simple, interactive interface.

## ✨ Features

- **City Search:** Search for weather information by city name.
- **Current Weather:** View the current temperature and weather conditions.
- **Five-Day Forecast:** Check forecast information for the next five days, subject to API availability.
- **Air Quality Index (AQI):** View air quality information when available.
- **Sunrise and Sunset:** Check local sunrise and sunset times.
- **Weather Details:** Explore additional weather information.
- **Date Selection:** Select a date to view available forecast details.
- **Interactive Dashboard:** Explore weather information through a user-friendly interface.

## 🛠️ Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Node.js, Express.js
- **Template Engine:** EJS
- **API Integration:** Axios
- **Environment Variables:** dotenv
- **Weather Data:** OpenWeatherMap API

## 📁 Project Structure

```text
Weather Forecast/
├── public/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── dashboard.js
├── views/
│   └── dashboard.ejs
├── .env
├── .gitignore
├── index.js
├── package.json
├── package-lock.json
└── README.md
```

**Note:** The `.env` file contains configuration secrets and should not be uploaded to GitHub.

## ⚙️ Prerequisites

Before running the project, ensure you have installed:

- [Node.js](https://nodejs.org/)
- npm (included with Node.js)
- An OpenWeatherMap API key

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Somyasri1/weather-forecast.git
```

### 2. Navigate to the Project Folder

```bash
cd weather-forecast
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root directory and add your OpenWeatherMap API key:

```env
WEATHER_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your own API key.

**Security:** Never commit your `.env` file or publish your API key.

### 5. Start the Application

```bash
node index.js
```

### 6. Open the Dashboard

Open your browser and visit:

```text
http://localhost:3000
```

## 🌐 Weather Data

This application uses the OpenWeatherMap API to retrieve weather information. The availability of forecast data depends on the API response and its forecast period. Dates beyond the available forecast range may not have forecast information.

## 🔒 Security

- Store API keys in environment variables.
- Keep `.env` out of version control.
- Do not expose private credentials in source code or public repositories.

## 👩‍💻 Author

**Somya Sri Uppalapati**

GitHub: [Somyasri1](https://github.com/Somyasri1)

## 📄 License

This project is available for educational and personal portfolio purposes. Add a specific open-source license if you intend to distribute it under particular reuse terms.
