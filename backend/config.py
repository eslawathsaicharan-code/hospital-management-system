from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL:str
    frontend_url: str = "http://localhost:5173"
    class Config:
        env_file=".env"

settings=Settings()