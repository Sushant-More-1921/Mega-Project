
from fastapi import FastAPI
from app.api.routes.complaint import router as complaint_router
from app.api.routes.analyze import router as analyze_router
from app.api.routes.similar import router as similar_router
from app.api.routes.hotspot import router as hotspot_router
app = FastAPI(
    title="CivicResolve AI Service",
    description="AI service for civic complaint classification and prioritization",
    version="1.0.0"
)

app.include_router(complaint_router)
app.include_router(analyze_router)
app.include_router(similar_router)
app.include_router(hotspot_router)


@app.get("/")
def root():
    return {
        "message": "CivicResolve AI Service is running"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }

