# 17. Real-Time (WebSocket)

Real-time updates are delivered via Base44 entity subscriptions. The client subscribes to entity change events and receives push notifications instantly.

## Subscription Events

| Entity | Event Types | Payload |
|---|---|---|
| `ChatMessage` | `create`, `update`, `delete` | Full message object |
| `ChatPresence` | `create`, `update`, `delete` | Presence object |
| `Notification` | `create`, `update` | Notification object |
| `EmergencyAlert` | `create`, `update` | Alert object |
| `LocationShare` | `create`, `update`, `delete` | Location share object |
| `Event` | `create`, `update`, `delete` | Event object |

## Event Payload Format

```json
{
  "id": "evt_abc123",
  "type": "create",
  "entity_name": "ChatMessage",
  "data": {
    "id": "msg_abc123",
    "conversation_id": "conv_abc123",
    "sender_id": "usr_abc123",
    "content": "Hello!",
    "created_date": "2026-07-09T14:30:00Z"
  }
}
```

## Client Subscription Example

```javascript
const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
  if (event.type === "create") {
    // Handle new message
  }
});
```

## Connection Management

- Subscriptions auto-reconnect on network loss
- Debounce subscription callbacks (800ms) to prevent API floods during high-activity periods
- Clean up subscriptions on component unmount to prevent memory leaks