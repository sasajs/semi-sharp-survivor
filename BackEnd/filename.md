cd ~/Projects/SemiSharp/Documentation

cat > SAMPLE_API_RESPONSES.md <<'EOF'
# SemiSharp Sample API Responses

Purpose:

This document provides example JSON responses for Google AI Studio frontend development.

The frontend should render these responses and should not implement backend logic.

---

# Health

Endpoint:

GET /health

Example:

```json
{
  "status": "ok"
