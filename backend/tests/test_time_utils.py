import pytest
from datetime import datetime, timezone, timedelta
from app.utils.time_utils import JQLParser, get_date_range, build_analysis_jql
from app.core.models import TimeRange

@pytest.fixture
def sample_datetime():
    """Create sample datetime"""
    return datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)

def test_jql_parser_basic():
    """Test basic JQL parsing"""
    query = 'project = TEST AND status = "In Progress"'
    parser = JQLParser(query)
    
    assert parser.original_query == query
    assert len(parser.conditions) == 1
    assert parser.order_by == ''

def test_jql_parser_with_order_by():
    """Test JQL parsing with ORDER BY clause"""
    query = 'project = TEST ORDER BY created DESC'
    parser = JQLParser(query)
    
    assert 'project = TEST' in parser.conditions[0]
    assert 'ORDER BY created DESC' in parser.order_by.upper()

def test_jql_parser_date_patterns():
    """Test date pattern recognition"""
    query = 'created >= "2024-01-01" AND updated <= "2024-12-31"'
    parser = JQLParser(query)
    
    assert 'created' in parser.existing_date_fields
    assert 'updated' in parser.existing_date_fields

def test_jql_parser_nested_conditions():
    """Test parsing nested conditions"""
    query = '(project = TEST AND status = "Done") OR priority = High'
    parser = JQLParser(query)
    
    assert len(parser.conditions) == 1
    assert parser.conditions[0].startswith('(')
    assert parser.conditions[0].endswith(')')

def test_completion_filter_lead_time(sample_datetime):
    """Test completion filter for lead time analysis"""
    parser = JQLParser('project = TEST')
    time_range = TimeRange(
        start_date=sample_datetime,
        end_date=sample_datetime + timedelta(days=1)
    )
    
    parser.add_completion_filter(
        done_statuses=["Done"],
        lead_time_only=True,
        time_range=time_range
    )
    
    query = parser.build_query()
    assert 'status WAS "Done"' in query
    assert 'status CHANGED TO "Done"' in query
    assert sample_datetime.strftime("%Y-%m-%d") in query

def test_completion_filter_cfd(sample_datetime):
    """Test completion filter for CFD analysis"""
    parser = JQLParser('project = TEST')
    time_range = TimeRange(
        start_date=sample_datetime,
        end_date=sample_datetime + timedelta(days=1)
    )
    
    parser.add_completion_filter(
        done_statuses=["Done"],
        lead_time_only=False,
        time_range=time_range
    )
    
    query = parser.build_query()
    assert 'created <=' in query
    assert 'status changed DURING' in query

def test_date_range_addition(sample_datetime):
    """Test adding date range conditions"""
    parser = JQLParser('project = TEST')
    time_range = TimeRange(
        start_date=sample_datetime,
        end_date=sample_datetime + timedelta(days=1)
    )
    
    parser.add_date_range(time_range)
    query = parser.build_query()
    
    assert 'updated >=' in query
    assert 'updated <=' in query
    assert 'status changed' in query
    assert 'created' in query

def test_get_date_range_explicit():
    """Test date range calculation with explicit dates"""
    start = datetime(2024, 1, 1, tzinfo=timezone.utc)
    end = datetime(2024, 1, 2, tzinfo=timezone.utc)
    time_range = TimeRange(start_date=start, end_date=end)
    
    result_start, result_end = get_date_range(time_range)
    
    assert result_start.hour == 0
    assert result_start.minute == 0
    assert result_end.hour == 23
    assert result_end.minute == 59

def test_get_date_range_preset():
    """Test date range calculation with presets"""
    presets = {
        'two_weeks': 14,
        'quarter': 90,
        'half_year': 180,
        'year': 365
    }
    
    for preset, days in presets.items():
        time_range = TimeRange(preset=preset)
        start, end = get_date_range(time_range)
        
        assert (end - start).days == days
        assert start.hour == 0
        assert end.hour == 23

def test_get_date_range_invalid_preset():
    """Test date range with invalid preset"""
    time_range = TimeRange(preset='invalid')
    start, end = get_date_range(time_range)
    
    assert start is None
    assert end is None

def test_build_analysis_jql():
    """Test complete JQL query building"""
    base_query = 'project = TEST'
    time_range = TimeRange(preset='two_weeks')
    done_statuses = ['Done', 'Closed']
    
    # Test lead time query
    lead_time_query = build_analysis_jql(
        base_query,
        time_range,
        done_statuses,
        lead_time_only=True
    )
    assert 'project = TEST' in lead_time_query
    assert 'status WAS' in lead_time_query
    
    # Test CFD query
    cfd_query = build_analysis_jql(
        base_query,
        time_range,
        done_statuses,
        lead_time_only=False
    )
    assert 'project = TEST' in cfd_query
    assert 'created <=' in cfd_query

def test_jql_parser_whitespace_handling():
    """Test handling of whitespace in queries"""
    queries = [
        'project=TEST',
        'project = TEST',
        'project  =  TEST',
        ' project = TEST ',
        'project = TEST  ORDER BY created'
    ]
    
    for query in queries:
        parser = JQLParser(query)
        result = parser.build_query()
        assert 'project' in result
        assert 'TEST' in result

def test_jql_parser_complex_conditions():
    """Test parsing of complex JQL conditions"""
    query = '''
        project = TEST AND
        (status = "In Progress" OR status = "Review") AND
        priority in (High, Medium) AND
        labels is not EMPTY
        ORDER BY created DESC
    '''
    
    parser = JQLParser(query)
    result = parser.build_query()
    
    assert 'project = TEST' in result
    assert 'status = "In Progress"' in result
    assert 'status = "Review"' in result
    assert 'priority in' in result
    assert 'ORDER BY created DESC' in result.upper()

def test_timezone_handling(sample_datetime):
    """Test timezone handling in date ranges"""
    # Create time range with different timezone
    est_tz = timezone(timedelta(hours=-5))
    start = sample_datetime.astimezone(est_tz)
    end = (sample_datetime + timedelta(days=1)).astimezone(est_tz)
    
    time_range = TimeRange(start_date=start, end_date=end)
    result_start, result_end = get_date_range(time_range)
    
    # Results should be in UTC
    assert result_start.tzinfo == timezone.utc
    assert result_end.tzinfo == timezone.utc
    assert (result_end - result_start).days == 1

def test_jql_parser_date_formats():
    """Test handling of different date formats in JQL"""
    date_queries = [
        'created >= "2024-01-01"',
        'created >= 2024-01-01',
        "updated <= '2024-12-31'",
        'resolved = 2024-01-15'
    ]
    
    for query in date_queries:
        parser = JQLParser(query)
        assert len(parser.existing_date_fields) == 1
        assert any(field in query.lower() for field in parser.existing_date_fields)

def test_empty_query_handling():
    """Test handling of empty queries"""
    parser = JQLParser('')
    time_range = TimeRange(preset='two_weeks')
    
    parser.add_date_range(time_range)
    parser.add_completion_filter(['Done'], False, time_range)
    
    result = parser.build_query()
    assert result  # Should still generate valid date conditions
