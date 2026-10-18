from database import SessionLocal
import models as models

db = SessionLocal()

hospitals = [
    {"name": "City Care Hospital", "latitude": 17.3850, "longitude": 78.4867, "available_beds": 5, "ward_type": "General"},
    {"name": "Apollo Extension", "latitude": 17.4400, "longitude": 78.4983, "available_beds": 3, "ward_type": "General"},
    {"name": "Sunrise Medical Center", "latitude": 17.3616, "longitude": 78.4747, "available_beds": 0, "ward_type": "General"},
]

for h in hospitals:
    db.add(models.PartnerHospital(**h))

db.commit()
db.close()
print("Partner hospitals seeded.")