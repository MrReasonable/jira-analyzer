from flask import Flask
from flask_cors import CORS
from app.core.models import db
from app.core.config import get_config
from app.utils.logging import setup_logging
from app.core.migrations import init_db, run_migrations
from app.utils.json_encoder import NumpyJSONProvider
import os
import logging

def create_app(env=None):
    """Application factory function.
    
    Args:
        env: Environment name ('development' or 'production')
    """
    env = env or os.getenv('FLASK_ENV', 'development')
    
    # Setup logging first
    setup_logging(level="DEBUG" if env == "development" else "INFO")
    
    # Get logger for app initialization
    logger = logging.getLogger('app')
    logger.info(f"Initializing app in {env} environment")
    
    # Initialize Flask app
    app = Flask(__name__)
    app.env = env
    
    # Setup CORS and custom JSON provider
    logger.info("Setting up CORS and JSON provider")
    CORS(app)
    app.json = NumpyJSONProvider(app)
    
    # Load configuration
    logger.info("Loading application configuration")
    config = get_config()
    app.config.from_object(config)
    
    # Configure SQLAlchemy
    logger.info("Configuring database")
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize SQLAlchemy
    logger.info("Initializing database connection")
    db.init_app(app)
    
    # Create database tables and run migrations
    logger.info("Setting up database schema and running migrations")
    with app.app_context():
        db.create_all()
        init_db(db)
        run_migrations(db)
    
    # Import and register blueprints
    logger.info("Registering API blueprints")
    from app.api.routes import api
    from app.api.config_routes import config_api
    from app.api.workflow_routes import workflow_api
    
    app.register_blueprint(api, url_prefix='/api')
    app.register_blueprint(config_api, url_prefix='/api')
    app.register_blueprint(workflow_api, url_prefix='/api/workflow')
    
    logger.info("Application initialization complete")
    
    return app
