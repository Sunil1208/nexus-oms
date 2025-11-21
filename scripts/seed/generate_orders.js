import fs from "fs";
import { faker } from "@faker-js/faker";

const TOTAL = 10_000_000;

if (!fs.existsSync("./csv")) {
  fs.mkdirSync("./csv", { recursive: true });
}

const stream = fs.createWriteStream("./csv/orders.csv");

function generate() {
  console.log("Generating orders...");
  let i = TOTAL;

  function write() {
    let ok = true;

    while (i > 0 && ok) {
      const id = TOTAL - i + 1;
      const userId = faker.number.int({ min: 1, max: 1_000_000 });
      const warehouseId = faker.number.int({ min: 1, max: 200 });
      const status = faker.helpers.arrayElement([
        "PENDING",
        "PAID",
        "SHIPPED",
        "DELIVERED",
      ]);
      const amount = faker.number.float({
        min: 10,
        max: 5000,
        precision: 0.01,
      });
      const created = faker.date.past().toISOString();

      const row = `${id},${userId},${warehouseId},${status},${amount},${created}\n`;

      i--;
      ok = stream.write(row);
    }

    if (i === 0) {
      console.log("Finished generating orders.");
      stream.end();
    } else {
      console.log("Waiting for drain...");
      stream.once("drain", write);
    }
  }

  write();
}

generate();
