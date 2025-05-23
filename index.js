import "./middleware/catchErrors.js";
import dotenv from "dotenv-flow";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { bareModulePath } from "@mercuryworkshop/bare-as-module3";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import express from "express";
import { createServer } from "http";
import path from "node:path";
import chalk from "chalk";
import { server as wisp, logging as wispLogging } from "@mercuryworkshop/wisp-js/server";
import { handler as astroSSR } from "./dist/server/entry.mjs";
import cookies from "cookie-parser";
import { existsSync, readFileSync } from "fs";

dotenv.config();

const whiteListedDomains = ["aluu.xyz", "localhost"];

if (existsSync("exempt_masqr.txt")) {
  const file = readFileSync("exempt_masqr.txt", "utf-8");
  const exemptDomains = file.split("\n");
  exemptDomains.forEach((domain) => {
    whiteListedDomains.push(domain.trim());
  });
}

const LICENSE_SERVER_URL = "https://license.mercurywork.shop/validate?license=";
const MASQR_ENABLED = process.env.MASQR_ENABLED;
wispLogging.set_level(wispLogging.WARN);

const log = (message) => console.log(chalk.gray.bold("[Pyrus] " + message));
const success = (message) => console.log(chalk.green.bold("[Pyrus] " + message));

const PORT = process.env.PORT;
const app = express();

app.use(cookies());

// Set process.env.MASQR_ENABLED to "true" to enable masqr protection.
if (MASQR_ENABLED == "true") {
  log("Starting Masqr...");
  const masqrCheck = (await import("./middleware/Masqr/index.js")).masqrCheck;
  app.use(await masqrCheck({ whitelist: whiteListedDomains, licenseServer: LICENSE_SERVER_URL, htmlFile: "Checkfailed.html" }));
}

app.use(astroSSR);

app.use(express.static(path.join(process.cwd(), "static")));
app.use(express.static(path.join(process.cwd(), "build")));
app.use("/uv/", express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/libcurl/", express.static(libcurlPath));
app.use("/baremux/", express.static(baremuxPath));
app.use("/baremod/", express.static(bareModulePath));

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use((req, res, next) => {
  if (req.url.includes("/games/")) {
    res.header("Cross-Origin-Opener-Policy", "same-origin");
    res.header("Cross-Origin-Embedder-Policy", "require-corp");
  }
  next();
});
app.use("/custom-favicon", async (req, res) => {
  try {
    const { url } = req.query;
    const response = await fetch(`https://www.google.com/s2/favicons?domain=${url}&sz=128`);
    const buffer = new Buffer.from(await response.arrayBuffer());
    res.set("Content-Type", "image/png");
    res.send(buffer);
  } catch {
    res.sendStatus(500);
  }
});

app.use("/blocklist", async (req, res) => {
  try {
    const { url } = req.query;
    const response = await fetch(url).then((r) => r.text());
    res.set("Content-Type", "text/plain");
    res.send(response);
  } catch {
    res.sendStatus(500);
  }
});

app.use("/", express.static("dist/client/"));
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(process.cwd(), "dist/client/favicon.svg"));
});
app.get("/robots.txt", (req, res) => {
  if (req.headers.host && whiteListedDomains.includes(req.headers.host)) {
    res.sendFile(path.join(process.cwd(), "dist/client/robots-allow.txt"));
  } else {
    res.sendFile(path.join(process.cwd(), "dist/client/robots-deny.txt"));
  }
});
app.get("/search", async (req, res) => {
  try {
    const { query } = req.query;

    const response = await fetch(`http://api.duckduckgo.com/ac?q=${query}&format=json`).then((apiRes) => apiRes.json());

    res.send(response);
  } catch (err) {
    res.redirect(302, "/404.html");
  }
});
app.get("*", (req, res) => {
  res.redirect(302, "/404");
});

const server = createServer();
server.on("request", (req, res) => {
  app(req, res);
});

server.on("upgrade", (req, socket, head) => {
  if (req.url.endsWith("/wisp/")) {
    wisp.routeRequest(req, socket, head);
  } else {
    socket.end();
  }
});

log("Starting Pyrus...");
success("Pyrus started successfully!");
server.on("listening", () => {
  success(`Server running at http://localhost:${PORT}/.`);
});

server.listen({
  port: PORT,
});
