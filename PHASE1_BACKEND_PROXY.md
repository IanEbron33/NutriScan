# Phase 1: Golang Gemini AI Proxy (Hosted on Hugging Face Spaces Docker) Specification (`PHASE1_BACKEND_PROXY.md`)

## 1. Purpose & Architecture
Build a lightweight Golang HTTP proxy server containerized for **Hugging Face Spaces (Docker SDK)**. The proxy acts as a secure, stateless bridge forwarding image scan requests from the React Native app to the **Gemini 3.5 Flash** Vision API and returning structured food analysis JSON.

Includes a **Server-Side Image Compression Safety Net** (decoding & ensuring images do not exceed 1080p bounds before sending to Gemini).

```
┌─────────────────────────────────┐             ┌─────────────────────────────────────────┐             ┌─────────────────────┐
│  Mobile App                     │             │  Golang Proxy Server                    │             │                     │
│  - Camera / Gallery Capture     │── Photo ───►│  (Hosted on Hugging Face Docker Space)  │── Prompt ──►│ Gemini 3.5 Flash    │
│  - 1080p Compression (Client)   │◄── JSON ────│  - 1080p Safety Net & Gemini Proxy      │◄── JSON ────│ (Google Vision AI)  │
└─────────────────────────────────┘             └─────────────────────────────────────────┘             └─────────────────────┘
```

---

## 2. Directory & Container Structure
```
server/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── config/
│   │   └── config.go
│   ├── handlers/
│   │   └── analyze.go
│   ├── models/
│   │   └── nutrition.go
│   └── services/
│       ├── gemini.go
│       └── image_optimizer.go
├── .env.example
├── Dockerfile
├── README.md              (Hugging Face Space Metadata header)
├── go.mod
└── go.sum
```

---

## 3. Data Models (`models/nutrition.go`)
```go
package models

type FoodItem struct {
	Name           string                 `json:"name"`
	Category       string                 `json:"category"`
	EstimatedGrams float64                `json:"estimated_grams"`
	Calories       float64                `json:"calories"`
	ProteinG       float64                `json:"protein_g"`
	CarbsG         float64                `json:"carbs_g"`
	FatG           float64                `json:"fat_g"`
	Micros         map[string]interface{} `json:"micros"`
}

type AnalysisResponse struct {
	DishName        string     `json:"dish_name"`
	ConfidenceScore float64    `json:"confidence_score"`
	Items           []FoodItem `json:"items"`
	TotalCalories   float64    `json:"total_calories"`
	TotalProtein    float64    `json:"total_protein"`
	TotalCarbs      float64    `json:"total_carbs"`
	TotalFat        float64    `json:"total_fat"`
	MicrosSummary   struct {
		VitaminC string `json:"vitamin_c"`
		Iron     string `json:"iron"`
		Calcium  string `json:"calcium"`
	} `json:"micros_summary"`
}
```

---

## 4. Gemini 3.5 Flash Service (`services/gemini.go`)
* **API Connection**: Integrates Google Generative AI SDK using `GEMINI_API_KEY`.
* **Vision Prompt Strategy**:
  * Input: Image (Base64/JPEG) + Prompt enforcing strict JSON response.
  * Instructions: Identify dish name, individual food items, estimated weight (grams), macronutrients (calories, protein, carbs, fat), and key micronutrients (vitamin_c, iron, calcium).

---

## 5. Server-Side Image Optimization (`services/image_optimizer.go`)
* **Safety Net**: Validates image dimensions on arrival. If width > 1920px, resizes to 1080p using `golang.org/x/image/draw` or `disintegration/imaging` before querying Gemini.

---

## 6. Hugging Face Spaces Docker Setup

### `README.md` (Hugging Face Spaces Header)
```yaml
---
title: NutriScan Gemini Proxy
emoji: 🥗
colorFrom: orange
colorTo: red
sdk: docker
app_port: 7860
---
```

### `Dockerfile`
```dockerfile
# Build Stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/api

# Run Stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/server .

ENV PORT=7860
EXPOSE 7860

CMD ["./server"]
```

---

## 7. Verification Steps
1. Set `GEMINI_API_KEY` in `.env`.
2. Build and run container locally or deploy to Hugging Face Docker Space.
3. Verify 1080p image payload processing speed (< 2 seconds end-to-end response time).
