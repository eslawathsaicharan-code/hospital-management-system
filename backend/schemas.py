from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WardBase(BaseModel):
    name:str
    ward_type:str

class WardCreate(WardBase):
    pass

class WardUpdate(BaseModel):
    name:Optional[str]=None
    ward_type:Optional[str]=None    

class WardOut(WardBase):
    id:int
    class Config:
        from_attributes=True

class BedBase(BaseModel):
    ward_id:int
    bed_number:str
    is_occupied:bool=False

class BedCreate(BedBase):
    pass

class BedUpdate(BaseModel):
    ward_id:Optional[str]=None
    bed_number:Optional[str]=None
    is_occupied:Optional[bool]=False
        
class BedOut(BedBase):
    id:int
    class Config:
        from_attributes=True

class PatientBase(BaseModel):
    name:str
    age:int
    diagnosis:str
    esi_level:int
    required_ward_type:str

class PatientCreate(PatientBase):
    pass

class PatientOut(PatientBase):
    id:int
    arrival_time:datetime

class AllocationOut(BaseModel):
    id:int
    patient_id:int
    bed_id:int
    allocated_at:datetime
    discharged_at:Optional[datetime]=None
    status:str
    class Config:
        from_attributes=True

class DischargeEstimate(BaseModel):
    diagnosis: str
    average_stay_hours: float
    sample_size: int

class PartnerHospitalOut(BaseModel):
    name: str
    distance_km: float
    available_beds: int
    ward_type: str
    class Config:
        from_attributes = True

class ActiveAllocationOut(BaseModel):
    allocation_id: int
    allocated_at: datetime
    patient_id: int
    patient_name: str
    esi_level: int
    diagnosis: str
    bed_id: int
    bed_number: str
    ward_name: str
    expected_stay_hours: float | None = None
    sample_size: int = 0