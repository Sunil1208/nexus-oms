import fs from "fs";
import { faker } from "@faker-js/faker";

const TOTAL = 10_000_000;

if (!fs.existsSync("./csv")) {
  fs.mkdirSync("./csv", { recursive: true });
}

const stream = fs.createWriteStream("./csv/shipments.csv");

function generate() {
  console.log("Generating shipments...");
  let i = TOTAL;

  function write() {
    let ok = true;

    while (i > 0 && ok) {
      const id = TOTAL - i + 1;
      const orderId = id; // 1:1 mapping for simplicity
      const carrier = faker.helpers.arrayElement(["DHL", "FedEx", "UPS"]);
      const tracking = faker.string.uuid();
      const status = faker.helpers.arrayElement([
        "CREATED",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ]);
      const expected = faker.date.future().toISOString();
      const created = faker.date.past().toISOString();

      const row = `${id},${orderId},${carrier},${tracking},${status},${expected},${created}\n`;

      i--;
      ok = stream.write(row);
    }

    if (i === 0) {
      console.log("Finished generating shipments.");
      stream.end();
    } else {
      console.log("Waiting for drain...");
      stream.once("drain", write);
    }
  }

  write();
}

generate();
