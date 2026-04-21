from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sistema Triaje Pediátrico"
    VERSION: str = "1.0.0"

    DATABASE_URL: str = "postgresql://triaje_user:triaje_pass@db:5432/triaje_db"

    SECRET_KEY: str = "changeme-super-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas turno clinico

    class Config:
        env_file = ".env"


settings = Settings()
