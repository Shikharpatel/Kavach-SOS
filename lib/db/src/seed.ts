import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import * as schema from "./schema/index";

async function seed() {
  const sqlitePath = path.resolve(process.cwd(), "sqlite.db");
  const sqlite = new Database(sqlitePath);
  const db = drizzle(sqlite, { schema });

  console.log("Clearing existing data...");
  db.delete(schema.incidentsTable).run();
  db.delete(schema.resourcesTable).run();
  db.delete(schema.sheltersTable).run();
  db.delete(schema.rescueTeamsTable).run();

  console.log("Inserting shelters...");
  db.insert(schema.sheltersTable).values([
    { name: "City High School", latitude: 28.6139, longitude: 77.2090, capacity: 500, currentOccupancy: 120, status: "available", address: "New Delhi" },
    { name: "Community Center Alpha", latitude: 19.0760, longitude: 72.8777, capacity: 200, currentOccupancy: 200, status: "full", address: "Mumbai" },
    { name: "Sports Complex Beta", latitude: 13.0827, longitude: 80.2707, capacity: 1000, currentOccupancy: 450, status: "available", address: "Chennai" },
  ]).run();

  console.log("Inserting resources...");
  db.insert(schema.resourcesTable).values([
    { name: "Bottled Water", category: "water", totalQuantity: 10000, availableQuantity: 8000, unit: "liters", location: "Warehouse A", latitude: 28.6, longitude: 77.2 },
    { name: "Medical Kits", category: "medical", totalQuantity: 500, availableQuantity: 300, unit: "kits", location: "Hospital Block B", latitude: 19.1, longitude: 72.8 },
    { name: "Emergency Rations", category: "food", totalQuantity: 5000, availableQuantity: 5000, unit: "packets", location: "Warehouse A", latitude: 28.6, longitude: 77.2 },
  ]).run();

  console.log("Inserting rescue teams...");
  db.insert(schema.rescueTeamsTable).values([
    { name: "Alpha Squad", type: "medical", size: 10, status: "available", latitude: 28.6139, longitude: 77.2090, equipment: ["Defibrillator", "Stretcher"] },
    { name: "Bravo Water Rescue", type: "flood_rescue", size: 15, status: "standby", latitude: 19.0760, longitude: 72.8777, equipment: ["Motorboat", "Life jackets"] },
    { name: "Charlie Fire Control", type: "firefighting", size: 8, status: "deployed", latitude: 13.0827, longitude: 80.2707, equipment: ["Fire engine", "Hoses"] },
  ]).run();

  console.log("Inserting incidents...");
  db.insert(schema.incidentsTable).values([
    { title: "Major Flooding in Suburbs", description: "Heavy rainfall caused river banks to overflow.", category: "flood", severity: 8, status: "active", latitude: 19.08, longitude: 72.88, affectedPopulation: 15000, region: "Mumbai" },
    { title: "Forest Fire Warning", description: "Dry conditions led to rapid fire spread.", category: "fire", severity: 6, status: "monitoring", latitude: 13.1, longitude: 80.3, affectedPopulation: 2000, region: "Chennai" },
    { title: "Building Collapse", description: "Old structure collapsed after earthquake tremor.", category: "earthquake", severity: 9, status: "critical", latitude: 28.62, longitude: 77.21, affectedPopulation: 300, region: "New Delhi" },
  ]).run();

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch(console.error);
