from datetime import datetime, timedelta,timezone
from database import SessionLocal
import models as models

db = SessionLocal()

# --- Step 1: Create a ward (skip if you already have one) ---
ward = db.query(models.Ward).filter(models.Ward.ward_type == "General").first()
if not ward:
    ward = models.Ward(name="General Ward A", ward_type="General")
    db.add(ward)
    db.commit()
    db.refresh(ward)

# --- Step 2: Create enough beds for our test patients ---
existing_beds = db.query(models.Bed).filter(models.Bed.ward_id == ward.id).count()
beds_needed = 4
for i in range(existing_beds, existing_beds + beds_needed):
    bed = models.Bed(ward_id=ward.id, bed_number=f"G-{i+1}", is_occupied=False)
    db.add(bed)
db.commit()

# --- Step 3: Create patients with the SAME diagnosis, for prediction testing ---
patients_data = [
    {"name": "Test Patient 1", "age": 30, "diagnosis": "Fracture", "esi_level": 3, "required_ward_type": "General"},
    {"name": "Test Patient 2", "age": 45, "diagnosis": "Fracture", "esi_level": 3, "required_ward_type": "General"},
    {"name": "Test Patient 3", "age": 25, "diagnosis": "Fracture", "esi_level": 2, "required_ward_type": "General"},
    {"name": "Test Patient 4", "age": 60, "diagnosis": "Fracture", "esi_level": 3, "required_ward_type": "General"},
]

patients = []
for p in patients_data:
    patient = models.Patient(**p)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    patients.append(patient)

# --- Step 4: Allocate each patient to a free bed, then discharge with a FAKE staggered duration ---
free_beds = db.query(models.Bed).filter(
    models.Bed.ward_id == ward.id,
    models.Bed.is_occupied == False
).limit(len(patients)).all()

stay_hours = [12, 18, 24, 15]  # fake different stay lengths, in hours

for patient, bed, hours in zip(patients, free_beds, stay_hours):
    allocated_time = datetime.now(timezone.utc) - timedelta(hours=hours)  # pretend it started `hours` ago
    discharged_time = datetime.now(timezone.utc)

    allocation = models.Allocation(
        patient_id=patient.id,
        bed_id=bed.id,
        allocated_at=allocated_time,
        discharged_at=discharged_time,
        status="discharged"
    )
    bed.is_occupied = False  # already discharged, so bed stays free
    db.add(allocation)

db.commit()
db.close()

print("Seed data created: 4 'Fracture' patients with completed stays (12, 18, 24, 15 hours).")