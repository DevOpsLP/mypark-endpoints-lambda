# Gateway Service Lambda

## Overview
This Lambda service manages gateways, their assignments, and events/commands.

- Register gateways  
- Assign gateways to lots/sections  
- Query lots with sections  
- Send/receive gateway events and commands  

## Authentication
Security schemes per OpenAPI:

- **RegisterAuth** — Bearer token required for `/gateway/register` (env: `REGISTER_TOKEN`).  
- **GatewayAuth** — Bearer token required for all gateway event endpoints (env: `GATEWAY_TOKEN`).  

### Headers
- `Authorization: Bearer <token>`
  - For commands/events use: `Authorization: Bearer <GATEWAY_TOKEN>`

---

## Supported Event Types

* `update_status`
* `cmd_let_me_in`
* `cmd_admin_arm_down`
* `cmd_admin_arm_up`
* `cmd_report_all`
* `cmd_ota_update`
* `cmd_unit_removal`
---


## Endpoints

### `POST /gateway/register`
Register a new gateway.  
**Auth**: RegisterAuth (Bearer `REGISTER_TOKEN`)

**Request**
```json
{
  "gateway_id": "IMSI123456",
  "hardware_version": "v1.0",
  "firmware_version": "1.0.0",
  "sim_imsi": "SIM12345"
}
```

**Response**

```json
{
  "message": "gateway registered",
  "gateway": { ... }
}
```

---

### `POST /gateway/assign`

Assign a gateway to a lot/section.

**Request**

```json
{
  "gateway_id": "IMSI123456",
  "section_id": "section_a"
}
```

**Response**

```json
{ "message": "gateway assigned" }
```

---

### `GET /lots`

Get lots and sections.

**Query params**

* `q` (optional): filter string.

**Response**

```json
[
  {
    "lot_id": 2,
    "lot_name": "Main Lot",
    "sections": [...]
  }
]
```

---

## API Docs

- OpenAPI: `/openapi.yaml`
- Interactive Docs: `/docs`

## Event Endpoints (GatewayAuth)

Each endpoint expects a JSON body with an `event_type`, optional `payload`, and optional `timestamp`.

Must include the header:

```http
Authorization: Bearer <GATEWAY_TOKEN>
```

### `POST /gateway/{gateway_id}/events/update-status`
Send an `update_status` event.

```json
{
  "event_type": "update_status",
  "payload": { "status": "active" },
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### `POST /gateway/{gateway_id}/events/let-me-in`
Shortcut for `cmd_let_me_in`.

```json
{
  "event_type": "cmd_let_me_in",
  "payload": {},
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### `POST /gateway/{gateway_id}/events/admin-arm-down`
Send `cmd_admin_arm_down`.

```json
{
  "event_type": "cmd_admin_arm_down",
  "payload": {},
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### `POST /gateway/{gateway_id}/events/admin-arm-up`
Send `cmd_admin_arm_up`.

```json
{
  "event_type": "cmd_admin_arm_up",
  "payload": {},
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### `POST /gateway/{gateway_id}/events/report-all`
Send `cmd_report_all`.

```json
{
  "event_type": "cmd_report_all",
  "payload": {},
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### `POST /gateway/{gateway_id}/events/ota-update`
Send `cmd_ota_update` with firmware URL.

```json
{
  "event_type": "cmd_ota_update",
  "payload": { "url": "https://example.com/firmware/v1.2.3.bin" },
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### `POST /gateway/{gateway_id}/events/unit-removal/address`
Remove unit by address.

```json
{
  "event_type": "cmd_unit_removal",
  "payload": { "unit_address": "1234" },
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### `POST /gateway/{gateway_id}/events/unit-removal/mac`
Remove unit by MAC.

```json
{
  "event_type": "cmd_unit_removal",
  "payload": { "unit_mac": "00:11:22:33:44:55" },
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### `POST /gateway/{gateway_id}/events/unit-removal/all`
Remove all units.

```json
{
  "event_type": "cmd_unit_removal",
  "payload": {},
  "timestamp": "2025-01-15T10:00:00Z"
}
```

**Response (all event endpoints)**

```json
{
  "message": "event accepted",
  "event": { }
}
```

---
