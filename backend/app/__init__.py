from flask import Flask
from flask_cors import CORS
from app.core.models import db
from app.core.config import get_config
from app.utils.logging import setup_logging
from app.core.migrations import init_db, run_migrations
from app.utils.json_encoder import NumpyJSONProvider
import os

def create_app(config_name=None):
    """Application factory function."""
    # Initialize Flask app
    app = Flask(__name__)
    
    # Setup CORS and custom JSON provider
    CORS(app)
    app.json = NumpyJSONProvider(app)
    
    # Load configuration
    config = get_config()
    app.config.from_object(config)
    
    # Configure SQLAlchemy
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize SQLAlchemy
    db.init_app(app)
    
    # Create database tables and run migrations
    with app.app_context():
        db.create_all()
        init_db(db)
        run_migrations(db)
    
    # Import and register blueprints
    from app.api.routes import api
    from app.api.config_routes import config_api
    from app.api.workflow_routes import workflow_api
    
    app.register_blueprint(api, url_prefix='/api')
    app.register_blueprint(config_api, url_prefix='/api')
    app.register_blueprint(workflow_api, url_prefix='/api/workflow')
    
    # Setup logging
    setup_logging(
        level="DEBUG" if app.debug else "INFO",
    )
    
    return app
