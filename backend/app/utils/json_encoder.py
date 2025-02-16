from flask.json.provider import JSONProvider
import json
import numpy as np
import logging

logger = logging.getLogger(__name__)

class NumpyJSONProvider(JSONProvider):
    def _convert_numpy(self, obj):
        """Convert numpy types to Python types"""
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, dict):
            return {key: self._convert_numpy(value) for key, value in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [self._convert_numpy(item) for item in obj]
        return obj

    def dumps(self, obj, **kwargs):
        """Override dumps to handle numpy types"""
        # First convert all numpy types to Python types
        converted = self._convert_numpy(obj)
        # Then use standard JSON serialization
        return json.dumps(converted, **kwargs)

    def loads(self, s, **kwargs):
        """Override loads to handle JSON deserialization"""
        return json.loads(s, **kwargs)
