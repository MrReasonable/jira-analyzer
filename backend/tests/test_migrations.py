import pytest
from unittest.mock import Mock, patch, call
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from app.core.migrations import init_db, run_migrations

@pytest.fixture
def mock_db():
    """Create mock database instance"""
    db = Mock()
    db.session = Mock()
    db.session.execute = Mock()
    db.session.commit = Mock()
    db.session.rollback = Mock()
    return db

def test_init_db_success(mock_db):
    """Test successful database initialization"""
    init_db(mock_db)
    
    # Verify migrations table creation
    mock_db.session.execute.assert_called_once()
    mock_db.session.commit.assert_called_once()
    mock_db.session.rollback.assert_not_called()
    
    # Verify SQL contains CREATE TABLE
    sql = mock_db.session.execute.call_args[0][0].text
    assert 'CREATE TABLE IF NOT EXISTS migrations' in sql
    assert 'id INTEGER PRIMARY KEY' in sql
    assert 'name TEXT NOT NULL UNIQUE' in sql
    assert 'applied_at TIMESTAMP' in sql

def test_init_db_error(mock_db):
    """Test database initialization error"""
    mock_db.session.execute.side_effect = SQLAlchemyError("Database error")
    
    with pytest.raises(SQLAlchemyError):
        init_db(mock_db)
    
    mock_db.session.rollback.assert_called_once()

@patch('app.core.migrations.logger')
def test_init_db_error_logging(mock_logger, mock_db):
    """Test error logging during initialization"""
    mock_db.session.execute.side_effect = SQLAlchemyError("Database error")
    
    with pytest.raises(SQLAlchemyError):
        init_db(mock_db)
    
    mock_logger.error.assert_called_once()
    assert "Error creating migrations table" in mock_logger.error.call_args[0][0]

def test_run_migrations_success(mock_db):
    """Test successful migration execution"""
    # Mock no existing migrations
    mock_db.session.execute.return_value.fetchone.return_value = None
    
    run_migrations(mock_db)
    
    # Verify migrations were checked and applied
    assert mock_db.session.execute.call_count > 0
    assert mock_db.session.commit.call_count > 0
    mock_db.session.rollback.assert_not_called()

def test_run_migrations_already_applied(mock_db):
    """Test handling of already applied migrations"""
    # Mock all migrations as already applied
    mock_db.session.execute.return_value.fetchone.return_value = {'id': 1}
    
    run_migrations(mock_db)
    
    # Verify no new migrations were applied
    assert mock_db.session.commit.call_count == 0
    mock_db.session.rollback.assert_not_called()

def test_run_migrations_partial_failure(mock_db):
    """Test handling of partial migration failure"""
    # Mock first migration as not applied, second as failed
    mock_db.session.execute.return_value.fetchone.side_effect = [
        None,  # First migration not applied
        SQLAlchemyError("Migration error")  # Second migration fails
    ]
    
    with pytest.raises(SQLAlchemyError):
        run_migrations(mock_db)
    
    mock_db.session.rollback.assert_called_once()

def test_run_migrations_duplicate_column(mock_db):
    """Test handling of duplicate column errors"""
    # Mock migration not applied but column already exists
    mock_db.session.execute.return_value.fetchone.return_value = None
    mock_db.session.execute.side_effect = [
        None,  # Check migration
        SQLAlchemyError("duplicate column name"),  # Add column fails
        None,  # Record migration
    ]
    
    # Should not raise exception for duplicate column
    run_migrations(mock_db)
    
    mock_db.session.commit.assert_called_once()
    mock_db.session.rollback.assert_not_called()

@patch('app.core.migrations.logger')
def test_migration_logging(mock_logger, mock_db):
    """Test migration logging"""
    # Mock migration not yet applied
    mock_db.session.execute.return_value.fetchone.return_value = None
    
    run_migrations(mock_db)
    
    # Verify logging calls
    assert any("Applying migration" in call.args[0] for call in mock_logger.info.call_args_list)
    assert any("Migration applied successfully" in call.args[0] for call in mock_logger.info.call_args_list)

def test_migration_order(mock_db):
    """Test migration execution order"""
    # Track executed SQL statements
    executed_sql = []
    def mock_execute(sql, *args, **kwargs):
        if isinstance(sql, text):
            executed_sql.append(sql.text)
        return Mock(fetchone=Mock(return_value=None))
    
    mock_db.session.execute.side_effect = mock_execute
    
    run_migrations(mock_db)
    
    # Verify migrations were executed in order
    sql_statements = [sql for sql in executed_sql if 'ALTER TABLE' in sql]
    assert any('project_key' in sql for sql in sql_statements[:3])  # First migration
    assert any('filter_id' in sql for sql in sql_statements[3:7])   # Second migration
    assert any('active_statuses' in sql for sql in sql_statements[7:8])  # Third migration
    assert any('flow_efficiency_method' in sql for sql in sql_statements[8:])  # Fourth migration

def test_migration_transaction_handling(mock_db):
    """Test migration transaction handling"""
    # Mock successful first migration but failed second
    def mock_execute(sql, *args, **kwargs):
        if 'project_key' in str(sql):  # First migration
            return Mock(fetchone=Mock(return_value=None))
        else:  # Second migration
            raise SQLAlchemyError("Migration error")
    
    mock_db.session.execute.side_effect = mock_execute
    
    with pytest.raises(SQLAlchemyError):
        run_migrations(mock_db)
    
    # Verify transaction was rolled back
    mock_db.session.rollback.assert_called_once()

def test_migration_idempotency(mock_db):
    """Test migration idempotency"""
    # Run migrations twice
    run_migrations(mock_db)
    run_migrations(mock_db)
    
    # Verify each migration was only recorded once
    insert_calls = [
        call for call in mock_db.session.execute.call_args_list
        if 'INSERT INTO migrations' in str(call)
    ]
    assert len(insert_calls) <= len([
        m for m in run_migrations.__globals__['migrations']
        if mock_db.session.execute.return_value.fetchone.return_value is None
    ])

def test_migration_table_structure(mock_db):
    """Test migrations table structure"""
    init_db(mock_db)
    
    create_table_sql = mock_db.session.execute.call_args[0][0].text
    
    # Verify required columns
    assert 'id INTEGER PRIMARY KEY AUTOINCREMENT' in create_table_sql
    assert 'name TEXT NOT NULL UNIQUE' in create_table_sql
    assert 'applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' in create_table_sql

def test_migration_error_details(mock_db):
    """Test detailed error handling"""
    # Mock specific database errors
    errors = [
        SQLAlchemyError("Constraint violation"),
        SQLAlchemyError("Invalid SQL syntax"),
        SQLAlchemyError("Connection error")
    ]
    
    mock_db.session.execute.side_effect = errors
    
    for error in errors:
        with pytest.raises(SQLAlchemyError) as exc_info:
            init_db(mock_db)
        assert str(error) in str(exc_info.value)
        mock_db.session.rollback.assert_called()
        mock_db.session.rollback.reset_mock()
