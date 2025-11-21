import fs from "fs";
import { faker } from "@faker-js/faker";

const TOTAL = 200;

if (!fs.existsSync("./csv")) {
  fs.mkdirSync("./csv", { recursive: true });
}

const stream = fs.createWriteStream("./csv/warehouses.csv");

console.log("Generating warehouses...");
for (let i = 1; i <= TOTAL; i++) {
  const city = faker.location.city().replace(/,/g, "");
  const state = faker.location.state().replace(/,/g, "");
  const country = faker.location.country().replace(/,/g, "");
  stream.write(`${i},${city},${state},${country}\n`);
}
console.log("Finished generating warehouses.");

stream.end();
