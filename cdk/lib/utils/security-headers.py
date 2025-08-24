"""
Security Headers Utility for Lambda Functions

This file provides security headers configuration for FastAPI Lambda functions.
Copy this to your backend/app/core/middleware.py or similar location.

Usage in FastAPI:
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    from fastapi import FastAPI, Request, Response

    app = FastAPI()
    
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers.update(get_security_headers())
        return response
"""

def get_security_headers() -> dict[str, str]:
    """
    Get security headers for HTTP responses
    
    Returns:
        dict: Security headers to add to all HTTP responses
    """
    return {
        # Prevent clickjacking attacks
        "X-Frame-Options": "DENY",
        
        # Prevent MIME type sniffing
        "X-Content-Type-Options": "nosniff",
        
        # Enable XSS protection in browsers
        "X-XSS-Protection": "1; mode=block",
        
        # Enforce HTTPS (only in production)
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        
        # Content Security Policy - restrictive default
        "Content-Security-Policy": (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        ),
        
        # Referrer policy
        "Referrer-Policy": "strict-origin-when-cross-origin",
        
        # Feature policy (permissions policy)
        "Permissions-Policy": (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=(), "
            "bluetooth=(), "
            "accelerometer=(), "
            "gyroscope=(), "
            "magnetometer=()"
        ),
        
        # Cache control for sensitive data
        "Cache-Control": "no-cache, no-store, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0",
    }


def get_cors_headers(allowed_origins: list[str]) -> dict[str, str]:
    """
    Get CORS headers for the response
    
    Args:
        allowed_origins: List of allowed origins
        
    Returns:
        dict: CORS headers
    """
    # Never use wildcard in production
    if "*" in allowed_origins:
        raise ValueError("Wildcard origins (*) are not allowed for security")
    
    return {
        "Access-Control-Allow-Origin": ",".join(allowed_origins),
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": (
            "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token"
        ),
        "Access-Control-Max-Age": "86400",  # 24 hours
    }


def sanitize_error_response(error_message: str, include_details: bool = False) -> str:
    """
    Sanitize error messages to prevent information disclosure
    
    Args:
        error_message: The original error message
        include_details: Whether to include detailed error info (only in development)
        
    Returns:
        str: Sanitized error message
    """
    if include_details:
        return error_message
    
    # Generic error messages for production
    generic_errors = {
        "authentication": "Authentication failed",
        "authorization": "Access denied",
        "validation": "Invalid input provided",
        "server": "Internal server error",
        "rate_limit": "Too many requests",
    }
    
    # Map common error patterns to generic messages
    error_lower = error_message.lower()
    
    if any(word in error_lower for word in ["auth", "token", "credential"]):
        return generic_errors["authentication"]
    elif any(word in error_lower for word in ["permission", "access", "forbidden"]):
        return generic_errors["authorization"]
    elif any(word in error_lower for word in ["validation", "invalid", "bad request"]):
        return generic_errors["validation"]
    elif any(word in error_lower for word in ["rate", "throttle", "limit"]):
        return generic_errors["rate_limit"]
    else:
        return generic_errors["server"]


# FastAPI Middleware Example
"""
Add this to your FastAPI app:

from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.sessions import SessionMiddleware
import secrets

app = FastAPI()

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["yourdomain.com", "localhost", "127.0.0.1"]
)

# Add session middleware with secure settings
app.add_middleware(
    SessionMiddleware,
    secret_key=secrets.token_urlsafe(32),
    max_age=3600,  # 1 hour
    same_site="strict",
    https_only=True  # Only in production
)

@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    
    # Add security headers
    security_headers = get_security_headers()
    for header, value in security_headers.items():
        response.headers[header] = value
    
    return response
"""