# Royal Water Villa Home Assistant Add-on

Royal Water Villa is a tablet-first luxury smart-home control UI for Home Assistant OS.

The add-on serves the production React/Vite app locally on port `3000` and proxies Home Assistant API calls server-side, so the Home Assistant token is never exposed to the browser.

## Add-on Contents

```text
royal_water_villa/
  config.yaml
  Dockerfile
  run.sh
  package.json
  package-lock.json
  index.html
  vite.config.ts
  tsconfig*.json
  tailwind.config.ts
  postcss.config.js
  public/
  server/
  src/
```

## Configuration

In the add-on configuration screen, set:

```yaml
HOME_ASSISTANT_BASE_URL: http://homeassistant.local:8123
HOME_ASSISTANT_TOKEN: your-long-lived-access-token
```

Create the token in Home Assistant:

1. Open your Home Assistant user profile.
2. Scroll to **Long-lived access tokens**.
3. Create a token for `Royal Water Villa`.
4. Paste it into the add-on option `HOME_ASSISTANT_TOKEN`.

The token is read by `run.sh` from `/data/options.json`, exported only inside the container, and used only by the Node server.

## Install On Home Assistant OS

1. Copy this project folder to your Home Assistant add-ons directory:

   ```text
   /addons/royal_water_villa
   ```

   If using Samba, the path usually appears as:

   ```text
   \\homeassistant\addons\royal_water_villa
   ```

2. In Home Assistant, open:

   ```text
   Settings > Add-ons > Add-on Store
   ```

3. Open the menu and choose:

   ```text
   Repositories > Reload
   ```

   If needed, restart Home Assistant Supervisor or reload local add-ons.

4. Find **Royal Water Villa** under local add-ons.

5. Open the add-on, set the configuration values, then click **Install**.

6. Enable:

   ```text
   Start on boot
   Watchdog
   Auto update
   ```

7. Start the add-on.

## Open From Tablet

Use the Home Assistant host IP:

```text
http://HOME_ASSISTANT_IP:3000
```

Example:

```text
http://192.168.1.50:3000
```

The app listens on `0.0.0.0:3000`, so it is reachable from tablets on the same local network.

## Update Later

1. Stop the add-on.
2. Replace the files in:

   ```text
   /addons/royal_water_villa
   ```

3. Bump `version` in `config.yaml`.
4. Rebuild or reinstall the add-on from Home Assistant.
5. Start the add-on again.

## Architecture

- Frontend: production Vite build in `dist/`.
- Runtime server: `server/addon-server.mjs`.
- Port: `3000`.
- Binding: `0.0.0.0`.
- Docker build:
  - build stage: `node:20-alpine`, `npm ci`, `npm run build`
  - runtime stage: `node:20-alpine`, static app plus server-side API bridge
- API proxy:
  - `GET /api/home-assistant/states`
  - `POST /api/home-assistant/toggle`
  - `POST /api/home-assistant/turn-on`
  - `POST /api/home-assistant/turn-off`

The browser only calls same-origin `/api/home-assistant/*`. The add-on server injects the Home Assistant token server-side.

`build.yaml` is intentionally not used. The Dockerfile pins the official `node:20-alpine` image directly so Home Assistant Supervisor cannot substitute a base image without `npm` during the frontend build stage.

## Raspberry Pi ARM64

The add-on supports `aarch64`, `amd64`, and `armv7`. Raspberry Pi 4/5 running Home Assistant OS 64-bit uses `aarch64`.
