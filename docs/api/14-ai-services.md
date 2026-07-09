# 14. AI Services

## POST /api/ai/moderate

Moderate user-generated content.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Request Body:**
```json
{
  "content": "Check this message for violations",
  "context": "chat"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "flagged": false,
    "categories": [],
    "confidence": 0.98,
    "action": "allow"
  }
}
```

---

## POST /api/ai/translate

Translate text to a target language.

**Auth:** Bearer  
**Rate Limit:** 20 requests / min / user  
**Permissions:** Member

**Request Body:**
```json
{
  "content": "Hello, is anyone monitoring this frequency?",
  "target_lang": "es"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "translated": "Hola, ¿alguien está monitoreando esta frecuencia?",
    "source_lang": "en",
    "target_lang": "es"
  }
}
```

---

## POST /api/ai/assist

Get AI assistance with a prompt.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member

**Request Body:**
```json
{
  "prompt": "What's the best antenna height for GMRS in flat terrain?",
  "context": "GMRS technical question",
  "add_web_context": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "response": "For GMRS in flat terrain, a minimum antenna height of 20 feet...",
    "model_used": "gemini_3_flash",
    "sources": ["https://..."]
  }
}
```

---

## POST /api/ai/summarize

Summarize long content.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member

**Request Body:**
```json
{
  "content": "Long text content to summarize...",
  "max_length": 200
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": "Concise summary of the content...",
    "original_length": 1500,
    "summary_length": 180
  }
}
```

---

## POST /api/ai/chat

AI chat assistant.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member

**Request Body:**
```json
{
  "message": "Help me set up my GMRS radio",
  "conversation_id": "ai_conv_abc123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "response": "I'd be happy to help you set up your GMRS radio. First, let's...",
    "conversation_id": "ai_conv_abc123"
  }
}
``