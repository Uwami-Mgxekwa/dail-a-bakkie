🚚 Dial a Bakkie
Connecting customers with reliable bakkie drivers for on-demand furniture and goods transportation across South Africa. Inspired by Uber, built for moving.

📖 Table of Contents
Project Overview

Key Features

Tech Stack

Folder Structure

Installation Instructions

Environment Variables

Usage Guide

API Endpoints

Deployment

Contributing

License

Contact

🎯 Project Overview
Dial a Bakkie is a full-stack web and mobile application designed to bridge the gap between individuals or businesses needing to transport goods and local bakkie (small truck) drivers. The platform operates on a simple, fair model:

For Customers: A free, easy-to-use service to request a bakkie, track its arrival in real-time, and pay securely, making moving items as simple as ordering a ride.

For Drivers: A subscription-based platform that provides access to a steady stream of job requests. Drivers keep 100% of their trip earnings, empowering them to build their businesses without hefty commission fees.

This project aims to provide a modern, efficient, and reliable solution for logistics at a local level.

✨ Key Features
The platform is divided into two main user experiences:

👨‍👩‍👧‍👦 Customer Features

👷‍♂️ Driver Features

📍 Real-Time Driver Tracking: View your driver's location on the map.

🗺️ Route Optimization: Get the fastest route via Google Maps.

📅 Instant & Scheduled Bookings: Request a bakkie now or for later.

🔔 Real-Time Job Alerts: Receive instant notifications for new requests.

💳 Secure In-App Payments: Pay seamlessly and securely.

💰 100% Trip Earnings: Keep all the money you make from trips.

⭐️ Driver Ratings & Reviews: Rate your experience and help the community.

📈 Earnings Dashboard: Track your income and trip history.

📜 Trip History: Keep a record of all your past moves.

✅ Go Online/Offline: Set your availability with a single tap.

🛠️ Tech Stack
This project leverages a modern, robust, and scalable tech stack to deliver a seamless user experience.

Category

Technology

Why We Chose It

Frontend (Web)



For building a fast, component-based, and interactive user interface.

Frontend (Mobile)



To build cross-platform native apps for iOS and Android from a single JavaScript codebase, accelerated by Expo.

Styling



A utility-first CSS framework for rapidly building custom, responsive designs without leaving the HTML/JSX.

Backend



For a fast, scalable, and efficient server-side environment using JavaScript.

Database



A flexible, scalable NoSQL database that works seamlessly with our JavaScript-based stack (MERN).

Authentication



Provides secure, easy-to-implement user authentication (email/password, social logins).

Notifications



Firebase Cloud Messaging for reliable real-time push notifications on web and mobile.

Maps & Geolocation



Industry-standard for interactive maps, routing, geocoding, and calculating distances/ETAs.

Deployment



Vercel for seamless frontend deployment and CI/CD. Render/Railway for hassle-free backend and database hosting.

📁 Folder Structure
The project is organized in a monorepo structure to keep all parts of the application in one place.

/dial-a-bakkie
├── 📂 client/          # React.js Web App (Customer & Driver portals)
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── ...
├── 📂 mobile/          # React Native + Expo Mobile App
│   ├── assets/
│   ├── components/
│   └── screens/
├── 📂 server/          # Node.js + Express.js Backend API
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── server.js
└── README.md

🚀 Installation Instructions
Follow these steps to get the project running locally on your machine.

1. Prerequisites:

Node.js (v18 or later)

Git

MongoDB Atlas account

Firebase project

Google Maps API key

2. Clone the Repository:

git clone [https://github.com/Uwami-Mgxekwa/dial-a-bakkie.git](https://github.com/Uwami-Mgxekwa/dial-a-bakkie.git)
cd dial-a-bakkie

3. Backend Setup:

# Navigate to the server directory
cd server

# Install dependencies
npm install

# Create a .env file and add the required environment variables (see below)
touch .env

# Start the development server
npm run dev

4. Frontend (Web) Setup:

# Navigate to the client directory from the root
cd client

# Install dependencies
npm install

# Create a .env.local file and add the required environment variables
touch .env.local

# Start the React development server
npm start

5. Mobile App Setup:

# Navigate to the mobile directory from the root
cd mobile

# Install dependencies
npm install

# Create a .env file and add the required environment variables
touch .env

# Start the Expo development server
npx expo start

🔑 Environment Variables
You will need to create .env files in the server, client, and mobile directories. Copy the contents of the corresponding .env.example files and replace the placeholder values with your actual keys.

Server (/server/.env):

MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret_key
FIREBASE_ADMIN_SDK_CONFIG=your_firebase_service_account_key_json
GOOGLE_MAPS_API_KEY=your_google_maps_server_api_key

Frontend (/client/.env.local):

REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_FIREBASE_CONFIG=your_firebase_web_client_config_json
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_client_api_key

Mobile (/mobile/.env):

EXPO_PUBLIC_API_BASE_URL=http://your_local_ip:5000/api
EXPO_PUBLIC_FIREBASE_CONFIG=your_firebase_web_client_config_json
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_client_api_key

🎮 Usage Guide
Once all services are running:

Web App: Open your browser to http://localhost:3000.

Mobile App: Scan the QR code from the Expo Metro Bundler terminal with the Expo Go app on your phone.

You can then:

Register a new account as either a Customer or a Driver.

Log in to the appropriate dashboard.

As a Customer, request a trip by setting pickup and drop-off locations.

As a Driver, toggle your status to "Online" to receive trip requests.

🔗 API Endpoints
Here are some examples of the core API routes available.

Method

Endpoint

Description

POST

/api/auth/register

Register a new user (customer or driver).

POST

/api/auth/login

Log in an existing user.

POST

/api/trips/request

Customer requests a new trip.

GET

/api/trips/:userId

Get all trips for a specific user.

PATCH

/api/trips/accept/:tripId

Driver accepts a trip request.

PATCH

/api/drivers/activate

Driver activates their online status.

☁️ Deployment
Frontend (Vercel): Connect your Git repository to Vercel. Configure the root directory to client and use the "Create React App" preset. Add your environment variables.

Backend (Render): Connect your repository to Render. Create a new "Web Service," set the root directory to server, and define the build command (npm install) and start command (npm start). Add your environment variables.

🙌 Contributing
Contributions are welcome! If you have suggestions or want to improve the code, please follow these steps:

Fork the repository.

Create a new branch (git checkout -b feature/YourAmazingFeature).

Make your changes and commit them (git commit -m 'Add some AmazingFeature').

Push to the branch (git push origin feature/YourAmazingFeature).

Open a Pull Request.

Please ensure your code follows the existing style and includes comments where necessary.

📜 License
This project is licensed under the MIT License. See the LICENSE file for more details.

📞 Contact
Developed with ❤️ by Uwami Mgxekwa in Johannesburg, South Africa.

Feel free to connect with me:

GitHub: Uwami-Mgxekwa
