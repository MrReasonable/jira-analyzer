import pytest
import numpy as np
import json
from app.utils.json_encoder import NumpyJSONProvider

@pytest.fixture
def encoder():
    """Create JSON encoder instance"""
    return NumpyJSONProvider()

def test_numpy_integer_conversion(encoder):
    """Test conversion of numpy integer types"""
    # Test different numpy integer types
    integer_types = [
        np.int8(42),
        np.int16(42),
        np.int32(42),
        np.int64(42),
        np.uint8(42),
        np.uint16(42),
        np.uint32(42),
        np.uint64(42)
    ]
    
    for value in integer_types:
        result = encoder._convert_numpy(value)
        assert isinstance(result, int)
        assert result == 42

def test_numpy_float_conversion(encoder):
    """Test conversion of numpy float types"""
    # Test different numpy float types
    float_types = [
        np.float32(3.14),
        np.float64(3.14)
    ]
    
    for value in float_types:
        result = encoder._convert_numpy(value)
        assert isinstance(result, float)
        assert pytest.approx(result, 3.14)

def test_numpy_array_conversion(encoder):
    """Test conversion of numpy arrays"""
    # 1D array
    array_1d = np.array([1, 2, 3])
    result_1d = encoder._convert_numpy(array_1d)
    assert isinstance(result_1d, list)
    assert result_1d == [1, 2, 3]
    
    # 2D array
    array_2d = np.array([[1, 2], [3, 4]])
    result_2d = encoder._convert_numpy(array_2d)
    assert isinstance(result_2d, list)
    assert result_2d == [[1, 2], [3, 4]]
    
    # Array with mixed types
    array_mixed = np.array([1, 2.5, 3])
    result_mixed = encoder._convert_numpy(array_mixed)
    assert isinstance(result_mixed, list)
    assert all(isinstance(x, (int, float)) for x in result_mixed)

def test_nested_structure_conversion(encoder):
    """Test conversion of nested structures"""
    # Dictionary with numpy values
    data = {
        'integer': np.int32(42),
        'float': np.float32(3.14),
        'array': np.array([1, 2, 3]),
        'nested': {
            'value': np.int64(100)
        }
    }
    
    result = encoder._convert_numpy(data)
    assert isinstance(result['integer'], int)
    assert isinstance(result['float'], float)
    assert isinstance(result['array'], list)
    assert isinstance(result['nested']['value'], int)

def test_list_conversion(encoder):
    """Test conversion of lists containing numpy values"""
    data = [
        np.int32(1),
        np.float32(2.0),
        np.array([3, 4, 5]),
        {'value': np.int64(6)}
    ]
    
    result = encoder._convert_numpy(data)
    assert isinstance(result[0], int)
    assert isinstance(result[1], float)
    assert isinstance(result[2], list)
    assert isinstance(result[3]['value'], int)

def test_dumps_with_numpy(encoder):
    """Test JSON serialization with numpy types"""
    data = {
        'integer': np.int32(42),
        'float': np.float32(3.14),
        'array': np.array([1, 2, 3])
    }
    
    json_str = encoder.dumps(data)
    parsed = json.loads(json_str)
    
    assert parsed['integer'] == 42
    assert pytest.approx(parsed['float'], 3.14)
    assert parsed['array'] == [1, 2, 3]

def test_loads_basic(encoder):
    """Test JSON deserialization"""
    json_str = '{"value": 42, "array": [1, 2, 3]}'
    result = encoder.loads(json_str)
    
    assert result['value'] == 42
    assert result['array'] == [1, 2, 3]

def test_non_numpy_types(encoder):
    """Test handling of non-numpy types"""
    data = {
        'string': 'test',
        'int': 42,
        'float': 3.14,
        'list': [1, 2, 3],
        'dict': {'key': 'value'},
        'bool': True,
        'none': None
    }
    
    result = encoder._convert_numpy(data)
    assert result == data  # Should remain unchanged

def test_empty_structures(encoder):
    """Test handling of empty structures"""
    # Empty array
    assert encoder._convert_numpy(np.array([])) == []
    
    # Empty dict
    assert encoder._convert_numpy({}) == {}
    
    # Empty list
    assert encoder._convert_numpy([]) == []

def test_complex_nested_structure(encoder):
    """Test conversion of complex nested structures"""
    data = {
        'level1': {
            'array': np.array([1, 2, 3]),
            'level2': {
                'value': np.int32(42),
                'list': [
                    np.float32(1.0),
                    {
                        'nested': np.int64(100)
                    }
                ]
            }
        }
    }
    
    result = encoder._convert_numpy(data)
    assert isinstance(result['level1']['array'], list)
    assert isinstance(result['level1']['level2']['value'], int)
    assert isinstance(result['level1']['level2']['list'][0], float)
    assert isinstance(result['level1']['level2']['list'][1]['nested'], int)

def test_json_serialization_roundtrip(encoder):
    """Test complete JSON serialization roundtrip"""
    original = {
        'integer': np.int32(42),
        'float': np.float32(3.14),
        'array': np.array([1, 2, 3]),
        'nested': {
            'value': np.int64(100)
        }
    }
    
    # Serialize
    json_str = encoder.dumps(original)
    
    # Deserialize
    result = encoder.loads(json_str)
    
    # Verify
    assert result['integer'] == 42
    assert pytest.approx(result['float'], 3.14)
    assert result['array'] == [1, 2, 3]
    assert result['nested']['value'] == 100

