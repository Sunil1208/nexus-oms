import { fetchAndQueueEvents } from "./eventFetcher.js";

export function startScheduler() {
    console.log("Starting event fetcher scheduler...");

    setInterval(async () => {
        try {
            const count = await fetchAndQueueEvents(50);

            if (count > 0) {
                console.log(`Queued ${count} event(s) for processing.`);
            }
        } catch (error) {
            console.error("Error in event fetcher scheduler:", error);
        }
    }, 10000); // Run every 10 seconds
}