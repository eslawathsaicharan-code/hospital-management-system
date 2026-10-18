import math
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models as models
import schemas as schemas
from sqlalchemy import exists, extract, func

app = FastAPI()

import os
from fastapi.middleware.cors import CORSMiddleware

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- WARDS ----------

@app.get("/wards", response_model=list[schemas.WardOut])
def get_wards(db: Session = Depends(get_db)):
    return db.query(models.Ward).all()


@app.get("/wards/{ward_id}", response_model=schemas.WardOut)
def get_ward(ward_id: int, db: Session = Depends(get_db)):
    ward = db.query(models.Ward).filter(models.Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
    return ward


@app.post("/wards", response_model=schemas.WardOut)
def create_ward(ward: schemas.WardCreate, db: Session = Depends(get_db)):
    new_ward = models.Ward(**ward.dict())
    db.add(new_ward)
    db.commit()
    db.refresh(new_ward)
    return new_ward


@app.put("/wards/{ward_id}", response_model=schemas.WardOut)
def update_ward(ward_id: int, updated: schemas.WardUpdate, db: Session = Depends(get_db)):
    ward = db.query(models.Ward).filter(models.Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
    ward.name = updated.name
    ward.ward_type = updated.ward_type
    db.commit()
    db.refresh(ward)
    return ward


@app.delete("/wards/{ward_id}")
def delete_ward(ward_id: int, db: Session = Depends(get_db)):
    ward = db.query(models.Ward).filter(models.Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
    db.delete(ward)
    db.commit()
    return {"detail": "Ward deleted"}


# ---------- BEDS ----------

@app.get("/beds", response_model=list[schemas.BedOut])
def get_beds(db: Session = Depends(get_db)):
    return db.query(models.Bed).all()


@app.get("/beds/{bed_id}", response_model=schemas.BedOut)
def get_bed(bed_id: int, db: Session = Depends(get_db)):
    bed = db.query(models.Bed).filter(models.Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    return bed


@app.post("/beds", response_model=schemas.BedOut)
def create_bed(bed: schemas.BedCreate, db: Session = Depends(get_db)):
    new_bed = models.Bed(**bed.dict())
    db.add(new_bed)
    db.commit()
    db.refresh(new_bed)
    return new_bed


@app.put("/beds/{bed_id}", response_model=schemas.BedOut)
def update_bed(bed_id: int, updated: schemas.BedUpdate, db: Session = Depends(get_db)):
    bed = db.query(models.Bed).filter(models.Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    if updated.bed_number is not None:
        bed.bed_number = updated.bed_number
    if updated.is_occupied is not None:
        bed.is_occupied = updated.is_occupied
    db.commit()
    db.refresh(bed)
    return bed


@app.delete("/beds/{bed_id}")
def delete_bed(bed_id: int, db: Session = Depends(get_db)):
    bed = db.query(models.Bed).filter(models.Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    db.delete(bed)
    db.commit()
    return {"detail": "Bed deleted"}


# ---------- PATIENTS ----------

@app.get("/patients", response_model=list[schemas.PatientOut])
def get_patients(db: Session = Depends(get_db)):
    return db.query(models.Patient).all()


@app.get("/patients/{patient_id}", response_model=schemas.PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@app.post("/patients", response_model=schemas.PatientOut)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    if not (1 <= patient.esi_level <= 5):
        raise HTTPException(status_code=400, detail="esi_level must be between 1 and 5")
    new_patient = models.Patient(**patient.dict())
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient


@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    return {"detail": "Patient deleted"}


# ---------- ALLOCATION ----------

@app.post("/allocate/{patient_id}", response_model=schemas.AllocationOut)
def allocate_bed(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    existing = db.query(models.Allocation).filter(
        models.Allocation.patient_id == patient_id,
        models.Allocation.status == "active"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Patient already has an active bed allocation")

    available_bed = (
        db.query(models.Bed)
        .join(models.Ward, models.Bed.ward_id == models.Ward.id)
        .filter(
            models.Ward.ward_type.ilike(patient.required_ward_type),
            models.Bed.is_occupied == False
        )
        .first()
    )
    if not available_bed:
        raise HTTPException(status_code=404, detail="No available bed for this ward type")

    new_allocation = models.Allocation(
        patient_id=patient.id,
        bed_id=available_bed.id,
        status="active"
    )
    db.add(new_allocation)
    available_bed.is_occupied = True

    db.commit()
    db.refresh(new_allocation)
    return new_allocation


@app.put("/discharge/{allocation_id}", response_model=schemas.AllocationOut)
def discharge_patient(allocation_id: int, db: Session = Depends(get_db)):
    allocation = db.query(models.Allocation).filter(
        models.Allocation.id == allocation_id,
        models.Allocation.status == "active"
    ).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Active allocation not found")

    allocation.discharged_at = datetime.now(timezone.utc)
    allocation.status = "discharged"

    bed = db.query(models.Bed).filter(models.Bed.id == allocation.bed_id).first()
    bed.is_occupied = False

    db.commit()
    db.refresh(allocation)
    return allocation


# ---------- DISCHARGE PREDICTION ----------

@app.get("/predict/discharge/{diagnosis}", response_model=schemas.DischargeEstimate)
def predict_discharge(diagnosis: str, db: Session = Depends(get_db)):
    results = (
        db.query(models.Allocation, models.Patient)
        .join(models.Patient, models.Allocation.patient_id == models.Patient.id)
        .filter(
            models.Patient.diagnosis.ilike(diagnosis),
            models.Allocation.status == "discharged"
        )
        .all()
    )
    if not results:
        raise HTTPException(status_code=404, detail="No completed stays found for this diagnosis")

    durations = []
    for allocation, patient in results:
        duration = (allocation.discharged_at - allocation.allocated_at).total_seconds() / 3600
        durations.append(duration)

    average_hours = sum(durations) / len(durations)

    return schemas.DischargeEstimate(
        diagnosis=diagnosis,
        average_stay_hours=round(average_hours, 2),
        sample_size=len(durations)
    )


# ---------- OVERFLOW ROUTING ----------

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@app.get("/overflow/{ward_type}", response_model=list[schemas.PartnerHospitalOut])
def find_overflow_hospitals(ward_type: str, my_lat: float, my_lon: float, db: Session = Depends(get_db)):
    hospitals = db.query(models.PartnerHospital).filter(
        models.PartnerHospital.ward_type.ilike(ward_type),
        models.PartnerHospital.available_beds > 0
    ).all()
    if not hospitals:
        raise HTTPException(status_code=404, detail="No partner hospitals with available beds for this ward type")

    results = []
    for h in hospitals:
        dist = haversine(my_lat, my_lon, h.latitude, h.longitude)
        results.append(schemas.PartnerHospitalOut(
            name=h.name,
            distance_km=round(dist, 2),
            available_beds=h.available_beds,
            ward_type=h.ward_type
        ))

    results.sort(key=lambda x: x.distance_km)
    return results


@app.get("/queue", response_model=list[schemas.PatientOut])
def get_queue(db: Session = Depends(get_db)):
    has_allocation = exists().where(
        models.Allocation.patient_id == models.Patient.id
    )

    return (
        db.query(models.Patient)
        .filter(~has_allocation)
        .order_by(
            models.Patient.esi_level.asc(),
            models.Patient.arrival_time.asc()
        )
        .all()
    )

@app.get("/allocations/active", response_model=list[schemas.ActiveAllocationOut])
def get_active_allocations(db: Session = Depends(get_db)):
    # One query: average completed stay (in hours) for every diagnosis
    stay_rows = (
        db.query(
            func.lower(models.Patient.diagnosis).label("dx"),
            func.avg(
                extract("epoch", models.Allocation.discharged_at - models.Allocation.allocated_at)
            ).label("avg_seconds"),
            func.count().label("n"),
        )
        .select_from(models.Allocation)
        .join(models.Patient, models.Allocation.patient_id == models.Patient.id)
        .filter(
            models.Allocation.status == "discharged",
            models.Allocation.discharged_at.isnot(None),
        )
        .group_by(func.lower(models.Patient.diagnosis))
        .all()
    )
    stats = {r.dx: (float(r.avg_seconds) / 3600, r.n) for r in stay_rows}

    rows = (
        db.query(models.Allocation, models.Patient, models.Bed, models.Ward)
        .join(models.Patient, models.Allocation.patient_id == models.Patient.id)
        .join(models.Bed, models.Allocation.bed_id == models.Bed.id)
        .join(models.Ward, models.Bed.ward_id == models.Ward.id)
        .filter(models.Allocation.status == "active")
        .order_by(models.Patient.esi_level.asc(), models.Allocation.allocated_at.asc())
        .all()
    )

    result = []
    for a, p, b, w in rows:
        avg_hours, n = stats.get((p.diagnosis or "").lower(), (None, 0))
        result.append(
            schemas.ActiveAllocationOut(
                allocation_id=a.id,
                allocated_at=a.allocated_at,
                patient_id=p.id,
                patient_name=p.name,
                esi_level=p.esi_level,
                diagnosis=p.diagnosis,
                bed_id=b.id,
                bed_number=b.bed_number,
                ward_name=w.name,
                expected_stay_hours=round(avg_hours, 1) if avg_hours is not None else None,
                sample_size=n,
            )
        )
    return result