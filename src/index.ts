import { initialiseDatabase } from "./model/db";
import { startServer } from "./server/server";
initialiseDatabase();

startServer();
