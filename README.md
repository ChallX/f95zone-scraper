# F95Zone Scraper 🚀

![GitHub Repo](https://img.shields.io/badge/Repo-f95zone--scraper-brightgreen) ![Node.js](https://img.shields.io/badge/Node.js-v16.0.0-blue) ![Puppeteer](https://img.shields.io/badge/Puppeteer-v10.0.0-orange) ![Google Sheets](https://img.shields.io/badge/Google%20Sheets-v1.0.0-yellowgreen)

Welcome to the **F95Zone Scraper**! This project is an AI-powered tool designed to extract game data from the F95Zone community. With a user-friendly web interface, it utilizes Google Gemini to gather essential game information, detect download sizes, and save everything directly to Google Sheets. Built using Node.js and Puppeteer, this scraper is efficient and effective for anyone interested in F95Zone games.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)
- [Releases](#releases)

## Features 🌟

- **AI-Powered Extraction**: Utilizes Google Gemini to accurately gather game data.
- **Download Size Detection**: Automatically detects and displays download sizes for games.
- **Google Sheets Integration**: Saves extracted data directly to Google Sheets for easy access and organization.
- **Web Interface**: Offers a simple and intuitive web interface for users to interact with the scraper.
- **Node.js and Puppeteer**: Built with modern technologies for optimal performance and reliability.

## Installation ⚙️

To get started with the F95Zone Scraper, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/ChallX/f95zone-scraper.git
   ```

2. **Navigate to the Project Directory**:
   ```bash
   cd f95zone-scraper
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Run the Application**:
   ```bash
   npm start
   ```

Make sure you have Node.js installed on your machine. You can download it from [Node.js Official Website](https://nodejs.org/).

## Usage 📖

After installation, you can access the web interface by navigating to `http://localhost:3000` in your browser. From there, you can input the game URLs you want to scrape. The scraper will gather the necessary data and save it to your Google Sheets account.

1. **Input Game URL**: Enter the URL of the F95Zone game you wish to scrape.
2. **Start Scraping**: Click the "Scrape" button to begin the process.
3. **Check Google Sheets**: After scraping, check your Google Sheets for the extracted data.

## Technologies Used 🛠️

- **Node.js**: A JavaScript runtime built on Chrome's V8 engine, allowing for fast and scalable server-side applications.
- **Puppeteer**: A Node library which provides a high-level API to control Chrome or Chromium over the DevTools Protocol, making web scraping efficient.
- **Google Gemini**: AI technology that helps in extracting relevant game data accurately.
- **Google Sheets API**: Allows for seamless integration with Google Sheets for data storage.

## Contributing 🤝

We welcome contributions from the community! If you would like to contribute, please follow these steps:

1. **Fork the Repository**: Click on the "Fork" button at the top right of this page.
2. **Create a Branch**: 
   ```bash
   git checkout -b feature/YourFeatureName
   ```
3. **Make Your Changes**: Implement your changes and test them thoroughly.
4. **Commit Your Changes**: 
   ```bash
   git commit -m "Add your message here"
   ```
5. **Push to the Branch**: 
   ```bash
   git push origin feature/YourFeatureName
   ```
6. **Open a Pull Request**: Go to the original repository and click on "New Pull Request".

Your contributions help improve the F95Zone Scraper and benefit the entire community!

## License 📜

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Releases 📦

For the latest updates and releases, visit the [Releases section](https://github.com/ChallX/f95zone-scraper/releases). Here, you can download the latest version of the scraper and execute it on your local machine.

## Additional Information 📝

### How It Works

The F95Zone Scraper leverages web scraping techniques to gather game data. Puppeteer automates the process of navigating the F95Zone website, allowing the scraper to collect information such as game titles, descriptions, and download sizes. The AI capabilities of Google Gemini enhance the accuracy of the data collected.

### Future Enhancements

- **Multi-Threading**: Improve performance by allowing multiple scrapes to occur simultaneously.
- **User Authentication**: Enable users to log in and manage their Google Sheets accounts securely.
- **Data Visualization**: Implement charts and graphs in Google Sheets to visualize game data.

### Troubleshooting

If you encounter any issues while using the scraper, consider the following:

- Ensure you have the latest version of Node.js installed.
- Check your internet connection.
- Verify that the F95Zone website is accessible.
- Review the console for any error messages during scraping.

### Community Support

Join our community to discuss features, share tips, and get support:

- **Discord**: [Join our Discord server](https://discord.gg/example)
- **Forum**: Participate in discussions on our [community forum](https://forum.example.com)

Thank you for your interest in the F95Zone Scraper! We hope you find it useful for extracting game data efficiently.