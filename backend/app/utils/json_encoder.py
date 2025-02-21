from flask.json.provider import JSONProvider
import json
import numpy as np
import logging

logger = logging.getLogger(__name__)

class NumpyJSONProvider(JSONProvider):
    def _convert_numpy(self, obj):
        """Convert numpy types and custom objects to JSON-serializable Python types"""
        from dataclasses import asdict, is_dataclass
        from datetime import datetime, timezone
        from unittest.mock import Mock
        
        if isinstance(obj, Mock):
            # Handle Mock objects by extracting only their return_value
            # Avoid recursion by not converting the return_value if it's another Mock
            if hasattr(obj, 'return_value'):
                return obj.return_value if not isinstance(obj.return_value, Mock) else None
            return None
        elif isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, dict):
            return {key: self._convert_numpy(value) for key, value in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [self._convert_numpy(item) for item in obj]
        if is_dataclass(obj):
            # Convert dataclass to dict and recursively convert its values
            return self._convert_numpy(asdict(obj))
        if isinstance(obj, datetime):
            # Ensure datetime has timezone information
            if obj.tzinfo is None:
                raise ValueError("Datetime objects must have timezone information")
            # Convert to UTC and format with Z suffix
            utc_time = obj.astimezone(timezone.utc)
            return utc_time.isoformat().replace('+00:00', 'Z')
        return obj

    def dumps(self, obj, **kwargs):
        """Override dumps to handle numpy types and custom objects"""
        try:
            # First convert all special types to JSON-serializable Python types
            converted = self._convert_numpy(obj)
            # Then use standard JSON serialization
            return json.dumps(converted, **kwargs)
        except ValueError as e:
            logger.error(f"Validation error during serialization: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error serializing object: {str(e)}")
            raise

    def loads(self, s, **kwargs):
        """Override loads to handle JSON deserialization"""
        return json.loads(s, **kwargs)
