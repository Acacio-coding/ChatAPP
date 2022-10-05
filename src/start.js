import { server } from "./app.js";
import { PORT } from "./utils/constants.js";
import "./messaging/io.js";

server.listen(PORT, () => {
  console.log(`App started listening on http://localhost:${PORT}`);
});
