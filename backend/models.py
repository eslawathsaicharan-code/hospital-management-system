from sqlalchemy import Column,Integer,String,Boolean,TIMESTAMP,ForeignKey,CheckConstraint,Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Ward(Base):
    __tablename__="wards"
    id=Column(Integer,primary_key=True)
    name=Column(String,nullable=False)
    ward_type=Column(String,nullable=False)
    beds=relationship("Bed",back_populates="ward")

class Bed(Base):
    __tablename__="beds"
    id=Column(Integer,primary_key=True)
    ward_id=Column(Integer,ForeignKey("wards.id",ondelete="CASCADE"))
    bed_number=Column(String,nullable=False)
    is_occupied = Column(Boolean, default=False)
    ward = relationship("Ward", back_populates="beds")

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer)
    diagnosis = Column(String(200))
    esi_level = Column(Integer, CheckConstraint("esi_level BETWEEN 1 AND 5"))
    required_ward_type = Column(String(50))
    arrival_time = Column(TIMESTAMP, server_default=func.now())

class Allocation(Base):
    __tablename__ = "allocations"
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    bed_id = Column(Integer, ForeignKey("beds.id"))
    allocated_at = Column(TIMESTAMP, server_default=func.now())
    discharged_at = Column(TIMESTAMP, nullable=True)
    status = Column(String(20), default="active")

class PartnerHospital(Base):
    __tablename__ = "partner_hospitals"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    available_beds = Column(Integer, default=0)
    ward_type = Column(String(50), nullable=False)