def test_invalid_json(encoder):
    """Test handling of invalid JSON"""
    with pytest.raises(json.JSONDecodeError):
        encoder.loads('invalid json')

def test_numpy_array_with_nan(encoder):
    """Test handling of numpy arrays with NaN values"""
    array = np.array([1.0, np.nan, 3.0])
    result = encoder._convert_numpy(array)
    
    assert isinstance(result, list)
    assert result[0] == 1.0
    assert np.isnan(result[1])
    assert result[2] == 3.0

def test_numpy_array_with_inf(encoder):
    """Test handling of numpy arrays with infinite values"""
    array = np.array([1.0, np.inf, -np.inf])
    result = encoder._convert_numpy(array)
    
    assert isinstance(result, list)
    assert result[0] == 1.0
    assert result[1] == float('inf')
    assert result[2] == float('-inf')

def test_datetime_timezone_handling(encoder):
    """Test datetime serialization with different timezones"""
    from datetime import datetime, timezone, timedelta
    
    # UTC datetime
    utc_time = datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)
    utc_result = json.loads(encoder.dumps({"time": utc_time}))
    assert utc_result["time"].endswith('Z')
    
    # EST datetime (-5 hours)
    est_tz = timezone(timedelta(hours=-5))
    est_time = datetime(2024, 1, 1, 7, 0, tzinfo=est_tz)
    est_result = json.loads(encoder.dumps({"time": est_time}))
    # Should be converted to 12:00Z (same moment in time)
    assert est_result["time"] == utc_result["time"]
    
    # Naive datetime (should be rejected)
    naive_time = datetime(2024, 1, 1, 12, 0)
    with pytest.raises(Exception):
        encoder.dumps({"time": naive_time})

def test_workflow_config_serialization(encoder):
    """Test serialization of WorkflowConfig objects"""
    from app.core.models import WorkflowConfig
    
    config = WorkflowConfig(
        all_statuses=["To Do", "In Progress", "Done"],
        suggested_flow=["To Do", "In Progress", "Done"],
        initial_statuses=["To Do"],
        final_statuses=["Done"],
        transitions={"To Do": ["In Progress"], "In Progress": ["Done"]}
    )
    
    json_str = encoder.dumps(config)
    result = json.loads(json_str)
    
    assert isinstance(result, dict)
    assert result["all_statuses"] == ["To Do", "In Progress", "Done"]
    assert result["suggested_flow"] == ["To Do", "In Progress", "Done"]
    assert result["initial_statuses"] == ["To Do"]
    assert result["final_statuses"] == ["Done"]
    assert result["transitions"] == {"To Do": ["In Progress"], "In Progress": ["Done"]}

def test_status_change_serialization(encoder):
    """Test serialization of StatusChange objects"""
    from app.core.models import StatusChange
    from datetime import datetime, timezone
    
    timestamp = datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)
    change = StatusChange("To Do", "In Progress", timestamp)
    
    json_str = encoder.dumps(change)
    result = json.loads(json_str)
    
    assert isinstance(result, dict)
    assert result["from_status"] == "To Do"
    assert result["to_status"] == "In Progress"
    assert "timestamp" in result
    # Verify timestamp is serialized in ISO format
    datetime.fromisoformat(result["timestamp"].replace('Z', '+00:00'))

def test_issue_data_serialization(encoder):
    """Test serialization of IssueData objects"""
    from app.core.models import IssueData, StatusChange
    from datetime import datetime, timezone
    
    timestamp = datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)
    issue = IssueData(
        key="TEST-1",
        summary="Test Issue",
        current_status="Done",
        created_date=timestamp,
        cycle_times={"In Progress": 1.0},
        total_cycle_time=2.0,
        transitions=[
            StatusChange("To Do", "In Progress", timestamp),
            StatusChange("In Progress", "Done", timestamp)
        ],
        time_spent=3600,
        original_estimate=7200
    )
    
    json_str = encoder.dumps(issue)
    result = json.loads(json_str)
    
    assert isinstance(result, dict)
    assert result["key"] == "TEST-1"
    assert result["summary"] == "Test Issue"
    assert result["current_status"] == "Done"
    assert isinstance(result["cycle_times"], dict)
    assert isinstance(result["transitions"], list)
    assert len(result["transitions"]) == 2
    assert isinstance(result["time_spent"], int)
    assert isinstance(result["original_estimate"], int)
    # Verify timestamps are serialized in ISO format
    datetime.fromisoformat(result["created_date"].replace('Z', '+00:00'))

def test_epic_data_serialization(encoder):
    """Test serialization of EpicData objects"""
    from app.core.models import EpicData
    from datetime import datetime, timezone
    
    timestamp = datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)
    epic = EpicData(
        key="EPIC-1",
        summary="Test Epic",
        children=["TEST-1", "TEST-2"],
        start_time=timestamp,
        end_time=timestamp,
        lead_time=5.0
    )
    
    json_str = encoder.dumps(epic)
    result = json.loads(json_str)
    
    assert isinstance(result, dict)
    assert result["key"] == "EPIC-1"
    assert result["summary"] == "Test Epic"
    assert result["children"] == ["TEST-1", "TEST-2"]
    assert isinstance(result["lead_time"], float)
    # Verify timestamps are serialized in ISO format
    datetime.fromisoformat(result["start_time"].replace('Z', '+00:00'))
    datetime.fromisoformat(result["end_time"].replace('Z', '+00:00'))
