import json
import os
from typing import Any, Dict

from fastapi import FastAPI
from mangum import Mangum

# Import your existing FastAPI app
import sys
sys.path.append('/opt/python')
sys.path.append(os.path.join(os.path.dirname(__file__), '../../backend'))

from app.main import app as fastapi_app

# Create the Lambda handler using Mangum
handler = Mangum(fastapi_app, lifespan="off")

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda entry point for FastAPI application
    """
    return handler(event, context)