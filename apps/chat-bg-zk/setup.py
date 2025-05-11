from setuptools import setup, find_packages

setup(
    name="chatbg",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi==0.104.1",
        "uvicorn==0.24.0",
        "sqlalchemy==2.0.23",
        "pydantic==2.4.2",
        "python-jose[cryptography]==3.3.0",
        "passlib[bcrypt]==1.7.4",
        "python-multipart==0.0.6",
        "aiofiles==23.2.1",
        "email-validator==2.1.0.post1",
        "pytest==7.4.3",
        "pytest-asyncio==0.21.1",
        "httpx==0.25.2",
        "pytest-mock==3.11.1"
    ],
    python_requires=">=3.10"
)
