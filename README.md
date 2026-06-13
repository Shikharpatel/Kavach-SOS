# Kavach SOS - Disaster Response Platform 🚨

Kavach SOS is a comprehensive, real-time disaster management and response platform designed to optimize incident reporting, resource allocation, and rescue team routing during critical emergencies.

## 🌟 Key Features

* **Real-time Incident Dashboard**: Live tracking of disaster incidents (floods, earthquakes, fires) with severity metrics and affected population data.
* **Smart Resource Allocation**: Greedy algorithm-based distribution of medical kits, food, and water based on incident priority and population density.
* **Optimal Routing System**: Dijkstra-based routing engine to calculate the fastest and safest paths for dispatching rescue teams to affected zones.
* **Evacuation Management**: BFS-powered shelter search to instantly locate the nearest available safety zones on a geographic grid.

## 🏗️ Technology Stack

* **Frontend**: React, Vite, Tailwind CSS, Radix UI (accessible components)
* **Backend**: Python, Node.js, Express, TypeScript
* **Database**: SQLite (via Drizzle ORM) for lightweight, instantaneous local data persistence
* **API Layer**: Zod for validation, React Query & Orval for strictly-typed API communication


---

## 🚀 How to Run the Platform (Web App)

The application relies on a fully self-contained local SQLite database.

1. **Install Dependencies** (if you haven't already):
   ```bash
   npm install
   ```

2. **Start the Development Servers**:
   ```bash
   npm run dev
   ```
   *This single command will concurrently start both the backend API server and the frontend Vite dashboard.*

3. **View the Dashboard**:
   Open your browser and navigate to `http://localhost:5173/` to see the live disaster response command center.

---


### Algorithm Modules:
* `dijkstra_routing.py`: Calculates shortest/safest paths in a weighted graph.
* `bfs_shelter.py`: Searches a 2D matrix for the nearest evacuation shelter.
* `greedy_allocation.py`: Distributes limited emergency resources prioritizing high-severity incidents.

